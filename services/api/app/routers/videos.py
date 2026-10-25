import os
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from fastapi.responses import FileResponse
from typing import Optional, List
from sqlalchemy.orm import Session

from ..models.database import get_db
from ..models.organization import Organization
from ..services.storage_service import storage_service
from ..services.gemini_service import gemini_service
from ..services.usage_service import usage_service
from ..dependencies.quota_guard import require_video_upload_quota
from ..schemas.analysis import DetectPlayersRequest, DetectPlayersResponse
from ..schemas.player import DetectedPlayerSchema

router = APIRouter(prefix="/api/v1/videos", tags=["Videos"])


@router.post("/upload-url")
def get_upload_url(
    filename: str = Form(...),
    contentType: str = Form("video/mp4"),
    org: Organization = Depends(require_video_upload_quota),
):
    """
    Returns an S3/Cloudflare R2 presigned URL or a local upload route after verifying organization tier upload quota.
    """
    result = storage_service.generate_upload_url(filename=filename, content_type=contentType)
    return result


@router.post("/upload-local")
async def upload_local_video(
    file: UploadFile = File(...),
    filename: Optional[str] = None,
    org: Organization = Depends(require_video_upload_quota),
    db: Session = Depends(get_db),
):
    """
    Handles direct multipart file upload in local development mode with quota verification and usage metering.
    """
    target_name = filename or file.filename or "uploaded_video.mp4"
    content = await file.read()
    saved_name = storage_service.save_local_file(target_name, content)

    # Increment monthly video upload usage meter
    usage_service.increment_usage(db, org.id, "video_uploads", amount=1)

    return {
        "status": "success",
        "fileKey": saved_name,
        "publicUrl": f"/api/v1/videos/stream/{saved_name}",
        "sizeBytes": len(content),
        "organizationId": org.id,
    }


@router.get("/stream/{filename}")
def stream_video(filename: str):
    """
    Streams local video files.
    """
    path = storage_service.get_local_filepath(filename)
    if not path or not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Video file not found")
    return FileResponse(path, media_type="video/mp4", filename=filename)


@router.post("/detect-players", response_model=DetectPlayersResponse)
async def detect_players(req: DetectPlayersRequest):
    """
    Detects distinct players in footage using Computer Vision + Gemini Vision.
    """
    players = await gemini_service.detect_players(
        sport_key=req.sport,
        frames_base64=req.framesBase64,
    )
    return DetectPlayersResponse(
        playerCount=len(players),
        isSinglePlayer=len(players) <= 1,
        players=players,
        scanSource="hybrid_cv_gemini",
    )
