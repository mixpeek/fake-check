# Gemini-powered detectors (visual artefacts, abnormal blinks, lip-sync,
# gibberish-text OCR) plus helper glue.
#
# All calls hitting the Gemini Generative AI API live here, so the rest of
# the pipeline never touches the network for Gemini directly.
#
# version tag (helps when bug-reports include stdout):
GEMINI_PY_VERSION = "2.0_events_ocr_integration"

import os, sys, base64, tempfile, asyncio, functools, logging, time, re
from typing import List, Tuple, Dict, Any
from io import BytesIO

import requests
import ffmpeg
from PIL import Image
from langdetect import detect_langs
from google.api_core import exceptions as _gax_exc
import numpy as np

# ───────────────────────── logging ──────────────────────────
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# 1) Async-client protobuf bug work-around
async def safe_generate_content(model, content, *, max_retries: int = 2):
    """
    Call model.generate_content_async(content).  Works around the protobuf
    '__await__' bug and retries on transient connection resets.
    """
    fn_name = "safe_generate_content" # For logging context
    attempt = 0
    while True:
        try:
            # logger.debug(f"[{fn_name}] Attempt {attempt+1}: Calling model.generate_content_async.")
            return await model.generate_content_async(content)
        except AttributeError as e:
            if "Unknown field" not in str(e):
                logger.error(f"[{fn_name}] Unexpected AttributeError: {e}", exc_info=True)
                raise                 # different bug → re-raise
            
            # Protobuf bug fall-back
            logger.warning(f"[{fn_name}] AttributeError 'Unknown field' detected. Attempting sync fallback via run_in_executor.")
            loop = asyncio.get_running_loop()
            try:
                sync_call_t0 = time.monotonic()
                result = await loop.run_in_executor(None,
                        functools.partial(model.generate_content, content))
                sync_call_t1 = time.monotonic()
                logger.info(f"[{fn_name}] Sync fallback call via run_in_executor completed in {sync_call_t1 - sync_call_t0:.2f}s.")
                return result
            except Exception as exec_e:
                logger.error(f"[{fn_name}] Exception during sync fallback: {exec_e}", exc_info=True)
                raise exec_e # Re-raise the exception from the executor

        except requests.exceptions.ConnectionError as e:
            logger.warning(f"[{fn_name}] ConnectionError: {e}")
            if attempt >= max_retries:
                logger.error(f"[{fn_name}] Max retries ({max_retries}) reached for ConnectionError. Raising.")
                raise                 # bubble out after N retries
            attempt += 1
            wait = 3 ** attempt
            logger.info(f"[{fn_name}] Connection reset – retry {attempt+1}/{max_retries+1} (current attempt {attempt}) in {wait}s.") # Corrected retry logging
            await asyncio.sleep(wait) # Non-blocking sleep
            continue
        except _gax_exc.GoogleAPICallError as e:
            logger.error(f"[{fn_name}] GoogleAPICallError: {e}. Propagating.", exc_info=True)
            raise                     # real API error → propagate
        except Exception as e_gen: # Catch any other unexpected exceptions
            logger.error(f"[{fn_name}] Unexpected exception: {type(e_gen).__name__}: {e_gen}", exc_info=True)
            raise

# 2) Generic helpers
def _pil_to_b64_jpeg(img: Image.Image) -> str:
    buf = BytesIO()
    img.save(buf, format="JPEG", quality=85)
    return base64.b64encode(buf.getvalue()).decode()

async def _run_ffmpeg_probe(video_path: str) -> Dict[str, Any]:
    def _sync():
        try:
            return ffmpeg.probe(video_path)
        except ffmpeg.Error as e:
            stderr_output = e.stderr.decode('utf-8') if e.stderr else 'No stderr output'
            print(f"FFmpeg probe failed: {stderr_output}", file=sys.stderr)
            raise RuntimeError(f"FFmpeg probe failed: {stderr_output}")
    
    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(None, _sync)

