from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.sql import func

from database.connection import Base


class ClinicalSummary(Base):
    __tablename__ = "clinical_summaries"

    summary_id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(Integer, ForeignKey("clinical_sessions.session_id"), nullable=False)
    patient_id = Column(Integer, ForeignKey("patients.patient_id"), nullable=False)
    summary_text_english = Column(Text, nullable=True)
    summary_text_local_language = Column(Text, nullable=True)
    status = Column(String(20), nullable=False, default="draft")  # draft, accepted, amended, rejected
    reviewed_by_doctor_id = Column(Integer, ForeignKey("doctors.doctor_id"), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    generated_at = Column(DateTime, server_default=func.now(), nullable=False)
