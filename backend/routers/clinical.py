from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database.connection import get_db
from models.abdm_sync_log import AbdmSyncLog
from models.audit_log import AuditLog
from models.ayush_history import AyushHistory
from models.clinical_session import ClinicalSession
from models.clinical_summary import ClinicalSummary
from models.document_extraction import (
    DocumentExtractedCondition,
    DocumentExtractedLabValue,
    DocumentExtractedMedication,
)
from models.interview_turn import InterviewTurn
from models.medical_document import MedicalDocument
from models.patient import Patient
from models.red_flag_alert import RedFlagAlert
from models.structured_history import StructuredHistory
from schemas.clinical import (
    AbdmSyncLogCreate,
    AbdmSyncLogResponse,
    AuditLogCreate,
    AuditLogResponse,
    AyushHistoryCreate,
    AyushHistoryResponse,
    ClinicalSummaryCreate,
    ClinicalSummaryResponse,
    ExtractedConditionCreate,
    ExtractedConditionResponse,
    ExtractedLabValueCreate,
    ExtractedLabValueResponse,
    ExtractedMedicationCreate,
    ExtractedMedicationResponse,
    InterviewTurnCreate,
    InterviewTurnResponse,
    MedicalDocumentCreate,
    MedicalDocumentResponse,
    RedFlagCreate,
    RedFlagResponse,
    SessionCreate,
    SessionResponse,
    StructuredHistoryCreate,
    StructuredHistoryResponse,
    SummaryStatusUpdate,
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


def get_document_or_404(document_id: int, db: Session) -> MedicalDocument:
    doc = db.query(MedicalDocument).filter(MedicalDocument.document_id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc


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


# ── Day 3 Endpoints ───────────────────────────────────────────────────────────

@router.post("/sessions/{session_id}/summary", response_model=ClinicalSummaryResponse)
def create_clinical_summary(
    session_id: int,
    summary_data: ClinicalSummaryCreate,
    db: Session = Depends(get_db),
):
    session = get_session_or_404(session_id, db)
    if session.patient_id != summary_data.patient_id:
        raise HTTPException(status_code=400, detail="Session patient_id does not match summary patient_id")

    summary = ClinicalSummary(
        session_id=session_id,
        patient_id=summary_data.patient_id,
        summary_text_english=summary_data.summary_text_english,
        summary_text_local_language=summary_data.summary_text_local_language,
        status=summary_data.status,
    )
    db.add(summary)
    db.commit()
    db.refresh(summary)
    return summary


@router.patch("/summary/{summary_id}/status", response_model=ClinicalSummaryResponse)
def update_summary_status(
    summary_id: int,
    update_data: SummaryStatusUpdate,
    db: Session = Depends(get_db),
):
    summary = db.query(ClinicalSummary).filter(ClinicalSummary.summary_id == summary_id).first()
    if not summary:
        raise HTTPException(status_code=404, detail="Clinical summary not found")

    summary.status = update_data.status
    if update_data.summary_text_english is not None:
        summary.summary_text_english = update_data.summary_text_english
    if update_data.summary_text_local_language is not None:
        summary.summary_text_local_language = update_data.summary_text_local_language

    db.commit()
    db.refresh(summary)
    return summary


@router.post("/summary/{summary_id}/abdm-sync", response_model=AbdmSyncLogResponse)
def create_abdm_sync_log(
    summary_id: int,
    sync_data: AbdmSyncLogCreate,
    db: Session = Depends(get_db),
):
    summary = db.query(ClinicalSummary).filter(ClinicalSummary.summary_id == summary_id).first()
    if not summary:
        raise HTTPException(status_code=404, detail="Clinical summary not found")

    sync_log = AbdmSyncLog(
        summary_id=summary_id,
        target_system=sync_data.target_system,
        fhir_resource_id=sync_data.fhir_resource_id,
        sync_status=sync_data.sync_status,
        error_message=sync_data.error_message,
    )
    db.add(sync_log)
    db.commit()
    db.refresh(sync_log)
    return sync_log


@router.post("/audit-log", response_model=AuditLogResponse)
def create_audit_log(
    audit_data: AuditLogCreate,
    db: Session = Depends(get_db),
):
    if audit_data.patient_id:
        get_patient_or_404(audit_data.patient_id, db)

    log_entry = AuditLog(**audit_data.model_dump())
    db.add(log_entry)
    db.commit()
    db.refresh(log_entry)
    return log_entry


@router.post("/documents/{document_id}/medications", response_model=List[ExtractedMedicationResponse])
def add_extracted_medications(
    document_id: int,
    medications: List[ExtractedMedicationCreate],
    db: Session = Depends(get_db),
):
    get_document_or_404(document_id, db)
    created = []
    for med in medications:
        item = DocumentExtractedMedication(document_id=document_id, **med.model_dump())
        db.add(item)
        created.append(item)
    db.commit()
    for item in created:
        db.refresh(item)
    return created


@router.post("/documents/{document_id}/lab-values", response_model=List[ExtractedLabValueResponse])
def add_extracted_lab_values(
    document_id: int,
    lab_values: List[ExtractedLabValueCreate],
    db: Session = Depends(get_db),
):
    get_document_or_404(document_id, db)
    created = []
    for lab in lab_values:
        item = DocumentExtractedLabValue(document_id=document_id, **lab.model_dump())
        db.add(item)
        created.append(item)
    db.commit()
    for item in created:
        db.refresh(item)
    return created


@router.post("/documents/{document_id}/conditions", response_model=List[ExtractedConditionResponse])
def add_extracted_conditions(
    document_id: int,
    conditions: List[ExtractedConditionCreate],
    db: Session = Depends(get_db),
):
    get_document_or_404(document_id, db)
    created = []
    for cond in conditions:
        item = DocumentExtractedCondition(document_id=document_id, **cond.model_dump())
        db.add(item)
        created.append(item)
    db.commit()
    for item in created:
        db.refresh(item)
    return created