async def _run_ffmpeg_extract(video_path: str, start: float,
                              dur: float, out_path: str):
    def _sync():
        try:
            (ffmpeg
             .input(video_path, ss=start, t=dur)
             .output(out_path, vcodec="libx264", acodec="aac",
                     strict="experimental", loglevel="error")
             .overwrite_output()
             .run(capture_stdout=True, capture_stderr=True))
        except ffmpeg.Error as e:
            # Log the FFmpeg error but don't raise - let the caller handle the missing file
            stderr_output = e.stderr.decode('utf-8') if e.stderr else 'No stderr output'
            print(f"FFmpeg extraction failed: {stderr_output}", file=sys.stderr)
            raise RuntimeError(f"FFmpeg extraction failed: {stderr_output}")
    
    loop = asyncio.get_running_loop()
    await loop.run_in_executor(None, _sync)

def _pick_frames(frames: List[Image.Image], num_frames_to_pick: int = 12) -> List[Image.Image]:
    """
    Selects a specified number of evenly-spaced frames from a list.
    """
    n = len(frames)
    if n <= num_frames_to_pick:
        return frames
    # Use np.linspace to get evenly spaced indices, then convert to int and remove duplicates
    indices = sorted(list(set(np.linspace(0, n - 1, num=num_frames_to_pick, dtype=int))))
    return [frames[i] for i in indices]

def _extract_text(resp, fn=""):
    # Prioritize checking candidates and their parts, which is more robust
    if hasattr(resp, "candidates") and resp.candidates:
        for cand in resp.candidates:
            if hasattr(cand, "content") and hasattr(cand.content, "parts") and cand.content.parts:
                all_text_parts = []
                for p in cand.content.parts:
                    if hasattr(p, "text") and p.text:
                        all_text_parts.append(p.text)
                if all_text_parts:
                    return " ".join(all_text_parts).strip().upper()
                else: # No text parts found in this candidate
                    if hasattr(cand, "safety_ratings"):
                        print(f"GEMINI_DEBUG ({fn}): No text parts in candidate. Safety ratings: {cand.safety_ratings}", file=sys.stderr)
            elif hasattr(cand, "safety_ratings"): # Candidate has no content parts but has safety ratings
                 print(f"GEMINI_DEBUG ({fn}): Candidate has no content parts. Safety ratings: {cand.safety_ratings}", file=sys.stderr)
    
    # Fallback attempt for simpler responses, but be wary of potential ValueErrors if no valid Part
    # This was the original source of the ValueError if response was blocked or malformed.
    # By checking candidates first, we reduce reliance on this.
    try:
        if hasattr(resp, "text") and resp.text: # Check if text attribute exists and is not None/empty
            return resp.text.strip().upper()
    except ValueError as e:
        # This can happen if .text is accessed on a response with no valid text part (e.g. blocked)
        print(f"GEMINI_DEBUG ({fn}): ValueError accessing .text for response: {e}", file=sys.stderr)
        pass # Fall through to return empty string

    print(f"GEMINI_DEBUG ({fn}): no usable text in response (checked candidates and direct .text)", file=sys.stderr)
    return ""

def _log_exc(fn, exc):
    print(f"GEMINI_ERROR ({fn}): {exc}", file=sys.stderr)
    import traceback; traceback.print_exc(file=sys.stderr)

# ───────────────────────── OCR helpers ───────────────────────
_WORD_RE = re.compile(r"[A-Za-z0-9]+")


def _english_ppl_proxy(text: str) -> float:
    """
    Super-cheap perplexity proxy: percentage of 'non-word-like' tokens.
    """
    words = _WORD_RE.findall(text)
    if not words:
        return 999.0
    non_words = [w for w in words if len(w) > 15 or not w.isalpha()]
    return (len(non_words) / len(words)) * 100

