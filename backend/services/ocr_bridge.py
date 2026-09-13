"""
<<<<<<< HEAD
ocr_bridge.py  –  Multimodal medical document OCR and clinical extraction bridge.

Uses Google Gemini Vision (via REST transport) to accurately extract
medications, dosages, frequencies, lab values, and diagnoses from uploaded images.
Falls back honestly if the document is unreadable, blurry, or non-medical.
"""

import io
import json
import logging
import os
import re
from typing import Optional

from dotenv import load_dotenv

logger = logging.getLogger("uvicorn")

# Load environment variables
_BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_ENV_PATH = os.path.join(_BACKEND_DIR, ".env")
load_dotenv(_ENV_PATH)

try:
    import truststore
    truststore.inject_into_ssl()
except Exception:
    pass

try:
    import google.generativeai as genai
    _GENAI_AVAILABLE = True
except ImportError:
    _GENAI_AVAILABLE = False
    logger.warning("[OCR Bridge] google-generativeai is not installed.")

# Gemini models with vision capabilities in order of preference
VISION_MODELS = [
    "gemini-3.5-flash",
    "gemini-3.6-flash",
    "gemini-3.7-flash",
    "gemini-flash-latest",
]


def _get_api_key() -> Optional[str]:
    return os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")


def is_ocr_available() -> bool:
    """Return True if Gemini Vision is configured and ready."""
    return _GENAI_AVAILABLE and bool(_get_api_key())


OCR_SYSTEM_PROMPT = """You are an expert medical document OCR and clinical extraction system.
Analyze the provided medical document (prescription, laboratory report, hospital discharge summary, clinical note, or medical bill).
Extract all relevant clinical information accurately in JSON format matching this exact schema:
{
  "is_medical_document": true or false,
  "is_readable": true or false,
  "document_type": "prescription" | "lab_report" | "discharge_summary" | "unknown",
  "document_date": "YYYY-MM-DD" or null,
  "summary": "1-2 concise sentences summarizing the document clinical findings, diagnosis, and prescription details.",
  "medications": [
    {
      "medicine_name": "Name of medicine",
      "dosage": "Dosage e.g. 500mg or null",
      "frequency": "Frequency e.g. BD, TDS, 1-0-1 or null",
      "duration": "Duration e.g. 5 days or null",
      "prescribed_date": "YYYY-MM-DD or null"
    }
  ],
  "lab_values": [
    {
      "test_name": "Test name e.g. Fasting Glucose",
      "result_value": "Result value e.g. 98",
      "unit": "Unit e.g. mg/dL or null",
      "reference_range": "Normal range or null",
      "is_abnormal": true or false
    }
  ],
  "conditions": [
    {
      "entity_type": "diagnosis" | "procedure_or_surgery",
      "description": "Diagnosis or condition description",
      "entity_date": "YYYY-MM-DD or null"
    }
  ]
}

CRITICAL RULES:
1. If the image is blurry, unreadable, blank, or completely not a medical document (e.g., photo of an object, landscape, animal, selfie, random note), you MUST set "is_readable": false and "is_medical_document": false, set "document_type": "unknown", and set "summary": "Could not extract clear information from this document. Please verify manually." with empty arrays for medications, lab_values, and conditions.
2. DO NOT hallucinate or return placeholder medications (such as Paracetamol 500mg, Atorvastatin, or Ashwagandha) unless they are genuinely written in the image.
3. Return ONLY valid JSON wrapped in ```json ... ``` or as plain JSON.
"""
=======
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
>>>>>>> b444885b2c37225ef85ad4c554f091e5fc59ccd3


