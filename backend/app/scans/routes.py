import os
from datetime import datetime, timezone
from flask import Blueprint, request, jsonify, send_file, current_app
from flask_login import login_required, current_user
from werkzeug.utils import secure_filename
from .. import db
from ..models import Scan, PadModel, AppSetting
from ..services.inference import run_inference
from ..services.validator import check_image

scans_bp = Blueprint("scans", __name__)

ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "tiff", "tif", "bmp"}


def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


@scans_bp.route("/upload", methods=["POST"])
@login_required
def upload_scan():
    img_file = request.files.get("image")
    model_id = request.form.get("model_id")

    if not img_file or not img_file.filename:
        return jsonify({"error": "No image provided"}), 400
    if not allowed_file(img_file.filename):
        return jsonify({"error": "Invalid file type"}), 400
    if not model_id:
        return jsonify({"error": "No model selected"}), 400

    pad_model = PadModel.query.filter_by(id=model_id, status="active").first()
    if not pad_model:
        return jsonify({"error": "Model not found or inactive"}), 404

    original_name = secure_filename(img_file.filename)
    stamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    saved_name = f"{stamp}_{current_user.id}_{original_name}"
    save_path = os.path.join(current_app.config["UPLOAD_FOLDER"], saved_name)
    img_file.save(save_path)

    if AppSetting.get("validation_enabled", "false") == "true":
        is_valid, val_score = check_image(save_path)
        if not is_valid:
            os.remove(save_path)
            return jsonify({
                "error": "invalid_scan",
                "message": "This does not appear to be a valid medical image. Please upload a valid CTA scan."
            }), 422

    is_pad, confidence, prediction, severity = run_inference(pad_model, save_path)

    scan = Scan(
        account_id=current_user.id,
        model_id=pad_model.id,
        file_name=original_name,
        file_path=save_path,
        prediction=prediction,
        is_pad=is_pad,
        confidence=confidence,
        severity=severity,
    )
    db.session.add(scan)
    db.session.commit()

    return jsonify({"scan_id": scan.id}), 201


@scans_bp.route("/mine", methods=["GET"])
@login_required
def my_scans():
    scans = Scan.query.filter_by(account_id=current_user.id).order_by(Scan.created_at.desc()).all()
    return jsonify([s.to_dict() for s in scans]), 200


@scans_bp.route("/all", methods=["GET"])
@login_required
def all_scans():
    if not current_user.is_researcher:
        return jsonify({"error": "Unauthorized"}), 403
    scans = Scan.query.order_by(Scan.created_at.desc()).all()
    return jsonify([s.to_dict(include_user=True) for s in scans]), 200


@scans_bp.route("/<int:scan_id>", methods=["GET"])
@login_required
def get_scan(scan_id):
    scan = Scan.query.get_or_404(scan_id)
    if scan.account_id != current_user.id and not current_user.is_researcher:
        return jsonify({"error": "Unauthorized"}), 403
    return jsonify(scan.to_dict(include_user=current_user.is_researcher)), 200


@scans_bp.route("/<int:scan_id>/image", methods=["GET"])
@login_required
def scan_image(scan_id):
    scan = Scan.query.get_or_404(scan_id)
    if scan.account_id != current_user.id and not current_user.is_researcher:
        return jsonify({"error": "Unauthorized"}), 403
    if not scan.file_path or not os.path.exists(scan.file_path):
        return jsonify({"error": "Image not found"}), 404
    return send_file(scan.file_path)
