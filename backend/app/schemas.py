"""
Pydantic schemas for API request/response models
"""
from datetime import datetime
from enum import Enum
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class JobStatus(str, Enum):
    """Job status enumeration"""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class AnalyzeResponse(BaseModel):
    """Response for video analysis submission"""
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
    """Response for job status check"""
    job_id: str = Field(..., description="Unique job identifier")
    status: JobStatus = Field(..., description="Current job status")
    progress: float = Field(..., ge=0.0, le=1.0, description="Progress (0-1)")
    created_at: datetime = Field(..., description="Job creation time")
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


class DetectionResult(BaseModel):
    """Detection result data"""
    id: str = Field(..., description="Result ID")
    isReal: bool = Field(..., description="Whether the video is likely real")
    label: str = Field(..., description="Classification label: LIKELY_REAL, UNCERTAIN, LIKELY_FAKE")
    confidenceScore: float = Field(..., ge=0.0, le=1.0, description="Confidence score (0-1, higher means more real)")
    processedAt: str = Field(..., description="ISO timestamp of processing completion")
    tags: List[str] = Field(..., description="Human-readable anomaly tags")
    details: Dict[str, Any] = Field(..., description="Additional technical details")
    
    class Config:
        json_schema_extra = {
            "example": {
                "id": "video_abc123",
                "isReal": False,
                "label": "LIKELY_FAKE",
                "confidenceScore": 0.25,
                "processedAt": "2024-03-15T10:35:00Z",
                "tags": [
                    "Visual Anomaly Detected",
                    "Lip-sync Issue Detected"
                ],
                "details": {
                    "visualScore": 0.75,
                    "processingTime": 120.5,
                    "videoLength": 30.0,
                    "originalVideoLength": 45.0,
                    "pipelineVersion": "simplified_v1",
                    "transcriptSnippet": "Hello, this is a test video...",
                    "geminiChecks": {
                        "visualArtifacts": True,
                        "lipsyncIssue": True,
                        "abnormalBlinks": False
                    }
                }
            }
        }


class ResultResponse(BaseModel):
    """Response for job results"""
    job_id: str = Field(..., description="Unique job identifier")
    status: JobStatus = Field(..., description="Job status (should be completed)")
    result: DetectionResult = Field(..., description="Detection results")
    processing_time: Optional[float] = Field(None, description="Total processing time in seconds")
    
    class Config:
        json_schema_extra = {
            "example": {
                "job_id": "123e4567-e89b-12d3-a456-426614174000",
                "status": "completed",
                "result": DetectionResult.Config.json_schema_extra["example"],
                "processing_time": 125.3
            }
        }


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