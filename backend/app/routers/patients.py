from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..risk_score import compute_background_risk, get_red_flag_symptoms, get_informational_flags
from ..storage import delete_file

# Auth temporarily disabled — to re-enable, add back:
#   from ..auth import get_current_user
# and dependencies=[Depends(get_current_user)] below.
router = APIRouter(prefix="/api/patients", tags=["patients"])


@router.post("", response_model=schemas.PatientOut)
def create_patient(payload: schemas.PatientCreate, db: Session = Depends(get_db)):
    if not payload.consent_given:
        raise HTTPException(
            status_code=400,
            detail="Patient consent is required before screening data can be stored.",
        )

    patient = models.Patient(
        name=payload.name,
        age=payload.age,
        address=payload.address,
        consent_given=True,
        consent_at=datetime.utcnow(),
    )
    db.add(patient)
    db.flush()

    rf_data = payload.risk_factors.model_dump()
    risk_factor = models.RiskFactor(patient_id=patient.id, **rf_data)
    db.add(risk_factor)
    db.flush()

    score, level, contributing = compute_background_risk(risk_factor)
    red_flags = get_red_flag_symptoms(risk_factor)
    info_flags = get_informational_flags(risk_factor)

    review = models.CaseReview(
        patient_id=patient.id,
        risk_score=score,
        risk_level=level,
        risk_factors_detail="\n".join(contributing) if contributing else None,
        red_flag_symptoms="\n".join(red_flags) if red_flags else None,
        informational_flags="\n".join(info_flags) if info_flags else None,
    )
    db.add(review)

    db.commit()
    db.refresh(patient)
    return patient


@router.get("", response_model=List[schemas.PatientOut])
def list_patients(db: Session = Depends(get_db)):
    return db.query(models.Patient).order_by(models.Patient.created_at.desc()).all()


@router.get("/{patient_id}", response_model=schemas.PatientOut)
def get_patient(patient_id: str, db: Session = Depends(get_db)):
    patient = db.query(models.Patient).filter(models.Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient


@router.delete("/{patient_id}", status_code=204)
def delete_patient(patient_id: str, db: Session = Depends(get_db)):
    patient = db.query(models.Patient).filter(models.Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    # remove uploaded image files (R2 or local disk, whichever is configured) before deleting the DB rows
    for img in patient.images:
        delete_file("patient_images", img.filename)

    db.delete(patient)  # cascades to risk_factor, images, review via relationship config
    db.commit()
    return None
