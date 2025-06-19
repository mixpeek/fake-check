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

# Low resource mode toggle
# When set to true via the LOW_RESOURCE environment variable,
# certain heavy steps are skipped, frames are resized to 360p,
# and the target FPS is reduced to conserve resources.
LOW_RESOURCE = os.getenv("LOW_RESOURCE", "false").lower() == "true"

# Model names
# Conditional model selection based on resource availability
if LOW_RESOURCE:
    # Low resource models - smaller, faster
    CLIP_MODEL_NAME = "ViT-B-32"
    CLIP_PRETRAINED = "laion2b_s34b_b79k"
    WHISPER_MODEL_NAME = "base"
else:
    # High resource models - larger, more accurate
    CLIP_MODEL_NAME = "ViT-L-14"
    CLIP_PRETRAINED = "laion2b_s32b_b82k"
    WHISPER_MODEL_NAME = "large-v3"

GEMINI_MODEL_NAME = "gemini-2.5-pro-preview-05-06"

# Processing settings 
TARGET_FPS = 8
MAX_VIDEO_DURATION_SEC = 30

# Apply TARGET_FPS reduction if in low resource mode
if LOW_RESOURCE:
    TARGET_FPS = max(1, TARGET_FPS // 2)

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
