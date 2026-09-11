import React, { useState, useEffect } from 'react';
import { usePatient } from '../../context/PatientContext';
import { PatientLogin } from '../steps/PatientLogin';
import { LanguageSelect } from '../steps/LanguageSelect';
import { ConsentScreen } from '../steps/ConsentScreen';
import { AiInterview } from '../steps/AiInterview';
import { DocumentUpload } from '../steps/DocumentUpload';
import { CaseSummaryToken } from '../steps/CaseSummaryToken';
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
  PhoneCall,
  Sun,
  Moon
} from 'lucide-react';

export const KioskShell = () => {
  const { 
    patientData, 
    theme,
    toggleTheme,
    setLanguage, 
    setAccessibilityMode, 
    goToStep, 
    resetSession 
  } = usePatient();

  const isLight = theme === 'light';

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
    { number: 1, title: 'Login', sub: 'पहचान' },
    { number: 2, title: 'Language', sub: 'भाषा' },
    { number: 3, title: 'Consent', sub: 'सहमति' },
    { number: 4, title: 'AI Case-Taking', sub: 'एआई इनटेक' },
    { number: 5, title: 'Upload Docs', sub: 'दस्तावेज़' },
    { number: 6, title: 'Token', sub: 'टोकन' }
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
        return <AiInterview />;
      case 5:
        return <DocumentUpload />;
      case 6:
        return <CaseSummaryToken />;
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
    <div className={`relative min-h-screen w-full overflow-hidden select-none font-sans transition-colors duration-500 ${isLight ? 'text-slate-900' : 'text-slate-100'} ${getAccessibilityClasses()}`}>
      {/* LAYER 1: CUSTOM KIOSK AMBIENT BACKGROUND VIDEO */}
      <video
        key="custom-kiosk-bg-video"
        autoPlay
        loop
        muted
        playsInline
        className="fixed inset-0 w-full h-full object-cover pointer-events-none -z-30 brightness-[0.85] contrast-[1.05]"
        src="/bg-video.mp4"
      />

      {/* LAYER 2: DYNAMIC GLASS OVERLAY (MUST BE SEMI-TRANSPARENT, NEVER SOLID) */}
      <div 
        className={`fixed inset-0 pointer-events-none -z-20 transition-all duration-300 ${
          theme === 'dark' 
            ? 'bg-slate-950/70 backdrop-blur-[2px]' 
            : 'bg-slate-900/10 bg-gradient-to-b from-white/35 via-transparent to-white/40 backdrop-blur-[1px]'
        }`} 
      />

      {/* LAYER 3: ACTUAL KIOSK CONTENT (TRANSPARENT BACKGROUND) */}
      <div className="relative z-10 flex flex-col h-screen w-full bg-transparent">
        {/* HEADER + STEPPER WRAPPER */}
        <div className="flex-shrink-0 w-full z-10 pb-2 sm:pb-4">
        
        {/* TOP HEADER */}
        <header
          className={`relative z-20 w-full backdrop-blur-xl border-b px-3 py-2 sm:px-6 sm:py-3 flex flex-wrap items-center justify-between gap-2 shadow-lg transition-colors duration-300 ${
            isLight
              ? 'bg-white/95 border-slate-200/90 shadow-slate-200/50 text-slate-900'
              : 'bg-slate-900/90 border-slate-800/80 shadow-slate-950/50 text-white'
          }`}
        >
          {/* Left: Branding & Hospital Logo */}
          <div className="flex items-center gap-2 sm:gap-3.5">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-gradient-to-br from-teal-400 to-cyan-600 flex items-center justify-center shadow-lg shadow-cyan-500/25 p-1.5 sm:p-2 shrink-0">
              <HeartPulse className="w-5 h-5 sm:w-7 sm:h-7 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h1 className="text-base sm:text-2xl font-bold sm:font-black tracking-tight m-0 p-0 leading-none">
                  Medi<span className="text-cyan-500">Kiosk</span>
                </h1>
                <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-[10px] sm:text-[11px] font-bold text-emerald-500 uppercase tracking-wider">
                  OPD-04
                </span>
              </div>
              <p className={`text-[11px] font-medium tracking-wide hidden sm:block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Ministry of Ayush • All India Institute of Ayurveda
              </p>
            </div>
          </div>

          {/* Center: Live Clock & Hospital Station info (hidden on mobile/tablet) */}
          <div
            className={`hidden lg:flex items-center gap-3 px-4 py-1.5 rounded-full border transition-colors ${
              isLight
                ? 'bg-slate-100/90 border-slate-200 text-slate-700 shadow-inner'
                : 'bg-slate-950/70 border-slate-800 text-slate-300'
            }`}
          >
            <Clock className="w-4 h-4 text-cyan-500 animate-pulse" />
            <span className={`font-mono text-sm font-semibold tracking-wider ${isLight ? 'text-slate-900' : 'text-white'}`}>
              {formattedTime}
            </span>
            <span className={isLight ? 'text-slate-300' : 'text-slate-600'}>|</span>
            <span className={`text-xs font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              {formattedDate}
            </span>
          </div>

          {/* Right: Quick Language, Theme & Accessibility Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            
            {/* Theme Toggle Pill (Dark / Light) */}
            <button
              type="button"
              onClick={toggleTheme}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-xl border text-xs sm:text-sm font-semibold transition cursor-pointer active:scale-95 ${
                isLight
                  ? 'bg-amber-100/90 hover:bg-amber-200/90 border-amber-300/80 text-amber-900 shadow-sm'
                  : 'bg-slate-800 hover:bg-slate-750 border-slate-700 text-slate-200'
              }`}
              title="Toggle Dark / Light Theme"
            >
              {isLight ? (
                <>
                  <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600" />
                  <span className="font-bold hidden xs:inline">Light</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400" />
                  <span className="font-bold hidden xs:inline">Dark</span>
                </>
              )}
            </button>

            {/* Language Selector Pill */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowLangMenu(!showLangMenu);
                  setShowAccessMenu(false);
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-xl border text-xs sm:text-sm font-semibold transition cursor-pointer ${
                  isLight
                    ? 'bg-white hover:bg-slate-100 border-slate-300 text-slate-800 shadow-sm'
                    : 'bg-slate-800 hover:bg-slate-750 border-slate-700 text-slate-200'
                }`}
              >
                <Languages className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-500" />
                <span className="truncate max-w-[55px] sm:max-w-none">{patientData.preferred_language}</span>
              </button>

              {showLangMenu && (
                <div
                  className={`absolute right-0 mt-2 w-44 rounded-2xl shadow-2xl p-1.5 z-50 border ${
                    isLight
                      ? 'bg-white border-slate-200 text-slate-800 shadow-slate-400/30'
                      : 'bg-slate-900 border-slate-700 text-slate-200'
                  }`}
                >
                  {['Hindi', 'English', 'Gujarati', 'Marathi', 'Bengali', 'Tamil'].map((lang) => (
                    <button
                      key={lang}
                      onClick={() => {
                        setLanguage(lang);
                        setShowLangMenu(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition ${
                        patientData.preferred_language === lang
                          ? 'bg-cyan-500/20 text-cyan-600 font-bold'
                          : isLight
                          ? 'text-slate-700 hover:bg-slate-100'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <span>{lang}</span>
                      {patientData.preferred_language === lang && <Check className="w-4 h-4 text-cyan-500" />}
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
                className={`flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-xl border text-xs sm:text-sm font-semibold transition cursor-pointer ${
                  patientData.accessibility_mode === 'large-text-high-contrast'
                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-500'
                    : patientData.accessibility_mode === 'audio-guided'
                    ? 'bg-purple-500/20 border-purple-500/50 text-purple-500'
                    : isLight
                    ? 'bg-white hover:bg-slate-100 border-slate-300 text-slate-800 shadow-sm'
                    : 'bg-slate-800 hover:bg-slate-750 border-slate-700 text-slate-200'
                }`}
              >
                {patientData.accessibility_mode === 'large-text-high-contrast' ? (
                  <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500" />
                ) : patientData.accessibility_mode === 'audio-guided' ? (
                  <Headphones className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-500" />
                ) : (
                  <SlidersHorizontal className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-teal-500" />
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
                <div
                  className={`absolute right-0 mt-2 w-56 rounded-2xl shadow-2xl p-1.5 z-50 border ${
                    isLight
                      ? 'bg-white border-slate-200 text-slate-800 shadow-slate-400/30'
                      : 'bg-slate-900 border-slate-700 text-slate-200'
                  }`}
                >
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
                            ? 'bg-teal-500/20 text-teal-600 font-bold'
                            : isLight
                            ? 'text-slate-700 hover:bg-slate-100'
                            : 'text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <IconComp className="w-4 h-4" />
                          <span>{mode.label}</span>
                        </div>
                        {patientData.accessibility_mode === mode.id && <Check className="w-4 h-4 text-teal-500" />}
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
              className={`p-1.5 sm:p-2 rounded-xl border transition cursor-pointer ${
                isLight
                  ? 'bg-white hover:bg-rose-50 hover:text-rose-600 hover:border-rose-300 border-slate-300 text-slate-600 shadow-sm'
                  : 'bg-slate-800 hover:bg-rose-950/50 hover:text-rose-400 hover:border-rose-800/60 border-slate-700 text-slate-400'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>

          </div>
        </header>

        {/* STEPPER PROGRESS BAR */}
        <div
          className={`relative z-10 w-full backdrop-blur-md border-b py-2 sm:py-3.5 px-3 sm:px-8 transition-colors duration-300 ${
            isLight
              ? 'bg-white/80 border-slate-200/80 shadow-sm'
              : 'bg-slate-900/60 border-slate-800/60'
          }`}
        >
          {/* Mobile Stepper (<md) */}
          <div
            className={`flex md:hidden items-center justify-between w-full px-3.5 py-2 backdrop-blur-md rounded-xl border text-xs transition-colors duration-300 ${
              isLight
                ? 'bg-white/90 border-slate-200 text-slate-800 shadow-xs'
                : 'bg-slate-900/80 border-slate-700/60 text-slate-200'
            }`}
          >
            <span className="font-bold text-emerald-500">Step {patientData.current_step} of 6</span>
            <span className={`font-semibold ${isLight ? 'text-slate-800' : 'text-slate-100'}`}>
              {patientData.current_step === 1 && "1. Login / पहचान"}
              {patientData.current_step === 2 && "2. Language / भाषा"}
              {patientData.current_step === 3 && "3. Consent / सहमति"}
              {patientData.current_step === 4 && "4. AI Intake / केस"}
              {patientData.current_step === 5 && "5. Upload / दस्तावेज़"}
              {patientData.current_step === 6 && "6. Token / टोकन"}
            </span>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className={`h-1.5 w-3 rounded-full transition-all ${
                    i <= patientData.current_step ? 'bg-emerald-500' : isLight ? 'bg-slate-300' : 'bg-slate-700'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Desktop Stepper (>=md) */}
          <div className="hidden md:block max-w-5xl mx-auto">
            <div className="grid grid-cols-6 gap-2 sm:gap-2.5 relative">
              
              {steps.map((step) => {
                const isCompleted = patientData.current_step > step.number;
                const isCurrent = patientData.current_step === step.number;

                return (
                  <button
                    key={step.number}
                    type="button"
                    onClick={() => {
                      if (isCompleted || step.number <= patientData.current_step) {
                        goToStep(step.number);
                      }
                    }}
                    className={`group flex items-center gap-2 sm:gap-3 p-2 sm:p-2.5 rounded-2xl transition-all text-left ${
                      isCurrent
                        ? isLight
                          ? 'bg-cyan-50 border border-cyan-400 shadow-md shadow-cyan-100 ring-2 ring-cyan-400/20'
                          : 'bg-cyan-500/15 border border-cyan-500/40 shadow-md shadow-cyan-500/10'
                        : isCompleted
                        ? isLight
                          ? 'bg-emerald-50/80 border border-emerald-300 text-emerald-800'
                          : 'bg-slate-900/40 border border-teal-500/30 text-teal-300'
                        : isLight
                        ? 'bg-slate-100/70 border border-slate-200 text-slate-400 opacity-70'
                        : 'bg-slate-950/30 border border-slate-800/50 text-slate-500 opacity-60'
                    }`}
                  >
                    {/* Step Number Circle */}
                    <div
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center font-bold text-xs sm:text-sm shrink-0 transition-all ${
                        isCompleted
                          ? 'bg-teal-500 text-slate-950 shadow-sm font-black'
                          : isCurrent
                          ? isLight
                            ? 'bg-cyan-600 text-white ring-4 ring-cyan-400/30 font-black'
                            : 'bg-cyan-400 text-slate-950 ring-4 ring-cyan-500/20 font-black'
                          : isLight
                          ? 'bg-slate-200 text-slate-600'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {isCompleted ? <Check className="w-4 h-4 stroke-[3]" /> : step.number}
                    </div>

                    {/* Step Label */}
                    <div className="truncate">
                      <div
                        className={`text-xs sm:text-sm font-bold truncate ${
                          isCurrent
                            ? isLight ? 'text-cyan-950' : 'text-white'
                            : isCompleted
                            ? isLight ? 'text-emerald-800' : 'text-teal-300'
                            : isLight ? 'text-slate-500' : 'text-slate-400'
                        }`}
                      >
                        {step.title}
                      </div>
                      <div className={`text-[10px] hidden sm:block ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
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

      {/* 3. MAIN CONTENT CONTAINER */}
      <main className="relative z-10 flex-1 overflow-y-auto w-full px-3 sm:px-6 py-2 sm:py-4 flex flex-col items-center bg-transparent">
        <div className="w-full max-w-5xl mx-auto transition-all duration-300 ease-in-out">
          {renderStepContent()}
        </div>
      </main>

      {/* 4. BOTTOM KIOSK FOOTER */}
      <footer
        className={`flex-shrink-0 relative z-20 w-full backdrop-blur-xl border-t px-3 sm:px-8 py-2 sm:py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs transition-colors duration-300 ${
          isLight
            ? 'bg-white/95 border-slate-200/90 text-slate-600 shadow-md'
            : 'bg-slate-900/90 border-slate-800/80 text-slate-400'
        }`}
      >
        {/* Left: Compliance & Security Notice */}
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-teal-500" />
          <span className="hidden sm:inline">DPDP Act 2023 & Ayushman Bharat (ABDM) Compliant Node</span>
          <span className="sm:hidden">DPDP & ABDM Compliant</span>
        </div>

        {/* Center: Active Session Token Badge if generated */}
        {patientData.token_number && (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 font-bold text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Active Token: {patientData.token_number}</span>
          </div>
        )}

        {/* Right: Hospital Staff Assistance */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <PhoneCall className="w-3.5 h-3.5 text-cyan-500" />
            <span>Staff Help: <strong>Desk 01 / Ext. 104</strong></span>
          </div>
        </div>
      </footer>

      </div>
    </div>
  );
};

export default KioskShell;
