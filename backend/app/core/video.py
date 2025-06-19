# df_utils_video.py

import os, json, tempfile
import sys
import tempfile
from typing import List, Tuple, Optional, Dict, Any, List

import ffmpeg
import cv2
import numpy as np
from PIL import Image
from .. import config

# from google.cloud import videointelligence_v1 as vi  # Disabled for demo

def extract_audio(video_path: str, duration_to_process: Optional[float] = None) -> Optional[str]:
    """
    Extracts audio from a video file and saves it as a temporary WAV file.

    Args:
        video_path: Path to the input video file.
        duration_to_process: Optional duration in seconds to extract. 
                             If None, extracts the full audio.

    Returns:
        Path to the temporary WAV file, or None if extraction fails.
    """
    if not os.path.exists(video_path):
        print(f"Error: Video file not found for audio extraction: {video_path}", file=sys.stderr)
        return None

    temp_wav_fd, temp_wav_path = tempfile.mkstemp(suffix=".wav")
    os.close(temp_wav_fd) 

    try:
        input_stream = ffmpeg.input(video_path)
        if duration_to_process is not None:
            input_stream = input_stream.output(
                temp_wav_path, ac=1, ar=16000, acodec='pcm_s16le', t=duration_to_process
            )
        else:
            input_stream = input_stream.output(
                temp_wav_path, ac=1, ar=16000, acodec='pcm_s16le'
            )
        
        input_stream.overwrite_output().run(capture_stdout=True, capture_stderr=True, quiet=True)
        
        if os.path.exists(temp_wav_path) and os.path.getsize(temp_wav_path) > 0:
            return temp_wav_path
        else:
            print(f"Warning: FFmpeg audio extraction produced an empty file for {video_path}.", file=sys.stderr)
            if os.path.exists(temp_wav_path): os.remove(temp_wav_path)
            return None

    except ffmpeg.Error as e:
        stderr_msg = e.stderr.decode('utf8', errors='ignore') if e.stderr else "No stderr"
        print(f"Warning: FFmpeg audio extraction failed for {video_path}: {stderr_msg}.", file=sys.stderr)
        if os.path.exists(temp_wav_path): # Clean up potentially empty/corrupt file
            try: 
                os.remove(temp_wav_path)
            except OSError: 
                pass
        return None

def _ffmpeg_extract_frames_raw(
    path: str, 
    target_fps: int, 
    rotation_angle: int, 
    duration_to_process: float # New parameter
) -> bytes:
    """
    Helper to extract frames using FFmpeg's rawvideo pipe,
    processing only up to duration_to_process seconds of the input video.
    """
    stream = ffmpeg.input(path, t=duration_to_process) # Apply duration limit here
    
    if rotation_angle in (90, 270):
        stream = stream.filter_("transpose", 1 if rotation_angle == 90 else 2)
    try:
        out_bytes, err_bytes = (
            stream
            .filter("fps", fps=target_fps)
            .output("pipe:", format="rawvideo", pix_fmt="rgb24", vsync="vfr")
            .global_args("-loglevel", "error") # Suppress verbose output, only show errors
            .run(capture_stdout=True, capture_stderr=True)
        )
        if err_bytes:
            decoded_err = err_bytes.decode('utf8', errors='ignore')
            # Avoid printing noise if stderr only contains common warnings or is empty
            if "warnings" not in decoded_err.lower() and decoded_err.strip() and "deprecated" not in decoded_err.lower():
                 print(f"FFmpeg (frame extract) stderr: {decoded_err}", file=sys.stderr)
        return out_bytes
    except ffmpeg.Error as e:
        stderr_msg = e.stderr.decode('utf8', errors='ignore') if e.stderr else "No stderr"
        print(f"FFmpeg frame extraction error: {stderr_msg}", file=sys.stderr)
        raise

