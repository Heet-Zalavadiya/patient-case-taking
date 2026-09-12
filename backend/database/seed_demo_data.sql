/* =====================================================================
   SIH26047 — MediKiosk Hackathon Demo Data Seed Script (Day 4)
   Target Scenarios:
   1. Ravi Patel (45 M): Chest pain + dyspnoea, HIGH Red Flag alert,
      OCR prescription meds, abnormal Troponin-T lab value, bilingual summary, ABDM sync success.
   2. Priya Shah (32 F): Fever with chills, structured history, draft summary.
   ===================================================================== */

-- Disable FK constraints during cleanup & re-insert
SET NOCOUNT ON;

-- Clear existing demo data cleanly
DELETE FROM abdm_sync_log;
DELETE FROM audit_log;
DELETE FROM clinical_summaries;
DELETE FROM document_extracted_conditions;
DELETE FROM document_extracted_lab_values;
DELETE FROM document_extracted_medications;
DELETE FROM medical_documents;
DELETE FROM red_flag_alerts;
DELETE FROM ayush_history;
DELETE FROM structured_history;
DELETE FROM interview_turns;
DELETE FROM clinical_sessions;
DELETE FROM consents;
DELETE FROM doctors;
DELETE FROM patients;

-- Reset IDENTITY counters
DBCC CHECKIDENT ('patients', RESEED, 0);
DBCC CHECKIDENT ('doctors', RESEED, 0);
DBCC CHECKIDENT ('consents', RESEED, 0);
DBCC CHECKIDENT ('clinical_sessions', RESEED, 0);
DBCC CHECKIDENT ('interview_turns', RESEED, 0);
DBCC CHECKIDENT ('structured_history', RESEED, 0);
DBCC CHECKIDENT ('ayush_history', RESEED, 0);
DBCC CHECKIDENT ('red_flag_alerts', RESEED, 0);
DBCC CHECKIDENT ('medical_documents', RESEED, 0);
DBCC CHECKIDENT ('document_extracted_medications', RESEED, 0);
DBCC CHECKIDENT ('document_extracted_lab_values', RESEED, 0);
DBCC CHECKIDENT ('document_extracted_conditions', RESEED, 0);
DBCC CHECKIDENT ('clinical_summaries', RESEED, 0);
DBCC CHECKIDENT ('abdm_sync_log', RESEED, 0);
DBCC CHECKIDENT ('audit_log', RESEED, 0);

