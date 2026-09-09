/* =====================================================================
   SIH26047 — "MediKiosk" AI Clinical History Software Platform
   Database Schema (derived from the OFFICIAL SIH Problem Statement PDF)
   Organization: All India Institute of Ayurveda, Ministry of Ayush
   Owner: Member 3 (Backend / Database)
   Dialect: T-SQL (SQL Server). Portable to Postgres with minor tweaks
   (IDENTITY -> SERIAL/GENERATED, NVARCHAR -> VARCHAR, GETDATE() -> now()).
   ===================================================================== */

-- =====================================================================
-- 1. IDENTITY & ACCESS
--    Source: 3.2 Patient dashboard, 3.4 Step 1 (Identify), Doctor role
--    implied by "physician reviews/edits summary" throughout Module C.
-- =====================================================================

CREATE TABLE patients (
    patient_id          INT IDENTITY(1,1) PRIMARY KEY,
    abha_id             VARCHAR(20)   NULL UNIQUE,           -- Ayushman Bharat Health Account ID
    aadhaar_ref         VARCHAR(20)   NULL,                  -- store hashed/tokenized reference, never raw Aadhaar
    full_name           NVARCHAR(150) NOT NULL,
    date_of_birth       DATE          NULL,
    age                 INT           NULL,
    gender              VARCHAR(10)   NULL,
    phone_number        VARCHAR(15)   NULL,
    preferred_language  VARCHAR(30)   NOT NULL DEFAULT 'Hindi',   -- multilingual UI (2.3)
    accessibility_mode  VARCHAR(30)   NULL,                       -- audio-guided / large-text-high-contrast / standard (3.2)
    is_first_visit      BIT           NOT NULL DEFAULT 1,
    login_id            VARCHAR(50)   NULL UNIQUE,                -- personal login id (3.2 Patient dashboard)
    password_hash       VARCHAR(255)  NULL,
    registered_at       DATETIME2     NOT NULL DEFAULT GETDATE(),
    is_active           BIT           NOT NULL DEFAULT 1
);

CREATE TABLE doctors (
    doctor_id           INT IDENTITY(1,1) PRIMARY KEY,
    full_name           NVARCHAR(150) NOT NULL,
    department          VARCHAR(100)  NULL,                       -- e.g. General OPD / Ayurveda / AYUSH
    is_ayush_practitioner BIT         NOT NULL DEFAULT 0,
    login_id            VARCHAR(50)   NOT NULL UNIQUE,
    password_hash       VARCHAR(255)  NOT NULL,
    created_at          DATETIME2     NOT NULL DEFAULT GETDATE()
);

-- =====================================================================
-- 2. CONSENT & PRIVACY
--    Source: Module D — "Consent-first design: granular, revocable
--    consent with audio explanation"; DPDP Act 2023 / ABDM consent.
-- =====================================================================

CREATE TABLE consents (
    consent_id          INT IDENTITY(1,1) PRIMARY KEY,
    patient_id          INT NOT NULL FOREIGN KEY REFERENCES patients(patient_id),
    consent_type        VARCHAR(50)   NOT NULL,      -- e.g. 'data_capture', 'abdm_sharing', 'voice_recording'
    is_granted          BIT           NOT NULL DEFAULT 0,
    granted_via         VARCHAR(20)   NULL,          -- 'audio' / 'touch'  (audio explanation for low-literacy patients)
    granted_at          DATETIME2     NULL,
    revoked_at          DATETIME2     NULL,           -- consent is revocable
    dpdp_reference       VARCHAR(100) NULL            -- internal audit reference to DPDP Act 2023 compliance record
);

-- =====================================================================
-- 3. CLINICAL HISTORY-TAKING SESSION
--    Source: Module A (Conversational Multimodal History Engine) and
--    3.4 End-to-End Patient Journey, Step 2 (Converse).
-- =====================================================================

CREATE TABLE clinical_sessions (
    session_id          INT IDENTITY(1,1) PRIMARY KEY,
    patient_id          INT NOT NULL FOREIGN KEY REFERENCES patients(patient_id),
    history_mode        VARCHAR(20)   NOT NULL DEFAULT 'allopathic',  -- 'allopathic' or 'ayush' (3.3 Module A: AYUSH history mode)
    started_at          DATETIME2     NOT NULL DEFAULT GETDATE(),
    completed_at        DATETIME2     NULL,
    status               VARCHAR(20)  NOT NULL DEFAULT 'in_progress', -- in_progress / completed / abandoned
    session_data_cleared BIT          NOT NULL DEFAULT 0              -- Module D: "temporary session data cleared after submission"
);

-- Turn-by-turn adaptive interview log (voice or touch), SOCRATES-style follow-ups
CREATE TABLE interview_turns (
    turn_id             INT IDENTITY(1,1) PRIMARY KEY,
    session_id          INT NOT NULL FOREIGN KEY REFERENCES clinical_sessions(session_id),
    turn_number         INT NOT NULL,
    input_mode          VARCHAR(10)   NOT NULL,       -- 'voice' or 'touch' (dual-mode input)
    ai_question         NVARCHAR(MAX) NULL,
    patient_response_text NVARCHAR(MAX) NULL,         -- transcribed if voice
    response_language   VARCHAR(30)   NULL,
    asked_at            DATETIME2     NOT NULL DEFAULT GETDATE()
);

