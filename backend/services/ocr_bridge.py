"""
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


def run_ocr(image_bytes: bytes, patient_metadata: Optional[dict] = None) -> dict:
    """
    Process a medical document image using Gemini Vision multimodal extraction.

    Returns a normalized dict:
    {
        "document_type": "prescription" | "lab_report" | "discharge_summary" | "unknown",
        "document_date": Optional[str],
        "raw_ocr_text": str,
        "status": "processed" | "failed",
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
            if response and response.text:
        except Exception as e:
            last_exception = e
            logger.warning(f"[OCR Bridge] Model {model_name} failed: {e}")
            continue

    if not raw_response_text:
        logger.error(f"[OCR Bridge] All Gemini vision models failed: {last_exception}")
        return fallback_fail

    # Parse JSON from response
    parsed_json = None
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
            "status": "failed",
            "medications": [],
            "lab_values": [],
            "conditions": [],
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
