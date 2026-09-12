"""
Sarvam AI Service Module
Provides Indian-language specialized Speech-to-Text (Saaras),
Translation & Normalization (Mayura), and Text-to-Speech (Bulbul).
Operates alongside Gemini with automatic, resilient fallback.
"""

import os
import io
import logging
import asyncio
from typing import Dict, Any, Optional
import requests

logger = logging.getLogger("sarvam_service")

# ── API Configuration ────────────────────────────────────────────────────────
SARVAM_BASE_URL = "https://api.sarvam.ai"
STT_ENDPOINT = f"{SARVAM_BASE_URL}/speech-to-text"
TRANSLATE_ENDPOINT = f"{SARVAM_BASE_URL}/translate"
TTS_ENDPOINT = f"{SARVAM_BASE_URL}/text-to-speech"

# Default Model Identifiers
STT_DEFAULT_MODEL = os.getenv("SARVAM_STT_MODEL", "saaras:v2")
TRANSLATE_DEFAULT_MODEL = os.getenv("SARVAM_TRANSLATE_MODEL", "mayura:v1")
TTS_DEFAULT_MODEL = os.getenv("SARVAM_TTS_MODEL", "bulbul:v1")

# Language Code Normalizer
LANG_CODE_MAP = {
    "hindi": "hi-IN",
    "gujarati": "gu-IN",
    "marathi": "mr-IN",
    "tamil": "ta-IN",
    "bengali": "bn-IN",
    "english": "en-IN",
    "kannada": "kn-IN",
    "telugu": "te-IN",
    "malayalam": "ml-IN",
    "odia": "od-IN",
    "punjabi": "pa-IN",
}


def get_sarvam_api_key() -> str:
    """Retrieve the Sarvam AI API key from environment."""
    return os.getenv("SARVAM_API_KEY", "").strip()


def is_sarvam_enabled() -> bool:
    """
    Check if Sarvam AI is enabled via feature flag and valid API key.
    Feature flag: USE_SARVAM_AI=true/false (default: true)
    """
    flag = os.getenv("USE_SARVAM_AI", "true").lower() in ("true", "1", "yes", "on")
    key = get_sarvam_api_key()
    return flag and bool(key) and key != "your_sarvam_api_key_here"


def normalize_lang_code(lang_str: Optional[str]) -> str:
    """Standardize language name or code to Sarvam format (e.g. 'hi-IN')."""
    if not lang_str:
        return "unknown"
    cleaned = lang_str.strip().lower()
    if cleaned in LANG_CODE_MAP:
        return LANG_CODE_MAP[cleaned]
    # Check if already a locale like hi-IN, en-US, etc.
    if "-" in cleaned:
        prefix, suffix = cleaned.split("-", 1)
        return f"{prefix.lower()}-{suffix.upper()}"
    return cleaned


# ── 1. Speech-to-Text (STT) ──────────────────────────────────────────────────
def transcribe_audio_sync(
    audio_bytes: bytes,
    filename: str = "audio.webm",
    content_type: str = "audio/webm",
    language_code: str = "unknown"
) -> Dict[str, Any]:
    """
    Synchronously call Sarvam STT REST API (Saaras).
    Supports WAV, WebM, MP3, OGG.
    """
    if not is_sarvam_enabled():
        return {
            "success": False,
            "transcript": "",
            "language_code": language_code,
            "fallback": True,
            "error": "Sarvam AI is disabled or SARVAM_API_KEY is not configured"
        }

    api_key = get_sarvam_api_key()
    headers = {
        "api-subscription-key": api_key
    }

    target_lang = normalize_lang_code(language_code)
    files = {
        "file": (filename, io.BytesIO(audio_bytes), content_type)
    }
    data = {
        "model": STT_DEFAULT_MODEL,
        "language_code": target_lang if target_lang != "unknown" else "unknown"
    }

    try:
        response = requests.post(
            STT_ENDPOINT,
            headers=headers,
            files=files,
            data=data,
            timeout=15
        )

        if response.status_code == 200:
            res_json = response.json()
            transcript = res_json.get("transcript", "").strip()
            detected_lang = res_json.get("language_code", target_lang)
            logger.info(f"[Sarvam STT] Successfully transcribed ({len(transcript)} chars, lang={detected_lang})")
            return {
                "success": True,
                "transcript": transcript,
                "language_code": detected_lang,
                "provider": "sarvam",
                "request_id": res_json.get("request_id")
            }
        else:
            logger.warning(f"[Sarvam STT] API error status {response.status_code}: {response.text}")
            return {
                "success": False,
                "transcript": "",
                "language_code": target_lang,
                "fallback": True,
                "error": f"Sarvam API status {response.status_code}: {response.text[:200]}"
            }

    except Exception as exc:
        logger.warning(f"[Sarvam STT] Request failed: {exc}. Gracefully falling back.")
        return {
            "success": False,
            "transcript": "",
            "language_code": target_lang,
            "fallback": True,
            "error": str(exc)
        }


async def transcribe_audio(
    audio_bytes: bytes,
    filename: str = "audio.webm",
    content_type: str = "audio/webm",
    language_code: str = "unknown"
) -> Dict[str, Any]:
    """Asynchronous wrapper for transcribe_audio_sync."""
    return await asyncio.to_thread(
        transcribe_audio_sync,
        audio_bytes,
        filename,
        content_type,
        language_code
    )


