import os
import uuid
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..storage import save_file, delete_file

# Auth temporarily disabled — to re-enable, add back:
#   from ..auth import get_current_user
# and dependencies=[Depends(get_current_user)] below.
router = APIRouter(prefix="/api/reference-images", tags=["reference"])

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png"}
CONTENT_TYPES = {".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png"}

VALID_CATEGORIES = {"via_negative", "via_positive", "suspicious_cancer"}


@router.post("", response_model=schemas.ReferenceImageOut)
async def upload_reference_image(
    via_category: str = Form(...),
    subtype_label: Optional[str] = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    if via_category not in VALID_CATEGORIES:
        raise HTTPException(status_code=400, detail=f"via_category must be one of {VALID_CATEGORIES}")

    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Only jpg/jpeg/png images are allowed")

    stored_name = f"{uuid.uuid4()}{ext}"
    contents = await file.read()
    save_file(contents, "reference_images", stored_name, CONTENT_TYPES[ext])

    ref = models.ReferenceImage(filename=stored_name, via_category=via_category, subtype_label=subtype_label)
    db.add(ref)
    db.commit()
    db.refresh(ref)
    return ref


@router.get("", response_model=List[schemas.ReferenceImageOut])
def list_reference_images(via_category: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(models.ReferenceImage)
    if via_category:
        query = query.filter(models.ReferenceImage.via_category == via_category)
    return query.order_by(models.ReferenceImage.uploaded_at.desc()).all()


@router.delete("/{reference_id}", status_code=204)
def delete_reference_image(reference_id: str, db: Session = Depends(get_db)):
    ref = db.query(models.ReferenceImage).filter(models.ReferenceImage.id == reference_id).first()
    if not ref:
        raise HTTPException(status_code=404, detail="Reference image not found")

    delete_file("reference_images", ref.filename)

    db.delete(ref)
    db.commit()
    return None