# 3) Individual Gemini checks
async def gemini_check_visual_artifacts(frames: List[Image.Image], model) -> int:
    fn = "gemini_check_visual_artifacts"
    if not model or not frames:
        return 0
    
    prompt = (
        "Analyze the following video frames for any signs of AI manipulation or deepfake artifacts. "
        "Pay close attention to subtle inconsistencies. Specifically look for:\n"
        "- Warping or distortion in the background, especially around the person's head.\n"
        "- Unnatural skin texture (too smooth or waxy).\n"
        "- Flickering or strange artifacts around the edges of the face or hair.\n"
        "- Inconsistent lighting or shadows on the face compared to the environment.\n"
        "- Any unusual 'morphing' or 'melting' effects between frames.\n\n"
        "Based on your analysis, are there visual artifacts that suggest this is a deepfake? "
        "Respond with only YES or NO."
    )

    parts = [prompt] + [
        {"mime_type": "image/jpeg", "data": _pil_to_b64_jpeg(f)}
        for f in _pick_frames(frames)
    ]
    try:
        resp = await safe_generate_content(model, parts)
        text = _extract_text(resp, fn)

        print(f"GEMINI_REPLY ({fn}): {text}", file=sys.stderr)

        return 1 if "YES" in text else 0
    except Exception as e:
        _log_exc(fn, e); return 0

async def gemini_check_abnormal_blinks(frames: List[Image.Image], model) -> int:
    fn = "gemini_check_abnormal_blinks"
    if not model or not frames:
        return 0
    prompt = ("Inspect the eyes in these frames, which are sampled sequentially from a video. "
              "Does the person blink? If so, is the blinking pattern "
              "abnormal or unnatural (e.g., no blinking, eyes closed for too long, fluttering)? "
              "Respond YES for abnormal blinking, NO otherwise. Only respond with YES or NO.")
    parts = [prompt] + [
        {"mime_type": "image/jpeg", "data": _pil_to_b64_jpeg(f)}
        for f in _pick_frames(frames)
    ]
    try:
        resp = await safe_generate_content(model, parts)
        text = _extract_text(resp, fn)
        
        print(f"GEMINI_REPLY ({fn}): {text}", file=sys.stderr)
        
        return 1 if "YES" in text else 0
    except Exception as e:
        _log_exc(fn, e); return 0

