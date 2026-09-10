import React, { useEffect, useState } from 'react';
import { usePatient } from '../../context/PatientContext';
import { 
  CheckCircle2, 
  Printer, 
  RotateCcw, 
  Building2, 
  Clock, 
  User, 
  Languages, 
  ShieldCheck, 
  Volume2,
  Sparkles,
  QrCode
} from 'lucide-react';

export const StepReady = () => {
  const { patientData, resetSession } = usePatient();
  const [isPrinted, setIsPrinted] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const tokenNumber = patientData.token_number || 'A-102';
  const patientName = patientData.full_name || 'Ayush OPD Patient';

  const playTokenAnnouncement = () => {
    setIsPlayingAudio(true);
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      let text = `टोकन संख्या ${tokenNumber}। कृपया कमरा नंबर 104, आयुष ओपीडी में पधारें।`;
      if (patientData.preferred_language === 'English') {
        text = `Token number ${tokenNumber}. Please proceed to Room 104 for Ayush OPD consultation.`;
      } else if (patientData.preferred_language === 'Gujarati') {
        text = `ટોકન નંબર ${tokenNumber}. કૃપા કરીને રૂમ નંબર 104, આયુષ ઓપીડીમાં પધારો.`;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      if (patientData.preferred_language === 'Hindi') utterance.lang = 'hi-IN';
      else if (patientData.preferred_language === 'Gujarati') utterance.lang = 'gu-IN';
      else utterance.lang = 'en-IN';

      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);
      window.speechSynthesis.speak(utterance);
    } else {
      setTimeout(() => setIsPlayingAudio(false), 1500);
    }
  };

  useEffect(() => {
    // Auto voice announcement if in audio-guided mode
    if (patientData.accessibility_mode === 'audio-guided') {
      const timer = setTimeout(() => {
        playTokenAnnouncement();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handlePrint = () => {
    setIsPrinted(true);
    setTimeout(() => {
      window.print();
    }, 200);
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center justify-center p-4">
      {/* Success Badge */}
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-sm font-semibold mb-4 animate-bounce">
        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
        <span>Check-In & Triage Completed</span>
      </div>

      <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight text-center">
        Step 4: You Are Ready for Consultation
      </h2>
      <p className="text-slate-400 text-base sm:text-lg mt-2 text-center max-w-xl">
        Your digital intake record has been transmitted to the OPD Doctor terminal. Please take your token slip.
      </p>

      {/* Main Token Display Card (Medical Slip Theme) */}
      <div className="w-full max-w-2xl bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 border-2 border-emerald-500/50 rounded-3xl p-6 sm:p-8 mt-6 shadow-2xl shadow-emerald-950/60 relative overflow-hidden">
        
        {/* Glow Effects */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Token Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
          <div>
            <span className="text-xs uppercase tracking-widest font-bold text-emerald-400">All India Institute of Ayurveda (AIIA)</span>
            <h4 className="text-sm font-semibold text-slate-300">OPD Patient Intake Queue</h4>
          </div>
          <button
            type="button"
            onClick={playTokenAnnouncement}
            className={`p-2.5 rounded-xl border transition ${
              isPlayingAudio 
                ? 'bg-emerald-500 text-slate-950 border-emerald-400 animate-pulse' 
                : 'bg-slate-800 text-emerald-400 border-slate-700 hover:bg-slate-700'
            }`}
            title="Play Voice Announcement"
          >
            <Volume2 className="w-5 h-5" />
          </button>
        </div>

        {/* Big Giant Token Number */}
        <div className="text-center py-4 bg-slate-950/80 rounded-2xl border border-emerald-500/30 mb-6 shadow-inner">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">OPD Queue Token</div>
          <div className="text-5xl sm:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 tracking-tight my-1">
            {tokenNumber}
          </div>
          <div className="text-xs font-medium text-emerald-400/90 flex items-center justify-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Active in Doctor's Dashboard</span>
          </div>
        </div>

        {/* Patient & Room Meta Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm mb-6">
          
          <div className="p-3.5 bg-slate-800/60 rounded-xl border border-slate-700/60 flex items-center gap-3">
            <User className="w-5 h-5 text-cyan-400 shrink-0" />
            <div>
              <div className="text-xs text-slate-400">Patient Name</div>
              <div className="font-bold text-white truncate max-w-[200px]">{patientName}</div>
            </div>
          </div>

          <div className="p-3.5 bg-slate-800/60 rounded-xl border border-slate-700/60 flex items-center gap-3">
            <Building2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <div className="text-xs text-slate-400">Assigned OPD Room</div>
              <div className="font-bold text-white">Room 104 (Kayachikitsa)</div>
            </div>
          </div>

          <div className="p-3.5 bg-slate-800/60 rounded-xl border border-slate-700/60 flex items-center gap-3">
            <Clock className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <div className="text-xs text-slate-400">Estimated Wait</div>
              <div className="font-bold text-white">~12 Mins (Queue Position: 3)</div>
            </div>
          </div>

          <div className="p-3.5 bg-slate-800/60 rounded-xl border border-slate-700/60 flex items-center gap-3">
            <Languages className="w-5 h-5 text-purple-400 shrink-0" />
            <div>
              <div className="text-xs text-slate-400">Language / Mode</div>
              <div className="font-bold text-white">{patientData.preferred_language} ({patientData.accessibility_mode})</div>
            </div>
          </div>

        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            type="button"
            onClick={handlePrint}
            className="w-full sm:w-1/2 py-4 px-6 rounded-2xl bg-slate-800 hover:bg-slate-750 text-white font-bold text-base border border-slate-700 flex items-center justify-center gap-2.5 transition active:scale-98 cursor-pointer"
          >
            <Printer className="w-5 h-5 text-cyan-400" />
            <span>{isPrinted ? 'Slip Printed ✓' : 'Print Token Slip'}</span>
          </button>

          <button
            type="button"
            onClick={resetSession}
            className="w-full sm:w-1/2 py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-base flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-500/20 transition active:scale-98 cursor-pointer"
          >
            <RotateCcw className="w-5 h-5 stroke-[2.5]" />
            <span>Next Patient Check-In</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default StepReady;
