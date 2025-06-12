# app/core/flow.py
"""
Optical-flow magnitude & SSIM spike detector.
"""
from typing import List, Dict, Any

import cv2
import numpy as np
from skimage.metrics import structural_similarity as ssim
from PIL import Image


def _to_gray(img: Image.Image) -> np.ndarray:
    return cv2.cvtColor(np.array(img), cv2.COLOR_RGB2GRAY)


def detect_spikes(frames: List[Image.Image], fps: float) -> Dict[str, Any]:
    events, mags = [], []
    last_event_ts = -1.0  # Used to throttle events to at most 1 per second.

    if not frames or len(frames) < 2:
        return {"score": 0.0, "anomaly": False, "tags": [], "events": []}

    gray_frames = [_to_gray(f) for f in frames]

    # First pass: calculate all optical flow magnitudes to establish a baseline
    for idx in range(len(gray_frames) - 1):
        prev, nxt = gray_frames[idx], gray_frames[idx + 1]
        flow = cv2.calcOpticalFlowFarneback(prev, nxt, None,
                                            0.5, 3, 15, 3, 5, 1.2, 0)
        mag = np.linalg.norm(flow, axis=2).mean()
        mags.append(mag)

    if len(mags) < 5:
        return {"score": 0.0, "anomaly": False, "tags": [], "events": []}

    μ, σ = float(np.mean(mags)), float(np.std(mags) + 1e-6)

    # Second pass: detect anomalies, but throttled
    for idx, mag in enumerate(mags):
        ts = round((idx + 0.5) / fps, 2)
        
        # --- Event Throttling Logic ---
        # If an event has already been logged in the last second, skip this frame.
        if ts < last_event_ts + 1.0:
            continue

        z = (mag - μ) / σ
        
        # A significant event is primarily a flow spike.
        # An SSIM drop is only considered if it accompanies a spike.
        if z > 2:   # spike
            event_meta = {"z": round(z, 2)}
            s = ssim(gray_frames[idx], gray_frames[idx + 1])

            # If there's also an SSIM drop, add it to the spike's metadata
            if s < 0.97:
                event_meta["ssim"] = round(s, 3)

            events.append({
                "module": "flow",
                "event": "flow_spike",
                "ts": ts,
                "dur": 0.0,
                "meta": event_meta
            })
            last_event_ts = ts # Update the timestamp of the last event

    return {
        "score": 0.10 if events else 0.0,
        "anomaly": bool(events),
        "tags": ["flow_spike"] if events else [],
        "events": events
    }
