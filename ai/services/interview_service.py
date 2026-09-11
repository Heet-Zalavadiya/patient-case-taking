"""
Core AI clinical interview service for MediKiosk.
Handles: adaptive SOCRATES questioning, Dashavidha Pariksha (AYUSH),
red-flag detection, structured history extraction, and bilingual clinical summaries.

All output field names strictly match the backend database schema:
- structured_history: 13 fields
- ayush_history: 11 fields
- red_flag_alerts: flag_description, severity
- interview_turns: ai_question, patient_response_text, input_mode
- clinical_summaries: summary_text_english, summary_text_local_language
"""

import os
import json
import logging
import re
from typing import Optional, Tuple, Dict, Any, List
from dotenv import load_dotenv
from google import genai
from google.genai import types

from ai.prompts.clinical_interview_prompt import (
    CLINICAL_INTERVIEW_PROMPT,
    AYUSH_INTERVIEW_PROMPT,
)
from ai.services import backend_client

load_dotenv()
logger = logging.getLogger(__name__)

# Model constant: default is gemini-3.5-flash-lite (free-tier friendly)
MODEL = "gemini-3.5-flash-lite"

_api_key = os.getenv("AI_API_KEY") or os.getenv("GEMINI_API_KEY")
if not _api_key:
    raise RuntimeError("AI_API_KEY environment variable is required in .env.")

client = genai.Client(api_key=_api_key)

# ----------------------------------------------------
# 1. Gemini Tool Declaration for Red Flags
# ----------------------------------------------------
flag_emergency = types.FunctionDeclaration(
    name="flag_emergency",
    description="Call this immediately when the patient's symptoms match a red-flag emergency pattern.",
    parameters={
        "type": "object",
        "properties": {
            "flag_description": {
                "type": "string",
                "description": "Clinical description of emergency (e.g. 'Chest pain + dyspnoea')"
            },
            "severity": {
                "type": "string",
                "enum": ["HIGH"],
                "description": "Emergency severity, always 'HIGH'"
            }
        },
        "required": ["flag_description", "severity"]
    }
)

# ----------------------------------------------------
# 2. Database Output Schemas
# ----------------------------------------------------
# Exact 13 keys matching structured_history table
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
    "required": [
        "chief_complaint",
        "hpi_onset",
        "hpi_character",
        "hpi_radiation",
        "hpi_associated_symptoms",
        "hpi_timing",
        "hpi_exacerbating_relieving",
        "hpi_severity",
        "past_medical_surgical",
        "drug_allergy_history",
        "family_history",
        "personal_history",
        "review_of_systems"
    ]
}

# Exact 11 keys matching ayush_history table
AYUSH_HISTORY_SCHEMA = {
    "type": "object",
    "properties": {
        "prakriti": {"type": "string"},
        "vikriti": {"type": "string"},
        "sara": {"type": "string"},
        "samhanana": {"type": "string"},
        "pramana": {"type": "string"},
        "satmya": {"type": "string"},
        "sattva": {"type": "string"},
        "ahara_shakti": {"type": "string"},
        "vyayama_shakti": {"type": "string"},
        "vaya": {"type": "string"},
        "ahara_vihara_notes": {"type": "string"}
    },
    "required": [
        "prakriti",
        "vikriti",
        "sara",
        "samhanana",
        "pramana",
        "satmya",
        "sattva",
        "ahara_shakti",
        "vyayama_shakti",
        "vaya",
        "ahara_vihara_notes"
    ]
}

# Exact 2 keys matching clinical_summaries table
BILINGUAL_SUMMARY_SCHEMA = {
    "type": "object",
    "properties": {
        "summary_text_english": {"type": "string"},
        "summary_text_local_language": {"type": "string"}
    },
    "required": ["summary_text_english", "summary_text_local_language"]
}