# ── 2. Language Detection, Normalization & Translation ─────────────────────────
def normalize_and_translate_sync(
    text: str,
    source_language: str = "auto",
    target_language: str = "en-IN"
) -> Dict[str, Any]:
    """
    Synchronously call Sarvam Translate API (Mayura).
    Normalizes Indian regional languages, dialects, and mixed/Hinglish speech into standard English/regional text.
    """
    cleaned_input = text.strip() if text else ""
    if not cleaned_input:
        return {
            "success": True,
            "normalized_text": "",
            "translated_text": "",
            "source_language_code": "unknown",
            "fallback": False
        }

    if not is_sarvam_enabled():
        return {
            "success": False,
            "normalized_text": cleaned_input,
            "translated_text": cleaned_input,
            "source_language_code": source_language,
            "fallback": True,
            "error": "Sarvam AI is disabled or SARVAM_API_KEY is not configured"
        }

    api_key = get_sarvam_api_key()
    headers = {
        "api-subscription-key": api_key,
        "Content-Type": "application/json"
    }

    src_lang = normalize_lang_code(source_language)
    tgt_lang = normalize_lang_code(target_language) if target_language else "en-IN"

    payload = {
        "input": cleaned_input,
        "source_language_code": src_lang if src_lang != "unknown" and src_lang != "auto" else "auto",
        "target_language_code": tgt_lang,
        "speaker_gender": "Male",
        "mode": "colloquial",
        "model": TRANSLATE_DEFAULT_MODEL
    }

    try:
        response = requests.post(
            TRANSLATE_ENDPOINT,
            headers=headers,
            json=payload,
            timeout=10
        )

        if response.status_code == 200:
            res_json = response.json()
            translated = res_json.get("translated_text", cleaned_input)
            detected_src = res_json.get("source_language_code", src_lang)
            logger.info(f"[Sarvam Translate] Translated '{cleaned_input[:30]}' ({detected_src} -> {tgt_lang}): '{translated[:40]}'")
            return {
                "success": True,
                "original_text": cleaned_input,
                "normalized_text": translated,
                "translated_text": translated,
                "source_language_code": detected_src,
                "target_language_code": tgt_lang,
                "provider": "sarvam",
                "request_id": res_json.get("request_id")
            }
        else:
            logger.warning(f"[Sarvam Translate] API error {response.status_code}: {response.text}")
            return {
                "success": False,
                "original_text": cleaned_input,
                "normalized_text": cleaned_input,
                "translated_text": cleaned_input,
                "source_language_code": src_lang,
                "fallback": True,
                "error": f"Sarvam API status {response.status_code}"
            }

    except Exception as exc:
        logger.warning(f"[Sarvam Translate] Request failed: {exc}. Falling back to original text.")
        return {
            "success": False,
            "original_text": cleaned_input,
            "normalized_text": cleaned_input,
            "translated_text": cleaned_input,
            "source_language_code": src_lang,
            "fallback": True,
            "error": str(exc)
        }


async def normalize_and_translate(
    text: str,
    source_language: str = "auto",
    target_language: str = "en-IN"
) -> Dict[str, Any]:
    """Asynchronous wrapper for normalize_and_translate_sync."""
    return await asyncio.to_thread(
        normalize_and_translate_sync,
        text,
        source_language,
        target_language
    )


# ── 3. Text-to-Speech (TTS) ──────────────────────────────────────────────────
def text_to_speech_sync(
    text: str,
    target_language_code: str = "hi-IN",
    speaker: str = "meera"
) -> Dict[str, Any]:
    """
    Synchronously call Sarvam TTS API (Bulbul).
    Generates natural, expressive Indian-accented speech in Indian languages.
    """
    cleaned_input = text.strip() if text else ""
    if not cleaned_input:
        return {
            "success": False,
            "audio_base64": None,
            "fallback": True,
            "error": "Empty text provided"
        }

    if not is_sarvam_enabled():
        return {
            "success": False,
            "audio_base64": None,
            "fallback": True,
            "error": "Sarvam AI is disabled or SARVAM_API_KEY is not configured"
        }

    api_key = get_sarvam_api_key()
    headers = {
        "api-subscription-key": api_key,
        "Content-Type": "application/json"
    }

    tgt_lang = normalize_lang_code(target_language_code)
    payload = {
        "inputs": [cleaned_input[:500]],
        "target_language_code": tgt_lang if tgt_lang != "unknown" else "hi-IN",
        "speaker": speaker,
        "pitch": 0,
        "pace": 0.95,
        "loudness": 1.5,
        "speech_sample_rate": 22050,
        "enable_preprocessing": True,
        "model": TTS_DEFAULT_MODEL
    }

    try:
        response = requests.post(
            TTS_ENDPOINT,
            headers=headers,
            json=payload,
            timeout=12
        )

        if response.status_code == 200:
            res_json = response.json()
            audios = res_json.get("audios", [])
            if audios and len(audios) > 0:
                logger.info(f"[Sarvam TTS] Successfully generated audio for lang={tgt_lang}")
                return {
                    "success": True,
                    "audio_base64": audios[0],
                    "format": "wav",
                    "provider": "sarvam",
                    "request_id": res_json.get("request_id")
                }

        logger.warning(f"[Sarvam TTS] API error {response.status_code}: {response.text}")
        return {
            "success": False,
            "audio_base64": None,
            "fallback": True,
            "error": f"Sarvam TTS status {response.status_code}"
        }

    except Exception as exc:
        logger.warning(f"[Sarvam TTS] Request failed: {exc}. Gracefully falling back to browser TTS.")
        return {
            "success": False,
            "audio_base64": None,
            "fallback": True,
            "error": str(exc)
        }


async def text_to_speech(
    text: str,
    target_language_code: str = "hi-IN",
    speaker: str = "meera"
) -> Dict[str, Any]:
    """Asynchronous wrapper for text_to_speech_sync."""
    return await asyncio.to_thread(
        text_to_speech_sync,
        text,
        target_language_code,
        speaker
    )
