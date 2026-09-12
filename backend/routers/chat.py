import asyncio
import hashlib
import json
import logging
import os
import re
from typing import Any, Dict, List, Optional, Tuple

# Enable native Windows and system SSL truststore if available
try:
    import truststore
    truststore.inject_into_ssl()
except ImportError:
    pass

from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field

import google.generativeai as genai
import requests
import urllib3
urllib3.disable_warnings()

from services import sarvam_service

# Setup logging
logger = logging.getLogger("medikiosk.chat")

# Load environment
load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()

router = APIRouter(tags=["Chatbot"])

# System Prompt restricting model behavior to MediKiosk kiosk scope
SYSTEM_INSTRUCTION = """
You are "MediKiosk Assistant", an AI assistant running on a hospital touch-screen kiosk named "MediKiosk".
Your sole purpose is to help hospital visitors, patients, and families with kiosk navigation, hospital logistics, timings, and general health queries.

You must strictly adhere to the following operational boundaries and rules:

1. ALLOWED TOPICS:
   - General health information (strictly non-diagnostic and educational).
   - Hospital timings, departments, and doctor availability (use the hospital data provided below).
   - Guidance on booking an appointment (instruct the user to tap the "Save Details & Proceed" / "Book Appointment" button on the kiosk screen or proceed to Registration Counter 2).
   - General FAQs regarding facilities, pharmacy, lab collection, wheelchair assistance, and visitor rules.

2. HOSPITAL SCHEDULE & DEPARTMENTS (Reference Data):
   - OPD Timings: Monday to Saturday, 8:00 AM - 4:00 PM (Lunch break: 1:00 PM - 2:00 PM). Closed on Sundays (Emergency open 24x7).
   - Departments:
     * General Medicine (OPD Rooms 101-105) - Dr. Sharma, Dr. Verma (Available 9:00 AM - 2:00 PM)
     * Pediatrics & Child Care (OPD Room 108) - Dr. Ananya Sen (Available 10:00 AM - 3:00 PM)
     * Cardiology (OPD Room 202) - Dr. R. K. Mehta (Available Mon, Wed, Fri 11:00 AM - 3:00 PM)
     * Orthopedics & Joint Clinic (OPD Room 205) - Dr. Vikram Patil (Available 9:00 AM - 1:00 PM)
     * AYUSH & Integrative Medicine (Wellness Block B) - Dr. Rajeshwari (Available 9:00 AM - 4:00 PM)
   - Facilities:
     * 24x7 Pharmacy: Ground Floor, Near Main Entrance
     * Diagnostic & Blood Collection: Room 112 (Open 7:00 AM - 6:00 PM)
     * Emergency & Casualty: Gate 1, Open 24 Hours, 365 Days
     * Wheelchair & Stretcher Support: Help Desk Counter 1

3. CRITICAL EMERGENCY PROTOCOL (HIGHEST PRIORITY):
   - If the user mentions ANY emergency-related condition, including:
     * Chest pain, heart attack sensations, pressure in chest
     * Severe shortness of breath, cannot breathe
     * Unconscious, fainting, unresponsive, seizures
     * Severe bleeding, deep trauma, severe burns
     * Stroke symptoms (facial drooping, slurred speech, arm weakness)
     * Suicidal thoughts or self-harm
   - You MUST IMMEDIATELY respond with an urgent, direct instruction to seek emergency care:
     "EMERGENCY ALERT: Please go directly to the hospital Emergency Room (Gate 1 / Casualty) immediately or call 108 / 112 for emergency medical services. Do not wait."
   - SKIP all other conversation, do not suggest booking an appointment, and do not provide self-help remedies.

4. MEDICAL DIAGNOSIS & PRESCRIPTION RESTRICTION (STRICT):
   - You must NEVER diagnose any disease or medical condition.
   - You must NEVER prescribe medicines, dosage, or recommend specific medical treatments.
   - If the user describes any physical symptoms (e.g. fever, headache, stomach ache, rash, cough), provide brief empathetic context and politely instruct them to consult a doctor:
     "I am an automated assistant and cannot provide medical diagnosis or prescribe medicine. Please fill your details on this screen and proceed, or visit Counter 2 to consult an OPD physician."

5. TONE & STYLE:
   - Be concise, polite, helpful, and easily readable on a kiosk touchscreen.
   - Keep answers clear and formatted with bullet points.
""".strip()


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, description="User's input text message")
    history: Optional[List[Dict[str, Any]]] = Field(
        default=[],
        description="List of prior turns [{role: 'user'|'model', content: '...'}]"
    )
    patient_id: Optional[int] = Field(None, description="Authenticated patient ID")
    patient_name: Optional[str] = Field(None, description="Authenticated patient full name")

