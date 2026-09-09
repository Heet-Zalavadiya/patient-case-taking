# AI Module — MediKiosk

Owns the conversational clinical interview: adaptive SOCRATES questioning,
red-flag detection, and structured history extraction.

## Setup
1. `pip install google-genai`
2. Add to your local `.env` (never commit this file):


## What this module produces

**structured_history** (sent via `POST /sessions/{id}/history`):
chief_complaint, hpi_onset, hpi_character, hpi_radiation, hpi_associated_symptoms,
hpi_timing, hpi_exacerbating_relieving, hpi_severity, past_medical_surgical,
drug_allergy_history, family_history, personal_history, review_of_systems

**red_flag_alerts** (sent via `POST /sessions/{id}/red-flags`):
flag_description, severity ('HIGH')

**interview_turns** (sent via `POST /sessions/{id}/turns`):
ai_question, patient_response_text, input_mode ('voice' or 'touch')

## Status
- [x] Day 1: Basic text interview + SOCRATES logic + red-flag detection + structured JSON output
- [ ] Day 2: Wire into POST /sessions/{id}/history, /turns, /red-flags
- [ ] Day 2/3: Voice-to-text (input_mode='voice')
- [ ] Day 3: AYUSH mode (ayush_history table)
- [ ] Day 3: Bilingual summary generation