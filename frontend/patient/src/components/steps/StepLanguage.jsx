import React, { useState } from 'react';
import { usePatient } from '../../context/PatientContext';
import { 
  Languages, 
  Volume2, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft,
  Sparkles,
  Accessibility,
  Eye,
  Headphones,
  SlidersHorizontal
} from 'lucide-react';

export const StepLanguage = () => {
  const { patientData, setLanguage, setAccessibilityMode, nextStep, prevStep } = usePatient();
  const [playingAudio, setPlayingAudio] = useState(null);

  const languages = [
    {
      id: 'Hindi',
      nativeName: 'हिंदी',
      englishName: 'Hindi',
      tagline: 'आयुष परामर्श और ओपीडी जांच',
      audioText: 'नमस्ते! आयुष ओपीडी में आपका स्वागत है।',
      symbol: 'अ',
      color: 'from-amber-500/20 to-orange-500/10 border-amber-500/40 text-amber-300'
    },
    {
      id: 'English',
      nativeName: 'English',
      englishName: 'English',
      tagline: 'Ayush Consultation & OPD Triage',
      audioText: 'Welcome to the National Ayush Hospital OPD Kiosk.',
      symbol: 'A',
      color: 'from-cyan-500/20 to-blue-500/10 border-cyan-500/40 text-cyan-300'
    },
    {
      id: 'Gujarati',
      nativeName: 'ગુજરાતી',
      englishName: 'Gujarati',
      tagline: 'ઓપીડી પરામર્શ અને આયુષ ઉપચાર',
      audioText: 'નમસ્તે! રાષ્ટ્રીય આયુષ હોસ્પિટલ ઓપીડીમાં આપનું સ્વાગત છે.',
      symbol: 'અ',
      color: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/40 text-emerald-300'
    }
  ];

  const accessibilityOptions = [
    {
      id: 'standard',
      title: 'Standard Touch Mode',
      desc: 'Optimized touch screen navigation with standard contrast',
      icon: SlidersHorizontal
    },
    {
      id: 'audio-guided',
      title: 'Audio-Guided Assistant',
      desc: 'Voice prompts at every step for elderly & visually impaired patients',
      icon: Headphones
    },
    {
      id: 'large-text-high-contrast',
      title: 'High Contrast & Large Text',
      desc: 'Maximum visibility with heightened colors and bold typography',
      icon: Eye
    }
  ];

  const handlePlayVoicePreview = (e, lang) => {
    e.stopPropagation();
    setPlayingAudio(lang.id);
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(lang.audioText);
      if (lang.id === 'Hindi') utterance.lang = 'hi-IN';
      else if (lang.id === 'Gujarati') utterance.lang = 'gu-IN';
      else utterance.lang = 'en-IN';

      utterance.onend = () => setPlayingAudio(null);
      utterance.onerror = () => setPlayingAudio(null);
      window.speechSynthesis.speak(utterance);
    } else {
      setTimeout(() => setPlayingAudio(null), 1500);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center justify-center p-4">
      {/* Title Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-sm font-medium mb-3">
          <Languages className="w-4 h-4 text-cyan-400" />
          <span>Multilingual Ayush Portal</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Step 2: Language & Accessibility
        </h2>
        <p className="text-slate-400 text-base sm:text-lg mt-2 max-w-xl mx-auto">
          Please touch your preferred language for consultation and select accessibility preferences.
        </p>
      </div>

      {/* Language Selection Grid */}
      <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        {languages.map((lang) => {
          const isSelected = patientData.preferred_language === lang.id;
          return (
            <div
              key={lang.id}
              onClick={() => setLanguage(lang.id)}
              className={`relative cursor-pointer rounded-3xl p-6 transition-all duration-300 transform flex flex-col justify-between min-h-[220px] ${
                isSelected
                  ? 'bg-slate-800/90 border-2 border-cyan-400 shadow-xl shadow-cyan-500/20 scale-[1.02]'
                  : 'bg-slate-900/60 hover:bg-slate-800/60 border border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Selected Badge */}
              {isSelected && (
                <div className="absolute top-4 right-4 bg-cyan-500 text-slate-950 p-1.5 rounded-full shadow-md animate-in fade-in">
                  <CheckCircle2 className="w-5 h-5 font-bold" />
                </div>
              )}

              {/* Language Symbol & Title */}
              <div>
                <div className="w-14 h-14 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center text-2xl font-black text-white mb-4 shadow-inner">
                  {lang.symbol}
                </div>
                <div className="text-2xl font-bold text-white tracking-wide">
                  {lang.nativeName}
                </div>
                <div className="text-sm font-medium text-slate-400">
                  {lang.englishName}
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  {lang.tagline}
                </p>
              </div>

              {/* Audio Play Trigger */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <button
                  type="button"
                  onClick={(e) => handlePlayVoicePreview(e, lang)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    playingAudio === lang.id
                      ? 'bg-cyan-500 text-slate-950 animate-pulse'
                      : 'bg-slate-800 hover:bg-slate-700 text-cyan-300'
                  }`}
                >
                  <Volume2 className="w-4 h-4" />
                  <span>{playingAudio === lang.id ? 'Playing...' : 'Audio Preview'}</span>
                </button>
                <span className="text-xs text-slate-500">Touch to select</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Accessibility Preference Bar */}
      <div className="w-full bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-3xl p-6 mb-8">
        <div className="flex items-center gap-2 mb-4 text-sm font-bold text-slate-200">
          <Accessibility className="w-5 h-5 text-teal-400" />
          <span>Kiosk Accessibility Mode</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {accessibilityOptions.map((opt) => {
            const Icon = opt.icon;
            const isCurrent = patientData.accessibility_mode === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setAccessibilityMode(opt.id)}
                className={`p-4 rounded-2xl text-left transition-all border flex flex-col justify-between ${
                  isCurrent
                    ? 'bg-teal-500/15 border-teal-500 text-white shadow-md'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Icon className={`w-5 h-5 ${isCurrent ? 'text-teal-400' : 'text-slate-400'}`} />
                  {isCurrent && <CheckCircle2 className="w-4 h-4 text-teal-400" />}
                </div>
                <div className="font-semibold text-sm">{opt.title}</div>
                <div className="text-xs text-slate-400 mt-1">{opt.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="w-full flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={prevStep}
          className="py-4 px-6 rounded-2xl bg-slate-800/90 hover:bg-slate-750 text-slate-300 border border-slate-700 font-semibold text-base flex items-center gap-2 transition active:scale-98 cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </button>

        <button
          type="button"
          onClick={nextStep}
          className="py-4 px-8 rounded-2xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-bold text-lg flex items-center gap-3 shadow-lg shadow-cyan-500/20 transition active:scale-98 cursor-pointer"
        >
          <span>Continue to Consent</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default StepLanguage;
