from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.sql import func

from database.connection import Base


class AuditLog(Base):
    __tablename__ = "audit_log"

    log_id = Column(Integer, primary_key=True, autoincrement=True)
    patient_id = Column(Integer, ForeignKey("patients.patient_id"), nullable=True)
    doctor_id = Column(Integer, ForeignKey("doctors.doctor_id"), nullable=True)
    action = Column(String(100), nullable=False)
    action_details = Column(Text, nullable=True)
    occurred_at = Column(DateTime, server_default=func.now(), nullable=False)
