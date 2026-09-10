import React, { useState } from 'react';
import { usePatient } from '../../context/PatientContext';
import { loginPatient } from '../../services/mockApi';
import { 
  User, 
  KeyRound, 
  QrCode, 
  ArrowRight, 
  Sparkles, 
  ShieldCheck, 
  AlertCircle,
  Loader2,
  CheckCircle2,
  Zap
} from 'lucide-react';

export const StepIdentification = () => {
  const { patientData, updatePatient, nextStep, setTokenNumber, setPatientField } = usePatient();
  const [loginId, setLoginId] = useState(patientData.login_id || '');
  const [password, setPassword] = useState(patientData.password || '');
  const [fullName, setFullName] = useState(patientData.full_name || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isDemoDropdownOpen, setIsDemoDropdownOpen] = useState(false);

  // Quick fill sample patients for fast kiosk testing
  const handleQuickDemo = (id, pass, name) => {
    setLoginId(id);
    setPassword(pass);
    setFullName(name);
    setErrorMsg('');
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!loginId.trim()) {
      setErrorMsg('Please enter your ABHA Number, Mobile, or Kiosk ID.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const response = await loginPatient(loginId, password || 'kiosk123');
      if (response.success && response.patient) {
        updatePatient({
          login_id: response.patient.login_id,
          password: password || 'kiosk123',
          full_name: fullName || response.patient.full_name,
          preferred_language: response.patient.preferred_language || patientData.preferred_language,
          accessibility_mode: response.patient.accessibility_mode || patientData.accessibility_mode,
          consents: response.patient.consents || patientData.consents,
          token_number: response.token_number
        });
        setTokenNumber(response.token_number);
        nextStep();
      }
    } catch (err) {
      // If validation fails, still allow walk-in patient registration
      console.warn('Login note:', err.message);
      updatePatient({
        login_id: loginId,
        password: password || 'walkin123',
        full_name: fullName || `Walk-in Patient (${loginId.slice(-4)})`
      });
      nextStep();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center justify-center p-4">
      {/* Title Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-sm font-medium mb-3">
          <ShieldCheck className="w-4 h-4 text-cyan-400" />
          <span>National Ayush Hospital OPD Check-In</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Step 1: Patient Identification
        </h2>
        <p className="text-slate-400 text-base sm:text-lg mt-2 max-w-xl mx-auto">
          Scan your ABHA QR card or enter your registered mobile / patient ID to begin consultation intake.
        </p>
      </div>

      {/* Main Touch Input Card */}
      <div className="w-full bg-slate-900/80 backdrop-blur-xl border border-slate-700/60 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-cyan-950/50">
        
        {/* Quick Demo Selector Bar for judges and testers */}
        <div className="mb-6 p-3 bg-slate-950/60 border border-slate-800 rounded-2xl flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <Zap className="w-4 h-4 text-amber-400" />
            <span>Kiosk Quick Demo Test Profiles:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleQuickDemo('AYUSH9901', 'password123', 'Rajesh Kumar Sharma')}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-cyan-900/50 hover:text-cyan-300 text-slate-300 border border-slate-700 transition"
            >
              👤 Rajesh Kumar (Hindi)
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo('9876543210', '123', 'Dr. Sunita Patel')}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-cyan-900/50 hover:text-cyan-300 text-slate-300 border border-slate-700 transition"
            >
              👩 Sunita Patel (Gujarati)
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo('PATIENT01', '123', 'Amitabh Verma')}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-cyan-900/50 hover:text-cyan-300 text-slate-300 border border-slate-700 transition"
            >
              👨 Amitabh (Audio-Guided)
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center gap-3 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Input: Login ID / Mobile / ABHA */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-200">
                ABHA ID / Mobile Number / Login ID <span className="text-cyan-400">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <User className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  placeholder="e.g. 9876543210 or 12-3456-7890"
                  className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-950/80 border border-slate-700 text-white text-lg placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all shadow-inner"
                  autoComplete="off"
                />
              </div>
              <p className="text-xs text-slate-400">Enter your 10-digit mobile, 14-digit ABHA ID, or Kiosk Username</p>
            </div>

            {/* Input: Full Name */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-200">
                Patient Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Rajesh Kumar Sharma"
                  className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-950/80 border border-slate-700 text-white text-lg placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all shadow-inner"
                />
              </div>
              <p className="text-xs text-slate-400">Leave blank if auto-fetching from ABHA/database</p>
            </div>

            {/* Input: Password / PIN */}
            <div className="space-y-2 md:col-span-2">
              <label className="block text-sm font-semibold text-slate-200">
                Security PIN / Password <span className="text-slate-400 text-xs">(Optional for walk-in OPD)</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <KeyRound className="w-5 h-5" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter 4-digit PIN or Password (Default: 123)"
                  className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-950/80 border border-slate-700 text-white text-lg placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all shadow-inner"
                />
              </div>
            </div>

          </div>

          {/* Action Buttons: Large Touch Targets for Kiosk */}
          <div className="pt-4 flex flex-col sm:flex-row items-center gap-4">
            
            {/* ABHA QR Scan Simulation */}
            <button
              type="button"
              onClick={() => {
                handleQuickDemo('ABHA-9821-4432-8811', '123', 'Aadhavan Ramanathan');
              }}
              className="w-full sm:w-1/2 py-4 px-6 rounded-2xl bg-slate-800/90 hover:bg-slate-750 text-slate-200 border border-slate-700 font-semibold text-base flex items-center justify-center gap-3 transition-all active:scale-98"
            >
              <QrCode className="w-5 h-5 text-cyan-400" />
              <span>Tap to Scan ABHA QR</span>
            </button>

            {/* Primary Proceed CTA */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-1/2 py-4 px-6 rounded-2xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-bold text-lg flex items-center justify-center gap-3 shadow-lg shadow-cyan-500/20 transition-all active:scale-98 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span>Verifying Record...</span>
                </>
              ) : (
                <>
                  <span>Next: Select Language</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>

          </div>
        </form>
      </div>
    </div>
  );
};

export default StepIdentification;
