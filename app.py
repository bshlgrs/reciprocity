import os
from flask import Flask, request, jsonify, send_file
import requests
from models import User, ses, Check
from sqlalchemy import and_, or_

app = Flask(__name__, static_url_path="", static_folder="reciprocity_frontend/build")


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
            User.visibility_setting != "invisible",
            User.fb_id != my_fb_id,
        )

        if current_user.visibility_setting == "everyone":
            friend_filter = or_(friend_filter, User.visibility_setting == "everyone")

        friend_objects = (
            ses.query(User)
            .filter(User.bio.isnot(None))
            .filter(friend_filter)
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


if __name__ == "__main__":
    # Threaded option to enable multiple instances for multiple user access support
    app.run(host="0.0.0.0", threaded=True, port=int(os.getenv("PORT", "5000")))
