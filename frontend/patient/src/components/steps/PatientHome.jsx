import React, { useState, useEffect } from 'react';
import { usePatient } from '../../context/PatientContext';
import { speakPhrase } from '../../utils/speechUtils';
import { 
  CheckCircle2, 
  RotateCcw, 
  Printer, 
  Volume2, 
  Building2, 
  Clock, 
  User, 
  Languages, 
  ShieldCheck, 
  Sparkles, 
  Mic, 
  Hand, 
  ArrowRight, 
  HeartPulse, 
  QrCode, 
  Activity, 
  Check, 
  SlidersHorizontal,
  Bot
} from 'lucide-react';

export const PatientHome = () => {
  const { patientData, resetSession } = usePatient();
  const [isPrinted, setIsPrinted] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [showDay2Modal, setShowDay2Modal] = useState(false);

  const tokenNumber = patientData.token_number || 'A-102';
  const patientName = patientData.full_name || 'Ayush OPD Patient';

  const activeConsentsCount = (patientData.consents || []).filter(c => c.is_granted).length;
  const totalConsentsCount = (patientData.consents || []).length || 2;

  // Spoken token announcement in preferred language with robust Indian fallback
  const playAnnouncement = async () => {
    setIsPlayingAudio(true);
    let text = `नमस्ते ${patientName}! आपका टोकन नंबर ${tokenNumber} तैयार है। कृपया कमरा नंबर 104, आयुष ओपीडी में पधारें।`;
    let langCode = 'hi';

    if (patientData.preferred_language === 'English') {
      text = `Welcome ${patientName}! Your OPD Token is ${tokenNumber}. Please proceed to Room 104 for Ayush consultation.`;
      langCode = 'en';
    } else if (patientData.preferred_language === 'Gujarati') {
      text = `નમસ્તે ${patientName}! આપનો ટોકન નંબર ${tokenNumber} છે. કૃપા કરીને રૂમ નંબર 104, આયુષ ઓપીડીમાં પધારો.`;
      langCode = 'gu';
    } else if (patientData.preferred_language === 'Marathi') {
      text = `नमस्कार ${patientName}! तुमचा टोकन नंबर ${tokenNumber} तयार आहे. कृपया रूम नंबर 104 मध्ये या.`;
      langCode = 'mr';
    } else if (patientData.preferred_language === 'Tamil') {
      text = `வணக்கம் ${patientName}! உங்கள் டோக்கன் எண் ${tokenNumber}. அறை எண் 104 க்கு செல்லவும்.`;
      langCode = 'ta';
    } else if (patientData.preferred_language === 'Bengali') {
      text = `নমস্কার ${patientName}! আপনার টোকেন নম্বর ${tokenNumber} প্রস্তুত। অনুগ্রহ করে ১০৪ নম্বর রুমে আসুন।`;
      langCode = 'bn';
    }

    try {
      await speakPhrase(text, langCode);
    } catch (err) {
      console.warn('Speech announcement note:', err);
    } finally {
      setIsPlayingAudio(false);
    }
  };

  useEffect(() => {
    // Auto announce if audio-guided mode is active
    if (patientData.accessibility_mode === 'audio-guided') {
      const t = setTimeout(() => playAnnouncement(), 400);
      return () => clearTimeout(t);
    }
  }, []);

  const handlePrintSlip = () => {
    setIsPrinted(true);
    setTimeout(() => {
      window.print();
    }, 200);
  };

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col">
      
      {/* 1. CLEAN WELCOME DASHBOARD HEADER */}
      <div className="mt-2 mb-4 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs sm:text-sm font-bold mb-2 shadow-lg shadow-emerald-950/40">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Day 1 Intake Milestone Completed • ओपीडी चेक-इन सफल</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          Welcome, <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">{patientName}</span>!
        </h2>
        <p className="text-slate-400 text-sm sm:text-base mt-1 max-w-xl mx-auto">
          Your hospital OPD profile has been validated and queued for clinical consultation.
        </p>
      </div>

      {/* Main Grid: Token Card on Left, Hero Action & Summary on Right */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch mb-6">
        
        {/* LEFT: OPD Token Card (lg:col-span-5) */}
        <div className="lg:col-span-5 bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 border-2 border-emerald-500/60 rounded-3xl p-6 shadow-2xl shadow-emerald-950/50 flex flex-col justify-between relative overflow-hidden">
          
          <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div>
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
                  Ministry of Ayush • AIIA OPD
                </span>
                <h4 className="text-sm font-bold text-slate-200">Patient Queue Token</h4>
              </div>
              <button
                type="button"
                onClick={playAnnouncement}
                className={`p-2.5 rounded-xl border transition ${
                  isPlayingAudio
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400 animate-pulse'
                    : 'bg-slate-800 text-emerald-400 border-slate-700 hover:bg-slate-700'
                }`}
                title="Voice Announcement"
              >
                <Volume2 className="w-5 h-5" />
              </button>
            </div>

            {/* Giant Token Display */}
            <div className="py-4 px-3 bg-slate-950/90 rounded-2xl border border-emerald-500/40 text-center shadow-inner mb-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Official OPD Token Number
              </span>
              <div className="text-5xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 tracking-tight my-1">
                {tokenNumber}
              </div>
              <div className="text-xs font-semibold text-emerald-400 flex items-center justify-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>Live in Doctor's OPD Dashboard</span>
              </div>
            </div>

            {/* Meta Details */}
            <div className="space-y-2.5 text-xs text-slate-300">
              <div className="flex items-center justify-between p-2.5 bg-slate-800/60 rounded-xl border border-slate-700/60">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-emerald-400" />
                  <span>Assigned Room:</span>
                </span>
                <strong className="text-white">Room 104 (Kayachikitsa)</strong>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-slate-800/60 rounded-xl border border-slate-700/60">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span>Queue Position:</span>
                </span>
                <strong className="text-amber-300">#3 (~12 Mins Wait)</strong>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-slate-800/60 rounded-xl border border-slate-700/60">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-cyan-400" />
                  <span>Patient / ABHA ID:</span>
                </span>
                <strong className="text-white truncate max-w-[140px]">{patientData.login_id || 'GUEST-OPD'}</strong>
              </div>
            </div>
          </div>

          {/* Token Print Button */}
          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrintSlip}
              className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-750 text-white font-bold text-xs border border-slate-700 flex items-center justify-center gap-2 transition active:scale-98 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-cyan-400" />
              <span>{isPrinted ? 'Token Slip Printed ✓' : 'Print OPD Slip (पर्ची प्रिंट करें)'}</span>
            </button>
          </div>

        </div>

        {/* RIGHT: Active Profile Summary & Hero Action Card (lg:col-span-7) */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
          
          {/* Active Profile Summary Card */}
          <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-3.5">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                <span>Active Profile Summary (प्रोफ़ाइल विवरण)</span>
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                ✓ Verified
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              
              {/* Language Card */}
              <div className="p-3.5 bg-slate-950/70 rounded-2xl border border-slate-800 flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span>Language</span>
                  <Languages className="w-4 h-4 text-purple-400" />
                </div>
                <div className="font-bold text-white text-base">
                  {patientData.preferred_language || 'Hindi'}
                </div>
                <div className="text-[11px] text-purple-300 font-semibold mt-1">
                  Multilingual AI Active
                </div>
              </div>

              {/* Accessibility Mode Card */}
              <div className="p-3.5 bg-slate-950/70 rounded-2xl border border-slate-800 flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span>Accessibility</span>
                  <SlidersHorizontal className="w-4 h-4 text-teal-400" />
                </div>
                <div className="font-bold text-white text-sm capitalize truncate">
                  {patientData.accessibility_mode || 'standard'}
                </div>
                <div className="text-[11px] text-teal-300 font-semibold mt-1">
                  Touch & Voice Adapted
                </div>
              </div>

              {/* Consents Status Card */}
              <div className="p-3.5 bg-slate-950/70 rounded-2xl border border-slate-800 flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span>Consents</span>
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="font-bold text-white text-base">
                  {activeConsentsCount}/{totalConsentsCount} Active
                </div>
                <div className="text-[11px] text-emerald-300 font-semibold mt-1">
                  DPDP 2023 Compliant
                </div>
              </div>

            </div>
          </div>

          {/* 2. HERO ACTION CARD (Day 1 Final Milestone) */}
          <div className="bg-gradient-to-br from-teal-950/60 via-slate-900/90 to-cyan-950/50 border-2 border-cyan-500/50 rounded-3xl p-6 shadow-2xl shadow-cyan-950/40 relative overflow-hidden">
            
            <div className="flex items-center justify-between mb-3">
              <span className="px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Ready for Day 2 — AI Multimodal Intake</span>
              </span>
              <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                <Bot className="w-4 h-4" />
                <span>AI Clinical Engine Ready</span>
              </span>
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Begin Multimodal Ayush Symptom Triage
            </h3>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 mb-5 leading-relaxed">
              Experience the next step: Automated Prakriti assessment, voice symptom capture in your native language, pulse sensor integration, and instant doctor clinical preparation.
            </p>

            {/* Big Glowing Action Button */}
            <button
              type="button"
              onClick={() => setShowDay2Modal(true)}
              className="w-full h-16 rounded-2xl bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 text-slate-950 font-black text-lg sm:text-xl flex items-center justify-center gap-3 shadow-xl shadow-cyan-500/30 transition-all transform active:scale-98 cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Mic className="w-6 h-6 stroke-[2.5]" />
                <Hand className="w-6 h-6 stroke-[2.5]" />
              </div>
              <span>Start AI Clinical Intake / केस हिस्ट्री शुरू करें</span>
              <ArrowRight className="w-6 h-6 stroke-[3]" />
            </button>

          </div>

        </div>

      </div>

      {/* 3. RESET / NEW SESSION FOOTER BUTTON */}
      <div className="w-full flex items-center justify-between pt-2">
        <div className="text-xs text-slate-500">
          Touch terminal session auto-refreshes for next patient security.
        </div>

        <button
          type="button"
          onClick={resetSession}
          className="px-6 py-3.5 rounded-2xl bg-slate-800 hover:bg-rose-950/60 hover:text-rose-300 hover:border-rose-700/60 border border-slate-700 text-slate-300 font-bold text-sm flex items-center gap-2 transition active:scale-98 cursor-pointer shadow-md"
        >
          <RotateCcw className="w-4 h-4" />
          <span>New Patient / Reset Kiosk (नया मरीज़)</span>
        </button>
      </div>

      {/* Day 2 Preview Modal */}
      {showDay2Modal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-cyan-500/60 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl shadow-cyan-950/70 text-center animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-3xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-black text-white tracking-tight">
              Day 1 Milestone Complete! 🎉
            </h3>
            <p className="text-emerald-400 font-bold text-base mt-1">
              Part 1-4 Kiosk Intake & DPDP Compliance Ready
            </p>
            <p className="text-slate-300 text-sm mt-3 leading-relaxed">
              Patient <strong>{patientName}</strong> has been enrolled with token <strong>{tokenNumber}</strong>. The state management, SQL database alignment, touchscreen login, multilingual speech, and DPDP consent architecture are fully operational!
            </p>
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setShowDay2Modal(false)}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm transition"
              >
                Close Preview
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDay2Modal(false);
                  resetSession();
                }}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm border border-slate-700 transition"
              >
                Reset for Next Patient
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default PatientHome;
