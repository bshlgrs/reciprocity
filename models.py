import os
from collections import defaultdict
from dataclasses import dataclass
from typing import Dict, List
from sqlalchemy import create_engine, func, text, Text, Boolean, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import sessionmaker, scoped_session
from datetime import datetime, timedelta


# Fix DATABASE_URL format for compatibility with newer SQLAlchemy versions
database_url = os.getenv('DATABASE_URL')
if database_url and database_url.startswith('postgres://'):
    database_url = database_url.replace('postgres://', 'postgresql://', 1)

eng = create_engine(database_url)

Base = declarative_base()

Base.metadata.bind = eng

# scoped_session gives each thread its own underlying Session (thread-local),
# so request handlers and background threads never share one Session. The proxy
# forwards ses.query/add/commit/... to the current thread's session; callers
# don't change. Each thread MUST call ses.remove() when done (see app.py's
# teardown handler and the background-thread cleanup) to release its connection.
session_factory = sessionmaker(bind=eng, autoflush=False)
ses = scoped_session(session_factory)


@dataclass
class User(Base):
    __tablename__ = "users"
    id: int
    id = Column(Integer, primary_key=True)
    name: str
    name = Column(String)
    fb_id: str
    fb_id = Column(String)
    visibility_setting: str
    visibility_setting = Column(String)
    bio: str
    bio = Column(Text)
    phone_number: str
    phone_number = Column(String)
    dating_doc_link: str
    dating_doc_link = Column(Text)
    custom_css: str
    custom_css = Column(Text)
    private_contact_info: str
    private_contact_info = Column(Text, nullable=False, default="")
    has_logged_in_since_reboot: bool
    has_logged_in_since_reboot = Column(
        Boolean, nullable=False, default=False
    )

    @staticmethod
    def find_or_create_by_fb_id(my_fb_id, name):
        user = ses.query(User).filter(User.fb_id == my_fb_id).one_or_none()
        if user:
            return user
        else:
            new_user = User(fb_id=my_fb_id, name=name)
            ses.add(new_user)
            try:
                ses.commit()
            except Exception as e:
                ses.rollback()
                raise e
            return new_user

    def get_checks(self):
        my_checks = ses.query(Check).filter(Check.from_id == self.id).all()
        checks_at_me = {(check.from_id, check.activity) for check in
                        ses.query(Check).filter(Check.to_id == self.id).all()}
        my_checks_by_user = defaultdict(lambda: [])
        for check in my_checks:
            my_checks_by_user[check.to_id].append(check.activity)
        reciprocated_checks_by_user = defaultdict(lambda: [])
        for check in my_checks:
            if (check.to_id, check.activity) in checks_at_me:
                reciprocated_checks_by_user[check.to_id].append(check.activity)
        return my_checks_by_user, reciprocated_checks_by_user

    def update_my_checks(self, my_new_checks: Dict[str, List[str]]):
        my_checks = ses.query(Check).filter(Check.from_id == self.id).all()
        my_checks_dict = {(check.to_id, check.activity): check for check in my_checks}
        # We want to do two things: every check in my_checks that is absent from my_new_checks should be deleted

        for (to_id, activity), check in my_checks_dict.items():
            if activity not in my_new_checks.get(str(to_id), []):
                ses.delete(check)
        # and then we add a check for every new check that isn't in my_checks.
        checks_to_create = []
        for to_user_str, activities in my_new_checks.items():
            to_user = int(to_user_str)
            for activity in activities:
                if (to_user,activity) not in my_checks_dict:
                    checks_to_create.append(Check(from_id=self.id, to_id=to_user, activity=activity))
        ses.add_all(checks_to_create)
        try:
            ses.commit()
        except Exception as e:
            ses.rollback()
            raise e



class Check(Base):
    __tablename__ = 'checks'
    id = Column(Integer, primary_key=True)
    from_id = Column(Integer)
    to_id = Column(Integer)
    activity = Column(String)


@dataclass
class TaglineLog(Base):
    __tablename__ = 'tagline_logs'
    id: int
    id = Column(Integer, primary_key=True)
    timestamp: datetime
    timestamp = Column(DateTime, nullable=False, default=datetime.utcnow)
    user_id: int
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    user_name: str
    user_name = Column(String, nullable=False)
    instruction: str
    instruction = Column(Text, nullable=False)
    generated_tagline: str
    generated_tagline = Column(Text, nullable=False)


@dataclass
class CssLog(Base):
    __tablename__ = 'css_logs'
    id: int
    id = Column(Integer, primary_key=True)
    timestamp: datetime
    timestamp = Column(DateTime, nullable=False, default=datetime.utcnow)
    user_id: int
    user_id = Column(Integer, ForeignKey('users.id'), nullable=True)  # Allow anonymous users
    user_name: str
    user_name = Column(String, nullable=False)
    instruction: str
    instruction = Column(Text, nullable=False)
    generated_css: str
    generated_css = Column(Text, nullable=False)


DEFAULT_TAGLINE = "what would you do, if they wanted to too?"

# Sentinel so update(custom_css=None) can explicitly clear the CSS while an
# omitted custom_css leaves the existing value untouched.
_UNCHANGED = object()