def sample_video_content(
    video_path: str, 
    target_fps: int = 8, 
    max_duration_sec: int = 30
) -> Tuple[List[Image.Image], Optional[str], float, float]:
    """
    Samples video frames and extracts audio.
    Limits processing to max_duration_sec.
    Returns:
        - List of PIL Image objects (frames from the processed segment).
        - Path to the extracted WAV audio file (or None if failed).
        - Actual total duration of the original video.
        - Duration of the video segment that was actually processed for frames and audio.
    """
    if not os.path.exists(video_path):
        raise FileNotFoundError(f"Video file not found: {video_path}")

    try:
        video_metadata = ffmpeg.probe(video_path)
    except ffmpeg.Error as e:
        # Attempt to provide more specific error if probe fails
        probe_err = e.stderr.decode('utf8', errors='ignore') if e.stderr else "Unknown probe error"
        raise RuntimeError(f"ffmpeg.probe failed for {video_path}: {probe_err}")

    actual_total_duration = float(video_metadata.get("format", {}).get("duration", "0"))
    if actual_total_duration == 0:
        stream_durations = [float(s.get("duration", "0")) for s in video_metadata.get("streams", []) if s.get("duration")]
        if stream_durations:
            actual_total_duration = max(stream_durations)
        if actual_total_duration == 0: # Still zero after checking streams
            raise ValueError("Video duration reported as 0 by ffmpeg.probe and all stream metadata.")
            
    # Determine the duration to actually process for frames and audio
    processed_duration_sec = min(actual_total_duration, float(max_duration_sec))

    if actual_total_duration > max_duration_sec:
        print(f"Info: Original video duration {actual_total_duration:.2f}s exceeds max_duration_sec {max_duration_sec}s. "
              f"Processing only the first {processed_duration_sec:.2f}s.", file=sys.stderr)

    video_stream_info = next((s for s in video_metadata.get("streams", []) if s.get("codec_type") == "video"), None)
    if not video_stream_info:
        raise RuntimeError("No video stream found in the file.")

    original_width, original_height = int(video_stream_info.get("width", 0)), int(video_stream_info.get("height", 0))
    if original_width == 0 or original_height == 0:
        raise ValueError("Video stream has zero width or height.")

    rotation_tag = video_stream_info.get("tags", {}).get("rotate", "0")
    rotation_angle = 0
    try:
        rotation_angle = int(str(rotation_tag).split('.')[0]) # Handle "90.000"
    except ValueError:
        print(f"Warning: Could not parse rotation tag '{rotation_tag}'. Assuming 0 rotation.", file=sys.stderr)

    # Audio Extraction (limited to processed_duration_sec)
    temp_wav_fd, temp_wav_path = tempfile.mkstemp(suffix=".wav")
    os.close(temp_wav_fd)
    audio_extracted_successfully = False
    try:
        ffmpeg.input(video_path, t=processed_duration_sec).output( # Limit audio extraction duration
            temp_wav_path, ac=1, ar=16000, acodec='pcm_s16le'
        ).overwrite_output().run(capture_stdout=True, capture_stderr=True, quiet=True)
        audio_extracted_successfully = True
    except ffmpeg.Error as e:
        stderr_msg = e.stderr.decode('utf8', errors='ignore') if e.stderr else "No stderr"
        # It's better to return None for audio path if it fails, rather than stopping all processing.
        print(f"Warning: FFmpeg audio extraction failed: {stderr_msg}. Proceeding without audio analysis.", file=sys.stderr)
        if os.path.exists(temp_wav_path): # Clean up potentially empty/corrupt file
            try: os.remove(temp_wav_path)
            except OSError: pass
        temp_wav_path = None 
    
    # Frame Extraction
    pil_frames: List[Image.Image] = []
    max_frames_to_sample = int(target_fps * processed_duration_sec)
    if max_frames_to_sample <= 0 : # If duration is very small or fps is zero
        print("Warning: Calculated max_frames_to_sample is zero or negative. No frames will be extracted.", file=sys.stderr)
        return pil_frames, temp_wav_path, actual_total_duration, processed_duration_sec


    # Attempt 1: FFmpeg frame extraction (now limited by processed_duration_sec)
    try: 
        raw_frame_bytes = _ffmpeg_extract_frames_raw(video_path, target_fps, rotation_angle, processed_duration_sec)
        
        current_w, current_h = original_width, original_height
        if rotation_angle in (90, 270): 
            current_w, current_h = original_height, original_width

        bytes_per_frame = current_w * current_h * 3
        if bytes_per_frame == 0: raise ValueError("Frame dimensions (after rotation) are zero, cannot process frames.")

        num_possible_raw_frames = len(raw_frame_bytes) // bytes_per_frame
        # The number of frames from _ffmpeg_extract_frames_raw should now roughly match max_frames_to_sample
        # because we passed processed_duration_sec to it.
        # We still cap it to ensure consistency.
        frames_to_decode_count = min(num_possible_raw_frames, max_frames_to_sample)

        for i in range(frames_to_decode_count):
            frame_data_buffer = raw_frame_bytes[i*bytes_per_frame:(i+1)*bytes_per_frame]
            np_frame = np.frombuffer(frame_data_buffer, np.uint8).reshape(current_h, current_w, 3)
            pil_frames.append(Image.fromarray(np_frame, mode="RGB"))
        print(f"FFmpeg extracted {len(pil_frames)} frames (target max: {max_frames_to_sample}).", file=sys.stderr)
    except (ffmpeg.Error, ValueError) as e:
        print(f"FFmpeg frame extraction failed ({type(e).__name__}: {e}), trying OpenCV.", file=sys.stderr)
        pil_frames = [] # Reset for OpenCV attempt

    # Attempt 2: OpenCV fallback (if FFmpeg failed or yielded no frames)
    if not pil_frames: 
        print("Using OpenCV for frame extraction.", file=sys.stderr)
        video_capture = cv2.VideoCapture(video_path)
        if not video_capture.isOpened():
            # Clean up audio file if it was created but frame extraction fully fails
            if temp_wav_path and os.path.exists(temp_wav_path): 
                try: os.remove(temp_wav_path)
                except OSError: pass
            raise RuntimeError("Cannot open video with OpenCV.")

        source_fps_cv = video_capture.get(cv2.CAP_PROP_FPS)
        sampling_interval_cv = max(1, round(source_fps_cv / target_fps)) if source_fps_cv > 0 else 1
        
        frame_read_counter = 0
        processed_frame_count_cv = 0
        
        while processed_frame_count_cv < max_frames_to_sample:
            # Check current video time to ensure we don't process beyond processed_duration_sec
            current_video_time_msec = video_capture.get(cv2.CAP_PROP_POS_MSEC)
            if current_video_time_msec / 1000.0 > processed_duration_sec + 0.1: # Add small buffer for timestamp precision
                break 

            ret, cv2_frame = video_capture.read()
            if not ret: break # End of video

            if frame_read_counter % sampling_interval_cv == 0:
                cv2_frame_rgb = cv2.cvtColor(cv2_frame, cv2.COLOR_BGR2RGB)
                # Apply rotation if needed
                if rotation_angle == 90: cv2_frame_rgb = cv2.rotate(cv2_frame_rgb, cv2.ROTATE_90_CLOCKWISE)
                elif rotation_angle == 180: cv2_frame_rgb = cv2.rotate(cv2_frame_rgb, cv2.ROTATE_180)
                elif rotation_angle == 270: cv2_frame_rgb = cv2.rotate(cv2_frame_rgb, cv2.ROTATE_90_COUNTERCLOCKWISE)
                pil_frames.append(Image.fromarray(cv2_frame_rgb))
                processed_frame_count_cv +=1
            frame_read_counter += 1
        video_capture.release()
        print(f"OpenCV extracted {len(pil_frames)} frames (target max: {max_frames_to_sample}).", file=sys.stderr)

    if not pil_frames:
        # If still no frames, clean up audio if it exists and raise error
        if temp_wav_path and os.path.exists(temp_wav_path): 
            try: os.remove(temp_wav_path)
            except OSError: pass
        raise RuntimeError("Failed to extract frames using both FFmpeg and OpenCV.")
    
    # Final safeguard to ensure we don't exceed max_frames_limit due to any rounding
    pil_frames = pil_frames[:max_frames_to_sample]

    # In low resource mode, downscale frames to 360p to conserve memory
    if config.LOW_RESOURCE:
        resized_frames: List[Image.Image] = []
        target_height = 360
        for frame in pil_frames:
            w, h = frame.size
            if h > target_height:
                new_w = int(w * target_height / h)
                resized_frames.append(frame.resize((new_w, target_height), Image.BICUBIC))
            else:
                resized_frames.append(frame)
        pil_frames = resized_frames

    return pil_frames, temp_wav_path, actual_total_duration, processed_duration_sec

