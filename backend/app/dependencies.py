"""
Model loading for the deepfake-detection API
===========================================

• Keeps your original load-once behaviour for CLIP, Whisper, Gemini.  
• Adds *lazy* helpers for SyncNet (lip-sync) and Whisper (for modules that
  don't call `load_models()` first).  These helpers do **not** load anything
  until first use, so start-up time is unaffected.

No other behavioural changes.
"""
import sys
import torch
import open_clip
import whisper
import google.generativeai as genai

from . import config

# ---------------------------------------------------------------------
#  Global model cache
# ---------------------------------------------------------------------
models = {}


def load_models():
    """
    Load CLIP, Whisper, and Gemini once.  Re-use across requests.
    """
    global models
    if models:                         # already loaded
        print("Models already loaded, reusing instances", file=sys.stderr)
        return models

    print(f"Loading models on device: {config.DEVICE}", file=sys.stderr)

    # -- CLIP ----------------------------------------------------------
    try:
        clip_model, _, clip_pre = open_clip.create_model_and_transforms(
            config.CLIP_MODEL_NAME,
            pretrained=config.CLIP_PRETRAINED,
            device=config.DEVICE
        )
        clip_model.eval()
        models["clip_model"] = clip_model
        models["clip_preprocess"] = clip_pre
        print("✅ CLIP (ViT-L/14) loaded.", file=sys.stderr)
    except Exception as e:
        print(f"❌ CLIP load error: {e}", file=sys.stderr)
        models["clip_model"] = None
        models["clip_preprocess"] = None

    # -- Whisper -------------------------------------------------------
    try:
        whisper_model = whisper.load_model(
            config.WHISPER_MODEL_NAME,
            device=config.DEVICE
        )
        models["whisper_model"] = whisper_model
        print("✅ Whisper model loaded.", file=sys.stderr)
    except Exception as e:
        print(f"❌ Whisper load error: {e}", file=sys.stderr)
        models["whisper_model"] = None

    # -- Gemini --------------------------------------------------------
    if config.GEMINI_API_KEY:
        try:
            genai.configure(api_key=config.GEMINI_API_KEY)
            gemini_model = genai.GenerativeModel(config.GEMINI_MODEL_NAME)
            models["gemini_model"] = gemini_model
            print(f"✅ Gemini model '{config.GEMINI_MODEL_NAME}' initialised.",
                  file=sys.stderr)
        except Exception as e:
            print(f"❌ Gemini init error: {e}", file=sys.stderr)
            models["gemini_model"] = None
    else:
        print("⚠️  GEMINI_API_KEY missing – Gemini disabled", file=sys.stderr)
        models["gemini_model"] = None

    models["device"] = config.DEVICE
    return models


async def get_models():
    """Async wrapper for FastAPI dependency injection."""
    return load_models()

_whisper_instance = None   # for modules that didn't call load_models()

def get_whisper():
    """
    Lazy Whisper accessor for modules that run outside the main load-path
    (e.g. audio autocorr + lip-sync).  Reuses the model from `models` if
    already loaded.
    """
    global _whisper_instance
    if _whisper_instance:
        return _whisper_instance

    if models.get("whisper_model"):
        _whisper_instance = models["whisper_model"]
        return _whisper_instance

    # fall-back: minimal base model (CPU)
    try:
        _whisper_instance = whisper.load_model("base", device=config.DEVICE)
        print("ℹ️  Whisper loaded lazily by get_whisper()", file=sys.stderr)
    except Exception as e:
        print(f"❌ Whisper lazy load error: {e}", file=sys.stderr)
        _whisper_instance = None
    return _whisper_instance
