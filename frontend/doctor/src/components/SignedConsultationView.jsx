import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Printer, 
  ArrowLeft, 
  User, 
  Building2, 
  Clock, 
  ShieldCheck, 
  Sparkles, 
  Pill, 
  Utensils, 
  Ban, 
  QrCode, 
  ChevronRight,
  Share2,
  FileCheck2,
  HeartPulse,
  Compass
} from 'lucide-react';

export const SignedConsultationView = ({
  patient,
  currentDoctor,
  onBackToCaseSheet,
  onNextPatient
}) => {
  const [isPrinted, setIsPrinted] = useState(false);

  const handlePrintSlip = () => {
    setIsPrinted(true);
    setTimeout(() => {
      window.print();
    }, 200);
  };

  const currentDate = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  const currentTime = new Date().toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col space-y-6 animate-in fade-in duration-300">
      
      {/* 1. Milestone Banner */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs sm:text-sm font-bold shadow-lg shadow-emerald-950/40">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Consultation Digitally Signed & Committed • डिजिटल हस्ताक्षर व सत्यापन सफल</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          Case Completed: <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">{patient?.full_name || 'Patient'}</span>
        </h2>
        <p className="text-slate-400 text-xs sm:text-sm max-w-xl mx-auto">
          Clinical record signed by <strong className="text-slate-200">{currentDoctor?.name || 'Physician'}</strong> and successfully committed to Ayushman Bharat Digital Mission (ABDM).
        </p>
      </div>

      {/* 2. Main Grid: Signed Case Slip (Left) & Clinical Prescription (Right) */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* LEFT COLUMN: Official Signed OPD Case Slip (lg:col-span-5) */}
        <div className="lg:col-span-5 bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-950 border-2 border-emerald-500/60 rounded-3xl p-6 shadow-2xl shadow-emerald-950/50 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div>
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
                  Ministry of Ayush • AIIA OPD
                </span>
                <h4 className="text-sm font-bold text-slate-200">Signed Clinical Consultation Slip</h4>
              </div>
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <FileCheck2 className="w-4 h-4" />
              </div>
            </div>

            {/* Giant Token Display */}
            <div className="py-4 px-3 bg-slate-950/90 rounded-2xl border border-emerald-500/40 text-center shadow-inner mb-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Official OPD Token & Queue Number
              </span>
              <div className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 tracking-tight font-mono my-1">
                {patient?.token || patient?.queue_number || 'EM-101'}
              </div>
              <div className="text-xs font-semibold text-emerald-400 flex items-center justify-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>EHR Committed • Status: COMPLETED</span>
              </div>
            </div>

            {/* Meta Details */}
            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex items-center justify-between p-2.5 bg-slate-800/60 rounded-xl border border-slate-700/60">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Attending Physician:</span>
                </span>
                <strong className="text-white">{currentDoctor?.name || 'Dr. Anand Kulkarni'}</strong>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-slate-800/60 rounded-xl border border-slate-700/60">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>OPD Department:</span>
                </span>
                <strong className="text-emerald-300">{currentDoctor?.active_opd_room || 'OPD Room #14'}</strong>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-slate-800/60 rounded-xl border border-slate-700/60">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Signed Timestamp:</span>
                </span>
                <strong className="text-white font-mono">{currentDate} • {currentTime}</strong>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-slate-800/60 rounded-xl border border-slate-700/60">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                  <span>ABDM Health Record ID:</span>
                </span>
                <strong className="text-purple-300 font-mono text-[11px] truncate max-w-[130px]">
                  {patient?.phone ? `91-${patient.phone.replace(/[^0-9]/g, '').slice(-10)}@abdm` : '14-3456-7890'}
                </strong>
              </div>
            </div>
          </div>

          {/* Print Button */}
          <div className="mt-5 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={handlePrintSlip}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-teal-400 to-cyan-500 hover:from-teal-300 hover:to-cyan-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 transition shadow-lg shadow-cyan-500/25 cursor-pointer"
            >
              <Printer className="w-4 h-4 stroke-[2.5]" />
              <span>{isPrinted ? 'Printed Case Slip ✓' : 'Print Official Consultation Slip'}</span>
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: Clinical Summary & Prescriptions (lg:col-span-7) */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
          
          {/* Active Diagnostic Summary Card */}
          <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>Clinical Impression & AYUSH Prakriti</span>
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold">
                ✓ Digitally Signed
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800">
              <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">
                Confirmed Clinical Diagnosis:
              </span>
              <p className="text-sm font-bold text-white mt-0.5">
                Amlapitta (Hyperacidity / GERD) with Pitta-Vata Provocation
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300">
                  ICD-10: K21.9
                </span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-300">
                  NAMASTE AYU: AYU-AP-01
                </span>
              </div>
            </div>

            {/* Dosha & Prakriti Summary */}
            <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs">
              <span className="font-bold text-cyan-400 flex items-center gap-1.5 mb-1">
                <Compass className="w-3.5 h-3.5" /> Constitutional Assessment:
              </span>
              <p className="text-slate-300">
                Pitta-Vata Prakriti • Tikshnagni (Elevated digestive heat) • Krura Koshtha (Sluggish evacuation)
              </p>
            </div>
          </div>

          {/* Prescriptions & Diet Plan */}
          <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3 flex-1">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
              <Pill className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Prescribed Formulations & Pathya Diet Plan
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-white">Avipattikar Churna</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-900 text-cyan-400 border border-slate-700">
                    3g BD
                  </span>
                </div>
                <p className="text-slate-400 text-[11px]">Before meals with lukewarm water (14 days)</p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-white">Kamadudha Ras (Moti)</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-900 text-cyan-400 border border-slate-700">
                    1 Tab BD
                  </span>
                </div>
                <p className="text-slate-400 text-[11px]">After food with cold milk (14 days)</p>
              </div>
            </div>

            {/* Diet Dos and Don'ts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-slate-300 space-y-1">
                <span className="font-bold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Pathya (Diet to Follow):
                </span>
                <p className="text-[11px]">• Pomegranate, sweet apples, tender coconut water</p>
                <p className="text-[11px]">• Moong dal khichdi with half tsp cow's ghee</p>
              </div>

              <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-slate-300 space-y-1">
                <span className="font-bold text-rose-400 flex items-center gap-1">
                  <Ban className="w-3.5 h-3.5" /> Apathya (Foods to Avoid):
                </span>
                <p className="text-[11px]">• Red chili, oily fried snacks, sour curds</p>
                <p className="text-[11px]">• Late dinner post 9:30 PM & skipped meals</p>
              </div>
            </div>
          </div>

          {/* Navigation Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={onBackToCaseSheet}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-bold flex items-center justify-center gap-2 border border-slate-700 transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-cyan-400" />
              <span>Back to Case Sheet (समीक्षा देखें)</span>
            </button>

            <button
              type="button"
              onClick={onNextPatient}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-teal-400 to-cyan-500 hover:from-teal-300 hover:to-cyan-400 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition shadow-lg shadow-cyan-500/25 cursor-pointer"
            >
              <span>Next Patient (कतार में अगला मरीज़)</span>
              <ChevronRight className="w-4 h-4 stroke-[3]" />
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};

export default SignedConsultationView;
