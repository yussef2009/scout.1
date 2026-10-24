import os
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from fastapi.responses import FileResponse
from typing import Optional, List
from ..services.storage_service import storage_service
from ..services.gemini_service import gemini_service
from ..schemas.analysis import DetectPlayersRequest, DetectPlayersResponse
from ..schemas.player import DetectedPlayerSchema

router = APIRouter(prefix="/api/v1/videos", tags=["Videos"])


@router.post("/upload-url")
def get_upload_url(filename: str = Form(...), contentType: str = Form("video/mp4")):
    """
    Returns an S3/Cloudflare R2 presigned URL or a local upload route.
    """
    result = storage_service.generate_upload_url(filename=filename, content_type=contentType)
    return result


@router.post("/upload-local")
async def upload_local_video(file: UploadFile = File(...), filename: Optional[str] = None):
    """
    Handles direct multipart file upload in local development mode.
    """
    target_name = filename or file.filename or "uploaded_video.mp4"
    content = await file.read()
    saved_name = storage_service.save_local_file(target_name, content)
    return {
        "status": "success",
        "fileKey": saved_name,
        "publicUrl": f"/api/v1/videos/stream/{saved_name}",
        "sizeBytes": len(content),
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