-- =====================================================================
-- 4. STRUCTURED HISTORY (ALLOPATHIC) — Standard clinical format
--    Source: Module C — "Chief complaint -> HPI -> Past medical/surgical
--    -> Drug & allergy -> Family -> Personal -> ROS -> Prior investigations"
-- =====================================================================

CREATE TABLE structured_history (
    history_id          INT IDENTITY(1,1) PRIMARY KEY,
    session_id          INT NOT NULL FOREIGN KEY REFERENCES clinical_sessions(session_id),
    chief_complaint      NVARCHAR(500) NULL,
    hpi_onset            NVARCHAR(200) NULL,   -- SOCRATES: Onset
    hpi_character         NVARCHAR(200) NULL,   -- Character
    hpi_radiation         NVARCHAR(200) NULL,   -- Radiation
    hpi_associated_symptoms NVARCHAR(500) NULL, -- Associated symptoms
    hpi_timing            NVARCHAR(200) NULL,   -- Timing
    hpi_exacerbating_relieving NVARCHAR(500) NULL, -- Exacerbating/Relieving
    hpi_severity          NVARCHAR(100) NULL,   -- Severity
    past_medical_surgical NVARCHAR(MAX) NULL,
    drug_allergy_history  NVARCHAR(MAX) NULL,
    family_history        NVARCHAR(MAX) NULL,
    personal_history       NVARCHAR(MAX) NULL,  -- diet, habits, occupation etc.
    review_of_systems      NVARCHAR(MAX) NULL,
    generated_at           DATETIME2 NOT NULL DEFAULT GETDATE()
);

-- =====================================================================
-- 5. AYUSH / DASHAVIDHA PARIKSHA HISTORY
--    Source: 1.1 Background (AYUSH institutions) + Module A "AYUSH
--    history mode: Prakriti, Vikriti, Sara, Samhanana, Pramana, Satmya,
--    Sattva, Ahara Shakti, Vyayama Shakti, Vaya + Ahara-Vihara assessment"
-- =====================================================================

CREATE TABLE ayush_history (
    ayush_history_id     INT IDENTITY(1,1) PRIMARY KEY,
    session_id           INT NOT NULL FOREIGN KEY REFERENCES clinical_sessions(session_id),
    prakriti              NVARCHAR(300) NULL,   -- constitution
    vikriti                NVARCHAR(300) NULL,  -- current imbalance
    sara                   NVARCHAR(300) NULL,
    samhanana               NVARCHAR(300) NULL, -- body compactness
    pramana                  NVARCHAR(300) NULL, -- body measurements/proportions
    satmya                    NVARCHAR(300) NULL, -- suitability/adaptability
    sattva                     NVARCHAR(300) NULL, -- psychological strength
    ahara_shakti                 NVARCHAR(300) NULL, -- digestive capacity (also Agni)
    vyayama_shakti                 NVARCHAR(300) NULL, -- exercise capacity
    vaya                             NVARCHAR(100) NULL, -- age-related constitution stage
    ahara_vihara_notes                NVARCHAR(MAX) NULL, -- diet & lifestyle assessment
    nidana                              NVARCHAR(MAX) NULL, -- causative factors
    samprapti                            NVARCHAR(MAX) NULL, -- pathogenesis
    generated_at                          DATETIME2 NOT NULL DEFAULT GETDATE()
);

-- =====================================================================
-- 6. RED-FLAG DETECTION
--    Source: Module A — "AI flags emergency symptoms (e.g. acute chest
--    pain with dyspnoea, stroke symptoms) and triggers immediate
--    priority alert to triage staff rather than routine queueing."
-- =====================================================================

CREATE TABLE red_flag_alerts (
    alert_id             INT IDENTITY(1,1) PRIMARY KEY,
    session_id           INT NOT NULL FOREIGN KEY REFERENCES clinical_sessions(session_id),
    flag_description      NVARCHAR(500) NOT NULL,     -- e.g. "Chest pain + breathing difficulty"
    severity               VARCHAR(20) NOT NULL DEFAULT 'HIGH',
    triggered_at             DATETIME2 NOT NULL DEFAULT GETDATE(),
    triage_notified           BIT NOT NULL DEFAULT 0,
    acknowledged_by_doctor_id INT NULL FOREIGN KEY REFERENCES doctors(doctor_id),
    acknowledged_at            DATETIME2 NULL
);

-- =====================================================================
-- 7. MEDICAL DOCUMENT DIGITIZATION
--    Source: Module B — prior prescriptions, lab reports, discharge
--    summaries; OCR (printed + handwritten, multilingual); chronological
--    organization; abnormal-value highlighting.
-- =====================================================================

