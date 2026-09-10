# 🏥 MediKiosk Backend — Day 1 & Day 2 Guide, Code Breakdown & Testing Manual

Welcome! This guide explains everything built in **Day 1** and **Day 2** of the **MediKiosk Backend (Member 3)** in simple language. Whether you are a college student or a 5th grader, this guide will make every concept crystal clear!

---

## 🎈 1. What is this Backend? (Explain Like I'm 5)

Imagine a **Hospital Kiosk** where a patient walks in, talks to an AI assistant, uploads past prescriptions, and the doctor sees a neat summary on their computer screen.

To make all of this happen, we need 3 things:
1. **The Screen (Frontend):** What the patient and doctor touch and see on screen.
2. **The Notebook (Database - SQL Server):** Where all patient data is stored permanently so it is never lost.
3. **The Messenger / Waiter (Backend - FastAPI):** The super-smart manager in the middle that takes data from the screen, checks if it's correct, and saves it into the database notebook!

**Your job as Member 3 is building this Backend Manager!**

---

## 🛠️ 2. Technologies & Installed Packages Explained

All installed packages are listed in `backend/requirements.txt`:

```text
fastapi
uvicorn[standard]
sqlalchemy
pyodbc
pydantic
pydantic-settings
python-dotenv
```

Here is what each tool does in simple words:

| Package | Real-World Analogy | What it does in our code |
| :--- | :--- | :--- |
| **Python** | The language we speak | The main programming language used to write our code. |
| **FastAPI** | The Restaurant Waiter | Receives requests from frontend screens and responds back with data in JSON format. |
| **Uvicorn** | The Server Engine | Runs our FastAPI program on localhost (`http://127.0.0.1:8000`) so the server stays open. |
| **SQL Server** | The Giant Digital Filing Cabinet | Microsoft SQL Server database storing all tables (`patients`, `clinical_sessions`, etc.). |
| **SQLAlchemy** | The Language Translator | Converts Python code into SQL commands so Python can talk directly to SQL Server! |
| **PyODBC** | The Connecting Wire | The underlying Windows driver that connects Python directly to Microsoft SQL Server (`SQLEXPRESS`). |
| **Pydantic** | The Strict Gatekeeper | Checks incoming data form fields (e.g. checks if age is a number, if full_name is text). |
| **python-dotenv** | The Secret Envelope | Reads secret settings (database name, passwords) from `.env` file without leaking secrets. |

---

## 📁 3. Project Structure (What each folder does)

```text
backend/
├── .env                  <-- Secret config (Database connection string settings)
├── database/
│   ├── connection.py     <-- Establishes connection between Python & SQL Server
│   └── medikiosk_schema.sql <-- Full SQL Server database setup script
├── models/               <-- Database blueprints (SQLAlchemy tables)
│   ├── patient.py
│   ├── clinical_session.py
│   ├── interview_turn.py
│   ├── structured_history.py
│   ├── ayush_history.py
│   ├── red_flag_alert.py
│   └── medical_document.py
├── schemas/              <-- Form validation rules (Pydantic models)
│   ├── patient.py
│   └── clinical.py
├── routers/              <-- API post offices / endpoints (URL handlers)
│   ├── patients.py
│   └── clinical.py
└── main.py               <-- Main entry point starting the FastAPI server
```

---

## 🔬 4. Line-by-Line Code Breakdown

### A. `backend/database/connection.py` (Connecting to SQL Server)

