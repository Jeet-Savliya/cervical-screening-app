import os

from dotenv import load_dotenv

load_dotenv()

# Generic S3-compatible object storage settings. Works with Supabase Storage,
# Cloudflare R2, AWS S3, or anything else that speaks the S3 protocol —
# just plug in that provider's values. Leave all unset to use local disk
# instead (useful for local development without any cloud account at all).
S3_ENDPOINT_URL = os.getenv("S3_ENDPOINT_URL")
S3_REGION = os.getenv("S3_REGION", "us-east-1")
S3_ACCESS_KEY_ID = os.getenv("S3_ACCESS_KEY_ID")
S3_SECRET_ACCESS_KEY = os.getenv("S3_SECRET_ACCESS_KEY")
S3_BUCKET_NAME = os.getenv("S3_BUCKET_NAME")
S3_PUBLIC_URL = os.getenv("S3_PUBLIC_URL")  # base URL for publicly viewing an uploaded file

USE_S3 = bool(S3_ENDPOINT_URL and S3_ACCESS_KEY_ID and S3_SECRET_ACCESS_KEY and S3_BUCKET_NAME and S3_PUBLIC_URL)

LOCAL_UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
LOCAL_PUBLIC_BASE = os.getenv("BACKEND_PUBLIC_URL", "http://localhost:8000")

_client = None
if USE_S3:
    import boto3
    from botocore.client import Config

    _client = boto3.client(
        "s3",
        endpoint_url=S3_ENDPOINT_URL,
        aws_access_key_id=S3_ACCESS_KEY_ID,
        aws_secret_access_key=S3_SECRET_ACCESS_KEY,
        config=Config(signature_version="s3v4"),
        region_name=S3_REGION,
    )


def save_file(file_bytes: bytes, subfolder: str, filename: str, content_type: str) -> None:
    """Saves a file to S3-compatible storage if configured, otherwise to local disk
    under uploads/<subfolder>/."""
    key = f"{subfolder}/{filename}"
    if USE_S3:
        _client.put_object(Bucket=S3_BUCKET_NAME, Key=key, Body=file_bytes, ContentType=content_type)
    else:
        local_path = os.path.join(LOCAL_UPLOAD_DIR, subfolder, filename)
        os.makedirs(os.path.dirname(local_path), exist_ok=True)
        with open(local_path, "wb") as f:
            f.write(file_bytes)


def delete_file(subfolder: str, filename: str) -> None:
    key = f"{subfolder}/{filename}"
    if USE_S3:
        _client.delete_object(Bucket=S3_BUCKET_NAME, Key=key)
    else:
        local_path = os.path.join(LOCAL_UPLOAD_DIR, subfolder, filename)
        if os.path.exists(local_path):
            os.remove(local_path)


def get_public_url(subfolder: str, filename: str) -> str:
    """Computed fresh each time, so it always reflects current storage config —
    nothing storage-specific is saved in the database itself."""
    if USE_S3:
        return f"{S3_PUBLIC_URL}/{subfolder}/{filename}"
    return f"{LOCAL_PUBLIC_BASE}/uploads/{subfolder}/{filename}"
