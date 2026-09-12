import json
import re
import time
from typing import List, Optional, Tuple, Any

from pydantic import BaseModel, Field, AliasChoices

# Re-use utilities from our existing hybrid OCR service
from .hybrid_ocr import (
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
    result_value: Optional[str] = Field(None, description="Measured result value matching DB schema")
    unit: Optional[str] = Field(None, description="Units of measurement (e.g., mg/dL, g/L)")
    reference_range: Optional[str] = Field(None, description="Normal or reference biological range")
    flag: Optional[str] = Field(None, description="NORMAL, HIGH, LOW, or ABNORMAL")
    is_abnormal: int = Field(0, description="1 if abnormal/high/low else 0")

    def model_post_init(self, __context: Any) -> None:
        if not self.result_value:
            self.result_value = self.observed_value
        if self.flag and self.flag.upper() in ["HIGH", "LOW", "ABNORMAL"]:
            self.is_abnormal = 1
        elif self.is_abnormal is None:
            self.is_abnormal = 0

class LabReportSummary(BaseModel):
    patient_name: Optional[str] = Field(None)
    sample_date: Optional[str] = Field(None)
    document_date: Optional[str] = Field(None)
    lab_name: Optional[str] = Field(None)
    tests: List[LabTestItem] = Field(default_factory=list)
    critical_alerts: List[str] = Field(default_factory=list, description="Values significantly outside biological range")
    raw_ocr_text: str = ""
    status: str = "PROCESSED"

    def model_post_init(self, __context: Any) -> None:
        if not self.document_date and self.sample_date:
            self.document_date = self.sample_date

class ExtractedConditionItem(BaseModel):
    entity_type: str = Field(..., description="'diagnosis' or 'procedure_or_surgery'")
    description: str = Field(..., description="Condition or procedure description")
    entity_date: Optional[str] = Field(None, description="Date of condition or procedure (YYYY-MM-DD)")

class DischargeSummary(BaseModel):
    patient_name: Optional[str] = Field(None)
    admission_date: Optional[str] = Field(None)
    discharge_date: Optional[str] = Field(None)
    document_date: Optional[str] = Field(None)
    primary_diagnosis: Optional[str] = Field(None)
    secondary_diagnoses: List[str] = Field(default_factory=list)
    surgical_procedures: List[str] = Field(default_factory=list)
    discharge_vitals: List[str] = Field(default_factory=list)
    follow_up_instructions: Optional[str] = Field(None)
    conditions: List[ExtractedConditionItem] = Field(default_factory=list)
    raw_ocr_text: str = ""
    status: str = "PROCESSED"

    def model_post_init(self, __context: Any) -> None:
        if not self.document_date:
            self.document_date = self.discharge_date or self.admission_date
        if not self.conditions:
            conds = []
            if self.primary_diagnosis:
                conds.append(ExtractedConditionItem(
                    entity_type="diagnosis",
                    description=self.primary_diagnosis,
                    entity_date=self.document_date
                ))
            for diag in self.secondary_diagnoses:
                if diag:
                    conds.append(ExtractedConditionItem(
                        entity_type="diagnosis",
                        description=diag,
                        entity_date=self.document_date
                    ))
            for proc in self.surgical_procedures:
                if proc:
                    conds.append(ExtractedConditionItem(
                        entity_type="procedure_or_surgery",
                        description=proc,
                        entity_date=self.admission_date or self.document_date
                    ))
            self.conditions = conds


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
        return {"document_type": "error", "data": None, "error": str(e)}

    if not ocr_text.strip():
        return {"document_type": "error", "data": None, "error": "No text detected."}

    # Classify the document
    raw_doc_type = classify_document(ocr_text)
    doc_type = raw_doc_type.lower()
    print(f"[ROUTER] Document classified as: {doc_type}")

    if doc_type == "prescription":
        # We can route it back to our specialized prescription pipeline,
        # which uses prebuilt-read and explicit spatial geometry.
        # This keeps the highly-tuned prescription logic intact.
        prescription_summary = process_hybrid_ocr(image_bytes, patient_metadata)
        return {"document_type": "prescription", "data": prescription_summary.model_dump()}

    elif doc_type == "lab_report":
        lab_summary = parse_lab_report(ocr_text)
        return {"document_type": "lab_report", "data": lab_summary.model_dump()}

    elif doc_type == "discharge_summary":
        discharge_summary = parse_discharge_summary(ocr_text)
        return {"document_type": "discharge_summary", "data": discharge_summary.model_dump()}

    else:
        # Fallback to prescription if unknown, or just return raw text
        return {
            "document_type": "unknown", 
            "data": {
                "raw_ocr_text": ocr_text,
                "message": "Document type not recognized."
            }
        }


def extract_medical_document(image_bytes: bytes, patient_metadata: dict = None) -> dict:
    """
    Unified extraction entrypoint for medical documents.
    Extracts text, classifies, and returns normalized dictionary ready for DB ingestion:
    {
        "document_type": "prescription" | "lab_report" | "discharge_summary" | "unknown",
        "document_date": Optional[str],
        "raw_ocr_text": str,
        "status": "processed" | "failed",
        "medications": [...],
        "lab_values": [...],
        "conditions": [...],
        "raw_data": dict
    }
    """
    try:
        ocr_text = run_azure_layout_extraction(image_bytes)
    except Exception as e:
        return {
            "document_type": "unknown",
            "document_date": None,
            "raw_ocr_text": "",
            "status": "failed",
            "medications": [],
            "lab_values": [],
            "conditions": [],
            "error": str(e),
            "raw_data": {}
        }

    if not ocr_text.strip():
        return {
            "document_type": "unknown",
            "document_date": None,
            "raw_ocr_text": "",
            "status": "failed",
            "medications": [],
            "lab_values": [],
            "conditions": [],
            "error": "No text detected in document.",
            "raw_data": {}
        }

    raw_doc_type = classify_document(ocr_text)
    doc_type = raw_doc_type.lower()
    print(f"[ROUTER] Document classified as: {doc_type}")

    medications = []
    lab_values = []
    conditions = []
    document_date = None
    status = "processed"
    raw_data = {}

    if doc_type == "prescription":
        prescription_summary = process_hybrid_ocr(image_bytes, patient_metadata)
        raw_data = prescription_summary.model_dump()
        document_date = prescription_summary.document_date or prescription_summary.date
        status = "processed" if prescription_summary.status != "FAILED" else "failed"

        for med in prescription_summary.medications:
            medications.append({
                "medicine_name": med.medicine_name or med.standardized_drug_name or med.drug_name,
                "dosage": med.dosage,
                "frequency": med.frequency,
                "duration": med.duration,
                "prescribed_date": med.prescribed_date or document_date
            })

        for diag in prescription_summary.diagnosis_or_symptoms:
            if diag:
                conditions.append({
                    "entity_type": "diagnosis",
                    "description": diag,
                    "entity_date": document_date
                })

    elif doc_type == "lab_report":
        lab_summary = parse_lab_report(ocr_text)
        raw_data = lab_summary.model_dump()
        document_date = lab_summary.document_date or lab_summary.sample_date
        status = "processed" if "FAILED" not in lab_summary.status else "failed"

        for t in lab_summary.tests:
            lab_values.append({
                "test_name": t.test_name,
                "result_value": t.result_value or t.observed_value,
                "unit": t.unit,
                "reference_range": t.reference_range,
                "is_abnormal": bool(t.is_abnormal)
            })

    elif doc_type == "discharge_summary":
        discharge_summary = parse_discharge_summary(ocr_text)
        raw_data = discharge_summary.model_dump()
        document_date = (
            discharge_summary.document_date
            or discharge_summary.discharge_date
            or discharge_summary.admission_date
        )
        status = "processed" if "FAILED" not in discharge_summary.status else "failed"

        for cond in discharge_summary.conditions:
            conditions.append({
                "entity_type": cond.entity_type,
                "description": cond.description,
                "entity_date": cond.entity_date or document_date
            })

    else:
        doc_type = "unknown"
        status = "processed"
        raw_data = {"raw_ocr_text": ocr_text}

    return {
        "document_type": doc_type,
        "document_date": document_date,
        "raw_ocr_text": ocr_text,
        "status": status,
        "medications": medications,
        "lab_values": lab_values,
        "conditions": conditions,
        "raw_data": raw_data
    }
