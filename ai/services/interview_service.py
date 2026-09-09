"""
Core AI interview service.
Handles: adaptive SOCRATES questioning, red-flag detection, structured history extraction.
Output field names MUST exactly match the structured_history / red_flag_alerts tables —
"""

import os

import json
from google import genai
from google.genai import types
from ai.prompts.clinical_interview_prompt import CLINICAL_INTERVIEW_PROMPT

client = genai.Client(api_key='AQ.Ab8RN6JUQtpd5INWeG0uZt0cyGneZIGR2iFruz5UgFjNhqvJ7A')
                      #os.environ["AI_API_KEY"])
MODEL = "gemini-3.5-flash-lite" 

flag_emergency = types.FunctionDeclaration(
    name="flag_emergency",
    description="Call this immediately when the patient's symptoms match a red-flag emergency pattern.",
    parameters={
        "type": "object",
        "properties": {
            "flag_description": {"type": "string", "description": "e.g. 'Chest pain + dyspnoea'"},
            "severity": {"type": "string", "enum": ["HIGH"]}
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


class InterviewService:
    """One instance per patient session (maps to one clinical_sessions row)."""

    def __init__(self):
        self.chat = client.chats.create(
            model=MODEL,
            config=types.GenerateContentConfig(
                system_instruction=CLINICAL_INTERVIEW_PROMPT,
                tools=[types.Tool(function_declarations=[flag_emergency])]
            )
        )
        self.turns = [] 

    def send_message(self, patient_text: str, input_mode: str = "touch"):
        """
        Send one patient answer, get the AI's next question back.
        input_mode must be 'voice' or 'touch' (matches interview_turns.input_mode).
        Returns: (ai_question_text, red_flag_dict_or_None)
        """
        response = self.chat.send_message(patient_text)

        red_flag = None
        for part in response.candidates[0].content.parts:
            if part.function_call and part.function_call.name == "flag_emergency":
                args = part.function_call.args
                red_flag = {
                    "flag_description": args.get("flag_description"),
                    "severity": args.get("severity", "HIGH")
                }

        ai_question = response.text or ""

        self.turns.append({
            "ai_question": ai_question,
            "patient_response_text": patient_text,
            "input_mode": input_mode
        })

        return ai_question, red_flag

    def generate_structured_history(self) -> dict:
        """
        Call at the end of the interview. Returns a dict matching structured_history
        column names exactly, ready for Member 3's POST /sessions/{id}/history.
        """
        transcript = ""
        for msg in self.chat.get_history():
            role = "Patient" if msg.role == "user" else "Assistant"
            for part in msg.parts:
                if part.text:
                    transcript += f"{role}: {part.text}\n"

        result = client.models.generate_content(
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
        
        return json.loads(result.text)

# ADD THIS AT THE VERY BOTTOM OF interview_service.py:
# if __name__ == "__main__":
#     print("Initializing InterviewService...")
#     service = InterviewService()
#     print("Service initialized successfully!")
    
#     # Test sending a message
#     question, flag = service.send_message("I have a severe chest pain and cannot breathe.")
#     print("AI Response / Next Question:", question)
#     print("Red Flag Triggered:", flag)
