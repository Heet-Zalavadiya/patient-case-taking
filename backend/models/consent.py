from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from database.connection import Base

class Consent(Base):
    __tablename__ = "consents"

    consent_id    = Column(Integer, primary_key=True, autoincrement=True)
    patient_id    = Column(Integer, ForeignKey("patients.patient_id"), nullable=False)
    consent_type  = Column(String(50), nullable=False)   # 'data_capture' or 'abdm_sharing'
    is_granted    = Column(Integer,    nullable=False, default=0)
    granted_via   = Column(String(20), nullable=True)    # 'audio' or 'touch'
    granted_at    = Column(DateTime,   nullable=True)
    revoked_at    = Column(DateTime,   nullable=True)
    dpdp_reference = Column(String(100), nullable=True)