#!/usr/bin/env python3
"""
SCOT AI - FastAPI REST Microservice
High-throughput inference and sports video analysis API.
Connects Cloud GPU worker (Camber / Colab Pro) to main web platform (Clerk auth).
Features asynchronous job dispatch, video streaming, and detailed JSON analytics payload.
"""

import asyncio
import json
import logging
import os
from pathlib import Path
import shutil
import sys
import time
from typing import Any, Dict, Optional
import uuid

import cv2
from fastapi import BackgroundTasks, FastAPI, File, Form, HTTPException, Query, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
import torch

# Import Scot AI Analytics Subsystems
from analytics.volleyball_analyzer import VolleyballAnalyzer
from analytics.other_sports_basics import FootballAnalyzer, BasketballAnalyzer

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] (API) %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger("scot_api")

# Working Directories
BASE_DIR = Path(__file__).resolve().parent.parent
STORAGE_DIR = BASE_DIR / "storage"
UPLOADS_DIR = STORAGE_DIR / "uploads"
OUTPUTS_DIR = STORAGE_DIR / "outputs"

UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
OUTPUTS_DIR.mkdir(parents=True, exist_ok=True)

# In-Memory Job Registry for Asynchronous Background Processing
# job_id -> { "status": "queued|processing|completed|failed", "progress": float, ... }
JOB_REGISTRY: Dict[str, Dict[str, Any]] = {}

app = FastAPI(
    title="SCOT AI - Sports Video Analytics Microservice",
    description="Ultralytics YOLOv11 + Supervision + OpenCV Video Pipeline for FIVB Volleyball, FIFA Football, and FIBA Basketball",
    version="1.0.0",
)

# CORS Configuration for Main Web Platform (supports Clerk Auth frontend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows local dev, Vercel, Netlify, and custom domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static outputs folder for direct video / heatmap asset streaming
app.mount("/outputs", StaticFiles(directory=str(OUTPUTS_DIR)), name="outputs")


def get_available_device() -> str:
    """Returns CUDA device index if available, else CPU."""
    if torch.cuda.is_available():
        return "0"
    return "cpu"