class ChatResponse(BaseModel):
    reply: str


class ValidateComplaintRequest(BaseModel):
    text: str = Field(..., min_length=1, description="Patient input text to validate")


class ValidateComplaintResponse(BaseModel):
    is_valid: bool
    status: str  # "VALID" or "INVALID"
    confidence: Optional[str] = "gemini"
    normalized_text: Optional[str] = None
    detected_language: Optional[str] = None


class DoctorSummaryRequest(BaseModel):
    patient_id: Optional[str] = None
    patient_data: Dict[str, Any] = Field(..., description="Full patient intake data JSON")


class DoctorSummaryResponse(BaseModel):
    patient_id: Optional[str] = None
    one_line_summary: str = Field(..., description="1-line chief complaint summary for queue")
    summary_bullets: List[str] = Field(..., description="3-5 concise bullet points")
    cached: bool = False
    source: str = "gemini"  # "gemini" | "cache" | "fallback"


def format_history_for_gemini(raw_history: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    gemini_history: List[Dict[str, Any]] = []

    for item in raw_history:
        if not isinstance(item, dict):
            continue

        raw_role = str(item.get("role", "user")).lower()
        gemini_role = "model" if raw_role in ["model", "assistant", "bot", "system"] else "user"

        text = ""
        if "parts" in item and isinstance(item["parts"], list) and len(item["parts"]) > 0:
            text = str(item["parts"][0])
        elif "content" in item:
            text = str(item["content"])
        elif "text" in item:
            text = str(item["text"])
        elif "message" in item:
            text = str(item["message"])

        text = text.strip()
        if not text:
            continue

        if gemini_history and gemini_history[-1]["role"] == gemini_role:
            gemini_history[-1]["parts"][0] += f"\n{text}"
        else:
            gemini_history.append({"role": gemini_role, "parts": [text]})

    while gemini_history and gemini_history[0]["role"] != "user":
        gemini_history.pop(0)

    return gemini_history


def emergency_precheck(message: str) -> Optional[str]:
    lower = message.lower()
    emergency_keywords = [
        "chest pain", "heart attack", "can't breathe", "cannot breathe",
        "trouble breathing", "severe bleeding", "bleeding heavily",
        "unconscious", "passed out", "seizure", "suicide", "kill myself",
        "stroke", "facial drop"
    ]
    for kw in emergency_keywords:
        if kw in lower:
            return (
                "🚨 EMERGENCY ALERT: If you or someone with you is experiencing a medical emergency "
                "(such as chest pain, severe breathing distress, heavy bleeding, or unconsciousness), "
                "please proceed DIRECTLY to the hospital Emergency Room (Casualty - Gate 1) right now "
                "or call emergency helpline 108 / 112 immediately."
            )
    return None


@router.post("/api/chat", response_model=ChatResponse)
@router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(body: ChatRequest):
    user_msg = body.message.strip()
    if not user_msg:
        raise HTTPException(status_code=400, detail="Message cannot be empty.")

    # Emergency check (highest priority safety override)
    immediate_alert = emergency_precheck(user_msg)
    if immediate_alert:
        return ChatResponse(reply=immediate_alert)

    # Authentication validation: Only registered/logged-in patients can use the assistant
    if not body.patient_id or body.patient_id <= 0:
        return ChatResponse(
            reply="🔒 Access Restricted: The MediKiosk Assistant is reserved for authenticated patients. Please complete the registration or login step on the kiosk screen first."
        )

    current_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not current_key or current_key == "your_key_here":
        return ChatResponse(
            reply="Welcome to MediKiosk! Please configure your GEMINI_API_KEY in the backend `.env` file to activate AI responses. OPD is open 8 AM - 4 PM Mon-Sat. Please fill your details on this screen to proceed."
        )

    def _execute_gemini_turn() -> str:
        genai.configure(api_key=current_key, transport="rest")
        candidate_models = [
            os.getenv("GEMINI_MODEL", "gemini-3.6-flash"),
            "gemini-3.6-flash",
            "gemini-flash-latest"
        ]
        candidate_models = list(dict.fromkeys(candidate_models))

        last_err = None
        for candidate in candidate_models:
            try:
                model = genai.GenerativeModel(
                    model_name=candidate,
                    system_instruction=SYSTEM_INSTRUCTION
                )
                formatted_history = format_history_for_gemini(body.history or [])
                chat = model.start_chat(history=formatted_history)
                response = chat.send_message(user_msg)
                if response and response.text:
                    return response.text.strip()
            except Exception as e:
                last_err = e
                logger.warning(f"Model '{candidate}' error: {e}. Trying next...")
                continue

        if last_err:
            raise last_err
        return "I am here to assist you. How can I help with hospital timings or booking an appointment?"

    try:
        reply_text = await asyncio.to_thread(_execute_gemini_turn)
        return ChatResponse(reply=reply_text or "I am here to assist you.")
    except Exception as exc:
        logger.error(f"Chat execution error: {exc}", exc_info=True)
        return ChatResponse(
            reply=(
                "I apologize, but I am momentarily experiencing network difficulty connecting to the assistant. "
                "OPD Timings are Mon-Sat 8:00 AM - 4:00 PM. "
                "Please fill in your details on this screen to proceed with consultation, or visit Help Desk Counter 1."
            )
        )


@router.post("/api/validate-complaint", response_model=ValidateComplaintResponse)
@router.post("/validate-complaint", response_model=ValidateComplaintResponse)
@router.post("/api/chat/validate-complaint", response_model=ValidateComplaintResponse)
async def validate_complaint_endpoint(body: ValidateComplaintRequest):
    patient_input = body.text.strip()
    if not patient_input:
        return ValidateComplaintResponse(is_valid=False, status="INVALID")

    # ── 1. Sarvam AI Pre-Processing Layer (Indian Language Normalization) ───────
    sarvam_normalized = None
    sarvam_lang = None
    if sarvam_service.is_sarvam_enabled():
        try:
            sarvam_res = await sarvam_service.normalize_and_translate(
                text=patient_input,
                source_language="auto",
                target_language="en-IN"
            )
            if sarvam_res.get("success"):
                sarvam_normalized = sarvam_res.get("normalized_text")
                sarvam_lang = sarvam_res.get("source_language_code")
                logger.info(f"[Sarvam Normalizer] '{patient_input}' (detected {sarvam_lang}) -> '{sarvam_normalized}'")
        except Exception as norm_err:
            logger.warning(f"[Sarvam Normalizer] Fallback to direct Gemini: {norm_err}")

    # ── 2. Construct Validation Prompt for Gemini ──────────────────────────────
    if sarvam_normalized and sarvam_normalized.strip().lower() != patient_input.strip().lower():
        prompt = f"""You are a medical intake validation assistant. The following text was entered by a patient in response to "What problem or health issue are you having today?"

Original Patient Text: "{patient_input}"
Sarvam Indian-Language Normalization / English Translation: "{sarvam_normalized}"

Determine if this text describes a real symptom, illness, pain, or health concern (in any language, including Hindi, Gujarati, English, or mixed/Hinglish).

Respond with ONLY one word: "VALID" if it describes a genuine health complaint, or "INVALID" if it is unrelated to health (e.g. random words, sports, objects, gibberish, testing text, or anything not describing a symptom or medical issue)."""
    else:
        prompt = f"""You are a medical intake validation assistant. The following text was entered by a patient in response to "What problem or health issue are you having today?"

Text: "{patient_input}"

Determine if this text describes a real symptom, illness, pain, or health concern (in any language, including Hindi, Gujarati, English, or mixed/Hinglish).

Respond with ONLY one word: "VALID" if it describes a genuine health complaint, or "INVALID" if it is unrelated to health (e.g. random words, sports, objects, gibberish, testing text, or anything not describing a symptom or medical issue)."""

    current_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not current_key or current_key == "your_key_here":
        logger.warning("GEMINI_API_KEY not configured. Allowing input through (fail open).")
        return ValidateComplaintResponse(
            is_valid=True,
            status="VALID",
            confidence="fallback_no_key",
            normalized_text=sarvam_normalized,
            detected_language=sarvam_lang
        )

    def _call_gemini() -> str:
        candidate_models = [
            os.getenv("GEMINI_MODEL", "gemini-3.5-flash-lite"),
            "gemini-3.5-flash-lite",
            "gemini-3.6-flash",
            "gemini-flash-latest"
        ]
        candidate_models = list(dict.fromkeys(candidate_models))

        # 1. Direct HTTPS REST with requests (bypasses Windows OpenSSL missing CA store)
        for candidate in candidate_models:
            try:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{candidate}:generateContent?key={current_key}"
                payload = {"contents": [{"parts": [{"text": prompt}]}]}
                r = requests.post(url, json=payload, timeout=8, verify=False)
                if r.status_code == 200:
                    data = r.json()
                    candidates = data.get("candidates", [])
                    if candidates:
                        parts = candidates[0].get("content", {}).get("parts", [])
                        if parts and "text" in parts[0]:
                            return parts[0]["text"].strip()
                else:
                    logger.warning(f"REST Gemini model '{candidate}' status {r.status_code}: {r.text[:100]}")
            except Exception as req_err:
                logger.warning(f"REST Gemini model '{candidate}' failed: {req_err}")

        # 2. Fallback to google.generativeai SDK
        genai.configure(api_key=current_key, transport="rest")
        last_err = None
        for candidate in candidate_models:
            try:
                model = genai.GenerativeModel(model_name=candidate)
                response = model.generate_content(prompt)
                if response and response.text:
                    return response.text.strip()
            except Exception as e:
                last_err = e
                logger.warning(f"SDK Gemini model '{candidate}' error: {e}. Trying next...")
                continue

        if last_err:
            raise last_err
        return "VALID"

    try:
        raw_res = ""
        for attempt in range(2):
            try:
                raw_res = await asyncio.to_thread(_call_gemini)
                break
            except Exception as err:
                if attempt == 0:
                    logger.warning(f"Gemini complaint validation attempt 1 failed: {err}. Retrying once...")
                    await asyncio.sleep(0.5)
                else:
                    raise err

        cleaned = raw_res.strip().upper()
        logger.info(f"Gemini complaint validation result for '{patient_input[:40]}': {cleaned}")

        if "INVALID" in cleaned:
            return ValidateComplaintResponse(
                is_valid=False,
                status="INVALID",
                normalized_text=sarvam_normalized,
                detected_language=sarvam_lang
            )
        return ValidateComplaintResponse(
            is_valid=True,
            status="VALID",
            normalized_text=sarvam_normalized,
            detected_language=sarvam_lang
        )

    except Exception as exc:
        logger.error(f"Gemini complaint validation failed after retry: {exc}. Allowing input through (fail open).", exc_info=True)
        # Fail open as per prompt requirements: never block patient on API failure
        return ValidateComplaintResponse(
            is_valid=True,
            status="VALID",
            confidence="fail_open",
            normalized_text=sarvam_normalized,
            detected_language=sarvam_lang
        )


# ── AI Doctor Case Summary with Caching ──────────────────────────────────────────
_DOCTOR_SUMMARY_CACHE: Dict[str, DoctorSummaryResponse] = {}


def generate_heuristic_summary(patient_data: Dict[str, Any]) -> Tuple[str, List[str]]:
    """Deterministic, high-quality clinical fallback summary if Gemini hits rate limits or network issues."""
    chief = (
        patient_data.get("chief_complaint")
        or patient_data.get("demo_chief_complaint")
        or patient_data.get("hpi_onset")
        or "General medical case consultation"
    )
    # Clean 1-liner
    one_liner = str(chief).replace("\n", " ").strip()
    if len(one_liner) > 115:
        one_liner = one_liner[:112] + "..."

    bullets: List[str] = []
    # 1. Chief Complaint
    bullets.append(f"Chief Complaint: {chief}")

    # 2. Pain Location & Severity
    pain_locs = patient_data.get("pain_locations") or patient_data.get("painLocations") or []
    if pain_locs:
        loc_str = ", ".join(pain_locs) if isinstance(pain_locs, list) else str(pain_locs)
        bullets.append(f"Pain Location: Pinpointed at {loc_str}")

    socrates = patient_data.get("socrates_answers") or patient_data.get("interview_turns") or []
    severity_item = next(
        (s for s in socrates if "severity" in str(s).lower() or "score" in str(s).lower() or "pain" in str(s).lower()),
        None
    )
    if severity_item:
        ans = severity_item.get("answer") or severity_item.get("patient_response_text") or str(severity_item)
        bullets.append(f"Pain Severity: {ans}")

    # 3. Emergency / Red Flags
    red_flags = patient_data.get("red_flags") or patient_data.get("alerts") or []
    if red_flags:
        rf_item = red_flags[0] if isinstance(red_flags, list) else red_flags
        rf_desc = rf_item.get("flag_description") if isinstance(rf_item, dict) else str(rf_item)
        bullets.append(f"Emergency Alert: {rf_desc}")
    else:
        bullets.append("Triage Status: Standard clinical priority; no critical red-flag vitals triggered")

    # 4. Relevant SOCRATES Answers (Onset/Duration)
    onset_item = next(
        (s for s in socrates if "onset" in str(s).lower() or "duration" in str(s).lower() or "when" in str(s).lower()),
        None
    )
    if onset_item:
        ans = onset_item.get("answer") or onset_item.get("patient_response_text") or str(onset_item)
        bullets.append(f"Onset & Duration: {ans}")
    elif patient_data.get("hpi_onset"):
        bullets.append(f"Onset & Duration: {patient_data['hpi_onset']}")

    # 5. Vitals / Notable details
    vitals = patient_data.get("vitals_summary") or patient_data.get("vitals")
    if vitals and isinstance(vitals, dict):
        bullets.append(
            f"Triage Vitals: BP {vitals.get('bp', '120/80')}, Pulse {vitals.get('pulse', '76 bpm')}, SpO2 {vitals.get('spo2', '98%')}"
        )
    elif patient_data.get("hpi_associated_symptoms"):
        symptoms = patient_data["hpi_associated_symptoms"]
        if isinstance(symptoms, list) and symptoms:
            bullets.append(f"Associated Symptoms: {', '.join(symptoms[:3])}")

    return one_liner, bullets[:5]


def parse_gemini_summary(text: str, patient_data: Dict[str, Any]) -> Tuple[str, List[str]]:
    one_line = ""
    bullets: List[str] = []

    for line in text.splitlines():
        trimmed = line.strip()
        if not trimmed:
            continue
        if trimmed.upper().startswith("ONE_LINE:"):
            one_line = trimmed[len("ONE_LINE:"):].strip()
        elif trimmed.startswith(("-", "*", "•")) or re.match(r"^\d+\.\s*", trimmed):
            clean_bullet = re.sub(r"^([-\*•]|\d+\.)\s*", "", trimmed).strip()
            if clean_bullet and not clean_bullet.upper().startswith("BULLETS:"):
                bullets.append(clean_bullet)

    if not one_line and bullets:
        one_line = bullets[0]

    if not one_line or len(bullets) < 2:
        h_one, h_bullets = generate_heuristic_summary(patient_data)
        if not one_line:
            one_line = h_one
        if len(bullets) < 2:
            bullets = h_bullets

    return one_line, bullets[:5]


@router.post("/api/doctor/summarize-patient", response_model=DoctorSummaryResponse)
@router.post("/doctor/summarize-patient", response_model=DoctorSummaryResponse)
async def summarize_patient_endpoint(body: DoctorSummaryRequest):
    """
    Summarize a patient's intake data before doctor consultation into 3-5 concise bullet points
    and a 1-line chief complaint summary for queue cards. Caches responses to prevent redundant API calls.
    """
    patient_data = body.patient_data or {}
    patient_id = str(body.patient_id or patient_data.get("patient_id") or "default")

    # Generate deterministic hash of underlying intake data
    serialized_data = json.dumps(patient_data, sort_keys=True, default=str)
    cache_key = f"{patient_id}_{hashlib.sha256(serialized_data.encode('utf-8')).hexdigest()}"

    # Check cache (Requirement: Don't regenerate on every screen visit)
    if cache_key in _DOCTOR_SUMMARY_CACHE:
        cached_item = _DOCTOR_SUMMARY_CACHE[cache_key]
        return DoctorSummaryResponse(
            patient_id=patient_id,
            one_line_summary=cached_item.one_line_summary,
            summary_bullets=cached_item.summary_bullets,
            cached=True,
            source="cache"
        )

    current_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not current_key or current_key == "your_key_here":
        # Heuristic fallback if no key
        h_one, h_bullets = generate_heuristic_summary(patient_data)
        resp = DoctorSummaryResponse(
            patient_id=patient_id,
            one_line_summary=h_one,
            summary_bullets=h_bullets,
            cached=False,
            source="fallback_no_key"
        )
        _DOCTOR_SUMMARY_CACHE[cache_key] = resp
        return resp

    prompt = f"""You are assisting a doctor by summarizing a patient's intake data before their consultation.

Patient intake data:
{serialized_data}

Write a concise clinical summary in 3-5 short bullet points covering:
- Chief complaint (main problem in patient's words, translated to English if needed)
- Pain location and severity/duration if mentioned
- Any red-flag/emergency symptoms flagged during intake
- Relevant answers from the SOCRATES questions (onset, character, associated symptoms, etc.)
- Any other notable details a doctor should see first

Keep it short, clinical, and scannable. Do not diagnose or suggest treatment — only summarize what the patient reported.

Format your response strictly as:
ONE_LINE: <A single concise sentence summarizing the chief complaint>
BULLETS:
- <bullet 1>
- <bullet 2>
- <bullet 3>
- <bullet 4 (optional)>
- <bullet 5 (optional)>"""

    def _call_gemini_summary() -> str:
        genai.configure(api_key=current_key, transport="rest")
        candidate_models = [
            os.getenv("GEMINI_MODEL", "gemini-3.6-flash"),
            "gemini-3.6-flash",
            "gemini-flash-latest"
        ]
        candidate_models = list(dict.fromkeys(candidate_models))

        last_err = None
        for candidate in candidate_models:
            try:
                model = genai.GenerativeModel(model_name=candidate)
                response = model.generate_content(prompt)
                if response and response.text:
                    return response.text.strip()
            except Exception as e:
                last_err = e
                logger.warning(f"Doctor summary model '{candidate}' error: {e}. Trying next...")
                continue

        if last_err:
            raise last_err
        raise RuntimeError("No model response generated")

    try:
        raw_text = ""
        for attempt in range(2):
            try:
                raw_text = await asyncio.to_thread(_call_gemini_summary)
                break
            except Exception as e:
                if attempt == 0:
                    logger.warning(f"Doctor summary attempt 1 failed: {e}. Retrying once...")
                    await asyncio.sleep(0.5)
                else:
                    raise e

        one_line, bullets = parse_gemini_summary(raw_text, patient_data)
        resp = DoctorSummaryResponse(
            patient_id=patient_id,
            one_line_summary=one_line,
            summary_bullets=bullets,
            cached=False,
            source="gemini"
        )
        _DOCTOR_SUMMARY_CACHE[cache_key] = resp
        return resp

    except Exception as exc:
        logger.warning(f"Gemini summary generation failed: {exc}. Using intelligent clinical fallback.", exc_info=False)
        h_one, h_bullets = generate_heuristic_summary(patient_data)
        resp = DoctorSummaryResponse(
            patient_id=patient_id,
            one_line_summary=h_one,
            summary_bullets=h_bullets,
            cached=False,
            source="fallback"
        )
        _DOCTOR_SUMMARY_CACHE[cache_key] = resp
        return resp


