import os
from typing import List, Optional
from dotenv import load_dotenv
from google import genai
from google.genai import types
from pydantic import BaseModel, Field

load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

# 1. Schema Tailored to Clinical Case Taking
class MedicationItem(BaseModel):
    name: str = Field(description="Name of the medicine or brand (e.g., Tab Augmentin)")
    dosage: Optional[str] = Field(None, description="Strength (e.g., 625mg, 500mg)")
    frequency: Optional[str] = Field(None, description="Timing pattern (e.g., 1-0-1, OD, BD, TDS, SOS)")
    duration: Optional[str] = Field(None, description="Duration (e.g., 5 days, 1 week)")
    instructions: Optional[str] = Field(None, description="e.g., After food, empty stomach")

class PatientCaseRecord(BaseModel):
    clinic_or_hospital: Optional[str] = Field(None, description="Clinic / Hospital name")
    doctor_name: Optional[str] = Field(None, description="Treating Doctor's name")
    patient_name: Optional[str] = Field(None, description="Full name of the patient")
    patient_age: Optional[str] = Field(None, description="Age in years")
    patient_gender: Optional[str] = Field(None, description="Male, Female, Other, or M/F")
    visit_date: Optional[str] = Field(None, description="Date of consultation")
    chief_complaints: Optional[str] = Field(None, description="Symptoms / Reason for visit if recorded")
    diagnosis: Optional[str] = Field(None, description="Provisional or final diagnosis if written")
    medications: List[MedicationItem] = Field(default_factory=list)
    lab_tests_advised: Optional[str] = Field(None, description="Blood work, X-Ray, MRI, etc.")
    follow_up_advice: Optional[str] = Field(None, description="Next visit instructions or lifestyle advice")

CASE_TAKING_PROMPT = """
You are an expert clinical documentation assistant digitizing handwritten prescriptions and case sheets for a clinical intake system.

Analyze the uploaded document and transcribe all details into the schema.

Guidelines:
1. Exact Names: Retain drug formulations (Tab, Syp, Cap, Oint) and brand names.
2. Standardize Frequencies: Map intake instructions accurately (e.g., 1-0-1, 1-0-0, OD, BD, TDS, SOS).
3. No Hallucinations: If any handwriting, drug, or dosage is illegible or ambiguous, transcribe that exact field as '[UNCLEAR]'.
4. Clinical Extraction: Separate diagnostic findings, symptoms, and tests advised into their respective fields.
"""

async def process_document_ocr(file_bytes: bytes, mime_type: str = "image/jpeg") -> PatientCaseRecord:
    # Handles PDFs and images directly
    if mime_type not in ["image/jpeg", "image/png", "image/webp", "application/pdf"]:
        mime_type = "image/jpeg"

    response = await client.aio.models.generate_content(
        model="gemini-2.5-flash",
        contents=[
            types.Part.from_bytes(data=file_bytes, mime_type=mime_type),
            CASE_TAKING_PROMPT,
        ],
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=PatientCaseRecord,
            temperature=0.1,
        ),
    )

    return PatientCaseRecord.model_validate_json(response.text)