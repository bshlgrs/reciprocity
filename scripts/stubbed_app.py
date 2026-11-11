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


class Block:
    def __init__(self, type, text=""):
        self.type = type
        self.text = text


class FakeStream:
    def __init__(self, stop_reason):
        self.stop_reason = stop_reason

        # Spread the output over ~2s, so a client polls many times along the way.
        def slowly():
            for c in GENERATED_CSS:
                time.sleep(0.06)
                yield c
        self.text_stream = slowly()

    def get_final_message(self):
        return type("Message", (), {"stop_reason": self.stop_reason})()

    def __enter__(self):
        return self

    def __exit__(self, *exc):
        return False


class FakeMessages:
    stop_reason = "end_turn"  # Tests set "refusal" to make the model decline
    calls = []  # Keyword arguments of each request, for tests to check

    def create(self, **kwargs):
        self.calls.append(kwargs)
        # Start with an (empty) thinking block, as current models can.
        return type("Resp", (), {
            "content": [Block("thinking"), Block("text", "<answer>generated tagline</answer>")],
            "stop_reason": self.stop_reason,
        })()

    def stream(self, **kwargs):
        self.calls.append(kwargs)
        return FakeStream(self.stop_reason)


fake_messages = FakeMessages()
appmod.anthropic_client = type("Client", (), {"beta": type("Beta", (), {"messages": fake_messages})()})()
appmod.get_score = lambda instruction: 1
appmod.get_current_user = lambda token: ses.query(User).filter(User.fb_id == TEST_FB_ID).one()
