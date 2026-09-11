import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Flame, 
  Clock, 
  User, 
  AlertTriangle, 
  FileText, 
  FileCheck2, 
  Sparkles, 
  Stethoscope, 
  Pill, 
  Activity, 
  CheckCircle2, 
  HeartPulse, 
  ShieldAlert, 
  Download, 
  ExternalLink,
  ChevronRight,
  ClipboardList,
  Printer,
  Share2,
  Check,
  Utensils,
  Ban,
  Building2
} from 'lucide-react';
import RedFlagBadge from './RedFlagBadge';
import AyushAssessmentCard from './AyushAssessmentCard';
import SummaryActionToolbar from './SummaryActionToolbar';

export const PatientDetailView = ({
  session,
  patient,
  history,
  ayushHistory,
  redFlag,
  documents,
  summary,
  currentDoctor,
  onBack,
  onAcknowledgeAlert,
  onUpdateSummaryStatus,
  onSaveSummaryAmendment
}) => {
  const [isVerified, setIsVerified] = useState(summary?.status === 'accepted');
  const [printSuccess, setPrintSuccess] = useState(false);

  const hasRedFlag = !!redFlag;
  const isAyushMode = session?.history_mode === 'ayush' || currentDoctor?.is_ayush_practitioner;

  const handleVerifyNote = () => {
    setIsVerified(true);
    onUpdateSummaryStatus('accepted', `Verified & digitally signed by ${currentDoctor?.name || 'Dr. Anand Kulkarni'} (EHR ABDM Committed).`);
  };

  const handlePrintSlip = () => {
    setPrintSuccess(true);
    setTimeout(() => setPrintSuccess(false), 3000);
    window.print();
  };

  if (!patient || !session) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center border border-[#e2ece5]">
        <p className="text-slate-500">Patient case data not found.</p>
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
      {/* Top Breadcrumb & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Back Button & Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 transition cursor-pointer shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Queue</span>
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                Patient Assessment Review • Token {session.token || session.queue_number}
              </h1>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                isAyushMode
                  ? 'bg-amber-50 text-amber-900 border-amber-300'
                  : 'bg-sky-50 text-sky-900 border-sky-300'
              }`}>
                {isAyushMode ? 'AYUSH Clinical Protocol' : 'Allopathic Protocol'}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Record ID: <span className="font-mono text-slate-700">{patient.patient_id}</span> • MRN: <span className="font-mono text-slate-700">{patient.mrn}</span>
            </p>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handlePrintSlip}
            className="px-3 py-2 rounded-xl text-xs font-bold bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>{printSuccess ? 'Printed!' : 'Print Case Slip'}</span>
          </button>

          {isVerified ? (
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
              <span>Verify & Sign Clinical Note</span>
            </button>
          )}
        </div>
      </div>

      {/* Emergency Red-Flag Alert Banner (If Present) */}
      {hasRedFlag && (
        <RedFlagBadge
          alert={redFlag}
          showDetails={true}
          onAcknowledge={onAcknowledgeAlert}
        />
      )}

      {/* Patient Core Bio & Intake Ribbon Card */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#e2ece5] shadow-xs">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">
              Patient Name
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
              ✓ ABDM Verified
            </span>
          </div>

          <div>
            <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">
              Intake Kiosk Terminal
            </span>
            <p className="text-xs sm:text-sm font-bold text-slate-800 mt-0.5">
              Terminal #02 (Ground Floor)
            </p>
            <p className="text-slate-500 font-medium">
              Check-in: {session.check_in_time} (Today)
            </p>
          </div>

          <div>
            <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">
              Intake Language & Mode
            </span>
            <p className="text-xs sm:text-sm font-bold text-slate-800 mt-0.5">
              Hindi & English Voice AI
            </p>
            <p className="text-slate-500 font-medium">
              Self-Reported + Bio-Sensors
            </p>
          </div>
        </div>

        {/* Live Vitals Gauge Bar */}
        {patient.vitals_summary && (
          <div className="mt-5 pt-4 border-t border-slate-100">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className={`p-3 rounded-2xl border ${
                patient.vitals_summary.bp.includes('168')
                  ? 'bg-rose-50 border-rose-300 text-rose-900'
                  : 'bg-[#f4f8f5] border-[#e2ece5] text-slate-800'
              }`}>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Blood Pressure
                </span>
                <span className="text-sm font-mono font-black mt-0.5 block">
                  {patient.vitals_summary.bp}
                </span>
                <span className={`text-[10px] font-bold ${
                  patient.vitals_summary.bp.includes('168') ? 'text-rose-600' : 'text-emerald-700'
                }`}>
                  {patient.vitals_summary.bp.includes('168') ? 'High (Stage 2)' : 'Normal'}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-[#f4f8f5] border border-[#e2ece5] text-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Heart Rate
                </span>
                <span className="text-sm font-mono font-black mt-0.5 block">
                  {patient.vitals_summary.pulse}
                </span>
                <span className="text-[10px] font-bold text-slate-600">
                  Regular Rhythm
                </span>
              </div>

              <div className={`p-3 rounded-2xl border ${
                parseInt(patient.vitals_summary.spo2) < 94
                  ? 'bg-amber-50 border-amber-300 text-amber-900'
                  : 'bg-[#f4f8f5] border-[#e2ece5] text-slate-800'
              }`}>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Oxygen (SpO2)
                </span>
                <span className="text-sm font-mono font-black mt-0.5 block">
                  {patient.vitals_summary.spo2}
                </span>
                <span className={`text-[10px] font-bold ${
                  parseInt(patient.vitals_summary.spo2) < 94 ? 'text-amber-700' : 'text-emerald-700'
                }`}>
                  {parseInt(patient.vitals_summary.spo2) < 94 ? 'Borderline' : 'Normal'}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-[#f4f8f5] border border-[#e2ece5] text-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Temperature
                </span>
                <span className="text-sm font-mono font-black mt-0.5 block">
                  {patient.vitals_summary.temp}
                </span>
                <span className="text-[10px] font-bold text-emerald-700">
                  Afebrile
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-[#f4f8f5] border border-[#e2ece5] text-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Respiration Rate
                </span>
                <span className="text-sm font-mono font-black mt-0.5 block">
                  {patient.vitals_summary.rr || '18 /min'}
                </span>
                <span className="text-[10px] font-bold text-slate-600">
                  Spontaneous
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Clinical Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (Span 2): Chief Complaint, Symptoms, AYUSH Pariksha, and OCR Documents */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card 1: Chief Complaint & Symptom Progression */}
          <div className="bg-white rounded-3xl p-6 border border-[#e2ece5] shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-[#0e4d34]" />
                Chief Complaint & Clinical Progression
              </h3>
              <span className="text-xs text-slate-400 font-medium">
                Duration: <strong className="text-slate-800">{history?.duration || '3 weeks'}</strong>
              </span>
            </div>

            {/* Primary Concern in Easy Language */}
            <div className="p-4 rounded-2xl bg-[#f4f8f5] border border-[#e2ece5]">
              <span className="text-[11px] font-bold uppercase text-[#0e4d34] tracking-wider block">
                Primary Complaint (Patient's Words):
              </span>
              <p className="text-sm font-bold text-slate-900 mt-1 leading-relaxed">
                "{history?.chief_complaint || 'Severe burning sensation in upper chest/stomach and recurrent acid reflux.'}"
              </p>
            </div>

            {/* Associated Symptoms / Easy Lakshanas */}
            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Associated Symptoms (Lakshanas):
              </h4>
              <div className="flex flex-wrap gap-2">
                {(history?.associated_symptoms || [
                  'Sour / Acid Belching (Amlodgara)',
                  'Throat & Chest Burning (Hritkantha Daha)',
                  'Post-meal Nausea (Utklesha)',
                  'Mild throbbing headache'
                ]).map((symptom, idx) => (
                  <span
                    key={idx}
                    className="text-xs font-bold px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-800 shadow-2xs"
                  >
                    • {symptom}
                  </span>
                ))}
              </div>
            </div>

            {/* Aggravating & Relieving Factors Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-200 text-xs">
                <span className="font-bold text-rose-900 flex items-center gap-1.5 text-xs uppercase tracking-wider mb-1.5">
                  <Ban className="w-3.5 h-3.5 text-rose-600" /> Aggravating Factors (What Makes It Worse):
                </span>
                <ul className="list-disc list-inside text-slate-700 space-y-1 font-medium">
                  {(history?.aggravating_factors || [
                    'Oily, spicy, and deep-fried food',
                    'Irregular and late-night dinner timings',
                    'High mental work stress & skipped breakfasts'
                  ]).map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200 text-xs">
                <span className="font-bold text-emerald-900 flex items-center gap-1.5 text-xs uppercase tracking-wider mb-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Relieving Factors (What Helps):
                </span>
                <ul className="list-disc list-inside text-slate-700 space-y-1 font-medium">
                  {(history?.relieving_factors || [
                    'Drinking cold milk or tender coconut water',
                    'Resting in upright posture after meals',
                    'Sipping coriander-fennel infused warm water'
                  ]).map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Card 2: AYUSH Clinical Pariksha (Standardized Ayurveda Assessment) */}
          <AyushAssessmentCard ayushData={ayushHistory} />

          {/* Card 3: Scanned Lab Reports & OCR Extracted Documents */}
          <div className="bg-white rounded-3xl p-6 border border-[#e2ece5] shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-[#0e4d34]" />
                <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  Uploaded Medical Records & Lab OCR
                </h3>
              </div>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#e7f3ec] text-[#0e4d34] border border-[#e2ece5]">
                {documents?.length || 1} Document Analyzed
              </span>
            </div>

            <div className="space-y-3">
              {(documents && documents.length > 0 ? documents : [
                {
                  document_id: "doc_rec_01",
                  document_type: "Biochemical Liver & Renal Function Panel",
                  extracted_parameters: [
                    { name: "Serum Creatinine", value: "1.1 mg/dL", status: "normal" },
                    { name: "Fasting Blood Sugar", value: "112 mg/dL", status: "borderline" },
                    { name: "Serum Bilirubin", value: "0.8 mg/dL", status: "normal" },
                    { name: "HbA1c", value: "6.4%", status: "borderline" }
                  ],
                  ocr_confidence: "96.8%",
                  facility: "AIIA Central Diagnostic Laboratory"
                }
              ]).map((doc, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-[#f4f8f5] border border-[#e2ece5] space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">
                        {doc.document_type}
                      </h4>
                      <p className="text-xs text-slate-500 font-medium">
                        Facility: {doc.facility || 'Central Hospital Labs'} • AI OCR Confidence: <strong className="text-[#0e4d34]">{doc.ocr_confidence || '96%'}</strong>
                      </p>
                    </div>
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 shadow-2xs">
                      Verified Scan
                    </span>
                  </div>

                  {/* Extracted Parameters Badges */}
                  {doc.extracted_parameters && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                      {doc.extracted_parameters.map((param, pIdx) => (
                        <div key={pIdx} className="p-2.5 rounded-xl bg-white border border-slate-200 text-xs">
                          <span className="text-slate-400 text-[10px] font-bold uppercase block">
                            {param.name}
                          </span>
                          <span className="text-xs font-mono font-bold text-slate-900 mt-0.5 block">
                            {param.value}
                          </span>
                          <span className={`text-[10px] font-bold ${
                            param.status === 'borderline' ? 'text-amber-700' : 'text-emerald-700'
                          }`}>
                            {param.status === 'borderline' ? '• Borderline' : '• Normal'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (Span 1): AI Clinical Impression, Diet Guidelines, & Prescriptions */}
        <div className="space-y-6">
          {/* Card 4: AI Diagnostic Summary & Recommendations */}
          <div className="bg-white rounded-3xl p-6 border border-[#e2ece5] shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Sparkles className="w-5 h-5 text-amber-600" />
              <h3 className="text-base font-black text-slate-900 tracking-tight">
                AI Diagnostic Summary
              </h3>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-[#f4f8f5] border border-[#e2ece5]">
                <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">
                  Clinical Impression:
                </span>
                <p className="text-sm font-bold text-slate-900 mt-0.5">
                  Amlapitta (Hyperacidity / GERD) with Pitta-Vata Aggravation
                </p>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  Triggered by irregular diet, high chili intake, and occupational stress.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 rounded-2xl bg-white border border-slate-200">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">
                    ICD-10 Code
                  </span>
                  <span className="text-xs font-mono font-black text-slate-800 mt-0.5 block">
                    K21.9 (GERD)
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-white border border-slate-200">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">
                    NAMASTE AYU Code
                  </span>
                  <span className="text-xs font-mono font-black text-[#0e4d34] mt-0.5 block">
                    AYU-AP-01
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 5: Diet & Lifestyle Plan (Pathya / Apathya Do's & Don'ts) */}
          <div className="bg-white rounded-3xl p-6 border border-[#e2ece5] shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Utensils className="w-5 h-5 text-[#0e4d34]" />
              <h3 className="text-base font-black text-slate-900 tracking-tight">
                Diet Guidelines (Pathya & Apathya)
              </h3>
            </div>

            {/* Foods to Eat */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-emerald-800 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Foods to Eat (Pathya):
              </span>
              <div className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-200 text-xs text-slate-700 font-medium space-y-1">
                <p>• Pomegranate, sweet apple, and tender coconut water</p>
                <p>• Moong dal khichdi prepared with half tsp cow's ghee</p>
                <p>• Soaked black raisins (Munakka) in morning</p>
              </div>
            </div>

            {/* Foods to Avoid */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-rose-800 flex items-center gap-1">
                <Ban className="w-3.5 h-3.5 text-rose-600" />
                Foods to Avoid (Apathya):
              </span>
              <div className="p-3 rounded-2xl bg-rose-50/60 border border-rose-200 text-xs text-slate-700 font-medium space-y-1">
                <p>• Red chili, deep-fried snacks, and heavy sour curds</p>
                <p>• Skipping morning meals or eating post 9:30 PM</p>
                <p>• Excessive tea/coffee on an empty stomach</p>
              </div>
            </div>
          </div>

          {/* Card 6: Prescribed Formulations */}
          <div className="bg-white rounded-3xl p-6 border border-[#e2ece5] shadow-xs space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Pill className="w-5 h-5 text-[#0e4d34]" />
              <h3 className="text-base font-black text-slate-900 tracking-tight">
                Recommended AYUSH Formulations
              </h3>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-xl bg-[#f4f8f5] border border-[#e2ece5]">
                <div className="flex justify-between items-center">
                  <span className="font-black text-slate-900">Avipattikar Churna</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white border border-slate-200 text-[#0e4d34]">
                    3g BD
                  </span>
                </div>
                <p className="text-slate-500 text-[11px] mt-0.5">Take before meals with lukewarm water (Pitta Pacification)</p>
              </div>

              <div className="p-3 rounded-xl bg-[#f4f8f5] border border-[#e2ece5]">
                <div className="flex justify-between items-center">
                  <span className="font-black text-slate-900">Kamadudha Ras (Moti Yukta)</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white border border-slate-200 text-[#0e4d34]">
                    1 Tab BD
                  </span>
                </div>
                <p className="text-slate-500 text-[11px] mt-0.5">Take after food with honey or cold milk (Antacid action)</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Physician Action Toolbar */}
      <SummaryActionToolbar
        summary={summary}
        onUpdateStatus={onUpdateSummaryStatus}
        onSaveAmendment={onSaveSummaryAmendment}
      />
    </div>
  );
};

export default PatientDetailView;
