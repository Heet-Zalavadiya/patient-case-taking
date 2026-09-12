"""
MediKiosk Clinical Pydantic v2 Schemas
Provides strict type validation and serialization for Doctor Console endpoints.
"""

from datetime import datetime, date
from typing import Any, Dict, List, Literal, Optional, Union
from pydantic import BaseModel, ConfigDict, Field


# ── 1. Authentication Models ──────────────────────────────────────────────────

class LoginRequest(BaseModel):
    login_id: str = Field(..., description="Doctor login ID or username")
    password: str = Field(..., description="Doctor password")


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    doctor_id: Union[int, str]
    full_name: str
    department: Optional[str] = None
    is_ayush_practitioner: bool
    active_opd_room: Optional[str] = "OPD Room #104"
    qualification: Optional[str] = None


# ── 2. Patient Queue & Triage Models ──────────────────────────────────────────

class PatientQueueItem(BaseModel):
    patient_id: Union[int, str]
    full_name: str
    age: Optional[int] = None
    gender: Optional[str] = None
    session_id: Optional[int] = None
    has_red_flags: bool = False
    history_mode: str = "allopathic"
    token: Optional[str] = None
    mrn: Optional[str] = None
    check_in_time: Optional[str] = "10:30 AM"
    status: Optional[str] = "waiting"
    blood_group: Optional[str] = "B+"
    phone: Optional[str] = None
    vitals_summary: Optional[Dict[str, Any]] = None
    triage_category: Optional[str] = "Routine OPD"

    model_config = ConfigDict(from_attributes=True)


# ── 3. Structured Clinical History Models ──────────────────────────────────────

class StructuredHistoryDetail(BaseModel):
    chief_complaint: Optional[str] = None
    hpi_associated_symptoms: Optional[Union[List[str], str]] = []
    hpi_onset: Optional[str] = "Recent onset"
    hpi_character: Optional[str] = None
    hpi_radiation: Optional[str] = None
    hpi_severity: Optional[str] = None
    hpi_timing: Optional[str] = None
    hpi_exacerbating_relieving: Optional[str] = None
    past_medical: Optional[Union[List[str], str]] = []
    past_medical_history: Optional[Union[List[str], str]] = []
    drug_allergies: Optional[Union[List[Any], str]] = []
    allergies: Optional[Union[List[Any], str]] = []
    ros: Optional[Union[Dict[str, Any], str]] = {}
    review_of_systems: Optional[Union[Dict[str, Any], str]] = {}

    model_config = ConfigDict(from_attributes=True)


class AyushHistoryDetail(BaseModel):
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

    model_config = ConfigDict(from_attributes=True)


class PatientHistoryResponse(BaseModel):
    patient_id: Union[int, str]
    session_id: Optional[int] = None
    history_mode: str = "allopathic"
    structured_history: StructuredHistoryDetail
    ayush_history: Optional[AyushHistoryDetail] = None

    model_config = ConfigDict(from_attributes=True)


# ── 4. Alerts & Labs Models ────────────────────────────────────────────────────

class RedFlagAlertItem(BaseModel):
    alert_id: int
    session_id: int
    flag_description: str
    severity: str = "HIGH"
    is_acknowledged: bool = False
    timestamp: Optional[str] = None
    vital_triggers: Optional[List[str]] = []
    action_protocol: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class AlertAcknowledgeRequest(BaseModel):
    is_acknowledged: bool = True


class LabValueItem(BaseModel):
    lab_id: Union[int, str]
    test_name: str
    value: str
    unit: str
    reference_range: str
    is_abnormal: int = Field(..., description="1 if abnormal/flagged, 0 if normal")
    flag: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


# ── 5. Clinical Summary Verification Models ────────────────────────────────────

class ClinicalSummaryDetail(BaseModel):
    summary_id: Union[int, str]
    session_id: int
    patient_id: Union[int, str]
    status: str = "draft"  # 'draft', 'accepted', 'amended', 'rejected', 'ACCEPTED', 'AMENDED', 'REJECTED'
    draft_text: str
    physician_notes: Optional[str] = None
    last_modified_by: Optional[str] = "AI Synthesizer"
    generated_at: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class SummaryStatusUpdateRequest(BaseModel):
    status: str = Field(..., description="Status string: ACCEPTED | AMENDED | REJECTED (or lowercase)")
    amended_text: Optional[str] = None
    physician_notes: Optional[str] = None
