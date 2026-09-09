from pydantic import BaseModel
from typing import Optional
from datetime import date

# What the frontend sends when registering a patient
class PatientCreate(BaseModel):
    full_name:          str
    preferred_language: str = "Hindi"
    accessibility_mode: Optional[str] = "standard"
    abha_id:            Optional[str] = None
    aadhaar_ref:        Optional[str] = None
    date_of_birth:      Optional[date] = None
    age:                Optional[int] = None
    gender:             Optional[str] = None
    phone_number:       Optional[str] = None
    login_id:           Optional[str] = None
    password:           Optional[str] = None   # raw password — you will hash this in the router

# What the API sends back after creating a patient
class PatientResponse(BaseModel):
    patient_id:         int
    full_name:          str
    preferred_language: str
    accessibility_mode: Optional[str]
    abha_id:            Optional[str]
    login_id:           Optional[str]

    class Config:
        from_attributes = True   # allows reading from SQLAlchemy model directly