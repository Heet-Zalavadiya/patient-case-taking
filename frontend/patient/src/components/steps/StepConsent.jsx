import React, { useState } from 'react';
import { usePatient } from '../../context/PatientContext';
import { savePatientOnboarding } from '../../services/mockApi';
import { 
  ShieldCheck, 
  Check, 
  X, 
  ArrowRight, 
  ArrowLeft, 
  FileText, 
  Share2, 
  Lock, 
  Loader2,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

export const StepConsent = () => {
  const { patientData, toggleConsent, setConsent, nextStep, prevStep, setTokenNumber, updatePatient } = usePatient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState('');

  const dataCaptureConsent = patientData.consents?.find(c => c.consent_type === 'data_capture') || {
    consent_type: 'data_capture',
    is_granted: false,
    granted_via: 'touch'
  };

  const abdmConsent = patientData.consents?.find(c => c.consent_type === 'abdm_sharing') || {
    consent_type: 'abdm_sharing',
    is_granted: false,
    granted_via: 'touch'
  };

  const handleGrantAll = () => {
    setConsent('data_capture', true, 'touch');
    setConsent('abdm_sharing', true, 'touch');
    setValidationError('');
  };

  const handleSubmit = async () => {
    // Data capture is mandatory for clinical OPD triage intake
    if (!dataCaptureConsent.is_granted) {
      setValidationError('Clinical Data Capture consent is required to prepare OPD doctor triage records.');
      return;
    }

    setIsSubmitting(true);
    setValidationError('');

    try {
      const result = await savePatientOnboarding(patientData);
      if (result.success) {
        setTokenNumber(result.token_number);
        updatePatient({
          token_number: result.token_number
        });
        nextStep();
      }
    } catch (err) {
      console.error('Failed to submit onboarding:', err);
      // Fallback transition for demo
      nextStep();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center justify-center p-4">
      {/* Title Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 text-sm font-medium mb-3">
          <Lock className="w-4 h-4 text-teal-400" />
          <span>DPDP Act 2023 & Ayushman Bharat (ABDM) Compliant</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Step 3: Patient Consent & Data Privacy
        </h2>
        <p className="text-slate-400 text-base sm:text-lg mt-2 max-w-xl mx-auto">
          Please review and confirm your digital health data consents as per Ministry of Ayush & Government of India guidelines.
        </p>
      </div>

      {validationError && (
        <div className="w-full mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-center gap-3 text-sm">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Consent Cards */}
      <div className="w-full space-y-4 mb-6">
        
        {/* Consent 1: Clinical Data Capture */}
        <div 
          onClick={() => toggleConsent('data_capture', 'touch')}
          className={`cursor-pointer rounded-3xl p-6 transition-all border ${
            dataCaptureConsent.is_granted
              ? 'bg-slate-900/90 border-teal-500/80 shadow-lg shadow-teal-500/10'
              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className={`p-3.5 rounded-2xl shrink-0 ${
                dataCaptureConsent.is_granted ? 'bg-teal-500/20 text-teal-300' : 'bg-slate-800 text-slate-400'
              }`}>
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-white">1. Clinical Intake & AI Case-Taking Consent</h3>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-semibold">Mandatory</span>
                </div>
                <p className="text-sm text-slate-300 mt-1">
                  I authorize the hospital MediKiosk system to capture my reported chief complaints, pulse/vitals, and health queries for doctor review.
                </p>
                <div className="text-xs text-slate-400 mt-2 flex items-center gap-2">
                  <span>Method: <strong className="text-slate-300 capitalize">{dataCaptureConsent.granted_via} Touch Screen</strong></span>
                  <span>•</span>
                  <span>DPDP Ref: <strong className="text-slate-300">AYUSH-DPDP-SEC6</strong></span>
                </div>
              </div>
            </div>

            {/* Large Toggle Switch Button */}
            <div className="shrink-0 self-end sm:self-center">
              <button
                type="button"
                className={`w-16 h-9 rounded-full p-1 transition-colors duration-200 ease-in-out relative flex items-center ${
                  dataCaptureConsent.is_granted ? 'bg-teal-500' : 'bg-slate-700'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-full bg-slate-950 shadow-md transform transition-transform duration-200 flex items-center justify-center text-white ${
                    dataCaptureConsent.is_granted ? 'translate-x-7 text-teal-400' : 'translate-x-0 text-slate-500'
                  }`}
                >
                  {dataCaptureConsent.is_granted ? <Check className="w-4 h-4 stroke-[3]" /> : <X className="w-4 h-4 stroke-[3]" />}
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Consent 2: ABDM Health Record Sharing */}
        <div 
          onClick={() => toggleConsent('abdm_sharing', 'touch')}
          className={`cursor-pointer rounded-3xl p-6 transition-all border ${
            abdmConsent.is_granted
              ? 'bg-slate-900/90 border-cyan-500/80 shadow-lg shadow-cyan-500/10'
              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className={`p-3.5 rounded-2xl shrink-0 ${
                abdmConsent.is_granted ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-800 text-slate-400'
              }`}>
                <Share2 className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-white">2. ABDM & Ayush Health Grid Sharing</h3>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold">Recommended</span>
                </div>
                <p className="text-sm text-slate-300 mt-1">
                  I consent to link this OPD case prescription with my Ayushman Bharat Health Account (ABHA) for seamless longitudinal care.
                </p>
                <div className="text-xs text-slate-400 mt-2 flex items-center gap-2">
                  <span>Method: <strong className="text-slate-300 capitalize">{abdmConsent.granted_via} Touch Screen</strong></span>
                  <span>•</span>
                  <span>ABDM Ref: <strong className="text-slate-300">NHA-M2-CONSENT</strong></span>
                </div>
              </div>
            </div>

            {/* Large Toggle Switch Button */}
            <div className="shrink-0 self-end sm:self-center">
              <button
                type="button"
                className={`w-16 h-9 rounded-full p-1 transition-colors duration-200 ease-in-out relative flex items-center ${
                  abdmConsent.is_granted ? 'bg-cyan-500' : 'bg-slate-700'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-full bg-slate-950 shadow-md transform transition-transform duration-200 flex items-center justify-center text-white ${
                    abdmConsent.is_granted ? 'translate-x-7 text-cyan-400' : 'translate-x-0 text-slate-500'
                  }`}
                >
                  {abdmConsent.is_granted ? <Check className="w-4 h-4 stroke-[3]" /> : <X className="w-4 h-4 stroke-[3]" />}
                </div>
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Quick Grant All Action */}
      <div className="w-full flex justify-end mb-6">
        <button
          type="button"
          onClick={handleGrantAll}
          className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5 p-2 rounded-lg bg-cyan-950/40 border border-cyan-800/40"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Grant All Consents</span>
        </button>
      </div>

      {/* Navigation Footer */}
      <div className="w-full flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={prevStep}
          disabled={isSubmitting}
          className="py-4 px-6 rounded-2xl bg-slate-800/90 hover:bg-slate-750 text-slate-300 border border-slate-700 font-semibold text-base flex items-center gap-2 transition active:scale-98 cursor-pointer disabled:opacity-50"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </button>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="py-4 px-8 rounded-2xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-bold text-lg flex items-center gap-3 shadow-lg shadow-cyan-500/20 transition active:scale-98 cursor-pointer disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin" />
              <span>Registering & Generating Token...</span>
            </>
          ) : (
            <>
              <span>Confirm & Generate Token</span>
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default StepConsent;
