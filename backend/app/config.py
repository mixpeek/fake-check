"""
Configuration settings for the deepfake detection API
"""
import os
from pathlib import Path
from typing import Optional
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables
    """
    # API Keys
    GEMINI_API_KEY: Optional[str] = None
    HF_TOKEN: Optional[str] = None
    
    # Model Configuration
    CLIP_MODEL_NAME: str = "ViT-L-14"
    CLIP_PRETRAINED: str = "laion2b_s32b_b82k"
    WHISPER_MODEL_NAME: str = "base.en"
    GEMINI_MODEL_NAME: str = "gemini-2.0-flash-exp"
    
    # Processing Configuration
    TARGET_FPS: int = 8
    MAX_VIDEO_DURATION_SEC: int = 30
    MAX_FILE_SIZE_MB: int = 100  # 0 for no limit
    
    # Model Loading
    PRELOAD_MODELS: bool = False  # Whether to load models on startup
    MODEL_CACHE_DIR: Path = Path.home() / ".cache" / "deepfake-detector"
    
    # Device Configuration
    DEVICE: str = "cpu"  # "cpu", "cuda", or "mps"
    USE_MPS_IF_AVAILABLE: bool = False  # For M1/M2/M3 Macs
    
    # API Configuration
    API_VERSION: str = "v1"
    DEBUG: bool = False
    
    # Temporary File Storage
    TEMP_DIR: Optional[Path] = None
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        
        # Create model cache directory
        self.MODEL_CACHE_DIR.mkdir(parents=True, exist_ok=True)
        
        # Set HuggingFace cache directory
        if self.HF_TOKEN:
            os.environ["HF_TOKEN"] = self.HF_TOKEN
            os.environ["HUGGINGFACE_HUB_TOKEN"] = self.HF_TOKEN
        
        # Set HuggingFace cache to our directory
        os.environ["HF_HOME"] = str(self.MODEL_CACHE_DIR)
        os.environ["TRANSFORMERS_CACHE"] = str(self.MODEL_CACHE_DIR / "transformers")
        os.environ["TORCH_HOME"] = str(self.MODEL_CACHE_DIR / "torch")
        
        # Auto-detect device if not specified
        if self.DEVICE == "auto":
            import torch
            if torch.cuda.is_available():
                self.DEVICE = "cuda"
            elif self.USE_MPS_IF_AVAILABLE and torch.backends.mps.is_available():
                self.DEVICE = "mps"
            else:
                self.DEVICE = "cpu"


# Create global settings instance
settings = Settings()