import io
import json
import os
import zipfile
from datetime import datetime

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy import inspect
from sqlalchemy.orm import Session

from .. import models
from ..database import SQLALCHEMY_DATABASE_URL, engine, get_db

# Auth temporarily disabled — to re-enable, add back:
#   from ..auth import get_current_user
# and dependencies=[Depends(get_current_user)] below.
router = APIRouter(prefix="/api/admin", tags=["admin"])

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
DB_PATH = os.path.join(BASE_DIR, "cervical_screening.db")
UPLOADS_DIR = os.path.join(BASE_DIR, "uploads")

IS_SQLITE = SQLALCHEMY_DATABASE_URL.startswith("sqlite")


def _default(value):
    """Makes datetimes JSON-serializable when dumping table rows."""
    if isinstance(value, datetime):
        return value.isoformat()
    return str(value)


def _dump_all_tables_as_json(db: Session) -> bytes:
    """Used when running on Postgres (no local .db file to just zip up).
    Reads every row from every table via SQLAlchemy and serializes to JSON."""
    inspector = inspect(engine)
    dump = {}
    for table_name in inspector.get_table_names():
        table = models.Base.metadata.tables.get(table_name)
        if table is None:
            continue
        rows = db.execute(table.select()).mappings().all()
        dump[table_name] = [dict(row) for row in rows]

    return json.dumps(dump, default=_default, indent=2).encode("utf-8")


@router.get("/backup")
def download_backup(db: Session = Depends(get_db)):
    buffer = io.BytesIO()

    with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED) as zf:
        if IS_SQLITE:
            if os.path.exists(DB_PATH):
                zf.write(DB_PATH, arcname="cervical_screening.db")

            # local-disk uploads only exist when not using R2 — harmless no-op otherwise
            for root, _dirs, files in os.walk(UPLOADS_DIR):
                for filename in files:
                    if filename == ".gitkeep":
                        continue
                    full_path = os.path.join(root, filename)
                    arcname = os.path.join("uploads", os.path.relpath(full_path, UPLOADS_DIR))
                    zf.write(full_path, arcname=arcname)
        else:
            # Postgres: there's no local file to zip, so dump every table's rows as JSON instead.
            # Uploaded photos live in R2 in this mode, which has its own durable replicated
            # storage — this backup covers the database only, not the images.
            zf.writestr("database_export.json", _dump_all_tables_as_json(db))
            zf.writestr(
                "README.txt",
                "This backup contains a JSON export of all database tables.\n"
                "Uploaded photos are stored in Cloudflare R2 and are not included here — "
                "R2 keeps its own durable, replicated copies of those files.\n",
            )

    buffer.seek(0)
    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    filename = f"cervical_screening_backup_{timestamp}.zip"

    return StreamingResponse(
        buffer,
        media_type="application/zip",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
