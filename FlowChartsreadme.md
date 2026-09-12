# 🏥 Smart Patient Intake & AI Case-Taking System
## 📊 End-to-End Architecture & Workflow Flowcharts (`FlowChartsreadme.md`)

> **Note for Faculty / Project Evaluators**: This document provides a complete, visual, and architectural walkthrough of the **Dual-Interface Smart Patient Kiosk & AI Clinical Decision Support System**. Use the Mermaid flowcharts and presentation guide below to explain the system end-to-end.

---

## 🎯 1. System Architecture Overview (High-Level Flow)

The system consists of three main tiers:
1. **Patient Kiosk Application** (`frontend/patient` on Port `5173`) – Multilingual, accessible, AI-powered intake kiosk for public health centers / OPDs.
2. **AI Engine & FastAPI Backend** (`backend` on Port `8000`) – Central orchestration server handling OCR scanning, Voice/Text STT, LLM clinical symptom extraction, and SQLite database persistent storage (`medikiosk.db`).
3. **Doctor Portal & Decision Dashboard** (`frontend/doctor` on Port `5174`) – Clinical workstation allowing doctors to view OPD queue, inspect AI-generated case summaries, review AYUSH/Allopathic triage, and issue signed consultations.

```mermaid
flowchart TB
    subgraph TIER1["🖥️ Tier 1: Frontends & User Interfaces"]
        direction LR
        Kiosk["📱 Patient Kiosk UI\n(Port 5173 / React + Vite)"]
        DoctorUI["🩺 Doctor Dashboard UI\n(Port 5174 / React + Vite)"]
    end

    subgraph TIER2["⚡ Tier 2: Unified Gateway & Backend API"]
        direction TB
        Gateway["🌐 Node Gateway Router\n(Port 3000 / run_frontends.js)"]
        FastAPI["🚀 FastAPI Server\n(Port 8000 / main.py)"]
        
        subgraph ROUTERS["API Endpoint Routers"]
            PRouter["/api/v1/patients\n(Patients Router)"]
            CRouter["/api/v1/clinical\n(Clinical & AI Router)"]
            DRouter["/api/v1/doctors\n(Doctors & Auth Router)"]
        end
    end

    subgraph TIER3["🤖 Tier 3: AI Engines & Database Layer"]
        direction TB
        OCR["📄 Document Scanner & OCR Engine\n(Tesseract / LayoutParser)"]
        AI_Interview["🎙️ Voice/Text AI Conversational Intake\n(Whisper STT + LLM Extractor)"]
        Ayush_Engine["🌿 AYUSH Agni & Tridosha Engine\n(Ayurvedic Dashavidha Triage)"]
        DB[(🗄️ SQLite Database\nmedikiosk.db)]
    end

    %% Flow Connections
    Kiosk --> Gateway
    DoctorUI --> Gateway
    Gateway --> FastAPI
    
    FastAPI --> PRouter
    FastAPI --> CRouter
    FastAPI --> DRouter
    
    PRouter --> DB
    DRouter --> DB
    CRouter --> OCR
    CRouter --> AI_Interview
    CRouter --> Ayush_Engine
    CRouter --> DB
```

---

## 🔄 2. Patient Kiosk Complete Step-by-Step Flowchart

This flowchart details how a patient registers, selects their medical pathway (**Allopathic** vs **AYUSH**), scans physical medical records via OCR, completes an AI-guided voice interview, and receives a physical/digital OPD Token.