CREATE TABLE medical_documents (
    document_id          INT IDENTITY(1,1) PRIMARY KEY,
    patient_id           INT NOT NULL FOREIGN KEY REFERENCES patients(patient_id),
    session_id           INT NULL FOREIGN KEY REFERENCES clinical_sessions(session_id),
    document_type         VARCHAR(30) NOT NULL,   -- 'prescription' / 'lab_report' / 'discharge_summary'
    file_path              VARCHAR(500) NOT NULL, -- storage location of the scanned image/PDF
    document_date           DATE NULL,             -- date on the physical document (for chronological timeline)
    uploaded_at               DATETIME2 NOT NULL DEFAULT GETDATE(),
    ocr_status                 VARCHAR(20) NOT NULL DEFAULT 'pending',  -- pending / processed / failed
    ocr_raw_text                NVARCHAR(MAX) NULL,
    ocr_language                 VARCHAR(30) NULL
);

-- Structured entities extracted from a prescription/report
-- (diagnoses, procedures/surgeries — one row per extracted diagnosis/procedure)
CREATE TABLE document_extracted_conditions (
    condition_id          INT IDENTITY(1,1) PRIMARY KEY,
    document_id           INT NOT NULL FOREIGN KEY REFERENCES medical_documents(document_id),
    entity_type            VARCHAR(20) NOT NULL,   -- 'diagnosis' / 'procedure_or_surgery'
    description              NVARCHAR(300) NOT NULL,
    entity_date                DATE NULL
);

-- Medications extracted from a document
CREATE TABLE document_extracted_medications (
    medication_id          INT IDENTITY(1,1) PRIMARY KEY,
    document_id             INT NOT NULL FOREIGN KEY REFERENCES medical_documents(document_id),
    medicine_name             NVARCHAR(200) NOT NULL,
    dosage                      VARCHAR(100) NULL,
    frequency                    VARCHAR(100) NULL,
    prescribed_date                DATE NULL,
    duration                        VARCHAR(50) NULL
);

-- Lab/investigation values extracted from a document
CREATE TABLE document_extracted_lab_values (
    lab_value_id            INT IDENTITY(1,1) PRIMARY KEY,
    document_id              INT NOT NULL FOREIGN KEY REFERENCES medical_documents(document_id),
    test_name                  NVARCHAR(150) NOT NULL,
    result_value                 VARCHAR(50) NULL,
    unit                            VARCHAR(30) NULL,
    reference_range                  VARCHAR(50) NULL,
    is_abnormal                        BIT NOT NULL DEFAULT 0,   -- abnormal-value highlighting (Module B)
    test_date                            DATE NULL
);

-- =====================================================================
-- 8. STRUCTURED HISTORY SUMMARY (physician-facing, editable/verifiable)
--    Source: Module C — "AI summarization engine... physician-ready
--    clinical summary... editable & verifiable... bilingual output"
-- =====================================================================

CREATE TABLE clinical_summaries (
    summary_id             INT IDENTITY(1,1) PRIMARY KEY,
    session_id              INT NOT NULL FOREIGN KEY REFERENCES clinical_sessions(session_id),
    patient_id                INT NOT NULL FOREIGN KEY REFERENCES patients(patient_id),
    summary_text_english        NVARCHAR(MAX) NULL,
    summary_text_local_language   NVARCHAR(MAX) NULL,   -- Hindi / regional (bilingual output)
    status                          VARCHAR(20) NOT NULL DEFAULT 'draft', -- draft / accepted / amended / rejected
    reviewed_by_doctor_id             INT NULL FOREIGN KEY REFERENCES doctors(doctor_id),
    reviewed_at                          DATETIME2 NULL,
    generated_at                            DATETIME2 NOT NULL DEFAULT GETDATE()
);

-- =====================================================================
-- 9. ABDM / ABHA / HIS INTEGRATION (Module D)
--    Source: "structured history is pushed to hospital HIS/EMR and
--    linked to the ABHA Personal Health Record via FHIR APIs."
-- =====================================================================

CREATE TABLE abdm_sync_log (
    sync_id                 INT IDENTITY(1,1) PRIMARY KEY,
    summary_id               INT NOT NULL FOREIGN KEY REFERENCES clinical_summaries(summary_id),
    target_system              VARCHAR(20) NOT NULL,     -- 'HIS' / 'ABDM_FHIR'
    fhir_resource_id              VARCHAR(100) NULL,
    sync_status                     VARCHAR(20) NOT NULL DEFAULT 'pending',  -- pending / success / failed
    synced_at                         DATETIME2 NULL,
    error_message                       NVARCHAR(500) NULL
);

-- =====================================================================
-- 10. AUDIT / SECURITY LOG
--     Source: Module D — "Secure processing... Session termination:
--     temporary session data is cleared immediately after submission"
-- =====================================================================

CREATE TABLE audit_log (
    log_id                   INT IDENTITY(1,1) PRIMARY KEY,
    patient_id                 INT NULL FOREIGN KEY REFERENCES patients(patient_id),
    doctor_id                    INT NULL FOREIGN KEY REFERENCES doctors(doctor_id),
    action                          VARCHAR(100) NOT NULL,  -- e.g. 'session_data_cleared', 'summary_edited', 'consent_revoked'
    action_details                    NVARCHAR(500) NULL,
    occurred_at                          DATETIME2 NOT NULL DEFAULT GETDATE()
);
