"""
Backend Client for MediKiosk.

Thin wrapper around the real FastAPI backend's HTTP endpoints (see
`backend/routers/patients.py` and `backend/routers/clinical.py`), using the
`requests` library. This is the ONLY place in the `ai` module that talks to
the backend — `InterviewService` never imports SQLAlchemy models or opens a
database connection directly.

Base URL is loaded from the BACKEND_URL environment variable
(default: "http://localhost:8000").

Endpoints wrapped (names on the left match backend/routers/*.py exactly):
  GET  /sessions/{id}                -> SessionResponse (patient_id, history_mode, status, ...)
  GET  /patients/{id}                -> PatientResponse (full_name, age, gender, preferred_language, ...)
  GET  /patients/{id}/documents      -> List[MedicalDocumentDetailResponse] (+ medications/lab_values/conditions)
  POST /sessions/{id}/turns          -> {ai_question, patient_response_text, input_mode}
  POST /sessions/{id}/history        -> structured_history dict (unmodified)
  POST /sessions/{id}/ayush          -> ayush_history dict (unmodified)
  POST /sessions/{id}/red-flags      -> {flag_description, severity}
  POST /sessions/{id}/summary        -> {patient_id, summary_text_english, summary_text_local_language}

Every function catches network/connection errors (and non-2xx responses) and
logs a warning instead of raising, so the AI module stays testable standalone
even when the backend isn't running (e.g. `_manual_test.py` with a fake
session id).
"""

import os
import logging
from typing import Any, Dict, List, Optional, Union

import requests

logger = logging.getLogger(__name__)

BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000").rstrip("/")
REQUEST_TIMEOUT_SECONDS = 5


def _get(url: str) -> Optional[Any]:
    try:
        response = requests.get(url, timeout=REQUEST_TIMEOUT_SECONDS)
        if response.status_code == 200:
            return response.json()
        logger.warning("Backend returned status %s for GET %s: %s", response.status_code, url, response.text)
        return None
    except requests.exceptions.RequestException as e:
        logger.warning("Could not reach backend at GET %s: %s", url, e)
        return None


def _post(url: str, payload: Dict[str, Any]) -> Optional[Any]:
    try:
        response = requests.post(url, json=payload, timeout=REQUEST_TIMEOUT_SECONDS)
        if response.status_code in (200, 201):
            return response.json()
        logger.warning("Backend returned status %s for POST %s: %s", response.status_code, url, response.text)
        return None
    except requests.exceptions.RequestException as e:
        logger.warning("Could not reach backend at POST %s: %s", url, e)
        return None


# ── Reads (used to load real patient/session context) ─────────────────────────

def get_session(session_id: Union[str, int]) -> Optional[Dict[str, Any]]:
    """GET /sessions/{id} -> {session_id, patient_id, history_mode, status, ...}"""
    return _get(f"{BACKEND_URL}/sessions/{session_id}")


def get_patient(patient_id: Union[str, int]) -> Optional[Dict[str, Any]]:
    """GET /patients/{id} -> {patient_id, full_name, age, gender, preferred_language, ...}"""
    return _get(f"{BACKEND_URL}/patients/{patient_id}")


def get_patient_documents(patient_id: Union[str, int]) -> Optional[List[Dict[str, Any]]]:
    """GET /patients/{id}/documents -> [{..., medications: [...], lab_values: [...], conditions: [...]}]"""
    return _get(f"{BACKEND_URL}/patients/{patient_id}/documents")


# ── Writes ──────────────────────────────────────────────────────────────────

def post_turn(
    session_id: Union[str, int],
    turn_number: int,
    ai_question: str,
    patient_response_text: str,
    input_mode: str = "touch",
    response_language: Optional[str] = None,
) -> Optional[Dict[str, Any]]:
    """
    POST /sessions/{id}/turns -> {turn_number, input_mode, ai_question, patient_response_text, response_language}
    `turn_number` is REQUIRED by the backend's `InterviewTurnCreate` schema.
    """
    payload = {
        "turn_number": turn_number,
        "input_mode": input_mode,
        "ai_question": ai_question,
        "patient_response_text": patient_response_text,
        "response_language": response_language,
    }
    return _post(f"{BACKEND_URL}/sessions/{session_id}/turns", payload)


def post_history(session_id: Union[str, int], structured_history: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """POST /sessions/{id}/history -> structured_history dict (unmodified)."""
    return _post(f"{BACKEND_URL}/sessions/{session_id}/history", structured_history)


def post_ayush(session_id: Union[str, int], ayush_history: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """POST /sessions/{id}/ayush -> ayush_history dict (unmodified)."""
    return _post(f"{BACKEND_URL}/sessions/{session_id}/ayush", ayush_history)


def post_red_flag(
    session_id: Union[str, int],
    flag_description: str,
    severity: str = "HIGH",
    triage_notified: bool = True,
) -> Optional[Dict[str, Any]]:
    """POST /sessions/{id}/red-flags -> {flag_description, severity, triage_notified}"""
    payload = {
        "flag_description": flag_description,
        "severity": severity,
        "triage_notified": triage_notified,
    }
    return _post(f"{BACKEND_URL}/sessions/{session_id}/red-flags", payload)


def post_summary(
    session_id: Union[str, int],
    patient_id: Union[str, int],
    summary_text_english: str,
    summary_text_local_language: str,
    status: str = "draft",
) -> Optional[Dict[str, Any]]:
    """
    POST /sessions/{id}/summary -> {patient_id, summary_text_english, summary_text_local_language, status}

    NOTE: `patient_id` is REQUIRED by the backend's `ClinicalSummaryCreate` schema
    (backend/schemas/clinical.py). Omitting it causes a 422 Unprocessable Entity.
    """
    payload = {
        "patient_id": patient_id,
        "summary_text_english": summary_text_english,
        "summary_text_local_language": summary_text_local_language,
        "status": status,
    }
    return _post(f"{BACKEND_URL}/sessions/{session_id}/summary", payload)


def update_session_status(session_id: Union[str, int], status: str) -> Optional[Dict[str, Any]]:
    """PATCH /sessions/{id} -> {status}. Marks a session completed/abandoned."""
    try:
        response = requests.patch(
            f"{BACKEND_URL}/sessions/{session_id}",
            json={"status": status},
            timeout=REQUEST_TIMEOUT_SECONDS,
        )
        if response.status_code == 200:
            return response.json()
        logger.warning(
            "Backend returned status %s for PATCH /sessions/%s: %s",
            response.status_code, session_id, response.text
        )
        return None
    except requests.exceptions.RequestException as e:
        logger.warning("Could not reach backend at PATCH /sessions/%s: %s", session_id, e)
        return None
