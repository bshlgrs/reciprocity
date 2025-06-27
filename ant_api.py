import anthropic
import os
# Initialize Anthropic client
try:
    with open("/Users/buck/anthropic_key.txt", "r") as f:
        anthropic_api_key = f.read().strip()
except FileNotFoundError:
    anthropic_api_key = os.getenv("ANTHROPIC_API_KEY", "")

anthropic_client = anthropic.Anthropic(api_key=anthropic_api_key)
