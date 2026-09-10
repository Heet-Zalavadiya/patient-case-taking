import mimetypes
import os
from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    raise RuntimeError("GEMINI_API_KEY was not found in .env")

client = genai.Client(api_key=api_key)

OCR_SYSTEM_PROMPT = """
You are performing OCR on a handwritten medical prescription.

Read the prescription image carefully and transcribe ONLY the visible text.

Requirements:
1. Preserve the original wording as much as possible.
2. Preserve the line structure where possible.
3. Do not summarize.
4. Do not diagnose the patient.
5. Do not add information that is not visible.
6. Do not guess unclear medicine names, numbers, dosages, or dates.
7. If something is genuinely unreadable, write [UNCLEAR].
8. Pay special attention to:
   - medicine names
   - dosage
   - frequency
   - duration
   - dates
   - doctor's name
   - instructions

Return only the OCR transcription.
"""

def extract_text(image_path: str) -> str:
    absolute_path = os.path.abspath(image_path)
    
    if not os.path.exists(absolute_path):
        raise FileNotFoundError(f"Prescription file not found at: {absolute_path}")

    # Dynamically resolve MIME type (jpeg, png, webp, pdf)
    mime_type, _ = mimetypes.guess_type(absolute_path)
    if not mime_type:
        mime_type = "image/jpeg"

    with open(absolute_path, "rb") as image_file:
        image_bytes = image_file.read()

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=[
            types.Part.from_bytes(
                data=image_bytes,
                mime_type=mime_type,
            ),
            OCR_SYSTEM_PROMPT,
        ],
    )

    return response.text or ""