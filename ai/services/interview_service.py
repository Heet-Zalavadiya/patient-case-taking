"""
Core AI interview service for MediKiosk.

Integrated with the backend through its real HTTP API (see `ai/services/backend_client.py`,
which wraps the endpoints defined in `backend/routers/patients.py` and
`backend/routers/clinical.py`). No SQLAlchemy models, database drivers, or direct SQL
Server connections are used here -- this module is a normal API client and should be able
to run on any machine that can reach BACKEND_URL, independent of the backend's own
database configuration.

Patient demographics and pre-existing OCR medical data are fetched via:
  GET /sessions/{id}            -> patient_id, history_mode
  GET /patients/{id}            -> full_name, age, gender, preferred_language
  GET /patients/{id}/documents  -> extracted conditions / medications / abnormal lab values

Conversation turns, red flags, structured histories, and summaries are POSTed to the
backend's REST endpoints, matching the payload shapes in `backend/schemas/clinical.py`
exactly.
"""

import os
import json
import logging
from typing import Optional, Dict, Any, Tuple, Union, List

from dotenv import load_dotenv
load_dotenv()

from google import genai
from google.genai import types

try:
    from ai.services import backend_client  # type: ignore
except ImportError:
    import backend_client  # type: ignore

try:
    from ai.prompts.clinical_interview_prompt import CLINICAL_INTERVIEW_PROMPT, AYUSH_INTERVIEW_PROMPT  # type: ignore
except ImportError:
    from prompts.clinical_interview_prompt import CLINICAL_INTERVIEW_PROMPT, AYUSH_INTERVIEW_PROMPT  # type: ignore

logger = logging.getLogger(__name__)

MODEL = os.getenv("GEMINI_MODEL", "gemini-3.5-flash-lite")


def get_genai_client() -> genai.Client:
    """Returns an initialized Google GenAI client using environment variables."""
    key = os.getenv("AI_API_KEY") or os.getenv("GEMINI_API_KEY")
    if not key:
        raise RuntimeError(
            "AI_API_KEY or GEMINI_API_KEY environment variable is required."
        )
    return genai.Client(api_key=key)


# Tool declaration for emergency red flag triage
flag_emergency = types.FunctionDeclaration(
    name="flag_emergency",

    description="Call this immediately when the patient's symptoms match an acute red-flag emergency pattern.",
    parameters={
        "type": "object",
        "properties": {
        "required": ["flag_description", "severity"]
    }
    }
)

# 13 keys matching structured_history table
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
        "chief_complaint", "hpi_onset", "hpi_character", "hpi_radiation",
        "hpi_associated_symptoms", "hpi_timing", "hpi_exacerbating_relieving",
        "hpi_severity", "past_medical_surgical", "drug_allergy_history",
        "family_history", "personal_history", "review_of_systems"
    ]
}

# 11 keys matching ayush_history table (Dashavidha Pariksha)
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
        "prakriti", "vikriti", "sara", "samhanana", "pramana",
        "satmya", "sattva", "ahara_shakti", "vyayama_shakti", "vaya",
        "ahara_vihara_notes"
    ]
}


