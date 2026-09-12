"""
MediKiosk Clinical Seed Data Script
Populates initial clinical test dataset (Doctors, Patients, Sessions,
Red Flag Alerts, Extracted Lab Values, Structured Histories, AYUSH Assessments, Summaries)
when running in local development or offline evaluation mode.
"""

import hashlib
import json
from datetime import datetime, date
from sqlalchemy.orm import Session
from database.connection import SessionLocal, engine, Base
import models
from models.doctor import Doctor
from models.patient import Patient
from models.clinical_session import ClinicalSession
from models.red_flag_alert import RedFlagAlert
from models.structured_history import StructuredHistory
from models.ayush_history import AyushHistory
from models.medical_document import MedicalDocument
from models.document_extraction import (
    DocumentExtractedLabValue,
    DocumentExtractedMedication,
    DocumentExtractedCondition
)
from models.clinical_summary import ClinicalSummary

def hash_pw(pwd: str) -> str:
    return hashlib.sha256(pwd.encode()).hexdigest()

def seed_database():
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    try:
        # Check if already seeded
        if db.query(Doctor).first() is not None:
            return

        # 1. Seed Doctors
        doc_ayush = Doctor(
            full_name="Dr. Anand Kulkarni",
            department="Kayachikitsa & AYUSH OPD",
            is_ayush_practitioner=1,
            login_id="dr.anand",
            password_hash=hash_pw("Doctor@123")
        )
        doc_allopathic = Doctor(
            full_name="Dr. Rajesh Sharma",
            department="Department of Clinical Medicine",
            is_ayush_practitioner=0,
            login_id="dr.rajesh",
            password_hash=hash_pw("Doctor@123")
        )
        db.add_all([doc_ayush, doc_allopathic])
        db.commit()
        db.refresh(doc_ayush)
        db.refresh(doc_allopathic)

        # 2. Seed Patients
        patients_data = [
            {
                "id": 1,
                "full_name": "Ramesh Kumar",
                "age": 58,
                "gender": "Male",
                "phone": "+91 98112 34567",
                "abha_id": "14-3456-7890-1234",
                "history_mode": "allopathic",
                "chief_complaint": "Acute substernal chest heaviness, radiating to left shoulder and jaw for past 3 hours accompanied by cold sweating and dyspnea.",
                "hpi_symptoms": ["Substernal chest tightness", "Diaphoresis (cold sweats)", "Dyspnea on minimal exertion", "Nausea without emesis"],
                "past_medical": ["Essential Hypertension (Dx 2018)", "Type 2 Diabetes Mellitus (Dx 2021)"],
                "drug_allergies": [{"allergen": "Penicillin", "reaction": "Anaphylaxis / Urticaria"}],
                "ros": {
                    "Cardiovascular": "Substernal chest heaviness radiating to left shoulder, palpitations",
                    "Respiratory": "Shortness of breath on minimal exertion, no cough",
                    "Gastrointestinal": "Mild nausea, no vomiting, no abdominal pain",
                    "Neurological": "Mild lightheadedness during peak pain, no syncope"
                },
                "red_flag": {
                    "flag_description": "CRITICAL: Severe acute coronary syndrome risk with hypertensive urgency and borderline hypoxia.",
                    "severity": "HIGH",
                    "triggers": ["BP: 168/102 mmHg", "HR: 108 bpm", "SpO2: 91%"],
                    "action": "Immediate 12-lead ECG, sublingual nitrates if indicated, stat cardiology consult."
                },
                "labs": [
                    {"name": "Troponin-I (High-Sensitivity)", "val": "0.18", "unit": "ng/mL", "range": "0.00 - 0.04", "abnormal": 1, "flag": "CRITICAL HIGH"},
                    {"name": "Serum Creatinine", "val": "1.8", "unit": "mg/dL", "range": "0.7 - 1.3", "abnormal": 1, "flag": "HIGH"},
                    {"name": "Blood Urea Nitrogen (BUN)", "val": "28", "unit": "mg/dL", "range": "7 - 20", "abnormal": 1, "flag": "HIGH"},
                    {"name": "Serum Potassium (K+)", "val": "4.6", "unit": "mEq/L", "range": "3.5 - 5.1", "abnormal": 0, "flag": "NORMAL"},
                    {"name": "Serum Sodium (Na+)", "val": "139", "unit": "mEq/L", "range": "135 - 145", "abnormal": 0, "flag": "NORMAL"},
                    {"name": "Blood Glucose (Random)", "val": "186", "unit": "mg/dL", "range": "70 - 140", "abnormal": 1, "flag": "HIGH"}
                ],
                "summary": "58-year-old male with known HTN and T2DM presents with acute substernal chest heaviness radiating to left shoulder (onset 3 hours ago). Vitals show BP 168/102 mmHg, HR 108 bpm, SpO2 91%. Elevated Troponin-I at 0.18 ng/mL. Red flag triggered for urgent cardiology evaluation."
            },
            {
                "id": 2,
                "full_name": "Sunita Devi",
                "age": 46,
                "gender": "Female",
                "phone": "+91 98450 87123",
                "abha_id": "14-8765-4321-9876",
                "history_mode": "ayush",
                "chief_complaint": "Chronic bilateral knee joint pain (Sandhivata), morning stiffness for 45 minutes, exacerbated by cold weather, chronic sluggish digestion (Mandagni).",
                "hpi_symptoms": ["Bilateral knee crepitus", "Early morning joint stiffness (45 mins)", "Epigastric bloating post-meals", "Intermittent constipation"],
                "past_medical": ["Osteoarthritis Grade 2 (Bilateral Knees)", "Chronic Dyspepsia"],
                "drug_allergies": [{"allergen": "Sulfa Drugs", "reaction": "Skin rash"}],
                "ros": {
                    "Musculoskeletal": "Crepitus in both knees, difficulty squatting and climbing stairs",
                    "Gastrointestinal": "Bloating, erratic appetite, bowel movement every 2 days",
                    "Sleep": "Disturbed due to dull throbbing joint aches"
                },
                "ayush_assessment": {
                    "prakriti": "Vata-Kapha (Predominant Vata)",
                    "vikriti": "Vata-Pitta Dushti with Ama Accumulation",
                    "sara": "Madhyama Sara",
                    "samhanana": "Madhyama Samhanana",
                    "pramana": "Madhyama",
                    "satmya": "Sarvarasa Satmya (Favors Tikta & Katu)",
                    "sattva": "Pravara Sattva",
                    "ahara_shakti": "Manda (Diminished Digestive Agni)",
                    "vyayama_shakti": "Avara (Low Physical Endurance due to joint pain)",
                    "vaya": "Madhyama Vaya (46 Years)",
                    "ahara_vihara_notes": "Excessive intake of cold, dry foods (Ruksha-Shita Ahara), sedentary lifestyle.",
                    "nidana": "Vataprakopaka Ahara & Vihara, Shita Sevana, Vega Dharana",
                    "samprapti": "Pravriddha Vata entering Sandhis causing Shula, Shotha, and Khanja प्रवृत्ति"
                },
                "red_flag": None,
                "labs": [
                    {"name": "Erythrocyte Sedimentation Rate (ESR)", "val": "34", "unit": "mm/1st hr", "range": "0 - 20", "abnormal": 1, "flag": "ELEVATED"},
                    {"name": "C-Reactive Protein (CRP)", "val": "4.2", "unit": "mg/L", "range": "< 3.0", "abnormal": 1, "flag": "ELEVATED"},
                    {"name": "Rheumatoid Factor (RF)", "val": "11.2", "unit": "IU/mL", "range": "< 14.0", "abnormal": 0, "flag": "NEGATIVE"},
                    {"name": "Serum Uric Acid", "val": "4.8", "unit": "mg/dL", "range": "2.4 - 6.0", "abnormal": 0, "flag": "NORMAL"},
                    {"name": "Hemoglobin (Hb)", "val": "12.1", "unit": "g/dL", "range": "12.0 - 15.5", "abnormal": 0, "flag": "NORMAL"}
                ],
                "summary": "46-year-old female presenting with chronic bilateral knee Sandhivata and Mandagni. Prakriti assessed as Vata-Kapha with Vata-Pitta Dushti. ESR mildly elevated at 34 mm/hr with negative RF. Recommended Janu Basti, Dashamoola Kashayam, and digestive Agni deepana."
            },
            {
                "id": 3,
                "full_name": "Arjun Patel",
                "age": 32,
                "gender": "Male",
                "phone": "+91 97234 11980",
                "abha_id": "14-1122-3344-5566",
                "history_mode": "allopathic",
                "chief_complaint": "Acute onset wheezing, persistent dry paroxysmal cough, chest tightness following viral URI 4 days ago.",
                "hpi_symptoms": ["Expiratory wheeze", "Paroxysmal cough at night", "Intercostal muscle fatigue", "Mild tachypnea"],
                "past_medical": ["Childhood bronchial asthma (dormant for 8 years)", "Seasonal allergic rhinitis"],
                "drug_allergies": [{"allergen": "Aspirin / NSAIDs", "reaction": "Bronchospasm / Wheezing"}],
                "ros": {
                    "Respiratory": "Bilateral expiratory wheezing, tachypnea (RR 28/min)",
                    "ENT": "Post-nasal drip, clear rhinorrhea",
                    "Cardiovascular": "Sinus tachycardia (HR 112 bpm)"
                },
                "red_flag": {
                    "flag_description": "URGENT: Acute moderate-to-severe bronchospasm with tachypnea and tachycardia.",
                    "severity": "HIGH",
                    "triggers": ["RR: 28 /min", "HR: 112 bpm", "SpO2: 93%"],
                    "action": "Immediate nebulization with beta-2 agonist and anticholinergic; evaluate peak flow."
                },
                "labs": [
                    {"name": "Peak Expiratory Flow Rate (PEFR)", "val": "240", "unit": "L/min", "range": "450 - 650", "abnormal": 1, "flag": "CRITICAL LOW"},
                    {"name": "Absolute Eosinophil Count (AEC)", "val": "680", "unit": "cells/mcL", "range": "20 - 500", "abnormal": 1, "flag": "HIGH"},
                    {"name": "Serum IgE (Total)", "val": "420", "unit": "IU/mL", "range": "< 100", "abnormal": 1, "flag": "HIGH"}
                ],
                "summary": "32-year-old male presenting with acute asthma exacerbation secondary to viral URI. Tachypneic with PEFR 240 L/min and SpO2 93%. Known allergy to NSAIDs. Stat nebulization prescribed."
            },
            {
                "id": 4,
                "full_name": "Meera Nambiar",
                "age": 61,
                "gender": "Female",
                "phone": "+91 94471 66231",
                "abha_id": "14-9988-7766-5544",
                "history_mode": "ayush",
                "chief_complaint": "Insomnia (Anidra), tension headaches in occipital region, fluctuating blood pressure, general fatigue and dryness of eyes.",
                "hpi_symptoms": ["Difficulty initiating sleep", "Occipital tension headaches", "Fatigue", "Dry skin and eyes"],
                "past_medical": ["Mild Hypertension", "Menopausal Syndrome"],
                "drug_allergies": [],
                "ros": {
                    "Neurological": "Tension headaches, anxiety, disrupted REM sleep",
                    "Ophthalmology": "Dry eye sensation",
                    "Cardiovascular": "BP 130/84 mmHg"
                },
                "ayush_assessment": {
                    "prakriti": "Pitta-Vata",
                    "vikriti": "Tarpaka Kapha Kshaya with Prana Vata Vriddhi",
                    "sara": "Madhyama Sara",
                    "samhanana": "Madhyama Samhanana",
                    "pramana": "Madhyama",
                    "satmya": "Madhura, Snigdha Ahara",
                    "sattva": "Madhyama",
                    "ahara_shakti": "Madhyama",
                    "vyayama_shakti": "Madhyama",
                    "vaya": "Vriddha Vaya (61 Years)",
                    "ahara_vihara_notes": "Late night screen exposure, irregular meals.",
                    "nidana": "Chinta, Shoka, Ratrijagarana, Ruksha Ahara",
                    "samprapti": "Prana Vata and Sadhaka Pitta disturbance affecting Manovaha Srotas"
                },
                "red_flag": None,
                "labs": [
                    {"name": "Serum TSH", "val": "2.45", "unit": "uIU/mL", "range": "0.4 - 4.2", "abnormal": 0, "flag": "NORMAL"},
                    {"name": "Serum 25-OH Vitamin D", "val": "16.4", "unit": "ng/mL", "range": "30 - 100", "abnormal": 1, "flag": "DEFICIENT"},
                    {"name": "Vitamin B12", "val": "220", "unit": "pg/mL", "range": "200 - 900", "abnormal": 0, "flag": "NORMAL"}
                ],
                "summary": "61-year-old female presenting with chronic Anidra (insomnia) and tension headaches. Assessed as Pitta-Vata Prakriti with Manovaha Sroto-dushti. Vitamin D deficient (16.4 ng/mL). Prescribed Shirodhara with Ksheerabala Taila and Ashwagandha Churna."
            },
            {
                "id": 5,
                "full_name": "Harish Chandra Joshi",
                "age": 52,
                "gender": "Male",
                "phone": "+91 98201 44556",
                "abha_id": "14-5544-3322-1100",
                "history_mode": "allopathic",
                "chief_complaint": "Polyuria, polydipsia, unhealed ulcer on dorsum of right great toe for 3 weeks, peripheral numbness in feet (stocking distribution).",
                "hpi_symptoms": ["Nocturia x 4", "Increased thirst", "Right toe superficial ulcer (1.5 cm)", "Bilateral foot paresthesia"],
                "past_medical": ["Poorly controlled Type 2 Diabetes Mellitus", "Dyslipidemia"],
                "drug_allergies": [{"allergen": "Ciprofloxacin", "reaction": "Tendon pain"}],
                "ros": {
                    "Endocrine": "Severe polydipsia and polyuria",
                    "Neurological": "Diminished pinprick and vibration sensation in bilateral lower extremities",
                    "Dermatology": "Dry erythematous skin, right great toe uninfected ulcer"
                },
                "red_flag": {
                    "flag_description": "ALERT: Diabetic foot ulcer with peripheral neuropathy; high risk of secondary deep osteomyelitis if neglected.",
                    "severity": "HIGH",
                    "triggers": ["HbA1c: 10.4%", "Random Glucose: 284 mg/dL"],
                    "action": "Stat wound dressing, diabetic foot offloading, immediate endocrinologist review."
                },
                "labs": [
                    {"name": "Glycated Hemoglobin (HbA1c)", "val": "10.4", "unit": "%", "range": "< 5.7", "abnormal": 1, "flag": "POOR CONTROL"},
                    {"name": "Fasting Plasma Glucose", "val": "218", "unit": "mg/dL", "range": "70 - 100", "abnormal": 1, "flag": "VERY HIGH"},
                    {"name": "Serum Triglycerides", "val": "242", "unit": "mg/dL", "range": "< 150", "abnormal": 1, "flag": "HIGH"},
                    {"name": "Total Cholesterol", "val": "228", "unit": "mg/dL", "range": "< 200", "abnormal": 1, "flag": "HIGH"},
                    {"name": "Estimated GFR (eGFR)", "val": "74", "unit": "mL/min/1.73m2", "range": "> 90", "abnormal": 1, "flag": "STAGE 2 CKD"}
                ],
                "summary": "52-year-old male with poorly controlled T2DM (HbA1c 10.4%) presenting with diabetic neuropathy and early neuropathic foot ulcer on right great toe. High risk for complications; immediate glycemic optimization and wound offloading protocol initiated."
            }
        ]

        for p_idx, p_data in enumerate(patients_data, 1):
            pat = Patient(
                patient_id=p_idx,
                full_name=p_data["full_name"],
                age=p_data["age"],
                gender=p_data["gender"],
                phone_number=p_data["phone"],
                abha_id=p_data["abha_id"],
                preferred_language="Hindi" if p_idx % 2 == 0 else "English",
                is_active=1
            )
            db.add(pat)
            db.commit()
            db.refresh(pat)

            # Create Clinical Session
            sess = ClinicalSession(
                session_id=p_idx,
                patient_id=pat.patient_id,
                history_mode=p_data["history_mode"],
                status="waiting" if p_idx != 3 else "in_progress",
                session_data_cleared=False
            )
            db.add(sess)
            db.commit()
            db.refresh(sess)

            # Create Structured History
            hist = StructuredHistory(
                session_id=sess.session_id,
                chief_complaint=p_data["chief_complaint"],
                hpi_associated_symptoms=json.dumps(p_data["hpi_symptoms"]),
                past_medical_surgical=json.dumps(p_data["past_medical"]),
                drug_allergy_history=json.dumps(p_data["drug_allergies"]),
                review_of_systems=json.dumps(p_data["ros"])
            )
            db.add(hist)

            # Create AYUSH History if mode is ayush
            if p_data["history_mode"] == "ayush" and "ayush_assessment" in p_data:
                ay_info = p_data["ayush_assessment"]
                ayush_rec = AyushHistory(
                    session_id=sess.session_id,
                    prakriti=ay_info.get("prakriti"),
                    vikriti=ay_info.get("vikriti"),
                    sara=ay_info.get("sara"),
                    samhanana=ay_info.get("samhanana"),
                    pramana=ay_info.get("pramana"),
                    satmya=ay_info.get("satmya"),
                    sattva=ay_info.get("sattva"),
                    ahara_shakti=ay_info.get("ahara_shakti"),
                    vyayama_shakti=ay_info.get("vyayama_shakti"),
                    vaya=ay_info.get("vaya"),
                    ahara_vihara_notes=ay_info.get("ahara_vihara_notes"),
                    nidana=ay_info.get("nidana"),
                    samprapti=ay_info.get("samprapti")
                )
                db.add(ayush_rec)

            # Create Red Flag if present
            if p_data["red_flag"]:
                rf = p_data["red_flag"]
                alert = RedFlagAlert(
                    session_id=sess.session_id,
                    flag_description=rf["flag_description"],
                    severity=rf["severity"],
                    triage_notified=True
                )
                db.add(alert)

            # Create Medical Document and Lab Values
            doc = MedicalDocument(
                patient_id=pat.patient_id,
                session_id=sess.session_id,
                document_type="lab_report",
                file_path=f"/uploads/lab_reports/pat_{p_idx}_labs.pdf",
                ocr_status="processed"
            )
            db.add(doc)
            db.commit()
            db.refresh(doc)

            for lab in p_data["labs"]:
                lab_rec = DocumentExtractedLabValue(
                    document_id=doc.document_id,
                    test_name=lab["name"],
                    result_value=str(lab["val"]),
                    unit=lab["unit"],
                    reference_range=lab["range"],
                    is_abnormal=bool(lab["abnormal"])
                )
                db.add(lab_rec)

            # Create Clinical Summary
            summary_rec = ClinicalSummary(
                session_id=sess.session_id,
                patient_id=pat.patient_id,
                summary_text_english=p_data["summary"],
                status="draft"
            )
            db.add(summary_rec)

        db.commit()
        print("MediKiosk database successfully initialized and seeded with clinical data.")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
