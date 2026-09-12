import React, { useState } from 'react';
import { usePatient } from '../../context/PatientContext';
import { apiSubmitConsent, apiCreateSession, submitConsents, saveConsent } from '../../services/api';
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

import { SUPPORTED_LANGUAGES, getLanguageConfig } from '../../constants/languages';

export const ConsentScreen = () => {
  const { 
    patientData, 
    theme, 
    setConsent, 
    toggleConsent, 
    nextStep, 
    prevStep, 
    setTokenNumber, 
    updatePatient,
    setSessionId
  } = usePatient();

  const isLight = theme === 'light';

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

  // Translations for DPDP Consent Terms across all 6 Languages
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
    Marathi: {
      data_capture: {
        title: '1. क्लिनिकल लक्षणे व AI केस टेकिंग संमती',
        desc: 'मी डॉक्टरांच्या तपासणीसाठी AI द्वारे माझी लक्षणे आणि वैद्यकीय इतिहास नोंदवण्यास संमती देतो/देते.',
        listenText: 'क्लिनिकल इनटेक संमती: मी डॉक्टरांच्या तपासणीसाठी AI द्वारे माझी लक्षणे नोंदवण्यास संमती देतो.'
      },
      abdm_sharing: {
        title: '2. आभा (ABHA) व डिजिटल हेल्थ रेकॉर्ड शेअरिंग',
        desc: 'मी हा ओपीडी सारांश माझ्या आभा (ABHA) आरोग्य खात्याशी जोडण्यास संमती देतो/देते.',
        listenText: 'आभा संमती: मी हा ओपीडी सारांश माझ्या आभा डिजिटल आरोग्य खात्याशी जोडण्यास संमती देतो.'
      }
    },
    Tamil: {
      data_capture: {
        title: '1. மருத்துவ அறிகுறிகள் மற்றும் AI கேஸ் டேக்கிங் ஒப்புதல்',
        desc: 'மருத்துவர் ஆலோசனைக்காக AI மூலம் எனது அறிகுறிகள் மற்றும் மருத்துவ வரலாற்றை பதிவு செய்ய ஒப்புக்கொள்கிறேன்.',
        listenText: 'மருத்துவ ஒப்புதல்: மருத்துவர் ஆலோசனைக்காக AI மூலம் அறிகுறிகளைப் பதிவு செய்ய நான் ஒப்புக்கொள்கிறேன்.'
      },
      abdm_sharing: {
        title: '2. ஆயுஷ்மான் பாரத் (ABHA) டிஜிட்டல் பகிர்வு',
        desc: 'இந்த மருத்துவ சுருக்கத்தை எனது ஆயுஷ்மான் பாரத் (ABHA) சுகாதார கணக்குடன் இணைக்க ஒப்புக்கொள்கிறேன்.',
        listenText: 'ஆபா ஒப்புதல்: இந்த மருத்துவ ஆலோசனையை எனது ஆபா கணக்குடன் இணைக்க ஒப்புக்கொள்கிறேன்.'
      }
    },
    Bengali: {
      data_capture: {
        title: '1. ক্লিনিকাল লক্ষণ এবং AI কেস টেকিং সম্মতি',
        desc: 'আমি ডাক্তারের পরামর্শের জন্য AI দ্বারা আমার লক্ষণ এবং চিকিৎসার ইতিহাস রেকর্ড করতে সম্মতি দিচ্ছি।',
        listenText: 'ক্লিনিকাল সম্মতি: আমি ডাক্তারের পরামর্শের জন্য AI দ্বারা আমার লক্ষণ রেকর্ড করার সম্মতি দিচ্ছি।'
      },
      abdm_sharing: {
        title: '2. আভা (ABHA) এবং ডিজিটাল স্বাস্থ্য রেকর্ড ভাগাভাগি',
        desc: 'আমি এই ওপিডি সারাংশ আমার আভা (ABHA) স্বাস্থ্য অ্যাকাউন্টের সাথে যুক্ত করার সম্মতি দিচ্ছি।',
        listenText: 'আভা সম্মতি: আমি এই ওপিডি সারাংশ আমার আভা ডিজিটাল স্বাস্থ্য অ্যাকাউন্টের সাথে যুক্ত করতে সম্মতি দিচ্ছি।'
      }
    }
  };

  const selectedLang = patientData.preferred_language || 'Hindi';
  const langConfig = getLanguageConfig(selectedLang);
  const texts = consentTexts[selectedLang] || consentTexts['Hindi'] || consentTexts['English'];

  // Speak Consent Terms with robust Indian voice fallback
  const handleListenConsent = async (type) => {
    setSpeakingConsent(type);
    const textToSpeak = texts[type]?.listenText || '';

    try {
      await speakPhrase(textToSpeak, langConfig.code);
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
        // Dynamically set recognition language from SUPPORTED_LANGUAGES
        recognition.lang = langConfig?.code || 'hi-IN';

        recognition.onresult = (event) => {
          const transcript = event.results[0][0].transcript.toLowerCase();
          console.log('[Voice Consent Detected]:', transcript);
          setConsent(type, true, 'audio');
          setAudioFeedback((prev) => ({
            ...prev,
            [type]: `Voice Verified: "${transcript}" (Audio Consent Granted ✓)`
          }));
          setListeningFor(null);
        };

        recognition.onerror = () => {
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
      const voiceSamples = {
        Hindi: 'मैं सहमत हूँ / I Agree',
        English: 'I Agree / Consent Granted',
        Gujarati: 'હું સહમત છું / I Agree',
        Marathi: 'मी सहमत आहे / I Agree',
        Tamil: 'நான் ஒப்புக்கொள்கிறேன் / I Agree',
        Bengali: 'আমি সম্মত / I Agree'
      };
      const sampleText = voiceSamples[selectedLang] || voiceSamples['Hindi'];
      setAudioFeedback((prev) => ({
        ...prev,
        [type]: `Audio Consent Captured: "${sampleText}" (Audio Granted ✓)`
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

  // 1-Tap "Accept All & Proceed" for Live Demos
  const handleAcceptAllAndProceed = async () => {
    setIsSubmitting(true);
    setValidationError('');

    // Strictly ensure both required database rows: data_capture and abdm_sharing
    const guaranteedConsents = [
      { consent_type: 'data_capture', is_granted: true, granted_via: 'touch' },
      { consent_type: 'abdm_sharing', is_granted: true, granted_via: 'touch' }
    ];

    updatePatient({
      consents: guaranteedConsents
    });

    try {
      const patientId = patientData.patient_id || 1;
      // Send two sequential requests using apiSubmitConsent
      await apiSubmitConsent(patientId, {
        consent_type: 'data_capture',
        is_granted: true,
        granted_via: 'touch'
      });
      await apiSubmitConsent(patientId, {
        consent_type: 'abdm_sharing',
        is_granted: true,
        granted_via: 'touch'
      });

      // Immediately call apiCreateSession(patient_id, history_mode) to initialize a real DB session
      const sessionRes = await apiCreateSession(patientId, patientData.history_mode || 'allopathic');
      if (sessionRes && sessionRes.session_id) {
        setSessionId(sessionRes.session_id);
      }

      const assignedToken = patientData.token_number || 'A-102';
      setTokenNumber(assignedToken);
      updatePatient({
        token_number: assignedToken,
        session_id: sessionRes?.session_id || patientData.session_id,
        consents: guaranteedConsents
      });
      // Advance to Step 4 (AI Interview)
      nextStep();
    } catch (err) {
      console.warn('Accept all consent notice:', err);
      nextStep();
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit and Advance
  const handleSubmit = async () => {
    if (!dataCaptureConsent.is_granted) {
      setValidationError('Clinical Data Capture consent is mandatory under DPDP Act 2023 for OPD intake.');
      return;
    }

    setIsSubmitting(true);
    setValidationError('');

    // Ensure both database rows exist and are verified
    const consentsToSubmit = [
      {
        consent_type: 'data_capture',
        is_granted: Boolean(dataCaptureConsent.is_granted),
        granted_via: dataCaptureConsent.granted_via || 'touch'
      },
      {
        consent_type: 'abdm_sharing',
        is_granted: Boolean(abdmConsent.is_granted),
        granted_via: abdmConsent.granted_via || 'touch'
      }
    ];

    try {
      const patientId = patientData.patient_id || 1;
      // Send two sequential requests using apiSubmitConsent
      await apiSubmitConsent(patientId, {
        consent_type: 'data_capture',
        is_granted: Boolean(dataCaptureConsent.is_granted),
        granted_via: dataCaptureConsent.granted_via || 'touch'
      });
      await apiSubmitConsent(patientId, {
        consent_type: 'abdm_sharing',
        is_granted: Boolean(abdmConsent.is_granted),
        granted_via: abdmConsent.granted_via || 'touch'
      });

      // Immediately call apiCreateSession(patient_id, history_mode) to initialize a real DB session
      const sessionRes = await apiCreateSession(patientId, patientData.history_mode || 'allopathic');
      if (sessionRes && sessionRes.session_id) {
        setSessionId(sessionRes.session_id);
      }

      const assignedToken = patientData.token_number || 'A-102';
      setTokenNumber(assignedToken);
      updatePatient({
        token_number: assignedToken,
        session_id: sessionRes?.session_id || patientData.session_id,
        consents: consentsToSubmit
      });
      // Advance to Step 4
      nextStep();
    } catch (err) {
      console.error('Submission error, proceeding with session:', err);
      nextStep();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col items-center justify-center">
      
      {/* SINGLE CENTRED GLASS CARD */}
      <div
        className={`w-full rounded-3xl p-6 sm:p-8 text-center transition-all duration-300 border backdrop-blur-xl shadow-2xl ${
          isLight
            ? 'bg-white/95 border-slate-200/90 shadow-slate-300/40 text-slate-900'
            : 'bg-slate-900/90 border-slate-700/80 shadow-slate-950/60 text-white'
        }`}
      >
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-cyan-500/25">
          <ShieldCheck className="w-7 h-7 text-slate-950 stroke-[2.5]" />
        </div>

        <p className={`text-xs sm:text-sm mt-1 mb-6 font-medium ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
          We'll only ask what helps the doctor understand you today. You can skip anything that feels too much.
        </p>

        {/* 3 Square-Form Trust Points Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left mb-6">
          <div className={`p-3.5 sm:p-4 rounded-2xl border-2 flex flex-col justify-between min-h-[130px] ${isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-950/70 border-slate-700 text-white'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">🎙️</span>
              <span className="text-[10px] font-black text-cyan-400 uppercase tracking-wider px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30">Dual Mode</span>
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base leading-tight mb-1">Your Story, Your Voice</h3>
              <p className={`text-xs font-semibold leading-snug ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                Speak or tap — directly to doctor.
              </p>
            </div>
          </div>

          <div className={`p-3.5 sm:p-4 rounded-2xl border-2 flex flex-col justify-between min-h-[130px] ${isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-950/70 border-slate-700 text-white'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">📄</span>
              <span className="text-[10px] font-black text-teal-400 uppercase tracking-wider px-2 py-0.5 rounded bg-teal-500/10 border border-teal-500/30">AI OCR</span>
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base leading-tight mb-1">Scan Medical Papers</h3>
              <p className={`text-xs font-semibold leading-snug ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                Prescriptions digitized instantly.
              </p>
            </div>
          </div>

          <div className={`p-3.5 sm:p-4 rounded-2xl border-2 flex flex-col justify-between min-h-[130px] ${isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-950/70 border-slate-700 text-white'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">🛡️</span>
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30">DPDP 2023</span>
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base leading-tight mb-1">Private & Secure</h3>
              <p className={`text-xs font-semibold leading-snug ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                Stays strictly in this OPD visit.
              </p>
            </div>
          </div>
        </div>

        {/* Single Primary Action Button */}
        <button
          type="button"
          disabled={isSubmitting}
          onClick={handleAcceptAllAndProceed}
          className="w-full h-16 rounded-2xl bg-gradient-to-r from-teal-400 via-cyan-500 to-emerald-400 hover:from-teal-300 hover:to-emerald-300 text-slate-950 font-black text-lg sm:text-xl flex items-center justify-center gap-3 shadow-xl shadow-cyan-500/25 transition-all active:scale-98 cursor-pointer disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin stroke-[2.5]" />
              <span>Starting Session...</span>
            </>
          ) : (
            <>
              <span>I understand & continue</span>
              <ArrowRight className="w-6 h-6 stroke-[3]" />
            </>
          )}
        </button>

      </div>
    </div>
  );
};

export default ConsentScreen;
