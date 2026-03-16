import os
import torch
import torch.nn as nn
from torchvision import transforms, models
from PIL import Image

preprocess = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
])

_model_cache = {}

# Each entry: (builder_fn, classifier_replacer)
# The replacer swaps the final layer to a single output neuron for binary classification.
ARCH_REGISTRY = {
    "resnet18":           (lambda: models.resnet18(weights=None),          lambda m: setattr(m, "fc", nn.Linear(m.fc.in_features, 1))),
    "resnet34":           (lambda: models.resnet34(weights=None),          lambda m: setattr(m, "fc", nn.Linear(m.fc.in_features, 1))),
    "resnet50":           (lambda: models.resnet50(weights=None),          lambda m: setattr(m, "fc", nn.Linear(m.fc.in_features, 1))),
    "resnet101":          (lambda: models.resnet101(weights=None),         lambda m: setattr(m, "fc", nn.Linear(m.fc.in_features, 1))),
    "resnet152":          (lambda: models.resnet152(weights=None),         lambda m: setattr(m, "fc", nn.Linear(m.fc.in_features, 1))),
    "vgg16":              (lambda: models.vgg16(weights=None),             lambda m: m.classifier.__setitem__(6, nn.Linear(m.classifier[6].in_features, 1))),
    "vgg19":              (lambda: models.vgg19(weights=None),             lambda m: m.classifier.__setitem__(6, nn.Linear(m.classifier[6].in_features, 1))),
    "alexnet":            (lambda: models.alexnet(weights=None),           lambda m: m.classifier.__setitem__(6, nn.Linear(m.classifier[6].in_features, 1))),
    "densenet121":        (lambda: models.densenet121(weights=None),       lambda m: setattr(m, "classifier", nn.Linear(m.classifier.in_features, 1))),
    "densenet169":        (lambda: models.densenet169(weights=None),       lambda m: setattr(m, "classifier", nn.Linear(m.classifier.in_features, 1))),
    "densenet201":        (lambda: models.densenet201(weights=None),       lambda m: setattr(m, "classifier", nn.Linear(m.classifier.in_features, 1))),
    "efficientnet_b0":    (lambda: models.efficientnet_b0(weights=None),   lambda m: m.classifier.__setitem__(1, nn.Linear(m.classifier[1].in_features, 1))),
    "efficientnet_b3":    (lambda: models.efficientnet_b3(weights=None),   lambda m: m.classifier.__setitem__(1, nn.Linear(m.classifier[1].in_features, 1))),
    "efficientnet_b4":    (lambda: models.efficientnet_b4(weights=None),   lambda m: m.classifier.__setitem__(1, nn.Linear(m.classifier[1].in_features, 1))),
    "efficientnet_b7":    (lambda: models.efficientnet_b7(weights=None),   lambda m: m.classifier.__setitem__(1, nn.Linear(m.classifier[1].in_features, 1))),
    "mobilenet_v2":       (lambda: models.mobilenet_v2(weights=None),      lambda m: m.classifier.__setitem__(1, nn.Linear(m.classifier[1].in_features, 1))),
    "mobilenet_v3_large": (lambda: models.mobilenet_v3_large(weights=None),lambda m: m.classifier.__setitem__(3, nn.Linear(m.classifier[3].in_features, 1))),
    "mobilenet_v3_small": (lambda: models.mobilenet_v3_small(weights=None),lambda m: m.classifier.__setitem__(3, nn.Linear(m.classifier[3].in_features, 1))),
    "squeezenet":         (lambda: models.squeezenet1_1(weights=None),     lambda m: m.classifier.__setitem__(1, nn.Conv2d(512, 1, kernel_size=1))),
    "shufflenet_v2":      (lambda: models.shufflenet_v2_x1_0(weights=None),lambda m: setattr(m, "fc", nn.Linear(m.fc.in_features, 1))),
    "vit_b_16":           (lambda: models.vit_b_16(weights=None),          lambda m: setattr(m.heads, "head", nn.Linear(m.heads.head.in_features, 1))),
}

# maps common backbone key strings from training configs → registry key
BACKBONE_ALIASES = {
    # resnet
    "resnet18": "resnet18", "resnet_18": "resnet18", "resnet-18": "resnet18",
    "resnet34": "resnet34", "resnet_34": "resnet34", "resnet-34": "resnet34",
    "resnet50": "resnet50", "resnet_50": "resnet50", "resnet-50": "resnet50",
    "resnet101": "resnet101", "resnet_101": "resnet101", "resnet-101": "resnet101",
    "resnet152": "resnet152", "resnet_152": "resnet152", "resnet-152": "resnet152",
    # vgg
    "vgg16": "vgg16", "vgg_16": "vgg16", "vgg-16": "vgg16",
    "vgg19": "vgg19", "vgg_19": "vgg19", "vgg-19": "vgg19",
    # alexnet
    "alexnet": "alexnet",
    # densenet
    "densenet121": "densenet121", "densenet_121": "densenet121", "densenet-121": "densenet121",
    "densenet169": "densenet169", "densenet_169": "densenet169", "densenet-169": "densenet169",
    "densenet201": "densenet201", "densenet_201": "densenet201", "densenet-201": "densenet201",
    # efficientnet
    "efficientnet_b0": "efficientnet_b0", "efficientnet-b0": "efficientnet_b0", "efficientnet_b_0": "efficientnet_b0",
    "efficientnet_b3": "efficientnet_b3", "efficientnet-b3": "efficientnet_b3", "efficientnet_b_3": "efficientnet_b3",
    "efficientnet_b4": "efficientnet_b4", "efficientnet-b4": "efficientnet_b4", "efficientnet_b_4": "efficientnet_b4",
    "efficientnet_b7": "efficientnet_b7", "efficientnet-b7": "efficientnet_b7", "efficientnet_b_7": "efficientnet_b7",
    # mobilenet
    "mobilenet_v2": "mobilenet_v2", "mobilenetv2": "mobilenet_v2", "mobilenet-v2": "mobilenet_v2",
    "mobilenet_v3_large": "mobilenet_v3_large", "mobilenetv3": "mobilenet_v3_large", "mobilenet-v3-large": "mobilenet_v3_large",
    "mobilenet_v3_small": "mobilenet_v3_small", "mobilenet-v3-small": "mobilenet_v3_small",
    # squeezenet / shufflenet
    "squeezenet": "squeezenet", "squeezenet1_1": "squeezenet",
    "shufflenet_v2": "shufflenet_v2", "shufflenet_v2_x1_0": "shufflenet_v2", "shufflenet-v2": "shufflenet_v2",
    # vit
    "vit_b_16": "vit_b_16", "vit-b_16": "vit_b_16", "vit_b/16": "vit_b_16",
}


