"""
Voice transcription service (ASR) for the MediKiosk patient interview.
Records audio from microphone via sounddevice, encapsulates raw PCM into a proper WAV container,
and uses Gemini API for clinical speech-to-text transcription.
"""

import os
import io
import wave
import time
from typing import Optional
import numpy as np
import sounddevice as sd
from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()

MODEL = "gemini-3.5-flash-lite"

_api_key = os.getenv("AI_API_KEY") or os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=_api_key) if _api_key else None


def record_and_transcribe(
    duration_seconds: int = 5,
    samplerate: int = 16000,
    device: Optional = None
) -> str:
    """
    Records audio for `duration_seconds` at `samplerate` (Hz), normalizes audio volume,
    encapsulates in WAV, and returns transcribed plain text via Gemini.
    """
    global client
    if client is None:
        key = os.getenv("AI_API_KEY") or os.getenv("GEMINI_API_KEY")
        if not key:
            raise RuntimeError("AI_API_KEY environment variable is required for transcription.")
        client = genai.Client(api_key=key)

    # Allow overriding audio device via environment variable AUDIO_DEVICE_INDEX
    if device is None and os.getenv("AUDIO_DEVICE_INDEX"):
        try:
            device = int(os.getenv("AUDIO_DEVICE_INDEX"))
        except ValueError:
            pass

    print(f"\n🎙️ RECORDING for {duration_seconds}s... Speak your symptoms now into the microphone!")
    recording = sd.rec(
        int(duration_seconds * samplerate),
        samplerate=samplerate,
        channels=1,
        dtype="int16",
        device=device
    )
    sd.wait()
    print("⏹️ Recording finished. Processing audio...")

    # Diagnostic: confirm the microphone captured actual sound signal
    max_amplitude = int(np.abs(recording).max())
    print(f"Signal strength (Max amplitude captured): {max_amplitude} / 32767")

    # If amplitude is near zero (e.g. <= 25), the microphone was muted or silent
    if max_amplitude <= 25:
        print("⚠️ Warning: No audio detected (microphone input was near zero/silent).")
        print("   Tips:")
        print("   1. Check if your microphone hardware switch or Mute key (e.g., F4 / Fn+F4) is active.")
        print("   2. In Windows Settings -> System -> Sound -> Input, check that your microphone volume is turned up.")
        print("   3. In Windows Settings -> Privacy -> Microphone, ensure desktop app access is enabled.")
        return ""

    # Gain normalization: if audio is quiet, boost it to optimal volume for Gemini
    if max_amplitude < 12000:
        gain = 18000.0 / max_amplitude
        boosted = np.clip(recording.astype(np.float32) * gain, -32768, 32767).astype(np.int16)
        pcm_data = boosted.tobytes()
    else:
        pcm_data = recording.tobytes()

    # Wrap PCM into a proper WAV container
    buffer = io.BytesIO()
    with wave.open(buffer, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)  # 16-bit PCM = 2 bytes per sample
        wf.setframerate(samplerate)
        wf.writeframes(pcm_data)
    wav_bytes = buffer.getvalue()

    response = client.models.generate_content(
        model=MODEL,
        contents=[
            types.Part.from_bytes(data=wav_bytes, mime_type="audio/wav"),
            (
                "Transcribe the patient's spoken words into clean plain text. "
                "If only silence, static, or background noise is present without speech, return nothing. "
                "Return only the transcribed text, nothing else."
            )
        ]
    )

    text = (response.text or "").strip()
    # Filter common silence/noise tags
    if text.lower() in ("<noise>", "[noise]", "<silence>", "[silence]", "noise", "silence"):
        return ""

    return text


def list_audio_devices():
    """Diagnostic tool to inspect available audio input devices."""
    print("Available Audio Devices:")
    print(sd.query_devices())
    print("\nDefault Device [Input, Output]:", sd.default.device)


if __name__ == "__main__":
    list_audio_devices()