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
def get_doctor_queue(db: Session = Depends(get_db)):
    """Get active patient queue for Doctor Dashboard."""
    return db.query(Patient).order_by(Patient.patient_id.desc()).all()


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
