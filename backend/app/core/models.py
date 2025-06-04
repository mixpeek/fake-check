# df_utils_models.py

import os
import sys
from typing import List, Dict, Any, Optional

import torch
import open_clip
import whisper
from PIL import Image
import numpy as np

def sigmoid(x: float) -> float:
    if x < -700: x = -700 
    return 1 / (1 + np.exp(-x))

# CLIP Model & Scoring
REAL_PERSON_PROMPTS_CLIP = [
    "a typical frame from a live-action video recording of a real person",
    "a natural, unedited video still of a human being",
    "a person with natural skin texture and realistic lighting in a video"
]
FAKE_PERSON_PROMPTS_CLIP = [
    "an AI generated deepfake face with unnatural features in a video",
    "a digitally altered face, a manipulated facial video frame",
    "a video still of a person with synthetic-looking skin or odd facial morphing",
    "a face with mismatched lighting or blurry artifacts typical of video deepfakes",
    "eyes that look glassy, unfocused, or move unnaturally in a deepfake video",
    "an unnaturally smooth face, puppet-like movements, or a face that seems digitally overlaid"
]

_cached_clip_text_features = {}  # Global cache

@torch.inference_mode()
def calculate_visual_clip_score(
    pil_frames: List[Image.Image],
    clip_model, 
    clip_preprocess_fn, 
    device: str
) -> float:
    if not pil_frames: return 0.0
    
    global _cached_clip_text_features
    # Create a more unique cache key using model ID and device
    cache_key = f"{id(clip_model)}_{device}"
    print(f"CLIP Debug: Processing {len(pil_frames)} frames on {device}", file=sys.stderr)
    
    if cache_key not in _cached_clip_text_features:
        print("Tokenizing and encoding CLIP text prompts...", file=sys.stderr)
        with torch.no_grad():
            real_tokens = open_clip.tokenize(REAL_PERSON_PROMPTS_CLIP).to(device)
            fake_tokens = open_clip.tokenize(FAKE_PERSON_PROMPTS_CLIP).to(device)
            
            current_cache = {}
            current_cache['real'] = clip_model.encode_text(real_tokens)
            current_cache['fake'] = clip_model.encode_text(fake_tokens)
            current_cache['real'] /= current_cache['real'].norm(dim=-1, keepdim=True)
            current_cache['fake'] /= current_cache['fake'].norm(dim=-1, keepdim=True)
            _cached_clip_text_features[cache_key] = current_cache
            print(f"CLIP Debug: Cached text features for model {id(clip_model)}", file=sys.stderr)
    
    real_text_features = _cached_clip_text_features[cache_key]['real']
    fake_text_features = _cached_clip_text_features[cache_key]['fake']

    all_image_features_list = []
    batch_size = 16 # Adjust based on GPU memory
    for i in range(0, len(pil_frames), batch_size):
        batch = pil_frames[i:i+batch_size]
        images_tensor = torch.stack([clip_preprocess_fn(frame) for frame in batch]).to(device)
        img_features = clip_model.encode_image(images_tensor)
        img_features /= img_features.norm(dim=-1, keepdim=True)
        all_image_features_list.append(img_features)
    
    if not all_image_features_list: return 0.0
    all_image_features = torch.cat(all_image_features_list)

    real_sims = all_image_features @ real_text_features.T
    avg_real_sim_per_frame = real_sims.mean(dim=1) 

    fake_sims = all_image_features @ fake_text_features.T 
    max_fake_sim_per_frame = fake_sims.max(dim=1).values 

    differential_scores = max_fake_sim_per_frame - avg_real_sim_per_frame
    if differential_scores.numel() == 0: return 0.0
    
    # Apply scaling and sigmoid. The scaling factor (5.0) is empirical and might need tuning.
    scaled_score = differential_scores.quantile(0.90).item() * 5.0 
    final_score = sigmoid(scaled_score)
    print(f"CLIP Debug: Final score: {final_score:.3f} (scaled: {scaled_score:.3f})", file=sys.stderr)
    return final_score


# Whisper ASR Model & Transcription
def transcribe_audio_content(
    wav_path: Optional[str], # Made wav_path optional
    whisper_model 
) -> Dict[str, Any]:
    if not wav_path or not os.path.exists(wav_path) or os.path.getsize(wav_path) == 0:
        print("Warning: WAV file for transcription is missing, empty, or path is None.", file=sys.stderr)
        return {"text": "", "words": []}
    
    device = next(whisper_model.parameters()).device # Get device from model
    try:
        transcription_result = whisper_model.transcribe(
            wav_path, fp16=(str(device) == "cuda"), word_timestamps=True, verbose=False # Ensure fp16 is boolean
        )
    except Exception as e:
        print(f"Error during Whisper transcription for {wav_path}: {e}", file=sys.stderr)
        import traceback # Moved import here for when it's actually needed
        print(traceback.format_exc(), file=sys.stderr) 
        return {"text": "", "words": []}
    
    word_segments = []
    full_transcribed_text = transcription_result.get("text", "").strip()
    # Ensure segments and words exist before iterating
    for segment in transcription_result.get("segments", []):
        for word_info in segment.get("words", []): # Check if 'words' key exists in segment
            word_segments.append({
                "word": word_info.get("word", "").strip(), # Strip whitespace from word
                "start": word_info.get("start", 0.0),
                "end": word_info.get("end", 0.0)
            })
    return {"text": full_transcribed_text, "words": word_segments}