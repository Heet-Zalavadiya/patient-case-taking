import os
import sys
from datetime import date, datetime

# Ensure backend directory is in path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.connection import Base, SessionLocal, engine
import models
from models.abdm_sync_log import AbdmSyncLog
from models.audit_log import AuditLog
from models.clinical_session import ClinicalSession
from models.clinical_summary import ClinicalSummary
from models.consent import Consent
from models.doctor import Doctor
from models.document_extraction import (
    DocumentExtractedCondition,
    DocumentExtractedLabValue,
    DocumentExtractedMedication,
)
from models.interview_turn import InterviewTurn
from models.medical_document import MedicalDocument
from models.patient import Patient
from models.red_flag_alert import RedFlagAlert
from models.structured_history import StructuredHistory


def seed_demo_data():
    """Idempotently seed hackathon demo data for Ravi Patel & Priya Shah into SQL Server."""
    print("Initializing database tables...")
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        print("Clearing old demo data...")
        db.query(AbdmSyncLog).delete()
        db.query(AuditLog).delete()
        db.query(ClinicalSummary).delete()
        db.query(DocumentExtractedCondition).delete()
        db.query(DocumentExtractedLabValue).delete()
        db.query(DocumentExtractedMedication).delete()
        db.query(MedicalDocument).delete()
        db.query(RedFlagAlert).delete()
        db.query(StructuredHistory).delete()
        db.query(InterviewTurn).delete()
        db.query(ClinicalSession).delete()
        db.query(Consent).delete()
        db.query(Doctor).delete()
        db.query(Patient).delete()
        db.commit()

        print("Seeding demo patients...")
        ravi = Patient(
            full_name="Ravi Patel",
            age=45,
            gender="Male",
            preferred_language="Hindi",
            accessibility_mode="standard",
            abha_id="91-4567-8910-1112",
            aadhaar_ref="AADHAAR-REF-9988",
            login_id="ravipatel",
            password_hash="5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8",
            is_first_visit=True,
        )
        priya = Patient(
            full_name="Priya Shah",
            age=32,
            gender="Female",
            preferred_language="Hindi",
            accessibility_mode="standard",
            abha_id="91-1234-5678-9012",
            aadhaar_ref="AADHAAR-REF-1122",
            login_id="priyashah",
            password_hash="5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8",
            is_first_visit=True,
        )
        db.add_all([ravi, priya])
        db.commit()
        db.refresh(ravi)
        db.refresh(priya)

        print("Seeding demo doctors...")
        dr_ankit = Doctor(
            full_name="Dr. Ankit Sharma",
            department="General OPD",
            is_ayush_practitioner=False,
            login_id="drankit",
            password_hash="5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8",
        )
        dr_meera = Doctor(
            full_name="Dr. Meera Vaidya",
            department="Ayurveda",
            is_ayush_practitioner=True,
            login_id="drmeera",
            password_hash="5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8",
        )
        db.add_all([dr_ankit, dr_meera])
        db.commit()

        print("Seeding demo consents...")
        consents = [
            Consent(patient_id=ravi.patient_id, consent_type="data_capture", is_granted=1, granted_via="touch"),
            Consent(patient_id=ravi.patient_id, consent_type="abdm_sharing", is_granted=1, granted_via="touch"),
            Consent(patient_id=priya.patient_id, consent_type="data_capture", is_granted=1, granted_via="audio"),
            Consent(patient_id=priya.patient_id, consent_type="abdm_sharing", is_granted=1, granted_via="audio"),
        ]
        db.add_all(consents)
        db.commit()

        print("Seeding clinical sessions...")
        session_ravi = ClinicalSession(patient_id=ravi.patient_id, history_mode="allopathic", status="completed")
        session_priya = ClinicalSession(patient_id=priya.patient_id, history_mode="allopathic", status="completed")
        db.add_all([session_ravi, session_priya])
        db.commit()
        db.refresh(session_ravi)
        db.refresh(session_priya)

        print("Seeding interview turns...")
        turns = [
            InterviewTurn(
                session_id=session_ravi.session_id,
                turn_number=1,
                input_mode="voice",
                ai_question="What brings you to the hospital today?",
                patient_response_text="I have severe chest pain and difficulty breathing.",
                response_language="Hindi",
            ),
            InterviewTurn(
                session_id=session_ravi.session_id,
                turn_number=2,
                input_mode="voice",
                ai_question="When did the chest pain start and does it radiate anywhere?",
                patient_response_text="It started 3 days ago and goes down my left arm.",
                response_language="Hindi",
            ),
            InterviewTurn(
                session_id=session_priya.session_id,
                turn_number=1,
                input_mode="touch",
                ai_question="What symptoms are you experiencing?",
                patient_response_text="I have high fever and chills for 2 days.",
                response_language="Hindi",
            ),
        ]
        db.add_all(turns)
        db.commit()

        print("Seeding structured history...")
        history_ravi = StructuredHistory(
            session_id=session_ravi.session_id,
            chief_complaint="Acute chest pain radiating to left arm and difficulty breathing for 3 days",
            hpi_onset="3 days ago",
            hpi_character="Compressive, heavy pressure",
            hpi_radiation="Left arm and shoulder",
            hpi_associated_symptoms="Dyspnoea, sweating",
            hpi_timing="Persistent",
            hpi_severity="8/10",
            past_medical_surgical="Hypertension (2 years)",
            drug_allergy_history="No known drug allergies",
            family_history="Father had CAD",
            personal_history="Non-smoker, Moderate activity",
            review_of_systems="Cardiovascular: Chest pain, Dyspnoea",
        )
        history_priya = StructuredHistory(
            session_id=session_priya.session_id,
            chief_complaint="High grade fever with chills for 2 days",
            hpi_onset="2 days ago",
            hpi_character="High fever",
            hpi_radiation="None",
            hpi_associated_symptoms="Chills, headache, bodyache",
            hpi_timing="Intermittent",
            hpi_severity="6/10",
            past_medical_surgical="None",
            drug_allergy_history="No known allergies",
            family_history="Unremarkable",
            personal_history="Student",
            review_of_systems="General: Fever, Chills",
        )
        db.add_all([history_ravi, history_priya])
        db.commit()

        print("Seeding red flag alert for Ravi Patel...")
        alert = RedFlagAlert(
            session_id=session_ravi.session_id,
            flag_description="Chest pain + breathing difficulty",
            severity="HIGH",
            triage_notified=True,
        )
        db.add(alert)
        db.commit()

        print("Seeding medical documents for Ravi Patel...")
        doc_prescription = MedicalDocument(
            patient_id=ravi.patient_id,
            session_id=session_ravi.session_id,
            document_type="prescription",
            file_path="/documents/sample_prescriptions/ravi_prescription.jpg",
            document_date=date.today(),
            ocr_status="processed",
            ocr_raw_text="Rx: Tab Aspirin 75mg 1-0-0, Tab Atorvastatin 20mg 0-0-1, Tab Clopidogrel 75mg 1-0-0",
            ocr_language="English",
        )
        doc_lab = MedicalDocument(
            patient_id=ravi.patient_id,
            session_id=session_ravi.session_id,
            document_type="lab_report",
            file_path="/documents/sample_reports/ravi_cbc_report.pdf",
            document_date=date.today(),
            ocr_status="processed",
            ocr_raw_text="Lab Report: Troponin-T: 0.08 ng/mL (High), Hemoglobin: 13.8 g/dL, Total WBC: 11500 /uL (High)",
            ocr_language="English",
        )
        db.add_all([doc_prescription, doc_lab])
        db.commit()
        db.refresh(doc_prescription)
        db.refresh(doc_lab)

        print("Seeding extracted medications for Ravi Patel...")
        meds = [
            DocumentExtractedMedication(
                document_id=doc_prescription.document_id,
                medicine_name="Aspirin",
                dosage="75mg",
                frequency="1-0-0",
                duration="30 days",
            ),
            DocumentExtractedMedication(
                document_id=doc_prescription.document_id,
                medicine_name="Atorvastatin",
                dosage="20mg",
                frequency="0-0-1",
                duration="30 days",
            ),
            DocumentExtractedMedication(
                document_id=doc_prescription.document_id,
                medicine_name="Clopidogrel",
                dosage="75mg",
                frequency="1-0-0",
                duration="30 days",
            ),
        ]
        db.add_all(meds)

        print("Seeding extracted lab values for Ravi Patel (with is_abnormal=True)...")
        labs = [
            DocumentExtractedLabValue(
                document_id=doc_lab.document_id,
                test_name="Troponin-T",
                result_value="0.08",
                unit="ng/mL",
                reference_range="0.0 - 0.04",
                is_abnormal=True,
            ),
            DocumentExtractedLabValue(
                document_id=doc_lab.document_id,
                test_name="Hemoglobin",
                result_value="13.8",
                unit="g/dL",
                reference_range="12.0 - 15.5",
                is_abnormal=False,
            ),
            DocumentExtractedLabValue(
                document_id=doc_lab.document_id,
                test_name="Total WBC Count",
                result_value="11500",
                unit="/uL",
                reference_range="4000 - 11000",
                is_abnormal=True,
            ),
        ]
        db.add_all(labs)

        print("Seeding extracted conditions...")
        cond = DocumentExtractedCondition(
            document_id=doc_prescription.document_id,
            entity_type="diagnosis",
            description="Suspected Acute Coronary Syndrome",
            entity_date=date.today(),
        )
        db.add(cond)
        db.commit()

        print("Seeding draft clinical summaries...")
        summary_ravi = ClinicalSummary(
            session_id=session_ravi.session_id,
            patient_id=ravi.patient_id,
            summary_text_english="45-year-old male presents with 3-day history of acute compressive chest pain radiating to left arm with dyspnoea. High-priority red flag alert triggered. Troponin-T elevated (0.08 ng/mL). Prescribed Aspirin, Atorvastatin, and Clopidogrel.",
            summary_text_local_language="45 वर्षीया पुरुष रोगी को 3 दिनों से सीने में तेज़ दर्द (जो बाएं हाथ तक फैलता है) और सांस लेने में तकलीफ की समस्या है। उच्च प्राथमिकता वाला रेड-फ्लैग अलर्ट जारी किया गया। ट्रॉपोनिन-टी (0.08 ng/mL) बढ़ा हुआ है।",
            status="draft",
        )
        summary_priya = ClinicalSummary(
            session_id=session_priya.session_id,
            patient_id=priya.patient_id,
            summary_text_english="32-year-old female presents with acute onset high grade fever with chills and headache for 2 days. Hemodynamically stable.",
            summary_text_local_language="32 वर्षीया महिला रोगी को 2 दिनों से ठंड के साथ तेज़ बुखार की समस्या है। रोगी की हालत स्थिर है।",
            status="draft",
        )
        db.add_all([summary_ravi, summary_priya])
        db.commit()
        db.refresh(summary_ravi)

        print("Seeding ABDM sync log...")
        sync_log = AbdmSyncLog(
            summary_id=summary_ravi.summary_id,
            target_system="ABDM_FHIR",
            fhir_resource_id="FHIR-BUNDLE-99821-RAVI",
            sync_status="success",
        )
        db.add(sync_log)

        print("Seeding audit log...")
        audit = AuditLog(
            patient_id=ravi.patient_id,
            action="demo_data_seeded",
            action_details="Preloaded hackathon demo dataset for Ravi Patel & Priya Shah",
        )
        db.add(audit)
        db.commit()

        print("[SUCCESS] MediKiosk Hackathon Demo Data Preloaded Successfully!")
        print(f"   Patient 1: Ravi Patel (ID={ravi.patient_id}) - Chest Pain + Red Flag + Abnormal Troponin-T")
        print(f"   Patient 2: Priya Shah (ID={priya.patient_id}) - Fever with Chills")

    except Exception as e:
        db.rollback()
        print(f"[ERROR] Error seeding demo data: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_demo_data()
