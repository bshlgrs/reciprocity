"""Verify the in-app delete button path also clears the log tables.

Stubs the Facebook call so no network access is needed.
"""
import os, sys, tempfile
tmpdb = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
os.environ["DATABASE_URL"] = "sqlite:///" + tmpdb.name
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import app as appmod
from models import ses, User, Check, TaglineLog, CssLog

u = User(fb_id="777888999", name="Button Tester")
ses.add(u); ses.commit()
uid = u.id
ses.add_all([
    Check(from_id=uid, to_id=42, activity="a"),
    Check(from_id=42, to_id=uid, activity="b"),
    TaglineLog(user_id=uid, user_name="Button Tester", instruction="i", generated_tagline="t"),
    CssLog(user_id=uid, user_name="Button Tester", instruction="i", generated_css="c"),
])
ses.commit()

appmod.get_current_user = lambda token: ses.query(User).filter(User.fb_id == "777888999").one()

r = appmod.app.test_client().delete("/api/delete_user", headers={"Authorization": "Bearer faketoken"})
ses.expire_all()
left = (ses.query(Check).filter(Check.from_id == uid).count()
        + ses.query(Check).filter(Check.to_id == uid).count()
        + ses.query(TaglineLog).filter(TaglineLog.user_id == uid).count()
        + ses.query(CssLog).filter(CssLog.user_id == uid).count())
gone = ses.query(User).filter(User.fb_id == "777888999").one_or_none() is None

ok = r.status_code == 200 and gone and left == 0
print(f"status={r.status_code} user_deleted={gone} residual_rows={left}")
print("PASS: delete button clears logs too" if ok else "FAIL")
os.unlink(tmpdb.name)
sys.exit(0 if ok else 1)