```mermaid
flowchart TD
    Start([🚀 Patient Approaches Kiosk]) --> Login[Step 1: Patient Identification / Quick Intake\nName, Age, Gender, Mobile/ABHA ID, Protocol Choice]
    
    Login --> BranchChoice{Selected Protocol?}
    BranchChoice -- "Modern Western Medicine" --> SetAllopathic[Protocol = Allopathic]
    BranchChoice -- "Traditional Medicine" --> SetAyush[Protocol = AYUSH / Ayurvedic]

    SetAllopathic --> LangSelect[Step 2: Language Selection\nEnglish, Hindi, Gujarati, Tamil, Marathi]
    SetAyush --> LangSelect

    LangSelect --> AccessConsent[Step 3: Accessibility Settings & Consent\nText Size, Voice Assist, ABHA Data Consent]

    AccessConsent --> DocUpload{Has Previous Medical Records / Reports?}
    
    DocUpload -- Yes --> OCRProcess[Step 4: Upload Document & Run OCR\nExtract Rx, Lab Values, Past Diagnosis]
    DocUpload -- No --> AIInterview
    
    OCRProcess --> StoreOCRSummary[Extract Text & Save to Case Context]
    StoreOCRSummary --> AIInterview

    AIInterview[Step 5: Interactive AI Clinical Case-Taking\nVoice & Text Multilingual Interview]

    AIInterview --> CheckMode{Protocol Mode?}
    
    CheckMode -- Allopathic --> AlloExtract[Extract Chief Complaint, Onset, Severity,\nAssociated Symptoms, Past History, Red Flags]
    CheckMode -- AYUSH --> AyushExtract[Extract Agni Status, Dosha Imbalance (Vata/Pitta/Kapha),\nKoshtha, Nadi, Ahara-Vihara Factors]

    AlloExtract --> GenSummary[Generate Structured Medical Case Summary]
    AyushExtract --> GenSummary

    GenSummary --> PrintToken[Step 6: Issue Token & Display Summary\nAssigned Token ID e.g. A-102, Department, QR Code]

    PrintToken --> EndKiosk([🏁 Patient Proceeds to OPD Waiting Area])
```

---

## 🩺 3. Doctor Dashboard & Clinical Decision Flowchart

This flowchart illustrates how doctors consume the AI case summaries, analyze red flags, view digitized OCR records, and complete the consultation.

```mermaid
flowchart TD
    DocStart([🩺 Doctor Logs into Dashboard]) --> Queue[View Real-Time OPD Patient Queue\nDisplays Waiting Tokens, Status, Red Flag Badges]

    Queue --> SelectPatient[Select Patient from Queue e.g. Token #A-102]

    SelectPatient --> LoadDetail[Fetch Patient Case Payload via GET /api/v1/clinical/patient-summary]

    LoadDetail --> ViewSummary[View AI Structured Summary Card]

    ViewSummary --> CheckRedFlags{Red Flags Detected?\ne.g. Severe Chest Pain, High Fever}
    
    CheckRedFlags -- Yes --> HighPriority[🚨 High Priority Red Flag Badge Triggered\nImmediate Emergency Callout]
    CheckRedFlags -- No --> StandardReview[Standard Clinical Evaluation]

    HighPriority --> ReviewTabs
    StandardReview --> ReviewTabs

    subgraph ReviewTabs["Clinical Case Tabs"]
        Tab1[📄 OCR & Uploaded Reports Tab\nDigitized Prescriptions & Lab Results]
        Tab2[💬 AI Interview Transcript Tab\nFull Patient Audio & Text Responses]
        Tab3[🌿 AYUSH / Allopathic Triage Card\nAgni, Dosha Imbalance, Systemic Review]
    end

    ReviewTabs --> DoctorExam[Doctor Conducts Physical Exam & Verification]

    DoctorExam --> WritePrescription[Input Final Diagnosis, Medicines & Advice]

    WritePrescription --> SignConsultation[Click 'Sign & Complete Consultation']

    SignConsultation --> UpdateBackend[POST /api/v1/clinical/complete-consultation\nStatus Updated to 'Completed']

    UpdateBackend --> NextQueue([➡️ Return to Patient Queue for Next Token])
```

---

## 🤖 4. Backend & AI Subsystem Technical Data Pipeline

This diagram shows how data moves between the Frontend, FastAPI endpoints, AI NLP models, Tesseract OCR, and SQLite Database.

