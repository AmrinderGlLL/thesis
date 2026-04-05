from flask import Blueprint, jsonify
from flask_login import login_required, current_user

account_bp = Blueprint("account", __name__)


@account_bp.route("/me", methods=["GET"])
@login_required
def get_me():
    return jsonify(current_user.to_dict()), 200
