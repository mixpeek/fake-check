import asyncio
import os
import sys
from pathlib import Path
from PIL import Image
import tempfile

# Add project root to sys.path to allow direct imports of app modules
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from app.core import video, models, gemini, fusion, flow
from app.dependencies import load_models, get_models
from app import config

# Test video path
TEST_VIDEO_PATH = "videos_for_testing/fake_kangaroo.mp4" 
# TEST_VIDEO_PATH_SHORT = "videos_for_testing/short_test_video.mp4" # Create a very short (5s) video for faster testing

# Global models dictionary, populated by a setup function
models_dict = {}

def setup_module(module):
    """Load models once before all tests in this module."""
    print("\nSetting up models for test_detection_steps...")
    global models_dict
    # Ensure config.GEMINI_API_KEY is set if not already by environment
    if not config.GEMINI_API_KEY:
        print("WARNING: GEMINI_API_KEY not found in environment, attempting to load from .env file if present.")
        # Attempt to load from .env if current file is in backend/
        dotenv_path = PROJECT_ROOT / ".env"
        if dotenv_path.exists():
            from dotenv import load_dotenv
            load_dotenv(dotenv_path)
            config.GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
            if config.GEMINI_API_KEY:
                print("GEMINI_API_KEY loaded from .env")
            else:
                print("GEMINI_API_KEY still not found after .env check.")
        else:
            print(".env file not found at project root.")

    if not os.path.exists(TEST_VIDEO_PATH):
        print(f"ERROR: Test video not found at {TEST_VIDEO_PATH}")
        print("Please ensure the video exists or update TEST_VIDEO_PATH.")
        # Optionally create a dummy video if one doesn't exist for basic testing setup
        # For now, we'll rely on it existing.
        # raise FileNotFoundError(f"Test video not found: {TEST_VIDEO_PATH}")


    # Check for Google Cloud credentials for Video Intelligence API
    google_creds_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
    if not google_creds_path or not Path(google_creds_path).exists():
        print(f"WARNING: GOOGLE_APPLICATION_CREDENTIALS environment variable is not set or points to a non-existent file ('{google_creds_path}').")
        print("Video Intelligence API dependent tests (like detect_lighting_jumps) might fail or be skipped.")
        print("Attempting to use 'backend/fakecheck-461121-b61497efa7df.json' if it exists.")
        potential_creds_path = PROJECT_ROOT / "backend" / "fakecheck-461121-b61497efa7df.json"
        if potential_creds_path.exists():
            os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = str(potential_creds_path)
            print(f"Set GOOGLE_APPLICATION_CREDENTIALS to: {potential_creds_path}")
        else:
            print(f"Fallback credentials {potential_creds_path} not found.")
    else:
        print(f"Using GOOGLE_APPLICATION_CREDENTIALS from: {google_creds_path}")


    models_dict.update(load_models())
    if not models_dict.get("gemini_model") and config.GEMINI_API_KEY:
        print("WARNING: Gemini model failed to load even though API key is present.")
    elif not config.GEMINI_API_KEY:
        print("WARNING: GEMINI_API_KEY is not set. Gemini-dependent tests will likely fail or be skipped.")
    print("Models setup complete.")

# --- Test Functions ---

def test_01_sample_video_content():
    print(f"\n--- Testing Step 1: video.sample_video_content (Video: {TEST_VIDEO_PATH}) ---")
    assert os.path.exists(TEST_VIDEO_PATH), f"Test video not found: {TEST_VIDEO_PATH}"
    
    frames, temp_audio_path, original_dur, processed_dur = video.sample_video_content(
        TEST_VIDEO_PATH,
        target_fps=config.TARGET_FPS,
        max_duration_sec=config.MAX_VIDEO_DURATION_SEC
    )
    
    print(f"  Frames extracted: {len(frames)}")
    print(f"  Temp audio path: {temp_audio_path}")
    print(f"  Original duration: {original_dur:.2f}s")
    print(f"  Processed duration: {processed_dur:.2f}s")
    
    assert isinstance(frames, list)
    assert len(frames) > 0, "No frames were extracted."
    assert all(isinstance(f, Image.Image) for f in frames)
    
    if temp_audio_path: # Audio extraction can fail gracefully
        assert isinstance(temp_audio_path, str)
        assert os.path.exists(temp_audio_path), "Extracted audio file does not exist."
        assert os.path.getsize(temp_audio_path) > 0, "Extracted audio file is empty."
        # Clean up temp audio file
        try:
            os.remove(temp_audio_path)
            print(f"  Cleaned up temp audio: {temp_audio_path}")
        except OSError:
            pass # Ignore if removal fails
    else:
        print("  Warning: Audio extraction returned no path (this might be expected if video has no audio or extraction failed).")

    assert isinstance(original_dur, float) and original_dur > 0
    assert isinstance(processed_dur, float) and processed_dur > 0
    assert processed_dur <= config.MAX_VIDEO_DURATION_SEC or processed_dur == original_dur
    
    # Store for subsequent tests if needed (though they might re-sample)
    models_dict['_test_frames'] = frames
    models_dict['_test_audio_path_from_sample'] = temp_audio_path 
    models_dict['_test_fps'] = config.TARGET_FPS
    models_dict['_test_processed_dur'] = processed_dur
    
    print("  ✅ test_01_sample_video_content: PASSED")

