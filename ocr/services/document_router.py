import json
import re
import time
from typing import List, Optional, Tuple, Any

from pydantic import BaseModel, Field, AliasChoices

# Re-use utilities from our existing hybrid OCR service
from services.hybrid_ocr import (
    get_azure_client,
    _preprocess_for_azure,
    get_gemini_client,
    process_hybrid_ocr
)
from google.genai import types

# ---------------------------------------------------------------------------
# PYDANTIC SCHEMAS
# ---------------------------------------------------------------------------
class LabTestItem(BaseModel):
    test_name: str = Field(..., description="Name of the test, e.g., 'Hemoglobin', 'HbA1c'")
    observed_value: Optional[str] = Field(None, description="The measured value")
    unit: Optional[str] = Field(None, description="Units of measurement (e.g., mg/dL, g/L)")
    reference_range: Optional[str] = Field(None, description="Normal or reference biological range")
    flag: Optional[str] = Field(None, description="NORMAL, HIGH, LOW, or ABNORMAL")

class LabReportSummary(BaseModel):
    patient_name: Optional[str] = Field(None)
    sample_date: Optional[str] = Field(None)
    lab_name: Optional[str] = Field(None)
    tests: List[LabTestItem] = Field(default_factory=list)
    critical_alerts: List[str] = Field(default_factory=list, description="Values significantly outside biological range")
    raw_ocr_text: str = ""
    status: str = "PROCESSED"

class DischargeSummary(BaseModel):
    patient_name: Optional[str] = Field(None)
    admission_date: Optional[str] = Field(None)
    discharge_date: Optional[str] = Field(None)
    primary_diagnosis: Optional[str] = Field(None)
    secondary_diagnoses: List[str] = Field(default_factory=list)
    surgical_procedures: List[str] = Field(default_factory=list)
    discharge_vitals: List[str] = Field(default_factory=list)
    follow_up_instructions: Optional[str] = Field(None)
    raw_ocr_text: str = ""
    status: str = "PROCESSED"


class DocumentClassification(BaseModel):
    document_type: str = Field(..., description="One of: PRESCRIPTION, LAB_REPORT, DISCHARGE_SUMMARY, or UNKNOWN")

# ---------------------------------------------------------------------------
# CLASSIFIER & PARSERS
# ---------------------------------------------------------------------------
def classify_document(ocr_text: str) -> str:
    """Classifies the extracted document text into one of three categories."""
    client = get_gemini_client()
    if not client:
        return "PRESCRIPTION"  # Fallback

    prompt = f"""
You are a Medical Document Classification AI.
Read the following OCR text extracted from a medical document and classify it into exactly ONE of the following categories:
- "PRESCRIPTION": Contains Rx, lists of medications with dosages (e.g., Tabs, Caps, Syrups), frequency.
- "LAB_REPORT": Contains tabular data of blood tests, pathology results, observed values, biological reference ranges, units (e.g., mg/dL).
- "DISCHARGE_SUMMARY": Contains admission/discharge dates, course in hospital, primary diagnosis, surgical procedures, and discharge vitals.
- "UNKNOWN": If it does not fit the above.

DOCUMENT TEXT:
\"\"\"
{ocr_text[:2000]}  # Read up to the first 2000 chars for classification
\"\"\"
"""
    for attempt in range(3):
        try:
            response = client.models.generate_content(
                model="gemini-3.6-flash",
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=DocumentClassification,
                    temperature=0.0
                )
            )
            raw_content = response.text or ""
            parsed_dict = json.loads(raw_content)
            doc_type = parsed_dict.get("document_type", "UNKNOWN").upper()
            if doc_type in ["PRESCRIPTION", "LAB_REPORT", "DISCHARGE_SUMMARY"]:
                return doc_type
            return "UNKNOWN"
        except Exception as e:
            if attempt < 2:
                time.sleep(2 * (attempt + 1))
                continue
            print(f"[WARN] Classification failed after retries: {e}")
            return "PRESCRIPTION"

