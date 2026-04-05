from flask import Blueprint, jsonify, request
from flask_login import login_required, current_user
from ..models import AppSetting

settings_bp = Blueprint("settings", __name__)


@settings_bp.route("/", methods=["GET"])
@login_required
def get_settings():
    return jsonify({
        "validation_enabled": AppSetting.get("validation_enabled", "false") == "true"
    }), 200


@settings_bp.route("/", methods=["PATCH"])
@login_required
def update_settings():
    if not current_user.is_researcher:
        return jsonify({"error": "Unauthorized"}), 403

    data = request.get_json()

    if "validation_enabled" in data:
        AppSetting.set("validation_enabled", "true" if data["validation_enabled"] else "false")

    return jsonify({
        "validation_enabled": AppSetting.get("validation_enabled") == "true"
    }), 200
