"""Verify the site-wide tagline + CSS, and CSS generation output, are in the DB.

Starts real gunicorn servers with two workers, because the failure this guards
against (workers disagreeing about shared state) needs multiple processes.
Other write paths run in-process with Facebook and Anthropic stubbed, so no
network access is needed.

Runs against a throwaway SQLite DB by default, so it never touches production.
Set TEST_DATABASE_URL to run against a scratch Postgres instead; the
global_settings row in that DB gets overwritten.
"""
import os, sys, socket, subprocess, tempfile, time
from collections import Counter
from concurrent.futures import ThreadPoolExecutor

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ADMIN_SECRET = "test_admin_secret"
tmpdb = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
os.environ["DATABASE_URL"] = os.getenv("TEST_DATABASE_URL") or "sqlite:///" + tmpdb.name
os.environ["ADMIN_SECRET"] = ADMIN_SECRET
os.environ["PYTHONPATH"] = os.path.join(REPO, "scripts")
sys.path[:0] = [REPO, os.path.join(REPO, "scripts")]

import requests
import app as appmod
import stubbed_app
from models import ses, User, TaglineLog, CssLog, GlobalSettings

failures = []


def check(name, cond, detail=""):
    print(("PASS  " if cond else "FAIL  ") + name + (f"  ({detail})" if detail and not cond else ""))
    if not cond:
        failures.append(name)


def start_server(app_spec="app:app"):
    """Start a two-worker gunicorn and wait until it's serving. Returns (proc, base_url)."""
    with socket.socket() as s:
        s.bind(("127.0.0.1", 0))
        port = s.getsockname()[1]
    proc = subprocess.Popen(
        [sys.executable, "-m", "gunicorn", app_spec, "--bind", f"127.0.0.1:{port}",
         "--workers", "2", "--threads", "1", "--log-level", "warning"],
        cwd=REPO, env=os.environ.copy(),
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
    )
    base = f"http://127.0.0.1:{port}"
    for _ in range(100):
        try:
            requests.get(base + "/api/get_tagline", timeout=1)
            # Give the second worker time to finish importing the app too.
            time.sleep(2)
            return proc, base
        except requests.exceptions.RequestException:
            time.sleep(0.2)
    proc.kill()
    raise RuntimeError("gunicorn did not start")


def stop_server(proc):
    proc.terminate()
    proc.wait(timeout=10)


def read_many(url, n=200):
    """Hit url concurrently so that both workers serve some of the requests."""
    def one(_):
        # A fresh connection per request lets the kernel pick either worker.
        return requests.get(url, headers={"Connection": "close"}, timeout=10).text
    with ThreadPoolExecutor(8) as pool:
        return Counter(pool.map(one, range(n)))


# --- Fixtures -----------------------------------------------------------------

user = User(fb_id=stubbed_app.TEST_FB_ID, name="Settings Tester", custom_css="my own css")
ses.add(user)
ses.commit()
uid = user.id
theme_a = TaglineLog(user_id=uid, user_name="T", instruction="a", generated_tagline="tagline A")
theme_b = TaglineLog(user_id=uid, user_name="T", instruction="b", generated_tagline="tagline B")
ses.add_all([theme_a, theme_b,
             CssLog(user_id=uid, user_name="T", instruction="a", generated_css="body{color:red}"),
             CssLog(user_id=uid, user_name="T", instruction="b", generated_css="body{color:blue}")])
ses.commit()
theme_a_id, theme_b_id = theme_a.id, theme_b.id
ses.remove()

# --- Multiple workers, and restarts -------------------------------------------

proc, base = start_server()
try:
    # Have both workers load their initial state before anything changes.
    read_many(base + "/api/get_tagline")
    for theme_id, tagline, css in [(theme_a_id, "tagline A", "body{color:red}"),
                                   (theme_b_id, "tagline B", "body{color:blue}")]:
        r = requests.post(base + "/api/set_theme",
                          json={"key": ADMIN_SECRET, "theme_id": theme_id}, timeout=10)
        check(f"set_theme returns the new tagline: {tagline}",
              r.status_code == 200 and r.json()["tagline"] == tagline, r.text[:200])
        taglines = read_many(base + "/api/get_tagline")
        check(f"both workers serve the new tagline: {tagline}", set(taglines) == {tagline}, dict(taglines))
        served_css = read_many(base + "/api/global_css.css")
        check(f"both workers serve the new CSS: {css}", set(served_css) == {css}, dict(served_css))