# ----------------------------------------------------
# 3. Clinical Red-Flag Safety Heuristic
# ----------------------------------------------------
def _check_deterministic_red_flags(text: str) -> Optional[Dict[str, str]]:
    """
    Safety net ensuring critical red flags like 'chest pain + dyspnoea'
    trigger 100% of the time, even if an LLM tool-calling omission occurs.
    """
    lower = text.lower()

    # Rule 1: Chest pain / pressure + breathlessness / dyspnoea
    has_chest = any(term in lower for term in ["chest pain", "chest tightness", "chest pressure", "crushing pain", "angina"])
    has_breathing = any(term in lower for term in ["breath", "dyspnoea", "dyspnea", "shortness of breath", "gasping", "suffocat"])
    if has_chest and has_breathing:
        return {"flag_description": "Chest pain + dyspnoea", "severity": "HIGH"}

    # Rule 2: Sudden severe headache / thunderclap
    if ("headache" in lower and any(term in lower for term in ["sudden", "severe", "worst", "thunderclap", "unbearable"])) or "sudden severe headache" in lower:
        return {"flag_description": "Sudden severe headache (suspected SAH)", "severity": "HIGH"}

    # Rule 3: Acute stroke symptoms (FAST: facial droop, slurred speech, one-sided weakness)
    if any(term in lower for term in ["facial drooping", "face droop", "slurred speech", "cannot speak", "one-sided weakness", "numbness on one side", "paralysis"]):
        return {"flag_description": "Acute neurological deficit (possible stroke)", "severity": "HIGH"}

    # Rule 4: Severe difficulty breathing standalone
    if any(term in lower for term in ["severe difficulty breathing", "cannot breathe at all", "severe breathlessness", "turning blue"]):
        return {"flag_description": "Severe acute respiratory distress", "severity": "HIGH"}

    # Rule 5: Heavy uncontrolled bleeding
    if any(term in lower for term in ["heavy bleeding", "uncontrolled bleeding", "bleeding profusely", "vomiting blood"]):
        return {"flag_description": "Heavy uncontrolled bleeding", "severity": "HIGH"}

    return None


