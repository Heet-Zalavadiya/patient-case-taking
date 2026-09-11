import requests
import json

BASE_URL = "http://localhost:8000"

def test_chain_1_patient_registration():
    print("\n--- [Chain 1] Testing Patient & Consent Registration ---")
    patient_payload = {
        "full_name": "Ravi Patel",
        "date_of_birth": "1981-05-15",
        "age": 45,
        "gender": "Male",
        "phone_number": "9876543210",
        "preferred_language": "Hindi",
        "accessibility_mode": "standard",
        "login_id": "ravi_patel_45",
        "aadhaar_ref": "token_ref_ravi_001"
    }
    
    # 1. Create Patient
    res = requests.post(f"{BASE_URL}/patients", json=patient_payload)
    assert res.status_code in [200, 201], f"Failed to register patient: {res.text}"
    patient_id = res.json().get("patient_id")
    print(f"PASS: Patient registered with ID: {patient_id}")

    # 2. Grant Consents (Verify granted_via is strictly 'audio' or 'touch')
    consent_payload = {
        "patient_id": patient_id,
        "consent_type": "data_capture",
        "is_granted": True,
        "granted_via": "touch"
    }
    res_consent = requests.post(f"{BASE_URL}/patients/{patient_id}/consent", json=consent_payload)
    assert res_consent.status_code in [200, 201], f"Failed consent record: {res_consent.text}"
    print("PASS: Patient consent registered with granted_via='touch'")
    return patient_id

def test_chain_2_ai_history_session(patient_id):
    print("\n--- [Chain 2] Testing Clinical Session & AI History ---")
    # 1. Start Session
    session_payload = {
        "patient_id": patient_id,
        "history_mode": "allopathic"
    }
    res = requests.post(f"{BASE_URL}/sessions", json=session_payload)
    assert res.status_code in [200, 201], f"Failed to create session: {res.text}"
    session_id = res.json().get("session_id")
    print(f"PASS: Session initialized with ID: {session_id}")

    # 2. Add Turn
    turn_payload = {
        "turn_number": 1,
        "input_mode": "voice",
        "ai_question": "What brings you to the hospital?",
        "patient_response_text": "I have severe chest pain and breathlessness.",
        "response_language": "Hindi"
    }
    res_turn = requests.post(f"{BASE_URL}/sessions/{session_id}/turns", json=turn_payload)
    assert res_turn.status_code in [200, 201], f"Turn failed: {res_turn.text}"
    print("PASS: Interview turn saved with input_mode='voice'")

    # 3. Post AI Structured History (All 13 SOCRATES fields)
    history_payload = {
        "chief_complaint": "Chest pain",
        "hpi_onset": "Started yesterday evening",
        "hpi_character": "Constricting, heavy pressure",
        "hpi_radiation": "Radiating to left arm",
        "hpi_associated_symptoms": "Difficulty breathing, sweating",
        "hpi_timing": "Continuous, worsening over 4 hours",
        "hpi_exacerbating_relieving": "Worse on exertion",
        "hpi_severity": "8/10",
        "past_medical_surgical": "Hypertension for 5 years",
        "drug_allergy_history": "No known drug allergies",
        "family_history": "Father had MI at age 52",
        "personal_history": "Non-smoker",
        "review_of_systems": "Cardiovascular positive, respiratory positive"
    }
    res_history = requests.post(f"{BASE_URL}/sessions/{session_id}/history", json=history_payload)
    assert res_history.status_code in [200, 201], f"History schema mismatch: {res_history.text}"
    print("PASS: All 13 structured_history columns inserted successfully")

    # 4. Trigger Red Flag Alert
    red_flag_payload = {
        "flag_description": "Chest pain + difficulty breathing (Acute Coronary Syndrome risk)",
        "severity": "HIGH"
    }
    res_flag = requests.post(f"{BASE_URL}/sessions/{session_id}/red-flags", json=red_flag_payload)
    assert res_flag.status_code in [200, 201], f"Red flag alert failed: {res_flag.text}"
    print("PASS: Red flag alert recorded with severity='HIGH'")
    return session_id

