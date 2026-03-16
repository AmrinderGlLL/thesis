from datetime import datetime, timezone
from app import create_app, db
from app.models import Account, PadModel, Scan

app = create_app()

def seed():
    with app.app_context():
        # clear existing data in order (scans first due to FKs)
        Scan.query.delete()
        PadModel.query.delete()
        Account.query.delete()
        db.session.commit()

        # accounts
        amrinder = Account(
            first_name="Amrinder",
            last_name="Singh",
            email="amsingh@claflin.edu",
            role="researcher",
            institution="Claflin University",
            specialty="Vascular Research",
            joined_at=datetime(2024, 1, 15, tzinfo=timezone.utc)
        )
        amrinder.set_password("password")

        james = Account(
            first_name="James",
            last_name="Wilson",
            email="james@example.com",
            role="user",
            joined_at=datetime(2024, 9, 3, tzinfo=timezone.utc)
        )
        james.set_password("password")

        maria = Account(
            first_name="Maria",
            last_name="Santos",
            email="maria.s@example.com",
            role="user",
            joined_at=datetime(2025, 1, 20, tzinfo=timezone.utc)
        )
        maria.set_password("password")

        db.session.add_all([amrinder, james, maria])
        db.session.commit()

        # pad models
        padnet_v2 = PadModel(
            name="PADNet v2.1",
            version="2.1.0",
            architecture="ResNet-50",
            description="Production model trained on 15k ankle-brachial waveform images.",
            accuracy=94.2,
            sensitivity=92.1,
            specificity=95.8,
            auc=0.97,
            status="active",
            is_default=True,
            inference_time="1.2s",
            training_samples=15000,
            note="Best for standard ankle-brachial index waveforms. Preferred first-line model.",
            updated_at=datetime(2024, 11, 15, tzinfo=timezone.utc)
        )

        padnet_v1 = PadModel(
            name="PADNet v1.8",
            version="1.8.3",
            architecture="VGG-16",
            description="Stable legacy model. Faster inference, slightly lower sensitivity.",
            accuracy=89.7,
            sensitivity=87.4,
            specificity=91.2,
            auc=0.93,
            status="active",
            is_default=False,
            inference_time="0.8s",
            training_samples=10000,
            note="Use as fallback when v2.1 is unavailable. Good for time-sensitive cases.",
            updated_at=datetime(2024, 7, 20, tzinfo=timezone.utc)
        )

        padnet_v3 = PadModel(
            name="PADNet v3.0-beta",
            version="3.0.0-beta",
            architecture="EfficientNet-B4",
            description="Experimental model with transformer attention. Under evaluation.",
            accuracy=96.1,
            sensitivity=94.8,
            specificity=97.0,
            auc=0.98,
            status="inactive",
            is_default=False,
            inference_time="2.1s",
            training_samples=22000,
            note="Do not use in clinical workflow — research evaluation only.",
            updated_at=datetime(2025, 2, 28, tzinfo=timezone.utc)
        )

        db.session.add_all([padnet_v2, padnet_v1, padnet_v3])
        db.session.commit()

        # scans (using the committed IDs)
        scans = [
            Scan(account_id=james.id, model_id=padnet_v2.id, file_name="scan_ankle_brachial_001.png",
                 prediction="PAD Positive", is_pad=True, confidence=87.3, severity="Moderate",
                 created_at=datetime(2025, 3, 14, 14, 32, tzinfo=timezone.utc)),

            Scan(account_id=maria.id, model_id=padnet_v2.id, file_name="waveform_left_leg.jpg",
                 prediction="Non-PAD", is_pad=False, confidence=96.1, severity=None,
                 created_at=datetime(2025, 3, 13, 9, 15, tzinfo=timezone.utc)),

            Scan(account_id=james.id, model_id=padnet_v1.id, file_name="rightleg_followup_scan.png",
                 prediction="Non-PAD", is_pad=False, confidence=91.5, severity=None,
                 created_at=datetime(2025, 3, 12, 16, 44, tzinfo=timezone.utc)),

            Scan(account_id=maria.id, model_id=padnet_v1.id, file_name="abindex_screen_02.jpg",
                 prediction="PAD Positive", is_pad=True, confidence=79.8, severity="Mild",
                 created_at=datetime(2025, 3, 11, 11, 20, tzinfo=timezone.utc)),

            Scan(account_id=james.id, model_id=padnet_v2.id, file_name="scan_ankle_brachial_003.png",
                 prediction="PAD Positive", is_pad=True, confidence=93.4, severity="Severe",
                 created_at=datetime(2025, 3, 10, 8, 5, tzinfo=timezone.utc)),

            Scan(account_id=maria.id, model_id=padnet_v2.id, file_name="waveform_screening_01.png",
                 prediction="Non-PAD", is_pad=False, confidence=88.2, severity=None,
                 created_at=datetime(2025, 3, 8, 13, 50, tzinfo=timezone.utc)),
        ]

        db.session.add_all(scans)
        db.session.commit()

        print("Seeded:")
        print(f"  {Account.query.count()} accounts")
        print(f"  {PadModel.query.count()} pad models")
        print(f"  {Scan.query.count()} scans")

if __name__ == "__main__":
    seed()
