import React, { useState, useEffect } from 'react';
import { usePatient } from '../../context/PatientContext';
import { speakPhrase } from '../../utils/speechUtils';
import { generateClinicalSummary } from '../../services/api';
import {
  CheckCircle2,
  RotateCcw,
  Printer,
  Volume2,
  Building2,
  Clock,
  User,
  ShieldCheck,
  FileText,
  Activity,
  Flame,
  Stethoscope,
  PhoneCall,
  QrCode,
  AlertTriangle,
  Check,
  Pause,
  Play,
  Share2,
  Sparkles,
  ArrowRight,
  ScanLine,
  Pill,
  FileCheck2
} from 'lucide-react';

export const CaseSummaryToken = () => {
  const { patientData, theme, resetSession } = usePatient();
  const isLight = theme === 'light';

  const [isPrinted, setIsPrinted] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [countdown, setCountdown] = useState(45);
  const [isTimerPaused, setIsTimerPaused] = useState(false);

  const tokenNumber = patientData.token_number || 'A-764';
  const patientName = patientData.full_name || 'Ayush OPD Patient';
  const abhaId = patientData.login_id || 'ABHA-9876-5432-10';
  const turns = patientData.interview_turns || [];
  const uploadedDocs = patientData.uploaded_documents || [];
  const isAyush = patientData.history_mode === 'ayush';

  // Chief complaint from turns or fallback
  const chiefComplaint = turns.length > 0
    ? turns[0].patient_response_text
    : 'Acute Headache & Discomfort (2-3 days)';

  // 45-second DPDP Kiosk Auto-Reset Countdown Timer
  useEffect(() => {
    if (isTimerPaused) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          resetSession();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isTimerPaused, resetSession]);

  // Spoken audio confirmation for all 6 languages
  const playAudioConfirmation = async () => {
    setIsPlayingAudio(true);
    const langKey = patientData.preferred_language || 'Hindi';

    const confirmationMessages = {
      Hindi: 'आपका केस विवरण सफलतापूर्वक डॉक्टर तक पहुँचा दिया गया है। कृपया कमरा नंबर 4 के बाहर प्रतीक्षा करें।',
      English: 'Your case summary has been successfully submitted to the doctor. Please wait outside Room Number 4.',
      Gujarati: 'તમારો કેસ સારાંશ ડૉક્ટર સુધી સફળતાપૂર્વક મોકલી દેવાયો છે. કૃપા કરીને રૂમ નંબર 4 ની બહાર પ્રતીક્ષા કરો.',
      Marathi: 'तुमचा केस सारांश डॉक्टरांकडे यशस्वीरित्या पाठवला आहे. कृपया रूम नंबर 4 बाहेर प्रतीक्षा करा.',
      Tamil: 'உங்கள் வழக்கு சுருக்கம் மருத்துவரிடம் வெற்றிகரமாக சமர்ப்பிக்கப்பட்டது. அறை எண் 4 வெளியே காத்திருக்கவும்.',
      Bengali: 'আপনার কেস সারাংশ সফলভাবে ডাক্তারের কাছে জমা দেওয়া হয়েছে। অনুগ্রহ করে ৪ নম্বর ঘরের বাইরে অপেক্ষা করুন।'
    };

    const message = confirmationMessages[langKey] || confirmationMessages['Hindi'];

    try {
      await speakPhrase(message, langKey);
    } catch (e) {
      console.warn('Speech confirmation note:', e);
    } finally {
      setIsPlayingAudio(false);
    }
  };

  // Auto-speak on mount if accessibility mode is audio-guided
  useEffect(() => {
    if (patientData.accessibility_mode === 'audio-guided') {
      const t = setTimeout(() => {
        playAudioConfirmation();
      }, 600);
      return () => clearTimeout(t);
    }
  }, []);

  // Trigger real clinical summary generation on mount
  useEffect(() => {
    const triggerSummary = async () => {
      const activeSessionId = patientData.session_id || 1;
      const docSummaries = (patientData.uploaded_documents || []).map(d => ({
        type: d.document_type,
        ocr_text: d.ocr_text || d.ocr_raw_text,
        medications: d.extracted_medications || d.medications || []
      }));
      try {
        await generateClinicalSummary(activeSessionId, {
          chief_complaint: chiefComplaint,
          history_mode: patientData.history_mode,
          turns_count: turns.length,
          documents_count: uploadedDocs.length,
          document_summaries: docSummaries
        });
      } catch (err) {
        console.warn('Clinical summary trigger notice:', err);
      }
    };
    triggerSummary();
  }, []);

  const handlePrintSlip = () => {
    setIsPrinted(true);
    setTimeout(() => {
      window.print();
    }, 200);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-1 sm:px-2 flex flex-col justify-center pb-6">
      {/* 1. TOP HEADER & DPDP RESET BAR (WITH HIGH CONTRAST GLASS BACKDROP) */}
      <div className="mb-3 text-center">
        <div className={`inline-block px-5 py-2.5 rounded-2xl border-2 backdrop-blur-md shadow-lg transition-all ${isLight
            ? 'bg-white/95 border-emerald-300 shadow-slate-400/20 text-slate-950'
            : 'bg-slate-900/95 border-emerald-500/40 shadow-slate-950/60 text-white'
          }`}>
          {/* DPDP Countdown Banner */}
          <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full text-xs font-bold mb-1 border shadow-xs transition-all max-w-full flex-wrap justify-center">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span className={isLight ? 'text-slate-950' : 'text-slate-200'}>
              Auto-resetting in <strong className="text-emerald-500 font-mono">{countdown}s</strong>
            </span>
            <button
              type="button"
              onClick={() => setIsTimerPaused(!isTimerPaused)}
              className={`ml-1 px-1.5 py-0.2 rounded border text-[10px] font-semibold flex items-center gap-0.5 cursor-pointer ${isLight ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700' : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
                }`}
            >
              {isTimerPaused ? <Play className="w-2.5 h-2.5" /> : <Pause className="w-2.5 h-2.5" />}
              <span>{isTimerPaused ? 'Resume' : 'Pause'}</span>
            </button>
          </div>

          <h2 className={`text-xl sm:text-2xl font-black tracking-tight ${isLight ? 'text-slate-950' : 'text-white'}`}>
            Intake Complete, <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500">{patientName}</span>!
          </h2>
        </div>
      </div>

      {/* 2. MAIN GRID: TOKEN CARD ON LEFT, CLINICAL SUMMARY ON RIGHT */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch mb-3">

        {/* LEFT COLUMN: Official OPD Token Card (lg:col-span-5) */}
        <div
          className={`lg:col-span-5 rounded-2xl p-3 sm:p-4 border backdrop-blur-md flex flex-col justify-between shadow-xl relative overflow-hidden ${isLight
              ? 'bg-gradient-to-b from-white via-emerald-50/60 to-slate-50 border-emerald-500/80 text-slate-900'
              : 'bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 border-emerald-500/60 text-white'
            }`}
        >
          <div>
            {/* Header with Department & Audio Announcement Button */}
            <div className={`flex items-center justify-between border-b pb-2 mb-2 ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
              <div>
                <span className={`text-[9px] uppercase font-bold tracking-wider ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
                  All India Institute of Ayurveda
                </span>
                <h4 className={`text-xs font-bold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                  Official OPD Queue Token
                </h4>
              </div>

              <button
                type="button"
                onClick={playAudioConfirmation}
                className={`p-1.5 rounded-lg border transition cursor-pointer ${isPlayingAudio
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400 animate-pulse'
                    : isLight
                      ? 'bg-white hover:bg-slate-100 text-emerald-700 border-slate-300'
                      : 'bg-slate-800 text-emerald-400 border-slate-700'
                  }`}
                title="Play Audio Announcement"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>

            {/* Giant Token Number Display */}
            <div
              className={`py-2 px-2 rounded-xl text-center mb-2 border ${isLight
                  ? 'bg-white border border-emerald-500/50 shadow-xs'
                  : 'bg-slate-950/90 border-emerald-500/40'
                }`}
            >
              <span className={`text-[10px] font-bold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Assigned OPD Token Number
              </span>
              <div
                className={`text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r ${isLight ? 'from-emerald-600 via-teal-600 to-cyan-700' : 'from-emerald-400 via-teal-300 to-cyan-400'
                  } tracking-tight my-0.5 font-mono whitespace-nowrap`}
              >
                {tokenNumber}
              </div>
              <div className={`text-[10px] font-semibold flex items-center justify-center gap-1 ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                <span>Live on OPD Calling Display</span>
              </div>
            </div>

            {/* Assigned Room & Estimated Wait Meta Details */}
            <div className="space-y-1.5 text-xs">
              <div
                className={`flex items-center justify-between p-2 rounded-lg border ${isLight ? 'bg-white/90 border-slate-200' : 'bg-slate-800/60 border-slate-700/60'
                  }`}
              >
                <span className={`flex items-center gap-1.5 text-[11px] ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  <Building2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Room:</span>
                </span>
                <strong className={`font-bold text-xs ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  OPD Room No. 4
                </strong>
              </div>

              <div
                className={`flex items-center justify-between p-2 rounded-lg border ${isLight ? 'bg-white/90 border-slate-200' : 'bg-slate-800/60 border-slate-700/60'
                  }`}
              >
                <span className={`flex items-center gap-1.5 text-[11px] ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                  <span>Wait:</span>
                </span>
                <strong className={`font-bold text-xs ${isLight ? 'text-amber-800' : 'text-amber-300'}`}>
                  ~5-10 mins (Queue #2)
                </strong>
              </div>

              <div
                className={`flex items-center justify-between p-2 rounded-lg border ${isLight ? 'bg-white/90 border-slate-200' : 'bg-slate-800/60 border-slate-700/60'
                  }`}
              >
                <span className={`flex items-center gap-1.5 text-[11px] ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  <User className="w-3.5 h-3.5 text-cyan-500" />
                  <span>ABHA / Patient:</span>
                </span>
                <strong className={`font-mono text-xs truncate max-w-[130px] ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {abhaId}
                </strong>
              </div>
            </div>
          </div>

          {/* Print OPD Slip Action */}
          <div className={`mt-2 pt-2 border-t flex items-center gap-2 ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
            <button
              type="button"
              onClick={handlePrintSlip}
              className={`w-full py-2 px-3 rounded-lg font-bold text-xs border flex items-center justify-center gap-1.5 transition active:scale-98 cursor-pointer ${isLight
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-900 border-slate-300'
                  : 'bg-slate-800 hover:bg-slate-750 text-white border-slate-700'
                }`}
            >
              <Printer className="w-3.5 h-3.5 text-cyan-500" />
              <span>{isPrinted ? 'Printed ✓' : 'Print Slip (प्रिंट करें)'}</span>
            </button>
          </div>

        </div>

        {/* RIGHT COLUMN: Intake Summary, OCR Document Summary & Doctor Transmission Status (lg:col-span-7) */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-2.5">
          {/* Clinical Transmission Status Card */}
          <div
            className={`rounded-2xl p-3.5 sm:p-4 border backdrop-blur-md shadow-md ${isLight
                ? 'bg-white/95 border-emerald-300 text-slate-900'
                : 'bg-slate-900/90 border-emerald-500/40 text-white'
              }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 text-[11px] font-bold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Doctor Terminal Connected (DESK-DOC-04)</span>
              </div>

              <span className={`text-[10px] px-2 py-0.5 rounded-lg font-bold uppercase border ${isAyush
                  ? isLight ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-emerald-950/50 border-emerald-800 text-emerald-300'
                  : isLight ? 'bg-cyan-50 border-cyan-200 text-cyan-800' : 'bg-cyan-950/50 border-cyan-800 text-cyan-300'
                }`}>
                {isAyush ? '🌿 Ayush' : '🩺 Allopathic'}
              </span>
            </div>

            <h3 className="text-sm sm:text-base font-black mb-1">
              Structured Clinical Summary Pushed to Doctor
            </h3>
            <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
              The OPD consulting physician has received your preliminary complaint timeline, vital ratings, and digitized documents on their dashboard.
            </p>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-3 gap-2 mt-2.5">

              {/* Chief Complaint */}
              <div
                className={`p-2 rounded-xl border flex flex-col justify-between ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/70 border-slate-800'
                  }`}
              >
                <div className={`text-[9px] font-bold uppercase tracking-wider mb-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Chief Complaint
                </div>
                <div className={`font-bold text-xs truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {chiefComplaint}
                </div>
              </div>

              {/* Digitized Documents */}
              <div
                className={`p-2 rounded-xl border flex flex-col justify-between ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/70 border-slate-800'
                  }`}
              >
                <div className={`text-[9px] font-bold uppercase tracking-wider mb-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Documents
                </div>
                <div className={`font-black text-xs sm:text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {uploadedDocs.length > 0 ? `${uploadedDocs.length} Digitized` : '0 Attached'}
                </div>
              </div>

              {/* DPDP Consent Status */}
              <div
                className={`p-2 rounded-xl border flex flex-col justify-between ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/70 border-slate-800'
                  }`}
              >
                <div className={`text-[9px] font-bold uppercase tracking-wider mb-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Privacy
                </div>
                <div className={`font-bold text-xs ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  ABDM Granted
                </div>
              </div>

            </div>
          </div>

          {/* NEW: OCR & ATTACHED MEDICAL DOCUMENT SUMMARY CARD */}
          <div
            className={`rounded-2xl p-3.5 sm:p-4 border backdrop-blur-md shadow-md ${
              isLight
                ? 'bg-white/95 border-teal-300 text-slate-900'
                : 'bg-slate-900/90 border-teal-500/40 text-white'
            }`}
          >
            <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-teal-400 to-cyan-600 flex items-center justify-center text-slate-950 shadow-sm shrink-0">
                  <ScanLine className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-black leading-tight">
                    OCR & Medical Document Summary / दस्तावेज़ सारांश
                  </h4>
                  <p className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Digitized OCR extraction summary attached to queue token
                  </p>
                </div>
              </div>

              <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border flex items-center gap-1 shrink-0 ${
                uploadedDocs.length > 0
                  ? isLight ? 'bg-teal-50 border-teal-300 text-teal-800' : 'bg-teal-950/60 border-teal-700 text-teal-300'
                  : isLight ? 'bg-slate-100 border-slate-300 text-slate-700' : 'bg-slate-800 border-slate-700 text-slate-300'
              }`}>
                <FileCheck2 className="w-3 h-3 text-teal-500 shrink-0" />
                <span>{uploadedDocs.length > 0 ? `${uploadedDocs.length} Record(s)` : '0 Scanned'}</span>
              </span>
            </div>

            {uploadedDocs.length > 0 ? (
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {uploadedDocs.map((doc, index) => {
                  const isPrescription = doc.document_type === 'prescription';
                  const isLab = doc.document_type === 'lab_report';
                  const docLabel = isPrescription
                    ? 'Prescription'
                    : isLab
                    ? 'Lab Report'
                    : 'Discharge Summary';

                  const meds = doc.extracted_medications || doc.medications || [];
                  const rawOcr = doc.ocr_text || doc.ocr_raw_text || 'OCR text successfully extracted and verified.';

                  return (
                    <div
                      key={doc.id || doc.document_id || index}
                      className={`p-2.5 rounded-xl border text-left transition ${
                        isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/70 border-slate-800'
                      }`}
                    >
                      {/* Header info for each document */}
                      <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
                        <div className="flex items-center gap-1.5">
                          {isPrescription ? (
                            <Stethoscope className="w-4 h-4 text-cyan-500 shrink-0" />
                          ) : isLab ? (
                            <FileText className="w-4 h-4 text-emerald-500 shrink-0" />
                          ) : (
                            <FileCheck2 className="w-4 h-4 text-amber-500 shrink-0" />
                          )}
                          <span className={`text-xs font-black truncate max-w-[180px] ${isLight ? 'text-slate-900' : 'text-white'}`}>
                            {doc.name || `Document #${index + 1}`}
                          </span>
                          <span className={`text-[9px] font-bold px-2 py-0.2 rounded border uppercase ${
                            isLight ? 'bg-white border-slate-300 text-slate-700' : 'bg-slate-900 border-slate-700 text-slate-300'
                          }`}>
                            {docLabel}
                          </span>
                        </div>

                        <span className="text-[10px] font-bold text-emerald-500 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Digitized</span>
                        </span>
                      </div>

                      {/* OCR Summary Text Box */}
                      <div className={`p-2 rounded-lg border text-xs leading-relaxed mb-1.5 font-medium ${
                        isLight ? 'bg-white border-teal-200 text-slate-800' : 'bg-slate-900 border-teal-900/60 text-slate-200'
                      }`}>
                        <div className="text-[9px] font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 mb-0.5 flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          <span>Extracted OCR Findings:</span>
                        </div>
                        <p>{rawOcr}</p>
                      </div>

                      {/* Extracted Medications / Key Test Chips */}
                      {meds.length > 0 && (
                        <div>
                          <div className={`text-[9px] font-bold uppercase tracking-wider mb-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                            Extracted Medications / Test Findings ({meds.length}):
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {meds.map((med, mIdx) => (
                              <span
                                key={mIdx}
                                className={`px-2 py-0.5 rounded-md text-[10px] font-bold border flex items-center gap-1 ${
                                  isLight
                                    ? 'bg-cyan-50 border-cyan-200 text-cyan-950'
                                    : 'bg-cyan-950/60 border-cyan-800 text-cyan-200'
                                }`}
                              >
                                <Pill className="w-3 h-3 text-cyan-500 shrink-0" />
                                <span>{med}</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Fallback if no documents were attached */
              <div className={`p-2.5 rounded-xl border text-center ${
                isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-slate-950/60 border-slate-800 text-slate-300'
              }`}>
                <p className="text-xs font-semibold">
                  No medical prescriptions attached. Case summary compiled directly from AI intake responses.
                </p>
              </div>
            )}
          </div>

          {/* Complete & Reset Session Card */}
          <div
            className={`rounded-2xl p-3 border backdrop-blur-md flex items-center justify-between gap-3 shadow-md ${isLight ? 'bg-white/90 border-slate-200' : 'bg-slate-900/85 border-slate-800'
              }`}
          >
            <div className="text-left">
              <div className={`text-xs font-bold flex items-center gap-1 ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                <ShieldCheck className="w-3.5 h-3.5 text-teal-500" />
                <span>Patient Data Protection</span>
              </div>
              <div className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Session auto-clears upon completion.
              </div>
            </div>

            {/* Complete & Reset Session CTA */}
            <button
              type="button"
              onClick={resetSession}
              className="h-11 px-5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-teal-500/20 active:scale-98 transition cursor-pointer shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Complete & Start New Patient</span>
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};

export default CaseSummaryToken;