@dataclass
class GlobalSettings(Base):
    """Single-row table holding the site-wide tagline and custom CSS.

    This table is the only copy of these values, so they survive restarts and
    all gunicorn workers agree on them. There is always exactly one row
    (id == 1); use GlobalSettings.get() to fetch or lazily create it.
    """
    __tablename__ = 'global_settings'
    id: int
    id = Column(Integer, primary_key=True)
    tagline: str
    tagline = Column(Text, nullable=False, default=DEFAULT_TAGLINE)
    custom_css: str
    custom_css = Column(Text, nullable=True)
    updated_at: datetime
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    @staticmethod
    def get():
        """Return the singleton settings row, creating it on first use."""
        settings = ses.query(GlobalSettings).filter(GlobalSettings.id == 1).one_or_none()
        if settings is None:
            settings = GlobalSettings(id=1, tagline=DEFAULT_TAGLINE, custom_css=None)
            ses.add(settings)
            try:
                ses.commit()
            except Exception as e:
                ses.rollback()
                raise e
        return settings

    @staticmethod
    def update(tagline=_UNCHANGED, custom_css=_UNCHANGED):
        """Write-through update of the singleton row.

        Only the provided fields are changed; pass a value (including "" or
        None for custom_css) to set it, or leave an argument at the sentinel
        default to leave that field untouched.
        """
        settings = GlobalSettings.get()
        if tagline is not _UNCHANGED:
            settings.tagline = tagline
        if custom_css is not _UNCHANGED:
            settings.custom_css = custom_css
        settings.updated_at = datetime.utcnow()
        try:
            ses.commit()
        except Exception as e:
            ses.rollback()
            raise e
        return settings


class CssGenerationSession(Base):
    """Output of an in-progress CSS generation, waiting to be polled.

    This lives in the DB because the background thread writing the output and
    the request polling for it can be in different gunicorn workers. A row is
    deleted once the client has polled its final state.
    """
    __tablename__ = 'css_generation_sessions'
    # A generation still unfinished after this long has died (e.g. its worker was
    # restarted). Without a limit the client would poll it forever.
    TIMEOUT = timedelta(minutes=10)
    # Rows this old were abandoned by their client, and are safe to delete.
    MAX_AGE = timedelta(hours=1)

    id = Column(String(36), primary_key=True)
    pending = Column(Text, nullable=False, default="")  # Output not yet polled
    done = Column(Boolean, nullable=False, default=False)
    error = Column(Text, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    @staticmethod
    def _commit():
        try:
            ses.commit()
        except Exception as e:
            ses.rollback()
            raise e

    @staticmethod
    def start(session_id, initial_text=""):
        """Create a session, clearing out any abandoned ones."""
        cutoff = datetime.utcnow() - CssGenerationSession.MAX_AGE
        ses.query(CssGenerationSession).filter(CssGenerationSession.created_at < cutoff).delete()
        ses.add(CssGenerationSession(id=session_id, pending=initial_text))
        CssGenerationSession._commit()

    @staticmethod
    def append(session_id, text):
        """Atomically add output, without overwriting a concurrent poll's changes."""
        ses.query(CssGenerationSession).filter(CssGenerationSession.id == session_id).update(
            {CssGenerationSession.pending: CssGenerationSession.pending + text},
            synchronize_session=False,
        )
        CssGenerationSession._commit()

    @staticmethod
    def finish(session_id, final_text="", error=None):
        """Atomically add the last output and mark the session done."""
        ses.query(CssGenerationSession).filter(CssGenerationSession.id == session_id).update(
            {
                CssGenerationSession.pending: CssGenerationSession.pending + final_text,
                CssGenerationSession.done: True,
                CssGenerationSession.error: error,
            },
            synchronize_session=False,
        )
        CssGenerationSession._commit()

    @staticmethod
    def poll(session_id):
        """Return and clear the output so far, or None if there's no such session.

        Deletes the session once its final state has been returned.
        """
        session = (
            ses.query(CssGenerationSession)
            .filter(CssGenerationSession.id == session_id)
            .populate_existing()
            .one_or_none()
        )
        if session is None:
            return None
        result = {"content": session.pending, "done": session.done, "error": session.error}
        if not session.done and datetime.utcnow() - session.created_at > CssGenerationSession.TIMEOUT:
            result["done"] = True
            result["error"] = "CSS generation timed out"
        if result["done"]:
            ses.delete(session)
        else:
            # Remove only what was read, keeping anything appended since then.
            ses.query(CssGenerationSession).filter(CssGenerationSession.id == session_id).update(
                {CssGenerationSession.pending: func.substr(CssGenerationSession.pending, len(result["content"]) + 1)},
                synchronize_session=False,
            )
        CssGenerationSession._commit()
        return result


# Create any tables that don't yet exist. This must run AFTER all model classes
# are defined, or SQLAlchemy's metadata won't know about them (create_all is
# idempotent and leaves existing tables untouched). Gunicorn workers all run this
# at boot, and without the lock they can race to create a new table, which crashes
# the loser's boot. The lock number is arbitrary.
with eng.begin() as conn:
    if eng.dialect.name == 'postgresql':
        conn.execute(text("SELECT pg_advisory_xact_lock(7203941)"))
    Base.metadata.create_all(conn)
