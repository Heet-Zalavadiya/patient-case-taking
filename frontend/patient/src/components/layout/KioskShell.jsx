import React, { useState, useEffect } from 'react';
import { usePatient } from '../../context/PatientContext';
import { PatientLogin } from '../steps/PatientLogin';
import { LanguageSelect } from '../steps/LanguageSelect';
import { ConsentScreen } from '../steps/ConsentScreen';
import { PatientHome } from '../steps/PatientHome';
import { 
  Activity, 
  Clock, 
  Languages, 
  Eye, 
  Headphones, 
  SlidersHorizontal, 
  ShieldCheck, 
  Check, 
  ChevronRight, 
  RotateCcw,
  Sparkles,
  HeartPulse,
  Info,
  PhoneCall
} from 'lucide-react';

export const KioskShell = () => {
  const { 
    patientData, 
    setLanguage, 
    setAccessibilityMode, 
    goToStep, 
    resetSession 
  } = usePatient();

  const [currentTime, setCurrentTime] = useState(new Date());
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showAccessMenu, setShowAccessMenu] = useState(false);

  // Live ticking clock for hospital kiosk
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format time: "10:45:12 AM"
  const formattedTime = currentTime.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });

  // Format date: "Thu, 10 Sep 2026"
  const formattedDate = currentTime.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  const steps = [
    { number: 1, title: 'Identification', sub: 'पहचान' },
    { number: 2, title: 'Language', sub: 'भाषा' },
    { number: 3, title: 'Consent', sub: 'सहमति' },
    { number: 4, title: 'Ready', sub: 'टोकन' }
  ];

  // Render appropriate step
  const renderStepContent = () => {
    switch (patientData.current_step) {
      case 1:
        return <PatientLogin />;
      case 2:
        return <LanguageSelect />;
      case 3:
        return <ConsentScreen />;
      case 4:
        return <PatientHome />;
      default:
        return <PatientLogin />;
    }
  };

  const getAccessibilityClasses = () => {
    if (patientData.accessibility_mode === 'large-text-high-contrast') {
      return 'accessibility-high-contrast accessibility-large-text';
    }
    return '';
  };

  return (
    <div className={`h-screen w-screen overflow-hidden flex flex-col bg-slate-950 text-slate-100 select-none relative font-sans ${getAccessibilityClasses()}`}>
      
      {/* Background Medical Ambient Glow & Grid Lines */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-0 left-1/4 w-[600px] h-[350px] bg-cyan-600/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[350px] bg-teal-600/10 rounded-full blur-[140px]" />
        <div 
          className="absolute inset-0 opacity-[0.03]" 
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.8) 1px, transparent 0)`,
            backgroundSize: '36px 36px'
          }}
        />
      </div>

      {/* HEADER + STEPPER WRAPPER */}
      <div className="flex-shrink-0 w-full z-10 pb-4">
        {/* TOP HEADER */}
        <header className="relative z-20 w-full bg-slate-900/90 backdrop-blur-xl border-b border-slate-800/80 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-lg">
          
          {/* Left: Branding & Hospital Logo */}
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-teal-400 to-cyan-600 flex items-center justify-center shadow-lg shadow-cyan-500/25 p-2">
              <HeartPulse className="w-7 h-7 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white m-0 p-0 leading-none">
                  Medi<span className="text-cyan-400">Kiosk</span>
                </h1>
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                  OPD-04
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium tracking-wide">
                Ministry of Ayush • All India Institute of Ayurveda
              </p>
            </div>
          </div>

          {/* Center: Live Clock & Hospital Station info */}
          <div className="hidden lg:flex items-center gap-3 px-4 py-1.5 rounded-full bg-slate-950/70 border border-slate-800 text-slate-300">
            <Clock className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span className="font-mono text-sm font-semibold tracking-wider text-white">
              {formattedTime}
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-xs text-slate-400 font-medium">
              {formattedDate}
            </span>
          </div>

          {/* Right: Quick Language & Accessibility Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Language Selector Pill */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowLangMenu(!showLangMenu);
                  setShowAccessMenu(false);
                }}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 text-xs sm:text-sm font-semibold transition cursor-pointer"
              >
                <Languages className="w-4 h-4 text-cyan-400" />
                <span>{patientData.preferred_language}</span>
              </button>

              {showLangMenu && (
                <div className="absolute right-0 mt-2 w-44 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-1.5 z-50">
                  {['Hindi', 'English', 'Gujarati', 'Marathi', 'Bengali', 'Tamil'].map((lang) => (
                    <button
                      key={lang}
                      onClick={() => {
                        setLanguage(lang);
                        setShowLangMenu(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition ${
                        patientData.preferred_language === lang
                          ? 'bg-cyan-500/20 text-cyan-300'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <span>{lang}</span>
                      {patientData.preferred_language === lang && <Check className="w-4 h-4 text-cyan-400" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Accessibility Switcher Pill */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowAccessMenu(!showAccessMenu);
                  setShowLangMenu(false);
                }}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs sm:text-sm font-semibold transition cursor-pointer ${
                  patientData.accessibility_mode === 'large-text-high-contrast'
                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                    : patientData.accessibility_mode === 'audio-guided'
                    ? 'bg-purple-500/20 border-purple-500/40 text-purple-300'
                    : 'bg-slate-800 hover:bg-slate-750 border-slate-700 text-slate-200'
                }`}
              >
                {patientData.accessibility_mode === 'large-text-high-contrast' ? (
                  <Eye className="w-4 h-4 text-amber-400" />
                ) : patientData.accessibility_mode === 'audio-guided' ? (
                  <Headphones className="w-4 h-4 text-purple-400" />
                ) : (
                  <SlidersHorizontal className="w-4 h-4 text-teal-400" />
                )}
                <span className="hidden sm:inline">
                  {patientData.accessibility_mode === 'large-text-high-contrast'
                    ? 'High Contrast'
                    : patientData.accessibility_mode === 'audio-guided'
                    ? 'Audio Guide'
                    : 'Accessibility'}
                </span>
              </button>

              {showAccessMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-1.5 z-50">
                  {[
                    { id: 'standard', label: 'Standard Mode', icon: SlidersHorizontal },
                    { id: 'audio-guided', label: 'Audio-Guided Assistant', icon: Headphones },
                    { id: 'large-text-high-contrast', label: 'High Contrast & Big Text', icon: Eye }
                  ].map((mode) => {
                    const IconComp = mode.icon;
                    return (
                      <button
                        key={mode.id}
                        onClick={() => {
                          setAccessibilityMode(mode.id);
                          setShowAccessMenu(false);
                        }}
                        className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition ${
                          patientData.accessibility_mode === mode.id
                            ? 'bg-teal-500/20 text-teal-300'
                            : 'text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <IconComp className="w-4 h-4" />
                          <span>{mode.label}</span>
                        </div>
                        {patientData.accessibility_mode === mode.id && <Check className="w-4 h-4 text-teal-400" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Reset Kiosk Button */}
            <button
              type="button"
              onClick={resetSession}
              title="Reset Kiosk Session"
              className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950/50 hover:text-rose-400 hover:border-rose-800/60 border border-slate-700 text-slate-400 transition cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

          </div>
        </header>

        {/* STEPPER PROGRESS BAR */}
        <div className="relative z-10 w-full bg-slate-900/60 backdrop-blur-md border-b border-slate-800/60 py-3.5 px-4 sm:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-4 gap-2 sm:gap-4 relative">
              
              {steps.map((step) => {
                const isCompleted = patientData.current_step > step.number;
                const isCurrent = patientData.current_step === step.number;

                return (
                  <button
                    key={step.number}
                    type="button"
                    onClick={() => {
                      // Allow navigating to visited steps or step 1
                      if (isCompleted || step.number <= patientData.current_step) {
                        goToStep(step.number);
                      }
                    }}
                    className={`group flex items-center gap-2 sm:gap-3 p-2 sm:p-2.5 rounded-2xl transition-all text-left ${
                      isCurrent
                        ? 'bg-cyan-500/15 border border-cyan-500/40 shadow-md shadow-cyan-500/10'
                        : isCompleted
                        ? 'bg-slate-900/40 border border-teal-500/30 text-teal-300'
                        : 'bg-slate-950/30 border border-slate-800/50 text-slate-500 opacity-60'
                    }`}
                  >
                    {/* Step Number Circle */}
                    <div
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center font-bold text-xs sm:text-sm shrink-0 transition-all ${
                        isCompleted
                          ? 'bg-teal-500 text-slate-950 shadow-sm'
                          : isCurrent
                          ? 'bg-cyan-400 text-slate-950 ring-4 ring-cyan-500/20 font-black'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {isCompleted ? <Check className="w-4 h-4 stroke-[3]" /> : step.number}
                    </div>

                    {/* Step Label */}
                    <div className="truncate">
                      <div className={`text-xs sm:text-sm font-bold truncate ${
                        isCurrent ? 'text-white' : isCompleted ? 'text-teal-300' : 'text-slate-400'
                      }`}>
                        {step.title}
                      </div>
                      <div className="text-[10px] text-slate-500 hidden sm:block">
                        {step.sub}
                      </div>
                    </div>
                  </button>
                );
              })}

            </div>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT CONTAINER */}
      <main className="relative z-10 flex-1 overflow-y-auto w-full px-6 py-4 mt-2 flex flex-col items-center">
        <div className="w-full max-w-6xl mx-auto transition-all duration-300 ease-in-out">
          {renderStepContent()}
        </div>
      </main>

      {/* BOTTOM KIOSK FOOTER */}
      <footer className="flex-shrink-0 relative z-20 w-full bg-slate-900/90 backdrop-blur-xl border-t border-slate-800/80 px-4 sm:px-8 py-2.5 flex items-center justify-between text-xs text-slate-400">
        
        {/* Left: Compliance & Security Notice */}
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-teal-400" />
          <span className="hidden sm:inline">DPDP Act 2023 & Ayushman Bharat (ABDM) Compliant Node</span>
          <span className="sm:hidden">DPDP & ABDM Compliant</span>
        </div>

        {/* Center: Active Session Token Badge if generated */}
        {patientData.token_number && (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-bold text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Active Token: {patientData.token_number}</span>
          </div>
        )}

        {/* Right: Hospital Staff Assistance */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-slate-400">
            <PhoneCall className="w-3.5 h-3.5 text-cyan-400" />
            <span>Staff Help: <strong>Desk 01 / Ext. 104</strong></span>
          </div>
        </div>

      </footer>

    </div>
  );
};

export default KioskShell;