```mermaid
flowchart LR
    subgraph FRONTEND["Frontend Clients"]
        KioskClient["Patient Kiosk (React)"]
        DocClient["Doctor UI (React)"]
    end

    subgraph BACKEND_GATEWAY["FastAPI Backend Services"]
        API["FastAPI App (main.py)"]
        
        subgraph ENDPOINTS["Router Modules"]
            P_EP["/patients/register"]
            C_EP["/clinical/interview"]
            O_EP["/clinical/ocr-upload"]
            D_EP["/doctors/queue"]
        end
    end

    subgraph AI_PIPELINE["AI & ML Services (ai/ & ocr/)"]
        STT["Whisper Speech-to-Text\nAudio → Transcript"]
        NLP["Clinical NLP Extractor\nTranscript → Structured JSON"]
        OCR_Engine["Tesseract / LayoutParser OCR\nImage → Medical Text"]
        Ayush_Rules["AYUSH Knowledge Rules\nAyurvedic Symptom Mapping"]
    end

    subgraph DB_LAYER["Database"]
        SQLite[(medikiosk.db)]
    end

    %% Connections
    KioskClient -->|POST Register| P_EP
    KioskClient -->|Upload File| O_EP
    KioskClient -->|Post Audio/Text| C_EP
    
    O_EP --> OCR_Engine
    C_EP --> STT
    STT --> NLP
    NLP --> Ayush_Rules
    
    OCR_Engine --> SQLite
    NLP --> SQLite
    P_EP --> SQLite
    
    DocClient -->|GET Queue & Case| D_EP
    D_EP --> SQLite
```

---

## 🌿 5. AYUSH vs. Allopathic Dual Triage Logic Flowchart

```mermaid
flowchart TD
    Intake([Patient Choice at Kiosk]) --> ProtocolCheck{Which Medical Stream?}

    %% ALLOPATHIC BRANCH
    ProtocolCheck -- Allopathic (Modern Medicine) --> Allo1[Evaluate Chief Complaints & Duration]
    Allo1 --> Allo2[Symptom Severity & Systemic Involvement]
    Allo2 --> Allo3[Check Red Flags: Cardiac, Neuro, Respiratory]
    Allo3 --> AlloOutput[Output: ICD-11 Compatible Symptom Matrix + Urgency Score]

    %% AYUSH BRANCH
    ProtocolCheck -- AYUSH (Traditional Indian Systems) --> Ayush1[Agni Examination: Mandagni / Tikshnagni / Vishamagni]
    Ayush1 --> Ayush2[Tridosha Assessment: Vata / Pitta / Kapha Dominance]
    Ayush2 --> Ayush3[Prakriti & Vikriti Analysis]
    Ayush3 --> Ayush4[Koshtha & Ahara-Vihara Habits]
    Ayush4 --> AyushOutput[Output: Dashavidha Pariksha Summary + Ayurvedic Assessment]

    AlloOutput --> MergedSummary[Unified Case Summary Record]
    AyushOutput --> MergedSummary
    
    MergedSummary --> DoctorDisplay[Presented Side-by-Side on Doctor Dashboard]
```

---

## 🎓 6. Faculty Presentation Cheat Sheet & Key Highlights

When presenting this project to faculty or judges, use this quick reference guide to highlight the core innovations:

### 🌟 1. The Core Problem We Solve
- **Problem**: Overcrowded Hospital OPDs in India lead to long wait times, incomplete manual case history taking, and burden on doctors.
- **Our Solution**: An automated, intelligent **Patient Kiosk** that gathers patient history, scans past reports using OCR, performs AI voice intake in regional languages, and generates a structured summary for the doctor *before* the patient steps into the consultation room.

### 🚀 2. Key Architectural Innovations
1. **Dual Healthcare Support (Allopathic + AYUSH)**: First-of-its-kind intake kiosk supporting both modern Western medicine history taking and traditional Ayurvedic **Dashavidha / Agni / Tridosha** triage.
2. **Multilingual & Accessible**: Full support for voice-assisted intake across regional languages with adaptive text size and screen reader compatibility.
3. **Automated Document Digitization (OCR)**: Scans hand-written or printed doctor prescriptions/lab reports and feeds relevant medical history directly to the AI model.
4. **Emergency Red Flag Detection**: AI automatically flags critical conditions (e.g. chest pain, dyspnea) with visual alert badges on the doctor's queue screen.
5. **Seamless Offline / Fallback Resiliency**: Features built-in mock fallback handling ensuring the kiosk remains 100% operational even during internet or backend server dropouts.

### 🛠️ 3. Technology Stack Summary
- **Frontend**: React.js, Vite, Tailwind CSS, Lucide Icons.
- **Backend**: Python 3.10+, FastAPI, Uvicorn, SQLite (Pydantic & SQLAlchemy schemas).
- **AI & ML**: Tesseract OCR / PyTesseract, OpenAI Whisper (Speech-to-Text), Transformers / Rule-Based Clinical NLP Extractor.

---

*Document generated for project evaluation and presentation.*
