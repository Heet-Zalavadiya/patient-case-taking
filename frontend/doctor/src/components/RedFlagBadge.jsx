import React from 'react';
import { AlertTriangle, Flame, ShieldAlert, CheckCircle2 } from 'lucide-react';

export const RedFlagBadge = ({ alert, compact = false, showDetails = false, onAcknowledge }) => {
  if (!alert) return null;

  const isCritical = alert.severity === 'CRITICAL';

  if (compact) {
    return (
      <span
        title={alert.symptom}
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wide transition-all ${
          isCritical
            ? 'bg-rose-100 text-rose-800 border border-rose-300 shadow-2xs animate-alert-pulse'
            : 'bg-amber-100 text-amber-800 border border-amber-300'
        }`}
      >
        <span className="relative flex h-2 w-2">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
            isCritical ? 'bg-rose-500' : 'bg-amber-500'
          }`} />
          <span className={`relative inline-flex rounded-full h-2 w-2 ${
            isCritical ? 'bg-rose-600' : 'bg-amber-600'
          }`} />
        </span>
        <span className="font-mono uppercase">{alert.severity} RED-FLAG</span>
      </span>
    );
  }

  return (
    <div
      className={`rounded-2xl p-5 border transition-all ${
        isCritical
          ? 'bg-rose-50/70 border-rose-300 shadow-sm'
          : 'bg-amber-50/70 border-amber-300 shadow-sm'
      }`}
    >
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
              isCritical
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-amber-600 text-white shadow-xs'
            }`}
          >
            {isCritical ? <Flame className="w-6 h-6 animate-pulse" /> : <AlertTriangle className="w-6 h-6" />}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span
                className={`text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                  isCritical ? 'bg-rose-700 text-white' : 'bg-amber-700 text-white'
                }`}
              >
                {alert.severity} EMERGENCY ALERT
              </span>
              <span className="text-xs text-slate-500 font-mono font-medium">
                Detected: {alert.timestamp}
              </span>
              {alert.is_acknowledged ? (
                <span className="text-xs px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold border border-emerald-300 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Doctor Acknowledged
                </span>
              ) : (
                <span className="text-xs px-2.5 py-0.5 rounded-md bg-rose-200 text-rose-900 font-bold border border-rose-300 animate-pulse">
                  Immediate Review Required
                </span>
              )}
            </div>

            {/* Plain English Reason */}
            <p className="text-sm font-bold text-rose-950 mt-1 leading-snug">
              {alert.symptom}
            </p>

            {/* Vital Triggers in Eye-Catching Badges */}
            {alert.vital_triggers && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Critical Readings:
                </span>
                {alert.vital_triggers.map((trigger, idx) => (
                  <span
                    key={idx}
                    className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-white border border-rose-300 text-rose-700 shadow-2xs"
                  >
                    {trigger}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 1-Click Acknowledge Button */}
        {!alert.is_acknowledged && onAcknowledge && (
          <button
            onClick={() => onAcknowledge(alert.alert_id)}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold transition shadow-xs cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
          >
            <CheckCircle2 className="w-4 h-4" />
            Acknowledge Emergency
          </button>
        )}
      </div>
    </div>
  );
};

export default RedFlagBadge;
