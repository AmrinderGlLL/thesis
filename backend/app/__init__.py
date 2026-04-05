from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from flask_migrate import Migrate
from flask_cors import CORS
from .config import Cfg

db = SQLAlchemy()
login_manager = LoginManager()
migrate = Migrate()


def create_app():
    app = Flask(__name__)
    app.config.from_object(Cfg)

    db.init_app(app)
    login_manager.init_app(app)
    migrate.init_app(app, db)
    CORS(app)

    from .auth.routes import auth_bp
    from .scans.routes import scans_bp
    from .pad_models.routes import pad_models_bp
    from .account.routes import account_bp
    from .settings.routes import settings_bp

    app.register_blueprint(auth_bp, url_prefix="/auth")
    app.register_blueprint(scans_bp, url_prefix="/scans")
    app.register_blueprint(pad_models_bp, url_prefix="/models")
    app.register_blueprint(account_bp, url_prefix="/account")
    app.register_blueprint(settings_bp, url_prefix="/settings")

    return app


@login_manager.user_loader
def load_user(user_id):
    from .models import Account
    return Account.query.get(int(user_id))
