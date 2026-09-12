"""
OCR Services Package
====================
Public API surface for the MediKiosk OCR microservice.
Import from here rather than directly from submodules.

Usage:
    from services import process_prescription          # prescription pipeline
    from services import process_medical_document      # multi-doc router
    from services import ClinicalSummary, MedicationItem
"""

from .hybrid_ocr import (
    process_hybrid_ocr,
    process_prescription,
    ClinicalSummary,
    MedicationItem,
    sanitize_pii,
    get_azure_client,
    get_gemini_client,
    DRUG_CLINICAL_OVERRIDES,   # expose so callers can inspect / extend the config
)
from .document_router import (
    process_medical_document,
    extract_medical_document,
    LabReportSummary,
    DischargeSummary,
)

__all__ = [
    # Entrypoints
    "process_prescription",
    "process_hybrid_ocr",
    "process_medical_document",
    "extract_medical_document",
    # Pydantic schemas
    "ClinicalSummary",
    "MedicationItem",
    "LabReportSummary",
    "DischargeSummary",
    # Utilities
    "sanitize_pii",
    "get_azure_client",
    "get_gemini_client",
    # Config — exported so external tools / tests can inspect the override table
    "DRUG_CLINICAL_OVERRIDES",
]
