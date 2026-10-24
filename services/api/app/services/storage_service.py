import os
import uuid
import boto3
from botocore.config import Config
from botocore.exceptions import ClientError
from typing import Dict, Any, Optional
from ..config import settings


class StorageService:
    def __init__(self):
        self.mode = settings.STORAGE_MODE.lower()
        self.local_dir = os.path.abspath(settings.LOCAL_UPLOAD_DIR)
        os.makedirs(self.local_dir, exist_ok=True)

        self.s3_client = None
        if self.mode in ("s3", "r2") and settings.S3_ACCESS_KEY and settings.S3_SECRET_KEY:
            try:
                s3_config = Config(signature_version="s3v4", s3={"addressing_style": "virtual"})
                kwargs = {
                    "service_name": "s3",
                    "aws_access_key_id": settings.S3_ACCESS_KEY,
                    "aws_secret_access_key": settings.S3_SECRET_KEY,
                    "region_name": settings.S3_REGION or "auto",
                    "config": s3_config,
                }
                if settings.S3_ENDPOINT:
                    kwargs["endpoint_url"] = settings.S3_ENDPOINT
                self.s3_client = boto3.client(**kwargs)
            except Exception as e:
                print(f"[Storage Warning] S3 initialization failed ({e}), falling back to local mode.")
                self.mode = "local"

    def generate_upload_url(self, filename: str, content_type: str = "video/mp4") -> Dict[str, Any]:
        file_ext = os.path.splitext(filename)[1] or ".mp4"
        unique_key = f"videos/{uuid.uuid4()}{file_ext}"

        if self.mode in ("s3", "r2") and self.s3_client:
            try:
                presigned_url = self.s3_client.generate_presigned_url(
                    ClientMethod="put_object",
                    Params={
                        "Bucket": settings.S3_BUCKET,
                        "Key": unique_key,
                        "ContentType": content_type,
                    },
                    ExpiresIn=3600,
                )
                public_url = (
                    f"{settings.S3_PUBLIC_DOMAIN.rstrip('/')}/{unique_key}"
                    if settings.S3_PUBLIC_DOMAIN
                    else f"https://{settings.S3_BUCKET}.s3.amazonaws.com/{unique_key}"
                )
                return {
                    "mode": self.mode,
                    "uploadUrl": presigned_url,
                    "fileKey": unique_key,
                    "publicUrl": public_url,
                }
            except ClientError as e:
                print(f"[Storage Error] S3 presign failed ({e}), falling back to local.")

        # Local mode: endpoint accepts multipart upload
        local_filename = f"{uuid.uuid4()}{file_ext}"
        return {
            "mode": "local",
            "uploadUrl": f"/api/v1/videos/upload-local?filename={local_filename}",
            "fileKey": local_filename,
            "publicUrl": f"/api/v1/videos/stream/{local_filename}",
        }

    def save_local_file(self, filename: str, content: bytes) -> str:
        safe_filename = os.path.basename(filename)
        dest_path = os.path.join(self.local_dir, safe_filename)
        with open(dest_path, "wb") as f:
            f.write(content)
        return safe_filename

    def get_local_filepath(self, filename: str) -> Optional[str]:
        safe_filename = os.path.basename(filename)
        full_path = os.path.join(self.local_dir, safe_filename)
        if os.path.exists(full_path):
            return full_path
        return None


storage_service = StorageService()