def detect_lighting_jumps(video_path: str) -> Dict[str, Any]:
    client = vi.VideoIntelligenceServiceClient()
    features = [
        vi.Feature.SHOT_CHANGE_DETECTION,
        vi.Feature.LABEL_DETECTION,
        vi.Feature.PERSON_DETECTION,
    ]

    with open(video_path, "rb") as f:
        input_content = f.read()

    annot = client.annotate_video(
        request=vi.AnnotateVideoRequest(
            features=features,
            input_content=input_content,
            video_context=vi.VideoContext(
                label_detection_config=vi.LabelDetectionConfig(
                    label_detection_mode=vi.LabelDetectionMode.SHOT_MODE
                )
            ),
        )
    ).result(timeout=300)

    shot_annotations = (
        annot.annotation_results[0].shot_annotations
        if annot.annotation_results else []
    )

    events = []
    for shot in shot_annotations:
        start = shot.start_time_offset.total_seconds()
        end   = shot.end_time_offset.total_seconds()
        dur   = round(end - start, 2)
        # flag super-short non-fade shots (< 0.5 s) as suspicious
        if dur < 0.5:
            events.append({
                "module": "video_ai",
                "event": "odd_shot",
                "ts": round(start, 2),
                "dur": dur,
                "meta": {"duration": dur}
            })

    return {
        "score": 0.10 if events else 0.0,
        "anomaly": bool(events),
        "tags": ["odd_shot"] if events else [],
        "events": events
    }
