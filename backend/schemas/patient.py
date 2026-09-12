from datetime import date, datetime
from typing import Literal, Optional
from pydantic import BaseModel


# What the frontend sends when registering a patient
class PatientCreate(BaseModel):
    full_name: str
    preferred_language: str = "Hindi"
    accessibility_mode: Optional[str] = "standard"
    abha_id: Optional[str] = None
    aadhaar_ref: Optional[str] = None
    date_of_birth: Optional[date] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    phone_number: Optional[str] = None
    login_id: Optional[str] = None
    password: Optional[str] = None  # raw password — hashed in router


# What the API sends back after creating a patient
class PatientResponse(BaseModel):
    patient_id: int
    full_name: str
    preferred_language: str
    accessibility_mode: Optional[str]
    abha_id: Optional[str]
    login_id: Optional[str]

    class Config:
        from_attributes = True


# Consent schemas (Day 2 Member 1 task)
class ConsentCreate(BaseModel):
    consent_type: str  # 'data_capture', 'abdm_sharing', 'voice_recording'
    is_granted: bool = True
    granted_via: Optional[str] = "touch"  # 'audio' or 'touch'
    dpdp_reference: Optional[str] = None


class ConsentResponse(BaseModel):
    consent_id: int
    patient_id: int
    consent_type: str
    is_granted: bool
    granted_via: Optional[str] = None
    granted_at: Optional[datetime] = None
    dpdp_reference: Optional[str] = None

    class Config:
        from_attributes = True