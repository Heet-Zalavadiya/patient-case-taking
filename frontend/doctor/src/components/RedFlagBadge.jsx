import React from 'react';
import { AlertTriangle, Flame, ShieldAlert, CheckCircle2 } from 'lucide-react';

export const RedFlagBadge = ({ alert, compact = false, showDetails = false, onAcknowledge }) => {
  if (!alert) return null;

  const isCritical = alert.severity === 'CRITICAL' || alert.severity === 'HIGH';

  if (compact) {
    return (
      <span
        title={alert.symptom || alert.flag_description}
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wide transition-all ${isCritical
            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50 shadow-sm animate-alert-pulse'
            : 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
          }`}
      >
        <span className="relative flex h-2 w-2">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isCritical ? 'bg-rose-400' : 'bg-amber-400'
            }`} />
          <span className={`relative inline-flex rounded-full h-2 w-2 ${isCritical ? 'bg-rose-500' : 'bg-amber-500'
            }`} />
        </span>
        <span className="font-mono uppercase">{alert.severity} RED-FLAG</span>
      </span>
    );
  }

  return (
    <div
      className={`rounded-2xl p-5 border transition-all ${isCritical
          ? 'bg-rose-500/15 border-rose-500/40 shadow-lg shadow-rose-950/20'
          : 'bg-amber-500/15 border-amber-500/40 shadow-lg shadow-amber-950/20'
        }`}
    >
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${isCritical
                ? 'bg-rose-600 text-white shadow-md'
                : 'bg-amber-600 text-white shadow-md'
              }`}
          >
            {isCritical ? <Flame className="w-6 h-6 animate-pulse" /> : <AlertTriangle className="w-6 h-6" />}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span
                className={`text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${isCritical ? 'bg-rose-700 text-white' : 'bg-amber-700 text-white'
                  }`}
              >
                {alert.severity} EMERGENCY ALERT
              </span>
              <span className="text-xs text-slate-400 font-mono font-medium">
                Detected: {alert.timestamp}
              </span>
              {alert.is_acknowledged ? (
                <span className="text-xs px-2.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Doctor Acknowledged
                </span>
              ) : (
                <span className="text-xs px-2.5 py-0.5 rounded-md bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30 animate-pulse">
                  Immediate Review Required
                </span>
              )}
            </div>

            {/* Plain English Reason */}
            <p className="text-sm font-bold text-rose-200 mt-1 leading-snug">
              {alert.symptom || alert.flag_description}
            </p>

            {/* Vital Triggers Badges */}
            {alert.vital_triggers && alert.vital_triggers.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap pt-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase">Triggers:</span>
                {alert.vital_triggers.map((val, idx) => (
                  <span
                    key={idx}
                    className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-950 border border-rose-500/30 text-rose-300"
                  >
                    {val}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {onAcknowledge && (
          <button
            type="button"
            onClick={onAcknowledge}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${alert.is_acknowledged
                ? 'bg-slate-800 text-emerald-400 border border-emerald-500/40 hover:bg-slate-750'
                : 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm'
              }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{alert.is_acknowledged ? 'Acknowledged' : 'Acknowledge'}</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default RedFlagBadge;
