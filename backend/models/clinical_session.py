from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from database.connection import Base

class ClinicalSession(Base):
    __tablename__ = "clinical_sessions"

    session_id           = Column(Integer, primary_key=True, autoincrement=True)
    patient_id           = Column(Integer, ForeignKey("patients.patient_id"), nullable=False)
    history_mode         = Column(String(20), nullable=False, default="allopathic")  # 'allopathic' or 'ayush'
    started_at           = Column(DateTime,   server_default=func.now())
    completed_at         = Column(DateTime,   nullable=True)
    status               = Column(String(20), nullable=False, default="in_progress")
    session_data_cleared = Column(Integer,    nullable=False, default=0)