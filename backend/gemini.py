# df_utils_gemini.py

import os
import sys
import base64
import tempfile
import asyncio
from typing import List, Tuple, Any
from io import BytesIO

import ffmpeg
from PIL import Image
# google.generativeai (genai) client passed from notebook

def _pil_to_b64_jpeg(pil_image: Image.Image) -> str:
    buffered = BytesIO()
    pil_image.save(buffered, format="JPEG", quality=85) # Quality 85 is good
    return base64.b64encode(buffered.getvalue()).decode('utf-8')

async def gemini_check_visual_artifacts(
    pil_frames: List[Image.Image],
    gemini_model_instance # Pass the initialized model
) -> int:
    if not gemini_model_instance or not pil_frames: 
        print("Warning: Gemini visual check skipped (no model or no frames).", file=sys.stderr)
        return 0
    
    num_frames = len(pil_frames)
    if num_frames == 0: return 0
    elif num_frames == 1: picked_frames = [pil_frames[0]]
    elif num_frames == 2: picked_frames = [pil_frames[0], pil_frames[-1]]
    else: picked_frames = [pil_frames[0], pil_frames[num_frames//2], pil_frames[-1]]
        
    image_parts = [{"mime_type": "image/jpeg", "data": _pil_to_b64_jpeg(f)} for f in picked_frames]
    prompt = "Examine these video frames. Do you observe any clear visual artifacts, unnatural distortions, or inconsistencies that strongly suggest these are from an AI-generated deepfake video? Respond with only YES or NO."
    
    try:
        # Use generate_content_async for await
        response = await gemini_model_instance.generate_content_async([prompt] + image_parts)
        response_text = response.text.strip().upper()
        return 1 if "YES" in response_text else 0
    except Exception as e:
        print(f"Gemini visual artifact check error: {e}", file=sys.stderr)
        return 0

async def gemini_check_lipsync(
    video_file_path: str,
    transcript_text: str,
    gemini_model_instance # Pass the initialized model
) -> int:
    if not gemini_model_instance:
        print("Warning: Gemini lipsync check skipped (no model).", file=sys.stderr)
        return 0
    if not transcript_text or not transcript_text.strip():
        # Lip sync check needs transcript
        print("Warning: Gemini lipsync check skipped (no transcript).", file=sys.stderr)
        return 0 
    
    temp_clip_fd, temp_clip_path = tempfile.mkstemp(suffix=".mp4")
    os.close(temp_clip_fd) 
    clip_generated_successfully = False
    try:
        probe_data = ffmpeg.probe(video_file_path)
        duration_s = float(probe_data['format']['duration'])
        clip_len_s = 2.0 
        start_s = max(0.0, (duration_s / 2.0) - (clip_len_s / 2.0))
        if start_s + clip_len_s > duration_s:
            start_s = 0.0
            clip_len_s = duration_s
        if clip_len_s <= 0.1: # Need a meaningful clip
            print(f"Video too short ({duration_s:.2f}s) for Gemini lipsync clip.", file=sys.stderr)
            if os.path.exists(temp_clip_path): os.remove(temp_clip_path) # Clean up empty temp file
            return 0


        ffmpeg.input(video_file_path, ss=start_s, t=clip_len_s).output(
            temp_clip_path, vcodec="libx264", acodec="aac", strict="experimental", loglevel="error"
        ).overwrite_output().run(capture_stdout=True, capture_stderr=True) # Added capture for debugging
        
        if not os.path.exists(temp_clip_path) or os.path.getsize(temp_clip_path) == 0:
            print(f"Failed to create or created an empty temporary clip: {temp_clip_path}", file=sys.stderr)
            # No need to remove here, finally block will handle if clip_generated_successfully is False
            return 0
        clip_generated_successfully = True # Set flag only if clip generation seems successful
            
        with open(temp_clip_path, "rb") as f: video_bytes = f.read()
        video_b64 = base64.b64encode(video_bytes).decode('utf-8')

        prompt = (
            "Watch this short video clip and read the provided text snippet (supposedly the transcript for this clip). "
            "Are the speaker's lip movements reasonably synchronized with the spoken words in the transcript? "
            "Answer with only YES (if synchronized) or NO (if not synchronized or mismatched)."
        )
        content_parts = [prompt, {"mime_type": "video/mp4", "data": video_b64}, {"text": transcript_text[:500]}] # Limit transcript
        
        response = await gemini_model_instance.generate_content_async(content_parts)
        response_text = response.text.strip().upper()
        return 1 if "NO" in response_text else 0 # 1 if NOT synchronized (i.e., issue found)
    except ffmpeg.Error as e_ff:
        print(f"FFmpeg error during Gemini lipsync clip generation: {e_ff.stderr.decode('utf8', errors='ignore') if e_ff.stderr else 'No stderr'}", file=sys.stderr)
        return 0
    except Exception as e:
        print(f"Gemini lipsync check error: {e}", file=sys.stderr)
        return 0
    finally:
        # Ensure temp_clip_path is defined and exists before trying to remove
        if 'temp_clip_path' in locals() and temp_clip_path and os.path.exists(temp_clip_path):
            os.remove(temp_clip_path)


async def run_gemini_inspections(
    pil_frames: List[Image.Image],
    video_file_path: str,
    transcript_text: str,
    gemini_model_instance 
) -> Tuple[int, int]:
    if not gemini_model_instance:
        return 0, 0 
        
    visual_flag, sync_flag = await asyncio.gather(
        gemini_check_visual_artifacts(pil_frames, gemini_model_instance),
        gemini_check_lipsync(video_file_path, transcript_text, gemini_model_instance)
    )
    return visual_flag, sync_flag