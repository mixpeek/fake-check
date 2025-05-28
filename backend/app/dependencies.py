"""
Dependencies for model loading and management
"""
import asyncio
from typing import Optional, Dict, Any
import torch
import open_clip
import whisper
import google.generativeai as genai

from .config import settings


# Global model storage
_models: Optional[Dict[str, Any]] = None
_models_lock = asyncio.Lock()


async def load_models() -> Dict[str, Any]:
    """
    Load all required models
    """
    models = {}
    
    # Configure device
    device = settings.DEVICE
    if device == "mps" and not torch.backends.mps.is_available():
        print("MPS not available, falling back to CPU")
        device = "cpu"
    
    print(f"Loading models on device: {device}")
    
    # Load CLIP model
    try:
        print("Loading CLIP model...")
        clip_model, _, clip_preprocess = open_clip.create_model_and_transforms(
            settings.CLIP_MODEL_NAME,
            pretrained=settings.CLIP_PRETRAINED,
            device=device,
            cache_dir=str(settings.MODEL_CACHE_DIR / "clip")
        )
        clip_model.eval()
        models["clip_model"] = clip_model
        models["clip_preprocess"] = clip_preprocess
        print("✅ CLIP model loaded successfully")
    except Exception as e:
        print(f"❌ Failed to load CLIP model: {e}")
        models["clip_model"] = None
        models["clip_preprocess"] = None
    
    # Load Whisper model
    try:
        print("Loading Whisper model...")
        whisper_model = whisper.load_model(
            settings.WHISPER_MODEL_NAME,
            device=device,
            download_root=str(settings.MODEL_CACHE_DIR / "whisper")
        )
        models["whisper_model"] = whisper_model
        print("✅ Whisper model loaded successfully")
    except Exception as e:
        print(f"❌ Failed to load Whisper model: {e}")
        models["whisper_model"] = None
    
    # Initialize Gemini model
    if settings.GEMINI_API_KEY:
        try:
            print("Initializing Gemini model...")
            genai.configure(api_key=settings.GEMINI_API_KEY)
            gemini_model = genai.GenerativeModel(settings.GEMINI_MODEL_NAME)
            models["gemini_model"] = gemini_model
            print("✅ Gemini model initialized successfully")
        except Exception as e:
            print(f"❌ Failed to initialize Gemini model: {e}")
            models["gemini_model"] = None
    else:
        print("⚠️ Gemini API key not provided, skipping Gemini model")
        models["gemini_model"] = None
    
    # Store device for reference
    models["device"] = device
    
    return models


async def get_models() -> Dict[str, Any]:
    """
    Get loaded models (singleton pattern)
    """
    global _models
    
    async with _models_lock:
        if _models is None:
            _models = await load_models()
    
    return _models


def cleanup_models():
    """
    Cleanup loaded models to free memory
    """
    global _models
    
    if _models is not None:
        # Clear CUDA cache if using GPU
        if _models.get("device") == "cuda":
            torch.cuda.empty_cache()
        
        _models = None
        print("Models cleaned up")