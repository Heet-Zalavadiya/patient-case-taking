from sqlalchemy import Column, Date, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.sql import func

from database.connection import Base


class MedicalDocument(Base):
    __tablename__ = "medical_documents"

    document_id = Column(Integer, primary_key=True, autoincrement=True)
    patient_id = Column(Integer, ForeignKey("patients.patient_id"), nullable=False)
    session_id = Column(Integer, ForeignKey("clinical_sessions.session_id"), nullable=True)
    document_type = Column(String(30), nullable=False)
    file_path = Column(String(500), nullable=False)
    document_date = Column(Date, nullable=True)
    uploaded_at = Column(DateTime, server_default=func.now(), nullable=False)
    ocr_status = Column(String(20), nullable=False, default="pending")
    ocr_raw_text = Column(Text, nullable=True)
    ocr_language = Column(String(30), nullable=True)