from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from database.connection import get_db
from models.patient import Patient
from models.consent import Consent
from models.clinical_session import ClinicalSession
from models.structured_history import StructuredHistory
from schemas.patient import PatientCreate, PatientResponse
from schemas.clinical import SessionResponse, StructuredHistoryResponse
from schemas.clinical import SessionResponse, StructuredHistoryResponse, ConsentCreate, ConsentResponse
import hashlib

router = APIRouter(prefix="/patients", tags=["Patients"])

def hash_password(password: str) -> str:
    # Simple hash for now — in production use bcrypt
    return hashlib.sha256(password.encode()).hexdigest()

@router.post("/", response_model=PatientResponse, status_code=201)
def create_patient(patient_data: PatientCreate, db: Session = Depends(get_db)):
    # Check if login_id already exists
    if patient_data.login_id:
        existing = db.query(Patient).filter(Patient.login_id == patient_data.login_id).first()
        if existing:
            raise HTTPException(status_code=400, detail="login_id already registered")

    new_patient = Patient(
        full_name           = patient_data.full_name,
        preferred_language  = patient_data.preferred_language,
        accessibility_mode  = patient_data.accessibility_mode,
        abha_id             = patient_data.abha_id,
        aadhaar_ref         = patient_data.aadhaar_ref,
        date_of_birth       = patient_data.date_of_birth,
        age                 = patient_data.age,
        gender              = patient_data.gender,
        phone_number        = patient_data.phone_number,
        login_id            = patient_data.login_id,
        password_hash       = hash_password(patient_data.password) if patient_data.password else None,
    )
    db.add(new_patient)
    db.commit()
    db.refresh(new_patient)
    return new_patient


@router.get("/", response_model=list[PatientResponse])
def list_patients(db: Session = Depends(get_db)):
    return db.query(Patient).all()


@router.get("/{patient_id}", response_model=PatientResponse)
def get_patient(patient_id: int, db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.patient_id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient


@router.get("/{patient_id}/history", response_model=list[StructuredHistoryResponse])
def get_patient_history(patient_id: int, db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.patient_id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return (
        db.query(StructuredHistory)
        .join(ClinicalSession, StructuredHistory.session_id == ClinicalSession.session_id)
        .filter(ClinicalSession.patient_id == patient_id)
        .order_by(StructuredHistory.generated_at.desc())
        .all()
    )


@router.get("/{patient_id}/sessions", response_model=list[SessionResponse])
def get_patient_sessions(patient_id: int, db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.patient_id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return (
        db.query(ClinicalSession)
        .filter(ClinicalSession.patient_id == patient_id)
        .order_by(ClinicalSession.started_at.desc())
        .all()
    )


@router.post("/{patient_id}/consent", response_model=ConsentResponse, status_code=201)
def create_consent(patient_id: int, consent_data: ConsentCreate, db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.patient_id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    consent = Consent(
        patient_id=patient_id,
        consent_type=consent_data.consent_type,
        is_granted=1 if consent_data.is_granted else 0,
        granted_via=consent_data.granted_via,
        granted_at=func.now() if consent_data.is_granted else None,
    )
    db.add(consent)
    db.commit()
    db.refresh(consent)
    return consent