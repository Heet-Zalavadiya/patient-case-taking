import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  ArrowRight,
  Clock,
  User,
  Activity,
  Flame,
  Sparkles,
  Stethoscope,
  AlertTriangle,
  RefreshCw,
  Wifi,
  WifiOff,
  CheckCircle2,
  ChevronRight,
  HeartPulse
} from 'lucide-react';
import usePatientQueue from '../hooks/usePatientQueue';

export const PatientListPage = ({
  currentDoctor,
  onSelectPatient
}) => {
  const {
    patients,
    patientHistories,
    alerts,
    isLoading,
    isRefreshing,
    isLiveApi,
    error: errorNotice,
    searchQuery,
    setSearchQuery,
    activeFilter,
    setActiveFilter,
    filteredPatients,
    counts,
    refetch,
    retry
  } = usePatientQueue();

  const totalCount = counts.total;
  const highRedFlagsCount = counts.redFlags;
  const routineCount = counts.waiting + counts.inConsultation;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Top Clinical Profile & Live Sync Header */}
      <div className="bg-slate-900/95 backdrop-blur-xl p-6 sm:p-7 rounded-3xl border border-slate-800 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-400 to-cyan-600 text-slate-950 flex items-center justify-center shrink-0 shadow-lg shadow-cyan-500/25">
            <HeartPulse className="w-9 h-9 stroke-[2.5]" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight">
                {currentDoctor?.name || 'Dr. Anand Kulkarni (MD Ayu)'}
              </h1>
              <span className="text-xs sm:text-sm font-bold px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                {currentDoctor?.active_opd_room || 'OPD Room #14'}
              </span>
            </div>
            <p className="text-sm sm:text-base text-slate-300 font-medium">
              {currentDoctor?.department || 'General Medicine & Kayachikitsa'} • {currentDoctor?.institution || 'Ministry of AYUSH Central Hospital'}
            </p>
          </div>
        </div>

        {/* Live Network Status & Refresh */}
        <div className="flex items-center gap-4 flex-wrap shrink-0">
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border text-sm font-bold bg-slate-950/80 border-slate-800">
            {isLiveApi ? (
              <>
                <Wifi className="w-4 h-4 text-emerald-400 animate-pulse" />
                <span className="text-emerald-300 font-mono">Live API Connected</span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4 text-amber-400" />
                <span className="text-amber-300 font-mono">Resilient Fallback Mode</span>
              </>
            )}
          </div>

          <button
            onClick={() => refetch()}
            disabled={isRefreshing}
            className="px-4 py-2.5 rounded-2xl border border-slate-700 bg-slate-800 hover:bg-slate-750 text-slate-200 text-sm font-bold transition flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-50 min-h-[44px]"
            title="Refresh Patient Queue"
          >
            <RefreshCw className={`w-4 h-4 text-cyan-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Sync Queue</span>
          </button>

          <div className="text-right border-l border-slate-800 pl-4 hidden sm:block">
            <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">
              Total Patients
            </div>
            <div className="text-xl font-black text-cyan-400 font-mono">
              {totalCount} Active
            </div>
          </div>
        </div>
      </div>

      {/* Error / Resilience Banner */}
      {errorNotice && (
        <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-sm font-semibold text-amber-200 flex items-center justify-between">
          <span>{errorNotice}</span>
          <button
            onClick={() => retry()}
            className="font-mono text-xs font-black uppercase bg-amber-500/25 px-3 py-1 rounded-xl text-amber-300 hover:bg-amber-500/40 cursor-pointer"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* Filter and Search Bar (Bigger Controls) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Filter Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1 flex items-center gap-1.5">
            <Filter className="w-4 h-4 text-cyan-400" /> Filter Queue:
          </span>
          {['All', 'Waiting', 'In Consultation', 'Completed', 'Red-Flags'].map((tab) => {
            const isSelected = activeFilter === tab;
            const isRedFlagTab = tab === 'Red-Flags';
            return (
              <button
                key={tab}
                onClick={() => setActiveFilter(tab)}
                className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  isSelected
                    ? isRedFlagTab
                      ? 'bg-rose-600 text-white shadow-lg shadow-rose-950/50 animate-alert-pulse font-black'
                      : 'bg-cyan-500/25 text-cyan-200 border-2 border-cyan-400 shadow-lg shadow-cyan-950/40 font-black'
                    : isRedFlagTab
                    ? 'bg-slate-900/80 text-rose-300 hover:bg-rose-950/40 border border-rose-900/60'
                    : 'bg-slate-900/80 text-slate-300 hover:text-white border border-slate-800 hover:bg-slate-900'
                }`}
              >
                {tab === 'Red-Flags' ? (
                  <span className="flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-rose-300" />
                    <span>Red Flags ({highRedFlagsCount})</span>
                  </span>
                ) : (
                  <span>{tab}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search Input Box */}
        <div className="relative w-full md:w-96">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
            <Search className="w-5 h-5 text-cyan-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search patient name, token, MRN..."
            className="w-full pl-11 pr-4 py-3 rounded-2xl bg-slate-900/90 border border-slate-800 text-sm sm:text-base text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 transition shadow-inner font-medium"
          />
        </div>
      </div>

      {/* Quick Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 rounded-3xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 font-bold">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm font-black text-rose-200">High Red-Flag Emergency Queue</div>
              <div className="text-xs text-rose-300/80 font-medium">Immediate clinical evaluation required</div>
            </div>
          </div>
          <span className="text-2xl font-black text-rose-300 font-mono">
            {highRedFlagsCount}
          </span>
        </div>

        <div className="p-4 rounded-3xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 font-bold">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm font-black text-cyan-200">Standard OPD Queue</div>
              <div className="text-xs text-cyan-300/80 font-medium">Pre-case intake completed</div>
            </div>
          </div>
          <span className="text-2xl font-black text-cyan-300 font-mono">
            {routineCount}
          </span>
        </div>
      </div>

      {/* Patients Queue List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-slate-900/90 rounded-3xl p-7 border border-slate-800 animate-pulse">
              <div className="flex items-center gap-5">
                <div className="w-20 h-20 bg-slate-800 rounded-2xl" />
                <div className="space-y-3 flex-1">
                  <div className="h-5 bg-slate-800 rounded w-1/3" />
                  <div className="h-4 bg-slate-800 rounded w-2/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredPatients.length === 0 ? (
        <div className="bg-slate-900/90 rounded-3xl p-14 text-center border border-slate-800 shadow-xl">
          <User className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-200">No matching patients in queue</h3>
          <p className="text-sm text-slate-400 mt-1">Try adjusting your search query or switching filter pills.</p>
        </div>
      ) : (
        /* Patient Cards List (Bigger & Structured) */
        <div className="grid grid-cols-1 gap-5">
          {filteredPatients.map((patient) => {
            const history = patientHistories[patient.patient_id] || {};
            const alert = alerts.find((a) => a.patient_id === patient.patient_id || a.session_id === patient.session_id);
            const isHighRedFlag = alert && alert.severity === 'HIGH';

            return (
              <div
                key={patient.patient_id}
                onClick={() => onSelectPatient(patient.patient_id)}
                className={`bg-slate-900/95 backdrop-blur-xl rounded-3xl p-6 sm:p-7 border transition-all cursor-pointer card-hover-effect relative group ${
                  isHighRedFlag
                    ? 'border-rose-500/50 bg-slate-900/95 hover:border-rose-400 shadow-2xl shadow-rose-950/30'
                    : 'border-slate-800 hover:border-cyan-500/60 shadow-xl shadow-cyan-950/10'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  {/* Left: Token, Demographics, Chief Complaint, Vitals */}
                  <div className="flex items-start gap-5 flex-1 min-w-0">
                    {/* Token Badge */}
                    <div className={`w-20 h-20 rounded-2xl flex flex-col items-center justify-center font-bold shrink-0 shadow-inner px-1 ${
                      isHighRedFlag
                        ? 'bg-rose-950 text-rose-300 border border-rose-500/60 animate-alert-pulse'
                        : 'bg-slate-950 text-cyan-400 border border-slate-800'
                    }`}>
                      <span className="text-[10px] uppercase font-black tracking-wider text-slate-400">Token</span>
                      <span className="text-xs sm:text-sm font-black tracking-tight font-mono whitespace-nowrap text-center">
                        {patient.token || patient.queue_number}
                      </span>
                    </div>

                    {/* Patient Core Info */}
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="text-lg sm:text-xl lg:text-2xl font-black text-white group-hover:text-cyan-300 transition">
                          {patient.full_name}
                        </h3>
                        <span className="text-sm text-slate-300 font-bold">
                          {patient.age} Yrs • {patient.gender}
                        </span>
                        <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-lg bg-slate-950 text-slate-300 border border-slate-800">
                          MRN: {patient.mrn}
                        </span>

                        {/* High Red Flag Badge */}
                        {isHighRedFlag ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-600 text-white shadow-md animate-alert-pulse">
                            <Flame className="w-4 h-4" />
                            <span>EMERGENCY: {alert.flag_description.split(':')[0] || 'HIGH RED-FLAG'}</span>
                          </span>
                        ) : (
                          <span className="text-xs font-bold px-3 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                            {history.dominant_dosha || 'Pitta-Vata Intake'}
                          </span>
                        )}
                      </div>

                      {/* Red-Flag Description Banner */}
                      {isHighRedFlag && (
                        <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-xs sm:text-sm font-bold text-rose-200 leading-snug">
                          ⚠️ {alert.flag_description}
                        </div>
                      )}

                      {/* Chief Complaint Preview (Bigger Font) */}
                      <div className="flex items-baseline gap-2.5 pt-0.5">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0">
                          Chief Complaint:
                        </span>
                        <p className="text-sm sm:text-base font-bold text-slate-100 line-clamp-2 leading-relaxed">
                          {history.chief_complaint || 'Pending clinical history intake...'}
                        </p>
                      </div>

                      {/* Associated Symptoms Tags */}
                      {history.hpi_associated_symptoms && history.hpi_associated_symptoms.length > 0 && (
                        <div className="flex items-center gap-2 flex-wrap pt-1">
                          <span className="text-xs font-bold text-slate-400 uppercase">Symptoms:</span>
                          {history.hpi_associated_symptoms.slice(0, 3).map((symptom, sIdx) => (
                            <span
                              key={sIdx}
                              className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-200"
                            >
                              {symptom}
                            </span>
                          ))}
                          {history.hpi_associated_symptoms.length > 3 && (
                            <span className="text-xs text-slate-400 font-bold">
                              +{history.hpi_associated_symptoms.length - 3} more
                            </span>
                          )}
                        </div>
                      )}

                      {/* Vitals Ribbon */}
                      {patient.vitals_summary && (
                        <div className="flex items-center gap-2.5 pt-1 flex-wrap text-xs sm:text-sm font-mono font-bold">
                          <span className={`px-2.5 py-1 rounded-lg border ${
                            patient.vitals_summary.bp?.includes('168')
                              ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 font-black'
                              : 'bg-slate-950 text-slate-200 border border-slate-800'
                          }`}>
                            BP: {patient.vitals_summary.bp}
                          </span>
                          <span className="px-2.5 py-1 rounded-lg bg-slate-950 text-slate-200 border border-slate-800">
                            Pulse: {patient.vitals_summary.pulse}
                          </span>
                          <span className={`px-2.5 py-1 rounded-lg border ${
                            parseInt(patient.vitals_summary.spo2) < 94
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-black'
                              : 'bg-slate-950 text-slate-200 border border-slate-800'
                          }`}>
                            SpO2: {patient.vitals_summary.spo2}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Arrived Time & Open Action Button */}
                  <div className="flex lg:flex-col items-center lg:items-end justify-between border-t lg:border-t-0 border-slate-800 pt-4 lg:pt-0 gap-3 shrink-0">
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-300 font-medium">
                      <Clock className="w-4 h-4 text-cyan-400" />
                      <span>Arrived {patient.check_in_time}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-bold px-3 py-1 rounded-xl uppercase ${
                        patient.status === 'in_consultation'
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                          : patient.status === 'completed'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-slate-800 text-slate-200 border border-slate-700'
                      }`}>
                        {patient.status.replace('_', ' ')}
                      </span>

                      <button
                        type="button"
                        className="px-5 py-3 rounded-2xl bg-slate-800 group-hover:bg-gradient-to-r group-hover:from-teal-400 group-hover:to-cyan-400 group-hover:text-slate-950 text-slate-100 text-xs sm:text-sm font-black flex items-center gap-2 transition border border-slate-700 shadow-md min-h-[44px]"
                      >
                        <span>Open Case Sheet</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PatientListPage;
