import os
from flask import Flask, request, jsonify, send_file, Response, stream_with_context
import requests
import anthropic
from models import User, ses, Check
from sqlalchemy import and_, or_

app = Flask(__name__, static_url_path="", static_folder="reciprocity_frontend/build")

# Global dictionary to store chunks for each user session
import threading
import uuid
user_chunks = {}  # {session_id: {'chunks': [...], 'done': False, 'error': None}}
chunks_lock = threading.Lock()

# Initialize Anthropic client
try:
    with open("/Users/buck/anthropic_key.txt", "r") as f:
        anthropic_api_key = f.read().strip()
except FileNotFoundError:
    anthropic_api_key = os.getenv("ANTHROPIC_API_KEY", "")

anthropic_client = anthropic.Anthropic(api_key=anthropic_api_key)


def get_current_user(access_token):
    me_info = requests.get(
        f"https://graph.facebook.com/v9.0/me?access_token={access_token}&fields=id,name,email"
    ).json()
    my_fb_id = me_info["id"]
    return User.find_or_create_by_fb_id(my_fb_id, me_info["name"])


def get_all_friends(access_token):
    url = f"https://graph.facebook.com/v9.0/me/friends?access_token={access_token}&fields=name,id,picture"
    friends = []

    while url:
        res = requests.get(url).json()
        friends += res["data"]
        if "paging" in res and "next" in res["paging"]:
            url = res["paging"]["next"]
        else:
            url = None
    return friends


@app.route("/api/info")
def api_info():
    access_token = request.args.get("access_token")
    me_info = requests.get(
        f"https://graph.facebook.com/v9.0/me?access_token={access_token}&fields=name,id,picture"
    ).json()
    my_fb_id = me_info["id"]
    current_user = User.find_or_create_by_fb_id(my_fb_id, me_info["name"])
    my_checks, reciprocations = current_user.get_checks()

    friends = get_all_friends(access_token)
    friend_pictures = {friend["id"]: friend["picture"] for friend in friends}

    if current_user.visibility_setting == "invisible":
        friend_objects = []
        friend_pictures = {}
    else:
        friend_filter = and_(
            User.fb_id.in_([x["id"] for x in friends]),
            User.visibility_setting != "invisible"
        )

        if current_user.visibility_setting == "everyone":
            friend_filter = or_(friend_filter, User.visibility_setting == "everyone")

        friend_objects = (
            ses.query(User)
            # .filter(User.bio.isnot(None))
            .filter(friend_filter)
            .filter(User.fb_id != my_fb_id)
            .order_by(User.id)
            .all()
        )

    return jsonify(
        [
            current_user,
            friend_objects,
            friend_pictures,
            my_checks,
            reciprocations,
            me_info["picture"]["data"]["url"],
        ]
    )


@app.route("/")
def hello_world():
    return send_file(__file__[:-6] + "reciprocity_frontend/build/index.html")


@app.route("/api/update_checks", methods=["POST"])
def api_update_checks():
    current_user = get_current_user(request.args.get("access_token"))
    current_user.update_my_checks(request.json)

    return jsonify(current_user.get_checks())


@app.route("/api/update_user", methods=["POST"])
def api_update_user():
    current_user = get_current_user(request.args.get("access_token"))
    updated_info = request.json
    if "bio" in updated_info:
        assert len(updated_info["bio"]) < 300
        current_user.bio = updated_info["bio"]
    if "phone_number" in updated_info:
        assert len(updated_info["phone_number"]) <= 20
        current_user.phone_number = updated_info["phone_number"]
    if "dating_doc_link" in updated_info:
        assert len(updated_info["dating_doc_link"]) <= 500
        current_user.dating_doc_link = updated_info["dating_doc_link"]
    if "custom_css" in updated_info:
        custom_css = updated_info["custom_css"]
        if custom_css is not None:
            assert len(custom_css) <= 20000
            current_user.custom_css = custom_css
        else:
            current_user.custom_css = None

    ses.commit()
    return jsonify(current_user)


