/**
 * Speech Synthesis Utility for MediKiosk
 * Provides robust Indian accent fallback for regional Indian languages (Gujarati, Marathi, Tamil, Bengali, etc.)
 */

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

export const speakPhrase = async (text, langCode) => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel(); // Stop any pending speech

  const voices = await getAvailableVoices();
  const utterance = new SpeechSynthesisUtterance(text);
  
  const normalizedCode = (langCode || 'hi').toLowerCase();

  // Try finding exact language voice (e.g., 'gu-IN', 'gu', 'mr-IN', 'ta-IN')
  let matchedVoice = voices.find(
    (v) =>
      v.lang.toLowerCase().startsWith(normalizedCode) ||
      v.lang.replace('_', '-').toLowerCase().startsWith(normalizedCode)
  );
  
  // ROBUST INDIAN FALLBACK:
  // If no native Gujarati/Marathi/Tamil voice exists in browser, fall back to Indian Hindi or Indian English voice
  if (!matchedVoice) {
    matchedVoice =
      voices.find(
        (v) =>
          v.lang.includes('hi-IN') ||
          v.lang.includes('en-IN') ||
          v.lang.toLowerCase().includes('hi') ||
          v.lang.includes('IN')
      ) || voices[0];
  }

  if (matchedVoice) {
    utterance.voice = matchedVoice;
  }
  utterance.lang = matchedVoice?.lang || 'hi-IN';
  utterance.rate = 0.9; // clear kiosk voice speed
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
