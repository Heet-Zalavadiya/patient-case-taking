from pydantic import BaseModel
from typing import Optional

class DoctorLogin(BaseModel):
    login_id: str
    password: str

class DoctorResponse(BaseModel):
    doctor_id:             int
    full_name:             str
    department:            Optional[str]
    is_ayush_practitioner: int

    class Config:
        from_attributes = True