def parse_lab_report(ocr_text: str) -> LabReportSummary:
    client = get_gemini_client()
    if not client:
        return LabReportSummary(status="FAILED_NO_API_KEY", raw_ocr_text=ocr_text)

    prompt = f"""
You are an expert Clinical Pathologist AI.
Parse the following OCR text from a Laboratory/Pathology Report into structured JSON.
Pay close attention to Markdown-formatted tables if present.
Do NOT hallucinate units or reference ranges if they are not explicitly present in the text.

DOCUMENT TEXT:
\"\"\"
{ocr_text}
\"\"\"
"""
    try:
        response = client.models.generate_content(
            model="gemini-3.6-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=LabReportSummary,
                temperature=0.0
            )
        )
        parsed = json.loads(response.text or "{}")
        summary = LabReportSummary.model_validate(parsed)
        summary.raw_ocr_text = ocr_text
        summary.status = "PROCESSED"
        return summary
    except Exception as e:
        print(f"[ERROR] Lab Report Parsing Failed: {e}")
        return LabReportSummary(status="FAILED", raw_ocr_text=ocr_text)

def parse_discharge_summary(ocr_text: str) -> DischargeSummary:
    client = get_gemini_client()
    if not client:
        return DischargeSummary(status="FAILED_NO_API_KEY", raw_ocr_text=ocr_text)

    prompt = f"""
You are an expert Clinical Data Extraction AI.
Parse the following OCR text from a Hospital Discharge Summary into structured JSON.

DOCUMENT TEXT:
\"\"\"
{ocr_text}
\"\"\"
"""
    try:
        response = client.models.generate_content(
            model="gemini-3.6-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=DischargeSummary,
                temperature=0.0
            )
        )
        parsed = json.loads(response.text or "{}")
        summary = DischargeSummary.model_validate(parsed)
        summary.raw_ocr_text = ocr_text
        summary.status = "PROCESSED"
        return summary
    except Exception as e:
        print(f"[ERROR] Discharge Summary Parsing Failed: {e}")
        return DischargeSummary(status="FAILED", raw_ocr_text=ocr_text)


# ---------------------------------------------------------------------------
# AZURE LAYOUT EXTRACTION (FOR TABLES)
# ---------------------------------------------------------------------------
def run_azure_layout_extraction(image_bytes: bytes) -> str:
    """
    Uses Azure prebuilt-layout to extract text and format tables into Markdown.
    This preserves tabular structures perfectly for Lab Reports.
    """
    azure_client = get_azure_client()
    processed_bytes = _preprocess_for_azure(image_bytes)

    poller = azure_client.begin_analyze_document(
        model_id="prebuilt-layout",
        body=processed_bytes,
        content_type="application/octet-stream",
        output_content_format="markdown"  # This enables markdown table generation for supported API versions
    )
    result = poller.result()
    
    if hasattr(result, "content") and result.content:
        return result.content
    
    text_blocks = []
    if result.pages:
        for page in result.pages:
            for line in getattr(page, "lines", []):
                text_blocks.append(line.content)
    return "\n".join(text_blocks)

# ---------------------------------------------------------------------------
# UNIFIED ENTRYPOINT
# ---------------------------------------------------------------------------
def process_medical_document(image_bytes: bytes, patient_metadata: dict = None) -> dict:
    """
    Unified router for medical documents.
    1. Extracts text using Azure Layout (better for tables than prebuilt-read).
    2. Classifies the document.
    3. Routes to the specialized pipeline.
    """
    try:
        ocr_text = run_azure_layout_extraction(image_bytes)
    except Exception as e:
        return {"document_type": "ERROR", "data": None, "error": str(e)}

    if not ocr_text.strip():
        return {"document_type": "ERROR", "data": None, "error": "No text detected."}

    # Classify the document
    doc_type = classify_document(ocr_text)
    print(f"[ROUTER] Document classified as: {doc_type}")

    if doc_type == "PRESCRIPTION":
        # We can route it back to our specialized prescription pipeline,
        # which uses prebuilt-read and explicit spatial geometry.
        # This keeps the highly-tuned prescription logic intact.
        prescription_summary = process_hybrid_ocr(image_bytes, patient_metadata)
        return {"document_type": "PRESCRIPTION", "data": prescription_summary.model_dump()}

    elif doc_type == "LAB_REPORT":
        lab_summary = parse_lab_report(ocr_text)
        return {"document_type": "LAB_REPORT", "data": lab_summary.model_dump()}

    elif doc_type == "DISCHARGE_SUMMARY":
        discharge_summary = parse_discharge_summary(ocr_text)
        return {"document_type": "DISCHARGE_SUMMARY", "data": discharge_summary.model_dump()}

    else:
        # Fallback to prescription if unknown, or just return raw text
        return {
            "document_type": "UNKNOWN", 
            "data": {
                "raw_ocr_text": ocr_text,
                "message": "Document type not recognized."
            }
        }
