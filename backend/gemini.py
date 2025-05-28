# gemini.py  

import os, sys, base64, tempfile, asyncio, functools
from typing import List, Tuple, Any, Dict
from io import BytesIO
import time, requests                         

import ffmpeg
from PIL import Image
from google.api_core import exceptions as _gax_exc

GEMINI_PY_VERSION = "1.7_full_flags_async_fix"

# 1) Async-client protobuf bug work-around
async def safe_generate_content(model, content, *, max_retries: int = 2):
    """
    Call model.generate_content_async(content).  Works around the protobuf
    '__await__' bug and retries on transient connection resets.
    """
    attempt = 0
    while True:
        try:
            return await model.generate_content_async(content)
        except AttributeError as e:
            if "Unknown field" not in str(e):
                raise                 # different bug → re-raise
        except requests.exceptions.ConnectionError as e:
            if attempt >= max_retries:
                raise                 # bubble out after N retries
            attempt += 1
            wait = 3 ** attempt       # 2s, 4s back-off
            print(f"GEMINI_WARN: connection reset – retry {attempt}/{max_retries} in {wait}s",
                  file=sys.stderr)
            time.sleep(wait)
            continue
        except _gax_exc.GoogleAPICallError:
            raise                     # real API error → propagate

        # protobuf bug fall-back
        loop = asyncio.get_running_loop()
        return await loop.run_in_executor(None,
                functools.partial(model.generate_content, content))

# 2) Generic helpers
def _pil_to_b64_jpeg(img: Image.Image) -> str:
    buf = BytesIO()
    img.save(buf, format="JPEG", quality=85)
    return base64.b64encode(buf.getvalue()).decode()

async def _run_ffmpeg_probe(video_path: str) -> Dict[str, Any]:
    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(None, ffmpeg.probe, video_path)

async def _run_ffmpeg_extract(video_path: str, start: float,
                              dur: float, out_path: str):
    def _sync():
        (ffmpeg
         .input(video_path, ss=start, t=dur)
         .output(out_path, vcodec="libx264", acodec="aac",
                 strict="experimental", loglevel="error")
         .overwrite_output()
         .run(capture_stdout=True, capture_stderr=True))
    loop = asyncio.get_running_loop()
    await loop.run_in_executor(None, _sync)

def _pick_frames(frames: List[Image.Image]) -> List[Image.Image]:
    n = len(frames)
    if n <= 2:
        return frames
    return [frames[0], frames[n // 2], frames[-1]]

def _extract_text(resp, fn=""):
    if hasattr(resp, "text"):
        return resp.text.strip().upper()
    if hasattr(resp, "candidates"):
        for cand in resp.candidates:
            if hasattr(cand, "content") and hasattr(cand.content, "parts"):
                txts = [p.text for p in cand.content.parts if hasattr(p, "text")]
                if txts:
                    return " ".join(txts).strip().upper()
    print(f"GEMINI_DEBUG ({fn}): no usable text in response", file=sys.stderr)
    return ""

def _log_exc(fn, exc):
    print(f"GEMINI_ERROR ({fn}): {exc}", file=sys.stderr)
    import traceback; traceback.print_exc(file=sys.stderr)

# 3) Individual Gemini checks
async def gemini_check_visual_artifacts(frames: List[Image.Image], model) -> int:
    fn = "gemini_check_visual_artifacts"
    if not model or not frames:
        return 0
    prompt = ("Examine these frames. Do you see clear visual artifacts or "
              "distortions that strongly suggest AI deepfake? YES / NO.")
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
    prompt = ("Inspect the eyes in these frames. Is the blinking pattern "
              "abnormal or unnatural? Respond YES / NO.")
    parts = [prompt] + [
        {"mime_type": "image/jpeg", "data": _pil_to_b64_jpeg(f)}
        for f in _pick_frames(frames)
    ]
    try:
        resp = await safe_generate_content(model, parts)
        return 1 if "YES" in _extract_text(resp, fn) else 0
    except Exception as e:
        _log_exc(fn, e); return 0

async def gemini_check_lipsync(video_path: str, transcript: str,
                               model) -> int:
    fn = "gemini_check_lipsync"
    if not model or not transcript:
        return 0

    tmp_clip = tempfile.NamedTemporaryFile(suffix=".mp4", delete=False).name
    try:
        duration = float((await _run_ffmpeg_probe(video_path))
                         ["format"]["duration"])
        clip_len = min(2.0, duration)
        start = max(0.0, (duration - clip_len) / 2.0)
        await _run_ffmpeg_extract(video_path, start, clip_len, tmp_clip)

        clip_b64 = base64.b64encode(open(tmp_clip, "rb").read()).decode()
        prompt = ("Watch the clip and read the text. Are lip motions synced "
                  "with the speech? YES / NO.")
        parts = [prompt,
                 {"mime_type": "video/mp4", "data": clip_b64},
                 {"text": transcript[:500]}]

        resp = await safe_generate_content(model, parts)
        # Return 1 for mismatch
        return 1 if "NO" in _extract_text(resp, fn) else 0
    except Exception as e:
        _log_exc(fn, e); return 0
    finally:
        if os.path.exists(tmp_clip):
            os.remove(tmp_clip)

# 4) Orchestrator with enable_* flags
async def run_gemini_inspections(
    frames: List[Image.Image],
    video_path: str,
    transcript: str,
    model,
    *,
    enable_visual_artifacts: bool = True,
    enable_lipsync: bool = True,
    enable_abnormal_blinks: bool = True,
) -> Tuple[int, int, int]:
    """
    Returns (visual_flag, lipsync_flag, blink_flag).
    Disabled checks return 0.
    """
    if not model:
        return 0, 0, 0

    tasks, tags = [], []
    if enable_visual_artifacts:
        tasks.append(gemini_check_visual_artifacts(frames, model))
        tags.append("vis")
    if enable_lipsync:
        tasks.append(gemini_check_lipsync(video_path, transcript, model))
        tags.append("lip")
    if enable_abnormal_blinks:
        tasks.append(gemini_check_abnormal_blinks(frames, model))
        tags.append("blink")

    results = await asyncio.gather(*tasks, return_exceptions=True)

    vis = lip = blink = 0
    for tag, res in zip(tags, results):
        flag = res if isinstance(res, int) else 0
        if tag == "vis":   vis   = flag
        if tag == "lip":   lip   = flag
        if tag == "blink": blink = flag

    return vis, lip, blink
