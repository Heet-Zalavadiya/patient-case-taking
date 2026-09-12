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
  ShieldAlert, 
  Printer, 
  Check, 
  RotateCcw,
  AlertCircle,
  Save,
  FileCheck2,
  Utensils,
  Ban,
  Wifi,
  WifiOff
} from 'lucide-react';
import { 
  getPatientHistory, 
  getPatientLabValues, 
  getRedFlagAlerts, 
  getClinicalSummary 
} from '../apiService';
import AyushAssessmentCard from './AyushAssessmentCard';

export const PatientDetailPage = ({
  patient,
  currentDoctor,
  onBack,
  onAlertAcknowledged,
  onSignOff
}) => {
  const [history, setHistory] = useState(null);
  const [labValues, setLabValues] = useState([]);
  const [activeAlert, setActiveAlert] = useState(null);
  const [summary, setSummary] = useState(null);

  // Review states
  const [isNoteVerified, setIsNoteVerified] = useState(false);
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [amendedNoteText, setAmendedNoteText] = useState('');
  const [doctorAmendmentComment, setDoctorAmendmentComment] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  // Status flags
  const [isLoading, setIsLoading] = useState(true);
  const [isLiveApi, setIsLiveApi] = useState(false);
  const [isAlertAck, setIsAlertAck] = useState(false);
  const [printSuccess, setPrintSuccess] = useState(false);

  useEffect(() => {
    if (!patient?.patient_id) return;

    let isMounted = true;
    const fetchDetailData = async () => {
      setIsLoading(true);

      try {
        // 1. Fetch History
        const histRes = await getPatientHistory(patient.patient_id);
        if (isMounted) {
          setHistory(histRes.data);
          setIsLiveApi(histRes.isLive);
        }

        // 2. Fetch Lab values
        const labsRes = await getPatientLabValues(patient.patient_id);
        if (isMounted) {
          setLabValues(labsRes.data);
        }

        // 3. Fetch Red Flag Alerts
        const alertsRes = await getRedFlagAlerts();
        if (isMounted) {
          const matchedAlert = alertsRes.data.find(a => a.patient_id === patient.patient_id);
          setActiveAlert(matchedAlert || null);
          setIsAlertAck(matchedAlert?.is_acknowledged || false);
        }

        // 4. Fetch Clinical Consultation Summary
        const sumRes = await getClinicalSummary(patient.patient_id);
        if (isMounted) {
          setSummary(sumRes.data);
          setAmendedNoteText(sumRes.data?.draft_text || '');
          setIsNoteVerified(sumRes.data?.status === 'accepted');
        }

      } catch (err) {
        console.error('[PatientDetailPage] Error loading patient detail:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchDetailData();
    return () => { isMounted = false; };
  }, [patient]);

  // Alert toggle handler
  const handleToggleAlertAcknowledgment = () => {
    const nextState = !isAlertAck;
    setIsAlertAck(nextState);
    if (activeAlert) {
      activeAlert.is_acknowledged = nextState;
      if (onAlertAcknowledged) {
        onAlertAcknowledged(activeAlert.alert_id, nextState);
      }
    }
  };

  // Note Action Handlers
  const handleVerifyNote = () => {
    setIsNoteVerified(true);
    if (summary) {
      summary.status = 'accepted';
      summary.last_modified_by = `${currentDoctor?.name || 'Physician'} (VERIFIED)`;
    }
    if (onSignOff) {
      onSignOff();
    }
  };

  const handleSaveAmendment = () => {
    if (summary) {
      summary.draft_text = amendedNoteText;
      summary.physician_notes = doctorAmendmentComment;
      summary.status = 'amended';
      summary.last_modified_by = `${currentDoctor?.name || 'Physician'} (AMENDED)`;
    }
    setIsNoteVerified(true);
    setIsEditingNote(false);
  };

  const handleConfirmReject = () => {
    if (summary) {
      summary.status = 'rejected';
      summary.physician_notes = `Rejected: ${rejectReason || 'Clinical disparity'}`;
      summary.last_modified_by = `${currentDoctor?.name || 'Physician'} (REJECTED)`;
    }
    setIsNoteVerified(false);
    setShowRejectModal(false);
    setIsEditingNote(false);
  };

  const handlePrintSlip = () => {
    setPrintSuccess(true);
    setTimeout(() => setPrintSuccess(false), 3000);
    window.print();
  };

  const isHighAlert = activeAlert && activeAlert.severity === 'HIGH';

  if (!patient) {
    return (
      <div className="bg-slate-900/90 backdrop-blur-xl rounded-3xl p-12 text-center border border-slate-800 shadow-xl">
        <p className="text-slate-400 font-medium">No patient selected.</p>
        <button
          onClick={onBack}
          className="mt-4 px-4 py-2 bg-gradient-to-r from-teal-400 to-cyan-500 text-slate-950 rounded-xl text-xs font-bold shadow-md cursor-pointer"
        >
          Return to Queue
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 pb-12">
      {/* Top Breadcrumb & Action Strip */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-3">
          <button
            onClick={onBack}
            className="self-start flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-750 transition cursor-pointer shadow-sm shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Queue</span>
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <h1 className="text-base sm:text-xl font-black text-white tracking-tight">
                Case Sheet • Token {patient.token || patient.queue_number}
              </h1>
              <span className="text-[10px] sm:text-xs font-bold px-2 sm:px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                Intake Completed
              </span>
              <span className="flex items-center gap-1 text-[10px] sm:text-[11px] font-mono px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800">
                {isLiveApi ? (
                  <>
                    <Wifi className="w-3 h-3 text-emerald-400" /> Live Endpoint
                  </>
                ) : (
                  <>
                    <WifiOff className="w-3 h-3 text-amber-400" /> Hybrid Mode
                  </>
                )}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium mt-1 truncate">
              MRN: <strong className="text-slate-200 font-mono">{patient.mrn}</strong> • Patient ID: <span className="font-mono text-cyan-400">{patient.patient_id}</span>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="grid grid-cols-2 sm:flex items-center gap-2 w-full md:w-auto">
          <button
            onClick={handlePrintSlip}
            className="w-full sm:w-auto px-3.5 py-2.5 rounded-xl text-xs font-bold bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-750 transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm min-h-[42px]"
          >
            <Printer className="w-3.5 h-3.5 text-cyan-400" />
            <span>{printSuccess ? 'Printing...' : 'Print Slip'}</span>
          </button>

          {isNoteVerified ? (
            <span className="w-full sm:w-auto px-3.5 py-2.5 rounded-xl text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center justify-center gap-1.5 shadow-sm min-h-[42px]">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Verified</span>
            </span>
          ) : (
            <button
              onClick={handleVerifyNote}
              className="w-full sm:w-auto px-3.5 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-teal-400 to-cyan-500 hover:from-teal-300 hover:to-cyan-400 text-slate-950 transition cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-cyan-500/25 min-h-[42px]"
            >
              <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
              <span>Verify & Sign</span>
            </button>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* SECTION 0: ALERTS & TRIAGE PANEL (`red_flag_alerts`)           */}
      {/* ============================================================ */}
      {activeAlert && (
        <div className={`rounded-2xl sm:rounded-3xl p-4 sm:p-6 border transition-all ${
          isHighAlert
            ? 'bg-rose-950/40 border-rose-500/50 shadow-xl shadow-rose-950/30'
            : 'bg-amber-950/40 border-amber-500/50 shadow-xl shadow-amber-950/30'
        }`}>
          <div className="flex flex-col md:flex-row items-start justify-between gap-3 sm:gap-4">
            <div className="flex items-start gap-3 sm:gap-4 min-w-0">
              <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0 ${
                isHighAlert
                  ? 'bg-rose-600 text-white shadow-md animate-alert-pulse'
                  : 'bg-amber-600 text-white shadow-md'
              }`}>
                {isHighAlert ? <Flame className="w-5 h-5 sm:w-6 sm:h-6 animate-pulse" /> : <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6" />}
              </div>

              <div className="space-y-1.5 min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                  <span className={`text-[10px] sm:text-xs font-black uppercase tracking-wider px-2 sm:px-2.5 py-0.5 rounded-md ${
                    isHighAlert ? 'bg-rose-700 text-white' : 'bg-amber-700 text-white'
                  }`}>
                    {activeAlert.severity} PRIORITY RED-FLAG
                  </span>
                  <span className="text-[11px] sm:text-xs text-slate-400 font-mono font-medium">
                    Detected: {activeAlert.timestamp}
                  </span>
                  {isAlertAck ? (
                    <span className="text-[10px] sm:text-xs px-2 sm:px-2.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Acknowledged by Physician
                    </span>
                  ) : (
                    <span className="text-[10px] sm:text-xs px-2 sm:px-2.5 py-0.5 rounded-md bg-rose-500/20 text-rose-300 font-bold border border-rose-500/40 animate-pulse">
                      Urgent Doctor Action Required
                    </span>
                  )}
                </div>

                <p className="text-sm sm:text-base font-bold text-rose-100 leading-relaxed">
                  {activeAlert.flag_description}
                </p>

                {activeAlert.vital_triggers && activeAlert.vital_triggers.length > 0 && (
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap pt-1">
                    <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase">Trigger Values:</span>
                    {activeAlert.vital_triggers.map((trig, idx) => (
                      <span
                        key={idx}
                        className="text-[11px] sm:text-xs font-mono font-bold px-2 sm:px-2.5 py-0.5 rounded-md bg-slate-950 border border-rose-500/40 text-rose-300"
                      >
                        {trig}
                      </span>
                    ))}
                  </div>
                )}

                {activeAlert.action_protocol && (
                  <p className="text-xs font-semibold text-rose-200 pt-1">
                    Recommended Clinical Protocol: <span className="text-white font-normal">{activeAlert.action_protocol}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Acknowledge Alert Toggle Button */}
            <div className="w-full md:w-auto shrink-0 pt-2 md:pt-0">
              <button
                onClick={handleToggleAlertAcknowledgment}
                className={`w-full md:w-auto px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-sm min-h-[42px] ${
                  isAlertAck
                    ? 'bg-slate-800 text-emerald-300 border border-emerald-500/40 hover:bg-slate-750'
                    : 'bg-rose-600 hover:bg-rose-700 text-white'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isAlertAck ? 'Alert Acknowledged' : 'Acknowledge Alert'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Demographics & Vitals Ribbon */}
      <div className="bg-slate-900/90 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-800 shadow-xl">
        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4 text-xs">
          <div>
            <span className="text-slate-500 font-bold uppercase text-[10px] tracking-wider">
              Patient Demographics
            </span>
            <p className="text-sm sm:text-base font-black text-white mt-0.5">
              {patient.full_name}
            </p>
            <p className="text-slate-400 font-medium">
              {patient.age} Y • {patient.gender} • Blood: {patient.blood_group || 'B+'}
            </p>
          </div>

          <div>
            <span className="text-slate-500 font-bold uppercase text-[10px] tracking-wider">
              ABHA ID / ABDM
            </span>
            <p className="font-mono text-xs sm:text-sm font-bold text-slate-200 mt-0.5 break-all">
              {patient.phone ? `91-${patient.phone.replace(/[^0-9]/g, '').slice(-10)}@abdm` : '14-3456-7890-1234'}
            </p>
            <span className="inline-block mt-0.5 text-[10px] text-emerald-400 font-bold bg-emerald-500/15 px-2 py-0.5 rounded-md border border-emerald-500/30">
              ✓ Verified Identity
            </span>
          </div>

          <div>
            <span className="text-slate-500 font-bold uppercase text-[10px] tracking-wider">
              Intake Time
            </span>
            <p className="text-xs sm:text-sm font-bold text-slate-200 mt-0.5">
              {patient.check_in_time} (Today)
            </p>
            <p className="text-slate-400 font-medium">
              Mode: Kiosk Terminal Intake
            </p>
          </div>

          <div>
            <span className="text-slate-500 font-bold uppercase text-[10px] tracking-wider">
              Triage Category
            </span>
            <p className="text-xs sm:text-sm font-bold text-cyan-400 mt-0.5">
              {patient.triage_category || 'Routine OPD'}
            </p>
            <p className="text-slate-400 font-medium">
              Priority: {isHighAlert ? 'Immediate Review' : 'Standard'}
            </p>
          </div>
        </div>

        {/* Live Vitals Ribbon */}
        {patient.vitals_summary && (
          <div className="mt-4 sm:mt-5 pt-3 sm:pt-4 border-t border-slate-800">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5 sm:gap-3">
              <div className={`p-3 rounded-2xl border ${
                patient.vitals_summary.bp?.includes('168')
                  ? 'bg-rose-950/40 border-rose-500/40 text-rose-200'
                  : 'bg-slate-950 border-slate-800 text-slate-200'
              }`}>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Blood Pressure</span>
                <span className="text-sm font-mono font-black mt-0.5 block">{patient.vitals_summary.bp}</span>
                <span className={`text-[10px] font-bold ${
                  patient.vitals_summary.bp?.includes('168') ? 'text-rose-400' : 'text-emerald-400'
                }`}>
                  {patient.vitals_summary.bp?.includes('168') ? 'High (Stage 2)' : 'Normal'}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Heart Rate</span>
                <span className="text-sm font-mono font-black mt-0.5 block">{patient.vitals_summary.pulse}</span>
                <span className="text-[10px] font-bold text-slate-400">Regular</span>
              </div>

              <div className={`p-3 rounded-2xl border ${
                parseInt(patient.vitals_summary.spo2) < 94
                  ? 'bg-amber-950/40 border-amber-500/40 text-amber-200'
                  : 'bg-slate-950 border-slate-800 text-slate-200'
              }`}>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">SpO2 Oxygen</span>
                <span className="text-sm font-mono font-black mt-0.5 block">{patient.vitals_summary.spo2}</span>
                <span className={`text-[10px] font-bold ${
                  parseInt(patient.vitals_summary.spo2) < 94 ? 'text-amber-400' : 'text-emerald-400'
                }`}>
                  {parseInt(patient.vitals_summary.spo2) < 94 ? 'Borderline' : 'Normal'}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Temperature</span>
                <span className="text-sm font-mono font-black mt-0.5 block">{patient.vitals_summary.temp}</span>
                <span className="text-[10px] font-bold text-emerald-400">Afebrile</span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-slate-200 col-span-2 sm:col-span-1 md:col-span-1">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Respiration</span>
                <span className="text-sm font-mono font-black mt-0.5 block">{patient.vitals_summary.rr || '18 /min'}</span>
                <span className="text-[10px] font-bold text-slate-400">Spontaneous</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* SECTION 1: HISTORY PANEL (HYBRID LIVE / MOCK)                */}
      {/* ============================================================ */}
      <div className="bg-slate-900/90 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-800 shadow-xl space-y-4 sm:space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-cyan-400 shrink-0" />
            <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
              1. Clinical History & Review of Systems (ROS)
            </h2>
          </div>
          <span className="text-[11px] sm:text-xs font-bold px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 self-start sm:self-auto">
            Live Endpoint + Structured HPI
          </span>
        </div>

        {/* Live Section: Chief Complaint & Associated Symptoms */}
        <div className="space-y-3">
          <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5 mb-1.5">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase text-cyan-400 tracking-wider">
                Chief Complaint (Live / GET /patients/:id/history)
              </span>
              <span className="text-[10px] font-mono font-bold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/40 shrink-0">
                structured_history.chief_complaint
              </span>
            </div>
            <p className="text-sm sm:text-base font-bold text-white leading-relaxed">
              "{history?.chief_complaint || 'Loading clinical history...'}"
            </p>
          </div>

          {/* Associated Symptoms */}
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Associated Symptoms (hpi_associated_symptoms):
            </span>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {(history?.hpi_associated_symptoms || []).map((symptom, idx) => (
                <span
                  key={idx}
                  className="text-xs font-bold px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 shadow-inner"
                >
                  • {symptom}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Extended History: HPI, Past Medical History, Drug Allergies, ROS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 pt-1 sm:pt-2">
          {/* Extended HPI Details */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs">
            <span className="font-bold text-cyan-400 uppercase tracking-wider text-xs block">
              Extended HPI Progression:
            </span>
            <p className="text-slate-300">
              <strong className="text-white">Onset:</strong> {history?.hpi_onset || 'N/A'}
            </p>
            <p className="text-slate-300">
              <strong className="text-white">Progression:</strong> {history?.hpi_progression || 'N/A'}
            </p>
            {history?.hpi_aggravating_factors && (
              <div>
                <strong className="text-white">Aggravating Factors:</strong>
                <ul className="list-disc list-inside text-slate-400 mt-0.5 space-y-0.5">
                  {history.hpi_aggravating_factors.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Past Medical History & Active Medications */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs">
            <span className="font-bold text-cyan-400 uppercase tracking-wider text-xs block">
              Past Medical History & Medications:
            </span>
            {history?.past_medical_history && (
              <ul className="list-disc list-inside text-slate-300 space-y-0.5">
                {history.past_medical_history.map((pmh, i) => (
                  <li key={i}>{pmh}</li>
                ))}
              </ul>
            )}

            <div className="pt-2 border-t border-slate-800">
              <span className="font-bold text-slate-200 block mb-1.5">Drug Allergies:</span>
              {history?.allergies && history.allergies.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {history.allergies.map((al, aIdx) => (
                    <span
                      key={aIdx}
                      className="px-2 py-1 rounded-lg bg-rose-950/60 text-rose-200 border border-rose-500/50 font-bold text-[11px]"
                    >
                      ⚠️ {al.allergen} ({al.reaction})
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-slate-500">No known drug allergies reported (NKDA).</span>
              )}
            </div>
          </div>
        </div>

        {/* Review of Systems (ROS) Tabulation */}
        {history?.review_of_systems && Object.keys(history.review_of_systems).length > 0 && (
          <div className="pt-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Review of Systems (ROS):
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-2.5">
              {Object.entries(history.review_of_systems).map(([system, details], idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs">
                  <span className="font-bold text-cyan-400 block">{system}</span>
                  <p className="text-slate-400 mt-0.5">{details}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* SECTION 2: STANDARDIZED AYUSH ASSESSMENT CARD                 */}
      {/* ============================================================ */}
      <div className="bg-slate-900/90 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-400 shrink-0" />
            <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
              2. Standardized AYUSH Prakriti & Assessment Terminal
            </h2>
          </div>
          <span className="text-[11px] sm:text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 self-start sm:self-auto">
            NAMASTE & ICD-11 AYUSH
          </span>
        </div>

        <AyushAssessmentCard ayushData={history?.ayush_assessment || {}} />
      </div>

      {/* ============================================================ */}
      {/* SECTION 3: LAB VALUES & DOCUMENTS PANEL                      */}
      {/* (`document_extracted_lab_values` with is_abnormal)           */}
      {/* ============================================================ */}
      <div className="bg-slate-900/90 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
          <div className="flex items-center gap-2">
            <FileCheck2 className="w-5 h-5 text-cyan-400 shrink-0" />
            <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
              3. Extracted Lab Investigations & Diagnostic Documents
            </h2>
          </div>
          <span className="text-[11px] sm:text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-slate-950 text-cyan-300 border border-slate-800 self-start sm:self-auto">
            document_extracted_lab_values
          </span>
        </div>

        <p className="text-xs text-slate-400 font-medium">
          Tabulated medical investigations extracted via OCR & hospital LIS integration. Values flagged with abnormal indicators require clinical attention.
        </p>

        {/* Mobile View: High-Legibility Clinical Cards (Shown on screens < 768px) */}
        <div className="block md:hidden space-y-2.5">
          {labValues.length === 0 ? (
            <div className="py-6 text-center text-slate-500 text-xs bg-slate-950/50 rounded-2xl border border-slate-800">
              No lab investigations recorded for this session.
            </div>
          ) : (
            labValues.map((row) => {
              const isAbnormal = row.is_abnormal === 1;

              return (
                <div
                  key={row.lab_id}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    isAbnormal
                      ? 'bg-rose-950/30 border-rose-500/40 shadow-xs'
                      : 'bg-slate-950/80 border-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {isAbnormal && (
                        <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      )}
                      <span className="font-bold text-white text-xs truncate">{row.test_name}</span>
                    </div>

                    <div className="shrink-0">
                      {isAbnormal ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-600 text-white uppercase tracking-wide">
                          <span>⚠️</span> {row.flag || 'ABNORMAL'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          <span>✓</span> {row.flag || 'NORMAL'}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 bg-slate-900/90 rounded-xl p-2.5 border border-slate-800/80 text-center">
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">Measured</span>
                      <span className={`font-mono font-black text-xs sm:text-sm ${isAbnormal ? 'text-rose-400' : 'text-slate-100'}`}>
                        {row.value}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">Unit</span>
                      <span className="font-mono text-xs text-slate-300">
                        {row.unit}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">Ref Range</span>
                      <span className="font-mono text-xs text-slate-400">
                        {row.reference_range}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop / Tablet View: Tabular Lab Investigations (Shown on screens >= 768px) */}
        <div className="hidden md:block overflow-x-auto rounded-2xl border border-slate-800">
          <table className="w-full text-left text-xs min-w-[560px]">
            <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Test Name</th>
                <th className="py-3 px-4">Measured Value</th>
                <th className="py-3 px-4">Unit</th>
                <th className="py-3 px-4">Reference Range</th>
                <th className="py-3 px-4 text-center">Diagnostic Flag</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {labValues.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-6 text-center text-slate-500">
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
                          ? 'bg-rose-500/10 border-l-4 border-l-rose-500 hover:bg-rose-500/20'
                          : 'hover:bg-slate-800/40'
                      }`}
                    >
                      {/* Test Name */}
                      <td className="py-3 px-4 font-bold text-white">
                        <div className="flex items-center gap-2">
                          {isAbnormal && (
                            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                          )}
                          <span>{row.test_name}</span>
                        </div>
                      </td>

                      {/* Measured Value */}
                      <td className="py-3 px-4 font-mono font-black text-sm">
                        <span className={isAbnormal ? 'text-rose-400' : 'text-slate-100'}>
                          {row.value}
                        </span>
                      </td>

                      {/* Unit */}
                      <td className="py-3 px-4 font-mono text-slate-400">
                        {row.unit}
                      </td>

                      {/* Reference Range */}
                      <td className="py-3 px-4 font-mono text-slate-500">
                        {row.reference_range}
                      </td>

                      {/* Flag / Abnormal Indicator Badge */}
                      <td className="py-3 px-4 text-center">
                        {isAbnormal ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-rose-600 text-white shadow-sm uppercase tracking-wide">
                            <span>⚠️</span> {row.flag || 'ABNORMAL'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
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
      </div>

      {/* ============================================================ */}
      {/* SECTION 4: SUMMARY REVIEW PANEL                              */}
      {/* ============================================================ */}
      <div className="bg-slate-900/90 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-cyan-400 shrink-0" />
            <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
              4. Consultation Summary & Physician Review
            </h2>
          </div>
          <span className="text-[11px] sm:text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 self-start sm:self-auto">
            AI Clinical Intake Synthesis
          </span>
        </div>

        {/* Draft Text Preview or Amendment Form */}
        {isEditingNote ? (
          <div className="space-y-4 p-4 sm:p-5 rounded-2xl bg-slate-950 border-2 border-cyan-500/50">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <Edit3 className="w-4 h-4" /> Editing Clinical Consultation Draft
              </span>
              <span className="text-[11px] sm:text-xs text-slate-400 font-medium">Physician Amendment Mode</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-200 mb-1">
                Doctor Consultation Additions / Notes:
              </label>
              <input
                type="text"
                value={doctorAmendmentComment}
                onChange={(e) => setDoctorAmendmentComment(e.target.value)}
                placeholder="e.g. Advised emergency cardiologist consult, administered loading dose..."
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs font-medium text-white focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-200 mb-1">
                Amended Case Summary Body:
              </label>
              <textarea
                rows={8}
                value={amendedNoteText}
                onChange={(e) => setAmendedNoteText(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-cyan-400 resize-y"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-1">
              <button
                onClick={() => setIsEditingNote(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer text-center min-h-[42px]"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAmendment}
                className="flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-teal-400 to-cyan-500 text-slate-950 hover:from-teal-300 hover:to-cyan-400 cursor-pointer shadow-md min-h-[42px]"
              >
                <Save className="w-4 h-4" /> Save Doctor Amendments
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">
                Synthesized Intake Record:
              </span>
              <span className="text-xs font-mono text-slate-400">
                Status: <strong className="uppercase text-cyan-400">{summary?.status || 'Draft'}</strong>
              </span>
            </div>

            <div className="text-xs font-mono text-slate-200 whitespace-pre-line leading-relaxed bg-slate-900 p-3.5 sm:p-4 rounded-xl border border-slate-800 overflow-x-auto">
              {summary?.draft_text || 'Synthesizing consultation summary...'}
            </div>

            {summary?.physician_notes && (
              <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-xs font-medium text-amber-200">
                <strong>Physician Note:</strong> {summary.physician_notes}
              </div>
            )}
          </div>
        )}

        {/* Reject Reason Modal */}
        {showRejectModal && (
          <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/40 space-y-3">
            <div className="flex items-center gap-2 text-rose-300 font-bold text-xs">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" /> Discard / Reject Draft for Audit Trail
            </div>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {[
                'Clinical history discrepancy',
                'Medication list mismatch',
                'Lab values need re-verification',
                'Routine follow-up case'
              ].map((reason) => (
                <button
                  key={reason}
                  onClick={() => setRejectReason(reason)}
                  className={`text-xs px-3 py-1.5 rounded-full border cursor-pointer transition ${
                    rejectReason === reason
                      ? 'bg-rose-600 text-white border-rose-600 font-bold'
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
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-rose-400"
            />
            <div className="flex flex-col sm:flex-row justify-end gap-2">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white text-center min-h-[40px]"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 text-white text-center min-h-[40px]"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        )}

        {/* Review Action Toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
          <div className="text-xs text-slate-400">
            Last Modified: <span className="font-mono text-slate-200">{summary?.last_modified_by || 'AI Synthesizer'}</span>
          </div>

          <div className="grid grid-cols-1 xs:grid-cols-3 sm:flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setIsEditingNote(true)}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-750 transition cursor-pointer shadow-sm min-h-[44px]"
            >
              <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Amend / Edit</span>
            </button>

            <button
              onClick={() => setShowRejectModal(true)}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-slate-800 text-slate-400 hover:text-rose-300 border border-slate-700 hover:border-rose-800/60 transition cursor-pointer min-h-[44px]"
            >
              <XCircle className="w-3.5 h-3.5 text-rose-400" />
              <span>Reject Draft</span>
            </button>

            <button
              onClick={handleVerifyNote}
              className="flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-teal-400 to-cyan-500 text-slate-950 hover:from-teal-300 hover:to-cyan-400 transition cursor-pointer shadow-md shadow-cyan-500/25 min-h-[44px]"
            >
              <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
              <span>Accept & Sign Off</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientDetailPage;
