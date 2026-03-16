import os
from datetime import datetime, timezone
from flask import Blueprint, request, jsonify, current_app
from flask_login import login_required, current_user
from werkzeug.utils import secure_filename
from .. import db
from ..models import PadModel
from ..services.inference import validate_checkpoint, ARCH_REGISTRY, _resolve_arch_key

pad_models_bp = Blueprint("pad_models", __name__)

MODEL_EXTENSIONS = {"pt", "pth", "bin", "onnx", "h5", "pkl"}


def allowed_model_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in MODEL_EXTENSIONS


@pad_models_bp.route("/", methods=["GET"])
@login_required
def list_models():
    models = PadModel.query.order_by(PadModel.id).all()
    return jsonify([m.to_dict() for m in models]), 200


@pad_models_bp.route("/", methods=["POST"])
@login_required
def add_model():
    if not current_user.is_researcher:
        return jsonify({"error": "Unauthorized"}), 403

    name = request.form.get("name", "").strip()
    version = request.form.get("version", "").strip()
    architecture = request.form.get("architecture", "").strip()
    accuracy = request.form.get("accuracy")
    note = request.form.get("note", "").strip()

    if not name or not version:
        return jsonify({"error": "Name and version are required"}), 400

    model_file = request.files.get("model_file")
    if not model_file or not model_file.filename:
        return jsonify({"error": "A model file is required"}), 400

    model_file_path = None
    if model_file and model_file.filename:
        if not allowed_model_file(model_file.filename):
            return jsonify({"error": "Invalid model file type"}), 400

        arch_key = _resolve_arch_key(architecture)
        if arch_key not in ARCH_REGISTRY:
            return jsonify({"error": f"Unsupported architecture: {architecture}"}), 400

        fname = secure_filename(model_file.filename)
        save_path = os.path.join(current_app.config["MODEL_STORE"], fname)
        model_file.save(save_path)

        ok, message, _ = validate_checkpoint(save_path, arch_key)
        if not ok:
            os.remove(save_path)
            return jsonify({"error": message}), 422

        model_file_path = save_path

    pad_model = PadModel(
        name=name,
        version=version,
        architecture=architecture or None,
        accuracy=float(accuracy) if accuracy else None,
        note=note or None,
        status="inactive",
        model_file_path=model_file_path,
        updated_at=datetime.now(timezone.utc),
    )
    db.session.add(pad_model)
    db.session.commit()

    return jsonify(pad_model.to_dict()), 201


@pad_models_bp.route("/<int:model_id>", methods=["PATCH"])
@login_required
def update_model(model_id):
    if not current_user.is_researcher:
        return jsonify({"error": "Unauthorized"}), 403

    pad_model = PadModel.query.get_or_404(model_id)
    data = request.get_json()

    if "status" in data:
        pad_model.status = "active" if data["status"] == "active" else "inactive"
    if "note" in data:
        pad_model.note = data["note"]

    pad_model.updated_at = datetime.now(timezone.utc)
    db.session.commit()

    return jsonify(pad_model.to_dict()), 200


@pad_models_bp.route("/<int:model_id>", methods=["DELETE"])
@login_required
def delete_model(model_id):
    if not current_user.is_researcher:
        return jsonify({"error": "Unauthorized"}), 403

    pad_model = PadModel.query.get_or_404(model_id)

    if pad_model.scans:
        return jsonify({"error": "Cannot delete a model that has scans associated with it"}), 409

    file_path = pad_model.model_file_path
    db.session.delete(pad_model)
    db.session.commit()

    if file_path and os.path.exists(file_path):
        os.remove(file_path)

    return jsonify({"message": "Model deleted"}), 200