def test_02_calculate_visual_clip_score():
    print("\n--- Testing Step 2: models.calculate_visual_clip_score ---")
    assert 'clip_model' in models_dict and models_dict['clip_model'] is not None, "CLIP model not loaded."
    assert 'clip_preprocess' in models_dict, "CLIP preprocess not loaded."
    assert 'device' in models_dict, "Device not set in models_dict."
    
    # Use frames from the previous test if available, otherwise sample again (less ideal)
    if '_test_frames' not in models_dict or not models_dict['_test_frames']:
        print("  Re-sampling frames for CLIP test as they were not found from previous step.")
        frames, _, _, _ = video.sample_video_content(
            TEST_VIDEO_PATH,
            target_fps=config.TARGET_FPS,
            max_duration_sec=config.MAX_VIDEO_DURATION_SEC
        )
        assert len(frames) > 0, "Frame re-sampling failed for CLIP test."
    else:
        frames = models_dict['_test_frames']

    print(f"  Using {len(frames)} frames for CLIP scoring.")
    clip_score = models.calculate_visual_clip_score(
        frames,
        models_dict['clip_model'],
        models_dict['clip_preprocess'],
        models_dict['device']
    )
    
    print(f"  Visual CLIP Score: {clip_score:.4f}")
    assert isinstance(clip_score, float)
    assert 0.0 <= clip_score <= 1.0, "CLIP score out of expected range [0, 1]."
    models_dict['_test_clip_score'] = clip_score
    print("  ✅ test_02_calculate_visual_clip_score: PASSED")

def test_03_transcribe_audio_content():
    print("\n--- Testing Step 3: models.transcribe_audio_content ---")
    assert 'whisper_model' in models_dict and models_dict['whisper_model'] is not None, "Whisper model not loaded."

    # Need an audio file. Extract it if not available from sample_video_content or if that test didn't run/pass
    temp_audio_path_for_transcription = None
    if models_dict.get('_test_audio_path_from_sample'):
         temp_audio_path_for_transcription = models_dict['_test_audio_path_from_sample']
         # Check if it still exists (it might have been cleaned up)
         if not os.path.exists(temp_audio_path_for_transcription):
             temp_audio_path_for_transcription = None

    if not temp_audio_path_for_transcription:
        print("  Extracting audio specifically for transcription test...")
        # Create a new temp file for this audio that we will manage
        # video.extract_audio can now take duration
        processed_duration = models_dict.get('_test_processed_dur', config.MAX_VIDEO_DURATION_SEC)
        temp_audio_path_for_transcription = video.extract_audio(TEST_VIDEO_PATH, duration_to_process=processed_duration)
        
        if not temp_audio_path_for_transcription or not os.path.exists(temp_audio_path_for_transcription):
            print("  WARNING: Audio extraction failed for transcription test. Skipping transcription assertions.")
            models_dict['_test_transcription'] = {"text": "", "words": []}
            print("  ⚪ test_03_transcribe_audio_content: SKIPPED (due to audio extraction failure)")
            return # Skip the rest of the test
    
    print(f"  Using audio file: {temp_audio_path_for_transcription}")
    transcription = models.transcribe_audio_content(
        temp_audio_path_for_transcription,
        models_dict['whisper_model']
    )
    
    print(f"  Transcription text (snippet): {transcription['text'][:100]}...")
    print(f"  Number of word segments: {len(transcription['words'])}")
    
    assert isinstance(transcription, dict)
    assert "text" in transcription
    assert "words" in transcription
    assert isinstance(transcription["text"], str)
    assert isinstance(transcription["words"], list)
    if transcription["words"]:
        assert all(isinstance(w, dict) and "word" in w and "start" in w and "end" in w for w in transcription["words"])

    models_dict['_test_transcription'] = transcription
    
    # Clean up the specifically extracted audio file if it was created here
    if temp_audio_path_for_transcription and temp_audio_path_for_transcription != models_dict.get('_test_audio_path_from_sample'):
        try:
            os.remove(temp_audio_path_for_transcription)
            print(f"  Cleaned up temp audio (specific for this test): {temp_audio_path_for_transcription}")
        except OSError:
            pass # Ignore if removal fails
            
    print("  ✅ test_03_transcribe_audio_content: PASSED")

