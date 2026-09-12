"""
ocr_bridge.py  –  In-process bridge between the backend and the OCR pipeline.

Architecture decision: single-server model.
  - No HTTP round-trip to a separate OCR service.
  - The ocr/ package is imported directly into the same Python process.
  - sys.path is patched at import time so the relative imports inside
    ocr/services/ resolve correctly regardless of the working directory.
"""

import os
import sys
import logging
from typing import Optional

logger = logging.getLogger("uvicorn")

# ── Path bootstrap ─────────────────────────────────────────────────────────────
# Layout:
#   <project_root>/
#       backend/        ← uvicorn is launched from here
#       ocr/
#           services/
#               document_router.py   ← target
#               hybrid_ocr.py

_THIS_DIR = os.path.dirname(os.path.abspath(__file__))            # backend/services/
_BACKEND_DIR = os.path.dirname(_THIS_DIR)                          # backend/
_PROJECT_ROOT = os.path.dirname(_BACKEND_DIR)                      # project root
_OCR_DIR = os.path.join(_PROJECT_ROOT, "ocr")                     # ocr/

# Only add project root (not ocr/ itself) so we import as ocr.services.*
# This avoids shadowing the backend's own services/ package.
if _PROJECT_ROOT not in sys.path:
    sys.path.insert(0, _PROJECT_ROOT)

# ── Lazy import of OCR services ────────────────────────────────────────────────
_ocr_available = False
_extract_medical_document = None

try:
    from ocr.services.document_router import extract_medical_document as _extract_fn
    _extract_medical_document = _extract_fn
    _ocr_available = True
    logger.info("[OCR Bridge] OCR pipeline loaded successfully (in-process mode).")
except ImportError as e:
    logger.warning(
        f"[OCR Bridge] OCR pipeline not available: {e}. "
        "Documents will be saved with status='pending' and processed when OCR is installed."
    )


# ── Public API ─────────────────────────────────────────────────────────────────

def is_ocr_available() -> bool:
    """Return True if the OCR pipeline imported successfully."""
    return _ocr_available


def run_ocr(image_bytes: bytes, patient_metadata: Optional[dict] = None) -> dict:
    """
    Process a medical document image through the OCR pipeline.

    Returns a normalized dict:
    {
        "document_type": "prescription" | "lab_report" | "discharge_summary" | "unknown",
        "document_date": Optional[str],
        "raw_ocr_text": str,
        "status": "processed" | "failed",
        "medications": [
            {"medicine_name", "dosage", "frequency", "duration", "prescribed_date"}
        ],
        "lab_values": [
            {"test_name", "result_value", "unit", "reference_range", "is_abnormal"}
        ],
        "conditions": [
            {"entity_type", "description", "entity_date"}
        ],
    }

    If the OCR pipeline is unavailable, returns a graceful fallback dict with
    status="pending" so the document record is still created in the DB.
    """
    if not _ocr_available or _extract_medical_document is None:
        return {
            "document_type": "unknown",
            "document_date": None,
            "raw_ocr_text": "",
            "status": "pending",
            "medications": [],
            "lab_values": [],
            "conditions": [],
            "error": "OCR pipeline not installed. Install ocr/requirements.txt to enable.",
        }

    try:
        result = _extract_medical_document(image_bytes, patient_metadata)
        return result
    except Exception as e:
        logger.exception(f"[OCR Bridge] Processing failed: {e}")
        return {
            "document_type": "unknown",
            "document_date": None,
            "raw_ocr_text": "",
            "status": "failed",
            "medications": [],
            "lab_values": [],
            "conditions": [],
            "error": str(e),
        }
