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
  FlaskConical,
  MapPin,
  RefreshCw,
  ShieldCheck
} from 'lucide-react';
import usePatientDetails from '../hooks/usePatientDetails';
import { fetchDoctorPatientSummary, generateLocalPatientSummary } from '../api';
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
    isAlertAck,
    acknowledgeAlert: triggerAcknowledgeAlert,
    verifySummary: triggerVerifySummary,
    amendSummary: triggerAmendSummary
  } = usePatientDetails(patient?.patient_id, patient?.session_id);

  // AI Short Summary state (Cached to avoid repeated Gemini API calls)
  const [aiSummary, setAiSummary] = useState(null);
  const [isLoadingAiSummary, setIsLoadingAiSummary] = useState(true);
  const [isRefreshingSummary, setIsRefreshingSummary] = useState(false);

  // Collapsible full intake details (COLLAPSED BY DEFAULT as required)
  const [showFullIntake, setShowFullIntake] = useState(false);
  const [activeFullIntakeTab, setActiveFullIntakeTab] = useState('socrates'); // 'socrates' | 'bodymap' | 'vitals_labs' | 'clinical_history' | 'ayush'

  // Review & Amendment state
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [amendedNoteText, setAmendedNoteText] = useState('');
  const [doctorComment, setDoctorComment] = useState('');
  const [printSuccess, setPrintSuccess] = useState(false);

  // Sync draft text into editor when available
  useEffect(() => {
    if (summary?.draft_text) {
      setAmendedNoteText(summary.draft_text);
    }
  }, [summary]);

  // Load / Fetch AI Clinical Summary (Cached by default)
  const loadSummary = async (forceRefresh = false) => {
    if (!patient?.patient_id) return;
    if (forceRefresh) {
      setIsRefreshingSummary(true);
    } else {
      setIsLoadingAiSummary(true);
    }

    const payload = {
      patient_id: patient.patient_id,
      full_name: patient.full_name,
      age: patient.age,
      gender: patient.gender,
      preferred_language: patient.preferred_language || 'Hindi',
      pain_locations:
        patient.painLocations ||
        patient.pain_locations ||
        history?.pain_locations ||
        [],
      chief_complaint:
        history?.chief_complaint || patient.demo_chief_complaint,
      hpi_onset: history?.hpi_onset,
      hpi_progression: history?.hpi_progression,
      hpi_associated_symptoms: history?.hpi_associated_symptoms || [],
      socrates_answers:
        history?.socrates_answers ||
        (history?.interview_turns || []).map((t) => ({
          question: t.ai_question,
          answer: t.patient_response_text
        })),
      interview_turns:
        history?.interview_turns || patient.interview_turns || [],
      red_flags: activeAlert
        ? [activeAlert.flag_description]
        : patient.has_red_flags
        ? ['High Priority Red Flag']
        : [],
      vitals_summary: patient.vitals_summary || {
        bp: '120/80',
        pulse: '76 bpm',
        spo2: '98%'
      }
    };

    try {
      const res = await fetchDoctorPatientSummary(
        patient.patient_id,
        payload,
        forceRefresh
      );
      if (res?.data) {
        setAiSummary(res.data);
      }
    } catch (err) {
      console.warn('Error fetching AI summary, using clinical fallback:', err);
      setAiSummary(generateLocalPatientSummary(payload));
    } finally {
      setIsLoadingAiSummary(false);
      setIsRefreshingSummary(false);
    }
  };

  useEffect(() => {
    loadSummary(false);
  }, [patient?.patient_id, history?.chief_complaint, activeAlert]);

  // Handlers
  const handleToggleAlert = async () => {
    if (!activeAlert) return;
    try {
      await triggerAcknowledgeAlert(activeAlert.alert_id, !isAlertAck);
      if (onAlertAcknowledged) {
        onAlertAcknowledged(activeAlert.alert_id, !isAlertAck);
      }
    } catch (e) {
      console.error('Failed to acknowledge alert:', e);
    }
  };

  const handleVerifyNote = async () => {
    try {
      await triggerVerifySummary(doctorComment);
      if (onSignOff) {
        onSignOff();
      }
    } catch (e) {
      console.error('Failed to verify summary:', e);
    }
  };

  const handleSaveAmendment = async () => {
    try {
      await triggerAmendSummary(amendedNoteText, doctorComment);
      setIsEditingNote(false);
    } catch (e) {
      console.error('Failed to amend summary:', e);
    }
  };

  const handlePrintSlip = () => {
    setPrintSuccess(true);
    setTimeout(() => setPrintSuccess(false), 3000);
    window.print();
  };

  if (!patient) {
    return (
      <div className="bg-slate-900/90 rounded-2xl p-12 text-center border border-slate-800 shadow-xl">
        <p className="text-slate-300 font-bold text-lg">No patient selected.</p>
        <button
          onClick={onBack}
          className="mt-4 px-5 py-2.5 bg-gradient-to-r from-teal-400 to-cyan-500 text-slate-950 rounded-xl text-sm font-black cursor-pointer shadow-md"
        >
          Return to Queue
        </button>
      </div>
    );
  }

  const isNoteVerified =
    summary?.status?.toLowerCase() === 'accepted' ||
    summary?.status?.toLowerCase() === 'amended';
  const isHighAlert = activeAlert && activeAlert.severity === 'HIGH';
  const isAyushMode =
    currentDoctor?.is_ayush_practitioner || history?.history_mode === 'ayush';
  const painLocations =
    patient.painLocations ||
    patient.pain_locations ||
    history?.pain_locations ||
    [];
  const abnormalLabsCount = (labValues || []).filter((l) => l.is_abnormal === 1).length;

  return (
    <div className="space-y-4 sm:space-y-6 pb-20 animate-in fade-in duration-200">
      
      {/* ============================================================ */}
      {/* 🔹 1. TOP BAR: MINIMAL & FAST NAVIGATION (1-CLICK RETURN)    */}
      {/* ============================================================ */}
      <div className="bg-slate-900/90 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-slate-800 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-750 transition cursor-pointer shrink-0 shadow-sm"
            title="Return to Patient Queue"
          >
            <ArrowLeft className="w-4 h-4 text-cyan-400" />
            <span>Back to Queue</span>
          </button>

          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-lg sm:text-xl lg:text-2xl font-black text-white tracking-tight truncate">
                {patient.full_name}
              </h1>
              <span className="text-xs font-mono font-black px-2.5 py-0.5 rounded-lg bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                #{patient.token || patient.queue_number}
              </span>
              <span className="text-xs sm:text-sm font-bold text-slate-400">
                {patient.age} Yrs • {patient.gender}
              </span>
              <span className="text-xs font-mono text-slate-400 font-medium">
                MRN: {patient.mrn}
              </span>

              {isHighAlert && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-600 text-white shadow-sm animate-pulse">
                  <Flame className="w-3.5 h-3.5" />
                  <span>EMERGENCY RED FLAG</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 font-medium flex items-center gap-2">
              <span>Arrived: <strong className="text-slate-200 font-mono">{patient.check_in_time}</strong></span>
              <span>•</span>
              <span>Category: <strong className="text-cyan-400">{patient.triage_category || 'Routine OPD'}</strong></span>
            </p>
          </div>
        </div>

        {/* Top Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap justify-end">
          <button
            type="button"
            onClick={handlePrintSlip}
            className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-750 transition cursor-pointer flex items-center gap-1.5 shadow-sm"
          >
            <Printer className="w-4 h-4 text-cyan-400" />
            <span>{printSuccess ? 'Printing...' : 'Print Slip'}</span>
          </button>

          {isNoteVerified ? (
            <span className="px-4 py-2 rounded-xl text-xs sm:text-sm font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5 shadow-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Signed & Verified</span>
            </span>
          ) : (
            <button
              type="button"
              onClick={handleVerifyNote}
              className="px-5 py-2 rounded-xl text-xs sm:text-sm font-black bg-gradient-to-r from-teal-400 to-cyan-400 hover:from-teal-300 hover:to-cyan-300 text-slate-950 transition cursor-pointer flex items-center gap-1.5 shadow-md shadow-cyan-500/20"
            >
              <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
              <span>Sign-Off Consultation</span>
            </button>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* ⚡ 2. AI CLINICAL SUMMARY (QUICK OVERVIEW - UNDER 10 SECONDS) */}
      {/* ============================================================ */}
      <div className="bg-gradient-to-b from-slate-900 to-slate-950 rounded-2xl p-5 sm:p-6 border-2 border-cyan-500/40 shadow-xl shadow-cyan-950/20 space-y-4">
        {/* Header with Title, Badge, and Refresh */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-teal-500 flex items-center justify-center text-slate-950 font-black shadow-sm">
              <Sparkles className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-2">
                <span>AI Clinical Summary</span>
                <span className="text-xs font-mono font-bold text-cyan-300 bg-cyan-500/20 px-2 py-0.5 rounded-md border border-cyan-500/40">
                  Quick Overview
                </span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* AI Disclaimer Badge (Requirement) */}
            <span className="text-[11px] font-semibold text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700">
              Generated by MediKiosk AI — verify with full details below
            </span>

            {/* Cache / Refresh Button */}
            <button
              type="button"
              onClick={() => loadSummary(true)}
              disabled={isRefreshingSummary || isLoadingAiSummary}
              className="px-2.5 py-1 rounded-lg text-xs font-bold text-slate-300 hover:text-cyan-300 bg-slate-800 hover:bg-slate-750 border border-slate-700 transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
              title="Regenerate AI Summary from patient data"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isRefreshingSummary ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* 3-5 Short Bullet Points */}
        {isLoadingAiSummary ? (
          <div className="space-y-2.5 py-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-4 bg-slate-800/80 rounded animate-pulse w-full max-w-2xl" />
            ))}
          </div>
        ) : (
          <div className="space-y-2.5 text-sm sm:text-base">
            <ul className="space-y-2 font-medium text-slate-200">
              {(aiSummary?.summary_bullets || []).map((bullet, idx) => {
                // Split prefix for high-contrast scanning (e.g. "Chief Complaint:", "Pain Location:")
                const parts = bullet.split(':');
                const hasPrefix = parts.length > 1 && parts[0].length < 35;
                const prefix = hasPrefix ? parts[0] + ':' : '';
                const body = hasPrefix ? parts.slice(1).join(':') : bullet;

                const isEmergencyBullet =
                  bullet.toLowerCase().includes('emergency') ||
                  bullet.toLowerCase().includes('critical') ||
                  bullet.toLowerCase().includes('red-flag');

                return (
                  <li
                    key={idx}
                    className={`flex items-start gap-2.5 p-2 rounded-xl transition ${
                      isEmergencyBullet
                        ? 'bg-rose-950/30 border border-rose-500/30 text-rose-100 font-semibold'
                        : 'hover:bg-slate-900/60'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full mt-2 shrink-0 ${
                      isEmergencyBullet ? 'bg-rose-500 animate-pulse' : 'bg-cyan-400'
                    }`} />
                    <span className="leading-relaxed">
                      {hasPrefix && (
                        <strong className={`mr-1.5 font-bold ${
                          isEmergencyBullet ? 'text-rose-300' : 'text-cyan-300'
                        }`}>
                          {prefix}
                        </strong>
                      )}
                      <span>{body}</span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* 🔽 3. COLLAPSIBLE SECTION: VIEW FULL INTAKE DETAILS           */}
      {/*    (COLLAPSED BY DEFAULT AS REQUIRED)                        */}
      {/* ============================================================ */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 shadow-md overflow-hidden transition-all">
        {/* Clickable Header Bar to Expand / Collapse */}
        <button
          type="button"
          onClick={() => setShowFullIntake(!showFullIntake)}
          className="w-full p-4 sm:p-5 flex items-center justify-between hover:bg-slate-800/60 transition cursor-pointer select-none text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-cyan-400 border border-slate-700">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                <span>View Full Intake Details</span>
                <span className="text-xs font-normal text-slate-400 hidden sm:inline">
                  (SOCRATES answers, body map, transcripts & clinical records)
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                {showFullIntake ? 'Click to hide full details' : 'Click to expand all underlying question responses & investigations'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700">
              {showFullIntake ? 'Expanded' : 'Collapsed'}
            </span>
            {showFullIntake ? (
              <ChevronUp className="w-5 h-5 text-cyan-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-400" />
            )}
          </div>
        </button>

        {/* EXPANDED CONTENT (ONLY VISIBLE ON EXPAND) */}
        {showFullIntake && (
          <div className="p-5 sm:p-6 border-t border-slate-800 bg-slate-950/60 space-y-6 animate-in fade-in duration-200">
            
            {/* Sub-Tabs within Expanded Section for Clean Browsing */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {[
                { id: 'socrates', label: 'SOCRATES Q&A', icon: Activity },
                { id: 'bodymap', label: 'Body Map Pain Locations', icon: MapPin },
                { id: 'vitals_labs', label: 'Vitals & Lab Values', icon: FlaskConical },
                { id: 'clinical_history', label: 'Past History & ROS', icon: Stethoscope },
                ...(isAyushMode ? [{ id: 'ayush', label: 'AYUSH Assessment', icon: Sparkles }] : []),
                { id: 'notes', label: 'Doctor Notes & Sign-off', icon: FileCheck2 }
              ].map((tab) => {
                const Icon = tab.icon;
                const isSelected = activeFullIntakeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveFullIntakeTab(tab.id)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                      isSelected
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-black'
                        : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* TAB 1: SOCRATES Q&A & Interview Turns */}
            {activeFullIntakeTab === 'socrates' && (
              <div className="space-y-4">
                <h3 className="text-sm font-black text-white uppercase tracking-wider text-cyan-400">
                  SOCRATES Multimodal Interview Responses
                </h3>
                
                {/* Chief Complaint */}
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Chief Complaint (Site & Complaint):
                  </span>
                  <p className="text-sm sm:text-base font-bold text-white leading-relaxed">
                    "{history?.chief_complaint || patient.demo_chief_complaint || 'N/A'}"
                  </p>
                </div>

                {/* Question/Answer Turn Cards */}
                <div className="space-y-3">
                  {(history?.socrates_answers || [
                    { question: 'Onset & Duration', answer: history?.hpi_onset || 'Started 2-3 days ago' },
                    { question: 'Severity & Character', answer: history?.hpi_progression || 'Moderate continuous discomfort' },
                    { question: 'Aggravating Factors', answer: (history?.hpi_aggravating_factors || []).join(', ') || 'Physical exertion' }
                  ]).map((turn, i) => (
                    <div key={i} className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800/80 space-y-1 text-xs sm:text-sm">
                      <span className="font-bold text-cyan-400 block">
                        Question {i + 1}: {turn.question}
                      </span>
                      <p className="text-slate-200 font-medium">
                        {turn.answer}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 2: Body Map Pain Locations */}
            {activeFullIntakeTab === 'bodymap' && (
              <div className="space-y-3">
                <h3 className="text-sm font-black text-white uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-cyan-400" />
                  <span>Pinpointed Body Map Regions</span>
                </h3>

                {painLocations.length === 0 ? (
                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400">
                    No specific anatomical region was selected on the interactive body map.
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {painLocations.map((loc, idx) => (
                      <span
                        key={idx}
                        className="px-3.5 py-2 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-200 text-xs sm:text-sm font-bold flex items-center gap-1.5"
                      >
                        <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{loc}</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: Vitals & Lab Values */}
            {activeFullIntakeTab === 'vitals_labs' && (
              <div className="space-y-4">
                {/* Vitals Ribbon */}
                <div>
                  <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-2">
                    Recorded Kiosk Vitals
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs sm:text-sm font-mono font-bold">
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block font-sans">Blood Pressure</span>
                      <span className="text-sm sm:text-base text-white">{patient.vitals_summary?.bp || '120/80'}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block font-sans">Pulse Rate</span>
                      <span className="text-sm sm:text-base text-white">{patient.vitals_summary?.pulse || '76 bpm'}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block font-sans">Oxygen Saturation</span>
                      <span className="text-sm sm:text-base text-white">{patient.vitals_summary?.spo2 || '98%'}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block font-sans">Temperature</span>
                      <span className="text-sm sm:text-base text-white">{patient.vitals_summary?.temp || '98.6 °F'}</span>
                    </div>
                  </div>
                </div>

                {/* Lab Results */}
                {labValues && labValues.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-2">
                      Extracted Lab Values ({abnormalLabsCount} Abnormal)
                    </h4>
                    <div className="rounded-xl border border-slate-800 overflow-hidden text-xs">
                      <table className="w-full text-left">
                        <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
                          <tr>
                            <th className="p-2.5">Test Name</th>
                            <th className="p-2.5">Result</th>
                            <th className="p-2.5">Normal Range</th>
                            <th className="p-2.5">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 bg-slate-950">
                          {labValues.map((lab, i) => (
                            <tr key={i} className={lab.is_abnormal ? 'bg-rose-950/20' : ''}>
                              <td className="p-2.5 font-bold text-slate-200">{lab.test_name}</td>
                              <td className="p-2.5 font-mono font-bold text-white">{lab.result_value} {lab.unit}</td>
                              <td className="p-2.5 font-mono text-slate-400">{lab.reference_range}</td>
                              <td className="p-2.5">
                                {lab.is_abnormal ? (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-rose-500/20 text-rose-300 border border-rose-500/40">
                                    Abnormal
                                  </span>
                                ) : (
                                  <span className="text-emerald-400 font-bold">Normal</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: Past Medical History & ROS */}
            {activeFullIntakeTab === 'clinical_history' && (
              <div className="space-y-4 text-xs sm:text-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Past History */}
                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                    <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider block">
                      Past Medical History:
                    </span>
                    {(history?.past_medical_history || ['None reported']).map((item, i) => (
                      <p key={i} className="text-slate-300">• {item}</p>
                    ))}
                  </div>

                  {/* Allergies */}
                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                    <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider block">
                      Allergies:
                    </span>
                    {(history?.allergies || [{ allergen: 'No known drug allergies' }]).map((al, i) => (
                      <span key={i} className="inline-block mr-2 mb-1 px-2.5 py-1 rounded-lg bg-rose-950/40 text-rose-300 border border-rose-500/40 font-bold text-xs">
                        ⚠️ {al.allergen} {al.reaction ? `(${al.reaction})` : ''}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Review of Systems */}
                {history?.review_of_systems && Object.keys(history.review_of_systems).length > 0 && (
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                      Review of Systems (ROS):
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                      {Object.entries(history.review_of_systems).map(([sys, desc], idx) => (
                        <div key={idx} className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                          <strong className="text-cyan-400 block mb-0.5">{sys}</strong>
                          <p className="text-slate-300">{desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 5: AYUSH Assessment (if applicable) */}
            {activeFullIntakeTab === 'ayush' && isAyushMode && (
              <AyushAssessmentCard
                history={history}
                ayushData={history?.ayush_history}
              />
            )}

            {/* TAB 6: Doctor Consultation Notes & Sign-off */}
            {activeFullIntakeTab === 'notes' && (
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3 text-xs sm:text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200">
                    Clinical Draft Consultation Record:
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsEditingNote(!isEditingNote)}
                    className="text-xs font-bold text-cyan-400 hover:text-cyan-300 cursor-pointer flex items-center gap-1"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>{isEditingNote ? 'Cancel' : 'Edit Note'}</span>
                  </button>
                </div>

                {isEditingNote ? (
                  <div className="space-y-3">
                    <textarea
                      value={amendedNoteText}
                      onChange={(e) => setAmendedNoteText(e.target.value)}
                      rows={5}
                      className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 font-mono text-xs focus:outline-none focus:border-cyan-400"
                    />
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={handleSaveAmendment}
                        className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Save Amendment</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="p-3 rounded-xl bg-slate-950 font-mono text-xs text-slate-300 leading-relaxed">
                    {summary?.draft_text || 'Draft clinical record ready for physician sign-off.'}
                  </p>
                )}
              </div>
            )}

          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* 🔹 4. BOTTOM ACTION ROW                                      */}
      {/* ============================================================ */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Patient Queue</span>
        </button>

        {!isNoteVerified && (
          <button
            type="button"
            onClick={handleVerifyNote}
            className="px-6 py-2.5 rounded-xl text-xs sm:text-sm font-black bg-gradient-to-r from-teal-400 to-cyan-400 hover:from-teal-300 hover:to-cyan-300 text-slate-950 transition cursor-pointer flex items-center gap-1.5 shadow-md shadow-cyan-500/20"
          >
            <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
            <span>Sign-Off Consultation</span>
          </button>
        )}
      </div>

    </div>
  );
};

export default PatientDetailPage;
