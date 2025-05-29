"""
Configuration settings for the deepfake detection API
"""
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# API Keys
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
HF_TOKEN = os.getenv("HF_TOKEN")

# Model names (matching notebook exactly)
CLIP_MODEL_NAME = "ViT-L-14"
CLIP_PRETRAINED = "laion2b_s32b_b82k"
WHISPER_MODEL_NAME = "base.en"
GEMINI_MODEL_NAME = "gemini-2.5-pro-preview-05-06"

# Processing settings (matching notebook)
TARGET_FPS = 8
MAX_VIDEO_DURATION_SEC = 30

# Device detection
import torch
if torch.cuda.is_available():
    DEVICE = "cuda"
else:
    DEVICE = "cpu"

# Set HuggingFace token if available
if HF_TOKEN:
    os.environ["HF_TOKEN"] = HF_TOKEN
    os.environ["HUGGINGFACE_HUB_TOKEN"] = HF_TOKEN