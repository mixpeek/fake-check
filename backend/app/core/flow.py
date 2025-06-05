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
    events, z_scores = [], []
    mags = []

    gray_frames = [_to_gray(f) for f in frames]

    for idx in range(len(gray_frames) - 1):
        prev, nxt = gray_frames[idx], gray_frames[idx + 1]

        # Farneback dense flow
        flow = cv2.calcOpticalFlowFarneback(prev, nxt, None,
                                            0.5, 3, 15, 3, 5, 1.2, 0)
        mag = np.linalg.norm(flow, axis=2).mean()
        mags.append(mag)

    if len(mags) < 5:
        return {"score": 0.0, "anomaly": False, "tags": [], "events": []}

    μ, σ = float(np.mean(mags)), float(np.std(mags) + 1e-6)

    for idx, mag in enumerate(mags):
        z = (mag - μ) / σ
        z_scores.append(z)
        if z > 2:   # spike
            ts = round((idx + 0.5) / fps, 2)
            events.append({
                "module": "flow",
                "event": "flow_spike",
                "ts": ts,
                "dur": 0.0,
                "meta": {"z": z}
            })
        # SSIM sudden drop
        s = ssim(gray_frames[idx], gray_frames[idx + 1])
        if s < 0.97:
            ts = round((idx + 0.5) / fps, 2)
            events.append({
                "module": "flow",
                "event": "ssim_drop",
                "ts": ts,
                "dur": 0.0,
                "meta": {"ssim": s}
            })

    return {
        "score": 0.10 if events else 0.0,
        "anomaly": bool(events),
        "tags": ["flow_spike"] if events else [],
        "events": events
    }
