from sqlalchemy import Column, Date, ForeignKey, Integer, String
from database.connection import Base


class ExtractedLabValue(Base):
    __tablename__ = "document_extracted_lab_values"

    lab_value_id    = Column(Integer, primary_key=True, autoincrement=True)
    document_id     = Column(Integer, ForeignKey("medical_documents.document_id"), nullable=False)
    test_name       = Column(String(150), nullable=False)
    result_value    = Column(String(50), nullable=True)
    unit            = Column(String(30), nullable=True)
    reference_range = Column(String(50), nullable=True)
    is_abnormal     = Column(Integer, nullable=False, default=0)
    test_date       = Column(Date, nullable=True)