@app.route("/api/update_visibility", methods=["POST"])
def api_update_visibility():
    current_user = get_current_user(request.args.get("access_token"))
    new_visibility = request.json["visibility"]
    current_user.visibility_setting = new_visibility

    ses.commit()
    return jsonify(current_user)


@app.route("/api/delete_user", methods=["POST", "DELETE"])
def api_delete_user():
    print("access token:", request.args.get("access_token"))
    current_user = get_current_user(request.args.get("access_token"))

    ses.query(Check).filter(Check.from_id == current_user.id).delete()
    ses.query(Check).filter(Check.to_id == current_user.id).delete()
    ses.delete(current_user)
    return "ok"


@app.route("/api/generate_css", methods=["POST"])
def api_generate_css():
    # Validate user
    access_token = request.args.get("access_token")
    if not access_token:
        return jsonify({"error": "Access token required"}), 401
    
    try:
        current_user = get_current_user(access_token)
    except Exception as e:
        return jsonify({"error": "Invalid access token"}), 401
    
    # Get instruction parameter
    instruction = request.json.get("instruction", "")
    if not instruction:
        return jsonify({"error": "Instruction parameter required"}), 400
    
    # Read HTML file
    try:
        html_file_path = os.path.join(os.path.dirname(__file__), "example_html.html")
        with open(html_file_path, "r") as f:
            html_content = f.read()
    except FileNotFoundError:
        return jsonify({"error": "HTML template file not found"}), 500
    
    # Generate unique session ID
    session_id = str(uuid.uuid4())
    
    # Initialize session data
    with chunks_lock:
        user_chunks[session_id] = {
            'chunks': [],
            'done': False,
            'error': None
        }
    
    def generate_css_background():
        """Background function to generate CSS and store chunks"""
        try:
            # Add initial message
            with chunks_lock:
                user_chunks[session_id]['chunks'].append("Starting CSS generation...\n")
            
            with anthropic_client.messages.stream(
                max_tokens=4096,
                messages=[{
                    "role": "user", 
                    "content": f"Here's an html file. {html_content} Reply with CSS that styles it according to following instructions/vibe/idea: <instructions>{instruction}</instructions>. Try to do that within 400 lines of CSS. Be heavy handed. But be careful to ensure that the text is readable, e.g. no white on white or black on black."
                }],
                model="claude-3-5-sonnet-latest",
            ) as stream:
                for text in stream.text_stream:
                    with chunks_lock:
                        if session_id in user_chunks:  # Check if session still exists
                            user_chunks[session_id]['chunks'].append(text)
            
            # Mark as done
            with chunks_lock:
                if session_id in user_chunks:
                    user_chunks[session_id]['done'] = True
            
        except Exception as e:
            # Store error
            with chunks_lock:
                if session_id in user_chunks:
                    user_chunks[session_id]['error'] = str(e)
                    user_chunks[session_id]['done'] = True
    
    # Start background thread
    thread = threading.Thread(target=generate_css_background)
    thread.daemon = True
    thread.start()
    
    # Return session ID immediately
    return jsonify({"session_id": session_id})


@app.route("/api/poll_css/<session_id>", methods=["GET"])
def api_poll_css(session_id):
    """Poll for new CSS chunks"""
    with chunks_lock:
        if session_id not in user_chunks:
            return jsonify({"error": "Invalid session ID"}), 404
        
        # Get and flush chunks
        session_data = user_chunks[session_id]
        chunks = session_data['chunks'][:]  # Copy the list
        session_data['chunks'] = []  # Clear the chunks
        
        response_data = {
            "content": "".join(chunks),
            "done": session_data['done'],
            "error": session_data['error']
        }
        
        # Clean up completed sessions
        if session_data['done']:
            del user_chunks[session_id]
        
        return jsonify(response_data)


@app.errorhandler(500)
def internal_error(error):
    ses.rollback()


if __name__ == "__main__":
    # Threaded option to enable multiple instances for multiple user access support
    app.run(host="0.0.0.0", threaded=True, port=int(os.getenv("PORT", "5001")))
