import React, { useState } from 'react';
import { usePatient } from '../../context/PatientContext';
import { speakPhrase } from '../../utils/speechUtils';
import { 
  Languages, 
  Volume2, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft,
  SlidersHorizontal,
  Headphones,
  Eye,
  Check,
  Sparkles,
  Accessibility,
  VolumeX,
  Stethoscope,
  Flame
} from 'lucide-react';

export const LanguageSelect = () => {
  const { 
    patientData, 
    theme,
    setLanguage, 
    setAccessibilityMode, 
    setHistoryMode,
    nextStep, 
    prevStep 
  } = usePatient();

  const isLight = theme === 'light';
  const [playingLang, setPlayingLang] = useState(null);

  // 6 Kiosk Languages with exact speech preview phrases
  const languages = [
    {
      id: 'Hindi',
      nativeName: 'हिन्दी',
      englishName: 'Hindi',
      script: 'Devanagari',
      symbol: 'अ',
      speechCode: 'hi',
      speechText: 'नमस्ते, आप हिन्दी में आगे बढ़ सकते हैं',
      subGreeting: 'आयुष परामर्श और ओपीडी जांच'
    },
    {
      id: 'English',
      nativeName: 'English',
      englishName: 'English',
      script: 'Latin',
      symbol: 'A',
      speechCode: 'en',
      speechText: 'Hello, you can proceed in English',
      subGreeting: 'Ayush Consultation & OPD Triage'
    },
    {
      id: 'Gujarati',
      nativeName: 'ગુજરાતી',
      englishName: 'Gujarati',
      script: 'Gujarati',
      symbol: 'અ',
      speechCode: 'gu',
      speechText: 'નમસ્તે, તમે ગુજરાતીમાં આગળ વધી શકો છો',
      subGreeting: 'ઓપીડી પરામર્શ અને આયુષ ઉપચાર'
    },
    {
      id: 'Marathi',
      nativeName: 'मराठी',
      englishName: 'Marathi',
      script: 'Devanagari',
      symbol: 'अ',
      speechCode: 'mr',
      speechText: 'नमस्कार, तुम्ही मराठीत पुढे जाऊ शकता',
      subGreeting: 'आयुष सल्लामसलत व ओपीडी तपासणी'
    },
    {
      id: 'Tamil',
      nativeName: 'தமிழ்',
      englishName: 'Tamil',
      script: 'Tamil',
      symbol: 'அ',
      speechCode: 'ta',
      speechText: 'வணக்கம், நீங்கள் தமிழில் தொடரலாம்',
      subGreeting: 'ஆயுஷ் மருத்துவ ஆலோசனை'
    },
    {
      id: 'Bengali',
      nativeName: 'বাংলা',
      englishName: 'Bengali',
      script: 'Bengali',
      symbol: 'অ',
      speechCode: 'bn',
      speechText: 'নমস্কার, আপনি বাংলায় এগিয়ে যেতে পারেন',
      subGreeting: 'आयुश परामर्श और ओपीडी পরিষেবা'
    }
  ];

  // 3 Accessibility Modes matching backend schema
  const accessibilityModes = [
    {
      id: 'standard',
      title: 'Standard Display',
      hindiTitle: 'मानक डिस्प्ले',
      desc: 'Optimized touch screen display with smooth colors',
      icon: SlidersHorizontal,
      activeColorDark: 'border-emerald-500 bg-emerald-500/15 text-emerald-300',
      activeColorLight: 'border-emerald-500 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/30'
    },
    {
      id: 'audio-guided',
      title: 'Voice Prompts Enabled 🔊',
      hindiTitle: 'ऑडियो गाइड (बोलकर निर्देश)',
      desc: 'Interactive spoken guidance at every intake step',
      icon: Headphones,
      activeColorDark: 'border-purple-500 bg-purple-500/15 text-purple-300',
      activeColorLight: 'border-purple-500 bg-purple-50 text-purple-900 ring-2 ring-purple-500/30'
    },
    {
      id: 'large-text-high-contrast',
      title: 'Large Text & High Contrast',
      hindiTitle: 'बड़ा टेक्स्ट और उच्च कंट्रास्ट',
      desc: 'Maximum visibility typography and high contrast borders',
      icon: Eye,
      activeColorDark: 'border-amber-400 bg-amber-400/20 text-amber-300',
      activeColorLight: 'border-amber-500 bg-amber-50 text-amber-950 ring-2 ring-amber-500/40'
    }
  ];

  // Trigger browser Text-to-Speech with robust Indian voice fallback
  const handlePlayTTS = async (e, langObj) => {
    e.stopPropagation();
    setPlayingLang(langObj.id);

    try {
      await speakPhrase(langObj.speechText, langObj.speechCode);
    } catch (err) {
      console.warn('TTS playback error:', err);
    } finally {
      setPlayingLang(null);
    }
  };

  const handleSelectLanguage = (langId) => {
    setLanguage(langId);
    const target = languages.find(l => l.id === langId);
    if (target && patientData.accessibility_mode === 'audio-guided') {
      handlePlayTTS({ stopPropagation: () => {} }, target);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col">
      
      {/* 1. SCREEN HEADER */}
      <div className="mt-2 mb-4 text-center">
        <div
          className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs sm:text-sm font-semibold mb-2 border ${
            isLight
              ? 'bg-cyan-50 border-cyan-300 text-cyan-800'
              : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300'
          }`}
        >
          <Languages className="w-4 h-4 text-cyan-500" />
          <span>Multilingual Touch Terminal • बहुभाषी टच टर्मिनल</span>
        </div>
        <h2 className={`text-2xl sm:text-4xl font-black tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
          Please Select Your Preferred Language
        </h2>
        <p className="text-xl sm:text-2xl font-bold text-cyan-500 mt-0.5">
          कृपया अपनी भाषा चुनें
        </p>
        <p className={`text-xs sm:text-sm mt-1.5 max-w-xl mx-auto ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
          Your entire medical intake and audio guidance will adapt to your choice.
        </p>
      </div>

      {/* 2. KIOSK LANGUAGE GRID (6 Large Touchable Cards) */}
      <div className="w-full grid grid-cols-2 md:grid-cols-3 gap-3.5 sm:gap-5 mb-6">
        {languages.map((lang) => {
          const isSelected = patientData.preferred_language === lang.id;
          const isPlaying = playingLang === lang.id;

          return (
            <div
              key={lang.id}
              onClick={() => handleSelectLanguage(lang.id)}
              className={`group relative cursor-pointer rounded-3xl p-4 sm:p-6 transition-all duration-200 transform flex flex-col justify-between min-h-[160px] sm:min-h-[190px] border select-none ${
                isSelected
                  ? isLight
                    ? 'bg-emerald-50/95 border-2 border-emerald-500 shadow-xl shadow-emerald-100/50 scale-[1.02] ring-4 ring-emerald-500/20 text-slate-900'
                    : 'bg-slate-800/95 border-2 border-emerald-400 shadow-2xl shadow-emerald-500/25 scale-[1.02] ring-4 ring-emerald-500/20 text-white'
                  : isLight
                  ? 'bg-white/90 hover:bg-slate-50 border-slate-200 shadow-md text-slate-900'
                  : 'bg-slate-900/80 hover:bg-slate-800/80 border-slate-800 hover:border-slate-700 shadow-lg text-white'
              }`}
            >
              {/* Selected Floating Checkmark */}
              {isSelected && (
                <div className="absolute top-3.5 right-3.5 bg-emerald-500 text-white p-1 rounded-full shadow-md animate-in fade-in">
                  <Check className="w-4 h-4 stroke-[3]" />
                </div>
              )}

              {/* Card Body */}
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center text-xl sm:text-2xl font-black transition-colors ${
                      isSelected
                        ? isLight
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : isLight
                        ? 'bg-slate-100 border border-slate-200 text-slate-700 group-hover:text-cyan-700'
                        : 'bg-slate-950 border border-slate-800 text-slate-300 group-hover:text-cyan-300'
                    }`}
                  >
                    {lang.symbol}
                  </div>
                  <div>
                    <h3 className={`text-xl sm:text-2xl font-black tracking-tight leading-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      {lang.nativeName}
                    </h3>
                    <span className={`text-xs sm:text-sm font-semibold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      {lang.englishName}
                    </span>
                  </div>
                </div>

                <p className={`text-[11px] sm:text-xs line-clamp-1 mt-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  {lang.subGreeting}
                </p>
              </div>

              {/* Speaker TTS Trigger Button */}
              <div className={`mt-3 pt-2.5 border-t flex items-center justify-between ${isLight ? 'border-slate-200' : 'border-slate-800/80'}`}>
                <button
                  type="button"
                  onClick={(e) => handlePlayTTS(e, lang)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    isPlaying
                      ? 'bg-emerald-500 text-white animate-pulse shadow-md'
                      : isSelected
                      ? isLight
                        ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border border-emerald-300'
                        : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
                      : isLight
                      ? 'bg-slate-100 hover:bg-slate-200 text-cyan-800 border border-slate-200'
                      : 'bg-slate-950 hover:bg-slate-800 text-cyan-300 border border-slate-800'
                  }`}
                  title="Play audio greeting"
                >
                  <Volume2 className={`w-4 h-4 ${isPlaying ? 'animate-bounce' : ''}`} />
                  <span>{isPlaying ? 'Playing...' : 'Audio (ऑडियो)'}</span>
                </button>

                <span className={`text-[10px] font-semibold uppercase tracking-wider ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                  {isSelected ? 'Selected ✓' : 'Tap to Pick'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. CLINICAL PATHWAY SELECTOR (AYUSH vs Allopathic) */}
      <div
        className={`backdrop-blur-xl border rounded-3xl p-4 sm:p-5 mb-5 shadow-xl transition-colors duration-300 ${
          isLight
            ? 'bg-white/90 border-slate-200/90 shadow-slate-300/30 text-slate-900'
            : 'bg-slate-900/90 border-slate-800 shadow-slate-950/30 text-white'
        }`}
      >
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-emerald-500" />
            <span className={`text-sm font-bold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
              Clinical Consultation Pathway / क्लिनिकल परामर्श का प्रकार
            </span>
          </div>
          <span className={`text-xs font-semibold ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
            Dual AYUSH & Modern Triage
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          
          {/* Option 1: Allopathic */}
          <button
            type="button"
            onClick={() => setHistoryMode('allopathic')}
            className={`p-4 rounded-2xl text-left transition-all border-2 flex items-center justify-between cursor-pointer select-none active:scale-98 ${
              patientData.history_mode === 'allopathic'
                ? isLight
                  ? 'bg-cyan-50/90 border-cyan-500 shadow-md ring-2 ring-cyan-400/20 text-cyan-950'
                  : 'bg-cyan-500/20 border-cyan-400 shadow-lg shadow-cyan-500/10 ring-2 ring-cyan-500/20 text-white'
                : isLight
                ? 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-700'
                : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 text-slate-300'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${
                  patientData.history_mode === 'allopathic'
                    ? isLight ? 'bg-cyan-500 text-white border-cyan-600' : 'bg-cyan-400 text-slate-950 border-cyan-300'
                    : isLight ? 'bg-slate-100 text-slate-500 border-slate-200' : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                <Stethoscope className="w-6 h-6" />
              </div>
              <div>
                <div className="font-bold text-sm sm:text-base">
                  Allopathic Medicine (आधुनिक चिकित्सा)
                </div>
                <div className={`text-xs mt-0.5 ${patientData.history_mode === 'allopathic' ? (isLight ? 'text-cyan-800' : 'text-cyan-300') : (isLight ? 'text-slate-500' : 'text-slate-400')}`}>
                  General Medicine, Acute Symptoms, Modern Triage
                </div>
              </div>
            </div>
            {patientData.history_mode === 'allopathic' && (
              <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${isLight ? 'bg-cyan-600 text-white' : 'bg-cyan-400 text-slate-950'}`}>
                <Check className="w-4 h-4 stroke-[3]" />
              </div>
            )}
          </button>

          {/* Option 2: Ayush & Kayachikitsa */}
          <button
            type="button"
            onClick={() => setHistoryMode('ayush')}
            className={`p-4 rounded-2xl text-left transition-all border-2 flex items-center justify-between cursor-pointer select-none active:scale-98 ${
              patientData.history_mode === 'ayush'
                ? isLight
                  ? 'bg-emerald-50/90 border-emerald-500 shadow-md ring-2 ring-emerald-400/20 text-emerald-950'
                  : 'bg-emerald-500/20 border-emerald-400 shadow-lg shadow-emerald-500/10 ring-2 ring-emerald-500/20 text-white'
                : isLight
                ? 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-700'
                : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 text-slate-300'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${
                  patientData.history_mode === 'ayush'
                    ? isLight ? 'bg-emerald-500 text-white border-emerald-600' : 'bg-emerald-400 text-slate-950 border-emerald-300'
                    : isLight ? 'bg-slate-100 text-slate-500 border-slate-200' : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                <Flame className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <div className="font-bold text-sm sm:text-base">
                  Ayush & Kayachikitsa (आयुष एवं कायचिकित्सा)
                </div>
                <div className={`text-xs mt-0.5 ${patientData.history_mode === 'ayush' ? (isLight ? 'text-emerald-800' : 'text-emerald-300') : (isLight ? 'text-slate-500' : 'text-slate-400')}`}>
                  Prakriti Assessment, Agni Pariksha, Holistic Care
                </div>
              </div>
            </div>
            {patientData.history_mode === 'ayush' && (
              <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${isLight ? 'bg-emerald-600 text-white' : 'bg-emerald-400 text-slate-950'}`}>
                <Check className="w-4 h-4 stroke-[3]" />
              </div>
            )}
          </button>

        </div>
      </div>

      {/* 4. ACCESSIBILITY MODE TOGGLE (Bottom Bar) */}
      <div
        className={`backdrop-blur-xl border rounded-3xl p-4 sm:p-5 mb-6 shadow-xl transition-colors duration-300 ${
          isLight
            ? 'bg-white/90 border-slate-200/90 shadow-slate-300/30 text-slate-900'
            : 'bg-slate-900/90 border-slate-800 shadow-slate-950/30 text-white'
        }`}
      >
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <Accessibility className="w-5 h-5 text-teal-500" />
            <span className={`text-sm font-bold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
              Accessibility Mode / सुगमता मोड
            </span>
          </div>
          <span className={`text-xs font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            Touch to adapt contrast & voice guidance
          </span>
        </div>

        {/* 3 Large Touch Pills */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {accessibilityModes.map((mode) => {
            const Icon = mode.icon;
            const isCurrent = patientData.accessibility_mode === mode.id;

            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => setAccessibilityMode(mode.id)}
                className={`p-3.5 sm:p-4 rounded-2xl text-left transition-all border flex flex-col justify-between cursor-pointer select-none active:scale-98 ${
                  isCurrent
                    ? isLight
                      ? `${mode.activeColorLight} border-2 shadow-md`
                      : `${mode.activeColorDark} border-2 shadow-lg ring-2 ring-white/10`
                    : isLight
                    ? 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-800'
                    : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-5 h-5 ${isCurrent ? (isLight ? 'text-slate-900' : 'text-white') : isLight ? 'text-slate-500' : 'text-slate-400'}`} />
                    <span className={`font-bold text-xs sm:text-sm ${isCurrent && isLight ? 'text-slate-900' : isCurrent ? 'text-white' : isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                      {mode.title}
                    </span>
                  </div>
                  {isCurrent && (
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center ${isLight ? 'bg-emerald-600 text-white' : 'bg-white text-slate-950'}`}>
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}
                </div>

                <div className={`text-xs font-semibold ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  {mode.hindiTitle}
                </div>
                <div className={`text-[11px] mt-1 leading-tight ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  {mode.desc}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. NAVIGATION BAR */}
      <div className="w-full flex items-center justify-between gap-4">
        
        {/* Back Button */}
        <button
          type="button"
          onClick={prevStep}
          className={`h-16 px-6 sm:px-8 rounded-2xl border font-bold text-base flex items-center gap-2.5 transition active:scale-98 cursor-pointer shadow-md ${
            isLight
              ? 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-slate-200/50'
              : 'bg-slate-800 hover:bg-slate-750 text-slate-200 border-slate-700'
          }`}
        >
          <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
          <span>Back / पीछे जाएँ</span>
        </button>

        {/* Confirm Language CTA */}
        <button
          type="button"
          onClick={nextStep}
          className="h-16 px-8 sm:px-10 rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-lg sm:text-xl flex items-center gap-3 shadow-xl shadow-emerald-500/25 transition-all active:scale-98 cursor-pointer"
        >
          <span>Confirm Language / भाषा की पुष्टि करें</span>
          <ArrowRight className="w-6 h-6 stroke-[3]" />
        </button>

      </div>

    </div>
  );
};

export default LanguageSelect;