```python
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from pydantic_settings import BaseSettings
from dotenv import load_dotenv
import os

load_dotenv()  # Reads .env file secrets

# Loads settings from .env file (or uses defaults)
class Settings(BaseSettings):
    DATABASE_SERVER: str = os.getenv("DATABASE_SERVER", "localhost\\SQLEXPRESS")
    DATABASE_NAME: str = os.getenv("DATABASE_NAME", "medikiosk")

settings = Settings()

# Builds SQL Server connection link
DATABASE_URL = f"mssql+pyodbc://@{settings.DATABASE_SERVER}/{settings.DATABASE_NAME}?driver=ODBC+Driver+17+for+SQL+Server&trusted_connection=yes"

# Creates database engine
engine = create_engine(DATABASE_URL, echo=True)

# Session factory for creating DB transactions
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class that all database models inherit from
class Base(DeclarativeBase):
    pass

# Dependency function used in routers to get DB session and close it automatically
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

---

### B. `backend/models/*.py` (Database Table Blueprints)

These files define the exact columns for each SQL Server table:

1. **`models/patient.py` (`patients` table):**
   Stores patient profile (`patient_id`, `full_name`, `age`, `gender`, `phone_number`, `preferred_language`, `accessibility_mode`, `login_id`, `password_hash`).
2. **`models/clinical_session.py` (`clinical_sessions` table):**
   Stores one consultation session per visit (`session_id`, `patient_id`, `history_mode` ['allopathic'/'ayush'], `status`, `started_at`).
3. **`models/interview_turn.py` (`interview_turns` table):**
   Stores turn-by-turn chat between AI and patient (`turn_number`, `input_mode` ['voice'/'touch'], `ai_question`, `patient_response_text`).
4. **`models/structured_history.py` (`structured_history` table):**
   Stores all 13 clinical history fields (`chief_complaint`, `hpi_onset`, `hpi_character`, `hpi_radiation`, `hpi_severity`, `past_medical_surgical`, `drug_allergy_history`, `family_history`, etc.).
5. **`models/ayush_history.py` (`ayush_history` table):**
   Stores 12 AYUSH Dashavidha Pariksha fields (`prakriti`, `vikriti`, `sara`, `samhanana`, `pramana`, `satmya`, `sattva`, `ahara_shakti`, `vyayama_shakti`, `vaya`, etc.).
6. **`models/red_flag_alert.py` (`red_flag_alerts` table):**
   Stores emergency alerts (`flag_description`, `severity` ['HIGH'], `triage_notified`).
7. **`models/medical_document.py` (`medical_documents` table):**
   Stores uploaded documents (`patient_id`, `session_id`, `document_type`, `file_path`, `ocr_status`).

---

### C. `backend/schemas/*.py` (Form Rules & Validation)

- **`schemas/patient.py`**: Defines `PatientCreate` (what input is needed to register) and `PatientResponse` (what info is returned back).
- **`schemas/clinical.py`**: Defines `SessionCreate`, `InterviewTurnCreate`, `StructuredHistoryCreate`, `AyushHistoryCreate`, `RedFlagCreate`, `MedicalDocumentCreate` and their corresponding Response schemas.

---

### D. `backend/routers/*.py` (API Endpoints)

1. **`routers/patients.py`**:
   - `POST /patients/` : Register a new patient in SQL Server.
   - `GET /patients/{id}` : Get patient profile by ID.
   - `GET /patients/{id}/history` : Get structured clinical history list for a patient.
   - `GET /patients/{id}/sessions` : Get all clinical sessions for a patient.

2. **`routers/clinical.py`**:
   - `POST /sessions` : Start a new consultation session.
   - `POST /sessions/{id}/turns` : Add a chat Q&A turn.
   - `POST /sessions/{id}/history` : Save 13 structured history fields.
   - `POST /sessions/{id}/ayush` : Save AYUSH history fields.
   - `POST /sessions/{id}/red-flags` : Trigger red flag emergency alert.
   - `POST /documents` : Save uploaded document info.

---

### E. `backend/main.py` (Main Entrypoint)

```python
from fastapi import FastAPI
from database.connection import Base, engine
import models  # imports all models

# Auto-creates all tables in SQL Server if they don't exist yet!
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="MediKiosk API",
    description="SIH26047 — Patient Case-Taking Software (Ministry of Ayush)",
    version="1.0.0"
)

@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "ok", "project": "MediKiosk", "team": "SIH26047"}

# Include routers
from routers.patients import router as patients_router
from routers.clinical import router as clinical_router

app.include_router(patients_router)
app.include_router(clinical_router)
```

---

## 🚀 5. How to Run and Test Your Code (Step-by-Step)

Follow these steps to run and test everything on your own laptop:

### Step 1: Open PowerShell / Terminal
Navigate to the `backend` folder:
```powershell
cd "d:\B.Tech CSE\SIH\patient-case-taking\backend"
```

### Step 2: Start the FastAPI Server
Run Uvicorn server:
```powershell
uvicorn main:app --reload
```
You will see output like:
```text
INFO: Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO: Application startup complete.
```

---

### Step 3: Open Interactive Swagger UI in Browser
Open your web browser (Chrome / Edge) and go to:
👉 **`http://127.0.0.1:8000/docs`**

You will see the complete Interactive API Documentation page with all tags (**Health**, **Patients**, **Clinical**)!

---

### Step 4: Interactive Endpoint Testing Guide

Click on any endpoint, click **"Try it out"**, fill the sample JSON payload, and click **"Execute"**:

#### 1. Test Health Check: `GET /health`
- Response: `{"status": "ok", "project": "MediKiosk", "team": "SIH26047"}` (Status 200 OK)

#### 2. Test Register Patient: `POST /patients/`
- Request Payload:
```json
{
  "full_name": "Ravi Patel",
  "preferred_language": "Hindi",
  "accessibility_mode": "standard",
  "age": 45,
  "gender": "Male",
  "phone_number": "9876543210",
  "login_id": "ravi45"
}
```
- Click **Execute** → Returns created patient object with `patient_id: 1`.

#### 3. Test Get Patient: `GET /patients/1`
- Set `patient_id = 1` → Click **Execute** → Returns Ravi Patel's details.

#### 4. Test Create Session: `POST /sessions`
- Request Payload:
```json
{
  "patient_id": 1,
  "history_mode": "allopathic"
}
```
- Click **Execute** → Returns created session object with `session_id: 1`.

#### 5. Test Add Interview Turn: `POST /sessions/1/turns`
- Request Payload:
```json
{
  "turn_number": 1,
  "input_mode": "touch",
  "ai_question": "What brings you to the hospital today?",
  "patient_response_text": "I have chest pain since yesterday.",
  "response_language": "English"
}
```
- Click **Execute** → Returns created turn object.

#### 6. Test Save Structured History: `POST /sessions/1/history`
- Request Payload:
```json
{
  "chief_complaint": "Chest pain for 1 day",
  "hpi_onset": "Yesterday morning",
  "hpi_character": "Sharp squeezing pain",
  "hpi_severity": "7/10",
  "hpi_associated_symptoms": "Difficulty breathing",
  "past_medical_surgical": "Hypertension (2 years)",
  "drug_allergy_history": "No known drug allergies",
  "family_history": "Father had diabetes",
  "personal_history": "Non-smoker, vegetarian diet"
}
```
- Click **Execute** → Returns saved structured history object.

#### 7. Test Add Red Flag Alert: `POST /sessions/1/red-flags`
- Request Payload:
```json
{
  "flag_description": "Chest pain + difficulty breathing",
  "severity": "HIGH",
  "triage_notified": true
}
```
- Click **Execute** → Returns created alert object.

#### 8. Test Upload Medical Document: `POST /documents`
- Request Payload:
```json
{
  "patient_id": 1,
  "session_id": 1,
  "document_type": "prescription",
  "file_path": "/uploads/prescriptions/ravi_doc1.pdf",
  "ocr_status": "pending"
}
```
- Click **Execute** → Returns created document object.

#### 9. Test Fetch Patient History: `GET /patients/1/history`
- Click **Execute** → Returns all structured histories recorded for patient 1!

---

🎉 **Congratulations! You have verified Day 1 & Day 2 backend implementation 100%!**
