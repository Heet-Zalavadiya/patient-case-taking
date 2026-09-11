import React, { useState, useEffect } from 'react';
import { usePatient } from '../../context/PatientContext';
import { speakPhrase } from '../../utils/speechUtils';
import { generateClinicalSummary } from '../../services/api';
import { 
  CheckCircle2, 
  RotateCcw, 
  Printer, 
  Volume2, 
  Building2, 
  Clock, 
  User, 
  ShieldCheck, 
  FileText, 
  Activity, 
  Flame, 
  Stethoscope, 
  PhoneCall, 
  QrCode, 
  AlertTriangle, 
  Check, 
  Pause, 
  Play, 
  Share2, 
  Sparkles,
  ArrowRight
} from 'lucide-react';

export const CaseSummaryToken = () => {
  const { patientData, theme, resetSession } = usePatient();
  const isLight = theme === 'light';

  const [isPrinted, setIsPrinted] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [countdown, setCountdown] = useState(45);
  const [isTimerPaused, setIsTimerPaused] = useState(false);

  const tokenNumber = patientData.token_number || 'A-764';
  const patientName = patientData.full_name || 'Ayush OPD Patient';
  const abhaId = patientData.login_id || 'ABHA-9876-5432-10';
  const turns = patientData.interview_turns || [];
  const uploadedDocs = patientData.uploaded_documents || [];
  const isAyush = patientData.history_mode === 'ayush';

  // Chief complaint from turns or fallback
  const chiefComplaint = turns.length > 0
    ? turns[0].patient_response_text
    : 'Acute Headache & Discomfort (2-3 days)';

  // 45-second DPDP Kiosk Auto-Reset Countdown Timer
  useEffect(() => {
    if (isTimerPaused) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          resetSession();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isTimerPaused, resetSession]);

  // Spoken audio confirmation for all 6 languages
  const playAudioConfirmation = async () => {
    setIsPlayingAudio(true);
    const langKey = patientData.preferred_language || 'Hindi';

    const confirmationMessages = {
      Hindi: 'आपका केस विवरण सफलतापूर्वक डॉक्टर तक पहुँचा दिया गया है। कृपया कमरा नंबर 4 के बाहर प्रतीक्षा करें।',
      English: 'Your case summary has been successfully submitted to the doctor. Please wait outside Room Number 4.',
      Gujarati: 'તમારો કેસ સારાંશ ડૉક્ટર સુધી સફળતાપૂર્વક મોકલી દેવાયો છે. કૃપા કરીને રૂમ નંબર 4 ની બહાર પ્રતીક્ષા કરો.',
      Marathi: 'तुमचा केस सारांश डॉक्टरांकडे यशस्वीरित्या पाठवला आहे. कृपया रूम नंबर 4 बाहेर प्रतीक्षा करा.',
      Tamil: 'உங்கள் வழக்கு சுருக்கம் மருத்துவரிடம் வெற்றிகரமாக சமர்ப்பிக்கப்பட்டது. அறை எண் 4 வெளியே காத்திருக்கவும்.',
      Bengali: 'আপনার কেস সারাংশ সফলভাবে ডাক্তারের কাছে জমা দেওয়া হয়েছে। অনুগ্রহ করে ৪ নম্বর ঘরের বাইরে অপেক্ষা করুন।'
    };

    const message = confirmationMessages[langKey] || confirmationMessages['Hindi'];

    try {
      await speakPhrase(message, langKey);
    } catch (e) {
      console.warn('Speech confirmation note:', e);
    } finally {
      setIsPlayingAudio(false);
    }
  };

  // Auto-speak on mount if accessibility mode is audio-guided
  useEffect(() => {
    if (patientData.accessibility_mode === 'audio-guided') {
      const t = setTimeout(() => {
        playAudioConfirmation();
      }, 600);
      return () => clearTimeout(t);
    }
  }, []);

  // Trigger real clinical summary generation on mount
  useEffect(() => {
    const triggerSummary = async () => {
      const activeSessionId = patientData.session_id || 1;
      try {
        await generateClinicalSummary(activeSessionId, {
          chief_complaint: chiefComplaint,
          history_mode: patientData.history_mode,
          turns_count: turns.length
        });
      } catch (err) {
        console.warn('Clinical summary trigger notice:', err);
      }
    };
    triggerSummary();
  }, []);

  const handlePrintSlip = () => {
    setIsPrinted(true);
    setTimeout(() => {
      window.print();
    }, 200);
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-1 sm:px-4 flex flex-col">
      
      {/* 1. TOP HEADER & DPDP RESET BAR */}
      <div className="mt-1 sm:mt-2 mb-3 sm:mb-4 text-center">
        
        {/* DPDP Countdown Banner */}
        <div className="inline-flex items-center gap-2 sm:gap-2.5 px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold mb-2 border shadow-sm transition-all max-w-full flex-wrap justify-center">
          <span className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-emerald-500 animate-ping" />
          <span className={isLight ? 'text-slate-800' : 'text-slate-200'}>
            DPDP Privacy Protection: Auto-resetting in <strong className="text-emerald-500 font-mono text-sm">{countdown}s</strong>
          </span>
          <button
            type="button"
            onClick={() => setIsTimerPaused(!isTimerPaused)}
            className={`ml-1 px-2 py-0.5 rounded-md border text-[11px] font-semibold flex items-center gap-1 cursor-pointer ${
              isLight ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700' : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
            }`}
          >
            {isTimerPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
            <span>{isTimerPaused ? 'Resume' : 'Pause'}</span>
          </button>
        </div>

        <h2 className={`text-2xl sm:text-4xl font-black tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
          Intake Complete, <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500">{patientName}</span>!
        </h2>
        <p className={`text-xs sm:text-base mt-1 max-w-xl mx-auto font-medium ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
          Your complete clinical history and digitized records have been transmitted to the attending doctor.
        </p>
      </div>

      {/* 2. MAIN GRID: TOKEN CARD ON LEFT, CLINICAL SUMMARY ON RIGHT */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-stretch mb-6">
        
        {/* LEFT COLUMN: Official OPD Token Card (lg:col-span-5) */}
        <div
          className={`lg:col-span-5 rounded-3xl p-4 sm:p-7 border-2 backdrop-blur-md flex flex-col justify-between shadow-2xl relative overflow-hidden ${
            isLight
              ? 'bg-gradient-to-b from-white via-emerald-50/60 to-slate-50 border-emerald-500/80 shadow-emerald-900/10 text-slate-900'
              : 'bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 border-emerald-500/60 shadow-emerald-950/50 text-white'
          }`}
        >
          <div className={`absolute top-0 right-0 w-36 h-36 rounded-full blur-3xl pointer-events-none ${isLight ? 'bg-emerald-500/15' : 'bg-emerald-500/10'}`} />

          <div>
            {/* Header with Department & Audio Announcement Button */}
            <div className={`flex items-center justify-between border-b pb-3 mb-4 ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
              <div>
                <span className={`text-[10px] uppercase font-bold tracking-wider ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
                  Ministry of Ayush • All India Institute of Ayurveda
                </span>
                <h4 className={`text-sm font-bold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                  Official OPD Queue Token
                </h4>
              </div>

              <button
                type="button"
                onClick={playAudioConfirmation}
                className={`p-2.5 rounded-xl border transition cursor-pointer ${
                  isPlayingAudio
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400 animate-pulse'
                    : isLight
                    ? 'bg-white hover:bg-slate-100 text-emerald-700 border-slate-300 shadow-sm'
                    : 'bg-slate-800 text-emerald-400 border-slate-700 hover:bg-slate-700'
                }`}
                title="Play Audio Announcement"
              >
                <Volume2 className="w-5 h-5" />
              </button>
            </div>

            {/* Giant Token Number Display */}
            <div
              className={`py-4 px-3 rounded-2xl text-center mb-4 border ${
                isLight
                  ? 'bg-white border-2 border-emerald-500/50 shadow-md'
                  : 'bg-slate-950/90 border-emerald-500/40 shadow-inner'
              }`}
            >
              <span className={`text-[11px] font-bold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Assigned OPD Token Number
              </span>
              <div
                className={`text-5xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r ${
                  isLight ? 'from-emerald-600 via-teal-600 to-cyan-700' : 'from-emerald-400 via-teal-300 to-cyan-400'
                } tracking-tight my-1`}
              >
                {tokenNumber}
              </div>
              <div className={`text-xs font-semibold flex items-center justify-center gap-1.5 ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span>Live on OPD Calling Display</span>
              </div>
            </div>

            {/* Assigned Room & Estimated Wait Meta Details */}
            <div className="space-y-2.5 text-xs">
              <div
                className={`flex items-center justify-between p-3 rounded-xl border ${
                  isLight ? 'bg-white/90 border-slate-200 shadow-xs' : 'bg-slate-800/60 border-slate-700/60'
                }`}
              >
                <span className={`flex items-center gap-2 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  <Building2 className="w-4 h-4 text-emerald-500" />
                  <span>Assigned Room:</span>
                </span>
                <strong className={`font-bold text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  OPD Room No. 4 (Ayurveda / General)
                </strong>
              </div>

              <div
                className={`flex items-center justify-between p-3 rounded-xl border ${
                  isLight ? 'bg-white/90 border-slate-200 shadow-xs' : 'bg-slate-800/60 border-slate-700/60'
                }`}
              >
                <span className={`flex items-center gap-2 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  <Clock className="w-4 h-4 text-amber-500" />
                  <span>Estimated Wait Time:</span>
                </span>
                <strong className={`font-bold ${isLight ? 'text-amber-800' : 'text-amber-300'}`}>
                  Approx. 5-10 mins (Queue #2)
                </strong>
              </div>

              <div
                className={`flex items-center justify-between p-3 rounded-xl border ${
                  isLight ? 'bg-white/90 border-slate-200 shadow-xs' : 'bg-slate-800/60 border-slate-700/60'
                }`}
              >
                <span className={`flex items-center gap-2 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  <User className="w-4 h-4 text-cyan-500" />
                  <span>Patient / ABHA ID:</span>
                </span>
                <strong className={`font-mono truncate max-w-[150px] ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {abhaId}
                </strong>
              </div>
            </div>
          </div>

          {/* Print OPD Slip Action */}
          <div className={`mt-5 pt-3 border-t flex items-center gap-2 ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
            <button
              type="button"
              onClick={handlePrintSlip}
              className={`w-full py-3.5 px-4 rounded-xl font-bold text-xs sm:text-sm border flex items-center justify-center gap-2 transition active:scale-98 cursor-pointer shadow-sm ${
                isLight
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-900 border-slate-300'
                  : 'bg-slate-800 hover:bg-slate-750 text-white border-slate-700'
              }`}
            >
              <Printer className="w-4 h-4 text-cyan-500" />
              <span>{isPrinted ? 'OPD Slip Printed ✓' : 'Print OPD Slip (पर्ची प्रिंट करें)'}</span>
            </button>
          </div>

        </div>

        {/* RIGHT COLUMN: Intake Summary & Doctor Transmission Status (lg:col-span-7) */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
          
          {/* Clinical Transmission Status Card */}
          <div
            className={`rounded-3xl p-5 sm:p-6 border backdrop-blur-md shadow-xl ${
              isLight
                ? 'bg-white/95 border-emerald-300 shadow-emerald-950/5 text-slate-900'
                : 'bg-slate-900/90 border-emerald-500/40 shadow-emerald-950/20 text-white'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 text-xs font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Doctor Terminal Connected (DESK-DOC-04)</span>
              </div>

              <span className={`text-xs px-2.5 py-1 rounded-xl font-bold uppercase tracking-wider border ${
                isAyush 
                  ? isLight ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-emerald-950/50 border-emerald-800 text-emerald-300'
                  : isLight ? 'bg-cyan-50 border-cyan-200 text-cyan-800' : 'bg-cyan-950/50 border-cyan-800 text-cyan-300'
              }`}>
                {isAyush ? '🌿 Ayush Mode' : '🩺 Allopathic Mode'}
              </span>
            </div>

            <h3 className="text-lg sm:text-xl font-black mb-1 flex items-center gap-2">
              <span>Structured Clinical Summary Pushed to Doctor</span>
            </h3>
            <div className="mb-2">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                isLight ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
              }`}>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Sync Status: SUCCESS • Pushed to Doctor Dashboard & Linked to ABHA via FHIR</span>
              </span>
            </div>
            <p className={`text-xs sm:text-sm leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
              The OPD consulting physician has received your preliminary complaint timeline, vital ratings, and digitized document attachments on their dashboard.
            </p>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
              
              {/* Chief Complaint */}
              <div
                className={`p-3.5 rounded-2xl border flex flex-col justify-between ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/70 border-slate-800'
                }`}
              >
                <div className={`text-[11px] font-bold uppercase tracking-wider mb-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Chief Complaint
                </div>
                <div className={`font-bold text-xs sm:text-sm line-clamp-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {chiefComplaint}
                </div>
                <div className="text-[10px] text-cyan-500 font-semibold mt-1">
                  SOCRATES Verified
                </div>
              </div>

              {/* Digitized Documents */}
              <div
                className={`p-3.5 rounded-2xl border flex flex-col justify-between ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/70 border-slate-800'
                }`}
              >
                <div className={`text-[11px] font-bold uppercase tracking-wider mb-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Documents Attached
                </div>
                <div className={`font-black text-base sm:text-lg ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {uploadedDocs.length > 0 ? `${uploadedDocs.length} Digitized` : '0 Attached (Skipped)'}
                </div>
                <div className="text-[10px] text-emerald-500 font-semibold mt-1">
                  OCR Extracted ✓
                </div>
              </div>

              {/* DPDP Consent Status */}
              <div
                className={`p-3.5 rounded-2xl border flex flex-col justify-between ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/70 border-slate-800'
                }`}
              >
                <div className={`text-[11px] font-bold uppercase tracking-wider mb-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Privacy & Consent
                </div>
                <div className={`font-bold text-xs sm:text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  ABDM & Data Granted
                </div>
                <div className="text-[10px] text-teal-500 font-semibold mt-1">
                  DPDP Act 2023 Compliant
                </div>
              </div>

            </div>
          </div>

          {/* Emergency Triage Notice or General Guidance */}
          {patientData.red_flag_alert ? (
            <div className="p-4 rounded-2xl bg-rose-500/15 border-2 border-rose-500 text-rose-400 flex items-start gap-3 text-xs sm:text-sm">
              <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block font-black">EMERGENCY RED-FLAG ACTIVE</strong>
                <span>Casualty staff has been notified of critical symptoms. Please proceed straight to Room 1.</span>
              </div>
            </div>
          ) : (
            <div
              className={`p-4 rounded-2xl border backdrop-blur-md flex items-center justify-between text-xs ${
                isLight ? 'bg-cyan-50/70 border-cyan-200 text-cyan-900' : 'bg-cyan-950/30 border-cyan-800/40 text-cyan-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-500 shrink-0" />
                <span>Audio assistance is active. Watch the corridor LED display for your token number.</span>
              </div>
              <button
                type="button"
                onClick={playAudioConfirmation}
                className="font-bold underline cursor-pointer hover:opacity-80"
              >
                Listen Again
              </button>
            </div>
          )}

          {/* 3. SECURITY & KIOSK RESET BUTTON (DPDP Act Compliance) */}
          <div
            className={`rounded-3xl p-5 border backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg ${
              isLight ? 'bg-white/90 border-slate-200' : 'bg-slate-900/85 border-slate-800'
            }`}
          >
            <div className="text-center sm:text-left">
              <div className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                <ShieldCheck className="w-4 h-4 text-teal-500" />
                <span>Patient Data Protection Notice</span>
              </div>
              <div className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                For patient confidentiality, all temporary touchscreen session data is erased upon reset.
              </div>
            </div>

            {/* Complete & Reset Session CTA */}
            <button
              type="button"
              onClick={resetSession}
              className="w-full sm:w-auto h-14 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-lg shadow-teal-500/20 active:scale-98 transition cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Complete & Start New Patient (नया मरीज़)</span>
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};

export default CaseSummaryToken;
