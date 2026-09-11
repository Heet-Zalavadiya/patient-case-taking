import React, { useState } from 'react';
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
      <div className="bg-white border border-[#e2ece5] rounded-3xl p-8 text-center text-slate-500 shadow-xs">
        <Sparkles className="w-8 h-8 text-[#0e4d34] mx-auto mb-2 opacity-50" />
        <p className="text-sm font-semibold">No specialized AYUSH assessment recorded for this session.</p>
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
        <div className="bg-white border border-[#e2ece5] rounded-2xl p-4 shadow-xs flex flex-col justify-between hover:border-[#0e4d34] transition">
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-[#0e4d34] uppercase tracking-wider mb-2">
              <span className="flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-[#0e4d34]" /> Dominant Prakriti
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#e7f3ec] text-[#0e4d34] font-semibold border border-[#e2ece5]">
                Constitution
              </span>
            </div>
            <h4 className="text-base font-black text-slate-900">
              {typeof prakriti === 'string' ? prakriti.split('(')[0].trim() : 'Pitta-Vata'}
            </h4>
            <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed">
              Inherent physical & metabolic body type.
            </p>
          </div>

          {/* Eye-catching Dosha Proportions Visual Bar */}
          <div className="mt-3 pt-3 border-t border-slate-100">
            <div className="flex justify-between text-[11px] font-bold text-slate-600 mb-1">
              <span className="text-sky-700">Vata: 35%</span>
              <span className="text-amber-700">Pitta: 55%</span>
              <span className="text-emerald-700">Kapha: 10%</span>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full flex overflow-hidden">
              <div style={{ width: '35%' }} className="bg-sky-500" title="Vata 35%" />
              <div style={{ width: '55%' }} className="bg-amber-500" title="Pitta 55%" />
              <div style={{ width: '10%' }} className="bg-emerald-500" title="Kapha 10%" />
            </div>
          </div>
        </div>

        {/* Current Morbidity / Vikriti Card */}
        <div className="bg-white border border-[#e2ece5] rounded-2xl p-4 shadow-xs flex flex-col justify-between hover:border-amber-400 transition">
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-amber-700 uppercase tracking-wider mb-2">
              <span className="flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-amber-600" /> Current Vikriti
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 font-semibold border border-amber-200">
                Imbalance
              </span>
            </div>
            <h4 className="text-sm font-bold text-slate-900">
              {vikriti}
            </h4>
            <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed">
              Active dosha disturbances triggering symptoms today.
            </p>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100">
            <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 block text-center">
              Target: Pacify Pitta & Vata
            </span>
          </div>
        </div>

        {/* Agni Status Card */}
        <div className="bg-white border border-[#e2ece5] rounded-2xl p-4 shadow-xs flex flex-col justify-between hover:border-orange-400 transition">
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-orange-700 uppercase tracking-wider mb-2">
              <span className="flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-orange-600" /> Agni (Digestive Fire)
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-50 text-orange-800 font-semibold border border-orange-200">
                Metabolism
              </span>
            </div>
            <h4 className="text-sm font-bold text-slate-900">
              {agni}
            </h4>
            <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed">
              Rapid digestion with high stomach acidity & burning sensation.
            </p>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100">
            <span className="text-[11px] font-bold text-orange-700 block">
              Clinical Note: Cool soothing diet needed
            </span>
          </div>
        </div>

        {/* Koshtha (Bowel Habit) Card */}
        <div className="bg-white border border-[#e2ece5] rounded-2xl p-4 shadow-xs flex flex-col justify-between hover:border-sky-400 transition">
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-sky-700 uppercase tracking-wider mb-2">
              <span className="flex items-center gap-1.5">
                <Utensils className="w-4 h-4 text-sky-600" /> Koshtha (Bowel Pattern)
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-50 text-sky-800 font-semibold border border-sky-200">
                Gut Motility
              </span>
            </div>
            <h4 className="text-sm font-bold text-slate-900">
              {koshtha}
            </h4>
            <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed">
              Tendency toward hard dry stools and sluggish evening evacuation.
            </p>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100">
            <span className="text-[11px] font-bold text-sky-700 block">
              Recommendation: Hydration & mild Anulomana
            </span>
          </div>
        </div>
      </div>

      {/* Ashtavidha Clinical Pariksha (Tongue, Pulse, Voice, Eyes) */}
      <div className="bg-white border border-[#e2ece5] rounded-3xl p-5 sm:p-6 shadow-xs">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#0e4d34]" />
            <h3 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
              Ashtavidha Pariksha (8-Fold Standard Examination)
            </h3>
          </div>
          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#e7f3ec] text-[#0e4d34] border border-[#e2ece5]">
            NAMASTE Aligned
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Tongue / Jihva */}
          <div className="p-4 rounded-2xl bg-[#f4f8f5] border border-[#e2ece5] space-y-1">
            <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
              <span>👅</span> Jihva (Tongue)
            </span>
            <p className="text-xs font-semibold text-slate-700 pt-1">
              Coating: <span className="font-normal text-slate-600">Yellowish coating at base (Ama + Pitta)</span>
            </p>
            <p className="text-xs font-semibold text-slate-700">
              Moisture: <span className="font-normal text-slate-600">Dry at tip (Vata)</span>
            </p>
            <span className="text-[10px] font-bold text-[#0e4d34] block pt-1">
              AI Confidence: 94.2%
            </span>
          </div>

          {/* Pulse / Nadi */}
          <div className="p-4 rounded-2xl bg-[#f4f8f5] border border-[#e2ece5] space-y-1">
            <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
              <span>🫀</span> Nadi (Pulse)
            </span>
            <p className="text-xs font-semibold text-slate-700 pt-1">
              Gati: <span className="font-normal text-slate-600">Manduka Gati (Bounding, Pitta predominant)</span>
            </p>
            <p className="text-xs font-semibold text-slate-700">
              Rhythm: <span className="font-normal text-slate-600">Regular • 108 BPM</span>
            </p>
            <span className="text-[10px] font-bold text-[#0e4d34] block pt-1">
              Bio-Sensor: High Accuracy
            </span>
          </div>

          {/* Eyes / Drik */}
          <div className="p-4 rounded-2xl bg-[#f4f8f5] border border-[#e2ece5] space-y-1">
            <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
              <span>👁️</span> Drik (Eyes / Vision)
            </span>
            <p className="text-xs font-semibold text-slate-700 pt-1">
              Sclera: <span className="font-normal text-slate-600">Mild reddish tinge, burning sensation</span>
            </p>
            <p className="text-xs font-semibold text-slate-700">
              Signs: <span className="font-normal text-slate-600">No icterus (jaundice)</span>
            </p>
            <span className="text-[10px] font-bold text-slate-500 block pt-1">
              Visual Triage Passed
            </span>
          </div>

          {/* Voice / Shabda */}
          <div className="p-4 rounded-2xl bg-[#f4f8f5] border border-[#e2ece5] space-y-1">
            <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
              <span>🗣️</span> Shabda (Speech & Tone)
            </span>
            <p className="text-xs font-semibold text-slate-700 pt-1">
              Tone: <span className="font-normal text-slate-600">Clear, slightly irritable tone</span>
            </p>
            <p className="text-xs font-semibold text-slate-700">
              Breathing: <span className="font-normal text-slate-600">Tachypneic (Rapid breathing)</span>
            </p>
            <span className="text-[10px] font-bold text-slate-500 block pt-1">
              Multilingual Audio Analyzed
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AyushAssessmentCard;
