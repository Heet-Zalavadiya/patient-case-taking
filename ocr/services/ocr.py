"""
Universal OCR Services Adapter Bridge
====================================
Exposes standardized endpoints and aliases for the MediKiosk backend.
Supports:
- process_prescription(payload, patient_metadata=None)
- process_hybrid_ocr(payload, patient_metadata=None)
- process_medical_document(payload, patient_metadata=None)
"""

from services.hybrid_ocr import (
    process_hybrid_ocr,
    process_prescription,
    ClinicalSummary,
    MedicationItem,
    sanitize_pii,
    get_azure_client,
    get_gemini_client
)
from services.document_router import (
    process_medical_document,
    LabReportSummary,
    DischargeSummary
)

__all__ = [
    "process_prescription",
    "process_hybrid_ocr",
    "process_medical_document",
    "ClinicalSummary",
    "MedicationItem",
    "LabReportSummary",
    "DischargeSummary",
    "sanitize_pii",
    "get_azure_client",
    "get_gemini_client"
]
