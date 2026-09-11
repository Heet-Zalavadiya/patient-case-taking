import hashlib
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.orm import Session, joinedload

from database.connection import get_db
from models.clinical_session import ClinicalSession
from models.clinical_summary import ClinicalSummary
from models.document_extraction import (
    DocumentExtractedCondition,
    DocumentExtractedLabValue,
    DocumentExtractedMedication,
)
from models.medical_document import MedicalDocument
from models.patient import Patient
from models.clinical_session import ClinicalSession
from models.structured_history import StructuredHistory
from schemas.clinical import (
    ClinicalSummaryResponse,
    MedicalDocumentDetailResponse,
    SessionResponse,
    StructuredHistoryResponse,
)
from schemas.patient import PatientCreate, PatientResponse
from schemas.clinical import SessionResponse, StructuredHistoryResponse
import hashlib

router = APIRouter(prefix="/patients", tags=["Patients"])


def hash_password(password: str) -> str:
    # Simple hash for now — in production use bcrypt
    return hashlib.sha256(password.encode()).hexdigest()


@router.get("/", response_model=List[PatientResponse])
def list_patients(db: Session = Depends(get_db)):
    """List all registered patients (used for Doctor Dashboard patient list)."""
    return db.query(Patient).order_by(Patient.patient_id.desc()).all()


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


@router.get("/{patient_id}/history", response_model=List[StructuredHistoryResponse])
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


@router.get("/{patient_id}/sessions", response_model=List[SessionResponse])
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


@router.get("/{patient_id}/summary", response_model=List[ClinicalSummaryResponse])
def get_patient_summaries(patient_id: int, db: Session = Depends(get_db)):
    """Get all clinical summaries generated for a patient."""
    patient = db.query(Patient).filter(Patient.patient_id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return (
        db.query(ClinicalSummary)
        .filter(ClinicalSummary.patient_id == patient_id)
        .order_by(ClinicalSummary.created_at.desc())
        .all()
    )


@router.get("/{patient_id}/documents", response_model=List[MedicalDocumentDetailResponse])
def get_patient_documents(patient_id: int, db: Session = Depends(get_db)):
    """Get all uploaded medical documents + extracted OCR data (medications, lab values, conditions) for a patient."""
    patient = db.query(Patient).filter(Patient.patient_id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    documents = (
        db.query(MedicalDocument)
        .filter(MedicalDocument.patient_id == patient_id)
        .order_by(MedicalDocument.uploaded_at.desc())
        .all()
    )

    result = []
    for doc in documents:
        meds = (
            db.query(DocumentExtractedMedication)
            .filter(DocumentExtractedMedication.document_id == doc.document_id)
            .all()
        )
        labs = (
            db.query(DocumentExtractedLabValue)
            .filter(DocumentExtractedLabValue.document_id == doc.document_id)
            .all()
        )
        conds = (
            db.query(DocumentExtractedCondition)
            .filter(DocumentExtractedCondition.document_id == doc.document_id)
            .all()
        )

        doc_dict = MedicalDocumentDetailResponse(
            document_id=doc.document_id,
            patient_id=doc.patient_id,
            session_id=doc.session_id,
            document_type=doc.document_type,
            file_path=doc.file_path,
            document_date=doc.document_date,
            ocr_status=doc.ocr_status,
            ocr_raw_text=doc.ocr_raw_text,
            ocr_language=doc.ocr_language,
            uploaded_at=doc.uploaded_at,
            medications=meds,
            lab_values=labs,
            conditions=conds,
        )
        result.append(doc_dict)

    return result