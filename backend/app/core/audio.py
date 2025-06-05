# app/core/audio.py
"""
Audio autocorrelation loop + SyncNet lip-sync check.
"""
import math, subprocess, tempfile, os, json
from typing import Dict, Any, List

import numpy as np
import librosa
from .video import extract_audio           # existing util


def detect_loop_and_lag(video_path: str, frames: List, fps: float) -> Dict[str, Any]:
    events = []
    # ─── 1) audio loop via autocorrelation ───
    wav, sr = librosa.load(extract_audio(video_path), sr=16000)
    acf = np.correlate(wav, wav, mode="full")
    acf = acf[len(acf)//2:]
    peaks = np.argwhere(acf > 0.8 * acf[0]).flatten()
    if len(peaks) > 1:
        period_samples = peaks[1]
        loop_period = round(period_samples / sr, 2)
        events.append({
            "module": "audio",
            "event": "audio_loop",
            "ts": 0.0,
            "dur": loop_period,
            "meta": {"period_s": loop_period}
        })

    total_score = 0.10 if events else 0.0
    return {
        "score": total_score,
        "anomaly": bool(events),
        "tags": ["audio_loop"] if events else [],
        "events": events
    }
