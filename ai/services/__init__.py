"""Services for MediKiosk AI module: InterviewService, voice_service, backend_client."""

import logging

from ai.services.interview_service import InterviewService
from ai.services import backend_client

logger = logging.getLogger(__name__)

# `voice_service` depends on optional, hardware-bound packages (sounddevice/numpy +
# a working PortAudio install) that are only needed for the local microphone CLI
# workflow (quick_test.py). Importing it lazily/defensively means a server or
# container without audio hardware can still import `ai.services` and use
# InterviewService (text-only) without crashing on import.
try:
    from ai.services.voice_service import record_and_transcribe
except Exception as e:  # pragma: no cover - environment-dependent
    logger.warning("voice_service unavailable (%s); record_and_transcribe will not work.", e)

    def record_and_transcribe(*args, **kwargs):
        raise RuntimeError(
            "voice_service could not be loaded (missing sounddevice/numpy or no audio "
            "device available). Install them with `pip install sounddevice numpy` to "
            "use voice input."
        )

__all__ = [
    "InterviewService",
    "backend_client",
    "record_and_transcribe",
]
