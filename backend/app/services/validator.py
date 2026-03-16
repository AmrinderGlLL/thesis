import os
import torch
import torch.nn as nn
from torchvision import transforms, models
from PIL import Image

VALIDATOR_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
    "validator_store", "best.pt"
)

preprocess = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
])

_validator_model = None


def _load_validator():
    global _validator_model
    if _validator_model is not None:
        return _validator_model

    # plain state dict, EfficientNet-B0, single sigmoid output
    state_dict = torch.load(VALIDATOR_PATH, map_location="cpu", weights_only=False)
    model = models.efficientnet_b0(weights=None)
    model.classifier[1] = nn.Linear(model.classifier[1].in_features, 1)
    model.load_state_dict(state_dict)
    model.eval()

    _validator_model = model
    return model


def check_image(image_path):
    """
    Returns (is_valid: bool, score: float).
    score > 0.7 → valid medical scan, proceed
    score <= 0.7 → not a valid scan, block upload
    If no validator file is present, passes everything through.
    """
    if not os.path.exists(VALIDATOR_PATH):
        return True, 1.0

    model = _load_validator()

    img = Image.open(image_path).convert("RGB")
    tensor = preprocess(img).unsqueeze(0)

    with torch.no_grad():
        logit = model(tensor)
        score = torch.sigmoid(logit).item()

    return score > 0.7, round(score, 4)