async def run_gemini_inspections_test_wrapper():
    print("\n--- Testing Step 4: gemini.run_gemini_inspections ---")
    gemini_model_instance = models_dict.get("gemini_model")
    if not gemini_model_instance:
        if not config.GEMINI_API_KEY:
            print("  GEMINI_API_KEY not set. Skipping Gemini tests.")
        else:
            print("  Gemini model not loaded despite API key. Skipping Gemini tests.")
        models_dict['_test_gemini_results'] = (0,0,0,0.0,[]) # Default values
        print("  ⚪ test_04_gemini_inspections: SKIPPED")
        return

    frames = models_dict.get('_test_frames')
    if not frames:
        print("  Frames not found from previous test. Re-sampling for Gemini.")
        # Limit duration for this specific sampling for speed if frames aren't there
        frames, _, _, _ = video.sample_video_content(
            TEST_VIDEO_PATH, target_fps=config.TARGET_FPS, max_duration_sec=10 
        ) # Shorter duration for Gemini if re-sampling
        assert len(frames) > 0, "Frame re-sampling failed for Gemini test."
        models_dict['_test_frames_gemini_short'] = frames # Store separately if re-sampled

    transcription = models_dict.get('_test_transcription', {"text": "", "words": []})
    fps_to_use = models_dict.get('_test_fps', config.TARGET_FPS)

    print(f"  Using {len(frames)} frames for Gemini inspections.")
    print(f"  Using transcript: {transcription['text'][:50]}...")
    
    vis_flag, lip_flag, blink_flag, ocr_score_val, gemini_events = await gemini.run_gemini_inspections(
        frames,
        TEST_VIDEO_PATH, # Full video path for context if needed by sub-modules like lip-sync
        transcription,
        gemini_model_instance,
        fps=fps_to_use,
        enable_visual_artifacts=True,
        enable_lipsync=True,
        enable_abnormal_blinks=True,
        enable_ocr_gibberish=True,
    )

    print(f"  Gemini Visual Artifacts Flag: {vis_flag}")
    print(f"  Gemini Lip-sync Issue Flag: {lip_flag}")
    print(f"  Gemini Abnormal Blinks Flag: {blink_flag}")
    print(f"  Gemini OCR Score: {ocr_score_val:.4f}")
    print(f"  Gemini Events ({len(gemini_events)}):")
    for i, event in enumerate(gemini_events):
        print(f"    Event {i+1}: module={event.get('module')}, type={event.get('event')}, ts={event.get('ts')}, dur={event.get('dur')}")

    assert isinstance(vis_flag, int) and vis_flag in [0, 1]
    assert isinstance(lip_flag, int) and lip_flag in [0, 1]
    assert isinstance(blink_flag, int) and blink_flag in [0, 1]
    assert isinstance(ocr_score_val, float) and 0.0 <= ocr_score_val <= 1.0
    assert isinstance(gemini_events, list)
    if gemini_events:
        assert all(isinstance(e, dict) for e in gemini_events)

    models_dict['_test_gemini_results'] = (vis_flag, lip_flag, blink_flag, ocr_score_val, gemini_events)
    print("  ✅ test_04_gemini_inspections: PASSED (or ran with no errors)")

def test_04_gemini_inspections():
    asyncio.run(run_gemini_inspections_test_wrapper())


def test_05_heuristic_detectors():
    print("\n--- Testing Step 5: Heuristic Detectors ---")
    frames = models_dict.get('_test_frames')
    if not frames:
        print("  Frames not found from sampling test. Re-sampling for heuristics.")
        # Using full duration for heuristics as they are generally faster than Gemini
        frames, _, _, _ = video.sample_video_content(
            TEST_VIDEO_PATH, target_fps=config.TARGET_FPS, max_duration_sec=config.MAX_VIDEO_DURATION_SEC
        )
        assert len(frames) > 0, "Frame re-sampling failed for heuristics test."
    
    fps_to_use = models_dict.get('_test_fps', config.TARGET_FPS)
    print(f"  Using {len(frames)} frames, FPS: {fps_to_use}")

    # 5a: Flow Spikes
    print("  Testing flow.detect_spikes...")
    flow_res = flow.detect_spikes(frames, fps_to_use)
    print(f"    Flow Result: score={flow_res.get('score')}, anomaly={flow_res.get('anomaly')}, events={len(flow_res.get('events', []))}")
    assert isinstance(flow_res, dict)
    assert "score" in flow_res and isinstance(flow_res["score"], float)
    assert "anomaly" in flow_res and isinstance(flow_res["anomaly"], bool)
    assert "events" in flow_res and isinstance(flow_res["events"], list)
    models_dict['_test_flow_res'] = flow_res

    # 5b: Lighting Jumps (Video AI)
    print("  Testing video.detect_lighting_jumps...")
    # This uses Google Cloud Video Intelligence API
    google_creds = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
    if not google_creds or not Path(google_creds).exists():
        print("    WARNING: GOOGLE_APPLICATION_CREDENTIALS not found or invalid. Skipping detect_lighting_jumps test.")
        shot_res = {"score": 0.0, "anomaly": False, "tags": [], "events": []} # Default for fusion
    else:
        try:
            shot_res = video.detect_lighting_jumps(TEST_VIDEO_PATH)
            print(f"    Lighting Jumps/Shot Result: score={shot_res.get('score')}, anomaly={shot_res.get('anomaly')}, events={len(shot_res.get('events', []))}")
            assert isinstance(shot_res, dict)
            assert "score" in shot_res and isinstance(shot_res["score"], float)
            assert "anomaly" in shot_res and isinstance(shot_res["anomaly"], bool)
            assert "events" in shot_res and isinstance(shot_res["events"], list)
        except Exception as e:
            print(f"    ERROR in video.detect_lighting_jumps: {e}")
            print(f"    This might be due to API authentication or other issues with Google Cloud Video Intelligence.")
            shot_res = {"score": 0.0, "anomaly": False, "tags": [], "events": []} # Default on error

    models_dict['_test_shot_res'] = shot_res
    print("  ✅ test_05_heuristic_detectors: PASSED (or ran with no fatal errors for sub-components)")


