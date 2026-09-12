import React, { useState, useRef } from 'react';
import { usePatient } from '../../context/PatientContext';
import { apiRegisterOrLoginPatient, loginOrRegisterPatient } from '../../services/api';
import { loginPatient as mockLoginPatient } from '../../services/mockApi';
import { 
  User, 
  KeyRound, 
  ArrowRight, 
  Sparkles, 
  ShieldCheck, 
  AlertCircle,
  Loader2,
  CheckCircle2,
  Zap,
  Delete,
  CornerDownLeft,
  Keyboard,
  UserPlus,
  QrCode,
  HeartPulse,
  Sun,
  Moon
} from 'lucide-react';

export const PatientLogin = () => {
  const { 
    patientData, 
    theme,
    toggleTheme,
    updatePatient, 
    nextStep, 
    setTokenNumber,
    setPatientField 
  } = usePatient();

  const isLight = theme === 'light';

  const [loginId, setLoginId] = useState(patientData.login_id || '');
  const [password, setPassword] = useState(patientData.password || '');
  const [activeInput, setActiveInput] = useState('loginId'); // 'loginId' | 'password'
  const [showKeypad, setShowKeypad] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGuestLoading, setIsGuestLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const loginInputRef = useRef(null);
  const passwordInputRef = useRef(null);

  // Keypad Click Handler
  const handleKeypadPress = (val) => {
    setErrorMsg('');
    if (activeInput === 'loginId') {
      if (val === 'BACKSPACE') {
        setLoginId((prev) => prev.slice(0, -1));
      } else if (val === 'CLEAR') {
        setLoginId('');
      } else {
        setLoginId((prev) => prev + val);
      }
    } else {
      if (val === 'BACKSPACE') {
        setPassword((prev) => prev.slice(0, -1));
      } else if (val === 'CLEAR') {
        setPassword('');
      } else {
        setPassword((prev) => prev + val);
      }
    }
  };

  // Quick fill sample patients for fast kiosk testing
  const handleQuickDemo = (id, pass) => {
    setLoginId(id);
    setPassword(pass);
    setErrorMsg('');
  };

  // 1-Tap Demo Patient Profiles matching Member 3's DB preload scripts
  const handleDemoProfileSelect = async (profile) => {
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const payload = {
        login_id: profile.login_id,
        password_hash: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
        full_name: profile.full_name,
        preferred_language: patientData.preferred_language || 'Hindi',
        accessibility_mode: patientData.accessibility_mode || 'standard',
        age: profile.age,
        gender: profile.gender
      };

      const response = await apiRegisterOrLoginPatient(payload);
      const patientId = response?.patient_id || response?.patient?.patient_id || profile.fallback_id || 1;
      const fullName = response?.full_name || response?.patient?.full_name || profile.full_name;

      updatePatient({
        patient_id: patientId,
        login_id: profile.login_id,
        full_name: fullName,
        age: profile.age,
        gender: profile.gender,
        demo_chief_complaint: profile.demo_chief_complaint,
        preferred_language: patientData.preferred_language || 'Hindi',
        accessibility_mode: patientData.accessibility_mode || 'standard',
        token_number: response.token_number || patientData.token_number || 'A-101'
      });

      if (response.token_number) setTokenNumber(response.token_number);
      // Automatically advance to Step 2 (Language Selection)
      nextStep();
    } catch (err) {
      console.warn('Demo profile login offline fallback:', err.message);
      updatePatient({
        patient_id: profile.fallback_id || 1,
        login_id: profile.login_id,
        full_name: profile.full_name,
        age: profile.age,
        gender: profile.gender,
        demo_chief_complaint: profile.demo_chief_complaint
      });
      nextStep();
    } finally {
      setIsSubmitting(false);
    }
  };

  // Primary Login Submission
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!loginId.trim()) {
      setErrorMsg('कृपया अपना आभा आईडी, मोबाइल नंबर या लॉगिन आईडी दर्ज करें (Please enter ABHA, Mobile, or Login ID).');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const response = await apiRegisterOrLoginPatient({
        login_id: loginId.trim(),
        password: password || '123',
        full_name: `Patient (${loginId.slice(-4)})`,
        preferred_language: patientData.preferred_language || 'Hindi',
        accessibility_mode: patientData.accessibility_mode || 'standard'
      });
      if (response && (response.success || response.patient_id)) {
        const patientObj = response.patient || response;
        const assignedPatientId = response.patient_id || patientObj.patient_id || 1;
        const assignedFullName = response.full_name || patientObj.full_name || `Patient (${loginId.slice(-4)})`;

        updatePatient({
          patient_id: assignedPatientId,
          login_id: patientObj.login_id || loginId.trim(),
          full_name: assignedFullName,
          preferred_language: patientObj.preferred_language || patientData.preferred_language || 'Hindi',
          accessibility_mode: patientObj.accessibility_mode || patientData.accessibility_mode || 'standard',
          consents: patientObj.consents || patientData.consents,
          token_number: response.token_number || patientData.token_number || 'A-101'
        });
        if (response.token_number) setTokenNumber(response.token_number);
        nextStep();
      }
    } catch (err) {
      console.warn('Login offline fallback:', err.message);
      updatePatient({
        patient_id: 1,
        login_id: loginId.trim(),
        full_name: `Patient (${loginId.slice(-4) || 'Walk-in'})`
      });
      nextStep();
    } finally {
      setIsSubmitting(false);
    }
  };

  // Instant Walk-in / Emergency Bypass Handler
  const handleInstantWalkIn = async () => {
    setIsGuestLoading(true);
    setErrorMsg('');

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const guestId = `GUEST-OPD-${randomSuffix}`;

    try {
      const response = await apiRegisterOrLoginPatient({
        login_id: guestId,
        password: 'guest123',
        full_name: `Walk-in Patient (आपातकालीन #${randomSuffix})`,
        preferred_language: patientData.preferred_language || 'Hindi',
        accessibility_mode: patientData.accessibility_mode || 'standard'
      });
      const patientObj = response.patient || response;
      const assignedPatientId = response.patient_id || patientObj.patient_id || 1;
      const assignedFullName = response.full_name || patientObj.full_name || `Walk-in Patient (आपातकालीन #${randomSuffix})`;

      updatePatient({
        patient_id: assignedPatientId,
        login_id: 'GUEST-OPD',
        full_name: assignedFullName,
        preferred_language: patientData.preferred_language || 'Hindi',
        accessibility_mode: patientData.accessibility_mode || 'standard',
        consents: [
          { consent_type: 'data_capture', is_granted: true, granted_via: 'touch' },
          { consent_type: 'abdm_sharing', is_granted: false, granted_via: 'touch' }
        ],
        token_number: response.token_number || 'A-100'
      });
      if (response.token_number) setTokenNumber(response.token_number);
      nextStep();
    } catch (err) {
      console.warn('Walk-in offline fallback:', err.message);
      updatePatient({
        patient_id: 1,
        login_id: 'GUEST-OPD',
        full_name: `Walk-in Patient (आपातकालीन #${randomSuffix})`
      });
      nextStep();
    } finally {
      setIsGuestLoading(false);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto px-2 flex flex-col items-center justify-center">
      
      {/* COMPACT SINGLE CENTRED GLASS CARD */}
      <div
        className={`w-full rounded-3xl p-5 sm:p-7 text-center transition-all duration-300 border backdrop-blur-xl shadow-2xl ${
          isLight
            ? 'bg-white/95 border-slate-200/90 shadow-slate-300/40 text-slate-900'
            : 'bg-slate-900/90 border-slate-700/80 shadow-slate-950/60 text-white'
        }`}
      >
        {/* Top Header Row with Brand & Theme Toggle */}
        <div className="flex items-center justify-between mb-3">
          <div className="w-9 h-9" /> {/* Spacer */}
          
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-400 to-cyan-600 flex items-center justify-center shadow-md shadow-cyan-500/25">
            <HeartPulse className="w-7 h-7 text-slate-950 stroke-[2.5]" />
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            className={`p-2 rounded-xl border transition-all cursor-pointer ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-amber-600'
                : 'bg-slate-800 hover:bg-slate-750 border-slate-700 text-amber-400'
            }`}
            title={isLight ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          >
            {isLight ? <Moon className="w-5 h-5 fill-amber-500" /> : <Sun className="w-5 h-5 fill-amber-400" />}
          </button>
        </div>

        <h1 className="text-xl sm:text-3xl font-black tracking-tight mb-1">
          Medi<span className="text-cyan-500">Kiosk</span> Intake
        </h1>
        <p className={`text-xs sm:text-sm font-medium mb-4 ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
          Conversational OPD Case-Taking & Triage Platform
        </p>

        {errorMsg && (
          <div className="mb-4 p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-500 flex items-center gap-2 text-xs animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="font-medium">{errorMsg}</span>
          </div>
        )}

        {/* Input Field (ABHA or Mobile) */}
        <div className="mb-4 text-left space-y-1">
          <label className={`block text-[11px] font-bold uppercase tracking-wider ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
            Enter ABHA Number or Mobile (Optional)
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <User className="w-4 h-4 text-cyan-500" />
            </div>
            <input
              type="text"
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              placeholder="e.g. 9876543210 or ABHA ID"
              className={`w-full h-12 pl-10 pr-3 rounded-xl border text-sm font-medium placeholder-slate-400 focus:outline-none transition-all ${
                isLight
                  ? 'border-slate-300 bg-slate-50 text-slate-900 focus:border-cyan-500 focus:bg-white'
                  : 'border-slate-700 bg-slate-950 text-white focus:border-cyan-400'
              }`}
            />
          </div>
        </div>

        {/* Primary Single Button: Start OPD Intake */}
        <button
          type="button"
          disabled={isSubmitting || isGuestLoading}
          onClick={loginId.trim() ? handleSubmit : handleInstantWalkIn}
          className="w-full h-14 rounded-2xl bg-gradient-to-r from-teal-400 via-cyan-500 to-emerald-400 hover:from-teal-300 hover:to-emerald-300 text-slate-950 font-black text-base sm:text-lg flex items-center justify-center gap-2.5 shadow-lg shadow-cyan-500/25 transition-all active:scale-98 cursor-pointer disabled:opacity-50"
        >
          {isSubmitting || isGuestLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin stroke-[2.5]" />
              <span>Starting Kiosk Intake...</span>
            </>
          ) : (
            <>
              <span>Start OPD Intake / आरंभ करें</span>
              <ArrowRight className="w-5 h-5 stroke-[3]" />
            </>
          )}
        </button>

        {/* 1-Tap Quick Demo Patient Square Form Cards */}
        <div className="mt-4 pt-3 border-t border-slate-700/30 flex flex-col gap-1.5">
          <span className={`text-xs font-black uppercase tracking-wider ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
            Or select 1-Tap Demo Patient:
          </span>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => handleDemoProfileSelect({
                login_id: 'RAVI45',
                full_name: 'Ravi Patel',
                age: 45,
                gender: 'Male',
                demo_chief_complaint: 'Acute Chest Pain',
                fallback_id: 101
              })}
              className={`p-3 rounded-xl border-2 font-black transition text-left flex flex-col justify-between min-h-[85px] ${
                isLight
                  ? 'bg-rose-50 hover:bg-rose-100 border-rose-300 text-rose-950 shadow-xs'
                  : 'bg-rose-950/40 hover:bg-rose-900/50 border-rose-600 text-rose-200 shadow-xs'
              }`}
            >
              <div className="text-xs font-black text-rose-500 uppercase">Emergency</div>
              <div className="text-sm font-black">⚠️ Ravi Patel (Chest Pain)</div>
            </button>
            <button
              type="button"
              onClick={() => handleDemoProfileSelect({
                login_id: 'PRIYA32',
                full_name: 'Priya Shah',
                age: 32,
                gender: 'Female',
                demo_chief_complaint: 'Fever & Digestion',
                fallback_id: 102
              })}
              className={`p-3 rounded-xl border-2 font-black transition text-left flex flex-col justify-between min-h-[85px] ${
                isLight
                  ? 'bg-emerald-50 hover:bg-emerald-100 border-emerald-300 text-emerald-950 shadow-xs'
                  : 'bg-emerald-950/40 hover:bg-emerald-900/50 border-emerald-600 text-emerald-200 shadow-xs'
              }`}
            >
              <div className="text-xs font-black text-emerald-500 uppercase">Ayush OPD</div>
              <div className="text-sm font-black">🌿 Priya Shah (Fever & Digestion)</div>
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};

export default PatientLogin;
