"""
SCOT AI — Appwrite Cloud Storage Service
Handles raw match uploads and rendered YOLOv11 annotated video streams via Appwrite Storage SDK.
"""

import logging
import os
from pathlib import Path
from typing import Any, Dict, Optional

from appwrite.client import Client
from appwrite.id import ID
from appwrite.input_file import InputFile
from appwrite.services.storage import Storage

from .config import settings

logger = logging.getLogger("scot_ai.storage")

_appwrite_client: Optional[Client] = None
_appwrite_storage: Optional[Storage] = None


def get_appwrite_storage() -> Storage:
    """
    Initializes and returns the singleton Appwrite Storage client.
    Configured with API Endpoint, Project ID, and Secret Key.
    """
    global _appwrite_client, _appwrite_storage

    if _appwrite_storage is not None:
        return _appwrite_storage

    if not settings.APPWRITE_PROJECT_ID or not settings.APPWRITE_API_KEY:
        logger.warning(
            "Appwrite credentials (APPWRITE_PROJECT_ID or APPWRITE_API_KEY) are not configured. "
            "Storage calls will be mocked in local/test environments."
        )

    client = Client()
    client.set_endpoint(settings.APPWRITE_ENDPOINT)
    client.set_project(settings.APPWRITE_PROJECT_ID)
    client.set_key(settings.APPWRITE_API_KEY)

    _appwrite_client = client
    _appwrite_storage = Storage(client)
    logger.info("Initialized Appwrite Storage client for project: %s", settings.APPWRITE_PROJECT_ID)
    return _appwrite_storage


def build_appwrite_view_url(file_id: str) -> str:
    """Constructs the public direct stream/view URL for an Appwrite storage file."""
    endpoint = settings.APPWRITE_ENDPOINT.rstrip("/")
    bucket_id = settings.APPWRITE_BUCKET_ID
    project_id = settings.APPWRITE_PROJECT_ID
    return f"{endpoint}/storage/buckets/{bucket_id}/files/{file_id}/view?project={project_id}"


def build_appwrite_download_url(file_id: str) -> str:
    """Constructs the direct download attachment URL for an Appwrite storage file."""
    endpoint = settings.APPWRITE_ENDPOINT.rstrip("/")
    bucket_id = settings.APPWRITE_BUCKET_ID
    project_id = settings.APPWRITE_PROJECT_ID
    return f"{endpoint}/storage/buckets/{bucket_id}/files/{file_id}/download?project={project_id}"


def upload_video_to_appwrite(local_file_path: str, filename: Optional[str] = None) -> Dict[str, Any]:
    """
    Uploads a local video (.mp4 / .mov / .webm) to the configured Appwrite Storage bucket.
    
    Args:
        local_file_path: Absolute or relative path to the local video file.
        filename: Optional custom filename to display in the bucket. Defaults to basename.

    Returns:
        dict containing 'file_id', 'url', 'download_url', 'filename', and 'size_bytes'.
    """
    path_obj = Path(local_file_path).resolve()
    if not path_obj.exists() or not path_obj.is_file():
        raise FileNotFoundError(f"Video file not found at: {local_file_path}")

    file_size = path_obj.stat().st_size
    resolved_filename = filename or path_obj.name

    logger.info(
        "Uploading video to Appwrite Storage (bucket=%s, file=%s, size=%.2f MB)...",
        settings.APPWRITE_BUCKET_ID,
        resolved_filename,
        file_size / (1024 * 1024),
    )

    # In local testing without Appwrite API keys, gracefully provide deterministic mock metadata
    if not settings.APPWRITE_PROJECT_ID or not settings.APPWRITE_API_KEY:
        mock_file_id = f"mock_{path_obj.stem}_{os.urandom(4).hex()}"
        mock_url = build_appwrite_view_url(mock_file_id)
        logger.warning("Running without live Appwrite credentials. Generated mock URL: %s", mock_url)
        return {
            "file_id": mock_file_id,
            "url": mock_url,
            "download_url": build_appwrite_download_url(mock_file_id),
            "filename": resolved_filename,
            "size_bytes": file_size,
        }

    storage = get_appwrite_storage()
    file_id = ID.unique()

    try:
        input_file = InputFile.from_path(str(path_obj), filename=resolved_filename)
        created_file = storage.create_file(
            bucket_id=settings.APPWRITE_BUCKET_ID,
            file_id=file_id,
            file=input_file,
        )

        returned_id = created_file.get("$id", file_id) if isinstance(created_file, dict) else getattr(created_file, "id", file_id)
        view_url = build_appwrite_view_url(returned_id)
        download_url = build_appwrite_download_url(returned_id)

        logger.info("Successfully uploaded video to Appwrite: file_id=%s, url=%s", returned_id, view_url)
        return {
            "file_id": returned_id,
            "url": view_url,
            "download_url": download_url,
            "filename": resolved_filename,
            "size_bytes": file_size,
        }

    except Exception as exc:
        logger.error("Failed to upload video to Appwrite: %s", exc, exc_info=True)
        raise RuntimeError(f"Appwrite storage upload failed: {exc}") from exc


def delete_video_from_appwrite(file_id: str) -> bool:
    """
    Deletes an existing file from the Appwrite Storage bucket (e.g. cleaning up raw uncompressed clips).
    
    Args:
        file_id: The Appwrite file identifier.

    Returns:
        bool: True if deletion succeeded, False otherwise.
    """
    if not file_id:
        return False

    if file_id.startswith("mock_") or not settings.APPWRITE_PROJECT_ID or not settings.APPWRITE_API_KEY:
        logger.debug("Skipping remote Appwrite deletion for mock/unconfigured file: %s", file_id)
        return True

    storage = get_appwrite_storage()
    try:
        storage.delete_file(
            bucket_id=settings.APPWRITE_BUCKET_ID,
            file_id=file_id,
        )
        logger.info("Deleted file %s from Appwrite bucket %s", file_id, settings.APPWRITE_BUCKET_ID)
        return True
    except Exception as exc:
        logger.warning("Could not delete file %s from Appwrite: %s", file_id, exc)
        return False

