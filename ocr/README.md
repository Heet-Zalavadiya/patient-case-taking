# MediKiosk Clinical Document OCR & Structuring Engine

An enterprise-grade, privacy-first computer vision and clinical NLP pipeline engineered for **SIH 2026 (Ministry of Ayush)**.

The service ingests raw camera snapshots or PDFs of medical documents—including **handwritten Indian prescriptions**, **diagnostic pathology lab reports**, and **hospital discharge summaries**—and converts them into verified, standardized clinical JSON schemas.

---

## Table of Contents
- [Architecture & Core Capabilities](#architecture--core-capabilities)
- [Multi-Stage Prescription Pipeline](#multi-stage-prescription-pipeline)
- [Multi-Document Classification & Routing](#multi-document-classification--routing)
- [Universal Input Adapter](#universal-input-adapter)
- [Backend Integration Guide](#backend-integration-guide)
  - [Option A: REST Microservice (HTTP)](#option-a-rest-microservice-http-recommended-for-distributed-services)
  - [Option B: In-Process Python Import](#option-b-in-process-python-import-recommended-for-monolith--fastapi-mount)
- [Environment Configuration](#environment-configuration)
- [API Reference & Schema Contracts](#api-reference--schema-contracts)
- [Verification & Running Tests](#verification--running-tests)

---

## Architecture & Core Capabilities

```
Raw Image / PDF (Prescription, Lab Report, Discharge Summary)
                          │
                          ▼
            ┌───────────────────────────┐
            │  Universal Input Adapter  │ (Accepts bytes, str/Path, UploadFile, BytesIO)
            └─────────────┬─────────────┘
                          │
                          ▼
            ┌───────────────────────────┐
            │ Azure Doc Intelligence    │ (Neural stroke decoder, polygon bounding boxes)
            └─────────────┬─────────────┘
                          │
                          ▼
            ┌───────────────────────────┐
            │ Stage 1.5 Spatial Pairing │ (2D bracket association, 3-digit shorthand,
            │ & Heuristic Separation    │  topical gel isolation, margin disambiguation)
            └─────────────┬─────────────┘
                          │
                          ▼
            ┌───────────────────────────┐
            │ Local PII Anonymization   │ (Replaces Patient Name, Phone, Email, ABHA)
            └─────────────┬─────────────┘
                          │
                          ▼
            ┌───────────────────────────┐
            │ Google Gemini 3.6 Flash   │ (Pydantic schema enforcement, Hindi/Gujarati
            │ Structured NLP Synthesizer│  normalization, clinical fallback rules)
            └─────────────┬─────────────┘
                          │
                          ▼
            ┌───────────────────────────┐
            │ Local PII Re-injection    │ (Restores real patient identity securely)
            └─────────────┬─────────────┘
                          │
                          ▼
            ┌───────────────────────────┐
            │ Tier 3 RapidFuzz Database │ (Cross-references 249,404+ Indian drug brands)
            └─────────────┬─────────────┘
                          │
                          ▼
               Structured Clinical JSON
```

### Key Capabilities
1. **2D Spatial Layout Preservation**: Reconstructs physical doctor handwriting layouts to correctly bind curly-bracketed dosage instructions (`after meals`, `before meals`) and horizontal frequency notations across vertical medicine lines.
2. **Indian Prescription Shorthand & Clinical Recovery**:
   - Accurately captures 3-digit frequency notation (`1 - 0 - 1` → `"Twice daily (Morning, Night)"`, `1 - 0 - 0` → `"Once daily (Morning)"`).
   - Applies clinical fallback rules for faint handwriting strokes (e.g., oral antibiotics like Augmentin with `1 - 0` recover to `"Twice daily"`; PPI antacids like Pan-D before meals recover to `"Once daily"`).
3. **Topical vs. Oral Instruction Isolation**: Prevents topical medicines (e.g., `Hexigel gum paint`, ointments, eye drops) from mistakenly inheriting meal timing instructions (`"before meals"`) from adjacent oral tablets.
4. **Client-Side Privacy-First PII Masking**: Automatically scrubs patient names, phone numbers, email addresses, and 14-digit ABHA/Aadhaar numbers locally *before* transmitting tokens to any cloud LLM.
5. **Multilingual Normalization**: Natively translates Hindi (e.g., *"खाने के बाद"*, *"खाली पेट"*) and Gujarati (e.g., *"જમ્યા પછી"*, *"સવાર સાંજ"*) instructions into standardized clinical English while preserving the original phrase in `original_regional_instruction`.
6. **249,400+ Indian Drug Brand Index**: Fast in-memory RapidFuzz fuzzy verification verifying extracted brand names against approved Indian pharmaceuticals.

---

## Multi-Stage Prescription Pipeline

- **Stage 1 — Azure Document Intelligence (`prebuilt-read`)**: Extracts high-precision polygon coordinates `[x1, y1, x2, y2, x3, y3, x4, y4]` preserving the exact 2D geometry of faint pen strokes without destructive binarization.
- **Stage 1.5 — Deterministic Spatial Pairing (Python)**: Sorts line tokens left-to-right (`x`), associates dosage rows directly beneath the drug header, and propagates margin bracket instructions vertically (`y`).
- **Stage 2 — Google Gemini (`gemini-3.6-flash`) Structuring**: Enforces strict Pydantic JSON schemas via native response schemas (`response_schema=ClinicalSummary`), backed by automatic exponential backoff retry loops for high resilience.
- **Stage 3 — RapidFuzz Pharmaceutical Database Verification**: Queries `ocr/data/medicine.csv` and returns fuzzy match scores (`0.0` to `100.0%`), standardized brand names, and verification statuses (`VERIFIED_IN_DATABASE` or `UNREGISTERED`).
- **Stage 4 — Local Regex Safety Net Fallback**: If network or API services are unreachable, an offline regex fallback extracts dosage patterns and flags the record for manual doctor review.

---

## Multi-Document Classification & Routing

In addition to prescriptions, the engine supports **Pathology Lab Reports** and **Hospital Discharge Summaries** via `services.document_router`:

1. **Auto-Triage**: Analyzes extracted document text and categorizes it into `PRESCRIPTION`, `LAB_REPORT`, or `DISCHARGE_SUMMARY`.
2. **Pathology/Lab Reports (`LabReportSummary`)**: Utilizes Azure `prebuilt-layout` to extract diagnostic tables in Markdown format and structures test names, observed values, biological reference ranges, units, and critical alert flags.
3. **Discharge Summaries (`DischargeSummary`)**: Extracts admission/discharge dates, primary and secondary diagnoses, surgical procedures, and discharge vitals.

---

## Universal Input Adapter

The pipeline includes a universal polymorphic input normalizer in [`services.hybrid_ocr`](file:///d:/Manya%20-%20Personal/Desktop/SIH%20Project/patient-case-taking/ocr/services/hybrid_ocr.py). Both `process_hybrid_ocr` and `process_prescription` accept:
- **Raw `bytes`**: (e.g., `await file.read()` or `open("...", "rb").read()`)
- **File path `str` or `Path`**: (e.g., `"samples/sample-prescription.png"` or `"/tmp/upload.pdf"`)
- **FastAPI / Starlette `UploadFile`**: (e.g., directly from route parameter `file: UploadFile = File(...)`)
- **File-like objects**: (e.g., `io.BytesIO`)
- **Single- & Multi-Page PDFs**: (Natively detected via magic bytes `%PDF` and sent directly to Azure Document Intelligence)

---

## Backend Integration Guide

The backend team has two flexible options to connect to this service.

### Option A: REST Microservice (HTTP) *(Recommended for Distributed Services)*

The OCR service runs as an independent FastAPI microservice on port **8001**.

#### 1. Start the Microservice
```powershell
# From the ocr/ directory:
.\.venv\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8001 --reload
```

#### 2. Backend FastAPI Controller Example (Forwarding UploadFile)
```python
# In your backend router (e.g. backend/routers/clinical.py)
import httpx
from fastapi import APIRouter, UploadFile, File, HTTPException

router = APIRouter(prefix="/documents", tags=["Documents"])
OCR_SERVICE_URL = "http://127.0.0.1:8001/ocr/process-hybrid"

@router.post("/process-prescription")
async def process_prescription_endpoint(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    file_bytes = await file.read()
    
    async with httpx.AsyncClient(timeout=60.0) as client:
        try:
            response = await client.post(
                OCR_SERVICE_URL,
                files={"file": (file.filename, file_bytes, file.content_type or "image/png")}
            )
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as exc:
            raise HTTPException(status_code=exc.response.status_code, detail=exc.response.text)
        except Exception as err:
            raise HTTPException(status_code=503, detail=f"OCR Microservice unavailable: {err}")
```

#### 3. cURL Example
```bash
curl -X POST "http://127.0.0.1:8001/ocr/process-hybrid" \
  -H "accept: application/json" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@samples/sample-prescription.png;type=image/png"
```

---

### Option B: In-Process Python Import *(Recommended for Monolith / FastAPI Mount)*

If running the backend in the same Python environment, import the universal adapter directly with zero HTTP overhead.

#### Import from `services.ocr` or `services.hybrid_ocr`:
```python
from services.ocr import process_prescription, ClinicalSummary

# 1. From an image or PDF file path on disk:
summary: ClinicalSummary = process_prescription("uploads/patient_123_rx.png")

# 2. Or from raw bytes:
summary: ClinicalSummary = process_prescription(file_bytes)

# 3. Or passing patient context for client-side PII de-anonymization:
summary: ClinicalSummary = process_prescription(
    file_bytes,
    patient_metadata={"name": "Sachin Sansare"}
)

# Access typed Pydantic attributes or export dictionary:
print(summary.patient_name)
for med in summary.medications:
    print(med.drug_name, med.frequency, med.instructions, med.standardized_drug_name)

result_dict = summary.model_dump()
```

#### For Multi-Document Routing (Prescriptions + Lab Reports + Discharge Summaries):
```python
from services.ocr import process_medical_document

# Automatically triages document type and routes to the appropriate parser
doc_result = process_medical_document(file_bytes, patient_metadata={"name": "Sachin Sansare"})

print(doc_result["document_type"])  # "PRESCRIPTION", "LAB_REPORT", or "DISCHARGE_SUMMARY"
print(doc_result["data"])
```

---

## Environment Configuration

Ensure credentials are configured in your `.env` file (located in `ocr/.env` or repository root):

```env
# Azure Document Intelligence (Computer Vision)
AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT="https://<your-resource-name>.cognitiveservices.azure.com/"
AZURE_DOCUMENT_INTELLIGENCE_KEY="<your-azure-key>"

# Google AI Studio (Clinical NLP Structuring)
GEMINI_API_KEY="<your-google-ai-studio-gemini-key>"
```

---

## API Reference & Schema Contracts

### Output Schema: `ClinicalSummary`
```json
{
  "patient_name": "Mr. Sachin Sansare",
  "doctor_name": null,
  "date": "12/10/22",
  "diagnosis_or_symptoms": [],
  "medications": [
    {
      "drug_name": "Tab. Augmentin 625mg",
      "dosage": "625mg",
      "frequency": "Twice daily (Morning, Night)",
      "duration": "5 days",
      "instructions": "after meals",
      "original_regional_instruction": null,
      "verification_score": 100.0,
      "standardized_drug_name": "Augmentin 625mg",
      "verification_status": "VERIFIED_IN_DATABASE"
    },
    {
      "drug_name": "Tab. Enzoflam",
      "dosage": null,
      "frequency": "Twice daily (Morning, Night)",
      "duration": "5 days",
      "instructions": "after meals",
      "original_regional_instruction": null,
      "verification_score": 100.0,
      "standardized_drug_name": "Enzoflam",
      "verification_status": "VERIFIED_IN_DATABASE"
    },
    {
      "drug_name": "Tab. PanD 40mg",
      "dosage": "40mg",
      "frequency": "Once daily (Morning)",
      "duration": "5 days",
      "instructions": "before meals",
      "original_regional_instruction": null,
      "verification_score": 94.74,
      "standardized_drug_name": "Pan-D 40mg",
      "verification_status": "VERIFIED_IN_DATABASE"
    },
    {
      "drug_name": "Hexigel gum paint",
      "dosage": null,
      "frequency": "Twice daily (Morning, Night)",
      "duration": "1 week",
      "instructions": "Apply locally / as directed",
      "original_regional_instruction": null,
      "verification_score": 100.0,
      "standardized_drug_name": "Hexigel",
      "verification_status": "VERIFIED_IN_DATABASE"
    }
  ],
  "lab_tests_recommended": [],
  "red_flags": [],
  "ocr_confidence_score": 99.0,
  "status": "PROCESSED"
}
```

---

## Verification & Running Tests

Run the test suites from within the `ocr/` folder:

```powershell
# 1. Run Universal Adapter & FastAPI Endpoint integration test:
.\.venv\Scripts\python.exe -u test_adapter.py

# 2. Run Multi-Document Auto-Router test:
.\.venv\Scripts\python.exe -u test_multi_doc.py samples/sample-prescription.png

# 3. Run Standalone Prescription pipeline test:
.\.venv\Scripts\python.exe -u test_ocr.py
```
