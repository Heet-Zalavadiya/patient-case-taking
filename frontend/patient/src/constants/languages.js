/**
 * MediKiosk Unified Language Map & Metadata (All 6 Supported Languages)
 * Strictly aligned across UI text, Speech Synthesis (TTS), and Speech Recognition (STT).
 */
export const SUPPORTED_LANGUAGES = {
  Hindi: { code: 'hi-IN', short: 'hi', name: 'हिन्दी', englishName: 'Hindi' },
  English: { code: 'en-IN', short: 'en', name: 'English', englishName: 'English' },
  Gujarati: { code: 'gu-IN', short: 'gu', name: 'ગુજરાતી', englishName: 'Gujarati' },
  Marathi: { code: 'mr-IN', short: 'mr', name: 'मराठी', englishName: 'Marathi' },
  Tamil: { code: 'ta-IN', short: 'ta', name: 'தமிழ்', englishName: 'Tamil' },
  Bengali: { code: 'bn-IN', short: 'bn', name: 'বাংলা', englishName: 'Bengali' }
};

export const DEFAULT_LANGUAGE = 'Hindi';

export const getLanguageConfig = (langName) => {
  return SUPPORTED_LANGUAGES[langName] || SUPPORTED_LANGUAGES[DEFAULT_LANGUAGE];
};