finally:
    stop_server(proc)

proc, base = start_server()
try:
    taglines = read_many(base + "/api/get_tagline", n=20)
    check("tagline survives a restart", set(taglines) == {"tagline B"}, dict(taglines))
    served_css = read_many(base + "/api/global_css.css", n=20)
    check("CSS survives a restart", set(served_css) == {"body{color:blue}"}, dict(served_css))
finally:
    stop_server(proc)

# CSS generation runs in a thread in one worker, and is polled through either.
proc, base = start_server("stubbed_app:app")
try:
    session_id = requests.post(base + "/api/generate_css", json={"instruction": "x"},
                               headers={"Authorization": "Bearer faketoken"}, timeout=10).json()["session_id"]
    statuses, content, polled = Counter(), "", {}
    for _ in range(400):
        r = requests.get(f"{base}/api/poll_css/{session_id}", headers={"Connection": "close"}, timeout=10)
        statuses[r.status_code] += 1
        if r.status_code == 200:
            polled = r.json()
            content += polled["content"]
            if polled["done"]:
                break
        time.sleep(0.02)
    check("every poll finds the session, whichever worker serves it", set(statuses) == {200}, dict(statuses))
    check("polling gets all the output exactly once",
          content == "Starting CSS generation...\n" + stubbed_app.GENERATED_CSS, repr(content))
    check("polling reaches done with no error", polled.get("done") is True and polled.get("error") is None, polled)
    r = requests.get(f"{base}/api/poll_css/{session_id}", timeout=10)
    check("the session is gone after its final poll", r.status_code == 404, r.status_code)
    for _ in range(100):
        served_css = read_many(base + "/api/global_css.css", n=8)
        if set(served_css) == {"body { color: purple; }"}:
            break
        time.sleep(0.1)
    check("both workers serve the generated CSS", set(served_css) == {"body { color: purple; }"}, dict(served_css))
finally:
    stop_server(proc)

# A worker that isn't told about a write must still see it.
GlobalSettings.update(tagline="written elsewhere", custom_css="body{color:green}")
ses.remove()
client = appmod.app.test_client()
check("get_tagline reads the DB", client.get("/api/get_tagline").text == "written elsewhere")
check("global_css reads the DB", client.get("/api/global_css.css").text == "body{color:green}")

# --- Other write paths, in-process with external services stubbed --------------

auth = {"Authorization": "Bearer faketoken"}

r = client.post("/api/generate_tagline", json={"instruction": "x"}, headers=auth)
check("generate_tagline returns the new tagline", r.text == "generated tagline", r.text[:200])
check("generate_tagline is persisted", client.get("/api/get_tagline").text == "generated tagline")

r = client.post("/api/update_user", json={"custom_css": "body { color: orange; }"}, headers=auth)
check("update_user succeeds", r.status_code == 200, r.text[:200])
check("update_user CSS is persisted", "orange" in client.get("/api/global_css.css").text)


def generate_css(score):
    """Run generate_css to completion; the DB write happens on a background thread."""
    appmod.get_score = lambda instruction: score
    log_count = ses.query(CssLog).count()
    ses.remove()
    r = client.post("/api/generate_css", json={"instruction": f"theme {score}"}, headers=auth)
    assert r.status_code == 200, r.text
    for _ in range(100):
        count = ses.query(CssLog).count()
        ses.remove()
        if count > log_count:
            return
        time.sleep(0.1)
    raise RuntimeError("generate_css did not finish")


generate_css(score=9)
css = client.get("/api/global_css.css").text
check("monitor-blocked CSS is not applied", "purple" not in css and "orange" in css, css)
generate_css(score=1)
check("monitor-approved CSS is persisted", "purple" in client.get("/api/global_css.css").text)

