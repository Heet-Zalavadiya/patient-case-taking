import React, { useState, useEffect } from 'react';
import { usePatient } from '../../context/PatientContext';
import { PatientLogin } from '../steps/PatientLogin';
import { LanguageSelect } from '../steps/LanguageSelect';
import { ConsentScreen } from '../steps/ConsentScreen';
import { AiInterview } from '../steps/AiInterview';
import { BodyMapStep } from '../steps/BodyMapStep';
import { DocumentUpload } from '../steps/DocumentUpload';
import { CaseSummaryToken } from '../steps/CaseSummaryToken';
import { ChatbotWidget } from '../common/ChatbotWidget';
import { speakPhrase } from '../../utils/speechUtils';
import { subscribeBackendStatus, apiCheckHealth } from '../../services/api';
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
  Moon,
  Volume2
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
  const [isBackendOnline, setIsBackendOnline] = useState(false);

  // Subscribe to backend online / resilient mock status
  useEffect(() => {
    const unsubscribe = subscribeBackendStatus((online) => {
      setIsBackendOnline(online);
    });
    apiCheckHealth();
    const interval = setInterval(() => {
      apiCheckHealth();
    }, 10000);
    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

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
    { number: 5, title: 'Body Map', sub: 'दर्द स्थल' },
    { number: 6, title: 'Upload Docs', sub: 'दस्तावेज़' },
    { number: 7, title: 'Token', sub: 'टोकन' }
  ];

  // Audio-guided accessibility: announce screen name after 400ms delay
  useEffect(() => {
    if (patientData.accessibility_mode !== 'audio-guided') return;
    // Step 4 (AI Interview), Step 5 (BodyMapStep) and Step 7 (CaseSummaryToken) handle their own rich question/token narration
    if (patientData.current_step === 4 || patientData.current_step === 5 || patientData.current_step === 7) return;

    const screenAnnouncements = {
      1: {
        Hindi: 'मरीज़ पहचान एवं लॉगिन स्क्रीन पर आपका स्वागत है।',
        English: 'Welcome to Patient Login. Please enter your ABHA number or mobile.',
        Gujarati: 'દર્દી ઓળખ અને લૉગિન સ્ક્રીનમાં આપનું સ્વાગત છે.',
        Marathi: 'रुग्ण ओळख आणि लॉगिन स्क्रीनवर आपले स्वागत आहे.',
        Tamil: 'நோயாளி உள்நுழைவு திரைக்கு வரவேற்கிறோம்.',
        Bengali: 'রোগী লগইন স্ক্রিনে আপনাকে স্বাগতম।'
      },
      2: {
        Hindi: 'कृपया अपनी पसंदीदा भाषा चुनें।',
        English: 'Please select your preferred language.',
        Gujarati: 'કૃપા કરીને તમારી પસંદગીની ભાષા પસંદ કરો.',
        Marathi: 'कृपया आपली पसंतीची भाषा निवडा.',
        Tamil: 'தயவுசெய்து உங்கள் விருப்பமான மொழியைத் தேர்ந்தெடுக்கவும்.',
        Bengali: 'অনুগ্রহ করে আপনার পছন্দের ভাষা নির্বাচন করুন।'
      },
      3: {
        Hindi: 'डिजिटल व्यक्तिगत डेटा संरक्षण सहमति स्क्रीन।',
        English: 'Digital Personal Data Protection Consent Screen.',
        Gujarati: 'ડિજિટલ પર્સનલ ડેટા પ્રોટેક્શન સંમતિ સ્ક્રીન.',
        Marathi: 'डिजिटल वैयक्तिक डेटा संरक्षण संमती स्क्रीन.',
        Tamil: 'டிஜிட்டல் தனிநபர் தரவு பாதுகாப்பு ஒப்புதல் திரை.',
        Bengali: 'ডিজিটাল ব্যক্তিগত ডেটা সুরক্ষা সম্মতি স্ক্রিন।'
      },
      6: {
        Hindi: 'पूर्व मेडिकल पर्ची और जांच रिपोर्ट अपलोड स्क्रीन।',
        English: 'Medical Document and Prescription Upload Screen.',
        Gujarati: 'મેડિકલ દસ્તાવેજ અને પ્રિસ્ક્રિપ્શન અપલોડ સ્ક્રીન.',
        Marathi: 'वैद्यकीय दस्तऐवज आणि प्रिस्क्रिप्शन अपलोड स्क्रीन.',
        Tamil: 'மருத்துவ ஆவணங்கள் மற்றும் மருந்து சீட்டு பதிவேற்ற திரை.',
        Bengali: 'মেডিকেল নথি এবং প্রেসক্রিপশন আপলোড স্ক্রিন।'
      }
    };

    const currentLang = patientData.preferred_language || 'Hindi';
    const msg = screenAnnouncements[patientData.current_step]?.[currentLang] || screenAnnouncements[patientData.current_step]?.['Hindi'];

    if (!msg) return;

    const t = setTimeout(() => {
      speakPhrase(msg, currentLang);
    }, 400);

    return () => clearTimeout(t);
  }, [patientData.current_step, patientData.accessibility_mode, patientData.preferred_language]);

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
        return <BodyMapStep />;
      case 6:
        return <DocumentUpload />;
      case 7:
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
    <div className={`relative min-h-screen w-full overflow-x-hidden overflow-y-auto select-none font-sans transition-colors duration-500 ${isLight ? 'text-slate-900' : 'text-slate-100'} ${getAccessibilityClasses()}`}>
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

      {/* FLOATING DARK / LIGHT MODE TOGGLE BUTTON */}
      <button
        type="button"
        onClick={toggleTheme}
        className={`fixed top-4 right-4 z-50 p-2.5 sm:px-3.5 sm:py-2 rounded-2xl border-2 backdrop-blur-xl transition-all duration-300 transform active:scale-95 cursor-pointer shadow-xl flex items-center gap-2 ${
          isLight
            ? 'bg-white/90 hover:bg-slate-100 border-slate-300 text-amber-600 shadow-slate-400/20'
            : 'bg-slate-900/90 hover:bg-slate-800 border-slate-700 text-cyan-400 shadow-slate-950/60'
        }`}
        title={isLight ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
      >
        {isLight ? (
          <>
            <Moon className="w-5 h-5 text-amber-500 fill-amber-500" />
            <span className="text-xs font-black text-slate-800 hidden sm:inline">Dark Mode</span>
          </>
        ) : (
          <>
            <Sun className="w-5 h-5 text-amber-400 fill-amber-400" />
            <span className="text-xs font-black text-slate-200 hidden sm:inline">Light Mode</span>
          </>
        )}
      </button>

      {/* LAYER 3: ACTUAL KIOSK CONTENT (SCROLLABLE SINGLE VIEWPORT PAGE) */}
      <div className="relative z-10 flex flex-col items-center justify-start min-h-screen w-full bg-transparent p-2 sm:p-4 overflow-y-auto">
        <main className={`w-full ${patientData.current_step >= 4 ? 'max-w-4xl' : 'max-w-xl'} mx-auto flex flex-col items-center justify-center min-h-[calc(100vh-2rem)] py-3 sm:py-6 transition-all duration-300 ease-in-out`}>
          {renderStepContent()}
        </main>
      </div>

      {/* LAYER 4: MEDIKIOSK AI CHATBOT WIDGET (Visible ONLY after 1st page login for authenticated patients) */}
      {patientData.current_step > 1 && Boolean(patientData.patient_id) && (
        <ChatbotWidget isLight={isLight} />
      )}
    </div>
  );
};

export default KioskShell;