async def gemini_check_lipsync(video_path: str, transcript: Dict[str, Any] | str,
                               model) -> Dict[str, Any]:
    """
    Extract a 2-second voiced clip and ask Gemini if lips are synced.
    Returns a dictionary with a flag and an optional event.
    This function now operates pessimistically: it flags an issue (returns flag=1)
    if any part of the check fails, and only returns flag=0 on explicit success.
    """
    fn = "gemini_check_lipsync"
    flag = 1  # Default to 1 (issue detected) until proven otherwise
    lip_sync_event = None

    if not model:
        logger.warning(f"[{fn}] No model provided, cannot perform check.")
        return {"flag": 0, "event": None} # Return 0 if model is disabled entirely

    # --- 1. Validate that we have a usable transcript ---
    transcript_to_use = ""
    if isinstance(transcript, dict) and "text" in transcript:
        transcript_to_use = transcript.get("text", "").strip()
    elif isinstance(transcript, str):
        transcript_to_use = transcript.strip()

    if not transcript_to_use or "[No speech detected]" in transcript_to_use or "[Non-English language detected" in transcript_to_use:
        logger.warning(f"[{fn}] No meaningful transcript for lipsync check ('{transcript_to_use[:50]}...'). Flagging as issue.")
        lip_sync_event = {
            "module": "lip_sync", "event": "check_failed", "ts": 0.0, "dur": 0.0,
            "meta": {"reason": "No valid transcript for comparison."}
        }
        return {"flag": flag, "event": lip_sync_event}

    tmp_clip = tempfile.NamedTemporaryFile(suffix=".mp4", delete=False).name
    try:
        # --- 2. Prepare clip and transcript segment ---
        try:
            duration = float((await _run_ffmpeg_probe(video_path))["format"]["duration"])
        except RuntimeError as probe_error:
            logger.warning(f"[{fn}] FFmpeg probe failed: {probe_error}. Skipping lipsync check.")
            lip_sync_event = {
                "module": "lip_sync", "event": "check_failed", 
                "ts": 0.0, "dur": 0.0,
                "meta": {"reason": "Could not read video metadata."}
            }
            return {"flag": 1, "event": lip_sync_event}
            
        clip_len, start_time = 2.0, 0.0
        transcript_segment = transcript_to_use[:500]

        if isinstance(transcript, dict) and transcript.get("words"):
            words = transcript["words"]
            if words:
                first_word_start = words[0].get("start", 0.0)
                start_time = first_word_start
                end_time = first_word_start + clip_len
                words_in_seg = [w["word"] for w in words if first_word_start <= w.get("start", 0) <= end_time]
                transcript_segment = " ".join(words_in_seg)
        
        try:
            await _run_ffmpeg_extract(video_path, start_time, clip_len, tmp_clip)
        except RuntimeError as ffmpeg_error:
            # FFmpeg extraction failed (likely no audio track or corrupted audio)
            logger.warning(f"[{fn}] FFmpeg extraction failed: {ffmpeg_error}. Skipping lipsync check.")
            lip_sync_event = {
                "module": "lip_sync", "event": "check_failed", 
                "ts": round(start_time, 2), "dur": round(clip_len, 2),
                "meta": {"reason": "Video has no audio track or audio extraction failed."}
            }
            return {"flag": 1, "event": lip_sync_event}

        if not os.path.exists(tmp_clip) or os.path.getsize(tmp_clip) == 0:
            logger.warning(f"[{fn}] FFmpeg created empty or missing clip file. Skipping lipsync check.")
            lip_sync_event = {
                "module": "lip_sync", "event": "check_failed",
                "ts": round(start_time, 2), "dur": round(clip_len, 2),
                "meta": {"reason": "FFmpeg failed to create a valid video clip."}
            }
            return {"flag": 1, "event": lip_sync_event}

        # --- 3. Ask Gemini for analysis ---
        clip_b64 = base64.b64encode(open(tmp_clip, "rb").read()).decode()
        prompt = ("Watch the clip and read the transcript. "
                  "Are the person's lip movements accurately synchronized with the spoken words in the transcript? "
                  "Respond with only YES for synced, or NO for not synced.")
        parts = [prompt, {"mime_type": "video/mp4", "data": clip_b64}, {"text": transcript_segment}]

        resp = await safe_generate_content(model, parts)
        text = _extract_text(resp, fn)
        logger.debug(f"GEMINI_REPLY ({fn}): {text}")
        
        # --- 4. Process Gemini's response ---
        if "YES" in text:
            flag = 0  # This is the only path to a "no issue" result
        elif "NO" in text:
            # Flag is already 1, just create the specific event
            lip_sync_event = {
                "module": "lip_sync", "event": "gemini_desync",
                "ts": round(start_time, 2), "dur": round(clip_len, 2),
                "meta": {"transcript_segment": transcript_segment[:100]}
            }
        else:
            # Ambiguous response, treat as a failure to confirm sync
            logger.warning(f"[{fn}] Ambiguous Gemini response: '{text}'. Flagging as issue.")
            lip_sync_event = {
                "module": "lip_sync", "event": "check_failed",
                "ts": round(start_time, 2), "dur": round(clip_len, 2),
                "meta": {"reason": "Ambiguous response from Gemini.", "response": text}
            }

    except Exception as e:
        _log_exc(fn, e)
        # Exception occurred, ensure we flag it as an issue.
        flag = 1
        lip_sync_event = {
            "module": "lip_sync", "event": "check_failed",
            "ts": 0.0, "dur": 0.0,
            "meta": {"reason": f"An exception occurred during the check: {type(e).__name__}"}
        }
    finally:
        if os.path.exists(tmp_clip):
            os.remove(tmp_clip)
    
    return {"flag": flag, "event": lip_sync_event}