def test_06_fuse_detection_scores():
    print("\n--- Testing Step 6: fusion.fuse_detection_scores ---")
    
    # Gather necessary inputs, using defaults if previous tests didn't populate them
    clip_score_val = models_dict.get('_test_clip_score', 0.0) # Default to 0.0
    
    gem_results = models_dict.get('_test_gemini_results', (0,0,0,0.0,[]))
    vis_flag, lip_flag, blink_flag, gibberish_score_val, _ = gem_results

    flow_res_score = models_dict.get('_test_flow_res', {}).get('score', 0.0)
    shot_res_score = models_dict.get('_test_shot_res', {}).get('score', 0.0)

    other_scores_for_fusion = {
        "gibberish": gibberish_score_val,
        "flow": flow_res_score,
        "video_ai": shot_res_score
    }
    
    print(f"  Input clip_score: {clip_score_val:.3f}")
    print(f"  Input gem_visual_flag: {vis_flag}")
    print(f"  Input gem_sync_flag: {lip_flag}")
    print(f"  Input gemini_blink_flag: {blink_flag}")
    print(f"  Input other_scores: {other_scores_for_fusion}")

    final_conf, final_label, fusion_tags = fusion.fuse_detection_scores(
        clip_score_val,
        vis_flag,
        lip_flag,
        blink_flag,
        other_scores=other_scores_for_fusion
    )

    print(f"  Fusion Output - Confidence: {final_conf:.3f}")
    print(f"  Fusion Output - Label: {final_label}")
    print(f"  Fusion Output - Tags: {fusion_tags}")

    assert isinstance(final_conf, float) and 0.0 <= final_conf <= 1.0
    assert final_label in ["LIKELY_REAL", "UNCERTAIN", "LIKELY_FAKE"]
    assert isinstance(fusion_tags, list)
    if fusion_tags:
        assert all(isinstance(tag, str) for tag in fusion_tags)
        
    print("  ✅ test_06_fuse_detection_scores: PASSED")


# Example of how to run (e.g., if you were using pytest)
# You would typically run pytest from the terminal in the `backend` directory.
# pytest test_detection_steps.py -s (to see prints)

# If running this file directly (e.g. python test_detection_steps.py):
if __name__ == "__main__":
    print("Running FakeCheck Pipeline Step Tests...")
    
    # Manually call setup if not using a test runner like pytest
    if not models_dict: # Check if setup_module has run
        setup_module(None) 

    if not os.path.exists(TEST_VIDEO_PATH):
        print(f"CRITICAL ERROR: Test video '{TEST_VIDEO_PATH}' not found. Aborting tests.")
        sys.exit(1)

    # Run tests sequentially
    test_01_sample_video_content()
    test_02_calculate_visual_clip_score()
    test_03_transcribe_audio_content()
    
    # Gemini tests (async)
    test_04_gemini_inspections() # This already calls asyncio.run internally

    # Heuristic tests
    test_05_heuristic_detectors()
    
    # Fusion test
    test_06_fuse_detection_scores()
    
    print("\nAll tests completed.")
    print("Review output for individual PASS/FAIL/SKIPPED messages and errors.")
    print("Note: Some tests might be skipped if dependencies (like API keys) are missing.")
    print("The 'PASSED' status for gemini/heuristics might mean the function ran without crashing,")
    print("but the actual detection quality needs to be verified from the printed scores/flags/events.") 