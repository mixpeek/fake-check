"""
FastAPI application for deepfake detection
"""
import os
import uuid
from datetime import datetime
from typing import Dict
from pathlib import Path
import tempfile
import shutil
import time

from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware

from . import schemas, config
from .schemas import (
    AnalyzeResponse,
    StatusResponse,
    ResultResponse,
    JobStatus,
    JobState
)
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
    allow_origins=[
        "http://localhost:3000", 
        "http://localhost:3001", 
        "http://localhost:5173",
        "https://your-frontend-domain.com"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory job storage (simple for demo)
jobs: Dict[str, JobState] = {}

# Temporary file storage
TEMP_DIR = Path(tempfile.gettempdir()) / "deepfake-detector"
TEMP_DIR.mkdir(exist_ok=True)


async def process_video_background(job_id: str, video_path: str):
    """
    Background task to process video
    """
    print(f"--- ✅ BACKGROUND TASK STARTED for job_id: {job_id} ---", flush=True)

    try:
        # Update job status
        jobs[job_id].status = JobStatus.PROCESSING
        jobs[job_id].started_at = datetime.utcnow()
        
        # Get models
        models = await get_models()
        
        # Run the detection pipeline
        result = await run_detection_pipeline(
            video_path=video_path,
            models_dict=models,
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


@app.get("/test")
async def test_endpoint():
    """Simple test endpoint"""
    return {"message": "test works"}


@app.get("/health")
async def health_check():
    """Health check endpoint for debugging connectivity"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "message": "Backend is running normally"
    }


@app.post("/api/analyze", response_model=AnalyzeResponse)
async def analyze_video(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...)
):
    """
    Submit a video for deepfake analysis
    """
    start_time = time.time()
    print(f"🔄 Upload started for file: {file.filename} ({file.size} bytes)", flush=True)
    
    # Validate file type
    if not file.filename.lower().endswith(('.mp4', '.avi', '.mov', '.mkv', '.webm')):
        raise HTTPException(
            status_code=400,
            detail="Invalid file type. Supported formats: MP4, AVI, MOV, MKV, WebM"
        )
    
    # Generate job ID
    job_id = str(uuid.uuid4())
    print(f"🆔 Generated job ID: {job_id} (elapsed: {time.time() - start_time:.2f}s)", flush=True)
    
    # Save uploaded file temporarily
    temp_path = TEMP_DIR / f"{job_id}_{file.filename}"
    try:
        print(f"💾 Starting file save to: {temp_path} (elapsed: {time.time() - start_time:.2f}s)", flush=True)
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        print(f"✅ File saved successfully (elapsed: {time.time() - start_time:.2f}s)", flush=True)
    except Exception as e:
        print(f"❌ File save failed: {e} (elapsed: {time.time() - start_time:.2f}s)", flush=True)
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
    print(f"📝 Job state created (elapsed: {time.time() - start_time:.2f}s)", flush=True)
    
    # Add background task
    background_tasks.add_task(
        process_video_background,
        job_id=job_id,
        video_path=str(temp_path)
    )
    print(f"🚀 Background task queued (elapsed: {time.time() - start_time:.2f}s)", flush=True)
    
    response = AnalyzeResponse(
        job_id=job_id,
        message="Video submitted for analysis",
        status=JobStatus.PENDING
    )
    print(f"✅ Upload endpoint completed (total time: {time.time() - start_time:.2f}s)", flush=True)
    return response


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
    
    # Calculate progress
    progress = 0.0
    if job.status == JobStatus.COMPLETED:
        progress = 1.0
    elif job.status == JobStatus.PROCESSING:
        progress = 0.5  # Simple progress for demo
    
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
    
    # Map internal result to API response (matching notebook field names)
    return ResultResponse(
        job_id=job_id,
        status=job.status,
        result={
            "id": job.result.get("run_id", job_id),
            "isReal": job.result.get("final_predicted_label", "ERROR_IN_PROCESSING") == "LIKELY_REAL",
            "label": job.result.get("final_predicted_label", "ERROR_IN_PROCESSING"),
            "confidenceScore": job.result.get("label_confidence", 0.5),  # Use label confidence instead of inverted score
            "processedAt": job.completed_at.isoformat() + "Z" if job.completed_at else "N/A",
            "tags": _map_anomaly_tags(job.result.get("anomaly_tags_detected", [])),
            "details": {
                "visualScore": job.result.get("score_visual_clip", 0.0),
                "processingTime": processing_time,
                "videoLength": job.result.get("video_processed_duration_sec", 0.0),
                "originalVideoLength": job.result.get("video_original_duration_sec", 0.0),
                "pipelineVersion": job.result.get("pipeline_version", "unknown"),
                "transcriptSnippet": job.result.get("transcript_snippet", "N/A"),
                "geminiChecks": {
                    "visualArtifacts": bool(job.result.get("flag_gemini_visual_artifact", 0)),
                    "lipsyncIssue": bool(job.result.get("flag_gemini_lipsync_issue", 0)),
                    "abnormalBlinks": bool(job.result.get("flag_gemini_abnormal_blinks", 0))
                },
                "heuristicChecks": job.result.get("heuristicChecks", {}),
                "error_message": job.result.get("error"),
                "error_trace": job.result.get("trace")
            },
            "events": job.result.get("events", [])
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