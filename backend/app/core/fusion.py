# fusion.py

from typing import List, Tuple, Dict

# Thresholds for individual signals to be considered "anomalous" by the tagging system.
VISUAL_CLIP_ANOMALY_THRESHOLD = 0.65 # If clip_score (0-1, higher is more fake-like) exceeds this.

FUSION_MODEL_WEIGHTS = {
    "visual_clip": 0.216,
    "gemini_visual_artifacts": 0.195,
    "gemini_lipsync_issue": 0.195,
    "gemini_blink_abnormality": 0.151,
    "ocr": 0.054,
    "flow": 0.054,
    "audio": 0.054,
    "video_ai": 0.081
} 

def fuse_detection_scores(
    clip_score: float,        # Expected 0-1, higher means more fake-like
    gem_visual_flag: int,     # 0 or 1 (1 if artifacts detected)
    gem_sync_flag: int,       # 0 or 1 (1 if lip-sync issue detected)
    gemini_blink_flag: int,   # 0 or 1 (1 if abnormal blinks detected by Gemini)
    other_scores: Dict[str, float] # New parameter for heuristic module scores
) -> Tuple[float, str, List[str]]:
    """
    Fuses multiple detection scores and flags into an overall deepfake confidence,
    a final label, and a list of anomaly tags.

    Args:
        clip_score: Visual authenticity score from CLIP (0-1).
        gem_visual_flag: Flag from Gemini for visual artifacts.
        gem_sync_flag: Flag from Gemini for lip-sync issues.
        gemini_blink_flag: Flag from Gemini for abnormal blinks.
        other_scores: Dictionary of scores from other heuristic modules.

    Returns:
        A tuple containing:
            - overall_deepfake_confidence (float): Combined confidence score (0-1).
            - final_label (str): "LIKELY_REAL", "UNCERTAIN", or "LIKELY_FAKE".
            - anomaly_tags (List[str]): List of detected anomaly tags.
    """

    # Calculate the weighted sum for overall deepfake confidence.
    # A higher 'overall_deepfake_confidence' indicates a higher likelihood of the video being fake.
    # All Gemini flags (gem_visual_flag, gem_sync_flag, gemini_blink_flag) directly contribute
    # to deepfake confidence if they are 1 (indicating an anomaly).
    overall_deepfake_confidence = (
        FUSION_MODEL_WEIGHTS["visual_clip"] * clip_score +
        FUSION_MODEL_WEIGHTS["gemini_visual_artifacts"] * float(gem_visual_flag) +
        FUSION_MODEL_WEIGHTS["gemini_lipsync_issue"] * float(gem_sync_flag) +
        FUSION_MODEL_WEIGHTS["gemini_blink_abnormality"] * float(gemini_blink_flag)
    )

    # Add contributions from other heuristic scores
    for module_name, score_value in other_scores.items():
        if module_name in FUSION_MODEL_WEIGHTS:
            overall_deepfake_confidence += FUSION_MODEL_WEIGHTS[module_name] * score_value
        else:
            # Optionally log a warning if a score is provided for a module without a weight
            # print(f"Warning: No fusion weight defined for module '{module_name}'", file=sys.stderr)
            pass # Or handle as an error, or assign a default small weight

    # Determine the final label based on confidence thresholds.
    final_label = "UNCERTAIN"
    REAL_CONFIDENCE_THRESHOLD = 0.30 # If overall confidence < this, it's LIKELY_REAL
    FAKE_CONFIDENCE_THRESHOLD = 0.70 # If overall confidence > this, it's LIKELY_FAKE

    if overall_deepfake_confidence < REAL_CONFIDENCE_THRESHOLD:
        final_label = "LIKELY_REAL"
    elif overall_deepfake_confidence > FAKE_CONFIDENCE_THRESHOLD:
        final_label = "LIKELY_FAKE"
        
    # Generate anomaly tags based on individual signal thresholds and flags.
    anomaly_tags = []
    if clip_score > VISUAL_CLIP_ANOMALY_THRESHOLD: 
        anomaly_tags.append("VISUAL_CLIP_ANOMALY")
    
    if gem_visual_flag == 1: 
        anomaly_tags.append("GEMINI_VISUAL_ARTIFACTS")
    
    if gem_sync_flag == 1: 
        anomaly_tags.append("GEMINI_LIPSYNC_ISSUE")
        
    if gemini_blink_flag == 1: # If Gemini flagged abnormal blinks
        anomaly_tags.append("GEMINI_ABNORMAL_BLINKS")
    
    return round(overall_deepfake_confidence, 3), final_label, anomaly_tags