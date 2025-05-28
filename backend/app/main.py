"""
FastAPI application for deepfake detection
"""
import os
import uuid
import asyncio
from datetime import datetime
from typing import Dict, Optional
from pathlib import Path
import tempfile
import shutil

from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .schemas import (
    AnalyzeResponse,
    StatusResponse,
    ResultResponse,
    JobStatus,
    JobState
)
from .config import settings
from .dependencies import get_models
from .pipeline import run_detection_pipeline

# Initialize FastAPI app
app = FastAPI(
    title="Deepfake Detection API",
    description="API for detecting deepfakes using CLIP, Whisper, and Gemini",
    version="1.0.0"
)

# CORS middleware for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],  # Add your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory job storage (for demo purposes)
# In production, use Redis or a database
jobs: Dict[str, JobState] = {}

# Temporary file storage
TEMP_DIR = Path(tempfile.gettempdir()) / "deepfake-detector"
TEMP_DIR.mkdir(exist_ok=True)


async def process_video_background(job_id: str, video_path: str):
    """
    Background task to process video
    """
    try:
        # Update job status
        jobs[job_id].status = JobStatus.PROCESSING
        jobs[job_id].started_at = datetime.utcnow()
        
        # Load models if not already loaded
        models = await get_models()
        
        # Run the detection pipeline
        result = await run_detection_pipeline(
            video_path=video_path,
            models=models,
            job_id=job_id
        )
        
        # Update job with results
        jobs[job_id].status = JobStatus.COMPLETED
        jobs[job_id].completed_at = datetime.utcnow()
        jobs[job_id].result = result
        
    except Exception as e:
        # Handle errors
        jobs[job_id].status = JobStatus.FAILED
        jobs[job_id].error = str(e)
        jobs[job_id].completed_at = datetime.utcnow()
        
    finally:
        # Clean up temporary file
        try:
            if os.path.exists(video_path):
                os.remove(video_path)
        except Exception:
            pass


@app.on_event("startup")
async def startup_event():
    """
    Initialize models on startup (optional)
    """
    if settings.PRELOAD_MODELS:
        print("Preloading models...")
        await get_models()
        print("Models loaded successfully")


@app.get("/")
async def root():
    """
    Root endpoint
    """
    return {
        "message": "Deepfake Detection API",
        "version": "1.0.0",
        "endpoints": {
            "analyze": "/api/analyze",
            "status": "/api/status/{job_id}",
            "result": "/api/result/{job_id}"
        }
    }


@app.post("/api/analyze", response_model=AnalyzeResponse)
async def analyze_video(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...)
):
    """
    Submit a video for deepfake analysis
    """
    # Validate file type
    if not file.filename.lower().endswith(('.mp4', '.avi', '.mov', '.mkv', '.webm')):
        raise HTTPException(
            status_code=400,
            detail="Invalid file type. Supported formats: MP4, AVI, MOV, MKV, WebM"
        )
    
    # Check file size (optional, set limit in settings)
    if settings.MAX_FILE_SIZE_MB > 0:
        # Read file size
        file.file.seek(0, 2)  # Seek to end
        file_size = file.file.tell()
        file.file.seek(0)  # Reset to beginning
        
        if file_size > settings.MAX_FILE_SIZE_MB * 1024 * 1024:
            raise HTTPException(
                status_code=400,
                detail=f"File too large. Maximum size: {settings.MAX_FILE_SIZE_MB}MB"
            )
    
    # Generate job ID
    job_id = str(uuid.uuid4())
    
    # Save uploaded file temporarily
    temp_path = TEMP_DIR / f"{job_id}_{file.filename}"
    try:
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to save uploaded file: {str(e)}"
        )
    
    # Create job state
    jobs[job_id] = JobState(
        job_id=job_id,
        status=JobStatus.PENDING,
        created_at=datetime.utcnow(),
        filename=file.filename
    )
    
    # Add background task
    background_tasks.add_task(
        process_video_background,
        job_id=job_id,
        video_path=str(temp_path)
    )
    
    return AnalyzeResponse(
        job_id=job_id,
        message="Video submitted for analysis",
        status=JobStatus.PENDING
    )


