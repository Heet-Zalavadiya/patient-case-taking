"""
Sarvam AI Router
Exposes endpoints for:
- Speech-to-Text (/api/sarvam/stt)
- Language Normalization & Translation (/api/sarvam/normalize)
- Text-to-Speech (/api/sarvam/tts)
- Status & Feature Flag Inspection (/api/sarvam/status)
"""

import logging
from typing import Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from pydantic import BaseModel

from services import sarvam_service

logger = logging.getLogger("sarvam_router")

router = APIRouter(prefix="/sarvam", tags=["Sarvam AI (Indian Language & Voice)"])


# ── Pydantic Request & Response Schemas ─────────────────────────────────────────

class NormalizeRequest(BaseModel):
    text: str
    source_language: Optional[str] = "auto"
    target_language: Optional[str] = "en-IN"


class NormalizeResponse(BaseModel):
    success: bool
    original_text: str
    normalized_text: str
    translated_text: str
    source_language_code: Optional[str] = None
    target_language_code: Optional[str] = "en-IN"
    fallback: bool = False
    provider: str = "sarvam"
    error: Optional[str] = None


class TtsRequest(BaseModel):
    text: str
    language_code: Optional[str] = "hi-IN"
    speaker: Optional[str] = "meera"


class TtsResponse(BaseModel):
    success: bool
    audio_base64: Optional[str] = None
    format: str = "wav"
    fallback: bool = False
    provider: str = "sarvam"
    error: Optional[str] = None


class SttResponse(BaseModel):
    success: bool
    transcript: str
    language_code: str
    fallback: bool = False
    provider: str = "sarvam"
    error: Optional[str] = None


class StatusResponse(BaseModel):
    enabled: bool
    has_api_key: bool
    provider: str = "sarvam.ai"
    models: dict


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/status", response_model=StatusResponse)
async def get_sarvam_status():
    """Inspect whether Sarvam AI is enabled and configured."""
    has_key = bool(sarvam_service.get_sarvam_api_key())
    enabled = sarvam_service.is_sarvam_enabled()
    return StatusResponse(
        enabled=enabled,
        has_api_key=has_key,
        provider="sarvam.ai",
        models={
            "stt": sarvam_service.STT_DEFAULT_MODEL,
            "translate": sarvam_service.TRANSLATE_DEFAULT_MODEL,
            "tts": sarvam_service.TTS_DEFAULT_MODEL,
        }
    )


@router.post("/stt", response_model=SttResponse)
async def speech_to_text_endpoint(
    file: UploadFile = File(...),
    language_code: Optional[str] = Form("unknown")
):
    """
    Transcribe uploaded audio file using Sarvam Saaras AI STT.
    Accepts WebM, WAV, MP3, OGG audio blobs recorded from patient mic.
    Falls back gracefully if unavailable.
    """
    try:
        audio_bytes = await file.read()
        filename = file.filename or "recording.webm"
        content_type = file.content_type or "audio/webm"

        result = await sarvam_service.transcribe_audio(
            audio_bytes=audio_bytes,
            filename=filename,
            content_type=content_type,
            language_code=language_code or "unknown"
        )
        return SttResponse(
            success=result.get("success", False),
            transcript=result.get("transcript", ""),
            language_code=result.get("language_code", language_code or "unknown"),
            fallback=result.get("fallback", False),
            provider=result.get("provider", "sarvam"),
            error=result.get("error")
        )
    except Exception as exc:
        logger.error(f"Sarvam STT endpoint exception: {exc}")
        return SttResponse(
            success=False,
            transcript="",
            language_code=language_code or "unknown",
            fallback=True,
            error=str(exc)
        )


@router.post("/normalize", response_model=NormalizeResponse)
async def normalize_text_endpoint(body: NormalizeRequest):
    """
    Normalize and translate colloquial Indian language, dialects, or Hinglish text
    into clear medical/clinical text using Sarvam Mayura AI.
    """
    try:
        result = await sarvam_service.normalize_and_translate(
            text=body.text,
            source_language=body.source_language or "auto",
            target_language=body.target_language or "en-IN"
        )
        return NormalizeResponse(
            success=result.get("success", False),
            original_text=body.text,
            normalized_text=result.get("normalized_text", body.text),
            translated_text=result.get("translated_text", body.text),
            source_language_code=result.get("source_language_code"),
            target_language_code=result.get("target_language_code", "en-IN"),
            fallback=result.get("fallback", False),
            provider=result.get("provider", "sarvam"),
            error=result.get("error")
        )
    except Exception as exc:
        logger.error(f"Sarvam Normalize endpoint exception: {exc}")
        return NormalizeResponse(
            success=False,
            original_text=body.text,
            normalized_text=body.text,
            translated_text=body.text,
            fallback=True,
            error=str(exc)
        )


@router.post("/tts", response_model=TtsResponse)
async def text_to_speech_endpoint(body: TtsRequest):
    """
    Generate natural Indian-accented audio speech using Sarvam Bulbul AI TTS.
    Returns base64-encoded WAV audio for instant in-browser playback.
    """
    try:
        result = await sarvam_service.text_to_speech(
            text=body.text,
            target_language_code=body.language_code or "hi-IN",
            speaker=body.speaker or "meera"
        )
        return TtsResponse(
            success=result.get("success", False),
            audio_base64=result.get("audio_base64"),
            format=result.get("format", "wav"),
            fallback=result.get("fallback", False),
            provider=result.get("provider", "sarvam"),
            error=result.get("error")
        )
    except Exception as exc:
        logger.error(f"Sarvam TTS endpoint exception: {exc}")
        return TtsResponse(
            success=False,
            audio_base64=None,
            fallback=True,
            error=str(exc)
        )