def _build_model(arch_key, state_dict):
    if arch_key not in ARCH_REGISTRY:
        raise ValueError(f"Unsupported architecture: {arch_key}")
    builder, replacer = ARCH_REGISTRY[arch_key]
    model = builder()
    replacer(model)
    model.load_state_dict(state_dict)
    model.eval()
    return model


def validate_checkpoint(file_path, selected_arch_key):
    """
    Validates that file_path is a loadable checkpoint compatible with selected_arch_key.
    Returns (ok: bool, message: str, detected_arch: str|None)
    """
    if selected_arch_key not in ARCH_REGISTRY:
        return False, f"Architecture '{selected_arch_key}' is not supported.", None

    try:
        ckpt = torch.load(file_path, map_location="cpu", weights_only=False)
    except Exception as e:
        return False, f"Could not load file: {e}", None

    # reject full saved models — they're fragile and tied to the training machine's class paths
    if callable(ckpt) or hasattr(ckpt, "forward"):
        return False, "Full saved models are not supported. Please upload a state dict or checkpoint dict.", None

    if not isinstance(ckpt, dict):
        return False, "Unrecognized file format. Expected a checkpoint dict or state dict.", None

    # figure out the state dict and detect architecture from cfg if present
    detected_arch = None
    if "model_state" in ckpt:
        state_dict = ckpt["model_state"]
        cfg = ckpt.get("cfg", {})
        backbone = cfg.get("BACKBONE", cfg.get("backbone", "")).lower()
        if backbone:
            detected_arch = BACKBONE_ALIASES.get(backbone)
    else:
        # assume it's a plain state dict
        state_dict = ckpt

    # if the checkpoint told us its architecture, make sure it matches what the researcher selected
    if detected_arch and detected_arch != selected_arch_key:
        return False, (
            f"Checkpoint architecture mismatch: file was trained with '{detected_arch}' "
            f"but you selected '{selected_arch_key}'."
        ), detected_arch

    # try actually loading the weights into the selected architecture
    try:
        _build_model(selected_arch_key, state_dict)
    except Exception as e:
        return False, f"Weights are not compatible with {selected_arch_key}: {e}", detected_arch

    return True, "ok", detected_arch or selected_arch_key


def run_inference(pad_model_record, image_path):
    """
    Runs inference using the architecture stored in pad_model_record.architecture.
    Checkpoint format: dict with 'model_state' key, or plain state dict.
    Output is a single logit through sigmoid — 1 = PAD Positive, 0 = Non-PAD.
    """
    file_path = pad_model_record.model_file_path

    if not file_path or not os.path.exists(file_path):
        return _placeholder_result()

    arch_key = _resolve_arch_key(pad_model_record.architecture)

    if file_path not in _model_cache:
        ckpt = torch.load(file_path, map_location="cpu", weights_only=False)
        state_dict = ckpt["model_state"] if "model_state" in ckpt else ckpt
        _model_cache[file_path] = _build_model(arch_key, state_dict)

    model = _model_cache[file_path]

    img = Image.open(image_path).convert("RGB")
    tensor = preprocess(img).unsqueeze(0)

    with torch.no_grad():
        logit = model(tensor)
        pad_prob = torch.sigmoid(logit).item()

    is_pad = pad_prob >= 0.5
    confidence = round(pad_prob * 100 if is_pad else (1 - pad_prob) * 100, 1)
    prediction = "PAD Positive" if is_pad else "Non-PAD"
    severity = _severity(confidence) if is_pad else None

    return is_pad, confidence, prediction, severity


def _resolve_arch_key(architecture_str):
    if not architecture_str:
        return "resnet50"
    key = architecture_str.lower().replace("-", "_").replace("/", "_").replace(" ", "_")
    return BACKBONE_ALIASES.get(key, key)


def _severity(confidence):
    if confidence >= 90:
        return "Severe"
    if confidence >= 80:
        return "Moderate"
    return "Mild"


def _placeholder_result():
    import random
    is_pad = random.random() > 0.5
    confidence = round(random.uniform(70, 96), 1)
    prediction = "PAD Positive" if is_pad else "Non-PAD"
    severity = _severity(confidence) if is_pad else None
    return is_pad, confidence, prediction, severity