# ------------------------------------------------------------------------------
# Core Video Processing Pipeline Task
# ------------------------------------------------------------------------------
def execute_video_analysis_task(
    job_id: str,
    video_path: Path,
    sport_type: str,
    user_id: Optional[str] = None,
    stride: int = 1,
    render_video: bool = True,
):
    """
    Executes frame-by-frame sports video analysis using specialized analyzer.
    Runs asynchronously as a background task.
    """
    try:
        JOB_REGISTRY[job_id]["status"] = "processing"
        JOB_REGISTRY[job_id]["started_at"] = time.time()
        logger.info(f"Starting analysis job {job_id} for sport '{sport_type}' (user: {user_id})...")

        cap = cv2.VideoCapture(str(video_path))
        if not cap.isOpened():
            raise RuntimeError(f"Could not open video file: {video_path}")

        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        native_fps = float(cap.get(cv2.CAP_PROP_FPS))
        if native_fps <= 0.0:
            native_fps = 30.0
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

        device = get_available_device()

        # Initialize designated sport analyzer
        if sport_type == "volleyball":
            analyzer = VolleyballAnalyzer(fps=native_fps, device=device)
        elif sport_type == "football":
            analyzer = FootballAnalyzer(fps=native_fps, device=device)
        elif sport_type == "basketball":
            analyzer = BasketballAnalyzer(fps=native_fps, device=device)
        else:
            raise ValueError(f"Unsupported sport type: {sport_type}")

        # Setup Video Writer if video output requested
        out_video_filename = f"{job_id}_annotated.mp4"
        out_video_path = OUTPUTS_DIR / out_video_filename
        video_writer = None

        if render_video:
            # Use MP4V or avc1 codec
            fourcc = cv2.VideoWriter_fourcc(*"mp4v")
            effective_fps = native_fps / max(1, stride)
            video_writer = cv2.VideoWriter(str(out_video_path), fourcc, effective_fps, (width, height))

        frame_idx = 0
        processed_frames_count = 0
        frame_telemetry_series = []

        while True:
            ret, frame = cap.read()
            if not ret:
                break

            if frame_idx % stride == 0:
                timestamp_sec = frame_idx / native_fps

                # Run analyzer frame pass
                analysis_data = analyzer.process_frame(frame, frame_idx, timestamp_sec)

                # Strip non-serializable objects before logging
                serializable_frame = {
                    "frame_idx": analysis_data["frame_idx"],
                    "timestamp_sec": analysis_data["timestamp_sec"],
                    "players": analysis_data.get("players", []),
                    "ball": analysis_data.get("ball"),
                }
                frame_telemetry_series.append(serializable_frame)

                # Render annotations to video
                if render_video and video_writer is not None:
                    annotated_frame = analyzer.annotate_frame(frame, analysis_data)
                    video_writer.write(annotated_frame)

                processed_frames_count += 1

                # Update progress in registry
                progress_pct = min(100.0, (frame_idx / max(1, total_frames)) * 100.0)
                JOB_REGISTRY[job_id]["progress"] = round(progress_pct, 1)

            frame_idx += 1

        cap.release()
        if video_writer is not None:
            video_writer.release()

        # Generate summary report from analyzer
        summary = analyzer.generate_summary_report()

        # Export Court Heatmap Image
        heatmap_img = analyzer.generate_court_heatmap()
        heatmap_filename = f"{job_id}_heatmap.png"
        heatmap_path = OUTPUTS_DIR / heatmap_filename
        cv2.imwrite(str(heatmap_path), heatmap_img)

        # Build full JSON analytics payload
        report_payload = {
            "job_id": job_id,
            "user_id": user_id,
            "sport": sport_type,
            "created_at": time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime()),
            "video_metadata": {
                "source_file": video_path.name,
                "resolution": {"width": width, "height": height},
                "native_fps": native_fps,
                "total_source_frames": total_frames,
                "processed_frames": processed_frames_count,
                "duration_seconds": round(total_frames / native_fps, 2),
            },
            "summary_analytics": summary,
            "media_assets": {
                "annotated_video_url": f"/outputs/{out_video_filename}" if render_video else None,
                "heatmap_image_url": f"/outputs/{heatmap_filename}",
            },
            "frame_by_frame_telemetry": frame_telemetry_series,
        }

        # Write analytics JSON file
        report_filename = f"{job_id}_analytics_report.json"
        report_path = OUTPUTS_DIR / report_filename
        with open(report_path, "w", encoding="utf-8") as rf:
            json.dump(report_payload, rf, indent=2)

        # Mark Job Complete in Registry
        JOB_REGISTRY[job_id]["status"] = "completed"
        JOB_REGISTRY[job_id]["progress"] = 100.0
        JOB_REGISTRY[job_id]["completed_at"] = time.time()
        JOB_REGISTRY[job_id]["elapsed_sec"] = round(JOB_REGISTRY[job_id]["completed_at"] - JOB_REGISTRY[job_id]["started_at"], 2)
        JOB_REGISTRY[job_id]["results"] = {
            "report_url": f"/outputs/{report_filename}",
            "video_url": f"/outputs/{out_video_filename}" if render_video else None,
            "heatmap_url": f"/outputs/{heatmap_filename}",
            "summary": summary,
        }

        logger.info(f"Job {job_id} successfully completed in {JOB_REGISTRY[job_id]['elapsed_sec']}s.")

    except Exception as err:
        logger.exception(f"Job {job_id} encountered an error: {str(err)}")
        JOB_REGISTRY[job_id]["status"] = "failed"
        JOB_REGISTRY[job_id]["error"] = str(err)


# ------------------------------------------------------------------------------
# REST API Endpoints
# ------------------------------------------------------------------------------
@app.get("/health", tags=["System"])
def health_check():
    """Returns GPU status, CUDA acceleration availability, and service health."""
    cuda_available = torch.cuda.is_available()
    device_name = torch.cuda.get_device_name(0) if cuda_available else "CPU (Host Mode)"
    vram_free_gb = 0.0
    if cuda_available:
        vram_free_gb = torch.cuda.mem_get_info()[0] / (1024**3)

    return {
        "status": "online",
        "service": "SCOT AI Video Engine",
        "version": "1.0.0",
        "cuda_available": cuda_available,
        "device_name": device_name,
        "vram_free_gb": round(vram_free_gb, 2),
        "supported_sports": ["volleyball", "football", "basketball"],
        "active_jobs_count": len([j for j in JOB_REGISTRY.values() if j.get("status") == "processing"]),
    }


