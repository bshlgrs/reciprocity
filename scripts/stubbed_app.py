"""The real app with Facebook, Anthropic and the monitor stubbed out.

Tests can serve this with gunicorn (stubbed_app:app) to exercise real multi-worker
behavior with no network access. Every request acts as TEST_FB_ID, a user that the
test must already have created.
"""
import os, sys, time

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import app as appmod
from models import ses, User

app = appmod.app
TEST_FB_ID = "settings_test_user"
GENERATED_CSS = "```css\nbody { color: purple; }\n```"


class Text:
    def __init__(self, text):
        self.text = text


class FakeStream:
    def __init__(self):
        # Spread the output over ~2s, so a client polls many times along the way.
        def slowly():
            for c in GENERATED_CSS:
                time.sleep(0.06)
                yield c
        self.text_stream = slowly()

    def __enter__(self):
        return self

    def __exit__(self, *exc):
        return False


class FakeMessages:
    def create(self, **kwargs):
        return type("Resp", (), {"content": [Text("<answer>generated tagline</answer>")]})()

    def stream(self, **kwargs):
        return FakeStream()


appmod.anthropic_client = type("Client", (), {"messages": FakeMessages()})()
appmod.get_score = lambda instruction: 1
appmod.get_current_user = lambda token: ses.query(User).filter(User.fb_id == TEST_FB_ID).one()
