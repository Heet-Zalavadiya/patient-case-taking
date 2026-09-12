/**
 * Speech Synthesis Utility for MediKiosk
 * Provides robust Indian accent fallback for regional Indian languages:
 * Hindi (hi-IN), English (en-IN), Gujarati (gu-IN), Marathi (mr-IN), Tamil (ta-IN), Bengali (bn-IN).
 */
import { SUPPORTED_LANGUAGES, getLanguageConfig } from '../constants/languages';

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

export const speakPhrase = async (text, langCodeOrName) => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window) || !text) return;
  window.speechSynthesis.cancel(); // Stop any pending speech

  const voices = await getAvailableVoices();
  const utterance = new SpeechSynthesisUtterance(text);

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

export default {
  getAvailableVoices,
  speakPhrase
};
