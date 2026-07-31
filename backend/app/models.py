import uuid
from datetime import datetime

from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship

from .database import Base


def gen_id():
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=gen_id)
    username = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class Patient(Base):
    __tablename__ = "patients"

    id = Column(String, primary_key=True, default=gen_id)
    name = Column(String, nullable=False)
    age = Column(Integer, nullable=False)
    address = Column(String, nullable=True)
    consent_given = Column(Boolean, default=False, nullable=False)
    consent_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    risk_factor = relationship("RiskFactor", back_populates="patient", uselist=False, cascade="all, delete-orphan")
    images = relationship("PatientImage", back_populates="patient", cascade="all, delete-orphan")
    review = relationship("CaseReview", back_populates="patient", uselist=False, cascade="all, delete-orphan")


class RiskFactor(Base):
    __tablename__ = "risk_factors"

    id = Column(String, primary_key=True, default=gen_id)
    patient_id = Column(String, ForeignKey("patients.id"), nullable=False)

    age_first_intercourse = Column(Integer, nullable=True)
    residence_type = Column(String, nullable=True)  # rural / urban
    literate = Column(Boolean, default=True)
    multiple_partners = Column(Boolean, default=False)
    discharge = Column(Boolean, default=False)
    post_coital_bleeding = Column(Boolean, default=False)
    parity = Column(Integer, default=0)  # number of pregnancies (high parity flag derived)
    hiv_positive = Column(Boolean, default=False)
    ocp_years = Column(Integer, default=0)  # years of oral contraceptive use
    smoking_tobacco = Column(Boolean, default=False)
    immunocompromised_or_std = Column(Boolean, default=False)

    # optional extra fields suggested for a more complete risk picture
    hpv_vaccinated = Column(Boolean, nullable=True)
    family_history_cancer = Column(Boolean, default=False)
    last_screening_date = Column(String, nullable=True)
    last_screening_result = Column(String, nullable=True)
    abnormal_bleeding_pattern = Column(Boolean, default=False)

    patient = relationship("Patient", back_populates="risk_factor")


class PatientImage(Base):
    __tablename__ = "patient_images"

    id = Column(String, primary_key=True, default=gen_id)
    patient_id = Column(String, ForeignKey("patients.id"), nullable=False)
    filename = Column(String, nullable=False)
    uploaded_at = Column(DateTime, default=datetime.utcnow)

    patient = relationship("Patient", back_populates="images")


class ReferenceImage(Base):
    __tablename__ = "reference_images"

    id = Column(String, primary_key=True, default=gen_id)
    filename = Column(String, nullable=False)
    via_category = Column(String, nullable=False)  # e.g. "via_negative", "via_positive", "suspicious_cancer"
    subtype_label = Column(String, nullable=True)  # e.g. "Dense acetowhite with well-defined margins"
    uploaded_at = Column(DateTime, default=datetime.utcnow)


class CaseReview(Base):
    __tablename__ = "case_reviews"

    id = Column(String, primary_key=True, default=gen_id)
    patient_id = Column(String, ForeignKey("patients.id"), nullable=False)

    risk_score = Column(Integer, nullable=True)
    risk_level = Column(String, nullable=True)  # Low / Medium / High
    risk_factors_detail = Column(Text, nullable=True)  # newline-joined list of contributing factors
    red_flag_symptoms = Column(Text, nullable=True)  # newline-joined list, recommend exam if non-empty
    informational_flags = Column(Text, nullable=True)  # newline-joined list, not scored
    via_finding = Column(String, nullable=True)  # doctor-selected category after comparison
    doctor_notes = Column(Text, nullable=True)
    reviewed_at = Column(DateTime, nullable=True)

    patient = relationship("Patient", back_populates="review")