class InterviewService:
    """
    One instance per patient interview session.
    Talks to the backend exclusively through its HTTP API (`backend_client`).
    """

    def __init__(
        self,
        session_id: Union[int, str] = "unknown-session",
        history_mode: Optional[str] = None,
        auto_sync_backend: bool = True
    ):
        self.client = get_genai_client()
        self.session_id_raw = session_id
        self.session_loaded = False
        self.patient_id: Optional[int] = None
        self.history_mode = (history_mode or "allopathic").lower()
        self.auto_sync_backend = auto_sync_backend
        self.triage_notified = False
        self.turns: List[Dict[str, Any]] = []
        self.turn_number = 0

        # Patient demographics & pre-existing OCR medical data loaded from backend
        self.patient_name: str = "Patient"
        self.patient_age: Optional[int] = None
        self.patient_gender: Optional[str] = None
        self.preferred_language: str = "English"
        self.extracted_conditions: List[str] = []
        self.extracted_medications: List[str] = []
        self.abnormal_lab_values: List[str] = []

        # Load actual patient & session data from the backend API
        self._load_actual_backend_data()

        # Build prompt incorporating real patient profile and history_mode
        system_instruction = self._build_system_instruction()

        self.chat = self.client.chats.create(
            model=MODEL,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                tools=[types.Tool(function_declarations=[flag_emergency])]
            )
        )

    def _load_actual_backend_data(self):
        """
        Loads actual session, patient, and pre-extracted OCR document data from the
        backend's REST API. Silently skips (leaving defaults in place) if the session
        id isn't numeric or the backend can't be reached -- this keeps the module fully
        usable in offline/scripted tests (e.g. `_manual_test.py`).
        """
        numeric_id = None
        if isinstance(self.session_id_raw, int):
            numeric_id = self.session_id_raw
        elif isinstance(self.session_id_raw, str) and self.session_id_raw.isdigit():
            numeric_id = int(self.session_id_raw)

        if numeric_id is None:
            logger.info("Session ID '%s' is not numeric; skipping backend session lookup.", self.session_id_raw)
            return

        session_data = backend_client.get_session(numeric_id)
        if not session_data:
            logger.info("No session found on backend for session_id=%s (or backend unreachable).", numeric_id)
            return

        self.session_loaded = True
        self.patient_id = session_data.get("patient_id")
        if session_data.get("history_mode"):
            self.history_mode = str(session_data["history_mode"]).lower()

        if self.patient_id is None:
            return

        patient_data = backend_client.get_patient(self.patient_id)
        if patient_data:
            self.patient_name = patient_data.get("full_name") or self.patient_name
            self.patient_age = patient_data.get("age")
            self.patient_gender = patient_data.get("gender")
            self.preferred_language = patient_data.get("preferred_language") or "English"

        documents = backend_client.get_patient_documents(self.patient_id) or []
        for doc in documents:
            for cond in doc.get("conditions", []) or []:
                desc = cond.get("description")
                if desc and desc not in self.extracted_conditions:
                    self.extracted_conditions.append(desc)

            for med in doc.get("medications", []) or []:
                med_name = med.get("medicine_name")
                if not med_name:
                    continue
                dosage = med.get("dosage")
                med_desc = f"{med_name}" + (f" ({dosage})" if dosage else "")
                if med_desc not in self.extracted_medications:
                    self.extracted_medications.append(med_desc)

            for lab in doc.get("lab_values", []) or []:
                if not lab.get("is_abnormal"):
                    continue
                lab_desc = f"{lab.get('test_name', '')}: {lab.get('result_value') or ''} {lab.get('unit') or ''}".strip()
                if lab_desc not in self.abnormal_lab_values:
                    self.abnormal_lab_values.append(lab_desc)

        logger.info(
            "Successfully loaded actual backend patient profile: %s (ID: %s, Mode: %s)",
            self.patient_name, self.patient_id, self.history_mode
        )

    def _build_system_instruction(self) -> str:
        """Builds system instructions using actual patient details from backend."""
        base = AYUSH_INTERVIEW_PROMPT if self.history_mode == "ayush" else CLINICAL_INTERVIEW_PROMPT

        context_lines = [
            "\n--- ACTUAL PATIENT CONTEXT (FROM HOSPITAL DATABASE) ---",
            f"Patient Name: {self.patient_name}",
            f"Age: {self.patient_age if self.patient_age is not None else 'Not recorded'}",
            f"Gender: {self.patient_gender or 'Not recorded'}",
            f"Preferred Language: {self.preferred_language}",
            f"Assessment Mode: {self.history_mode.upper()}",
        ]

        if self.extracted_conditions:
            context_lines.append(f"Pre-existing Conditions (from OCR): {'; '.join(self.extracted_conditions)}")
        if self.extracted_medications:
            context_lines.append(f"Current Prescriptions (from OCR): {'; '.join(self.extracted_medications)}")
        if self.abnormal_lab_values:
            context_lines.append(f"Abnormal Lab Values (from OCR): {'; '.join(self.abnormal_lab_values)}")

        context_lines.append(
            f"Language directive: Communicate empathetically. If patient responds in {self.preferred_language}, "
            f"accommodate their preferred language while adhering to SOCRATES questioning guidelines."
        )

        return base + "\n" + "\n".join(context_lines)

    def send_message(self, patient_text: str, input_mode: str = "touch") -> Tuple[str, Optional[Dict[str, Any]]]:
        """
        Send one patient answer, get the AI's next question back.
        input_mode must be 'voice' or 'touch' (matches interview_turns.input_mode).
        Posts the turn and any red flag alerts to the backend over HTTP.
        Returns: (ai_question_text, red_flag_dict_or_None)
        """
        self.turn_number += 1
        response = self.chat.send_message(patient_text)

        red_flag = None
        if response.candidates and len(response.candidates) > 0:
            candidate = response.candidates[0]
            if candidate.content and candidate.content.parts:
                for part in candidate.content.parts:
                    if part.function_call and part.function_call.name == "flag_emergency":
                        args = part.function_call.args or {}
                        red_flag = {
                            "flag_description": args.get("flag_description"),
                            "severity": args.get("severity", "HIGH")
                        }

        # Deterministic clinical safety net heuristic for chest pain + breathlessness/dyspnoea
        lower_text = patient_text.lower()
        if not red_flag and ("chest pain" in lower_text and ("breath" in lower_text or "dyspnoea" in lower_text or "dyspnea" in lower_text)):
            red_flag = {
                "flag_description": "Acute chest pain with respiratory distress / dyspnoea",
                "severity": "HIGH"
            }

        ai_question = (response.text or "").strip()
        if not ai_question:
            ai_question = (
                "I have notified the triage nursing team to assist you immediately. "
                "Can you tell me when this began?"
                if red_flag else
                "Could you please tell me a little more about how you are feeling?"
            )

        if red_flag:
            self.triage_notified = True
            if self.auto_sync_backend:
                backend_client.post_red_flag(
                    self.session_id_raw,
                    flag_description=str(red_flag["flag_description"]),
                    severity=str(red_flag.get("severity", "HIGH")),
                    triage_notified=True,
                )

        turn_data = {
            "turn_number": self.turn_number,
            "ai_question": ai_question,
            "patient_response_text": patient_text,
            "input_mode": input_mode
        }
        self.turns.append(turn_data)

        if self.auto_sync_backend:
            backend_client.post_turn(
                self.session_id_raw,
                turn_number=self.turn_number,
                ai_question=ai_question,
                patient_response_text=patient_text,
                input_mode=input_mode,
                response_language=self.preferred_language,
            )

        return ai_question, red_flag

    def _transcript(self) -> str:
        transcript = ""
        history_items = self.chat.get_history()
        if history_items:
            for msg in history_items:
                role = "Patient" if msg.role == "user" else "Assistant"
                if msg.parts:
                    for part in msg.parts:
                        text_val = getattr(part, "text", None)
                        if text_val:
                            transcript += f"{role}: {text_val}\n"
        return transcript

    def generate_structured_history(self) -> Dict[str, Any]:
        """
        Extracts structured medical history matching the 13 columns of structured_history table.
        Posts the result to POST /sessions/{id}/history.
        """
        transcript = self._transcript()

        result = self.client.models.generate_content(
            model=MODEL,
            contents=(
                "Extract this patient interview into the structured schema. "
                "Leave fields as empty string if not discussed:\n\n" + transcript
            ),
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=STRUCTURED_HISTORY_SCHEMA
            )
        )
        response_text = result.text or "{}"
        history = json.loads(response_text)

        if self.auto_sync_backend:
            backend_client.post_history(self.session_id_raw, history)

        return history

    def generate_ayush_history(self) -> Dict[str, Any]:
        """
        Extracts Dashavidha Pariksha AYUSH history matching the 11 columns of ayush_history table.
        Posts the result to POST /sessions/{id}/ayush.
        """
        transcript = self._transcript()

        result = self.client.models.generate_content(
            model=MODEL,
            contents=(
                "Extract Ayurvedic Dashavidha Pariksha parameters from this interview. "
                "Leave fields as empty string if not discussed:\n\n" + transcript
            ),
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=AYUSH_HISTORY_SCHEMA
            )
        )
        response_text = result.text or "{}"
        ayush_history = json.loads(response_text)

        if self.auto_sync_backend:
            backend_client.post_ayush(self.session_id_raw, ayush_history)

        return ayush_history

    def generate_bilingual_summary(
        self,
        structured_history: Optional[Dict[str, Any]] = None,
        ayush_history: Optional[Dict[str, Any]] = None
    ) -> Dict[str, str]:
        """
        Generates professional physician clinical summaries in English and Hindi (local language).
        Posts the summary to POST /sessions/{id}/summary and marks the session completed.
        """
        transcript = self._transcript()

        prompt = f"""Based on the following patient interview transcript, generate two clinical summaries:
1. summary_text_english: Professional physician intake summary in English (Chief Complaint, HPI, Past Medical, Medications, Allergies, Family/Social History, Review of Systems).
2. summary_text_local_language: High-quality professional summary in Hindi matching the same clinical structure for bilingual clinical handover.

Transcript:
{transcript}

Return JSON with exact keys: "summary_text_english" and "summary_text_local_language".
"""
        schema = {
            "type": "object",
            "properties": {
                "summary_text_english": {"type": "string"},
                "summary_text_local_language": {"type": "string"}
            },
            "required": ["summary_text_english", "summary_text_local_language"]
        }

        result = self.client.models.generate_content(
            model=MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=schema
            )
        )
        response_text = result.text or "{}"
        summary = json.loads(response_text)

        if self.auto_sync_backend:
            self._sync_summary_to_backend(summary["summary_text_english"], summary["summary_text_local_language"])

        return summary

    def _sync_summary_to_backend(self, english_text: str, local_text: str):
        """Posts the clinical summary and marks the session completed via the backend API."""
        if self.patient_id is None:
            logger.warning(
                "Cannot post clinical summary: no patient_id resolved for session '%s' "
                "(session may not exist on the backend yet).", self.session_id_raw
            )
            return

        backend_client.post_summary(
            self.session_id_raw,
            patient_id=self.patient_id,
            summary_text_english=english_text,
            summary_text_local_language=local_text,
            status="draft",
        )
        backend_client.update_session_status(self.session_id_raw, status="completed")
        logger.info(
            "Posted Clinical Summary to backend (session_id=%s, patient_id=%s)",
            self.session_id_raw, self.patient_id
        )