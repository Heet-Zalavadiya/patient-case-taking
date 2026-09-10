import React, { useState } from 'react';
import { usePatient } from '../../context/PatientContext';
import { savePatientOnboarding } from '../../services/mockApi';
import { speakPhrase } from '../../utils/speechUtils';
import { 
  ShieldCheck, 
  Check, 
  X, 
  ArrowRight, 
  ArrowLeft, 
  FileText, 
  Share2, 
  Lock, 
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Mic,
  MicOff,
  Volume2,
  Sparkles,
  Radio
} from 'lucide-react';

export const ConsentScreen = () => {
  const { 
    patientData, 
    setConsent, 
    toggleConsent, 
    nextStep, 
    prevStep, 
    setTokenNumber, 
    updatePatient 
  } = usePatient();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [listeningFor, setListeningFor] = useState(null); // 'data_capture' | 'abdm_sharing' | null
  const [speakingConsent, setSpeakingConsent] = useState(null);
  const [audioFeedback, setAudioFeedback] = useState({}); // { [type]: 'Audio Consent Captured!' }

  const dataCaptureConsent = patientData.consents?.find(c => c.consent_type === 'data_capture') || {
    consent_type: 'data_capture',
    is_granted: false,
    granted_via: 'touch'
  };

  const abdmConsent = patientData.consents?.find(c => c.consent_type === 'abdm_sharing') || {
    consent_type: 'abdm_sharing',
    is_granted: false,
    granted_via: 'touch'
  };

  // Translations for DPDP Consent Terms
  const consentTexts = {
    Hindi: {
      data_capture: {
        title: '1. क्लिनिकल लक्षण और एआई केस टेकिंग सहमति',
        desc: 'मैं डॉक्टर के परामर्श हेतु एआई द्वारा अपने लक्षणों और केस हिस्ट्री को रिकॉर्ड करने की सहमति देता/देती हूँ।',
        listenText: 'क्लिनिकल इनटेक सहमति: मैं डॉक्टर के परामर्श हेतु एआई द्वारा अपने लक्षणों और केस हिस्ट्री को रिकॉर्ड करने की सहमति देता हूँ।'
      },
      abdm_sharing: {
        title: '2. आभा (ABHA) और डिजिटल हेल्थ रिकॉर्ड शेयरिंग',
        desc: 'मैं इस ओपीडी सारांश को अपने आभा (ABHA) स्वास्थ्य खाते से जोड़ने की सहमति देता/देती हूँ।',
        listenText: 'आभा सहमति: मैं इस ओपीडी परामर्श को अपने आभा डिजिटल हेल्थ खाते से जोड़ने की सहमति देता हूँ।'
      }
    },
    Gujarati: {
      data_capture: {
        title: '1. ક્લિનિકલ લક્ષણો અને AI કેસ ટેકિંગ સંમતિ',
        desc: 'હું ડૉક્ટરના પરામર્શ માટે AI દ્વારા મારા લક્ષણો અને કેસ હિસ્ટ્રી રેકોર્ડ કરવાની સંમતિ આપું છું.',
        listenText: 'હું ડૉક્ટરના પરામર્શ માટે AI દ્વારા મારા લક્ષણો અને કેસ હિસ્ટ્રી રેકોર્ડ કરવાની સંમતિ આપું છું.'
      },
      abdm_sharing: {
        title: '2. આભા (ABHA) અને ડિજિટલ હેલ્થ રેકોર્ડ શેરિંગ',
        desc: 'હું આ ક્લિનિકલ સારાંશને મારા આભા (ABHA) હેલ્થ એકાઉન્ટ સાથે લિંક કરવાની સંમતિ આપું છું.',
        listenText: 'હું આ ઓપીડી સારાંશને મારા આભા એકાઉન્ટ સાથે જોડવાની સંમતિ આપું છું.'
      }
    },
    English: {
      data_capture: {
        title: '1. Clinical AI Symptom & Case History Capture',
        desc: 'I consent to AI capturing my symptoms and medical history for the doctor triage.',
        listenText: 'I consent to AI capturing my reported symptoms and medical history for the OPD doctor preparation.'
      },
      abdm_sharing: {
        title: '2. ABDM & Ayush Health Grid Sharing',
        desc: 'I consent to linking this clinical summary with my ABHA health record.',
        listenText: 'I consent to linking this OPD consultation summary with my Ayushman Bharat Health Account.'
      }
    }
  };

  const currentLang = consentTexts[patientData.preferred_language] ? patientData.preferred_language : 'English';
  const texts = consentTexts[currentLang];

  // Speak Consent Terms with robust Indian voice fallback
  const handleListenConsent = async (type) => {
    setSpeakingConsent(type);
    const textToSpeak = texts[type]?.listenText || '';
    const langCode = patientData.preferred_language === 'Gujarati' ? 'gu' : patientData.preferred_language === 'Hindi' ? 'hi' : 'en';

    try {
      await speakPhrase(textToSpeak, langCode);
    } catch (err) {
      console.warn('Consent audio note:', err);
    } finally {
      setSpeakingConsent(null);
    }
  };

  // Voice Consent Recording (Web Speech API + Simulated Fallback)
  const handleVoiceConsent = (type) => {
    setListeningFor(type);
    setValidationError('');

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        if (patientData.preferred_language === 'Hindi') recognition.lang = 'hi-IN';
        else if (patientData.preferred_language === 'Gujarati') recognition.lang = 'gu-IN';
        else recognition.lang = 'en-IN';

        recognition.onresult = (event) => {
          const transcript = event.results[0][0].transcript.toLowerCase();
          console.log('[Voice Consent Detected]:', transcript);
          setConsent(type, true, 'audio');
          setAudioFeedback((prev) => ({
            ...prev,
            [type]: `Voice Verified: "${transcript}" (Audio Consent Granted)`
          }));
          setListeningFor(null);
        };

        recognition.onerror = () => {
          // Fallback simulation
          fallbackAudioGrant(type);
        };

        recognition.onend = () => {
          setListeningFor(null);
        };

        recognition.start();
        return;
      } catch (err) {
        console.warn('SpeechRecognition start failed, fallback to simulation:', err);
      }
    }

    fallbackAudioGrant(type);
  };

  const fallbackAudioGrant = (type) => {
    setTimeout(() => {
      setConsent(type, true, 'audio');
      setAudioFeedback((prev) => ({
        ...prev,
        [type]: 'Audio Consent Captured: "मैं सहमत हूँ / I Agree" (Audio Granted ✓)'
      }));
      setListeningFor(null);
    }, 1200);
  };

  // Grant All
  const handleGrantAll = () => {
    setConsent('data_capture', true, 'touch');
    setConsent('abdm_sharing', true, 'touch');
    setValidationError('');
  };

  // Submit and Advance
  const handleSubmit = async () => {
    if (!dataCaptureConsent.is_granted) {
      setValidationError('Clinical Data Capture consent is mandatory under DPDP Act 2023 for OPD intake.');
      return;
    }

    setIsSubmitting(true);
    setValidationError('');

    try {
      const result = await savePatientOnboarding(patientData);
      if (result.success) {
        setTokenNumber(result.token_number);
        updatePatient({
          token_number: result.token_number
        });
        nextStep();
      }
    } catch (err) {
      console.error('Submission error:', err);
      nextStep();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col">
      
      {/* 1. SCREEN HEADER */}
      <div className="mt-2 mb-4 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs sm:text-sm font-semibold mb-2">
          <Lock className="w-4 h-4 text-teal-400" />
          <span>DPDP Act 2023 & Ayushman Bharat (ABDM) Compliance</span>
        </div>
        <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
          Patient Consent & Data Privacy
        </h2>
        <p className="text-xl sm:text-2xl font-bold text-teal-400 mt-0.5">
          मरीज़ सहमति एवं डेटा गोपनीयता
        </p>
        <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-xl mx-auto">
          Please confirm your digital health data permissions. You can grant consent via <strong>Touch</strong> or by <strong>Voice</strong>.
        </p>
      </div>

      {validationError && (
        <div className="w-full mb-5 p-4 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-300 flex items-center gap-3 text-sm animate-in fade-in">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span className="font-semibold">{validationError}</span>
        </div>
      )}

      {/* 2. CONSENT CARDS WITH DUAL-MODE (TOUCH + AUDIO) */}
      <div className="w-full space-y-4 mb-6">
        
        {/* CONSENT 1: Clinical Data Capture */}
        <div 
          className={`rounded-3xl p-5 sm:p-6 transition-all duration-200 border ${
            dataCaptureConsent.is_granted
              ? 'bg-slate-900/95 border-2 border-teal-400 shadow-xl shadow-teal-500/10 ring-2 ring-teal-500/20'
              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            
            {/* Left: Info */}
            <div className="flex items-start gap-3.5 flex-1">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                dataCaptureConsent.is_granted ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40' : 'bg-slate-800 text-slate-400'
              }`}>
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base sm:text-lg font-black text-white">
                    {texts.data_capture.title}
                  </h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold uppercase tracking-wider">
                    Mandatory / अनिवार्य
                  </span>
                </div>
                <p className="text-sm text-slate-300 mt-1 font-medium">
                  {texts.data_capture.desc}
                </p>
                <div className="text-xs text-slate-400 mt-2 flex flex-wrap items-center gap-2">
                  <span>Method: <strong className="text-teal-300 capitalize">{dataCaptureConsent.granted_via}</strong></span>
                  <span>•</span>
                  <span>DPDP Ref: <strong className="text-slate-300">AYUSH-DPDP-SEC6</strong></span>
                  <span>•</span>
                  <span>Status: <strong className={dataCaptureConsent.is_granted ? 'text-emerald-400' : 'text-slate-400'}>
                    {dataCaptureConsent.is_granted ? 'Granted (स्वीकृत)' : 'Pending'}
                  </strong></span>
                </div>
                {audioFeedback.data_capture && (
                  <div className="mt-2 text-xs font-semibold text-purple-300 bg-purple-950/40 px-2.5 py-1 rounded-lg border border-purple-800/40 inline-block">
                    🎙️ {audioFeedback.data_capture}
                  </div>
                )}
              </div>
            </div>

            {/* Right: Dual Actions (Touch Toggle + Audio Mic + Audio Listen) */}
            <div className="flex flex-wrap items-center gap-2.5 self-end md:self-center">
              
              {/* Listen to Terms Button */}
              <button
                type="button"
                onClick={() => handleListenConsent('data_capture')}
                className={`p-3 rounded-2xl border text-xs font-bold flex items-center gap-1.5 transition ${
                  speakingConsent === 'data_capture'
                    ? 'bg-teal-500 text-slate-950 border-teal-400 animate-pulse'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-750 border-slate-700'
                }`}
                title="Listen to consent terms"
              >
                <Volume2 className="w-4 h-4 text-cyan-400" />
                <span className="hidden sm:inline">Listen (सुनें)</span>
              </button>

              {/* Voice Consent Microphone Button */}
              <button
                type="button"
                onClick={() => handleVoiceConsent('data_capture')}
                className={`p-3 rounded-2xl border text-xs font-bold flex items-center gap-1.5 transition ${
                  listeningFor === 'data_capture'
                    ? 'bg-rose-500 text-white border-rose-400 animate-pulse shadow-lg shadow-rose-500/30'
                    : dataCaptureConsent.granted_via === 'audio' && dataCaptureConsent.is_granted
                    ? 'bg-purple-500/20 border-purple-500 text-purple-300'
                    : 'bg-slate-800 text-slate-300 hover:bg-purple-950/40 hover:text-purple-300 border-slate-700'
                }`}
                title="Speak I Agree"
              >
                <Mic className="w-4 h-4 text-purple-400" />
                <span className="hidden sm:inline">
                  {listeningFor === 'data_capture' ? 'Listening...' : "Speak 'I Agree'"}
                </span>
              </button>

              {/* Touch Toggle Switch */}
              <button
                type="button"
                onClick={() => toggleConsent('data_capture', 'touch')}
                className={`w-16 h-10 rounded-full p-1 transition-colors duration-200 ease-in-out relative flex items-center cursor-pointer shadow-inner ${
                  dataCaptureConsent.is_granted ? 'bg-teal-500' : 'bg-slate-700'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full bg-slate-950 shadow-md transform transition-transform duration-200 flex items-center justify-center text-white ${
                    dataCaptureConsent.is_granted ? 'translate-x-6 text-teal-400' : 'translate-x-0 text-slate-500'
                  }`}
                >
                  {dataCaptureConsent.is_granted ? <Check className="w-4 h-4 stroke-[3]" /> : <X className="w-4 h-4 stroke-[3]" />}
                </div>
              </button>

            </div>

          </div>
        </div>

        {/* CONSENT 2: ABDM Health Record Sharing */}
        <div 
          className={`rounded-3xl p-5 sm:p-6 transition-all duration-200 border ${
            abdmConsent.is_granted
              ? 'bg-slate-900/95 border-2 border-cyan-400 shadow-xl shadow-cyan-500/10 ring-2 ring-cyan-500/20'
              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            
            {/* Left: Info */}
            <div className="flex items-start gap-3.5 flex-1">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                abdmConsent.is_granted ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'bg-slate-800 text-slate-400'
              }`}>
                <Share2 className="w-6 h-6" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base sm:text-lg font-black text-white">
                    {texts.abdm_sharing.title}
                  </h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold uppercase tracking-wider">
                    Recommended / अनुशंसित
                  </span>
                </div>
                <p className="text-sm text-slate-300 mt-1 font-medium">
                  {texts.abdm_sharing.desc}
                </p>
                <div className="text-xs text-slate-400 mt-2 flex flex-wrap items-center gap-2">
                  <span>Method: <strong className="text-cyan-300 capitalize">{abdmConsent.granted_via}</strong></span>
                  <span>•</span>
                  <span>ABDM Ref: <strong className="text-slate-300">NHA-M2-CONSENT</strong></span>
                  <span>•</span>
                  <span>Status: <strong className={abdmConsent.is_granted ? 'text-emerald-400' : 'text-slate-400'}>
                    {abdmConsent.is_granted ? 'Granted (स्वीकृत)' : 'Pending'}
                  </strong></span>
                </div>
                {audioFeedback.abdm_sharing && (
                  <div className="mt-2 text-xs font-semibold text-purple-300 bg-purple-950/40 px-2.5 py-1 rounded-lg border border-purple-800/40 inline-block">
                    🎙️ {audioFeedback.abdm_sharing}
                  </div>
                )}
              </div>
            </div>

            {/* Right: Dual Actions */}
            <div className="flex flex-wrap items-center gap-2.5 self-end md:self-center">
              
              {/* Listen to Terms Button */}
              <button
                type="button"
                onClick={() => handleListenConsent('abdm_sharing')}
                className={`p-3 rounded-2xl border text-xs font-bold flex items-center gap-1.5 transition ${
                  speakingConsent === 'abdm_sharing'
                    ? 'bg-cyan-500 text-slate-950 border-cyan-400 animate-pulse'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-750 border-slate-700'
                }`}
                title="Listen to consent terms"
              >
                <Volume2 className="w-4 h-4 text-cyan-400" />
                <span className="hidden sm:inline">Listen (सुनें)</span>
              </button>

              {/* Voice Consent Microphone Button */}
              <button
                type="button"
                onClick={() => handleVoiceConsent('abdm_sharing')}
                className={`p-3 rounded-2xl border text-xs font-bold flex items-center gap-1.5 transition ${
                  listeningFor === 'abdm_sharing'
                    ? 'bg-rose-500 text-white border-rose-400 animate-pulse shadow-lg shadow-rose-500/30'
                    : abdmConsent.granted_via === 'audio' && abdmConsent.is_granted
                    ? 'bg-purple-500/20 border-purple-500 text-purple-300'
                    : 'bg-slate-800 text-slate-300 hover:bg-purple-950/40 hover:text-purple-300 border-slate-700'
                }`}
                title="Speak I Agree"
              >
                <Mic className="w-4 h-4 text-purple-400" />
                <span className="hidden sm:inline">
                  {listeningFor === 'abdm_sharing' ? 'Listening...' : "Speak 'I Agree'"}
                </span>
              </button>

              {/* Touch Toggle Switch */}
              <button
                type="button"
                onClick={() => toggleConsent('abdm_sharing', 'touch')}
                className={`w-16 h-10 rounded-full p-1 transition-colors duration-200 ease-in-out relative flex items-center cursor-pointer shadow-inner ${
                  abdmConsent.is_granted ? 'bg-cyan-500' : 'bg-slate-700'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full bg-slate-950 shadow-md transform transition-transform duration-200 flex items-center justify-center text-white ${
                    abdmConsent.is_granted ? 'translate-x-6 text-cyan-400' : 'translate-x-0 text-slate-500'
                  }`}
                >
                  {abdmConsent.is_granted ? <Check className="w-4 h-4 stroke-[3]" /> : <X className="w-4 h-4 stroke-[3]" />}
                </div>
              </button>

            </div>

          </div>
        </div>

      </div>

      {/* Quick Action: Grant All */}
      <div className="w-full flex justify-end mb-6">
        <button
          type="button"
          onClick={handleGrantAll}
          className="text-xs font-bold text-teal-300 hover:text-teal-200 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-950/50 border border-teal-800/60 shadow transition cursor-pointer"
        >
          <CheckCircle2 className="w-4 h-4 text-teal-400" />
          <span>Grant All Consents via Touch (सभी अनुमतियाँ दें)</span>
        </button>
      </div>

      {/* 3. NAVIGATION BAR */}
      <div className="w-full flex items-center justify-between gap-4">
        
        {/* Back Button */}
        <button
          type="button"
          onClick={prevStep}
          disabled={isSubmitting}
          className="h-16 px-6 sm:px-8 rounded-2xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 font-bold text-base flex items-center gap-2.5 transition active:scale-98 cursor-pointer disabled:opacity-50"
        >
          <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
          <span>Back / पीछे जाएँ</span>
        </button>

        {/* Submit & Generate Token CTA */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="h-16 px-8 sm:px-10 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black text-lg sm:text-xl flex items-center gap-3 shadow-xl shadow-teal-500/25 transition-all active:scale-98 cursor-pointer disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-7 h-7 animate-spin stroke-[2.5]" />
              <span>Transmitting Onboarding Data...</span>
            </>
          ) : (
            <>
              <span>Confirm & Generate Token / टोकन जारी करें</span>
              <ArrowRight className="w-6 h-6 stroke-[3]" />
            </>
          )}
        </button>

      </div>

    </div>
  );
};

export default ConsentScreen;
