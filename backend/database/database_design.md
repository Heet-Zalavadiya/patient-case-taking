# SIH26047 — Database Design (MediKiosk)
**Source of truth:** Official SIH Problem Statement PDF only (Problem Statement 4 — "Patient Case‑Taking Software", All India Institute of Ayurveda / Ministry of Ayush). The Git-workflow PDF was intentionally **not** used to shape these tables — it has no clinical content, only team process.

## Why each table exists (mapped to the problem statement)

| Table | Problem statement source |
|---|---|
| `patients` | 3.2 "Patient dashboard: personal login id and password"; 3.4 Step 1 "enters/scans ABHA ID or Aadhaar... selects language" |
| `doctors` | Implied throughout Module C / 3.4 Step 5 — physician reviews, edits, confirms |
| `consents` | Module D — "consent-first design: granular, revocable consent with audio explanation"; DPDP Act 2023 |
| `clinical_sessions` | 3.4 Step 2 "Converse"; Module D "session termination" |
| `interview_turns` | Module A — adaptive voice+touch interview, dual-mode input |
| `structured_history` | Module C — standard clinical format (Chief complaint → HPI → Past medical/surgical → Drug & allergy → Family → Personal → ROS) |
| `ayush_history` | 1.1 Background + Module A "AYUSH history mode" (Dashavidha Pariksha: Prakriti, Vikriti, Sara, Samhanana, Pramana, Satmya, Sattva, Ahara Shakti, Vyayama Shakti, Vaya, Ahara‑Vihara) |
| `red_flag_alerts` | Module A — "AI flags emergency symptoms... triggers immediate priority alert to triage staff" |
| `medical_documents` | Module B — scan/upload prior prescriptions, lab reports, discharge summaries; OCR |
| `document_extracted_conditions` | Module B — "diagnoses... procedure/surgery history" |
| `document_extracted_medications` | Module B — "prescribed medications with dosages" |
| `document_extracted_lab_values` | Module B — "investigation results with values and reference ranges"; abnormal-value highlighting |
| `clinical_summaries` | Module C — physician-ready summary, editable/verifiable, bilingual output |
| `abdm_sync_log` | Module D — push to HIS/EMR, link to ABHA record via FHIR |
| `audit_log` | Module D — secure processing, session data cleared after submission |

## Entity relationship (text form)

```
patients ──< consents
patients ──< clinical_sessions ──< interview_turns
                              ├──< structured_history (1:1 typical)
                              ├──< ayush_history (1:1, only if history_mode = 'ayush')
                              ├──< red_flag_alerts
                              └──< clinical_summaries ──< abdm_sync_log

patients ──< medical_documents ──< document_extracted_conditions
                                ├──< document_extracted_medications
                                └──< document_extracted_lab_values

doctors ──< clinical_summaries (reviewed_by_doctor_id)
doctors ──< red_flag_alerts (acknowledged_by_doctor_id)
```

## Design notes for the team

- **Allopathic vs AYUSH is a mode, not two separate patients.** `clinical_sessions.history_mode` decides whether `structured_history` or `ayush_history` (or both) gets populated for that session — this directly reflects the problem statement's dual intake for regular OPD vs AYUSH OPD.
- **Documents are decoupled from sessions.** A patient can upload old prescriptions before any interview even starts, so `medical_documents.session_id` is nullable — it only links back once a session exists.
- **Never store raw Aadhaar.** `aadhaar_ref` is meant to hold a hashed/tokenized reference only, per DPDP Act 2023 compliance called out in section 2.3 and Module D.
- **`clinical_summaries.status`** implements Module C's "editable & verifiable... draft to accept, amend, or reject, never an autonomous diagnosis" — the AI never writes a final diagnosis, only a draft summary a doctor must action.
- **`abdm_sync_log`** is kept separate from `clinical_summaries` so retry/failure handling for the external FHIR/HIS push doesn't block the summary itself from being usable in-app.

## Suggested folder placement
```
backend/
└── database/
    ├── medikiosk_schema.sql
    └── database_design.md   (this file)
```
