# 🏥 MediKiosk Backend — Super Simple Guide (Explained for a 5th Grader)

Welcome to the **MediKiosk Backend Guide**! If you've ever wondered how a computer system in a hospital works behind the scenes, this guide explains **everything** using fun real-world examples and super simple language.

---

## 🌟 1. What is the "Backend"? (The Post Office & Brain of the App)

Imagine a hospital kiosk app like a **restaurant**:
* The **Frontend** (Patient App & Doctor Dashboard) is the **Dining Table and Menu Card** that users see and touch.
* The **Backend** is the **Kitchen and Chef**. You can't see the kitchen from your table, but it processes your order, prepares the food, and stores recipes safely.

The MediKiosk Backend does **3 main jobs**:
1. **The Post Office 📮**: It receives messages from the Patient App, AI, and OCR scanners, and delivers them to the right place.
2. **The Security Guard 👮**: It checks permissions (Consent) to make sure patient data stays safe.
3. **The Vault & Memory Box 🗄️**: It saves everything into a database (SQL Server) so doctors can read patient histories later.

```
[ 📱 Patient UI ]   [ 🤖 AI Engine ]   [ 🔍 OCR Scanner ]   [ 👨‍⚕️ Doctor UI ]
        │                   │                   │                   │
        └───────────────────┴────────┬──────────┴───────────────────┘
                                     │
                             [ 🏥 FastAPI Backend ]
                                     │
                             [ 💾 SQL Server Vault ]
```

---

## 📂 2. Tour of the Code Files (Step-by-Step)

Let's look at every folder and file in the `backend/` project, line by line!

---

### File 1: `database/connection.py` 🔌 (The Phone Line to the Vault)

This file creates the connection between Python and the SQL Server database.

