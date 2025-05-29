"""
Model loading for the deepfake detection API
"""
import torch
import open_clip
import whisper
import google.generativeai as genai

from . import config

# Global model storage
models = {}


def load_models():
    """
    Load all required models (called once at startup or first request)
    """
    global models
    
    if models:  # Already loaded
        return models
    
    print(f"Loading models on device: {config.DEVICE}")
    
    # Load CLIP model
    try:
        print("Loading CLIP model...")
        clip_model, _, clip_preprocess = open_clip.create_model_and_transforms(
            config.CLIP_MODEL_NAME,
            pretrained=config.CLIP_PRETRAINED,
            device=config.DEVICE
        )
        clip_model.eval()
        models["clip_model"] = clip_model
        models["clip_preprocess"] = clip_preprocess
        print("✅ CLIP Model (ViT-L-14) loaded.")
    except Exception as e:
        print(f"❌ Error loading CLIP model: {e}")
        models["clip_model"] = None
        models["clip_preprocess"] = None
    
    # Load Whisper model
    try:
        print("Loading Whisper model...")
        whisper_model = whisper.load_model(
            config.WHISPER_MODEL_NAME,
            device=config.DEVICE
        )
        models["whisper_model"] = whisper_model
        print("✅ Whisper Model (base.en) loaded.")
    except Exception as e:
        print(f"❌ Error loading Whisper model: {e}")
        models["whisper_model"] = None
    
    # Initialize Gemini model
    if config.GEMINI_API_KEY:
        try:
            print("Initializing Gemini model...")
            genai.configure(api_key=config.GEMINI_API_KEY)
            gemini_model = genai.GenerativeModel(config.GEMINI_MODEL_NAME)
            models["gemini_model"] = gemini_model
            print(f"✅ Gemini Model ('{config.GEMINI_MODEL_NAME}') initialized for generative tasks.")
        except Exception as e:
            print(f"❌ Error initializing Gemini model: {e}")
            models["gemini_model"] = None
    else:
        print("⚠️ Gemini API key not provided, skipping Gemini model")
        models["gemini_model"] = None
    
    # Store device for reference
    models["device"] = config.DEVICE
    
    return models


async def get_models():
    """
    Get loaded models (async wrapper for compatibility)
    """
    return load_models()