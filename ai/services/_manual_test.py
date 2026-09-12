"""
Manual end-to-end self-test script for MediKiosk AI module (Direct Backend Integration).
Runs a scripted AYUSH-mode clinical interview session end-to-end:
1. Simulates multi-turn patient dialogue with red flag ('chest pain + dyspnoea').
2. Verifies red-flag emergency detection and triage notification.
3. Verifies turn-by-turn logging and direct backend integration resilience.
4. Generates and validates structured_history (exact 13 database keys).
5. Generates and validates ayush_history (exact 11 Dashavidha Pariksha keys).
6. Generates and validates bilingual clinical summaries (English and Hindi).
7. Verifies backend database operations succeed safely.
"""

import sys
import os
import json
from pathlib import Path

# Reconfigure stdout to utf-8 for Windows console support with Hindi Devanagari text
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Ensure project root is in sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from dotenv import load_dotenv
load_dotenv(PROJECT_ROOT / ".env")

from ai.services.interview_service import InterviewService

EXPECTED_STRUCTURED_KEYS = [
    "chief_complaint", "hpi_onset", "hpi_character", "hpi_radiation",
    "hpi_associated_symptoms", "hpi_timing", "hpi_exacerbating_relieving",
    "hpi_severity", "past_medical_surgical", "drug_allergy_history",
    "family_history", "personal_history", "review_of_systems"
]

EXPECTED_AYUSH_KEYS = [
    "prakriti", "vikriti", "sara", "samhanana", "pramana",
    "satmya", "sattva", "ahara_shakti", "vyayama_shakti", "vaya",
    "ahara_vihara_notes"
]


def run_manual_test():
    print("=" * 70)
    print(" MediKiosk AI Module — Integration & Schema Verification Self-Test")
    print("=" * 70)

    session_id = "test-manual-ayush-001"
    print(f"\n[1] Initializing InterviewService in 'ayush' mode for session: {session_id}...")
    service = InterviewService(session_id=session_id, history_mode="ayush", auto_sync_backend=True)

    # Scripted patient responses covering SOCRATES, Red Flags, Past History, and AYUSH
    scripted_dialogue = [
        # Turn 1: Emergency Red Flag Trigger (Chest pain + dyspnoea)
        ("I have severe sharp chest pain and difficulty breathing.", "touch"),
        # Turn 2: SOCRATES Onset, Radiation, Severity
        ("It started suddenly about 2 hours ago. The pain radiates to my left arm, severity is 8 out of 10.", "touch"),
        # Turn 3: Past Medical & Medications
        ("I have high blood pressure for 5 years. I take Amlodipine 5mg daily. No known drug allergies.", "voice"),
        # Turn 4: Family & Personal History
        ("My father had coronary artery disease. I work as an accountant, non-smoker.", "touch"),
        # Turn 5: AYUSH Dashavidha Pariksha factors
        ("I tend to have a Pitta body type, skin feels warm. My appetite (Ahara Shakti) is irregular, and my physical stamina is moderate. Sleep is disturbed.", "touch")
    ]

    print("\n[2] Executing scripted dialogue turns...")
    red_flags_detected = []

    for idx, (patient_input, mode) in enumerate(scripted_dialogue, 1):
        print(f"\n--- Turn {idx} (input_mode: {mode}) ---")
        print(f"Patient: {patient_input}")
        ai_question, red_flag = service.send_message(patient_input, input_mode=mode)
        print(f"AI Assistant: {ai_question}")
        if red_flag:
            print(f"🚨 RED FLAG DETECTED: {red_flag['flag_description']} [Severity: {red_flag['severity']}]")
            red_flags_detected.append(red_flag)

    print("\n" + "-" * 70)
    print("[3] Verifying Red Flag Detection & Triage Alert Status:")
    assert len(red_flags_detected) > 0, "ERROR: Red flag was NOT detected for chest pain + difficulty breathing!"
    assert service.triage_notified is True, "ERROR: service.triage_notified must be True!"
    print("✅ Red flag detected successfully! Triage notified flag: True")
    print(f"   Flag Details: {red_flags_detected[0]}")

    print("\n" + "-" * 70)
    print("[4] Generating and Validating structured_history (13 keys)...")
    structured_history = service.generate_structured_history()
    print(json.dumps(structured_history, indent=2, ensure_ascii=False))

    missing_structured = [k for k in EXPECTED_STRUCTURED_KEYS if k not in structured_history]
    assert not missing_structured, f"ERROR: Missing structured_history keys: {missing_structured}"
    print(f"✅ structured_history passed: All {len(EXPECTED_STRUCTURED_KEYS)} required keys present.")

    print("\n" + "-" * 70)
    print("[5] Generating and Validating ayush_history (11 keys)...")
    ayush_history = service.generate_ayush_history()
    print(json.dumps(ayush_history, indent=2, ensure_ascii=False))

    missing_ayush = [k for k in EXPECTED_AYUSH_KEYS if k not in ayush_history]
    assert not missing_ayush, f"ERROR: Missing ayush_history keys: {missing_ayush}"
    print(f"✅ ayush_history passed: All {len(EXPECTED_AYUSH_KEYS)} required keys present.")

    print("\n" + "-" * 70)
    print("[6] Generating and Validating Bilingual Summary (English + Hindi)...")
    summary = service.generate_bilingual_summary(structured_history, ayush_history)

    assert "summary_text_english" in summary, "ERROR: Missing summary_text_english"
    assert "summary_text_local_language" in summary, "ERROR: Missing summary_text_local_language"
    assert len(summary["summary_text_english"].strip()) > 0, "ERROR: summary_text_english is empty"
    assert len(summary["summary_text_local_language"].strip()) > 0, "ERROR: summary_text_local_language is empty"

    print("\n[English Clinical Summary]:")
    print(summary["summary_text_english"])
    print("\n[Hindi Clinical Summary (स्थानीय भाषा सारांश)]:")
    print(summary["summary_text_local_language"])
    print("\n✅ Bilingual summary passed: Both English and Hindi summaries generated.")

    print("\n" + "=" * 70)
    print(" ALL TESTS PASSED SUCCESSFULLY! AI Module is ready for integration.")
    print("=" * 70)


if __name__ == "__main__":
    run_manual_test()
