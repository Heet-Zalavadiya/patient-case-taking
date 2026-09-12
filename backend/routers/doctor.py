from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database.connection import get_db
from models.doctor import Doctor
from models.patient import Patient
from schemas.patient import PatientResponse

router = APIRouter(tags=["Doctor"])


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