async def gemini_detect_gibberish(
    frames: List[Image.Image],
    fps: float,
    model
) -> Dict[str, Any]:
    """
    Use Gemini to check for gibberish text directly from frames.
    Returns the standard detector dict with .events list.
    """
    fn = "gemini_detect_gibberish"
    logger.info(f"[{fn}] Starting direct gibberish detection. Original frame count: {len(frames)}.")
    events: List[Dict[str, Any]] = []
    if not model or not frames:
        logger.warning(f"[{fn}] No model or no frames. Skipping.")
        return {"score": 0.0, "anomaly": False, "tags": [], "events": []}

    MAX_OCR_FRAMES_TO_PROCESS = 10
    selected_frames_with_indices: List[Tuple[int, Image.Image]] = []

    if len(frames) <= MAX_OCR_FRAMES_TO_PROCESS:
        selected_frames_with_indices = list(enumerate(frames))
    else:
        indices_to_pick = np.linspace(0, len(frames) - 1, num=MAX_OCR_FRAMES_TO_PROCESS, dtype=int)
        unique_indices = sorted(list(set(indices_to_pick)))
        selected_frames_with_indices = [(i, frames[i]) for i in unique_indices]
        if len(selected_frames_with_indices) > MAX_OCR_FRAMES_TO_PROCESS:
            selected_frames_with_indices = selected_frames_with_indices[:MAX_OCR_FRAMES_TO_PROCESS]

    logger.info(f"[{fn}] Processing {len(selected_frames_with_indices)} selected frames for gibberish check.")
    frames_successfully_processed_count = 0
    gibberish_found_count = 0

    for frame_counter, (original_idx, frame) in enumerate(selected_frames_with_indices):
        logger.debug(f"[{fn}] Checking for gibberish in selected frame {frame_counter+1}/{len(selected_frames_with_indices)} (original index: {original_idx}).")
        
        prompt = (
            "Examine the image for any text. Is the text nonsensical, gibberish, "
            "or clearly corrupted (e.g., random characters, garbled words)? "
            "Respond with only YES or NO."
        )
        parts = [
            prompt,
            {"mime_type": "image/jpeg", "data": _pil_to_b64_jpeg(frame)},
        ]
        try:
            call_t0 = time.monotonic()
            resp = await safe_generate_content(model, parts)
            call_t1 = time.monotonic()
            logger.debug(f"[{fn}] API call for frame {original_idx} took {call_t1 - call_t0:.2f}s.")

            text_response = _extract_text(resp, fn).strip()
            logger.debug(f"[{fn}] Gemini response for frame {original_idx}: '{text_response}'")

            if "YES" in text_response:
                gibberish_found_count += 1
                ts = round(original_idx / fps, 2)
                events.append({
                    "module": "gibberish_text",
                    "event": "gibberish_text_detected",
                    "ts": ts,
                    "dur": 0.0,
                    "meta": {"response": text_response}
                })
            
            frames_successfully_processed_count += 1

        except Exception as e:
            logger.error(f"[{fn}] Error processing gibberish check for frame {original_idx}: {e}", exc_info=True)

    logger.info(f"[{fn}] Finished gibberish check. Processed {frames_successfully_processed_count}/{len(selected_frames_with_indices)} frames. Found gibberish in {gibberish_found_count} frames.")
    
    # The score is proportional to the number of frames with gibberish.
    score = (gibberish_found_count / len(selected_frames_with_indices)) if selected_frames_with_indices else 0.0

    return {
        "score": score,
        "anomaly": bool(events),
        "tags": ["gibberish_text"] if events else [],
        "events": events,
    }