# --- CSS generation sessions --------------------------------------------------

from datetime import datetime, timedelta
from models import CssGenerationSession as Session


def poll(session_id):
    return client.get(f"/api/poll_css/{session_id}")


# A failing stream reports its error, along with the output it did manage to produce.
class FailingStream:
    def __enter__(self):
        return self

    def __exit__(self, *exc):
        return False

    @property
    def text_stream(self):
        yield "partial"
        raise RuntimeError("stream broke")


real_stream = stubbed_app.FakeMessages.stream
stubbed_app.FakeMessages.stream = lambda self, **kwargs: FailingStream()
session_id = client.post("/api/generate_css", json={"instruction": "will fail"}, headers=auth).json["session_id"]
content, polled = "", {}
for _ in range(100):
    polled = poll(session_id).json
    content += polled["content"]
    if polled["done"]:
        break
    time.sleep(0.05)
stubbed_app.FakeMessages.stream = real_stream
check("a failed generation reports its error", polled.get("error") == "stream broke", polled)
check("a failed generation keeps its partial output", content.endswith("partial"), repr(content))

# Polling while output is being written must neither lose nor repeat any of it.
import threading

pieces = [f"[{i}é]" for i in range(300)]


def write_pieces():
    for piece in pieces[:-1]:
        Session.append("stress", piece)
    Session.finish("stress", pieces[-1])
    ses.remove()


Session.start("stress")
ses.remove()
writer = threading.Thread(target=write_pieces)
writer.start()
content, polled = "", {}
while not polled.get("done"):
    polled = poll("stress").json
    content += polled["content"]
writer.join()
check("concurrent polling gets all the output exactly once", content == "".join(pieces), repr(content)[:200])

Session.start("dead")
Session.append("dead", "some output")
ses.query(Session).filter(Session.id == "dead").update({"created_at": datetime.utcnow() - Session.TIMEOUT * 1.1})
ses.commit()
ses.remove()
polled = poll("dead").json
check("a generation that died times out, rather than polling forever",
      polled == {"content": "some output", "done": True, "error": "CSS generation timed out"}, polled)
check("a timed-out session is deleted", poll("dead").status_code == 404)

Session.start("abandoned")
ses.query(Session).filter(Session.id == "abandoned").update({"created_at": datetime.utcnow() - Session.MAX_AGE * 1.1})
Session.start("recent")
ses.commit()
ses.remove()
check("starting a session clears out abandoned ones", poll("abandoned").status_code == 404)
check("starting a session keeps recent ones", poll("recent").status_code == 200)

Session.finish("not a session")
ses.remove()
check("output for a session that's gone is ignored", poll("not a session").status_code == 404)

# --- /api/info must not copy the global CSS onto the user's row ----------------

fake_fb = {"id": "settings_test_user", "name": "Settings Tester",
           "picture": {"data": {"url": "http://example.invalid/pic"}}}
appmod.safe_facebook_api_call = lambda url: fake_fb
appmod.get_all_friends = lambda token: []
ses.query(User).filter(User.id == uid).update({"custom_css": "my own css", "has_logged_in_since_reboot": False})
ses.commit()
ses.remove()

r = client.get("/api/info", headers=auth)
check("info returns the global CSS", r.status_code == 200 and "purple" in r.json[0]["custom_css"], r.text[:200])
check("info is a first login, so it commits", r.status_code == 200 and r.json[1] is True, r.text[:200])
stored_css = ses.query(User).filter(User.id == uid).one().custom_css
ses.remove()
check("info leaves the user's own CSS alone", stored_css == "my own css", stored_css)

# --- Fresh DB: the row is created lazily with the default tagline ---------------

ses.query(GlobalSettings).delete()
ses.commit()
ses.remove()
check("missing row falls back to the default tagline",
      client.get("/api/get_tagline").text == "what would you do, if they wanted to too?")

os.unlink(tmpdb.name)
print(f"\n{len(failures)} failure(s)" if failures else "\nALL PASS")
sys.exit(1 if failures else 0)