@app.get("/api/status/{job_id}", response_model=StatusResponse)
async def get_job_status(job_id: str):
    """
    Check the status of a deepfake analysis job
    """
    if job_id not in jobs:
        raise HTTPException(
            status_code=404,
            detail="Job not found"
        )
    
    job = jobs[job_id]
    
    # Calculate progress (simplified)
    progress = 0.0
    if job.status == JobStatus.COMPLETED:
        progress = 1.0
    elif job.status == JobStatus.PROCESSING:
        # Could implement more granular progress tracking
        progress = 0.5
    elif job.status == JobStatus.FAILED:
        progress = 0.0
    
    return StatusResponse(
        job_id=job_id,
        status=job.status,
        progress=progress,
        created_at=job.created_at,
        started_at=job.started_at,
        completed_at=job.completed_at,
        error=job.error
    )


@app.get("/api/result/{job_id}", response_model=ResultResponse)
async def get_job_result(job_id: str):
    """
    Get the results of a completed deepfake analysis job
    """
    if job_id not in jobs:
        raise HTTPException(
            status_code=404,
            detail="Job not found"
        )
    
    job = jobs[job_id]
    
    if job.status != JobStatus.COMPLETED:
        raise HTTPException(
            status_code=400,
            detail=f"Job is not completed. Current status: {job.status}"
        )
    
    if not job.result:
        raise HTTPException(
            status_code=500,
            detail="Job completed but no results found"
        )
    
    # Calculate processing time
    processing_time = None
    if job.started_at and job.completed_at:
        processing_time = (job.completed_at - job.started_at).total_seconds()
    
    # Map internal result to API response
    return ResultResponse(
        job_id=job_id,
        status=job.status,
        result={
            "id": job.result.get("run_id", job_id),
            "isReal": job.result["final_predicted_label"] == "LIKELY_REAL",
            "label": job.result["final_predicted_label"],
            "confidenceScore": 1.0 - job.result["deepfake_confidence_overall"],  # Invert for intuitive score
            "processedAt": job.completed_at.isoformat() + "Z",
            "tags": _map_anomaly_tags(job.result.get("anomaly_tags_detected", [])),
            "details": {
                "visualScore": job.result.get("score_visual_clip", 0.0),
                "processingTime": processing_time,
                "videoLength": job.result.get("video_processed_duration_sec", 0.0),
                "originalVideoLength": job.result.get("video_original_duration_sec", 0.0),
                "pipelineVersion": job.result.get("pipeline_version", "unknown"),
                "transcriptSnippet": job.result.get("transcript_snippet", ""),
                "geminiChecks": {
                    "visualArtifacts": bool(job.result.get("flag_gemini_visual_artifact", 0)),
                    "lipsyncIssue": bool(job.result.get("flag_gemini_lipsync_issue", 0)),
                    "abnormalBlinks": bool(job.result.get("flag_gemini_abnormal_blinks", 0))
                }
            }
        },
        processing_time=processing_time
    )


def _map_anomaly_tags(tags: list) -> list:
    """
    Map internal anomaly tags to user-friendly descriptions
    """
    tag_mapping = {
        "VISUAL_CLIP_ANOMALY": "Visual Anomaly Detected",
        "GEMINI_VISUAL_ARTIFACTS": "Visual Artifacts Detected",
        "GEMINI_LIPSYNC_ISSUE": "Lip-sync Issue Detected",
        "GEMINI_ABNORMAL_BLINKS": "Abnormal Blinking Pattern"
    }
    
    return [tag_mapping.get(tag, tag) for tag in tags]


@app.delete("/api/jobs/{job_id}")
async def delete_job(job_id: str):
    """
    Delete a job and its results (optional endpoint)
    """
    if job_id not in jobs:
        raise HTTPException(
            status_code=404,
            detail="Job not found"
        )
    
    del jobs[job_id]
    
    return {"message": "Job deleted successfully"}


@app.get("/health")
async def health_check():
    """
    Health check endpoint
    """
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "jobs_count": len(jobs),
        "temp_dir": str(TEMP_DIR)
    }


# Cleanup old jobs periodically (optional)
async def cleanup_old_jobs():
    """
    Remove jobs older than 1 hour
    """
    while True:
        await asyncio.sleep(3600)  # Run every hour
        current_time = datetime.utcnow()
        jobs_to_remove = []
        
        for job_id, job in jobs.items():
            if (current_time - job.created_at).total_seconds() > 3600:
                jobs_to_remove.append(job_id)
        
        for job_id in jobs_to_remove:
            del jobs[job_id]


# Uncomment to enable automatic cleanup
# @app.on_event("startup")
# async def start_cleanup_task():
#     asyncio.create_task(cleanup_old_jobs())