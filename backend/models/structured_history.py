from sqlalchemy import Column, DateTime, ForeignKey, Integer, Text
from sqlalchemy.sql import func

from database.connection import Base


class StructuredHistory(Base):
    __tablename__ = "structured_history"

    history_id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(Integer, ForeignKey("clinical_sessions.session_id"), nullable=False)
    chief_complaint = Column(Text, nullable=True)
    hpi_onset = Column(Text, nullable=True)
    hpi_character = Column(Text, nullable=True)
    hpi_radiation = Column(Text, nullable=True)
    hpi_associated_symptoms = Column(Text, nullable=True)
    hpi_timing = Column(Text, nullable=True)
    hpi_exacerbating_relieving = Column(Text, nullable=True)
    hpi_severity = Column(Text, nullable=True)
    past_medical_surgical = Column(Text, nullable=True)
    drug_allergy_history = Column(Text, nullable=True)
    family_history = Column(Text, nullable=True)
    personal_history = Column(Text, nullable=True)
    review_of_systems = Column(Text, nullable=True)
    generated_at = Column(DateTime, server_default=func.now(), nullable=False)