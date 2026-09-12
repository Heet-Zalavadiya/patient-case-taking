from sqlalchemy import Boolean, Column, Date, ForeignKey, Integer, String, Text

from database.connection import Base


class DocumentExtractedMedication(Base):
    __tablename__ = "document_extracted_medications"

    medication_id = Column(Integer, primary_key=True, autoincrement=True)
    document_id = Column(Integer, ForeignKey("medical_documents.document_id"), nullable=False)
    medicine_name = Column(String(255), nullable=False)
    dosage = Column(String(100), nullable=True)
    frequency = Column(String(100), nullable=True)
    prescribed_date = Column(Date, nullable=True)
    duration = Column(String(100), nullable=True)


class DocumentExtractedLabValue(Base):
    __tablename__ = "document_extracted_lab_values"

    lab_value_id = Column(Integer, primary_key=True, autoincrement=True)
    document_id = Column(Integer, ForeignKey("medical_documents.document_id"), nullable=False)
    test_name = Column(String(255), nullable=False)
    result_value = Column(String(100), nullable=True)
    unit = Column(String(50), nullable=True)
    reference_range = Column(String(100), nullable=True)
    is_abnormal = Column(Boolean, nullable=False, default=False)


class DocumentExtractedCondition(Base):
    __tablename__ = "document_extracted_conditions"

    condition_id = Column(Integer, primary_key=True, autoincrement=True)
    document_id = Column(Integer, ForeignKey("medical_documents.document_id"), nullable=False)
    entity_type = Column(String(50), nullable=False)  # diagnosis, procedure_or_surgery
    description = Column(Text, nullable=False)
    entity_date = Column(Date, nullable=True)
