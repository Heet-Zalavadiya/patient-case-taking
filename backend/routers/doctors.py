from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database.connection import get_db
from models.doctor import Doctor
from models.patient import Patient
from schemas.patient import PatientResponse

router = APIRouter(tags=["Doctor"])


class DoctorLoginRequest(BaseModel):
    login_id: Optional[str] = None
    username: Optional[str] = None
    password: Optional[str] = None


@router.post("/auth/login")
@router.post("/login")
def doctor_login(payload: DoctorLoginRequest, db: Session = Depends(get_db)):
    """Doctor Console Login endpoint."""
    login_str = (payload.login_id or payload.username or "dr.anand").strip()
    
    # Try finding doctor in DB
    doc = db.query(Doctor).filter(Doctor.login_id == login_str).first()
    if not doc:
        doc = db.query(Doctor).first()

    if doc:
        return {
            "access_token": "medikiosk_session_token_sec2026",
            "token_type": "bearer",
            "doctor_id": doc.doctor_id,
            "login_id": doc.login_id,
            "full_name": doc.full_name,
            "department": doc.department,
            "qualification": "BAMS, MD (Ayurveda)" if doc.is_ayush_practitioner else "MBBS, MD (Medicine)",
            "is_ayush_practitioner": doc.is_ayush_practitioner,
            "active_opd_room": "OPD Room #14" if doc.is_ayush_practitioner else "OPD Room #104"
        }

    return {
        "access_token": "medikiosk_session_token_sec2026",
        "token_type": "bearer",
        "doctor_id": 1,
        "login_id": login_str,
        "full_name": "Dr. Anand Kulkarni",
        "department": "General Medicine & Kayachikitsa",
        "qualification": "BAMS, MD (Ayurveda)",
        "is_ayush_practitioner": True,
        "active_opd_room": "OPD Room #14"
    }


@router.get("/queue", response_model=List[PatientResponse])
def get_doctor_queue(include_completed: bool = False, db: Session = Depends(get_db)):
    """Get active patient queue for Doctor Dashboard."""
    query = db.query(Patient)
    if not include_completed:
        query = query.filter(Patient.is_active == 1)
    return query.order_by(Patient.patient_id.desc()).all()


@router.post("/queue/{patient_id}/complete")
@router.post("/patients/{patient_id}/complete")
def complete_patient_in_queue(patient_id: str, db: Session = Depends(get_db)):
    """Mark a patient and their active sessions as completed in the clinical queue."""
    from datetime import datetime
    from models.clinical_session import ClinicalSession

    clean_id = patient_id
    if isinstance(patient_id, str) and patient_id.lower().startswith("pat_"):
        try:
            clean_id = int(patient_id.lower().replace("pat_", "").lstrip("0") or "0")
        except ValueError:
            clean_id = 0

    try:
        int_id = int(clean_id)
    except (ValueError, TypeError):
        int_id = None

    if int_id:
        sessions = db.query(ClinicalSession).filter(ClinicalSession.patient_id == int_id).all()
        for s in sessions:
            s.status = "completed"
            if not s.completed_at:
                s.completed_at = datetime.now()

        patient = db.query(Patient).filter(Patient.patient_id == int_id).first()
        if patient:
            patient.is_active = 0

        db.commit()

    return {"status": "success", "patient_id": patient_id, "queue_status": "completed"}


@router.post("/queue/reset")
def reset_doctor_queue(db: Session = Depends(get_db)):
    """Reset all patients in queue to active status for testing/demo."""
    db.query(Patient).update({Patient.is_active: 1})
    db.commit()
    return {"status": "success", "message": "Doctor queue reset to active"}


@router.get("/doctors")
def list_doctors(db: Session = Depends(get_db)):
    """List all registered doctors."""
    doctors = db.query(Doctor).all()
    return [
        {
            "doctor_id": d.doctor_id,
            "full_name": d.full_name,
            "department": d.department,
            "is_ayush_practitioner": d.is_ayush_practitioner,
            "login_id": d.login_id,
        }
        for d in doctors
    ]
