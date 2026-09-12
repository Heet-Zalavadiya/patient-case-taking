from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile, File, Form, BackgroundTasks
from sqlalchemy.orm import Session
import logging

logger = logging.getLogger("uvicorn")

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
    SessionUpdate,
    StructuredHistoryCreate,
    StructuredHistoryResponse,
    SummaryStatusUpdate,
)
from services.ocr_bridge import run_ocr, is_ocr_available

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


@router.get("/sessions/{session_id}", response_model=SessionResponse)
def get_session(session_id: int, db: Session = Depends(get_db)):
    """Get details of a single clinical session."""
    return get_session_or_404(session_id, db)


@router.patch("/sessions/{session_id}", response_model=SessionResponse)
def update_session(
    session_id: int,
    update_data: SessionUpdate,
    db: Session = Depends(get_db),
):
    """Update session status (e.g. 'completed', 'abandoned') or set session_data_cleared flag."""
    session = get_session_or_404(session_id, db)
    if update_data.status is not None:
        session.status = update_data.status
        if update_data.status == "completed":
            from datetime import datetime
            session.completed_at = datetime.now()
    if update_data.session_data_cleared is not None:
        session.session_data_cleared = update_data.session_data_cleared

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


@router.get("/alerts", response_model=List[RedFlagResponse])
@router.get("/red-flags", response_model=List[RedFlagResponse], include_in_schema=False)
def list_red_flag_alerts(db: Session = Depends(get_db)):
    """List all triggered red-flag alerts (used for Doctor Dashboard alerts counter)."""
    return db.query(RedFlagAlert).order_by(RedFlagAlert.triggered_at.desc()).all()


@router.post("/documents", response_model=MedicalDocumentResponse)
async def create_document(
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Upload a medical document (prescription / lab report / discharge summary).

    Accepts two content-type modes:
    • multipart/form-data  — file upload from the kiosk scanner / frontend
    • application/json     — pre-processed metadata without a file

    When a file is provided, the OCR pipeline is called in-process via ocr_bridge.
    Extracted medications, lab values, and conditions are persisted automatically.
    If the OCR pipeline is unavailable the document is saved with status='pending'.
    """
    content_type = request.headers.get("content-type", "")

    if "multipart/form-data" in content_type:
        # ── Parse form fields ─────────────────────────────────────────────────
        form = await request.form()
        patient_id = int(form.get("patient_id", 1))
        session_id_raw = form.get("session_id")
        session_id = int(session_id_raw) if session_id_raw and str(session_id_raw).isdigit() else None
        doc_type = form.get("document_type", "prescription")
        file_obj = form.get("file")
        filename = getattr(file_obj, "filename", "scanned_doc.jpg") or "scanned_doc.jpg"
        file_path = f"/uploads/documents/{filename}"

        # ── Validate patient / session ────────────────────────────────────────
        get_patient_or_404(patient_id, db)
        if session_id is not None:
            session = get_session_or_404(session_id, db)
            if session.patient_id != patient_id:
                raise HTTPException(status_code=400, detail="Session does not belong to patient")

        # ── Run OCR bridge ────────────────────────────────────────────────────
        ocr_result = {"status": "pending", "raw_ocr_text": "",
                      "medications": [], "lab_values": [], "conditions": [],
                      "document_type": doc_type, "document_date": None}

        if file_obj is not None:
            try:
                image_bytes = await file_obj.read()
                if image_bytes:
                    ocr_result = run_ocr(image_bytes)
                    # Use the OCR-detected document type if we got one
                    if ocr_result.get("document_type") not in (None, "unknown", ""):
                        doc_type = ocr_result["document_type"]
                    logger.info(
                        f"[OCR] document_type={doc_type} "
                        f"status={ocr_result.get('status')} "
                        f"meds={len(ocr_result.get('medications', []))}"
                    )
            except Exception as e:
                logger.exception(f"[OCR] Failed to read uploaded file: {e}")

        # ── Save document record ──────────────────────────────────────────────
        document = MedicalDocument(
            patient_id=patient_id,
            session_id=session_id,
            document_type=doc_type,
            file_path=file_path,
            ocr_status=ocr_result.get("status", "pending"),
            ocr_raw_text=ocr_result.get("raw_ocr_text") or None,
            ocr_language="en",
        )
        db.add(document)
        db.commit()
        db.refresh(document)

        # ── Persist extracted medications ─────────────────────────────────────
        for med in ocr_result.get("medications", []):
            db.add(DocumentExtractedMedication(
                document_id=document.document_id,
                medicine_name=med.get("medicine_name", ""),
                dosage=med.get("dosage"),
                frequency=med.get("frequency"),
                duration=med.get("duration"),
            ))

        # ── Persist extracted lab values ──────────────────────────────────────
        for lab in ocr_result.get("lab_values", []):
            db.add(DocumentExtractedLabValue(
                document_id=document.document_id,
                test_name=lab.get("test_name", ""),
                result_value=lab.get("result_value"),
                unit=lab.get("unit"),
                reference_range=lab.get("reference_range"),
                is_abnormal=bool(lab.get("is_abnormal", False)),
            ))

        # ── Persist extracted conditions / diagnoses ───────────────────────────
        for cond in ocr_result.get("conditions", []):
            db.add(DocumentExtractedCondition(
                document_id=document.document_id,
                entity_type=cond.get("entity_type", "diagnosis"),
                description=cond.get("description", ""),
                entity_date=cond.get("entity_date"),
            ))

        db.commit()
        db.refresh(document)
        return document

    else:
        # ── JSON body path (pre-processed / metadata-only) ────────────────────
        body = await request.json()
        doc_data = MedicalDocumentCreate(**body)
        get_patient_or_404(doc_data.patient_id, db)
        if doc_data.session_id is not None:
            session = get_session_or_404(doc_data.session_id, db)
            if session.patient_id != doc_data.patient_id:
                raise HTTPException(status_code=400, detail="Session does not belong to patient")

        document = MedicalDocument(**doc_data.model_dump())
        db.add(document)
        db.commit()
        db.refresh(document)
        return document


# ── Day 3 Endpoints ───────────────────────────────────────────────────────────

@router.post("/sessions/{session_id}/summary", response_model=ClinicalSummaryResponse)
def create_clinical_summary(
    session_id: int,
    summary_data: Optional[ClinicalSummaryCreate] = None,
    db: Session = Depends(get_db),
):
    session = get_session_or_404(session_id, db)
    patient_id = summary_data.patient_id if (summary_data and summary_data.patient_id) else session.patient_id
    summary_text_english = (
        summary_data.summary_text_english
        if (summary_data and summary_data.summary_text_english)
        else "Draft clinical summary generated from patient interview."
    )
    summary_text_local = (
        summary_data.summary_text_local_language
        if (summary_data and summary_data.summary_text_local_language)
        else "रोगी साक्षात्कार से तैयार नैदानिक सारांश।"
    )
    status = summary_data.status if (summary_data and summary_data.status) else "draft"

    summary = ClinicalSummary(
        session_id=session_id,
        patient_id=patient_id,
        summary_text_english=summary_text_english,
        summary_text_local_language=summary_text_local,
        status=status,
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