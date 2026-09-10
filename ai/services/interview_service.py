"""
Core AI clinical interview service.
Handles: adaptive SOCRATES questioning, red-flag detection, structured history extraction.
Output field names match structured_history and red_flag_alerts tables.
"""

import sys
import os
import json
import logging
from pathlib import Path
from typing import Optional, Tuple, Dict, Any, List

# ----------------------------------------------------
# 0. Path Resolution & Environment Loading
# ----------------------------------------------------
# Fix module path so 'ai.prompts' resolves regardless of where python runs
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from dotenv import load_dotenv
load_dotenv(dotenv_path=PROJECT_ROOT / ".env")

from google import genai
from google.genai import types
from ai.prompts.clinical_interview_prompt import (
    CLINICAL_INTERVIEW_PROMPT,
    AYUSH_INTERVIEW_PROMPT,
)

logger = logging.getLogger(__name__)

api_key = os.getenv("AI_API_KEY") or os.getenv("GEMINI_API_KEY")
if not api_key:
    raise RuntimeError("AI_API_KEY or GEMINI_API_KEY environment variable is required.")

client = genai.Client(api_key=api_key)
MODEL = "gemini-2.5-flash"

# ----------------------------------------------------
# 1. Tool Declaration & Structured Extraction Schema
# ----------------------------------------------------
flag_emergency = types.FunctionDeclaration(
    name="flag_emergency",
    description="Call this immediately when the patient's symptoms match an acute red-flag emergency pattern.",
    parameters={
        "type": "object",
        "properties": {
            "flag_description": {
                "type": "string",
                "description": "Short clinical rationale (e.g. 'Chest pain + dyspnoea')"
            },
            "severity": {
                "type": "string",
                "enum": ["HIGH", "CRITICAL"],
                "description": "Triage urgency"
            }
        },
        "required": ["flag_description", "severity"]
    }
)

STRUCTURED_HISTORY_SCHEMA = {
    "type": "object",
    "properties": {
        "chief_complaint": {"type": "string"},
        "hpi_onset": {"type": "string"},
        "hpi_character": {"type": "string"},
        "hpi_radiation": {"type": "string"},
        "hpi_associated_symptoms": {"type": "string"},
        "hpi_timing": {"type": "string"},
        "hpi_exacerbating_relieving": {"type": "string"},
        "hpi_severity": {"type": "string"},
        "past_medical_surgical": {"type": "string"},
        "drug_allergy_history": {"type": "string"},
        "family_history": {"type": "string"},
        "personal_history": {"type": "string"},
        "review_of_systems": {"type": "string"}
    },
    "required": ["chief_complaint"]
}


# ----------------------------------------------------
# 2. Asynchronous Interview Engine
# ----------------------------------------------------
class InterviewService:
    """Manages an active clinical case-taking dialogue session."""

    def __init__(self, history_mode: str = "standard"):
        system_instruction = (
            AYUSH_INTERVIEW_PROMPT if history_mode == "ayush" else CLINICAL_INTERVIEW_PROMPT
        )
        
        # Initialize an asynchronous multi-turn chat
        self.chat = client.aio.chats.create(
            model=MODEL,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                temperature=0.2,
                tools=[types.Tool(function_declarations=[flag_emergency])]
            )
        )
        self.turns: List[Dict[str, Any]] = []

    async def send_message(
        self, 
        patient_text: str, 
        input_mode: str = "touch"
    ) -> Tuple[str, Optional[Dict[str, Any]]]:
        """
        Submits patient utterance, resolves tool calls, and returns next question.
        Returns: tuple(ai_question_text, red_flag_dict_or_None)
        """
        response = await self.chat.send_message(patient_text)

        red_flag = None
        text_parts = []
        function_call = None

        if response.candidates and response.candidates[0].content.parts:
            for part in response.candidates[0].content.parts:
                if part.function_call and part.function_call.name == "flag_emergency":
                    function_call = part.function_call
                    args = function_call.args
                    red_flag = {
                        "flag_description": args.get("flag_description"),
                        "severity": args.get("severity", "HIGH")
                    }
                elif part.text:
                    text_parts.append(part.text)

        # Resolve function call to prevent broken converaisation state on turn 2+
        if function_call:
            follow_up = await self.chat.send_message(
                types.Part.from_function_response(
                    name="flag_emergency",
                    response={"status": "acknowledged", "triage_alert_created": True}
                )
            )
            if follow_up.candidates and follow_up.candidates[0].content.parts:
                for part in follow_up.candidates[0].content.parts:
                    if part.text:
                        text_parts.append(part.text)

        ai_question = " ".join(text_parts).strip()
        if not ai_question:
            if red_flag:
                ai_question = "I have alerted triage for immediate attention. When did these symptoms start?"
            else:
                ai_question = "Could you tell me a little more about what you are feeling?"

        self.turns.append({
            "ai_question": ai_question,
            "patient_response_text": patient_text,
            "input_mode": input_mode,
            "red_flag": red_flag
        })

        return ai_question, red_flag

    async def generate_structured_history(self) -> dict:
        """
        Compiles the entire transcript into a structured SOCRATES dictionary.
        Returns a dict matching the database structured_history table.
        """
        transcript = ""
        for msg in self.chat.get_history():
            role = "Patient" if msg.role == "user" else "Clinician AI"
            for part in msg.parts:
                if part.text:
                    transcript += f"{role}: {part.text}\n"

        result = await client.aio.models.generate_content(
            model=MODEL,
            contents=(
                "You are an expert clinical auditor. Analyze this transcript and extract "
                "the clinical history strictly according to the SOCRATES model into the schema. "
                "Set fields to empty string '' if not discussed:\n\n"
                f"{transcript}"
            ),
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=STRUCTURED_HISTORY_SCHEMA,
                temperature=0.1
            )
        )

        return json.loads(result.text)