def run_ocr(image_bytes: bytes, patient_metadata: Optional[dict] = None) -> dict:
    """
<<<<<<< HEAD
    Process a medical document image using Gemini Vision multimodal extraction.
=======
    Process a medical document image through the OCR pipeline.
>>>>>>> b444885b2c37225ef85ad4c554f091e5fc59ccd3

    Returns a normalized dict:
    {
        "document_type": "prescription" | "lab_report" | "discharge_summary" | "unknown",
        "document_date": Optional[str],
        "raw_ocr_text": str,
        "status": "processed" | "failed",
<<<<<<< HEAD
        "medications": [...],
        "lab_values": [...],
        "conditions": [...],
    }
    """
    fallback_fail = {
        "document_type": "unknown",
        "document_date": None,
        "raw_ocr_text": "Could not extract clear information from this document. Please verify manually.",
        "status": "failed",
        "medications": [],
        "lab_values": [],
        "conditions": [],
    }

    if not image_bytes:
        return fallback_fail

    api_key = _get_api_key()
    if not _GENAI_AVAILABLE or not api_key:
        logger.warning("[OCR Bridge] Gemini API key not configured or package missing.")
        return fallback_fail

    # Try opening the image using PIL
    try:
        import PIL.Image
        image = PIL.Image.open(io.BytesIO(image_bytes))
        # Ensure image is in RGB mode
        if image.mode not in ("RGB", "L"):
            image = image.convert("RGB")
    except Exception as img_err:
        logger.warning(f"[OCR Bridge] Could not open image bytes: {img_err}")
        return fallback_fail

    try:
        genai.configure(api_key=api_key, transport="rest")
    except Exception as conf_err:
        logger.warning(f"[OCR Bridge] genai.configure error: {conf_err}")

    raw_response_text = ""
    last_exception = None

    for model_name in VISION_MODELS:
        try:
            logger.info(f"[OCR Bridge] Attempting extraction with {model_name}...")
            model = genai.GenerativeModel(model_name)
            response = model.generate_content([OCR_SYSTEM_PROMPT, image])
            if response and response.text:
                raw_response_text = response.text.strip()
                logger.info(f"[OCR Bridge] Received response from {model_name} (length={len(raw_response_text)})")
                break
        except Exception as e:
            last_exception = e
            logger.warning(f"[OCR Bridge] Model {model_name} failed: {e}")
            continue

    if not raw_response_text:
        logger.error(f"[OCR Bridge] All Gemini vision models failed: {last_exception}")
        return fallback_fail

    # Parse JSON from response
    parsed_json = None
    try:
        # Check if wrapped in code fence
        json_match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", raw_response_text)
        json_str = json_match.group(1).strip() if json_match else raw_response_text.strip()
        parsed_json = json.loads(json_str)
    except Exception as json_err:
        logger.warning(f"[OCR Bridge] JSON parsing error: {json_err}, raw text snippet: {raw_response_text[:200]}")
        # If response mentions unreadable or could not extract
        if "could not extract" in raw_response_text.lower() or "unreadable" in raw_response_text.lower():
            return fallback_fail
        # Otherwise use raw text as summary if sensible
        return {
            "document_type": "unknown",
            "document_date": None,
            "raw_ocr_text": raw_response_text[:300],
            "status": "processed",
            "medications": [],
            "lab_values": [],
            "conditions": [],
        }

    is_readable = parsed_json.get("is_readable", True)
    is_medical = parsed_json.get("is_medical_document", True)

    if not is_readable or not is_medical:
        return {
            "document_type": parsed_json.get("document_type") or "unknown",
            "document_date": None,
            "raw_ocr_text": parsed_json.get("summary") or "Could not extract clear information from this document. Please verify manually.",
=======
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
>>>>>>> b444885b2c37225ef85ad4c554f091e5fc59ccd3
            "status": "failed",
            "medications": [],
            "lab_values": [],
            "conditions": [],
<<<<<<< HEAD
        }

    summary_text = parsed_json.get("summary") or "Document verified and clinical findings extracted."
    meds = parsed_json.get("medications") or []
    labs = parsed_json.get("lab_values") or []
    conditions = parsed_json.get("conditions") or []

    # If all extraction lists are empty and summary doesn't contain useful info
    if not meds and not labs and not conditions and len(summary_text) < 15:
        summary_text = "Could not extract clear information from this document. Please verify manually."

    return {
        "document_type": parsed_json.get("document_type") or "unknown",
        "document_date": parsed_json.get("document_date"),
        "raw_ocr_text": summary_text,
        "status": "processed",
        "medications": meds,
        "lab_values": labs,
        "conditions": conditions,
    }
=======
            "error": str(e),
        }
>>>>>>> b444885b2c37225ef85ad4c554f091e5fc59ccd3
