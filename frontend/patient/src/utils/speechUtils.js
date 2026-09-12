/**
 * Speech Synthesis Utility for MediKiosk
 * Provides robust Indian accent fallback for regional Indian languages:
 * Hindi (hi-IN), English (en-IN), Gujarati (gu-IN), Marathi (mr-IN), Tamil (ta-IN), Bengali (bn-IN).
 */
import { SUPPORTED_LANGUAGES, getLanguageConfig } from '../constants/languages';
import { apiSarvamTts } from '../services/api';

export const getAvailableVoices = () => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return resolve([]);
    }
    let voices = window.speechSynthesis.getVoices();
    if (voices && voices.length) return resolve(voices);

    window.speechSynthesis.onvoiceschanged = () => {
      resolve(window.speechSynthesis.getVoices());
    };

    // Safety timeout in case onvoiceschanged does not fire
    setTimeout(() => {
      resolve(window.speechSynthesis.getVoices());
    }, 250);
  });
};

/**
 * Fallback browser SpeechSynthesis speaker
 */
const _speakWithBrowser = async (text, targetLang) => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window) || !text) return;
  window.speechSynthesis.cancel(); // Stop any pending speech

  const voices = await getAvailableVoices();
  const utterance = new SpeechSynthesisUtterance(text);
  const shortCode = targetLang.slice(0, 2).toLowerCase();

  // Look for exact language match or prefix match (e.g. 'mr-IN', 'mr_IN', 'mr')
  let chosenVoice = voices.find(
    (v) =>
      v.lang.toLowerCase() === targetLang.toLowerCase() ||
      v.lang.replace('_', '-').toLowerCase() === targetLang.toLowerCase() ||
      v.lang.toLowerCase().startsWith(shortCode) ||
      v.lang.replace('_', '-').toLowerCase().startsWith(shortCode)
  );

  // ROBUST INDIAN FALLBACK:
  // If browser lacks native Marathi/Tamil/Bengali/Gujarati voice, fallback to Indian Hindi or Indian English voice
  if (!chosenVoice) {
    chosenVoice =
      voices.find((v) => v.lang.includes('hi-IN') || v.lang.toLowerCase().includes('hi')) ||
      voices.find((v) => v.lang.includes('en-IN') || (v.lang.includes('IN') && v.lang.toLowerCase().startsWith('en'))) ||
      voices.find((v) => v.lang.includes('IN')) ||
      voices[0];
  }

  if (chosenVoice) {
    utterance.voice = chosenVoice;
  }
  utterance.lang = chosenVoice?.lang || targetLang;
  utterance.rate = 0.9; // Clear, measured kiosk speaking pace
  utterance.pitch = 1.0;

  return new Promise((resolve) => {
    utterance.onend = () => resolve();
    utterance.onerror = (err) => {
      console.warn('SpeechSynthesis playback note:', err);
      resolve();
    };
    window.speechSynthesis.speak(utterance);
  });
};

export const speakPhrase = async (text, langCodeOrName) => {
  if (!text) return;

  // Resolve target language code (e.g. 'mr-IN', 'ta-IN', 'bn-IN', 'hi-IN', 'gu-IN', 'en-IN')
  let targetLang = 'hi-IN';
  if (SUPPORTED_LANGUAGES[langCodeOrName]) {
    targetLang = SUPPORTED_LANGUAGES[langCodeOrName].code;
  } else if (typeof langCodeOrName === 'string') {
    const matched = Object.values(SUPPORTED_LANGUAGES).find(
      (cfg) =>
        cfg.code.toLowerCase() === langCodeOrName.toLowerCase() ||
        cfg.short.toLowerCase() === langCodeOrName.toLowerCase()
    );
    if (matched) {
      targetLang = matched.code;
    } else if (langCodeOrName.includes('-')) {
      targetLang = langCodeOrName;
    } else {
      targetLang = `${langCodeOrName}-IN`;
    }
  }

  // 1. Primary Attempt: High-Naturalness Indian Voice via Sarvam Bulbul AI
  try {
    const ttsRes = await apiSarvamTts(text, targetLang);
    if (ttsRes && ttsRes.success && ttsRes.audio_base64) {
      return new Promise((resolve) => {
        try {
          const audio = new Audio(`data:audio/wav;base64,${ttsRes.audio_base64}`);
          audio.onended = () => resolve();
          audio.onerror = (err) => {
            console.warn('[Sarvam TTS Audio tag error, falling back]:', err);
            _speakWithBrowser(text, targetLang).then(resolve);
          };
          audio.play().catch((playErr) => {
            console.warn('[Sarvam Audio Play blocked/failed, falling back]:', playErr);
            _speakWithBrowser(text, targetLang).then(resolve);
          });
        } catch (audioInitErr) {
          console.warn('[Sarvam Audio Init failed]:', audioInitErr);
          _speakWithBrowser(text, targetLang).then(resolve);
        }
      });
    }
  } catch (sarvamErr) {
    console.warn('[Sarvam TTS service unavailable, falling back]:', sarvamErr);
  }

  // 2. Resilient Fallback: Standard Browser Web Speech Synthesis
  return _speakWithBrowser(text, targetLang);
};

export default {
  getAvailableVoices,
  speakPhrase
};
