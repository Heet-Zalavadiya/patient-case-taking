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
    <div className="w-full max-w-xl mx-auto flex flex-col items-center justify-center">
      
      {/* SINGLE CENTRED GLASS CARD */}
      <div
        className={`w-full rounded-2xl p-5 sm:p-6 text-center transition-all duration-300 border-2 backdrop-blur-xl shadow-2xl ${
          isLight
            ? 'bg-white/95 border-slate-200 shadow-slate-300/40 text-slate-900'
            : 'bg-slate-900/90 border-slate-700 shadow-slate-950/60 text-white'
        }`}
      >
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400 to-teal-500 flex items-center justify-center mx-auto mb-2 shadow-md shadow-cyan-500/25">
          <Languages className="w-6 h-6 text-slate-950 stroke-[2.5]" />
        </div>

        <h2 className={`text-xl sm:text-2xl font-black tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
          Select Language / भाषा चुनें
        </h2>
        <p className={`text-xs sm:text-sm mt-0.5 mb-4 font-bold ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
          Tap your preferred language to begin intake
        </p>

        {/* 6 Square Form Language Tiles Grid */}
        <div className="grid grid-cols-3 gap-2.5 mb-4">
          {languages.map((lang) => {
            const isSelected = patientData.preferred_language === lang.id;
            return (
              <button
                key={lang.id}
                type="button"
                onClick={() => handleSelectLanguage(lang.id)}
                className={`p-3 rounded-xl border-2 text-left flex flex-col justify-between transition-all transform active:scale-95 cursor-pointer aspect-square ${
                  isSelected
                    ? 'bg-gradient-to-br from-teal-400 to-cyan-500 text-slate-950 font-black border-teal-300 shadow-lg shadow-cyan-500/25 ring-2 ring-cyan-400/40'
                    : isLight
                    ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-900 font-bold'
                    : 'bg-slate-800 hover:bg-slate-750 border-slate-700 text-white font-bold'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-2xl sm:text-3xl font-black">{lang.symbol}</span>
                  {isSelected && <Check className="w-5 h-5 stroke-[3] text-slate-950" />}
                </div>
                <div>
                  <div className="text-base sm:text-lg font-black leading-tight">{lang.nativeName}</div>
                  <div className={`text-xs font-bold ${isSelected ? 'text-slate-900' : isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    {lang.englishName}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Single Primary Action Button */}
        <button
          type="button"
          onClick={nextStep}
          className="w-full h-14 rounded-xl bg-gradient-to-r from-teal-400 via-cyan-500 to-emerald-400 hover:from-teal-300 hover:to-emerald-300 text-slate-950 font-black text-base sm:text-lg flex items-center justify-center gap-2.5 shadow-xl shadow-cyan-500/25 transition-all active:scale-98 cursor-pointer"
        >
          <span>Confirm & Continue / आगे बढ़ें</span>
          <ArrowRight className="w-5 h-5 stroke-[3]" />
        </button>

      </div>
    </div>
  );
};

export default LanguageSelect;
