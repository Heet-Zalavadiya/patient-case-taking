import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Flame,
  Clock,
  User,
  AlertTriangle,
  FileText,
  Sparkles,
  Stethoscope,
  Pill,
  Activity,
  CheckCircle2,
  XCircle,
  Edit3,
  HeartPulse,
  Printer,
  Check,
  RotateCcw,
  AlertCircle,
  Save,
  FileCheck2,
  ChevronDown,
  ChevronUp,
  LayoutGrid,
  ClipboardList,
  FlaskConical,
  ShieldAlert,
  Wifi,
  WifiOff
} from 'lucide-react';
import usePatientDetails from '../hooks/usePatientDetails';
import AyushAssessmentCard from './AyushAssessmentCard';

export const PatientDetailPage = ({
  patient,
  currentDoctor,
  onBack,
  onAlertAcknowledged,
  onSignOff
}) => {
  const {
    history,
    labValues,
    activeAlert,
    summary,
    isLoading,
    isLiveApi,
    isAlertAck,
    acknowledgeAlert: triggerAcknowledgeAlert,
    verifySummary: triggerVerifySummary,
    amendSummary: triggerAmendSummary,
    rejectSummary: triggerRejectSummary
  } = usePatientDetails(patient?.patient_id, patient?.session_id);

  // Active View Tab: 'overview' | 'history' | 'ayush' | 'labs_meds' | 'summary' | 'all'
  const [activeTab, setActiveTab] = useState('overview');

  // Accordion collapsed state map
  const [collapsedSections, setCollapsedSections] = useState({
    alerts: false,
    demographics: false,
    history: false,
    ayush: false,
    medications: false,
    labs: false,
    summary: false
  });

  // Review states
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [amendedNoteText, setAmendedNoteText] = useState('');
  const [doctorAmendmentComment, setDoctorAmendmentComment] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [printSuccess, setPrintSuccess] = useState(false);

  useEffect(() => {
    if (summary?.draft_text) {
      setAmendedNoteText(summary.draft_text);
    }
  }, [summary]);

  const toggleSection = (sectionKey) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  };

  const isNoteVerified =
    summary?.status?.toLowerCase() === 'accepted' || summary?.status?.toLowerCase() === 'amended';
  const isHighAlert = activeAlert && activeAlert.severity === 'HIGH';
  const abnormalLabsCount = labValues.filter((l) => l.is_abnormal === 1).length;
  const isAyushMode = currentDoctor?.is_ayush_practitioner || history?.history_mode === 'ayush';

  // Handlers
  const handleToggleAlertAcknowledgment = async () => {
    if (!activeAlert) return;
    const nextState = !isAlertAck;
    try {
      await triggerAcknowledgeAlert(activeAlert.alert_id, nextState);
      if (onAlertAcknowledged) {
        onAlertAcknowledged(activeAlert.alert_id, nextState);
      }
    } catch (e) {
      console.error('Failed to acknowledge alert:', e);
    }
  };

  const handleVerifyNote = async () => {
    try {
      await triggerVerifySummary(doctorAmendmentComment);
      if (onSignOff) {
        onSignOff();
      }
    } catch (e) {
      console.error('Failed to verify summary:', e);
    }
  };

  const handleSaveAmendment = async () => {
    try {
      await triggerAmendSummary(amendedNoteText, doctorAmendmentComment);
      setIsEditingNote(false);
    } catch (e) {
      console.error('Failed to amend summary:', e);
    }
  };

  const handleConfirmReject = async () => {
    try {
      await triggerRejectSummary(rejectReason || 'Clinical disparity');
      setShowRejectModal(false);
      setIsEditingNote(false);
    } catch (e) {
      console.error('Failed to reject summary:', e);
    }
  };

  const handlePrintSlip = () => {
    setPrintSuccess(true);
    setTimeout(() => setPrintSuccess(false), 3000);
    window.print();
  };

  if (!patient) {
    return (
      <div className="bg-slate-900/90 backdrop-blur-xl rounded-3xl p-12 text-center border border-slate-800 shadow-xl">
        <p className="text-slate-300 font-bold text-lg">No patient selected.</p>
        <button
          onClick={onBack}
          className="mt-5 px-6 py-3 bg-gradient-to-r from-teal-400 to-cyan-500 text-slate-950 rounded-2xl text-sm font-black shadow-lg cursor-pointer"
        >
          Return to Queue
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 pb-24">
      {/* ============================================================ */}
      {/* 🔹 TOP BAR: PATIENT CORE INFORMATION (BIG & PROPER STRUCTURE) */}
      {/* ============================================================ */}
      <div className="bg-slate-900/95 backdrop-blur-xl rounded-3xl p-6 sm:p-7 border border-slate-800 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-3 rounded-2xl text-sm font-bold bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-750 transition cursor-pointer shadow-md shrink-0"
          >
            <ArrowLeft className="w-5 h-5 text-cyan-400" />
            <span>Back to Queue</span>
          </button>
          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight">
                {patient.full_name}
              </h1>
              <span className="text-sm font-mono px-3 py-1 rounded-xl bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40">
                Token #{patient.token || patient.queue_number}
              </span>
              <span className="text-sm font-bold text-slate-300">
                {patient.age} Yrs • {patient.gender} • MRN: <span className="font-mono text-slate-100 font-black">{patient.mrn}</span>
              </span>
            </div>
            <p className="text-sm text-slate-400 font-medium truncate">
              OPD Category: <strong className="text-cyan-400 text-base">{patient.triage_category || 'Routine OPD'}</strong> • Arrived at: <span className="text-slate-200 font-mono font-bold">{patient.check_in_time}</span>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          <button
            onClick={handlePrintSlip}
            className="px-4 py-3 rounded-2xl text-sm font-bold bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-750 transition cursor-pointer flex items-center justify-center gap-2 shadow-sm min-h-[46px]"
          >
            <Printer className="w-4 h-4 text-cyan-400" />
            <span>{printSuccess ? 'Printing...' : 'Print Case Slip'}</span>
          </button>

          {isNoteVerified ? (
            <span className="px-5 py-3 rounded-2xl text-sm font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-2 shadow-md min-h-[46px]">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>Verified & Digitally Signed</span>
            </span>
          ) : (
            <button
              onClick={handleVerifyNote}
              className="px-6 py-3 rounded-2xl text-sm font-black bg-gradient-to-r from-teal-400 to-cyan-500 hover:from-teal-300 hover:to-cyan-400 text-slate-950 transition cursor-pointer flex items-center justify-center gap-2 shadow-xl shadow-cyan-500/25 min-h-[46px]"
            >
              <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
              <span>Sign-Off Consultation</span>
            </button>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* 🚀 TAB NAVIGATION BAR (PROPER STRUCTURE & BIG FONT TABS)    */}
      {/* ============================================================ */}
      <div className="bg-slate-900/90 backdrop-blur-xl p-2.5 rounded-3xl border border-slate-800 shadow-lg">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
          {[
            { id: 'overview', label: '1-Glance Executive Brief', icon: LayoutGrid, count: isHighAlert ? 'RED FLAG' : null, color: isHighAlert ? 'text-rose-400' : 'text-cyan-400' },
            { id: 'history', label: 'Clinical History & ROS', icon: Activity, count: (history?.hpi_associated_symptoms || []).length },
            ...(isAyushMode ? [{ id: 'ayush', label: 'AYUSH Dashavidha Pariksha', icon: Sparkles, badge: 'AYUSH' }] : []),
            { id: 'labs_meds', label: 'Prescriptions & Lab Values', icon: FlaskConical, count: abnormalLabsCount > 0 ? `${abnormalLabsCount} Abnormal` : null, color: 'text-amber-400' },
            { id: 'summary', label: 'AI Summary & Sign-off', icon: FileCheck2, count: summary?.status?.toUpperCase() },
            { id: 'all', label: 'View All Sections', icon: ClipboardList }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4.5 py-3 rounded-2xl text-sm font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2.5 ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500/25 to-teal-500/25 text-cyan-200 border-2 border-cyan-400 shadow-xl shadow-cyan-950/40 text-base font-black'
                    : 'text-slate-300 hover:text-white bg-slate-950/60 hover:bg-slate-950 border border-slate-800'
                }`}
              >
                <Icon className={`w-4 h-4 ${tab.color || (isActive ? 'text-cyan-400' : 'text-slate-400')}`} />
                <span>{tab.label}</span>
                {tab.count && (
                  <span className={`text-xs font-mono font-black px-2 py-0.5 rounded-lg ${
                    String(tab.count).includes('RED') || String(tab.count).includes('Abnormal')
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'bg-slate-800 text-slate-200'
                  }`}>
                    {tab.count}
                  </span>
                )}
                {tab.badge && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ============================================================ */}
      {/* ⚡ 1-GLANCE EXECUTIVE CLINICAL OVERVIEW (CLEAR & BIG TEXT)   */}
      {/* ============================================================ */}
      {(activeTab === 'overview' || activeTab === 'all') && (
        <div className="bg-slate-900/95 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <LayoutGrid className="w-6 h-6 text-cyan-400" />
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                Executive At-a-Glance Summary
              </h2>
            </div>
            <span className="text-xs font-mono font-bold text-cyan-300 bg-cyan-500/15 px-3 py-1 rounded-full border border-cyan-500/30">
              ⚡ 30-Second Doctor Brief
            </span>
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {/* 1. Triage Status */}
            <div className={`p-5 rounded-3xl border transition-all ${
              isHighAlert
                ? 'bg-rose-950/50 border-rose-500/60 text-rose-200 animate-alert-pulse shadow-lg shadow-rose-950/30'
                : 'bg-slate-950 border-slate-800 text-slate-200'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs uppercase font-bold tracking-wider text-slate-400">Emergency Triage</span>
                {isHighAlert ? <Flame className="w-5 h-5 text-rose-400" /> : <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
              </div>
              <p className="text-base font-black truncate">
                {isHighAlert ? 'CRITICAL RED FLAG' : 'Standard Priority'}
              </p>
              <p className="text-xs font-medium text-slate-300 mt-1 truncate">
                {activeAlert ? activeAlert.flag_description.split(':')[0] : 'Vitals Normal'}
              </p>
            </div>

            {/* 2. Chief Complaint Preview */}
            <div className="p-5 rounded-3xl bg-slate-950 border border-slate-800 text-slate-200 space-y-1">
              <span className="text-xs uppercase font-bold tracking-wider text-slate-400 block mb-1">Chief Complaint</span>
              <p className="text-sm sm:text-base font-bold text-cyan-300 line-clamp-2 leading-relaxed">
                "{history?.chief_complaint || 'Loading chief complaint...'}"
              </p>
            </div>

            {/* 3. Lab Investigations Status */}
            <div className={`p-5 rounded-3xl border ${
              abnormalLabsCount > 0
                ? 'bg-rose-950/40 border-rose-500/50 text-rose-200'
                : 'bg-slate-950 border-slate-800 text-slate-200'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs uppercase font-bold tracking-wider text-slate-400">Lab Results</span>
                <FlaskConical className={`w-5 h-5 ${abnormalLabsCount > 0 ? 'text-rose-400' : 'text-emerald-400'}`} />
              </div>
              <p className="text-base font-black">
                {abnormalLabsCount > 0 ? `${abnormalLabsCount} Abnormal Value(s)` : `${labValues.length} Normal Tests`}
              </p>
              <p className="text-xs font-medium text-slate-300 mt-1 truncate">
                {abnormalLabsCount > 0 ? 'Requires immediate action' : 'No abnormal flags'}
              </p>
            </div>

            {/* 4. AI Summary Status */}
            <div className="p-5 rounded-3xl bg-slate-950 border border-slate-800 text-slate-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs uppercase font-bold tracking-wider text-slate-400">Case Summary</span>
                <FileCheck2 className="w-5 h-5 text-cyan-400" />
              </div>
              <p className="text-base font-black uppercase text-teal-300">
                {summary?.status || 'Draft'}
              </p>
              <p className="text-xs font-medium text-slate-300 mt-1 truncate">
                {summary?.last_modified_by || 'AI Synthesizer'}
              </p>
            </div>
          </div>

          {/* Prominent Vitals Ribbon (Bigger Font) */}
          {patient.vitals_summary && (
            <div className="p-4 rounded-3xl bg-slate-950 border border-slate-800 space-y-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Patient Vitals Quick Bar:</span>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 text-sm font-mono font-bold">
                <div className={`p-3 rounded-2xl border text-center ${patient.vitals_summary.bp?.includes('168') ? 'bg-rose-950/60 border-rose-500/60 text-rose-200' : 'bg-slate-900 border-slate-800 text-slate-100'}`}>
                  <span className="text-[11px] uppercase text-slate-400 block font-sans">BP</span>
                  <span className="text-base font-black text-white">{patient.vitals_summary.bp}</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-center text-slate-100">
                  <span className="text-[11px] uppercase text-slate-400 block font-sans">Pulse</span>
                  <span className="text-base font-black text-white">{patient.vitals_summary.pulse}</span>
                </div>
                <div className={`p-3 rounded-2xl border text-center ${parseInt(patient.vitals_summary.spo2) < 94 ? 'bg-amber-950/60 border-amber-500/60 text-amber-200' : 'bg-slate-900 border-slate-800 text-slate-100'}`}>
                  <span className="text-[11px] uppercase text-slate-400 block font-sans">SpO2</span>
                  <span className="text-base font-black text-white">{patient.vitals_summary.spo2}</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-center text-slate-100">
                  <span className="text-[11px] uppercase text-slate-400 block font-sans">Temp</span>
                  <span className="text-base font-black text-white">{patient.vitals_summary.temp}</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-center text-slate-100 col-span-2 sm:col-span-1">
                  <span className="text-[11px] uppercase text-slate-400 block font-sans">Respiration</span>
                  <span className="text-base font-black text-white">{patient.vitals_summary.rr || '18/min'}</span>
                </div>
              </div>
            </div>
          )}

          {/* AI Intake Draft Brief Box */}
          <div className="p-5 rounded-3xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" /> AI Synthesized Intake Brief:
              </span>
              <button
                onClick={() => setActiveTab('summary')}
                className="text-xs font-bold text-cyan-400 hover:text-cyan-300 cursor-pointer underline"
              >
                Review Full Draft & Sign →
              </button>
            </div>
            <p className="text-sm font-mono text-slate-200 leading-relaxed bg-slate-900 p-4 rounded-2xl border border-slate-800/80">
              {summary?.draft_text || 'Synthesizing clinical consultation brief...'}
            </p>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* SECTION 0: ALERTS & TRIAGE PANEL                             */}
      {/* ============================================================ */}
      {(activeTab === 'overview' || activeTab === 'all') && activeAlert && (
        <div className={`rounded-3xl p-6 sm:p-7 border transition-all ${
          isHighAlert
            ? 'bg-rose-950/40 border-rose-500/60 shadow-2xl shadow-rose-950/30'
            : 'bg-amber-950/40 border-amber-500/60 shadow-2xl shadow-amber-950/30'
        }`}>
          <div className="flex flex-col md:flex-row items-start justify-between gap-4">
            <div className="flex items-start gap-4 min-w-0">
              <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shrink-0 ${
                isHighAlert
                  ? 'bg-rose-600 text-white shadow-lg animate-alert-pulse'
                  : 'bg-amber-600 text-white shadow-lg'
              }`}>
                {isHighAlert ? <Flame className="w-7 h-7 animate-pulse" /> : <AlertTriangle className="w-7 h-7" />}
              </div>

              <div className="space-y-2 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs font-black uppercase tracking-wider px-3 py-1 rounded-lg ${
                    isHighAlert ? 'bg-rose-700 text-white' : 'bg-amber-700 text-white'
                  }`}>
                    {activeAlert.severity} PRIORITY RED-FLAG
                  </span>
                  <span className="text-xs text-slate-300 font-mono font-bold">
                    Detected: {activeAlert.timestamp}
                  </span>
                  {isAlertAck ? (
                    <span className="text-xs px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Acknowledged by Physician
                    </span>
                  ) : (
                    <span className="text-xs px-3 py-1 rounded-lg bg-rose-500/25 text-rose-300 font-black border border-rose-500/50 animate-pulse">
                      Urgent Doctor Action Required
                    </span>
                  )}
                </div>

                <p className="text-base sm:text-lg font-bold text-rose-100 leading-relaxed">
                  {activeAlert.flag_description}
                </p>

                {activeAlert.vital_triggers && activeAlert.vital_triggers.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap pt-1">
                    <span className="text-xs font-bold text-slate-300 uppercase">Trigger Values:</span>
                    {activeAlert.vital_triggers.map((trig, idx) => (
                      <span
                        key={idx}
                        className="text-xs font-mono font-bold px-3 py-1 rounded-lg bg-slate-950 border border-rose-500/40 text-rose-300"
                      >
                        {trig}
                      </span>
                    ))}
                  </div>
                )}

                {activeAlert.action_protocol && (
                  <p className="text-xs sm:text-sm font-semibold text-rose-200 pt-1">
                    Recommended Protocol: <span className="text-white font-normal">{activeAlert.action_protocol}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Acknowledge Alert Toggle Button */}
            <div className="w-full md:w-auto shrink-0 pt-2 md:pt-0">
              <button
                onClick={handleToggleAlertAcknowledgment}
                className={`w-full md:w-auto px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-md min-h-[46px] ${
                  isAlertAck
                    ? 'bg-slate-800 text-emerald-300 border border-emerald-500/40 hover:bg-slate-750'
                    : 'bg-rose-600 hover:bg-rose-700 text-white font-black'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isAlertAck ? 'Alert Acknowledged' : 'Acknowledge Alert'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* SECTION 1: HISTORY & ROS PANEL (BIG TEXT & HIGH CONTRAST)    */}
      {/* ============================================================ */}
      {(activeTab === 'history' || activeTab === 'all') && (
        <div className="bg-slate-900/95 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl space-y-6">
          <div
            onClick={() => toggleSection('history')}
            className="flex items-center justify-between pb-4 border-b border-slate-800 cursor-pointer select-none"
          >
            <div className="flex items-center gap-3">
              <Activity className="w-6 h-6 text-cyan-400 shrink-0" />
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                1. Clinical History & Review of Systems (ROS)
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                SOCRATES HPI
              </span>
              {collapsedSections.history ? <ChevronDown className="w-5 h-5 text-slate-400" /> : <ChevronUp className="w-5 h-5 text-slate-400" />}
            </div>
          </div>

          {!collapsedSections.history && (
            <div className="space-y-5">
              {/* Chief Complaint */}
              <div className="p-5 rounded-3xl bg-slate-950 border border-slate-800">
                <span className="text-xs font-bold uppercase text-cyan-400 tracking-wider block mb-1">
                  Chief Complaint:
                </span>
                <p className="text-base sm:text-lg font-bold text-white leading-relaxed">
                  "{history?.chief_complaint || 'Loading clinical history...'}"
                </p>
              </div>

              {/* Associated Symptoms */}
              {history?.hpi_associated_symptoms && history.hpi_associated_symptoms.length > 0 && (
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                    Associated Symptoms:
                  </span>
                  <div className="flex flex-wrap gap-2.5">
                    {history.hpi_associated_symptoms.map((symptom, idx) => (
                      <span
                        key={idx}
                        className="text-xs sm:text-sm font-bold px-3.5 py-2 rounded-2xl bg-slate-950 border border-slate-800 text-slate-200 shadow-inner"
                      >
                        • {symptom}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Extended HPI & Past History */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
                <div className="p-5 rounded-3xl bg-slate-950 border border-slate-800 space-y-2 text-xs sm:text-sm">
                  <span className="font-bold text-cyan-400 uppercase tracking-wider text-xs block mb-1">
                    SOCRATES HPI Progression:
                  </span>
                  <p className="text-slate-300">
                    <strong className="text-white">Onset:</strong> {history?.hpi_onset || 'N/A'}
                  </p>
                  <p className="text-slate-300">
                    <strong className="text-white">Progression:</strong> {history?.hpi_progression || 'N/A'}
                  </p>
                </div>

                <div className="p-5 rounded-3xl bg-slate-950 border border-slate-800 space-y-2 text-xs sm:text-sm">
                  <span className="font-bold text-cyan-400 uppercase tracking-wider text-xs block mb-1">
                    Past History & Drug Allergies:
                  </span>
                  {history?.past_medical_history && (
                    <ul className="list-disc list-inside text-slate-200 space-y-1">
                      {history.past_medical_history.map((pmh, i) => (
                        <li key={i}>{pmh}</li>
                      ))}
                    </ul>
                  )}
                  {history?.allergies && history.allergies.length > 0 && (
                    <div className="pt-2 flex flex-wrap gap-2">
                      {history.allergies.map((al, aIdx) => (
                        <span key={aIdx} className="px-3 py-1.5 rounded-xl bg-rose-950/70 text-rose-200 border border-rose-500/50 font-bold text-xs">
                          ⚠️ {al.allergen} ({al.reaction})
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* ROS Table */}
              {history?.review_of_systems && Object.keys(history.review_of_systems).length > 0 && (
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                    Review of Systems (ROS):
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {Object.entries(history.review_of_systems).map(([system, details], idx) => (
                      <div key={idx} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs sm:text-sm">
                        <span className="font-bold text-cyan-400 block mb-1">{system}</span>
                        <p className="text-slate-300">{details}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* SECTION 2: AYUSH ASSESSMENT CARD                             */}
      {/* ============================================================ */}
      {(activeTab === 'ayush' || activeTab === 'all') && isAyushMode && (
        <div className="bg-slate-900/95 rounded-3xl p-6 sm:p-8 border border-emerald-500/40 shadow-2xl space-y-6">
          <div
            onClick={() => toggleSection('ayush')}
            className="flex items-center justify-between pb-4 border-b border-slate-800 cursor-pointer select-none"
          >
            <div className="flex items-center gap-3">
              <Sparkles className="w-6 h-6 text-emerald-400 shrink-0" />
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                2. Standardized AYUSH Dashavidha Pariksha & Assessment
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                NAMASTE & ICD-11 AYUSH
              </span>
              {collapsedSections.ayush ? <ChevronDown className="w-5 h-5 text-slate-400" /> : <ChevronUp className="w-5 h-5 text-slate-400" />}
            </div>
          </div>

          {!collapsedSections.ayush && (
            <AyushAssessmentCard ayushData={history?.ayush_assessment || {}} />
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* SECTION 3 & 4: MEDICATIONS & LAB INVESTIGATIONS              */}
      {/* ============================================================ */}
      {(activeTab === 'labs_meds' || activeTab === 'all') && (
        <div className="space-y-6">
          {/* Medications Table */}
          <div className="bg-slate-900/95 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl space-y-5">
            <div
              onClick={() => toggleSection('medications')}
              className="flex items-center justify-between pb-4 border-b border-slate-800 cursor-pointer select-none"
            >
              <div className="flex items-center gap-3">
                <Pill className="w-6 h-6 text-cyan-400 shrink-0" />
                <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                  3. Extracted Prescriptions & Active Medications
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-slate-950 text-cyan-300 border border-slate-800">
                  {(history?.current_medications || []).length} Meds
                </span>
                {collapsedSections.medications ? <ChevronDown className="w-5 h-5 text-slate-400" /> : <ChevronUp className="w-5 h-5 text-slate-400" />}
              </div>
            </div>

            {!collapsedSections.medications && (
              <div className="overflow-x-auto rounded-2xl border border-slate-800">
                <table className="w-full text-left text-sm min-w-[540px]">
                  <thead className="bg-slate-950 border-b border-slate-800 text-slate-300 font-bold uppercase text-xs tracking-wider">
                    <tr>
                      <th className="py-3.5 px-5">Medicine Name</th>
                      <th className="py-3.5 px-5">Dosage / Strength</th>
                      <th className="py-3.5 px-5">Frequency / Schedule</th>
                      <th className="py-3.5 px-5 text-right">Adherence / Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 text-sm">
                    {((history?.current_medications || []).length === 0) ? (
                      <tr>
                        <td colSpan="4" className="py-6 text-center text-slate-400 font-medium">
                          No active medications recorded for this patient session.
                        </td>
                      </tr>
                    ) : (
                      (history?.current_medications || []).map((med, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-4 px-5 font-bold text-white flex items-center gap-2.5">
                            <Pill className="w-4 h-4 text-teal-400 shrink-0" />
                            <span className="text-base">{med.medicine_name || med.name}</span>
                          </td>
                          <td className="py-4 px-5 font-mono font-bold text-cyan-300 text-sm">
                            {med.dosage || med.dose || 'As directed'}
                          </td>
                          <td className="py-4 px-5 font-medium text-slate-200">
                            {med.frequency || med.schedule || 'Daily'}
                          </td>
                          <td className="py-4 px-5 text-right">
                            <span className="inline-block px-3 py-1 rounded-xl text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                              {med.adherence || med.prescribed_date || 'Active Prescription'}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Lab Investigations Table */}
          <div className="bg-slate-900/95 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl space-y-5">
            <div
              onClick={() => toggleSection('labs')}
              className="flex items-center justify-between pb-4 border-b border-slate-800 cursor-pointer select-none"
            >
              <div className="flex items-center gap-3">
                <FileCheck2 className="w-6 h-6 text-cyan-400 shrink-0" />
                <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                  4. Extracted Lab Investigations & Diagnostic Reports
                </h2>
              </div>
              <div className="flex items-center gap-2">
                {abnormalLabsCount > 0 && (
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40">
                    ⚠️ {abnormalLabsCount} ABNORMAL
                  </span>
                )}
                {collapsedSections.labs ? <ChevronDown className="w-5 h-5 text-slate-400" /> : <ChevronUp className="w-5 h-5 text-slate-400" />}
              </div>
            </div>

            {!collapsedSections.labs && (
              <div className="overflow-x-auto rounded-2xl border border-slate-800">
                <table className="w-full text-left text-sm min-w-[600px]">
                  <thead className="bg-slate-950 border-b border-slate-800 text-slate-300 font-bold uppercase text-xs tracking-wider">
                    <tr>
                      <th className="py-3.5 px-5">Test Name</th>
                      <th className="py-3.5 px-5">Measured Value</th>
                      <th className="py-3.5 px-5">Unit</th>
                      <th className="py-3.5 px-5">Reference Range</th>
                      <th className="py-3.5 px-5 text-center">Diagnostic Flag</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 text-sm">
                    {labValues.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="py-6 text-center text-slate-400 font-medium">
                          No lab investigations recorded for this session.
                        </td>
                      </tr>
                    ) : (
                      labValues.map((row) => {
                        const isAbnormal = row.is_abnormal === 1;

                        return (
                          <tr
                            key={row.lab_id}
                            className={`transition-colors ${
                              isAbnormal
                                ? 'bg-rose-500/15 border-l-4 border-l-rose-500 hover:bg-rose-500/25'
                                : 'hover:bg-slate-800/40'
                            }`}
                          >
                            <td className="py-4 px-5 font-bold text-white flex items-center gap-2.5">
                              {isAbnormal && <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />}
                              <span className="text-base">{row.test_name}</span>
                            </td>
                            <td className="py-4 px-5 font-mono font-black text-base">
                              <span className={isAbnormal ? 'text-rose-400' : 'text-slate-100'}>
                                {row.value}
                              </span>
                            </td>
                            <td className="py-4 px-5 font-mono text-slate-300">{row.unit}</td>
                            <td className="py-4 px-5 font-mono text-slate-400">{row.reference_range}</td>
                            <td className="py-4 px-5 text-center">
                              {isAbnormal ? (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black bg-rose-600 text-white shadow-md uppercase tracking-wide">
                                  <span>⚠️</span> {row.flag || 'ABNORMAL'}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                                  <span>✓</span> {row.flag || 'NORMAL'}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* SECTION 5: AI SUMMARY REVIEW & SIGN-OFF (BIGGER & PROPER)    */}
      {/* ============================================================ */}
      {(activeTab === 'summary' || activeTab === 'all') && (
        <div className="bg-slate-900/95 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-800 gap-2">
            <div className="flex items-center gap-3">
              <Sparkles className="w-6 h-6 text-cyan-400 shrink-0" />
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                5. Consultation Summary & Physician Review
              </h2>
            </div>
            <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
              AI Clinical Intake Synthesis
            </span>
          </div>

          {/* Draft Preview or Amendment Form */}
          {isEditingNote ? (
            <div className="space-y-4 p-6 rounded-3xl bg-slate-950 border-2 border-cyan-500/60 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                  <Edit3 className="w-5 h-5" /> Editing Consultation Summary
                </span>
                <span className="text-xs text-slate-300 font-medium">Physician Amendment Mode</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1.5 uppercase">
                  Doctor Consultation Notes:
                </label>
                <input
                  type="text"
                  value={doctorAmendmentComment}
                  onChange={(e) => setDoctorAmendmentComment(e.target.value)}
                  placeholder="e.g. Advised emergency cardiologist consult, administered loading dose..."
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-2xl text-sm font-medium text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1.5 uppercase">
                  Amended Consultation Summary:
                </label>
                <textarea
                  rows={8}
                  value={amendedNoteText}
                  onChange={(e) => setAmendedNoteText(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-2xl text-sm font-mono text-white focus:outline-none focus:border-cyan-400 resize-y leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setIsEditingNote(false)}
                  className="px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveAmendment}
                  className="flex items-center gap-2 px-6 py-3 rounded-2xl text-xs sm:text-sm font-black bg-gradient-to-r from-teal-400 to-cyan-500 text-slate-950 hover:from-teal-300 hover:to-cyan-400 cursor-pointer shadow-lg"
                >
                  <Save className="w-4 h-4" /> Save Amendments
                </button>
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-3xl bg-slate-950/90 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">
                  Synthesized Clinical Record:
                </span>
                <span className="text-xs font-mono text-slate-300">
                  Status: <strong className="uppercase text-cyan-400 text-sm">{summary?.status || 'Draft'}</strong>
                </span>
              </div>

              <div className="text-sm font-mono text-slate-100 whitespace-pre-line leading-relaxed bg-slate-900 p-5 rounded-2xl border border-slate-800/80 shadow-inner">
                {summary?.draft_text || 'Synthesizing consultation summary...'}
              </div>

              {summary?.physician_notes && (
                <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-sm font-medium text-amber-200">
                  <strong>Physician Note:</strong> {summary.physician_notes}
                </div>
              )}
            </div>
          )}

          {/* Reject Reason Modal */}
          {showRejectModal && (
            <div className="p-5 rounded-3xl bg-rose-500/15 border border-rose-500/40 space-y-4">
              <div className="flex items-center gap-2 text-rose-300 font-bold text-sm">
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" /> Discard / Reject Draft
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  'Clinical history discrepancy',
                  'Medication list mismatch',
                  'Lab values need re-verification',
                  'Routine follow-up case'
                ].map((reason) => (
                  <button
                    key={reason}
                    onClick={() => setRejectReason(reason)}
                    className={`text-xs px-3.5 py-2 rounded-xl border cursor-pointer transition font-bold ${
                      rejectReason === reason
                        ? 'bg-rose-600 text-white border-rose-600'
                        : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-rose-400'
                    }`}
                  >
                    {reason}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Or write custom reason..."
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-2xl text-xs sm:text-sm text-white focus:outline-none focus:border-rose-400"
              />
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmReject}
                  className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-rose-600 text-white shadow-md"
                >
                  Confirm Rejection
                </button>
              </div>
            </div>
          )}

          {/* Review Action Toolbar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
            <div className="text-xs sm:text-sm text-slate-400 font-medium">
              Last Modified: <span className="font-mono text-slate-200 font-bold">{summary?.last_modified_by || 'AI Synthesizer'}</span>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={() => setIsEditingNote(true)}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-750 transition cursor-pointer shadow-md min-h-[46px]"
              >
                <Edit3 className="w-4 h-4 text-cyan-400" />
                <span>Amend / Edit</span>
              </button>

              <button
                onClick={() => setShowRejectModal(true)}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4.5 py-3 rounded-2xl text-xs sm:text-sm font-bold bg-slate-800 text-slate-400 hover:text-rose-300 border border-slate-700 hover:border-rose-800/60 transition cursor-pointer min-h-[46px]"
              >
                <XCircle className="w-4 h-4 text-rose-400" />
                <span>Reject Draft</span>
              </button>

              <button
                onClick={handleVerifyNote}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-2xl text-xs sm:text-sm font-black bg-gradient-to-r from-teal-400 to-cyan-500 text-slate-950 hover:from-teal-300 hover:to-cyan-400 transition cursor-pointer shadow-xl shadow-cyan-500/25 min-h-[46px]"
              >
                <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                <span>Accept & Sign Off</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientDetailPage;
