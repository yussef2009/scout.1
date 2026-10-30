import os
import logging
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends, status
from fastapi.responses import FileResponse
from starlette.concurrency import run_in_threadpool
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

logger = logging.getLogger("scoutai.videos")

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
    Handles multipart file upload in local development mode with quota verification,
    offloading synchronous disk I/O and DB writes to a background worker threadpool.
    """
    target_name = filename or file.filename or "uploaded_video.mp4"
    content = await file.read()

    # Offload blocking disk write to threadpool
    saved_name = await run_in_threadpool(storage_service.save_local_file, target_name, content)

    # Offload atomic usage increment to threadpool
    def _record_usage():
        try:
            return usage_service.increment_usage(db, org.id, "video_uploads", amount=1)
        except Exception as e:
            logger.error(f"[Video Upload] Failed to record video upload usage: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Database error recording usage quota.",
            )

    await run_in_threadpool(_record_usage)

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
    Streams local video files with strict path traversal prevention.
    """
    safe_basename = os.path.basename(filename)
    path = storage_service.get_local_filepath(safe_basename)
    if not path or not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Video file not found")
    return FileResponse(path, media_type="video/mp4", filename=safe_basename)


@router.post("/detect-players", response_model=DetectPlayersResponse)
async def detect_players(req: DetectPlayersRequest):
    """
    Detects 100% of distinct players (starters + substitutes) across full matches
    using adaptive temporal sampling, local entity clustering, and single-pass Gemini Vision verification.
    """
    local_video_path = None
    if req.videoId:
        local_video_path = storage_service.get_local_filepath(req.videoId)
    elif req.videoUrl:
        if "/api/v1/videos/stream/" in req.videoUrl:
            filename = req.videoUrl.split("/api/v1/videos/stream/")[-1]
            local_video_path = storage_service.get_local_filepath(filename)
        elif os.path.exists(req.videoUrl):
            local_video_path = req.videoUrl

    players = await gemini_service.detect_players(
        sport_key=req.sport,
        frames_base64=req.framesBase64,
        video_path=local_video_path,
    )
    return DetectPlayersResponse(
        playerCount=len(players),
        isSinglePlayer=len(players) <= 1,
        players=players,
        scanSource="adaptive_cv_gemini",
    )
