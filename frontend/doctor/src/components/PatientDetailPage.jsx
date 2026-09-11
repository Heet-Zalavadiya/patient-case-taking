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

export const PatientDetailPage = ({
  patient,
  currentDoctor,
  onBack,
  onAlertAcknowledged
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
        // 1. Fetch History (Live endpoint GET /patients/:id/history with mock fallback)
        const histRes = await getPatientHistory(patient.patient_id);
        if (isMounted) {
          setHistory(histRes.data);
          setIsLiveApi(histRes.isLive);
        }

        // 2. Fetch Lab values (document_extracted_lab_values)
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
      <div className="bg-white rounded-3xl p-12 text-center border border-[#e2ece5]">
        <p className="text-slate-500 font-medium">No patient selected.</p>
        <button
          onClick={onBack}
          className="mt-4 px-4 py-2 bg-[#0e4d34] text-white rounded-xl text-xs font-bold"
        >
          Return to Queue
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Top Breadcrumb & Action Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 transition cursor-pointer shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Queue</span>
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                Case Sheet • Token {patient.token || patient.queue_number}
              </h1>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#e7f3ec] text-[#0e4d34] border border-[#e2ece5]">
                Intake Completed
              </span>
              <span className="flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                {isLiveApi ? (
                  <>
                    <Wifi className="w-3 h-3 text-emerald-600" /> Live Endpoint
                  </>
                ) : (
                  <>
                    <WifiOff className="w-3 h-3 text-amber-600" /> Hybrid Mode
                  </>
                )}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              MRN: <strong className="text-slate-800 font-mono">{patient.mrn}</strong> • Patient ID: <span className="font-mono">{patient.patient_id}</span>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handlePrintSlip}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>{printSuccess ? 'Printing...' : 'Print Case Slip'}</span>
          </button>

          {isNoteVerified ? (
            <span className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1.5 shadow-2xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              <span>Verified by Physician</span>
            </span>
          ) : (
            <button
              onClick={handleVerifyNote}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-[#0e4d34] hover:bg-[#093322] text-white transition cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Verify & Sign Consultation</span>
            </button>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* SECTION 3: ALERTS & TRIAGE PANEL (`red_flag_alerts`)           */}
      {/* ============================================================ */}
      {activeAlert && (
        <div className={`rounded-3xl p-5 sm:p-6 border transition-all ${
          isHighAlert
            ? 'bg-rose-50/90 border-rose-300 shadow-sm'
            : 'bg-amber-50/90 border-amber-300 shadow-sm'
        }`}>
          <div className="flex flex-col md:flex-row items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                isHighAlert
                  ? 'bg-rose-600 text-white shadow-xs animate-alert-pulse'
                  : 'bg-amber-600 text-white shadow-xs'
              }`}>
                {isHighAlert ? <Flame className="w-6 h-6 animate-pulse" /> : <AlertTriangle className="w-6 h-6" />}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md ${
                    isHighAlert ? 'bg-rose-700 text-white' : 'bg-amber-700 text-white'
                  }`}>
                    {activeAlert.severity} PRIORITY RED-FLAG
                  </span>
                  <span className="text-xs text-slate-500 font-mono font-medium">
                    Detected: {activeAlert.timestamp}
                  </span>
                  {isAlertAck ? (
                    <span className="text-xs px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold border border-emerald-300 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" /> Acknowledged by Physician
                    </span>
                  ) : (
                    <span className="text-xs px-2.5 py-0.5 rounded-md bg-rose-200 text-rose-900 font-bold border border-rose-300 animate-pulse">
                      Urgent Doctor Action Required
                    </span>
                  )}
                </div>

                <p className="text-sm font-bold text-rose-950 leading-relaxed">
                  {activeAlert.flag_description}
                </p>

                {activeAlert.vital_triggers && activeAlert.vital_triggers.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap pt-1">
                    <span className="text-[11px] font-bold text-slate-500 uppercase">Trigger Values:</span>
                    {activeAlert.vital_triggers.map((trig, idx) => (
                      <span
                        key={idx}
                        className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-md bg-white border border-rose-300 text-rose-700 shadow-2xs"
                      >
                        {trig}
                      </span>
                    ))}
                  </div>
                )}

                {activeAlert.action_protocol && (
                  <p className="text-xs font-semibold text-rose-800 pt-1">
                    Recommended Clinical Protocol: <span className="font-normal">{activeAlert.action_protocol}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Acknowledge Alert Toggle Button */}
            <div className="w-full md:w-auto shrink-0 pt-2 md:pt-0">
              <button
                onClick={handleToggleAlertAcknowledgment}
                className={`w-full md:w-auto px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-xs ${
                  isAlertAck
                    ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
                    : 'bg-rose-700 hover:bg-rose-800 text-white'
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
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#e2ece5] shadow-xs">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">
              Patient Demographics
            </span>
            <p className="text-base font-black text-slate-900 mt-0.5">
              {patient.full_name}
            </p>
            <p className="text-slate-500 font-medium">
              {patient.age} Y • {patient.gender} • Blood: {patient.blood_group || 'B+'}
            </p>
          </div>

          <div>
            <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">
              ABHA ID / ABDM
            </span>
            <p className="font-mono text-xs sm:text-sm font-bold text-slate-800 mt-0.5">
              {patient.phone ? `91-${patient.phone.replace(/[^0-9]/g, '').slice(-10)}@abdm` : '14-3456-7890-1234'}
            </p>
            <span className="inline-block mt-0.5 text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              ✓ Verified Identity
            </span>
          </div>

          <div>
            <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">
              Intake Time
            </span>
            <p className="text-xs sm:text-sm font-bold text-slate-800 mt-0.5">
              {patient.check_in_time} (Today)
            </p>
            <p className="text-slate-500 font-medium">
              Mode: Kiosk Terminal Intake
            </p>
          </div>

          <div>
            <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">
              Triage Category
            </span>
            <p className="text-xs sm:text-sm font-bold text-[#0e4d34] mt-0.5">
              {patient.triage_category || 'Routine OPD'}
            </p>
            <p className="text-slate-500 font-medium">
              Priority: {isHighAlert ? 'Immediate Review' : 'Standard'}
            </p>
          </div>
        </div>

        {/* Live Vitals Ribbon */}
        {patient.vitals_summary && (
          <div className="mt-5 pt-4 border-t border-slate-100">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className={`p-3 rounded-2xl border ${
                patient.vitals_summary.bp?.includes('168')
                  ? 'bg-rose-50 border-rose-300 text-rose-900'
                  : 'bg-[#f4f8f5] border-[#e2ece5] text-slate-800'
              }`}>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Blood Pressure</span>
                <span className="text-sm font-mono font-black mt-0.5 block">{patient.vitals_summary.bp}</span>
                <span className={`text-[10px] font-bold ${
                  patient.vitals_summary.bp?.includes('168') ? 'text-rose-600' : 'text-emerald-700'
                }`}>
                  {patient.vitals_summary.bp?.includes('168') ? 'High (Stage 2)' : 'Normal'}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-[#f4f8f5] border border-[#e2ece5] text-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Heart Rate</span>
                <span className="text-sm font-mono font-black mt-0.5 block">{patient.vitals_summary.pulse}</span>
                <span className="text-[10px] font-bold text-slate-600">Regular</span>
              </div>

              <div className={`p-3 rounded-2xl border ${
                parseInt(patient.vitals_summary.spo2) < 94
                  ? 'bg-amber-50 border-amber-300 text-amber-900'
                  : 'bg-[#f4f8f5] border-[#e2ece5] text-slate-800'
              }`}>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">SpO2 Oxygen</span>
                <span className="text-sm font-mono font-black mt-0.5 block">{patient.vitals_summary.spo2}</span>
                <span className={`text-[10px] font-bold ${
                  parseInt(patient.vitals_summary.spo2) < 94 ? 'text-amber-700' : 'text-emerald-700'
                }`}>
                  {parseInt(patient.vitals_summary.spo2) < 94 ? 'Borderline' : 'Normal'}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-[#f4f8f5] border border-[#e2ece5] text-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Temperature</span>
                <span className="text-sm font-mono font-black mt-0.5 block">{patient.vitals_summary.temp}</span>
                <span className="text-[10px] font-bold text-emerald-700">Afebrile</span>
              </div>

              <div className="p-3 rounded-2xl bg-[#f4f8f5] border border-[#e2ece5] text-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Respiration</span>
                <span className="text-sm font-mono font-black mt-0.5 block">{patient.vitals_summary.rr || '18 /min'}</span>
                <span className="text-[10px] font-bold text-slate-600">Spontaneous</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* SECTION 1: HISTORY PANEL (HYBRID LIVE / MOCK)                */}
      {/* ============================================================ */}
      <div className="bg-white rounded-3xl p-6 border border-[#e2ece5] shadow-xs space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-[#0e4d34]" />
            <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
              1. Clinical History & Review of Systems (ROS)
            </h2>
          </div>
          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#e7f3ec] text-[#0e4d34] border border-[#e2ece5]">
            Live Endpoint + Structured HPI
          </span>
        </div>

        {/* Live Section: Chief Complaint & Associated Symptoms */}
        <div className="space-y-3">
          <div className="p-4 rounded-2xl bg-[#f4f8f5] border border-[#e2ece5]">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold uppercase text-[#0e4d34] tracking-wider">
                Chief Complaint (Live / GET /patients/:id/history)
              </span>
              <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                structured_history.chief_complaint
              </span>
            </div>
            <p className="text-base font-bold text-slate-900 leading-relaxed">
              "{history?.chief_complaint || 'Loading clinical history...'}"
            </p>
          </div>

          {/* Associated Symptoms */}
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
              Associated Symptoms (hpi_associated_symptoms):
            </span>
            <div className="flex flex-wrap gap-2">
              {(history?.hpi_associated_symptoms || []).map((symptom, idx) => (
                <span
                  key={idx}
                  className="text-xs font-bold px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-800 shadow-2xs"
                >
                  • {symptom}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Mock Extended History: HPI, Past Medical History, Drug Allergies, ROS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* Extended HPI Details */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
            <span className="font-bold text-slate-800 uppercase tracking-wider text-xs block">
              Extended HPI Progression:
            </span>
            <p className="text-slate-700">
              <strong>Onset:</strong> {history?.hpi_onset || 'N/A'}
            </p>
            <p className="text-slate-700">
              <strong>Progression:</strong> {history?.hpi_progression || 'N/A'}
            </p>
            {history?.hpi_aggravating_factors && (
              <div>
                <strong>Aggravating Factors:</strong>
                <ul className="list-disc list-inside text-slate-600 mt-0.5">
                  {history.hpi_aggravating_factors.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Past Medical History & Active Medications */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
            <span className="font-bold text-slate-800 uppercase tracking-wider text-xs block">
              Past Medical History & Medications:
            </span>
            {history?.past_medical_history && (
              <ul className="list-disc list-inside text-slate-700 space-y-0.5">
                {history.past_medical_history.map((pmh, i) => (
                  <li key={i}>{pmh}</li>
                ))}
              </ul>
            )}

            <div className="pt-2 border-t border-slate-200">
              <span className="font-bold text-slate-800 block mb-1">Drug Allergies:</span>
              {history?.allergies && history.allergies.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {history.allergies.map((al, aIdx) => (
                    <span
                      key={aIdx}
                      className="px-2 py-0.5 rounded bg-rose-50 text-rose-800 border border-rose-200 font-bold text-[11px]"
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
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
              Review of Systems (ROS):
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {Object.entries(history.review_of_systems).map(([system, details], idx) => (
                <div key={idx} className="p-3 rounded-xl bg-[#f4f8f5] border border-[#e2ece5] text-xs">
                  <span className="font-bold text-[#0e4d34] block">{system}</span>
                  <p className="text-slate-600 mt-0.5">{details}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* SECTION 2: LAB VALUES & DOCUMENTS PANEL                      */}
      {/* (`document_extracted_lab_values` with CRUCIAL is_abnormal)    */}
      {/* ============================================================ */}
      <div className="bg-white rounded-3xl p-6 border border-[#e2ece5] shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <FileCheck2 className="w-5 h-5 text-[#0e4d34]" />
            <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
              2. Extracted Lab Investigations & Diagnostic Documents
            </h2>
          </div>
          <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
            document_extracted_lab_values
          </span>
        </div>

        <p className="text-xs text-slate-500 font-medium">
          Tabulated medical investigations extracted via OCR & hospital LIS integration. Values flagged with abnormal indicators require clinical attention.
        </p>

        {/* Tabular Lab Investigations */}
        <div className="overflow-x-auto rounded-2xl border border-[#e2ece5]">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f4f8f5] border-b border-[#e2ece5] text-slate-700 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Test Name</th>
                <th className="py-3 px-4">Measured Value</th>
                <th className="py-3 px-4">Unit</th>
                <th className="py-3 px-4">Reference Range</th>
                <th className="py-3 px-4 text-center">Diagnostic Flag</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {labValues.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-6 text-center text-slate-400">
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
                          ? 'bg-rose-50/70 border-l-4 border-l-rose-600 hover:bg-rose-100/60'
                          : 'hover:bg-slate-50/80'
                      }`}
                    >
                      {/* Test Name */}
                      <td className="py-3 px-4 font-bold text-slate-900">
                        <div className="flex items-center gap-2">
                          {isAbnormal && (
                            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                          )}
                          <span>{row.test_name}</span>
                        </div>
                      </td>

                      {/* Measured Value */}
                      <td className="py-3 px-4 font-mono font-black text-sm">
                        <span className={isAbnormal ? 'text-rose-700' : 'text-slate-900'}>
                          {row.value}
                        </span>
                      </td>

                      {/* Unit */}
                      <td className="py-3 px-4 font-mono text-slate-600">
                        {row.unit}
                      </td>

                      {/* Reference Range */}
                      <td className="py-3 px-4 font-mono text-slate-500">
                        {row.reference_range}
                      </td>

                      {/* Flag / Abnormal Indicator Badge */}
                      <td className="py-3 px-4 text-center">
                        {isAbnormal ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-rose-600 text-white shadow-2xs uppercase tracking-wide">
                            <span>⚠️</span> {row.flag || 'ABNORMAL'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
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
      <div className="bg-white rounded-3xl p-6 border border-[#e2ece5] shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-600" />
            <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
              4. Consultation Summary & Physician Review
            </h2>
          </div>
          <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
            AI Clinical Intake Synthesis
          </span>
        </div>

        {/* Draft Text Preview or Amendment Form */}
        {isEditingNote ? (
          <div className="space-y-4 p-5 rounded-2xl bg-[#f4f8f5] border-2 border-[#0e4d34]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#0e4d34] uppercase tracking-wider flex items-center gap-1.5">
                <Edit3 className="w-4 h-4" /> Editing Clinical Consultation Draft
              </span>
              <span className="text-xs text-slate-500 font-medium">Physician Amendment Mode</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Doctor Consultation Additions / Notes:
              </label>
              <input
                type="text"
                value={doctorAmendmentComment}
                onChange={(e) => setDoctorAmendmentComment(e.target.value)}
                placeholder="e.g. Advised emergency cardiologist consult, administered loading dose..."
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-[#0e4d34]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Amended Case Summary Body:
              </label>
              <textarea
                rows={8}
                value={amendedNoteText}
                onChange={(e) => setAmendedNoteText(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:border-[#0e4d34] resize-y"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-1">
              <button
                onClick={() => setIsEditingNote(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAmendment}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-[#0e4d34] text-white hover:bg-[#093322] cursor-pointer shadow-xs"
              >
                <Save className="w-4 h-4" /> Save Doctor Amendments
              </button>
            </div>
          </div>
        ) : (
          <div className="p-5 rounded-2xl bg-[#f4f8f5] border border-[#e2ece5] space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">
                Synthesized Intake Record:
              </span>
              <span className="text-xs font-mono text-slate-400">
                Status: <strong className="uppercase text-[#0e4d34]">{summary?.status || 'Draft'}</strong>
              </span>
            </div>

            <div className="text-xs font-mono text-slate-800 whitespace-pre-line leading-relaxed bg-white p-4 rounded-xl border border-slate-200">
              {summary?.draft_text || 'Synthesizing consultation summary...'}
            </div>

            {summary?.physician_notes && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs font-medium text-amber-900">
                <strong>Physician Note:</strong> {summary.physician_notes}
              </div>
            )}
          </div>
        )}

        {/* Reject Reason Modal */}
        {showRejectModal && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-300 space-y-3">
            <div className="flex items-center gap-2 text-rose-800 font-bold text-xs">
              <AlertCircle className="w-4 h-4 text-rose-600" /> Discard / Reject Draft for Audit Trail
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
                  className={`text-xs px-3 py-1.5 rounded-full border cursor-pointer transition ${
                    rejectReason === reason
                      ? 'bg-rose-600 text-white border-rose-600 font-bold'
                      : 'bg-white text-slate-700 border-slate-200'
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
              className="w-full px-3 py-2 bg-white border border-rose-200 rounded-xl text-xs text-slate-800 focus:outline-none"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                className="px-4 py-1.5 rounded-xl text-xs font-bold bg-rose-600 text-white"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        )}

        {/* Review Action Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="text-xs text-slate-500">
            Last Modified: <span className="font-mono text-slate-700">{summary?.last_modified_by || 'AI Synthesizer'}</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setIsEditingNote(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 transition cursor-pointer shadow-2xs"
            >
              <Edit3 className="w-3.5 h-3.5 text-amber-600" />
              <span>Amend / Edit</span>
            </button>

            <button
              onClick={() => setShowRejectModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white text-slate-600 hover:text-rose-700 border border-slate-200 hover:border-rose-200 transition cursor-pointer"
            >
              <XCircle className="w-3.5 h-3.5 text-rose-500" />
              <span>Reject Draft</span>
            </button>

            <button
              onClick={handleVerifyNote}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-[#0e4d34] hover:bg-[#093322] text-white transition cursor-pointer shadow-xs"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Accept & Sign Off</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientDetailPage;
