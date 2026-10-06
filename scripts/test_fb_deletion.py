"""Tests for the Facebook data deletion callback and the shared delete helper.

Runs against a throwaway SQLite DB, so it never touches production.
"""
import os, sys, json, base64, hmac, hashlib, tempfile

SECRET = "test_app_secret_123"
tmpdb = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
os.environ["DATABASE_URL"] = "sqlite:///" + tmpdb.name
os.environ["FACEBOOK_APP_SECRET"] = SECRET
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import app as appmod
from models import ses, User, Check, TaglineLog, CssLog

client = appmod.app.test_client()
failures = []

def check(name, cond):
    print(("PASS  " if cond else "FAIL  ") + name)
    if not cond:
        failures.append(name)

def sign(payload, secret=SECRET):
    enc = base64.urlsafe_b64encode(json.dumps(payload).encode()).rstrip(b"=").decode()
    sig = hmac.new(secret.encode(), enc.encode(), hashlib.sha256).digest()
    return base64.urlsafe_b64encode(sig).rstrip(b"=").decode() + "." + enc

def make_user(fb_id, name):
    u = User(fb_id=fb_id, name=name)
    ses.add(u); ses.commit()
    ses.add_all([
        Check(from_id=u.id, to_id=999, activity="a"),
        Check(from_id=999, to_id=u.id, activity="b"),
        TaglineLog(user_id=u.id, user_name=name, instruction="i", generated_tagline="t"),
        CssLog(user_id=u.id, user_name=name, instruction="i", generated_css="c"),
    ])
    ses.commit()
    return u

def residue(uid):
    return (ses.query(Check).filter(Check.from_id == uid).count()
            + ses.query(Check).filter(Check.to_id == uid).count()
            + ses.query(TaglineLog).filter(TaglineLog.user_id == uid).count()
            + ses.query(CssLog).filter(CssLog.user_id == uid).count())

# --- happy path -------------------------------------------------------------
u = make_user("111222333", "Test Person")
uid = u.id
check("fixture created associated rows", residue(uid) == 4)
r = client.post("/api/fb_deletion_callback",
                data={"signed_request": sign({"algorithm": "HMAC-SHA256", "user_id": "111222333"})})
check("valid request -> 200", r.status_code == 200)
body = r.get_json()
check("response has confirmation_code", bool(body.get("confirmation_code")))
check("response has url", bool(body.get("url")))
ses.expire_all()
check("user row deleted", ses.query(User).filter(User.fb_id == "111222333").one_or_none() is None)
check("ALL associated rows deleted (checks + both logs)", residue(uid) == 0)

# --- signature must be enforced --------------------------------------------
v = make_user("444555666", "Victim")
vid = v.id
forged = sign({"algorithm": "HMAC-SHA256", "user_id": "444555666"}, secret="wrong_secret")
r = client.post("/api/fb_deletion_callback", data={"signed_request": forged})
check("forged signature -> 400", r.status_code == 400)
ses.expire_all()
check("forged signature did NOT delete user", ses.query(User).filter(User.fb_id == "444555666").one_or_none() is not None)
check("forged signature did NOT delete associated rows", residue(vid) == 4)

r = client.post("/api/fb_deletion_callback", data={"signed_request": "garbage"})
check("malformed -> 400", r.status_code == 400)
r = client.post("/api/fb_deletion_callback", data={})
check("missing signed_request -> 400", r.status_code == 400)

# alg swap: payload claims 'none', signature computed over payload with real secret
alg_none = sign({"algorithm": "none", "user_id": "444555666"})
r = client.post("/api/fb_deletion_callback", data={"signed_request": alg_none})
check("algorithm!=HMAC-SHA256 rejected -> 400", r.status_code == 400)
ses.expire_all()
check("alg-swap did NOT delete user", ses.query(User).filter(User.fb_id == "444555666").one_or_none() is not None)

# --- unknown user is a no-op success ---------------------------------------
r = client.post("/api/fb_deletion_callback",
                data={"signed_request": sign({"algorithm": "HMAC-SHA256", "user_id": "000nonexistent"})})
check("unknown user -> 200", r.status_code == 200)

# --- fail closed when secret unset -----------------------------------------
appmod.FACEBOOK_APP_SECRET = ""
r = client.post("/api/fb_deletion_callback",
                data={"signed_request": sign({"algorithm": "HMAC-SHA256", "user_id": "444555666"})})
check("no app secret -> 400 (fail closed)", r.status_code == 400)
ses.expire_all()
check("no app secret did NOT delete", ses.query(User).filter(User.fb_id == "444555666").one_or_none() is not None)
appmod.FACEBOOK_APP_SECRET = SECRET

# --- status page ------------------------------------------------------------
r = client.get("/api/deletion_status?code=del_123")
check("status page -> 200", r.status_code == 200)
check("status page shows code", b"del_123" in r.data)

os.unlink(tmpdb.name)
print("\n" + ("ALL PASSED" if not failures else f"{len(failures)} FAILED: {failures}"))
sys.exit(1 if failures else 0)
