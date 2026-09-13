/**
 * Speech Synthesis Utility for MediKiosk
 * Provides robust Indian accent fallback for regional Indian languages:
 * Hindi (hi-IN), English (en-IN), Gujarati (gu-IN), Marathi (mr-IN), Tamil (ta-IN), Bengali (bn-IN).
 */
import { SUPPORTED_LANGUAGES } from '../constants/languages';

const resolveLanguageCode = (langCodeOrName) => {
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

  return targetLang;
};

const chooseVoice = (voices, targetLang) => {
  const shortCode = targetLang.slice(0, 2).toLowerCase();

  let chosenVoice = voices.find(
    (v) =>
      v.lang.toLowerCase() === targetLang.toLowerCase() ||
      v.lang.replace('_', '-').toLowerCase() === targetLang.toLowerCase() ||
      v.lang.toLowerCase().startsWith(shortCode) ||
      v.lang.replace('_', '-').toLowerCase().startsWith(shortCode)
  );

  if (!chosenVoice) {
    chosenVoice =
      voices.find((v) => v.lang.includes('hi-IN') || v.lang.toLowerCase().includes('hi')) ||
      voices.find((v) => v.lang.includes('en-IN') || (v.lang.includes('IN') && v.lang.toLowerCase().startsWith('en'))) ||
      voices.find((v) => v.lang.includes('IN')) ||
      voices[0];
  }

  return chosenVoice;
};

export const getAvailableVoices = () => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return resolve([]);
    }

    const voices = window.speechSynthesis.getVoices();
    if (voices && voices.length) return resolve(voices);

    window.speechSynthesis.onvoiceschanged = () => {
      resolve(window.speechSynthesis.getVoices());
    };

    setTimeout(() => {
      resolve(window.speechSynthesis.getVoices());
    }, 250);
  });
};

const _speakWithBrowser = async (text, targetLang) => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window) || !text) return;

  window.speechSynthesis.cancel();

  const voices = await getAvailableVoices();
  const utterance = new SpeechSynthesisUtterance(text);
  const chosenVoice = chooseVoice(voices, targetLang);

  if (chosenVoice) {
    utterance.voice = chosenVoice;
  }

  utterance.lang = chosenVoice?.lang || targetLang;
  utterance.rate = 0.9;
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

export const speakPhrase = async (text, langCodeOrName = 'hi-IN') => {
  if (!text) return;

  const targetLang = resolveLanguageCode(langCodeOrName);
  return _speakWithBrowser(text, targetLang);
};

export default {
  getAvailableVoices,
  speakPhrase
};
