from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database.connection import get_db
from models.ayush_history import AyushHistory
from models.clinical_session import ClinicalSession
from models.interview_turn import InterviewTurn
from models.medical_document import MedicalDocument
from models.extracted_medication import ExtractedMedication
from models.extracted_lab_value import ExtractedLabValue
from models.patient import Patient
from models.red_flag_alert import RedFlagAlert
from models.structured_history import StructuredHistory
from schemas.clinical import (
    AyushHistoryCreate,
    AyushHistoryResponse,
    InterviewTurnCreate,
    InterviewTurnResponse,
    LabValueCreate,
    LabValueResponse,
    MedicalDocumentCreate,
    MedicalDocumentResponse,
    MedicationCreate,
    MedicationResponse,
    RedFlagCreate,
    RedFlagResponse,
    SessionCreate,
    SessionResponse,
    StructuredHistoryCreate,
    StructuredHistoryResponse,
)

router = APIRouter(tags=["Clinical"])


def get_session_or_404(session_id: int, db: Session) -> ClinicalSession:
    session = db.query(ClinicalSession).filter(ClinicalSession.session_id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


def get_patient_or_404(patient_id: int, db: Session) -> Patient:
    patient = db.query(Patient).filter(Patient.patient_id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient


@router.post("/sessions", response_model=SessionResponse)
def create_session(session_data: SessionCreate, db: Session = Depends(get_db)):
    get_patient_or_404(session_data.patient_id, db)
    session = ClinicalSession(
        patient_id=session_data.patient_id,
        history_mode=session_data.history_mode,
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


@router.post("/sessions/{session_id}/turns", response_model=InterviewTurnResponse)
def create_interview_turn(
    session_id: int,
    turn_data: InterviewTurnCreate,
    db: Session = Depends(get_db),
):
    get_session_or_404(session_id, db)
    turn = InterviewTurn(session_id=session_id, **turn_data.model_dump())
    db.add(turn)
    db.commit()
    db.refresh(turn)
    return turn


@router.post("/sessions/{session_id}/history", response_model=StructuredHistoryResponse)
def create_structured_history(
    session_id: int,
    history_data: StructuredHistoryCreate,
    db: Session = Depends(get_db),
):
    get_session_or_404(session_id, db)
    history = StructuredHistory(session_id=session_id, **history_data.model_dump())
    db.add(history)
    db.commit()
    db.refresh(history)
    return history


@router.post("/sessions/{session_id}/ayush", response_model=AyushHistoryResponse)
def create_ayush_history(
    session_id: int,
    history_data: AyushHistoryCreate,
    db: Session = Depends(get_db),
):
    get_session_or_404(session_id, db)
    history = AyushHistory(session_id=session_id, **history_data.model_dump())
    db.add(history)
    db.commit()
    db.refresh(history)
    return history


@router.post("/sessions/{session_id}/red-flags", response_model=RedFlagResponse)
def create_red_flag(
    session_id: int,
    flag_data: RedFlagCreate,
    db: Session = Depends(get_db),
):
    get_session_or_404(session_id, db)
    alert = RedFlagAlert(session_id=session_id, **flag_data.model_dump())
    db.add(alert)
    db.commit()
    db.refresh(alert)
    return alert


@router.post("/documents", response_model=MedicalDocumentResponse)
def create_document(document_data: MedicalDocumentCreate, db: Session = Depends(get_db)):
    get_patient_or_404(document_data.patient_id, db)
    if document_data.session_id is not None:
        session = get_session_or_404(document_data.session_id, db)
        if session.patient_id != document_data.patient_id:
            raise HTTPException(status_code=400, detail="Session does not belong to patient")

    document = MedicalDocument(**document_data.model_dump())
    db.add(document)
    db.commit()
    db.refresh(document)
    return document


def get_document_or_404(document_id: int, db: Session) -> MedicalDocument:
    doc = db.query(MedicalDocument).filter(MedicalDocument.document_id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc


@router.post("/documents/{document_id}/medications", response_model=list[MedicationResponse], status_code=201)
def create_medications(
    document_id: int,
    meds_data: list[MedicationCreate],
    db: Session = Depends(get_db),
):
    get_document_or_404(document_id, db)
    created = []
    for med in meds_data:
        row = ExtractedMedication(document_id=document_id, **med.model_dump())
        db.add(row)
        created.append(row)
    db.commit()
    for row in created:
        db.refresh(row)
    return created


@router.post("/documents/{document_id}/lab-values", response_model=list[LabValueResponse], status_code=201)
def create_lab_values(
    document_id: int,
    labs_data: list[LabValueCreate],
    db: Session = Depends(get_db),
):
    get_document_or_404(document_id, db)
    created = []
    for lab in labs_data:
        row = ExtractedLabValue(document_id=document_id, **lab.model_dump())
        db.add(row)
        created.append(row)
    db.commit()
    for row in created:
        db.refresh(row)
    return created