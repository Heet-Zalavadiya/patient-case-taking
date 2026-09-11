from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.sql import func

from database.connection import Base


class RedFlagAlert(Base):
    __tablename__ = "red_flag_alerts"

    alert_id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(Integer, ForeignKey("clinical_sessions.session_id"), nullable=False)
    flag_description = Column(Text, nullable=False)
    severity = Column(String(20), nullable=False, default="HIGH")
    triggered_at = Column(DateTime, server_default=func.now(), nullable=False)
    triage_notified = Column(Boolean, nullable=False, default=False)
    acknowledged_by_doctor_id = Column(Integer, ForeignKey("doctors.doctor_id"), nullable=True)
    acknowledged_at = Column(DateTime, nullable=True)