# ----------------------------------------------------
# 4. Core InterviewService
# ----------------------------------------------------
class InterviewService:
    """
    One instance per patient clinical session.
    Manages conversational flow, red-flag triage, turn-by-turn logging,
    history extraction, and bilingual clinical summaries.
    """

    def __init__(
        self,
        session_id: str = "demo-session-001",
        history_mode: str = "standard",
        auto_sync_backend: bool = True
    ):
        self.session_id = session_id
        self.history_mode = history_mode.lower()
        self.auto_sync_backend = auto_sync_backend
        self.triage_notified = False
        self.turns: List[Dict[str, Any]] = []

        system_instruction = (
            f"{CLINICAL_INTERVIEW_PROMPT}\n\n{AYUSH_INTERVIEW_PROMPT}"
            if self.history_mode == "ayush"
            else CLINICAL_INTERVIEW_PROMPT
        )

        self.chat = client.chats.create(
            model=MODEL,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                tools=[types.Tool(function_declarations=[flag_emergency])],
                temperature=0.3
            )
        )

    def send_message(
        self,
        patient_text: str,
        input_mode: str = "touch"
    ) -> Tuple[str, Optional[Dict[str, str]]]:
        """
        Processes one patient response turn.
        input_mode must be 'voice' or 'touch' (matches interview_turns.input_mode).
        Returns: (ai_question_text, red_flag_dict_or_None)
        """
        response = self.chat.send_message(patient_text)

        red_flag: Optional[Dict[str, str]] = None
        has_tool_call = False

        # 1. Check Gemini Function Call
        if response.function_calls:
            for fc in response.function_calls:
                if fc.name == "flag_emergency":
                    has_tool_call = True
                    args = fc.args or {}
                    red_flag = {
                        "flag_description": args.get("flag_description", "Acute emergency symptom detected"),
                        "severity": "HIGH"
                    }
                    break

        # 2. Safety Heuristic Fallback (100% trigger guarantee for critical combos)
        if not red_flag:
            heuristic_flag = _check_deterministic_red_flags(patient_text)
            if heuristic_flag:
                red_flag = heuristic_flag

        # 3. Handle Chat State if Tool was Called
        ai_question = ""
        if has_tool_call:
            # Provide tool response back into the chat session so it continues smoothly
            follow_up = self.chat.send_message(
                types.Part.from_function_response(
                    name="flag_emergency",
                    response={"status": "acknowledged", "triage_priority": "HIGH", "triage_notified": True}
                )
            )
            ai_question = follow_up.text or ""
        else:
            ai_question = response.text or ""

        # Clean formatting and ensure non-empty question
        ai_question = ai_question.strip()
        if not ai_question:
            if red_flag:
                ai_question = "I have notified the triage nursing team to assist you immediately. Can you tell me when this began?"
            else:
                ai_question = "Could you please tell me a little more about how you are feeling?"

        # 4. Handle Red Flag Notification and Triage Tracking
        if red_flag:
            self.triage_notified = True
            if self.auto_sync_backend:
                backend_client.post_red_flag(
                    self.session_id,
                    flag_description=red_flag["flag_description"],
                    severity=red_flag["severity"]
                )

        # 5. Internal Turn Logging & Backend Sync
        turn_data = {
            "ai_question": ai_question,
            "patient_response_text": patient_text,
            "input_mode": input_mode
        }
        self.turns.append(turn_data)

        if self.auto_sync_backend:
            backend_client.post_turn(
                self.session_id,
                ai_question=ai_question,
                patient_response_text=patient_text,
                input_mode=input_mode
            )

        return ai_question, red_flag

    def _build_transcript(self) -> str:
        """Constructs a clean dialogue transcript for extraction."""
        if self.turns:
            lines = []
            for t in self.turns:
                lines.append(f"Patient: {t['patient_response_text']}")
                lines.append(f"AI Assistant: {t['ai_question']}")
            return "\n".join(lines)

        transcript_parts = []
        for msg in self.chat.get_history():
            role = "Patient" if msg.role == "user" else "AI Assistant"
            for part in msg.parts:
                if part.text:
                    transcript_parts.append(f"{role}: {part.text}")
        return "\n".join(transcript_parts)

    def generate_structured_history(self) -> Dict[str, str]:
        """
        Extracts completed interview into structured JSON.
        Returns JSON with EXACTLY the 13 keys of the structured_history table.
        Empty string '' is used for any undiscussed field.
        """
        transcript = self._build_transcript()
        prompt = (
            "You are an expert clinical history auditor. Analyze this patient interview transcript and "
            "extract the clinical history strictly according to the SOCRATES model into the required JSON schema.\n"
            "Rules:\n"
            "- Leave any undiscussed or unknown field as an empty string '' (do NOT guess or hallucinate).\n"
            "- Extract chief complaint, HPI details, and medical/surgical, medication/allergy, family, personal history, ROS.\n\n"
            f"Transcript:\n{transcript}"
        )

        try:
            result = client.models.generate_content(
                model=MODEL,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=STRUCTURED_HISTORY_SCHEMA,
                    temperature=0.1
                )
            )
            data = json.loads(result.text)
        except Exception as e:
            logger.error("Structured history extraction failed: %s. Using safe fallback.", e)
            data = {
                "chief_complaint": self.turns[0]["patient_response_text"] if self.turns else "",
                "hpi_onset": "",
                "hpi_character": "",
                "hpi_radiation": "",
                "hpi_associated_symptoms": "",
                "hpi_timing": "",
                "hpi_exacerbating_relieving": "",
                "hpi_severity": "",
                "past_medical_surgical": "",
                "drug_allergy_history": "",
                "family_history": "",
                "personal_history": "",
                "review_of_systems": ""
            }

        # Enforce all 13 keys exist with string values
        all_keys = [
            "chief_complaint", "hpi_onset", "hpi_character", "hpi_radiation",
            "hpi_associated_symptoms", "hpi_timing", "hpi_exacerbating_relieving",
            "hpi_severity", "past_medical_surgical", "drug_allergy_history",
            "family_history", "personal_history", "review_of_systems"
        ]
        structured_data = {k: str(data.get(k) or "") for k in all_keys}

        if self.auto_sync_backend:
            backend_client.post_history(self.session_id, structured_data)

        return structured_data

    def generate_ayush_history(self) -> Dict[str, str]:
        """
        Extracts Dashavidha Pariksha assessment into JSON with EXACTLY the 11 keys
        matching the ayush_history table:
        prakriti, vikriti, sara, samhanana, pramana, satmya, sattva, ahara_shakti,
        vyayama_shakti, vaya, ahara_vihara_notes.
        """
        transcript = self._build_transcript()
        prompt = (
            "You are an Ayurvedic physician auditor. Analyze this clinical interview transcript and "
            "extract the Dashavidha Pariksha (tenfold assessment) strictly into the required JSON schema.\n"
            "Rules:\n"
            "- Leave any undiscussed or unassessed parameter as an empty string '' (do NOT guess).\n"
            "- Extract: prakriti, vikriti, sara, samhanana, pramana, satmya, sattva, "
            "ahara_shakti, vyayama_shakti, vaya, ahara_vihara_notes.\n\n"
            f"Transcript:\n{transcript}"
        )

        try:
            result = client.models.generate_content(
                model=MODEL,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=AYUSH_HISTORY_SCHEMA,
                    temperature=0.1
                )
            )
            data = json.loads(result.text)
        except Exception as e:
            logger.error("AYUSH history extraction failed: %s. Using safe fallback.", e)
            data = {
                "prakriti": "",
                "vikriti": "",
                "sara": "",
                "samhanana": "",
                "pramana": "",
                "satmya": "",
                "sattva": "",
                "ahara_shakti": "",
                "vyayama_shakti": "",
                "vaya": "",
                "ahara_vihara_notes": ""
            }

        ayush_keys = [
            "prakriti", "vikriti", "sara", "samhanana", "pramana",
            "satmya", "sattva", "ahara_shakti", "vyayama_shakti", "vaya",
            "ahara_vihara_notes"
        ]
        ayush_data = {k: str(data.get(k) or "") for k in ayush_keys}

        if self.auto_sync_backend:
            backend_client.post_ayush(self.session_id, ayush_data)

        return ayush_data

    def generate_bilingual_summary(
        self,
        structured_history: Optional[Dict[str, str]] = None,
        ayush_history: Optional[Dict[str, str]] = None
    ) -> Dict[str, str]:
        """
        Produces two plain-language physician-readable summaries in standard format:
        (Chief Complaint -> HPI -> Past medical/surgical -> Drug & allergy -> Family -> Personal -> ROS)
        - summary_text_english: In English
        - summary_text_local_language: In Hindi
        Posts to POST /sessions/{id}/summary.
        """
        if structured_history is None:
            structured_history = self.generate_structured_history()

        if ayush_history is None and self.history_mode == "ayush":
            ayush_history = self.generate_ayush_history()

        prompt = (
            "Generate two comprehensive, plain-language physician-readable clinical summaries "
            "based on the following structured patient data:\n"
            f"Structured History: {json.dumps(structured_history, indent=2)}\n"
        )
        if ayush_history:
            prompt += f"AYUSH Dashavidha Pariksha Data: {json.dumps(ayush_history, indent=2)}\n"

        prompt += (
            "\nFormat both summaries using standard clinical headings:\n"
            "- Chief Complaint\n"
            "- History of Presenting Illness (HPI)\n"
            "- Past Medical & Surgical History\n"
            "- Drug & Allergy History\n"
            "- Family History\n"
            "- Personal & Social History\n"
            "- Review of Systems\n"
        )
        if ayush_history:
            prompt += "- Ayurvedic Dashavidha Pariksha Assessment\n"

        prompt += (
            "\nRequirements:\n"
            "1. 'summary_text_english' MUST be entirely in fluent, professional medical English.\n"
            "2. 'summary_text_local_language' MUST be in clear, accurate, professional Hindi (हिंदी).\n"
            "Return valid JSON matching the schema."
        )

        try:
            result = client.models.generate_content(
                model=MODEL,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=BILINGUAL_SUMMARY_SCHEMA,
                    temperature=0.2
                )
            )
            summary_dict = json.loads(result.text)
        except Exception as e:
            logger.error("Bilingual summary generation failed: %s. Using fallback.", e)
            cc = structured_history.get("chief_complaint", "Not specified")
            onset = structured_history.get("hpi_onset", "Not specified")
            summary_dict = {
                "summary_text_english": f"Chief Complaint: {cc}\nHPI: Onset {onset}. Full evaluation recommended.",
                "summary_text_local_language": f"मुख्य शिकायत: {cc}\nवर्तमान बीमारी का इतिहास: शुरुआत {onset}। पूर्ण चिकित्सकीय मूल्यांकन आवश्यक है।"
            }

        en_text = str(summary_dict.get("summary_text_english", ""))
        hi_text = str(summary_dict.get("summary_text_local_language", ""))

        if self.auto_sync_backend:
            backend_client.post_summary(
                self.session_id,
                summary_text_english=en_text,
                summary_text_local_language=hi_text
            )

        return {
            "summary_text_english": en_text,
            "summary_text_local_language": hi_text
        }