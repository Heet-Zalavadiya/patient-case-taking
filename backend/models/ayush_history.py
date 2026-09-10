from sqlalchemy import Column, DateTime, ForeignKey, Integer, Text
from sqlalchemy.sql import func

from database.connection import Base


class AyushHistory(Base):
    __tablename__ = "ayush_history"

    ayush_history_id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(Integer, ForeignKey("clinical_sessions.session_id"), nullable=False)
    prakriti = Column(Text, nullable=True)
    vikriti = Column(Text, nullable=True)
    sara = Column(Text, nullable=True)
    samhanana = Column(Text, nullable=True)
    pramana = Column(Text, nullable=True)
    satmya = Column(Text, nullable=True)
    sattva = Column(Text, nullable=True)
    ahara_shakti = Column(Text, nullable=True)
    vyayama_shakti = Column(Text, nullable=True)
    vaya = Column(Text, nullable=True)
    ahara_vihara_notes = Column(Text, nullable=True)
    nidana = Column(Text, nullable=True)
    samprapti = Column(Text, nullable=True)
    generated_at = Column(DateTime, server_default=func.now(), nullable=False)