@app.post("/analyze/{sport_type}", tags=["Video Analytics"], status_code=status.HTTP_202_ACCEPTED)
async def analyze_sports_video(
    sport_type: str,
    background_tasks: BackgroundTasks,
    video: UploadFile = File(..., description="Match video file (MP4, MOV, AVI)"),
    user_id: Optional[str] = Form(None, description="Clerk Authenticated User ID"),
    stride: int = Form(1, description="Process every Nth frame (e.g. 1 for full FPS, 2 for 2x speed)"),
    render_video: bool = Form(True, description="Render overlay boxes & HUD to output MP4"),
):
    """
    Submits a video for computer vision analysis and FIVB/Tactical rule processing.
    Returns a Job ID immediately for polling or asynchronous webhook consumption.
    """
    sport_norm = sport_type.lower().strip()
    if sport_norm not in ["volleyball", "football", "basketball"]:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported sport '{sport_type}'. Supported: volleyball, football, basketball",
        )

    # Generate unique Job ID
    job_id = f"scot_{sport_norm}_{uuid.uuid4().hex[:12]}"
    file_ext = Path(video.filename).suffix or ".mp4"
    saved_video_path = UPLOADS_DIR / f"{job_id}{file_ext}"

    # Stream upload directly to disk safely
    try:
        with open(saved_video_path, "wb") as buffer:
            shutil.copyfileobj(video.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to write uploaded video: {str(e)}")

    # Initialize Job Registry Entry
    JOB_REGISTRY[job_id] = {
        "job_id": job_id,
        "sport": sport_norm,
        "user_id": user_id,
        "filename": video.filename,
        "status": "queued",
        "progress": 0.0,
        "created_at": time.time(),
    }

    # Dispatch to background executor
    background_tasks.add_task(
        execute_video_analysis_task,
        job_id=job_id,
        video_path=saved_video_path,
        sport_type=sport_norm,
        user_id=user_id,
        stride=max(1, stride),
        render_video=render_video,
    )

    return {
        "message": f"Video analysis job successfully scheduled for {sport_norm.upper()}",
        "job_id": job_id,
        "status": "queued",
        "check_status_url": f"/jobs/{job_id}",
    }


@app.get("/jobs/{job_id}", tags=["Video Analytics"])
def get_job_status(job_id: str):
    """Polls real-time analysis status, progress, and completed URLs."""
    if job_id not in JOB_REGISTRY:
        raise HTTPException(status_code=404, detail=f"Job ID '{job_id}' not found.")
    return JOB_REGISTRY[job_id]


@app.get("/download/report/{job_id}", tags=["Downloads"])
def download_analytics_report(job_id: str):
    """Downloads the full structured JSON analytics report."""
    report_file = OUTPUTS_DIR / f"{job_id}_analytics_report.json"
    if not report_file.exists():
        raise HTTPException(status_code=404, detail="Analytics report not found or job still processing.")
    return FileResponse(
        path=str(report_file),
        filename=f"{job_id}_scot_report.json",
        media_type="application/json",
    )


@app.get("/download/video/{job_id}", tags=["Downloads"])
def download_annotated_video(job_id: str):
    """Downloads the annotated video file with computer vision HUD overlays."""
    video_file = OUTPUTS_DIR / f"{job_id}_annotated.mp4"
    if not video_file.exists():
        raise HTTPException(status_code=404, detail="Annotated video not found or job still processing.")
    return FileResponse(
        path=str(video_file),
        filename=f"{job_id}_annotated.mp4",
        media_type="video/mp4",
    )


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8000"))
    logger.info(f"Starting SCOT AI microservice on http://0.0.0.0:{port}...")
    uvicorn.run("api.app:app", host="0.0.0.0", port=port, reload=False)

