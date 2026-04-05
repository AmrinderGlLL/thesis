from datetime import datetime, timezone
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
from . import db


class Account(UserMixin, db.Model):
    __tablename__ = "accounts"

    id = db.Column(db.Integer, primary_key=True)
    first_name = db.Column(db.String(80), nullable=False)
    last_name = db.Column(db.String(80), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    passwd_hash = db.Column(db.String(256), nullable=False)
    role = db.Column(db.String(20), nullable=False, default="user")
    institution = db.Column(db.String(200))
    specialty = db.Column(db.String(200))
    joined_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    scans = db.relationship("Scan", backref="submitter", lazy=True)

    def set_password(self, password):
        self.passwd_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.passwd_hash, password)

    @property
    def is_researcher(self):
        return self.role == "researcher"

    def to_dict(self):
        return {
            "id": self.id,
            "email": self.email,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "role": self.role,
            "institution": self.institution,
            "specialty": self.specialty,
        }


class PadModel(db.Model):
    __tablename__ = "pad_models"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    version = db.Column(db.String(50), nullable=False)
    architecture = db.Column(db.String(100))
    description = db.Column(db.Text)
    accuracy = db.Column(db.Float)
    sensitivity = db.Column(db.Float)
    specificity = db.Column(db.Float)
    auc = db.Column(db.Float)
    status = db.Column(db.String(20), nullable=False, default="active")
    is_default = db.Column(db.Boolean, default=False)
    inference_time = db.Column(db.String(20))
    training_samples = db.Column(db.Integer)
    note = db.Column(db.Text)
    model_file_path = db.Column(db.String(512))  # path to .pt file in model_store/
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    scans = db.relationship("Scan", backref="pad_model", lazy=True)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "version": self.version,
            "architecture": self.architecture,
            "description": self.description,
            "accuracy": self.accuracy,
            "sensitivity": self.sensitivity,
            "specificity": self.specificity,
            "auc": self.auc,
            "status": self.status,
            "is_default": self.is_default,
            "inference_time": self.inference_time,
            "training_samples": self.training_samples,
            "note": self.note,
            "has_model_file": bool(self.model_file_path),
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class AppSetting(db.Model):
    __tablename__ = "app_settings"

    key = db.Column(db.String(100), primary_key=True)
    value = db.Column(db.String(255), nullable=False)

    @staticmethod
    def get(key, default=None):
        row = AppSetting.query.get(key)
        return row.value if row else default

    @staticmethod
    def set(key, value):
        row = AppSetting.query.get(key)
        if row:
            row.value = str(value)
        else:
            db.session.add(AppSetting(key=key, value=str(value)))
        db.session.commit()


class Scan(db.Model):
    __tablename__ = "scans"

    id = db.Column(db.Integer, primary_key=True)
    account_id = db.Column(db.Integer, db.ForeignKey("accounts.id"), nullable=False)
    model_id = db.Column(db.Integer, db.ForeignKey("pad_models.id"), nullable=False)
    file_name = db.Column(db.String(255))
    file_path = db.Column(db.String(512))  # local path to the saved image
    prediction = db.Column(db.String(50))
    is_pad = db.Column(db.Boolean)
    confidence = db.Column(db.Float)
    severity = db.Column(db.String(50))
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self, include_user=False):
        data = {
            "id": self.id,
            "file_name": self.file_name,
            "prediction": self.prediction,
            "is_pad": self.is_pad,
            "confidence": self.confidence,
            "severity": self.severity,
            "model_name": self.pad_model.name if self.pad_model else None,
            "model_version": self.pad_model.version if self.pad_model else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
        if include_user:
            data["user_name"] = f"{self.submitter.first_name} {self.submitter.last_name}"
            data["user_email"] = self.submitter.email
        return data
