from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, ConfigDict, computed_field

from .storage import get_public_url


class RiskFactorIn(BaseModel):
    age_first_intercourse: Optional[int] = None
    residence_type: Optional[str] = None
    literate: bool = True
    multiple_partners: bool = False
    discharge: bool = False
    post_coital_bleeding: bool = False
    parity: int = 0
    hiv_positive: bool = False
    ocp_years: int = 0
    smoking_tobacco: bool = False
    immunocompromised_or_std: bool = False
    hpv_vaccinated: Optional[bool] = None
    family_history_cancer: bool = False
    last_screening_date: Optional[str] = None
    last_screening_result: Optional[str] = None
    abnormal_bleeding_pattern: bool = False


class RiskFactorOut(RiskFactorIn):
    model_config = ConfigDict(from_attributes=True)
    id: str
    patient_id: str


class PatientCreate(BaseModel):
    name: str
    age: int
    address: Optional[str] = None
    consent_given: bool = False
    risk_factors: RiskFactorIn


class PatientImageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    filename: str
    uploaded_at: datetime

    @computed_field
    @property
    def url(self) -> str:
        return get_public_url("patient_images", self.filename)


class PatientOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    name: str
    age: int
    address: Optional[str]
    consent_given: bool
    consent_at: Optional[datetime]
    created_at: datetime
    risk_factor: Optional[RiskFactorOut] = None
    images: List[PatientImageOut] = []


class ReferenceImageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    filename: str
    via_category: str
    subtype_label: Optional[str]

    @computed_field
    @property
    def url(self) -> str:
        return get_public_url("reference_images", self.filename)


class CaseReviewIn(BaseModel):
    via_finding: Optional[str] = None
    doctor_notes: Optional[str] = None


class CaseReviewOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    patient_id: str
    risk_score: Optional[int]
    risk_level: Optional[str]
    risk_factors_detail: Optional[List[str]] = []
    red_flag_symptoms: Optional[List[str]] = []
    informational_flags: Optional[List[str]] = []
    via_finding: Optional[str]
    doctor_notes: Optional[str]
    reviewed_at: Optional[datetime]

    @classmethod
    def from_orm_split(cls, review):
        def split(text):
            return text.split("\n") if text else []
        return cls(
            id=review.id,
            patient_id=review.patient_id,
            risk_score=review.risk_score,
            risk_level=review.risk_level,
            risk_factors_detail=split(review.risk_factors_detail),
            red_flag_symptoms=split(review.red_flag_symptoms),
            informational_flags=split(review.informational_flags),
            via_finding=review.via_finding,
            doctor_notes=review.doctor_notes,
            reviewed_at=review.reviewed_at,
        )
