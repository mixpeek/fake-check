"""
Pydantic schemas for API request/response models
"""
from datetime import datetime
from enum import Enum
from typing import Optional, List, Dict, Any, Literal
from pydantic import BaseModel, Field


# ─────────────────────────────────────────────────────────────
#  Generic job-tracking models 
# ─────────────────────────────────────────────────────────────
class JobStatus(str, Enum):
    """Job status enumeration"""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class AnalyzeResponse(BaseModel):
    """Response returned immediately after video upload"""
    job_id: str = Field(..., description="Unique job identifier")
    message: str = Field(..., description="Status message")
    status: JobStatus = Field(..., description="Current job status")

    class Config:
        json_schema_extra = {
            "example": {
                "job_id": "123e4567-e89b-12d3-a456-426614174000",
                "message": "Video submitted for analysis",
                "status": "pending"
            }
        }


class StatusResponse(BaseModel):
    """Polling response for job progress"""
    job_id: str = Field(..., description="Unique job identifier")
    status: JobStatus = Field(..., description="Current job status")
    progress: float = Field(..., ge=0.0, le=1.0, description="Progress (0-1)")
    created_at: datetime = Field(..., description="Job creation time (UTC)")
    started_at: Optional[datetime] = Field(None, description="Processing start time")
    completed_at: Optional[datetime] = Field(None, description="Completion time")
    error: Optional[str] = Field(None, description="Error message if failed")

    class Config:
        json_schema_extra = {
            "example": {
                "job_id": "123e4567-e89b-12d3-a456-426614174000",
                "status": "processing",
                "progress": 0.5,
                "created_at": "2024-03-15T10:30:00Z",
                "started_at": "2024-03-15T10:30:05Z",
                "completed_at": None,
                "error": None
            }
        }


# ─────────────────────────────────────────────────────────────
#  NEW: timeline event model
# ─────────────────────────────────────────────────────────────
class AnomalyEvent(BaseModel):
    """
    Single, timestamped anomaly produced by any detector.
    `module` drives grouping in the UI; `event` is a short code.
    """
    module: Literal[
        "ocr", "flow", "audio", "lip_sync",
        "crossmodal", "video_ai",
        "gemini_visual", "gemini_blink"
    ] = Field(..., description="Detector module that raised the event")
    event: str = Field(..., description="Event code (e.g. 'gibberish_text')")
    ts: float = Field(..., description="Start time in seconds from video start")
    dur: float = Field(0.0, description="Event duration in seconds (optional)")
    meta: Dict[str, Any] = Field(
        default_factory=dict,
        description="Detector-specific metadata (scores, raw text, etc.)"
    )


# ─────────────────────────────────────────────────────────────
#  Main detection result payload
# ─────────────────────────────────────────────────────────────
class DetectionResult(BaseModel):
    """
    Result of the deep-fake analysis performed on a single video.
    """
    id: str = Field(..., description="Result ID")
    isReal: bool = Field(..., description="Boolean inversion of 'fake' label")
    label: str = Field(
        ...,
        description="LIKELY_REAL | UNCERTAIN | LIKELY_FAKE"
    )
    confidenceScore: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="0-1 score (lower means more likely fake)"
    )
    processedAt: str = Field(..., description="ISO timestamp of processing completion")
    tags: List[str] = Field(..., description="Human-readable summary tags")
    details: Dict[str, Any] = Field(..., description="Detector-specific details & metrics")
    # ─── NEW ───
    events: List[AnomalyEvent] = Field(
        default_factory=list,
        description="Fine-grained timeline of detected anomalies"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "id": "video_abc123",
                "isReal": False,
                "label": "LIKELY_FAKE",
                "confidenceScore": 0.25,
                "processedAt": "2025-06-03T20:40:00Z",
                "tags": [
                    "Visual Anomaly Detected",
                    "Lip-sync Issue Detected"
                ],
                "details": {
                    "visualScore": 0.65,
                    "processingTime": 120.5,
                    "videoLength": 30.0,
                    "originalVideoLength": 45.0,
                    "pipelineVersion": "proof_of_concept_v2_events",
                    "transcriptSnippet": "This is a test transcript...",
                    "heuristicChecks": {
                        "visual_clip": 0.65,
                        "gemini_visual_artifacts": 1,
                        "gemini_lipsync_issue": 1,
                        "gemini_blink_abnormality": 0,
                        "ocr": 0.12,
                        "flow": 0.10,
                        "audio": 0.15,
                        "crossmodal": 0.15,
                        "video_ai": 0.10
                    },
                    "geminiChecks": {
                        "visualArtifacts": True,
                        "lipsyncIssue": True,
                        "abnormalBlinks": False
                    }
                },
                "events": [
                    {
                        "module": "ocr",
                        "event": "gibberish_text",
                        "ts": 5.03,
                        "dur": 0.0,
                        "meta": {"ppl": 120.5, "raw": "Puppramin q, My lite he="}
                    },
                    {
                        "module": "flow",
                        "event": "flow_spike",
                        "ts": 12.18,
                        "dur": 0.0,
                        "meta": {"z": 2.8}
                    },
                    {
                        "module": "lip_sync",
                        "event": "desync",
                        "ts": 8.00,
                        "dur": 2.00,
                        "meta": {"sync_score": 0.28}
                    }
                ]
            }
        }


class ResultResponse(BaseModel):
    """Wrapper returned once analysis completes"""
    job_id: str = Field(..., description="Unique job identifier")
    status: JobStatus = Field(..., description="Final job status (completed/failed)")
    result: DetectionResult = Field(..., description="Detailed detection results")
    processing_time: Optional[float] = Field(
        None,
        description="Total processing time in seconds"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "job_id": "123e4567-e89b-12d3-a456-426614174000",
                "status": "completed",
                "result": DetectionResult.Config.json_schema_extra["example"],
                "processing_time": 125.3
            }
        }


# ─────────────────────────────────────────────────────────────
#  Internal job-state model 
# ─────────────────────────────────────────────────────────────
class JobState(BaseModel):
    """Internal job state (not exposed via API)"""
    job_id: str
    status: JobStatus
    created_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    filename: str
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
