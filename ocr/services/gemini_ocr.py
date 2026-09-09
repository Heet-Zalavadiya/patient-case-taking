import os
import base64

from dotenv import load_dotenv
from google import genai


load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    raise RuntimeError("GEMINI_API_KEY was not found in .env")


client = genai.Client(api_key=api_key)


def extract_text(image_path: str) -> str:

    with open(image_path, "rb") as image_file:
        image_bytes = image_file.read()

    image_b64 = base64.b64encode(image_bytes).decode("utf-8")

    response = client.interactions.create(
        model="gemini-3.8-flash",
        input=[
            {
                "type": "text",
                "text": """
You are performing OCR on a handwritten medical prescription.

Read the prescription image carefully and transcribe ONLY the
visible text.

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
            },
            {
                "type": "image",
                "data": image_b64,
                "mime_type": "image/png"
            }
        ]
    )

    return response.output_text