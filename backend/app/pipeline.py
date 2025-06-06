"""
Main detection pipeline
=======================

* Mirrors the original notebook-derived flow but now plugs in the new
  heuristic detectors **and** emits per-anomaly timeline events.
"""
from __future__ import annotations

import os
import uuid
import asyncio
import time
import logging
from typing import Dict, Any, List, Optional
from pathlib import Path
from PIL import Image

# -- original core modules --
from .core import video
from .core import models
from .core import gemini          # now hosts OCR too
from .core import fusion
from . import config

# -- NEW heuristic detectors --
from .core import (
    flow,
    audio as audio_mod,
)

# Setup logger for this module
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------
async def run_detection_pipeline(
    video_path: str,
    models_dict: Dict[str, Any],
    job_id: str
) -> Dict[str, Any]:
    """
    Main deep-fake / AI-generated video detection pipeline.

    Returns a dict ready to be placed inside DetectionResult.details or
    passed straight to the DB.
    """
    t0 = time.time()
    video_basename = os.path.basename(video_path)
    run_id = f"{Path(video_basename).stem}_{job_id[:6]}"
    logger.info(f"[{run_id}] Starting detection pipeline for: {video_basename}")

    detection_results: Dict[str, Any] = {
        "input_video": video_basename,
        "run_id": run_id,
        "pipeline_version": "proof_of_concept_v2_events_logging_v2"
    }

    temp_audio_path: Optional[str] = None
    processed_frames_pil: List[Image.Image] = []

    try:
        logger.info(f"[{run_id}] Step 1: Sampling video content.")
        frames, temp_audio_path, original_dur, processed_dur = \
            video.sample_video_content(
                video_path,
                target_fps=config.TARGET_FPS,
                max_duration_sec=config.MAX_VIDEO_DURATION_SEC
            )
        fps = config.TARGET_FPS                       # sampling fps
        logger.info(f"[{run_id}] Video content sampled. Frames: {len(frames)}, Original Duration: {original_dur:.2f}s, Processed Duration: {processed_dur:.2f}s, FPS: {fps}")

        detection_results.update({
            "video_original_duration_sec": round(original_dur, 2),
            "video_processed_duration_sec": round(processed_dur, 2),
            "num_frames_sampled_for_clip_whisper": len(frames)
        })
        if not frames:
            logger.error(f"[{run_id}] Frame sampling returned no frames. Aborting.")
            raise RuntimeError("Frame sampling returned no frames.")

        logger.info(f"[{run_id}] Step 2: Calculating CLIP visual score.")
        clip_score = 0.0
        clip_model      = models_dict.get("clip_model")
        clip_preprocess = models_dict.get("clip_preprocess")
        device          = models_dict.get("device", "cpu")

        if clip_model and clip_preprocess:
            clip_score = models.calculate_visual_clip_score(
                frames, clip_model, clip_preprocess, device
            )
        detection_results["score_visual_clip"] = round(clip_score, 3)
        logger.info(f"[{run_id}] CLIP visual score calculated: {clip_score:.3f}")

        logger.info(f"[{run_id}] Step 3: Transcribing audio content with Whisper.")
        transcription = {"text": "", "words": [], "avg_no_speech_prob": 1.0}
        whisper_model = models_dict.get("whisper_model")
        if whisper_model and temp_audio_path:
            transcription = models.transcribe_audio_content(
                temp_audio_path, whisper_model
            )
        
        # --- Check for high "no speech" probability from Whisper ---
        NO_SPEECH_THRESHOLD = 0.85
        avg_no_speech_prob = transcription.get("avg_no_speech_prob", 0.0)
        lipsync_enabled = True
        if avg_no_speech_prob > NO_SPEECH_THRESHOLD:
            logger.warning(f"[{run_id}] High 'no speech' probability ({avg_no_speech_prob:.2f}) detected. Disabling lip-sync check.")
            lipsync_enabled = False
            # Overwrite transcript to avoid showing garbage text in results
            transcription["text"] = "[No speech detected]"
            transcription["words"] = []

        detection_results["transcript_snippet"] = (
            transcription["text"][:150] + "..."
            if transcription["text"] else "[No Speech/Audio Error]"
        )
        logger.info(f"[{run_id}] Audio transcribed. Snippet: {detection_results['transcript_snippet']}")

        logger.info(f"[{run_id}] Step 4: Running Gemini inspections (visual, lip-sync, blinks, text).")
        gemini_model = models_dict.get("gemini_model")
        vis_flag = lip_flag = blink_flag = 0
        gibberish_score_val = 0.0
        gemini_timeline_events: List[Dict[str, Any]] = []

        if gemini_model:
            vis_flag, lip_flag, blink_flag, gibberish_score_val, gemini_timeline_events = await gemini.run_gemini_inspections(
                frames,
                video_path,
                transcription,
                gemini_model,
                fps=fps,
                enable_visual_artifacts=True,
                enable_lipsync=lipsync_enabled,
                enable_abnormal_blinks=True,
                enable_ocr_gibberish=True,
            )
        logger.info(f"[{run_id}] Gemini inspections completed. Visual: {vis_flag}, Lip-sync: {lip_flag}, Blinks: {blink_flag}, Gibberish score: {gibberish_score_val:.2f}, Events: {len(gemini_timeline_events)}")

        detection_results.update({
            "flag_gemini_visual_artifact": vis_flag,
            "flag_gemini_lipsync_issue":   lip_flag,
            "flag_gemini_abnormal_blinks": blink_flag
        })

        logger.info(f"[{run_id}] Step 5: Running heuristic detectors.")
        
        logger.info(f"[{run_id}] Starting heuristic: flow.detect_spikes")
        flow_res  = flow.detect_spikes(frames, fps)
        logger.info(f"[{run_id}] Completed flow.detect_spikes. Score: {flow_res.get('score', -1):.2f}, Anomaly: {flow_res.get('anomaly', 'N/A')}, Events: {len(flow_res.get('events', []))}")

        logger.info(f"[{run_id}] Starting heuristic: audio_mod.detect_loop_and_lag")
        audio_res = audio_mod.detect_loop_and_lag(video_path, frames, fps)
        logger.info(f"[{run_id}] Completed audio_mod.detect_loop_and_lag. Score: {audio_res.get('score', -1):.2f}, Anomaly: {audio_res.get('anomaly', 'N/A')}, Events: {len(audio_res.get('events', []))}")

        logger.info(f"[{run_id}] Starting heuristic: video.detect_lighting_jumps")
        shot_res  = video.detect_lighting_jumps(video_path)
        logger.info(f"[{run_id}] Completed video.detect_lighting_jumps. Score: {shot_res.get('score', -1):.2f}, Anomaly: {shot_res.get('anomaly', 'N/A')}, Events: {len(shot_res.get('events', []))}")

        # gather for fusion & timeline
        module_results = [flow_res, audio_res, shot_res]

        logger.info(f"[{run_id}] Step 6: Fusing detection scores.")
        other_scores_for_fusion = {
            "gibberish": gibberish_score_val,
            "flow": flow_res.get("score", 0.0),
            "audio": audio_res.get("score", 0.0), 
            "video_ai": shot_res.get("score", 0.0)
        }
        logger.info(f"[{run_id}] Scores for fusion: CLIP={clip_score:.3f}, Gemini Visual={vis_flag}, Gemini Lipsync={lip_flag}, Gemini Blink={blink_flag}, Others={other_scores_for_fusion}")

        final_conf, final_label, fusion_generated_tags = fusion.fuse_detection_scores(
            clip_score,
            vis_flag,
            lip_flag,
            blink_flag,
            other_scores=other_scores_for_fusion
        )
        logger.info(f"[{run_id}] Fusion completed. Confidence: {final_conf:.3f}, Label: {final_label}, Tags: {fusion_generated_tags}")

        detection_results.update({
            "deepfake_confidence_overall": final_conf,
            "final_predicted_label": final_label,
        })

        # Aggregate all anomaly tags
        all_detected_tags = list(fusion_generated_tags)
        module_results_for_tags = [flow_res, audio_res, shot_res]
        for res_dict in module_results_for_tags:
            all_detected_tags.extend(res_dict.get("tags", []))
        # Add gibberish tag if score indicates anomaly
        if gibberish_score_val > 0:
             all_detected_tags.append("gibberish_text")
        detection_results["anomaly_tags_detected"] = sorted(list(set(all_detected_tags)))
        logger.info(f"[{run_id}] Aggregated anomaly tags: {detection_results['anomaly_tags_detected']}")

        logger.info(f"[{run_id}] Step 7: Preparing heuristicChecks block.")
        heuristic_checks = {
            "visual_clip": clip_score,
            "gemini_visual_artifacts": vis_flag,
            "gemini_lipsync_issue": lip_flag,
            "gemini_blink_abnormality": blink_flag,
            "gibberish":           gibberish_score_val,
            "flow":          flow_res.get("score", 0.0),
            "audio":         audio_res.get("score", 0.0),
            "video_ai":      shot_res.get("score", 0.0),
        }
        detection_results["heuristicChecks"] = heuristic_checks
        logger.info(f"[{run_id}] heuristicChecks prepared: {heuristic_checks}")

        logger.info(f"[{run_id}] Step 8: Aggregating timeline events.")
        timeline_events: List[Dict[str, Any]] = []
        # Add events from non-Gemini heuristic modules
        non_gemini_module_results = [flow_res, audio_res, shot_res]
        for res in non_gemini_module_results: 
            timeline_events.extend(res.get("events", []))
        timeline_events.extend(gemini_timeline_events)
        
        timeline_events.sort(key=lambda ev: (ev.get("module", ""), ev.get("ts", 0.0)))
        detection_results["events"] = timeline_events
        logger.info(f"[{run_id}] Timeline events aggregated. Count: {len(timeline_events)}")

        detection_results["processing_time"] = round(time.time() - t0, 2)
        logger.info(f"[{run_id}] Pipeline completed successfully in {detection_results['processing_time']:.2f}s.")

    except Exception as e:
        import traceback
        err = f"Pipeline error for {video_basename}: {e}"
        logger.error(f"[{run_id}] {err}", exc_info=True)
        detection_results["error"] = err
        detection_results["trace"] = traceback.format_exc()
        detection_results.setdefault("final_predicted_label", "ERROR_IN_PROCESSING")
        detection_results.setdefault("deepfake_confidence_overall", 0.5)
        detection_results.setdefault("anomaly_tags_detected", ["PIPELINE_ERROR"])
        detection_results.setdefault("heuristicChecks", {})
        detection_results.setdefault("events", [])
        detection_results.setdefault("score_visual_clip", 0.0)
        detection_results.setdefault("flag_gemini_visual_artifact", 0)
        detection_results.setdefault("flag_gemini_lipsync_issue", 0)
        detection_results.setdefault("flag_gemini_abnormal_blinks", 0)
        detection_results.setdefault("video_original_duration_sec", detection_results.get("video_original_duration_sec", 0.0))
        detection_results.setdefault("video_processed_duration_sec", detection_results.get("video_processed_duration_sec", 0.0))
        detection_results.setdefault("transcript_snippet", "Error in processing")
        logger.error(f"[{run_id}] Pipeline aborted due to error. Processing time: {time.time() - t0:.2f}s")

    finally:
        if temp_audio_path and os.path.exists(temp_audio_path):
            try:
                os.remove(temp_audio_path)
                logger.info(f"[{run_id}] Cleaned up temporary audio file: {temp_audio_path}")
            except OSError as ose:
                logger.warning(f"[{run_id}] Failed to clean up temporary audio file {temp_audio_path}: {ose}")

    return detection_results
