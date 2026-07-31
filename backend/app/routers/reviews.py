from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db

# Auth temporarily disabled — to re-enable, add back:
#   from ..auth import get_current_user
# and dependencies=[Depends(get_current_user)] below.
router = APIRouter(prefix="/api/patients", tags=["reviews"])


@router.get("/{patient_id}/review", response_model=schemas.CaseReviewOut)
def get_review(patient_id: str, db: Session = Depends(get_db)):
    review = db.query(models.CaseReview).filter(models.CaseReview.patient_id == patient_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    return schemas.CaseReviewOut.from_orm_split(review)


@router.put("/{patient_id}/review", response_model=schemas.CaseReviewOut)
def update_review(patient_id: str, payload: schemas.CaseReviewIn, db: Session = Depends(get_db)):
    review = db.query(models.CaseReview).filter(models.CaseReview.patient_id == patient_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    if payload.via_finding is not None:
        review.via_finding = payload.via_finding
    if payload.doctor_notes is not None:
        review.doctor_notes = payload.doctor_notes
    review.reviewed_at = datetime.utcnow()

    db.commit()
    db.refresh(review)
    return schemas.CaseReviewOut.from_orm_split(review)
