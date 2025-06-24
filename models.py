import os
from collections import defaultdict
from dataclasses import dataclass
from typing import Dict, List
from sqlalchemy import create_engine, Text, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import sessionmaker


# Fix DATABASE_URL format for compatibility with newer SQLAlchemy versions
database_url = os.getenv('DATABASE_URL')
if database_url and database_url.startswith('postgres://'):
    database_url = database_url.replace('postgres://', 'postgresql://', 1)

eng = create_engine(database_url)

Base = declarative_base()

Base.metadata.bind = eng
Base.metadata.create_all()

Session = sessionmaker(bind=eng)
ses = Session(autoflush=False)


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
            ses.commit()
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
        ses.commit()



class Check(Base):
    __tablename__ = 'checks'
    id = Column(Integer, primary_key=True)
    from_id = Column(Integer)
    to_id = Column(Integer)
    activity = Column(String)
