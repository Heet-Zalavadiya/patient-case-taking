# MediKiosk Clinical Document OCR & Structuring Engine

An enterprise-grade, privacy-first computer vision and clinical NLP pipeline engineered for **SIH 2026 (Ministry of Ayush)**.

The service ingests raw camera snapshots or PDFs of medical documents—including **handwritten Indian prescriptions**, **diagnostic pathology lab reports**, and **hospital discharge summaries**—and converts them into verified, standardized clinical data structured directly for SQL Server database storage.

---

## Deployment Modes

### 🌟 Mode 1: Unified Single-Server Mode (Port 8000) — *Recommended*
Run the entire MediKiosk platform—including all patient APIs, clinical session management, doctor authentication, and the OCR pipeline—under **one single FastAPI server**:

```powershell
cd "d:\Manya - Personal\Desktop\SIH Project\patient-case-taking\backend"
uvicorn main:app --reload --port 8000
```

- **Swagger Docs**: `http://localhost:8000/docs`
- **Document Upload**: `POST /documents` (multipart file upload + background OCR)
- **Status Polling**: `GET /documents/{id}/status`
- **Database Storage**: Extracted medications, lab values, and conditions are automatically written directly to your SQL Server database.

---

### 🧪 Mode 2: Standalone OCR Developer Server (Port 8001) — *Optional*
If you or your team want to test or benchmark the OCR pipeline in isolation (without starting the database or backend services):

```powershell
cd "d:\Manya - Personal\Desktop\SIH Project\patient-case-taking\ocr"
.\.venv\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8001 --reload
```

- **Swagger Docs**: `http://localhost:8001/docs`
- **Health Check**: `GET /health`
- **Prescriptions**: `POST /ocr/process-prescription`
- **Multi-Document Router**: `POST /ocr/process-document`
- **Unified DB-Ready JSON**: `POST /ocr/extract-unified`

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
            ┌───────────────────────────┐
            │ In-Process DB Writer      │ (Auto-populates SQL Server Tables)
            └───────────────────────────┘
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

## Multi-Document Classification & Routing

In addition to prescriptions, the engine supports **Pathology Lab Reports** and **Hospital Discharge Summaries** via `services.document_router`:

1. **Auto-Triage**: Analyzes extracted document text and categorizes it into `"prescription"`, `"lab_report"`, or `"discharge_summary"`.
2. **Pathology/Lab Reports (`LabReportSummary`)**: Utilizes Azure `prebuilt-layout` to extract diagnostic tables in Markdown format and structures test names, observed values, biological reference ranges, units, and critical alert flags (`is_abnormal = 1` or `0`).
3. **Discharge Summaries (`DischargeSummary`)**: Extracts admission/discharge dates, primary and secondary diagnoses, surgical procedures, and structured `conditions` (`diagnosis` or `procedure_or_surgery`).

---

## Schema Alignment with SQL Database

All OCR Pydantic models are 1:1 aligned with the SQL Server relational schema:

### 1. Medications Table (`document_extracted_medications`)
```python
class MedicationItem(BaseModel):
    drug_name: str
    medicine_name: Optional[str]        # -> DB column: medicine_name
    dosage: Optional[str]               # -> DB column: dosage
    frequency: Optional[str]            # -> DB column: frequency
    duration: Optional[str]             # -> DB column: duration
    prescribed_date: Optional[str]      # -> DB column: prescribed_date
    instructions: Optional[str]
    verification_score: float
    standardized_drug_name: Optional[str]
    verification_status: str
```

### 2. Lab Values Table (`document_extracted_lab_values`)
```python
class LabTestItem(BaseModel):
    test_name: str                      # -> DB column: test_name
    result_value: Optional[str]         # -> DB column: result_value (mapped from observed_value)
    unit: Optional[str]                 # -> DB column: unit
    reference_range: Optional[str]      # -> DB column: reference_range
    is_abnormal: int                    # -> DB column: is_abnormal (1 if HIGH/LOW/ABNORMAL, else 0)
```

### 3. Conditions Table (`document_extracted_conditions`)
```python
class ExtractedConditionItem(BaseModel):
    entity_type: str                    # -> DB column: entity_type ('diagnosis' | 'procedure_or_surgery')
    description: str                    # -> DB column: description
    entity_date: Optional[str]          # -> DB column: entity_date
```

---

## In-Process Python Usage

To call the extraction engine directly from Python code (zero HTTP overhead):

```python
from services.document_router import extract_medical_document

# Pass image/PDF bytes or file path
with open("sample_rx.png", "rb") as f:
    result = extract_medical_document(f.read())

print(result["document_type"])  # "prescription" | "lab_report" | "discharge_summary"
print(result["document_date"])  # "2026-03-15"
print(result["medications"])    # List of medication dicts matching DB columns
print(result["lab_values"])     # List of lab test dicts matching DB columns
print(result["conditions"])     # List of clinical conditions
```

---

## Environment Configuration

Ensure credentials are configured in your `.env` file (in `ocr/.env`, `backend/.env`, or the root directory):

```env
# Azure Document Intelligence
AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT="https://<your-resource-name>.cognitiveservices.azure.com/"
AZURE_DOCUMENT_INTELLIGENCE_KEY="<your-azure-key>"

# Google AI Studio (Clinical LLM)
GEMINI_API_KEY="<your-gemini-api-key>"

# SQL Server Database (Backend)
DATABASE_SERVER="localhost\\SQLEXPRESS"
DATABASE_NAME="medikiosk"
```

---

## Verification & Running Tests

### 1. Test Single-Server Backend & OCR Integration
```powershell
cd "d:\Manya - Personal\Desktop\SIH Project\patient-case-taking\backend"
..\ocr\.venv\Scripts\python.exe test_single_server_ocr.py
```

### 2. Test Standalone OCR Microservice Pipeline
```powershell
cd "d:\Manya - Personal\Desktop\SIH Project\patient-case-taking\ocr"
.\.venv\Scripts\python.exe test_multi_doc.py samples/sample-prescription.png
```
