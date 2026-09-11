from sqlalchemy import Column, Date, ForeignKey, Integer, String
from database.connection import Base


class ExtractedMedication(Base):
    __tablename__ = "document_extracted_medications"

    medication_id   = Column(Integer, primary_key=True, autoincrement=True)
    document_id     = Column(Integer, ForeignKey("medical_documents.document_id"), nullable=False)
    medicine_name   = Column(String(200), nullable=False)
    dosage          = Column(String(100), nullable=True)
    frequency       = Column(String(100), nullable=True)
    prescribed_date = Column(Date, nullable=True)
    duration        = Column(String(50), nullable=True)

