from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database.connection import get_db
from models.patient import Patient
from schemas.patient import PatientCreate, PatientResponse
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

@router.get("/{patient_id}", response_model=PatientResponse)
def get_patient(patient_id: int, db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.patient_id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient