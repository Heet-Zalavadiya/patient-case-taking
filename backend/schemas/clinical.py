from datetime import date, datetime
from typing import List, Literal, Optional

from pydantic import BaseModel


class ORMModel(BaseModel):
    class Config:
        from_attributes = True


class SessionCreate(BaseModel):
    patient_id: int
    history_mode: Literal["allopathic", "ayush"] = "allopathic"


class SessionResponse(ORMModel):
    session_id: int
    patient_id: int
    history_mode: str
    status: str
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    session_data_cleared: bool


class InterviewTurnCreate(BaseModel):
    turn_number: int
    input_mode: Literal["voice", "touch"]
    ai_question: Optional[str] = None
    patient_response_text: Optional[str] = None
    response_language: Optional[str] = None


class InterviewTurnResponse(ORMModel):
    turn_id: int
    session_id: int
    turn_number: int
    input_mode: str
    ai_question: Optional[str] = None
    patient_response_text: Optional[str] = None
    response_language: Optional[str] = None
    asked_at: Optional[datetime] = None


class StructuredHistoryCreate(BaseModel):
    chief_complaint: Optional[str] = None
    hpi_onset: Optional[str] = None
    hpi_character: Optional[str] = None
    hpi_radiation: Optional[str] = None
    hpi_associated_symptoms: Optional[str] = None
    hpi_timing: Optional[str] = None
    hpi_exacerbating_relieving: Optional[str] = None
    hpi_severity: Optional[str] = None
    past_medical_surgical: Optional[str] = None
    drug_allergy_history: Optional[str] = None
    family_history: Optional[str] = None
    personal_history: Optional[str] = None
    review_of_systems: Optional[str] = None


class StructuredHistoryResponse(StructuredHistoryCreate, ORMModel):
    history_id: int
    session_id: int
    generated_at: Optional[datetime] = None


class AyushHistoryCreate(BaseModel):
    prakriti: Optional[str] = None
    vikriti: Optional[str] = None
    sara: Optional[str] = None
    samhanana: Optional[str] = None
    pramana: Optional[str] = None
    satmya: Optional[str] = None
    sattva: Optional[str] = None
    ahara_shakti: Optional[str] = None
    vyayama_shakti: Optional[str] = None
    vaya: Optional[str] = None
    ahara_vihara_notes: Optional[str] = None
    nidana: Optional[str] = None
    samprapti: Optional[str] = None


class AyushHistoryResponse(AyushHistoryCreate, ORMModel):
    ayush_history_id: int
    session_id: int
    generated_at: Optional[datetime] = None


class RedFlagCreate(BaseModel):
    flag_description: str
    severity: str = "HIGH"
    triage_notified: bool = False


class RedFlagResponse(RedFlagCreate, ORMModel):
    alert_id: int
    session_id: int
    triggered_at: Optional[datetime] = None
    acknowledged_by_doctor_id: Optional[int] = None
    acknowledged_at: Optional[datetime] = None


class MedicalDocumentCreate(BaseModel):
    patient_id: int
    session_id: Optional[int] = None
    document_type: Literal["prescription", "lab_report", "discharge_summary"]
    file_path: str
    document_date: Optional[date] = None
    ocr_status: Literal["pending", "processed", "failed"] = "pending"
    ocr_raw_text: Optional[str] = None
    ocr_language: Optional[str] = None


class MedicalDocumentResponse(MedicalDocumentCreate, ORMModel):
    document_id: int
    uploaded_at: Optional[datetime] = None


# ── Day 3 Schemas ─────────────────────────────────────────────────────────────

class ClinicalSummaryCreate(BaseModel):
    patient_id: int
    summary_text_english: str
    summary_text_local_language: Optional[str] = None
    status: Literal["draft", "accepted", "amended", "rejected"] = "draft"


class ClinicalSummaryResponse(ClinicalSummaryCreate, ORMModel):
    summary_id: int
    session_id: int
    reviewed_by_doctor_id: Optional[int] = None
    reviewed_at: Optional[datetime] = None
    generated_at: Optional[datetime] = None


class SummaryStatusUpdate(BaseModel):
    status: Literal["draft", "accepted", "amended", "rejected"]
    summary_text_english: Optional[str] = None
    summary_text_local_language: Optional[str] = None


class AbdmSyncLogCreate(BaseModel):
    target_system: Literal["HIS", "ABDM_FHIR"] = "ABDM_FHIR"
    sync_status: Literal["success", "failed", "pending"] = "success"
    fhir_resource_id: Optional[str] = None
    error_message: Optional[str] = None


class AbdmSyncLogResponse(AbdmSyncLogCreate, ORMModel):
    sync_id: int
    summary_id: int
    synced_at: Optional[datetime] = None


class AuditLogCreate(BaseModel):
    patient_id: Optional[int] = None
    doctor_id: Optional[int] = None
    action: str
    action_details: Optional[str] = None


class AuditLogResponse(AuditLogCreate, ORMModel):
    log_id: int
    occurred_at: Optional[datetime] = None


class ExtractedMedicationCreate(BaseModel):
    medicine_name: str
    dosage: Optional[str] = None
    frequency: Optional[str] = None
    prescribed_date: Optional[date] = None
    duration: Optional[str] = None


class ExtractedMedicationResponse(ExtractedMedicationCreate, ORMModel):
    medication_id: int
    document_id: int


class ExtractedLabValueCreate(BaseModel):
    test_name: str
    result_value: Optional[str] = None
    unit: Optional[str] = None
    reference_range: Optional[str] = None
    is_abnormal: bool = False


class ExtractedLabValueResponse(ExtractedLabValueCreate, ORMModel):
    lab_value_id: int
    document_id: int


class ExtractedConditionCreate(BaseModel):
    entity_type: str  # diagnosis, procedure_or_surgery
    description: str
    entity_date: Optional[date] = None


class ExtractedConditionResponse(ExtractedConditionCreate, ORMModel):
    condition_id: int
    document_id: int


class MedicalDocumentDetailResponse(MedicalDocumentResponse):
    medications: List[ExtractedMedicationResponse] = []
    lab_values: List[ExtractedLabValueResponse] = []
    conditions: List[ExtractedConditionResponse] = []