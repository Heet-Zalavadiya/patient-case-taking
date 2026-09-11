from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.sql import func

from database.connection import Base


class InterviewTurn(Base):
    __tablename__ = "interview_turns"

    turn_id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(Integer, ForeignKey("clinical_sessions.session_id"), nullable=False)
    turn_number = Column(Integer, nullable=False)
    input_mode = Column(String(10), nullable=False)
    ai_question = Column(Text, nullable=True)
    patient_response_text = Column(Text, nullable=True)
    response_language = Column(String(30), nullable=True)
    asked_at = Column(DateTime, server_default=func.now(), nullable=False)