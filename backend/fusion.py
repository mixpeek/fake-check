# df_utils_fusion.py

from typing import List, Tuple

# Thresholds for individual signals to be considered "anomalous" by the tagging system.
# These are independent of the fusion weights for overall confidence.
VISUAL_CLIP_ANOMALY_THRESHOLD = 0.65 # If clip_score (0-1, higher is more fake-like) exceeds this.
BLINK_RATE_LOW_CONFIDENCE_THRESHOLD = 0.3 # If blink_score (0-1, higher is more normal) is BELOW this.

# Adjusted FUSION_MODEL_WEIGHTS after removing BERT and rPPG.
# These weights determine the contribution of each signal to the overall deepfake confidence.
# Current sum: 0.40 (visual_clip) + 0.25 (gemini_visual) + 0.25 (gemini_sync) + 0.10 (blink_rate) = 1.00
FUSION_MODEL_WEIGHTS = {
    "visual_clip": 0.40,
    "gemini_visual": 0.25,
    "gemini_sync": 0.25,
    "blink_rate": 0.10,     # Blink score from Vision API (0-1, higher = more normal)
}

def fuse_detection_scores(
    clip_score: float,        # Expected 0-1, higher means more fake-like (output of sigmoid)
    gem_visual_flag: int,     # 0 or 1 (1 if artifacts detected by Gemini)
    gem_sync_flag: int,       # 0 or 1 (1 if lip-sync issue detected by Gemini)
    blink_score: float        # Expected 0-1, higher means more normal blinking pattern
) -> Tuple[float, str, List[str]]:
    """
    Fuses multiple detection scores and flags into an overall deepfake confidence,
    a final label, and a list of anomaly tags.

    Args:
        clip_score: Visual authenticity score from CLIP (0-1, higher is more fake-like).
        gem_visual_flag: Flag from Gemini indicating visual artifacts (1 if present, 0 otherwise).
        gem_sync_flag: Flag from Gemini indicating lip-sync issues (1 if present, 0 otherwise).
        blink_score: Score indicating normalcy of blinking (0-1, higher is more normal).

    Returns:
        A tuple containing:
            - overall_deepfake_confidence (float): Combined confidence score (0-1).
            - final_label (str): "LIKELY_REAL", "UNCERTAIN", or "LIKELY_FAKE".
            - anomaly_tags (List[str]): List of detected anomaly tags.
    """

    # Calculate the weighted sum for overall deepfake confidence.
    # A higher 'overall_deepfake_confidence' indicates a higher likelihood of the video being fake.
    # For blink_score, a lower score (more abnormal blinking) should increase deepfake confidence,
    # so we use (1.0 - blink_score).
    overall_deepfake_confidence = (
        FUSION_MODEL_WEIGHTS["visual_clip"] * clip_score +
        FUSION_MODEL_WEIGHTS["gemini_visual"] * float(gem_visual_flag) +
        FUSION_MODEL_WEIGHTS["gemini_sync"] * float(gem_sync_flag) +
        FUSION_MODEL_WEIGHTS["blink_rate"] * (1.0 - blink_score) 
    )

    # Determine the final label based on confidence thresholds.
    final_label = "UNCERTAIN"
    REAL_CONFIDENCE_THRESHOLD = 0.30 # If overall confidence < this, it's LIKELY_REAL
    FAKE_CONFIDENCE_THRESHOLD = 0.70 # If overall confidence > this, it's LIKELY_FAKE

    if overall_deepfake_confidence < REAL_CONFIDENCE_THRESHOLD: 
        final_label = "LIKELY_REAL"
    elif overall_deepfake_confidence > FAKE_CONFIDENCE_THRESHOLD: 
        final_label = "LIKELY_FAKE"
        
    # Generate anomaly tags based on individual signal thresholds.
    anomaly_tags = []
    if clip_score > VISUAL_CLIP_ANOMALY_THRESHOLD: 
        anomaly_tags.append("VISUAL_CLIP_ANOMALY")
    
    if gem_visual_flag == 1: 
        anomaly_tags.append("GEMINI_VISUAL_ARTIFACTS")
    
    if gem_sync_flag == 1: 
        anomaly_tags.append("GEMINI_LIPSYNC_ISSUE")
        
    # A low blink_score (e.g., 0.1) means unusual blinking.
    if blink_score < BLINK_RATE_LOW_CONFIDENCE_THRESHOLD: 
        anomaly_tags.append("UNUSUAL_BLINK_PATTERN_VISION_API")
    
    return round(overall_deepfake_confidence, 3), final_label, anomaly_tags