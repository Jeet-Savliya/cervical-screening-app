import os
import uuid

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..storage import save_file

# Auth temporarily disabled — to re-enable, add back:
#   from ..auth import get_current_user
# and dependencies=[Depends(get_current_user)] below.
router = APIRouter(prefix="/api", tags=["images"])

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png"}
CONTENT_TYPES = {".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png"}


@router.post("/patients/{patient_id}/images", response_model=schemas.PatientImageOut)
async def upload_patient_image(patient_id: str, file: UploadFile = File(...), db: Session = Depends(get_db)):
    patient = db.query(models.Patient).filter(models.Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Only jpg/jpeg/png images are allowed")

    stored_name = f"{uuid.uuid4()}{ext}"
    contents = await file.read()
    save_file(contents, "patient_images", stored_name, CONTENT_TYPES[ext])

    image = models.PatientImage(patient_id=patient_id, filename=stored_name)
    db.add(image)
    db.commit()
    db.refresh(image)
    return image