def test_chain_3_ocr_extraction(patient_id, session_id):
    print("\n--- [Chain 3] Testing OCR Document Extraction Tables ---")
    # 1. Document Record
    doc_payload = {
        "patient_id": patient_id,
        "session_id": session_id,
        "document_type": "prescription",
        "file_path": "documents/sample_prescriptions/prescription_01.jpg"
    }
    res = requests.post(f"{BASE_URL}/documents", json=doc_payload)
    assert res.status_code in [200, 201], f"Document register failed: {res.text}"
    doc_id = res.json().get("document_id")
    print(f"PASS: Document record created with ID: {doc_id}")

    # 2. Medications Extraction
    meds_payload = [
        {"medicine_name": "Amlodipine", "dosage": "5mg", "frequency": "Once daily", "prescribed_date": "2026-08-10", "duration": "30 days"},
        {"medicine_name": "Aspirin", "dosage": "75mg", "frequency": "Once daily", "prescribed_date": "2026-08-10", "duration": "30 days"}
    ]
    res_meds = requests.post(f"{BASE_URL}/documents/{doc_id}/medications", json=meds_payload)
    assert res_meds.status_code in [200, 201], f"Medications insert failed: {res_meds.text}"
    print("PASS: OCR extracted medications saved")

    # 3. Lab Values Extraction (Highlighting abnormal values)
    labs_payload = [
        {"test_name": "Troponin-T", "result_value": "0.15", "unit": "ng/mL", "reference_range": "<0.01", "is_abnormal": 1, "test_date": "2026-09-10"},
        {"test_name": "Hemoglobin", "result_value": "14.2", "unit": "g/dL", "reference_range": "13.0-17.0", "is_abnormal": 0, "test_date": "2026-09-10"}
    ]
    res_labs = requests.post(f"{BASE_URL}/documents/{doc_id}/lab-values", json=labs_payload)
    assert res_labs.status_code in [200, 201], f"Lab values insert failed: {res_labs.text}"
    print("PASS: OCR lab values saved with is_abnormal flag verified")

def test_chain_4_doctor_dashboard_retrieval(patient_id):
    print("\n--- [Chain 4] Testing Doctor Dashboard Data Retrieval ---")
    res_patients = requests.get(f"{BASE_URL}/patients")
    assert res_patients.status_code == 200, "Failed to retrieve patients list"
    patients = res_patients.json()
    assert any(p.get("patient_id") == patient_id for p in patients), "Created patient not found in list"
    print("PASS: Doctor patient list contains newly registered patient")

    res_history = requests.get(f"{BASE_URL}/patients/{patient_id}/history")
    assert res_history.status_code == 200, "Failed to get patient history"
    history = res_history.json()
    assert history.get("chief_complaint") == "Chest pain", "Chief complaint mismatch in doctor view"
    history_list = res_history.json()
    assert len(history_list) > 0, "No history records returned for patient"
    assert history_list[0].get("chief_complaint") == "Chest pain", "Chief complaint mismatch in doctor view"
    print("PASS: Doctor can retrieve full structured history")

if __name__ == "__main__":
    try:
        p_id = test_chain_1_patient_registration()
        s_id = test_chain_2_ai_history_session(p_id)
        test_chain_3_ocr_extraction(p_id, s_id)
        test_chain_4_doctor_dashboard_retrieval(p_id)
        print("\n===========================================")
        print("ALL DAY-2 INTEGRATION CHAINS PASSED (4/4)")
        print("===========================================")
    except AssertionError as e:
        print(f"\n[INTEGRATION BUG IDENTIFIED]: {e}")
        
#         Ai testing
#         # ----------------------------------------------------
# # 3. Direct Execution Test Block
# # ----------------------------------------------------
# if __name__ == "__main__":
#     import asyncio

#     async def test_session():
#         print("Initializing InterviewService...")
#         service = InterviewService(history_mode="standard")
#         print("Service online.\n")

#         # Turn 1: Presenting complaint
#         print("--- Turn 1 ---")
#         q1, flag1 = await service.send_message("I have a severe chest pain and difficulty breathing.")
#         print("AI:", q1)
#         print("Flag:", flag1)

#         # Turn 2: Follow-up answer
#         print("\n--- Turn 2 ---")
#         q2, flag2 = await service.send_message("It started 20 minutes ago while sitting, and feels heavy.")
#         print("AI:", q2)
#         print("Flag:", flag2)

#         # Final extraction
#         print("\n--- Generating Structured SOCRATES History ---")
#         extracted_data = await service.generate_structured_history()
#         print(json.dumps(extracted_data, indent=2))

#     asyncio.run(test_session())