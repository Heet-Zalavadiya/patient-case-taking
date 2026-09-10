import asyncio
import os
from pathlib import Path
from typing import List, Optional
from dotenv import load_dotenv
from google import genai
from google.genai import types
from pydantic import BaseModel, Field

# Automatically locate and load .env from root or parent directory
current_dir = Path(__file__).resolve().parent
root_dir = current_dir.parent.parent
env_path = root_dir / ".env"

if env_path.exists():
    load_dotenv(dotenv_path=env_path)
else:
    load_dotenv()


client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))


# ----------------------------------------------------
# 1. Pydantic Schemas for Structured JSON Output
# ----------------------------------------------------
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


# ----------------------------------------------------
# 2. Async OCR Processing Engine
# ----------------------------------------------------
async def process_document_ocr(file_bytes: bytes, mime_type: str = "image/jpeg") -> PatientCaseRecord:
    allowed_types = {"image/jpeg", "image/png", "image/webp", "application/pdf"}
    if mime_type not in allowed_types:
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

    if not response.text:
        raise ValueError("Gemini returned an empty response.")

    return PatientCaseRecord.model_validate_json(response.text)


# ----------------------------------------------------
# 3. Direct Execution Test Block
# ----------------------------------------------------
async def main():
    # Resolves to: patient-case-taking/ocr/samples/sample-prescription.png
    base_services_dir = Path(__file__).resolve().parent
    image_path = base_services_dir.parent / "samples" / "sample-prescription.png"

    if not image_path.exists():
        print(f"Error: Could not find image at resolved path:\n{image_path}")
        return

    print(f"Reading file: {image_path.name}")
    with open(image_path, "rb") as f:
        file_bytes = f.read()

    ext = image_path.suffix.lower()
    mime_type = "image/png" if ext == ".png" else "image/jpeg"

    print("Sending document to Gemini for structured extraction...")
    result: PatientCaseRecord = await process_document_ocr(file_bytes, mime_type=mime_type)

    print("\n--- Extracted Structured JSON Output ---")
    print(result.model_dump_json(indent=2))


if __name__ == "__main__":
    asyncio.run(main())