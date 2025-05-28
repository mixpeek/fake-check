"""
Main detection pipeline
"""
import os
import sys
import uuid
from typing import Dict, Any, List, Optional
from PIL import Image

# Add the core modules to the path
sys.path.append(os.path.join(os.path.dirname(__file__), 'core'))

# Import core modules
from .core import video
from .core import models
from .core import gemini
from .core import fusion
from .config import settings


async def run_detection_pipeline(
    video_path: str,
    models: Dict[str, Any],
    job_id: str
) -> Dict[str, Any]:
    """
    Main deepfake detection pipeline
    
    Args:
        video_path: Path to the video file
        models: Dictionary containing loaded models
        job_id: Unique job identifier
        
    Returns:
        Detection results dictionary
    """
    video_basename = os.path.basename(video_path)
    run_id = f"{os.path.splitext(video_basename)[0]}_{job_id[:6]}"
    
    detection_results = {
        "input_video": video_basename,
        "run_id": run_id,
        "pipeline_version": "fastapi_v1"
    }
    
    temp_audio_path: Optional[str] = None
    processed_frames_pil: List[Image.Image] = []
    
    try:
        print(f"\nProcessing: {video_basename}")
        
        # 1. Sample Video & Audio
        processed_frames_pil, temp_audio_path, original_duration, processed_duration = \
            video.sample_video_content(
                video_path,
                target_fps=settings.TARGET_FPS,
                max_duration_sec=settings.MAX_VIDEO_DURATION_SEC
            )
        
        detection_results["video_original_duration_sec"] = round(original_duration, 2)
        detection_results["video_processed_duration_sec"] = round(processed_duration, 2)
        detection_results["num_frames_sampled"] = len(processed_frames_pil)
        
        if not processed_frames_pil:
            raise RuntimeError("Frame sampling returned no frames.")
        
        # 2. CLIP Visual Score
        score_visual_clip = 0.0
        clip_model = models.get("clip_model")
        clip_preprocess = models.get("clip_preprocess")
        device = models.get("device", "cpu")
        
        if clip_model and clip_preprocess:
            score_visual_clip = models.calculate_visual_clip_score(
                processed_frames_pil, clip_model, clip_preprocess, device
            )
        detection_results["score_visual_clip"] = round(score_visual_clip, 3)
        
        # 3. Whisper ASR
        transcription_text = ""
        whisper_model = models.get("whisper_model")
        
        if whisper_model and temp_audio_path:
            transcription_data = models.transcribe_audio_content(
                temp_audio_path, whisper_model
            )
            transcription_text = transcription_data["text"]
        detection_results["transcript_snippet"] = (
            transcription_text[:150] + "..." if transcription_text 
            else "[No Speech/Audio Error]"
        )
        
        # 4. Gemini Inspections
        flag_gemini_visual, flag_gemini_lipsync, flag_gemini_blinks = 0, 0, 0
        gemini_model = models.get("gemini_model")
        
        if gemini_model:
            flag_gemini_visual, flag_gemini_lipsync, flag_gemini_blinks = \
                await gemini.run_gemini_inspections(
                    processed_frames_pil, 
                    video_path, 
                    transcription_text, 
                    gemini_model,
                    # Enable all checks by default
                    enable_visual_artifacts=True,
                    enable_lipsync=True,
                    enable_abnormal_blinks=True
                )
        
        detection_results["flag_gemini_visual_artifact"] = flag_gemini_visual
        detection_results["flag_gemini_lipsync_issue"] = flag_gemini_lipsync
        detection_results["flag_gemini_abnormal_blinks"] = flag_gemini_blinks
        
        # 5. Fuse Scores
        final_confidence, final_label, anomaly_tags_list = fusion.fuse_detection_scores(
            score_visual_clip,
            flag_gemini_visual,
            flag_gemini_lipsync,
            flag_gemini_blinks
        )
        
        detection_results["deepfake_confidence_overall"] = final_confidence
        detection_results["final_predicted_label"] = final_label
        detection_results["anomaly_tags_detected"] = anomaly_tags_list
        
    except Exception as e:
        import traceback
        error_message = f"Pipeline error for {video_basename}: {str(e)}"
        print(f"{error_message}\n{traceback.format_exc()}")
        detection_results["error"] = error_message
        # Set defaults for failed analysis
        detection_results["deepfake_confidence_overall"] = 0.5
        detection_results["final_predicted_label"] = "UNCERTAIN"
        detection_results["anomaly_tags_detected"] = []
        
    finally:
        # Clean up temporary audio file
        if temp_audio_path and os.path.exists(temp_audio_path):
            try:
                os.remove(temp_audio_path)
            except OSError:
                pass
    
    return detection_results