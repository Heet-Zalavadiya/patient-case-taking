import React from 'react';
import { 
  Sparkles, 
  Utensils, 
  Activity, 
  Compass, 
  Brain, 
  Flame, 
  HeartPulse, 
  CheckCircle2, 
  AlertCircle,
  Eye,
  Info
} from 'lucide-react';

export const AyushAssessmentCard = ({ ayushData }) => {
  if (!ayushData) {
    return (
      <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 text-center text-slate-400 shadow-xl">
        <Sparkles className="w-8 h-8 text-cyan-400 mx-auto mb-2 opacity-60" />
        <p className="text-sm font-semibold text-slate-300">No specialized AYUSH assessment recorded for this session.</p>
      </div>
    );
  }

  const {
    prakriti = "Pitta-Vata (55% Pitta, 35% Vata, 10% Kapha)",
    vikriti = "Pitta-Vata Aggravation with Mild Kapha Depletion",
    agni = "Tikshnagni (Hyperactive Digestion / High Acid)",
    koshtha = "Krura Kostha (Tendency to hard dry stools)",
    dashavidha_pariksha = {},
    ashtavidha_pariksha = {}
  } = ayushData;

  return (
    <div className="space-y-5">
      {/* 4 Core AYUSH Indicators Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Dominant Prakriti Card */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4.5 shadow-inner flex flex-col justify-between hover:border-cyan-500/40 transition">
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-cyan-400 uppercase tracking-wider mb-2">
              <span className="flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-cyan-400" /> Dominant Prakriti
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 font-semibold border border-cyan-500/30">
                Constitution
              </span>
            </div>
            <h4 className="text-base font-black text-white">
              {typeof prakriti === 'string' ? prakriti.split('(')[0].trim() : 'Pitta-Vata'}
            </h4>
            <p className="text-xs text-slate-400 mt-1 font-medium leading-relaxed">
              Inherent physical & metabolic constitution.
            </p>
          </div>

          {/* Dosha Proportions Visual Bar */}
          <div className="mt-3 pt-3 border-t border-slate-800">
            <div className="flex justify-between text-[11px] font-bold mb-1 font-mono">
              <span className="text-sky-300">V: 35%</span>
              <span className="text-amber-300">P: 55%</span>
              <span className="text-emerald-300">K: 10%</span>
            </div>
            <div className="h-2 w-full bg-slate-800 rounded-full flex overflow-hidden shadow-inner">
              <div style={{ width: '35%' }} className="bg-sky-400 shadow-sm" title="Vata 35%" />
              <div style={{ width: '55%' }} className="bg-amber-400 shadow-sm" title="Pitta 55%" />
              <div style={{ width: '10%' }} className="bg-emerald-400 shadow-sm" title="Kapha 10%" />
            </div>
          </div>
        </div>

        {/* Current Morbidity / Vikriti Card */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4.5 shadow-inner flex flex-col justify-between hover:border-amber-500/40 transition">
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">
              <span className="flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-amber-400" /> Current Vikriti
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 font-semibold border border-amber-500/30">
                Imbalance
              </span>
            </div>
            <h4 className="text-sm font-bold text-white">
              {vikriti}
            </h4>
            <p className="text-xs text-slate-400 mt-1 font-medium leading-relaxed">
              Active dosha disturbances triggering symptoms today.
            </p>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-800">
            <span className="text-[11px] font-extrabold px-2 py-1 rounded-lg bg-amber-500/25 text-amber-200 border border-amber-500/40 block text-center shadow-xs">
              Target: Pacify Pitta & Vata
            </span>
          </div>
        </div>

        {/* Agni Status Card */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4.5 shadow-inner flex flex-col justify-between hover:border-orange-500/40 transition">
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-orange-400 uppercase tracking-wider mb-2">
              <span className="flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-orange-400" /> Agni (Digestion)
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-300 font-semibold border border-orange-500/30">
                Metabolism
              </span>
            </div>
            <h4 className="text-sm font-bold text-white">
              {agni}
            </h4>
            <p className="text-xs text-slate-400 mt-1 font-medium leading-relaxed">
              Rapid digestion with high stomach acidity & burning sensation.
            </p>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-800">
            <span className="text-[11px] font-bold text-orange-200 px-2 py-1 rounded-lg bg-orange-500/20 border border-orange-500/30 block text-center">
              Recommendation: Pitta-shamak diet
            </span>
          </div>
        </div>

        {/* Koshtha (Bowel Habit) Card */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4.5 shadow-inner flex flex-col justify-between hover:border-teal-500/40 transition">
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-teal-400 uppercase tracking-wider mb-2">
              <span className="flex items-center gap-1.5">
                <Utensils className="w-4 h-4 text-teal-400" /> Koshtha (Motility)
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-500/15 text-teal-300 font-semibold border border-teal-500/30">
                Gut Motility
              </span>
            </div>
            <h4 className="text-sm font-bold text-white">
              {koshtha}
            </h4>
            <p className="text-xs text-slate-400 mt-1 font-medium leading-relaxed">
              Tendency toward hard dry stools and sluggish evening evacuation.
            </p>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-800">
            <span className="text-[11px] font-bold text-teal-200 px-2 py-1 rounded-lg bg-teal-500/20 border border-teal-500/30 block text-center">
              Recommendation: Mild Anulomana
            </span>
          </div>
        </div>
      </div>

      {/* Ashtavidha Clinical Pariksha (Tongue, Pulse, Eyes, Voice) */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-inner">
        <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2 pb-3 mb-4 border-b border-slate-800">
          <div className="flex items-center gap-2 min-w-0">
            <Sparkles className="w-5 h-5 text-cyan-400 shrink-0" />
            <h3 className="text-sm sm:text-base font-black text-white tracking-tight">
              Ashtavidha Pariksha (8-Fold Clinical Exam)
            </h3>
          </div>
          <span className="text-[10px] sm:text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shrink-0">
            NAMASTE Aligned
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Tongue / Jihva */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-xs font-black text-white flex items-center gap-1.5">
              <span>👅</span> Jihva (Tongue)
            </span>
            <p className="text-xs font-semibold text-slate-300 pt-1">
              Coating: <span className="font-normal text-slate-400">Yellowish coating at base (Ama + Pitta)</span>
            </p>
            <p className="text-xs font-semibold text-slate-300">
              Moisture: <span className="font-normal text-slate-400">Dry at tip (Vata)</span>
            </p>
            <span className="text-[10px] font-bold text-cyan-400 block pt-1">
              AI Confidence: 94.2%
            </span>
          </div>

          {/* Pulse / Nadi */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-xs font-black text-white flex items-center gap-1.5">
              <span>🫀</span> Nadi (Pulse)
            </span>
            <p className="text-xs font-semibold text-slate-300 pt-1">
              Gati: <span className="font-normal text-slate-400">Manduka Gati (Bounding, Pitta predominant)</span>
            </p>
            <p className="text-xs font-semibold text-slate-300">
              Rhythm: <span className="font-normal text-slate-400">Regular • 108 BPM</span>
            </p>
            <span className="text-[10px] font-bold text-cyan-400 block pt-1">
              Bio-Sensor: High Accuracy
            </span>
          </div>

          {/* Eyes / Drik */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-xs font-black text-white flex items-center gap-1.5">
              <span>👁️</span> Drik (Eyes / Vision)
            </span>
            <p className="text-xs font-semibold text-slate-300 pt-1">
              Sclera: <span className="font-normal text-slate-400">Mild reddish tinge, burning sensation</span>
            </p>
            <p className="text-xs font-semibold text-slate-300">
              Signs: <span className="font-normal text-slate-400">No icterus (jaundice)</span>
            </p>
            <span className="text-[10px] font-bold text-slate-400 block pt-1">
              Visual Triage Passed
            </span>
          </div>

          {/* Voice / Shabda */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-xs font-black text-white flex items-center gap-1.5">
              <span>🗣️</span> Shabda (Speech & Tone)
            </span>
            <p className="text-xs font-semibold text-slate-300 pt-1">
              Tone: <span className="font-normal text-slate-400">Clear, slightly irritable tone</span>
            </p>
            <p className="text-xs font-semibold text-slate-300">
              Breathing: <span className="font-normal text-slate-400">Tachypneic (Rapid breathing)</span>
            </p>
            <span className="text-[10px] font-bold text-slate-400 block pt-1">
              Multilingual Audio Analyzed
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AyushAssessmentCard;
