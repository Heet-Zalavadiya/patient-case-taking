from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.sql import func

from database.connection import Base


class AbdmSyncLog(Base):
    __tablename__ = "abdm_sync_log"

    sync_id = Column(Integer, primary_key=True, autoincrement=True)
    summary_id = Column(Integer, ForeignKey("clinical_summaries.summary_id"), nullable=False)
    target_system = Column(String(20), nullable=False, default="ABDM_FHIR")  # HIS, ABDM_FHIR
    fhir_resource_id = Column(String(100), nullable=True)
    sync_status = Column(String(20), nullable=False, default="pending")  # pending, success, failed
    synced_at = Column(DateTime, server_default=func.now(), nullable=True)
    error_message = Column(Text, nullable=True)
