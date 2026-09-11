"""
Backend Client for MediKiosk.
Thin wrapper functions for FastAPI backend endpoints using `requests`.
Base URL is loaded from BACKEND_URL (default: "http://localhost:8000").

Endpoints wrapped:
  POST /sessions/{id}/turns     -> {ai_question, patient_response_text, input_mode}
  POST /sessions/{id}/history   -> structured_history dict (unmodified)
  POST /sessions/{id}/ayush     -> ayush_history dict (unmodified)
  POST /sessions/{id}/red-flags -> {flag_description, severity}
  POST /sessions/{id}/summary   -> {summary_text_english, summary_text_local_language}

Every function catches network/connection errors and logs a warning instead of raising,
ensuring the AI module remains completely testable standalone even before the backend is running.
"""

import os
import logging
from typing import Optional, Dict, Any, Union
import requests

logger = logging.getLogger(__name__)

BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000").rstrip("/")


def post_turn(
    session_id: Union[str, int],
    ai_question: str,
    patient_response_text: str,
    input_mode: str = "touch"
) -> Optional[Dict[str, Any]]:
    """
    Log an interview turn.
    POST /sessions/{id}/turns -> {ai_question, patient_response_text, input_mode}
    """
    url = f"{BACKEND_URL}/sessions/{session_id}/turns"
    payload = {
        "ai_question": ai_question,
        "patient_response_text": patient_response_text,
        "input_mode": input_mode
    }
    try:
        response = requests.post(url, json=payload, timeout=5)
        if response.status_code in (200, 201):
            return response.json()
        logger.warning(
            "Backend returned status %s for POST %s: %s",
            response.status_code, url, response.text
        )
        return None
    except requests.exceptions.RequestException as e:
        logger.warning("Could not reach backend at POST %s: %s", url, e)
        return None


def post_history(
    session_id: Union[str, int],
    structured_history: Dict[str, Any]
) -> Optional[Dict[str, Any]]:
    """
    Save the completed structured clinical history.
    POST /sessions/{id}/history -> structured_history dict (unmodified)
    """
    url = f"{BACKEND_URL}/sessions/{session_id}/history"
    try:
        response = requests.post(url, json=structured_history, timeout=5)
        if response.status_code in (200, 201):
            return response.json()
        logger.warning(
            "Backend returned status %s for POST %s: %s",
            response.status_code, url, response.text
        )
        return None
    except requests.exceptions.RequestException as e:
        logger.warning("Could not reach backend at POST %s: %s", url, e)
        return None


def post_ayush(
    session_id: Union[str, int],
    ayush_history: Dict[str, Any]
) -> Optional[Dict[str, Any]]:
    """
    Save the Dashavidha Pariksha AYUSH history.
    POST /sessions/{id}/ayush -> ayush_history dict (unmodified)
    """
    url = f"{BACKEND_URL}/sessions/{session_id}/ayush"
    try:
        response = requests.post(url, json=ayush_history, timeout=5)
        if response.status_code in (200, 201):
            return response.json()
        logger.warning(
            "Backend returned status %s for POST %s: %s",
            response.status_code, url, response.text
        )
        return None
    except requests.exceptions.RequestException as e:
        logger.warning("Could not reach backend at POST %s: %s", url, e)
        return None


def post_red_flag(
    session_id: Union[str, int],
    flag_description: str,
    severity: str = "HIGH"
) -> Optional[Dict[str, Any]]:
    """
    Post an emergency triage red-flag alert.
    POST /sessions/{id}/red-flags -> {flag_description, severity}
    """
    url = f"{BACKEND_URL}/sessions/{session_id}/red-flags"
    payload = {
        "flag_description": flag_description,
        "severity": severity
    }
    try:
        response = requests.post(url, json=payload, timeout=5)
        if response.status_code in (200, 201):
            return response.json()
        logger.warning(
            "Backend returned status %s for POST %s: %s",
            response.status_code, url, response.text
        )
        return None
    except requests.exceptions.RequestException as e:
        logger.warning("Could not reach backend at POST %s: %s", url, e)
        return None


def post_summary(
    session_id: Union[str, int],
    summary_text_english: str,
    summary_text_local_language: str
) -> Optional[Dict[str, Any]]:
    """
    Post physician-ready bilingual clinical summaries.
    POST /sessions/{id}/summary -> {summary_text_english, summary_text_local_language}
    """
    url = f"{BACKEND_URL}/sessions/{session_id}/summary"
    payload = {
        "summary_text_english": summary_text_english,
        "summary_text_local_language": summary_text_local_language
    }
    try:
        response = requests.post(url, json=payload, timeout=5)
        if response.status_code in (200, 201):
            return response.json()
        logger.warning(
            "Backend returned status %s for POST %s: %s",
            response.status_code, url, response.text
        )
        return None
    except requests.exceptions.RequestException as e:
        logger.warning("Could not reach backend at POST %s: %s", url, e)
        return None