-- 1. Insert Demo Patients
INSERT INTO patients (full_name, age, gender, preferred_language, accessibility_mode, abha_id, aadhaar_ref, login_id, password_hash, is_first_visit)
VALUES 
(N'Ravi Patel', 45, 'Male', 'Hindi', 'standard', '91-4567-8910-1112', 'AADHAAR-REF-9988', 'ravipatel', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', 1),
(N'Priya Shah', 32, 'Female', 'Hindi', 'standard', '91-1234-5678-9012', 'AADHAAR-REF-1122', 'priyashah', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', 1);

-- 2. Insert Demo Doctors
INSERT INTO doctors (full_name, department, is_ayush_practitioner, login_id, password_hash)
VALUES 
(N'Dr. Ankit Sharma', 'General OPD', 0, 'drankit', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8'),
(N'Dr. Meera Vaidya', 'Ayurveda', 1, 'drmeera', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8');

-- 3. Insert Consents
INSERT INTO consents (patient_id, consent_type, is_granted, granted_via, granted_at)
VALUES 
(1, 'data_capture', 1, 'touch', GETDATE()),
(1, 'abdm_sharing', 1, 'touch', GETDATE()),
(2, 'data_capture', 1, 'audio', GETDATE()),
(2, 'abdm_sharing', 1, 'audio', GETDATE());

-- 4. Insert Clinical Sessions
INSERT INTO clinical_sessions (patient_id, history_mode, status, session_data_cleared)
VALUES 
(1, 'allopathic', 'completed', 0),
(2, 'allopathic', 'completed', 0);

-- 5. Insert Interview Turns
INSERT INTO interview_turns (session_id, turn_number, input_mode, ai_question, patient_response_text, response_language)
VALUES 
(1, 1, 'voice', N'What brings you to the hospital today?', N'I have severe chest pain and difficulty breathing.', 'Hindi'),
(1, 2, 'voice', N'When did the chest pain start and does it radiate anywhere?', N'It started 3 days ago and goes down my left arm.', 'Hindi'),
(2, 1, 'touch', N'What symptoms are you experiencing?', N'I have high fever and chills for 2 days.', 'Hindi');

-- 6. Insert Structured History
INSERT INTO structured_history (session_id, chief_complaint, hpi_onset, hpi_character, hpi_radiation, hpi_associated_symptoms, hpi_timing, hpi_severity, past_medical_surgical, drug_allergy_history, family_history, personal_history, review_of_systems)
VALUES 
(1, N'Acute chest pain radiating to left arm and difficulty breathing for 3 days', N'3 days ago', N'Compressive, heavy pressure', N'Left arm and shoulder', N'Dyspnoea, sweating', N'Persistent', N'8/10', N'Hypertension (2 years)', N'No known drug allergies', N'Father had CAD', N'Non-smoker, Moderate activity', N'Cardiovascular: Chest pain, Dyspnoea'),
(2, N'High grade fever with chills for 2 days', N'2 days ago', N'High fever', N'None', N'Chills, headache, bodyache', N'Intermittent', N'6/10', N'None', N'No known allergies', N'Unremarkable', N'Student', N'General: Fever, Chills');

-- 7. Insert Red Flag Alert (Ravi Patel)
INSERT INTO red_flag_alerts (session_id, flag_description, severity, triage_notified, triggered_at)
VALUES 
(1, N'Chest pain + breathing difficulty', 'HIGH', 1, GETDATE());

-- 8. Insert Medical Documents (Ravi Patel)
INSERT INTO medical_documents (patient_id, session_id, document_type, file_path, document_date, ocr_status, ocr_raw_text, ocr_language)
VALUES 
(1, 1, 'prescription', '/documents/sample_prescriptions/ravi_prescription.jpg', CAST(GETDATE() AS DATE), 'processed', N'Rx: Tab Aspirin 75mg 1-0-0, Tab Atorvastatin 20mg 0-0-1, Tab Clopidogrel 75mg 1-0-0', 'English'),
(1, 1, 'lab_report', '/documents/sample_reports/ravi_cbc_report.pdf', CAST(GETDATE() AS DATE), 'processed', N'Lab Report: Troponin-T: 0.08 ng/mL (High), Hemoglobin: 13.8 g/dL, WBC: 11500 /uL (High)', 'English');

-- 9. Insert Extracted Medications (Ravi Patel's Prescription)
INSERT INTO document_extracted_medications (document_id, medicine_name, dosage, frequency, duration)
VALUES 
(1, N'Aspirin', '75mg', '1-0-0', '30 days'),
(1, N'Atorvastatin', '20mg', '0-0-1', '30 days'),
(1, N'Clopidogrel', '75mg', '1-0-0', '30 days');

-- 10. Insert Extracted Lab Values (Ravi Patel's Lab Report with is_abnormal=1)
INSERT INTO document_extracted_lab_values (document_id, test_name, result_value, unit, reference_range, is_abnormal)
VALUES 
(2, N'Troponin-T', '0.08', 'ng/mL', '0.0 - 0.04', 1),
(2, N'Hemoglobin', '13.8', 'g/dL', '12.0 - 15.5', 0),
(2, N'Total WBC Count', '11500', '/uL', '4000 - 11000', 1);

-- 11. Insert Extracted Conditions
INSERT INTO document_extracted_conditions (document_id, entity_type, description, entity_date)
VALUES 
(1, 'diagnosis', N'Suspected Acute Coronary Syndrome', CAST(GETDATE() AS DATE));

-- 12. Insert Clinical Summaries (status='draft')
INSERT INTO clinical_summaries (session_id, patient_id, summary_text_english, summary_text_local_language, status, generated_at)
VALUES 
(1, 1, N'45-year-old male presents with 3-day history of acute compressive chest pain radiating to left arm with dyspnoea. High-priority red flag alert triggered. Troponin-T elevated (0.08 ng/mL). Prescribed Aspirin, Atorvastatin, and Clopidogrel.', N'45 वर्षीया पुरुष रोगी को 3 दिनों से सीने में तेज़ दर्द (जो बाएं हाथ तक फैलता है) और सांस लेने में तकलीफ की समस्या है। उच्च प्राथमिकता वाला रेड-फ्लैग अलर्ट जारी किया गया। ट्रॉपोनिन-टी (0.08 ng/mL) बढ़ा हुआ है।', 'draft', GETDATE()),
(2, 2, N'32-year-old female presents with acute onset high grade fever with chills and headache for 2 days. Hemodynamically stable.', N'32 वर्षीया महिला रोगी को 2 दिनों से ठंड के साथ तेज़ बुखार की समस्या है। रोगी की हालत स्थिर है।', 'draft', GETDATE());

-- 13. Insert ABDM Sync Log (sync_status='success')
INSERT INTO abdm_sync_log (summary_id, target_system, fhir_resource_id, sync_status, synced_at)
VALUES 
(1, 'ABDM_FHIR', 'FHIR-BUNDLE-99821-RAVI', 'success', GETDATE());

-- 14. Insert Audit Log
INSERT INTO audit_log (patient_id, action, action_details, occurred_at)
VALUES 
(1, 'demo_data_seeded', N'Preloaded hackathon demo dataset for Ravi Patel & Priya Shah', GETDATE());

PRINT 'MediKiosk Demo Data Preloaded Successfully!';