# 4) Orchestrator with enable_* flags
async def run_gemini_inspections(
    frames: List[Image.Image],
    video_path: str,
    transcript: str,
    model,
    fps: float,
    *,
    enable_visual_artifacts: bool = True,
    enable_lipsync: bool = True,
    enable_abnormal_blinks: bool = True,
    enable_ocr_gibberish: bool = True,
) -> Tuple[int, int, int, float, List[Dict[str, Any]]]:
    """
    Runs all desired Gemini checks.  Returns:
        (visual_flag, lipsync_flag, blink_flag, gibberish_score, all_gemini_events)
    """
    fn_orchestrator = "run_gemini_inspections"
    logger.info(f"[{fn_orchestrator}] Starting inspections.")
    if not model:
        logger.warning(f"[{fn_orchestrator}] No model provided. Returning default values.")
        return 0, 0, 0, 0.0, []

    tasks_coroutines = [] # Stores the coroutine objects
    keys = []

    if enable_visual_artifacts:
        logger.info(f"[{fn_orchestrator}] Preparing gemini_check_visual_artifacts task.")
        tasks_coroutines.append(gemini_check_visual_artifacts(frames, model))
        keys.append("vis")
    if enable_lipsync:
        logger.info(f"[{fn_orchestrator}] Preparing gemini_check_lipsync task.")
        tasks_coroutines.append(gemini_check_lipsync(video_path, transcript, model))
        keys.append("lip")
    if enable_abnormal_blinks:
        logger.info(f"[{fn_orchestrator}] Preparing gemini_check_abnormal_blinks task.")
        tasks_coroutines.append(gemini_check_abnormal_blinks(frames, model))
        keys.append("blink")
    if enable_ocr_gibberish:
        logger.info(f"[{fn_orchestrator}] Preparing gemini_detect_gibberish task.")
        tasks_coroutines.append(gemini_detect_gibberish(frames, fps=fps, model=model))
        keys.append("gibberish")

    if not tasks_coroutines:
        logger.warning(f"[{fn_orchestrator}] No tasks enabled. Returning default values.")
        return 0, 0, 0, 0.0, []

    results_list = [] # Stores the actual results or exceptions
    logger.info(f"[{fn_orchestrator}] Sequentially awaiting {len(tasks_coroutines)} tasks: {keys}")
    for i, task_coro in enumerate(tasks_coroutines):
        key = keys[i]
        logger.info(f"[{fn_orchestrator}] Attempting to await task: {key} (index {i})")
        try:
            result = await task_coro
            results_list.append(result)
            logger.info(f"[{fn_orchestrator}] Successfully awaited task: {key}")
        except Exception as e:
            logger.error(f"[{fn_orchestrator}] Exception while awaiting task {key}: {type(e).__name__} - {e}", exc_info=True)
            results_list.append(e) # Store exception to be processed like gather does
    
    logger.info(f"[{fn_orchestrator}] All tasks awaited individually. Results count: {len(results_list)}")

    vis = blink = 0
    lip_flag = 0
    gibberish_score_val = 0.0
    all_gemini_events: List[Dict[str, Any]] = []

    for i, (key, res) in enumerate(zip(keys, results_list)):
        logger.info(f"[{fn_orchestrator}] Processing result for task '{key}' (index {i}).")
        if isinstance(res, Exception):
            # Exception already logged during await, can add more details or specific handling here if needed
            logger.warning(f"[{fn_orchestrator}] Task '{key}' previously resulted in an exception. Using default values.")
            if key == "vis": vis = 0
            elif key == "lip": lip_flag = 0
            elif key == "blink": blink = 0
            elif key == "gibberish": gibberish_score_val = 0.0
            continue

        if key == "vis":
            vis = res
            logger.info(f"[{fn_orchestrator}] Result for 'vis': {vis}")
        elif key == "lip":
            if isinstance(res, dict): # Ensure res is a dict as expected
                lip_event = res.get("event")
                if lip_event:
                    all_gemini_events.append(lip_event)
                lip_flag = res.get("flag", 0)
                logger.info(f"[{fn_orchestrator}] Result for 'lip': flag={lip_flag}, event_present={bool(lip_event)}")
            else:
                logger.error(f"[{fn_orchestrator}] Unexpected result type for 'lip': {type(res)}. Expected dict. Setting flag to 0.")
                lip_flag = 0
        elif key == "blink":
            blink = res
            logger.info(f"[{fn_orchestrator}] Result for 'blink': {blink}")
        elif key == "gibberish":
            if isinstance(res, dict): # Ensure res is a dict as expected
                gibberish_dict = res
                gibberish_score_val = gibberish_dict.get("score", 0.0)
                gibberish_events_from_module = gibberish_dict.get("events", [])
                all_gemini_events.extend(gibberish_events_from_module)
                logger.info(f"[{fn_orchestrator}] Result for 'gibberish': score={gibberish_score_val}, events_count={len(gibberish_events_from_module)}")
            else:
                logger.error(f"[{fn_orchestrator}] Unexpected result type for 'gibberish': {type(res)}. Expected dict. Setting score to 0.")
                gibberish_score_val = 0.0

    logger.info(f"[{fn_orchestrator}] Finished processing all results. Returning: vis={vis}, lip_flag={lip_flag}, blink={blink}, gibberish_score={gibberish_score_val}, num_events={len(all_gemini_events)}")
    return vis, lip_flag, blink, gibberish_score_val, all_gemini_events