```python
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
import os
from dotenv import load_dotenv

# 1. Read secrets from .env file
load_dotenv()

# 2. Get the address of our SQL Server database
DATABASE_URL = os.getenv("DATABASE_URL")

# 3. Create the engine (the engine is like the car engine that drives to the database)
engine = create_engine(DATABASE_URL)

# 4. Create a Session maker (like hiring a librarian to fetch books for us)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 5. Base class (the parent template for all database tables)
Base = declarative_base()

# 6. Helper function to open and close database sessions safely
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

* **What it means**: `get_db()` opens a safe door to the database, lets the endpoint read/write data, and makes sure the door is locked when done.

---

### File 2: `models/` 📑 (The Blueprints for the 15 Tables)

Models are Python classes that describe what each table in SQL Server looks like.

#### A. `models/patient.py` 👤 (The Patient Badge)
Stores patient identity (Name, Age, Gender, Preferred Language, ABHA ID).
* `patient_id`: Unique badge number (1, 2, 3...)
* `full_name`: E.g., "Ravi Patel"
* `preferred_language`: E.g., "Hindi" or "English"

#### B. `models/doctor.py` 👨‍⚕️ (The Doctor Badge)
Stores doctor information and whether they practice Allopathic or AYUSH (Ayurvedic) medicine.

#### C. `models/consent.py` 📜 (The Permission Slip)
Before an AI asks medical questions, the patient signs a permission slip!
* `consent_type`: E.g., `'data_capture'` or `'abdm_sharing'`
* `granted_via`: Was it given via `'touch'` (button) or `'audio'` (voice)?

#### D. `models/clinical_session.py` ⏱️ (The Hospital Visit Diary)
One session is created every time a patient visits the kiosk.
* `history_mode`: `'allopathic'` or `'ayush'`
* `status`: `'in_progress'` or `'completed'`

#### E. `models/interview_turn.py` 🗣️ (The Q&A Log)
Records every question the AI asked and every answer the patient spoke or typed!

#### F. `models/structured_history.py` 📋 (The Organized Medical Story)
Organizes patient symptoms into standard medical categories (Chief Complaint, HPI, Past History, Allergies, Family History).

#### G. `models/red_flag_alert.py` 🚨 (The Emergency Alarm Siren!)
If the patient says "I have chest pain and shortness of breath", this table immediately triggers a **HIGH priority red flag alert** for the triage nurse and doctor!

#### H. `models/medical_document.py` 📄 (Uploaded Paper Records)
Stores uploaded prescription images and lab report PDFs.

#### I. `models/document_extraction.py` 🔍 (The Magic Scanner Results)
Contains 3 tables created when the OCR scanner reads old paper documents:
1. `document_extracted_medications`: Medicine Name, Dosage (e.g. Aspirin 75mg).
2. `document_extracted_lab_values`: Test Name, Result Value (e.g. Troponin-T 0.08 ng/mL) and `is_abnormal = True` flag (which highlights dangerous values in **RED** on the Doctor Dashboard).
3. `document_extracted_conditions`: Diagnoses found on old reports.

#### J. `models/clinical_summary.py` 📝 (The Doctor's Summary Report)
AI generates a bilingual summary in English and Hindi (`summary_text_local_language`) so the doctor can read the patient's story in 10 seconds.

#### K. `models/abdm_sync_log.py` 🌐 (Digital Health Passbook Sync)
Logs whether the clinical summary was successfully sent to the government ABDM/FHIR national health portal (`sync_status = 'success'`).

#### L. `models/audit_log.py` 🛡️ (The Security Guard's Logbook)
Keeps a permanent record of privacy events (e.g., when temporary session data is cleared after submission).

---

### File 3: `schemas/` 📐 (The Order Menu & Rule Checker)

Schemas (using Pydantic) validate data coming from the frontend before saving it to the database.

* If someone sends an age of `"one hundred"` instead of a number `100`, Pydantic stops it and says *"Hey, age must be a number!"*

Key Schemas in `schemas/clinical.py` & `schemas/patient.py`:
* `PatientCreate` & `PatientResponse`
* `ConsentCreate` & `ConsentResponse`
* `SessionCreate`, `SessionResponse`, `SessionUpdate`
* `ClinicalSummaryCreate`, `ClinicalSummaryResponse`, `SummaryStatusUpdate`
* `ExtractedMedicationCreate`, `ExtractedLabValueCreate`, `ExtractedConditionCreate`

---

### File 4: `routers/` 🚪 (The Reception Counters)

Routers define the API URLs (Endpoints) that the frontend apps call over HTTP.

#### A. `routers/patients.py` (Patient Counter)
* `POST /patients` ➔ Register a new patient.
* `GET /patients` ➔ List all patients (for Doctor Dashboard).
* `GET /patients/{id}` ➔ Get details of 1 patient.
* `POST /patients/{id}/consent` ➔ Save patient permission slip.
* `GET /patients/{id}/summary` ➔ Fetch patient's clinical summary.
* `GET /patients/{id}/documents` ➔ Get all uploaded documents + extracted medications & abnormal lab values.

#### B. `routers/clinical.py` (Clinical & AI Counter)
* `POST /sessions` ➔ Start a new visit session.
* `GET /sessions/{id}` & `PATCH /sessions/{id}` ➔ View/complete a session.
* `POST /sessions/{id}/turns` ➔ Save AI question & patient answer.
* `POST /sessions/{id}/history` ➔ Save structured medical history.
* `POST /sessions/{id}/red-flags` ➔ Trigger emergency red flag siren 🚨.
* `POST /sessions/{id}/summary` ➔ Save AI-generated bilingual summary.
* `PATCH /summary/{id}/status` ➔ Doctor clicks "Accept" or "Amend" summary.
* `POST /summary/{id}/abdm-sync` ➔ Log ABDM FHIR sync.
* `POST /documents/{id}/medications` ➔ Save OCR extracted medicines.
* `POST /documents/{id}/lab-values` ➔ Save OCR extracted lab test results.

---

### File 5: `main.py` 🚀 (The Main Entrance)

`main.py` is the starting point of the application:
1. Initializes FastAPI app.
2. Runs `Base.metadata.create_all()` to create all 15 tables in SQL Server automatically.
3. Sets up a **Global Exception Handler** so if any error happens, it returns a clean JSON message instead of crashing.
4. Mounts `patients_router` and `clinical_router`.

---

### File 6: `database/seed_demo_data.py` 🪄 (The Magic Hackathon Demo Button)

For the hackathon presentation, we created a 1-click Python script:
```bash
python database/seed_demo_data.py
```
What it does:
1. Clears old data cleanly.
2. Preloads **Patient 1: Ravi Patel** (45M, acute chest pain + dyspnoea, HIGH Red Flag alert, 3 OCR prescription meds, abnormal Troponin-T lab value 0.08 ng/mL, bilingual summary, ABDM sync success).
3. Preloads **Patient 2: Priya Shah** (32F, fever with chills, draft summary).

---

## 🎯 3. End-to-End Patient Journey Flowchart

Here is how data flows through the backend during a real hospital visit:

```
1. PATIENT ARRIVES ➔ POST /patients ➔ Saves Patient Record
         │
2. CONSENT GIVEN ➔ POST /patients/{id}/consent ➔ Saves Permission Slip
         │
3. SESSION STARTS ➔ POST /sessions ➔ Creates Session Record
         │
4. AI INTERVIEW ➔ POST /sessions/{id}/turns ➔ Logs Q&A Turns
         │
5. RED FLAG ALERT? ➔ POST /sessions/{id}/red-flags ➔ Triggers Alarm 🚨
         │
6. OCR UPLOAD ➔ POST /documents ➔ POST /documents/{id}/lab-values (is_abnormal=1)
         │
7. AI SUMMARY ➔ POST /sessions/{id}/summary ➔ Saves English & Hindi Summary
         │
8. DOCTOR REVIEW ➔ GET /patients/{id}/summary ➔ PATCH /summary/{id}/status ('accepted')
         │
9. ABDM SYNC ➔ POST /summary/{id}/abdm-sync ➔ Pushes to National Portal
```

---

## 🏆 Summary
The **MediKiosk Backend** is fully built, tested, and ready. It connects all 4 hackathon modules (Patient UI, Doctor Dashboard, AI, OCR) with 15 database tables, robust validation, and instant demo data seeding!
