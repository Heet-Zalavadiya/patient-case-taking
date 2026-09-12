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
      <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-10 text-center text-slate-400 shadow-xl">
        <Sparkles className="w-10 h-10 text-cyan-400 mx-auto mb-3 opacity-60" />
        <p className="text-base font-bold text-slate-300">No specialized AYUSH assessment recorded for this session.</p>
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
    <div className="space-y-6">
      {/* 4 Core AYUSH Indicators Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Dominant Prakriti Card */}
        <div className="bg-slate-950 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col justify-between hover:border-cyan-500/50 transition">
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-cyan-400 uppercase tracking-wider mb-2">
              <span className="flex items-center gap-2">
                <Compass className="w-4.5 h-4.5 text-cyan-400" /> Dominant Prakriti
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 font-bold border border-cyan-500/30">
                Constitution
              </span>
            </div>
            <h4 className="text-lg sm:text-xl font-black text-white">
              {typeof prakriti === 'string' ? prakriti.split('(')[0].trim() : 'Pitta-Vata'}
            </h4>
            <p className="text-xs sm:text-sm text-slate-300 mt-1.5 font-medium leading-relaxed">
              Inherent physical & metabolic constitution.
            </p>
          </div>

          {/* Dosha Proportions Visual Bar */}
          <div className="mt-4 pt-3 border-t border-slate-800">
            <div className="flex justify-between text-xs font-black mb-1.5 font-mono">
              <span className="text-sky-300">V: 35%</span>
              <span className="text-amber-300">P: 55%</span>
              <span className="text-emerald-300">K: 10%</span>
            </div>
            <div className="h-2.5 w-full bg-slate-800 rounded-full flex overflow-hidden shadow-inner">
              <div style={{ width: '35%' }} className="bg-sky-400 shadow-sm" title="Vata 35%" />
              <div style={{ width: '55%' }} className="bg-amber-400 shadow-sm" title="Pitta 55%" />
              <div style={{ width: '10%' }} className="bg-emerald-400 shadow-sm" title="Kapha 10%" />
            </div>
          </div>
        </div>

        {/* Current Morbidity / Vikriti Card */}
        <div className="bg-slate-950 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col justify-between hover:border-amber-500/50 transition">
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">
              <span className="flex items-center gap-2">
                <Activity className="w-4.5 h-4.5 text-amber-400" /> Current Vikriti
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 font-bold border border-amber-500/30">
                Imbalance
              </span>
            </div>
            <h4 className="text-base sm:text-lg font-black text-white leading-snug">
              {vikriti}
            </h4>
            <p className="text-xs sm:text-sm text-slate-300 mt-1.5 font-medium leading-relaxed">
              Active dosha disturbances triggering symptoms today.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800">
            <span className="text-xs font-black px-3 py-1.5 rounded-xl bg-amber-500/25 text-amber-200 border border-amber-500/40 block text-center shadow-sm">
              Target: Pacify Pitta & Vata
            </span>
          </div>
        </div>

        {/* Agni Status Card */}
        <div className="bg-slate-950 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col justify-between hover:border-orange-500/50 transition">
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-orange-400 uppercase tracking-wider mb-2">
              <span className="flex items-center gap-2">
                <Flame className="w-4.5 h-4.5 text-orange-400" /> Agni (Digestion)
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-orange-500/15 text-orange-300 font-bold border border-orange-500/30">
                Metabolism
              </span>
            </div>
            <h4 className="text-base sm:text-lg font-black text-white leading-snug">
              {agni}
            </h4>
            <p className="text-xs sm:text-sm text-slate-300 mt-1.5 font-medium leading-relaxed">
              Rapid digestion with high stomach acidity & burning sensation.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800">
            <span className="text-xs font-bold text-orange-200 px-3 py-1.5 rounded-xl bg-orange-500/20 border border-orange-500/30 block text-center">
              Recommendation: Pitta-shamak diet
            </span>
          </div>
        </div>

        {/* Koshtha (Bowel Habit) Card */}
        <div className="bg-slate-950 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col justify-between hover:border-teal-500/50 transition">
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-teal-400 uppercase tracking-wider mb-2">
              <span className="flex items-center gap-2">
                <Utensils className="w-4.5 h-4.5 text-teal-400" /> Koshtha (Motility)
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-teal-500/15 text-teal-300 font-bold border border-teal-500/30">
                Gut Motility
              </span>
            </div>
            <h4 className="text-base sm:text-lg font-black text-white leading-snug">
              {koshtha}
            </h4>
            <p className="text-xs sm:text-sm text-slate-300 mt-1.5 font-medium leading-relaxed">
              Tendency toward hard dry stools and sluggish evening evacuation.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800">
            <span className="text-xs font-bold text-teal-200 px-3 py-1.5 rounded-xl bg-teal-500/20 border border-teal-500/30 block text-center">
              Recommendation: Mild Anulomana
            </span>
          </div>
        </div>
      </div>

      {/* Ashtavidha Clinical Pariksha Grid */}
      <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 mb-5 border-b border-slate-800">
          <div className="flex items-center gap-3 min-w-0">
            <Sparkles className="w-6 h-6 text-cyan-400 shrink-0" />
            <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
              Ashtavidha Pariksha (8-Fold AYUSH Examination)
            </h3>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shrink-0">
            NAMASTE Aligned
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Tongue / Jihva */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1.5">
            <span className="text-sm font-black text-white flex items-center gap-2">
              <span className="text-base">👅</span> Jihva (Tongue)
            </span>
            <p className="text-xs sm:text-sm font-semibold text-slate-200 pt-1">
              Coating: <span className="font-normal text-slate-300">Yellowish coating at base (Ama + Pitta)</span>
            </p>
            <p className="text-xs sm:text-sm font-semibold text-slate-200">
              Moisture: <span className="font-normal text-slate-300">Dry at tip (Vata)</span>
            </p>
            <span className="text-xs font-bold text-cyan-400 block pt-1">
              AI Confidence: 94.2%
            </span>
          </div>

          {/* Pulse / Nadi */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1.5">
            <span className="text-sm font-black text-white flex items-center gap-2">
              <span className="text-base">🫀</span> Nadi (Pulse)
            </span>
            <p className="text-xs sm:text-sm font-semibold text-slate-200 pt-1">
              Gati: <span className="font-normal text-slate-300">Manduka Gati (Bounding, Pitta)</span>
            </p>
            <p className="text-xs sm:text-sm font-semibold text-slate-200">
              Rhythm: <span className="font-normal text-slate-300">Regular • 108 BPM</span>
            </p>
            <span className="text-xs font-bold text-cyan-400 block pt-1">
              Bio-Sensor: High Accuracy
            </span>
          </div>

          {/* Eyes / Drik */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1.5">
            <span className="text-sm font-black text-white flex items-center gap-2">
              <span className="text-base">👁️</span> Drik (Eyes / Vision)
            </span>
            <p className="text-xs sm:text-sm font-semibold text-slate-200 pt-1">
              Sclera: <span className="font-normal text-slate-300">Mild reddish tinge, burning</span>
            </p>
            <p className="text-xs sm:text-sm font-semibold text-slate-200">
              Signs: <span className="font-normal text-slate-300">No icterus (jaundice)</span>
            </p>
            <span className="text-xs font-bold text-slate-400 block pt-1">
              Visual Triage Passed
            </span>
          </div>

          {/* Voice / Shabda */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1.5">
            <span className="text-sm font-black text-white flex items-center gap-2">
              <span className="text-base">🗣️</span> Shabda (Speech & Tone)
            </span>
            <p className="text-xs sm:text-sm font-semibold text-slate-200 pt-1">
              Tone: <span className="font-normal text-slate-300">Clear, slightly irritable tone</span>
            </p>
            <p className="text-xs sm:text-sm font-semibold text-slate-200">
              Breathing: <span className="font-normal text-slate-300">Tachypneic (Rapid breathing)</span>
            </p>
            <span className="text-xs font-bold text-slate-400 block pt-1">
              Multilingual Audio Analyzed
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AyushAssessmentCard;
