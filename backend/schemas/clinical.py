from datetime import date, datetime
from typing import Literal, Optional

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


class ConsentCreate(BaseModel):
    patient_id: int
    consent_type: str
    is_granted: bool = False
    granted_via: Optional[str] = None  # 'audio' or 'touch'


class ConsentResponse(ORMModel):
    consent_id: int
    patient_id: int
    consent_type: str
    is_granted: int
    granted_via: Optional[str] = None
    granted_at: Optional[datetime] = None
    revoked_at: Optional[datetime] = None
    dpdp_reference: Optional[str] = None


class MedicationCreate(BaseModel):
    medicine_name: str
    dosage: Optional[str] = None
    frequency: Optional[str] = None
    prescribed_date: Optional[date] = None
    duration: Optional[str] = None


class MedicationResponse(MedicationCreate, ORMModel):
    medication_id: int
    document_id: int


class LabValueCreate(BaseModel):
    test_name: str
    result_value: Optional[str] = None
    unit: Optional[str] = None
    reference_range: Optional[str] = None
    is_abnormal: int = 0
    test_date: Optional[date] = None


class LabValueResponse(LabValueCreate, ORMModel):
    lab_value_id: int
    document_id: int