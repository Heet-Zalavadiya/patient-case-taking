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
  HeartPulse
} from 'lucide-react';

export const PatientLogin = () => {
  const { 
    patientData, 
    theme,
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
    <div className="w-full max-w-5xl mx-auto px-1 sm:px-4 flex flex-col">
      
      {/* Page Title & Subtitle in English & Hindi */}
      <div className="mt-1 sm:mt-2 mb-3 sm:mb-4 text-center">
        <div
          className={`inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-semibold mb-2 border ${
            isLight
              ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500 shrink-0" />
          <span className="truncate max-w-[280px] sm:max-w-none">Ayush Hospital OPD Kiosk Check-In / आयुष अस्पताल ओपीडी चेक-इन</span>
        </div>
        <h2 className={`text-xl sm:text-3xl font-black tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
          Patient Identification & Login
        </h2>
        <p className="text-emerald-500 font-semibold text-sm sm:text-lg mt-0.5">
          मरीज़ पहचान एवं लॉगिन
        </p>
        <p className={`text-xl sm:text-xl mt-1 max-w-xl mx-auto ${isLight ? 'text-blue-800' : 'text-blue-900'}`}>
          Enter your ABHA Number, Mobile, or Kiosk PIN / अपना आभा नंबर, मोबाइल या 4-अंकीय पिन दर्ज करें
        </p>
      </div>

      {/* Main Grid: Form on Left, Keypad & Emergency on Right */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 items-start">
        
        {/* LEFT COLUMN: Input Form */}
        <div className="space-y-4">
          
          {/* Main Card */}
          <div
            className={`rounded-3xl p-4 sm:p-7 transition-colors duration-300 ${
              isLight
                ? 'bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-xl shadow-slate-300/30 text-slate-900'
                : 'bg-slate-900/85 backdrop-blur-md border border-slate-700/60 shadow-2xl shadow-emerald-950/40 text-white'
            }`}
          >
            {/* Quick Demo Test Profiles Bar (SIH26047 Day 4 Demo Prep) */}
            <div
              className={`mb-5 p-3.5 rounded-2xl border transition-colors ${
                isLight
                  ? 'bg-slate-100/90 border-slate-200'
                  : 'bg-slate-950/70 border-slate-800/80'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <span className={`text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  <span>1-Tap Live Demo Profiles (तत्काल डेमो मरीज):</span>
                </span>
              </div>

              {/* 2 Pre-configured 1-Tap Live Demo Profiles */}
              <div className="grid grid-cols-1 gap-2 mb-2.5">
                
                {/* Button 1: Ravi Patel (Red-Flag Triage Demo) */}
                <button
                  type="button"
                  onClick={() => handleDemoProfileSelect({
                    login_id: 'RAVI45',
                    full_name: 'Ravi Patel',
                    age: 45,
                    gender: 'Male',
                    demo_chief_complaint: 'Acute Chest Pain with Breathlessness',
                    fallback_id: 101
                  })}
                  className={`w-full p-2.5 rounded-xl text-left border text-xs font-bold transition flex items-center justify-between gap-2 cursor-pointer shadow-sm ${
                    isLight
                      ? 'bg-rose-50 hover:bg-rose-100/80 border-rose-300 text-rose-900'
                      : 'bg-rose-950/40 hover:bg-rose-900/50 border-rose-800/60 text-rose-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">⚠️</span>
                    <div>
                      <div className="font-black text-xs sm:text-sm">Demo Case 1: Ravi Patel (Age 45 • Red-Flag Triage Demo ⚠️)</div>
                      <div className={`text-[11px] font-normal ${isLight ? 'text-rose-700' : 'text-rose-300'}`}>
                        Complaint: "Acute Chest Pain with Breathlessness" • 1-Tap Login
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 shrink-0 text-rose-500" />
                </button>

                {/* Button 2: Priya Shah (Routine AYUSH OPD) */}
                <button
                  type="button"
                  onClick={() => handleDemoProfileSelect({
                    login_id: 'PRIYA32',
                    full_name: 'Priya Shah',
                    age: 32,
                    gender: 'Female',
                    demo_chief_complaint: 'Viral Fever & Mild Digestion Issue',
                    fallback_id: 102
                  })}
                  className={`w-full p-2.5 rounded-xl text-left border text-xs font-bold transition flex items-center justify-between gap-2 cursor-pointer shadow-sm ${
                    isLight
                      ? 'bg-emerald-50 hover:bg-emerald-100/80 border-emerald-300 text-emerald-900'
                      : 'bg-emerald-950/40 hover:bg-emerald-900/50 border-emerald-800/60 text-emerald-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">🌿</span>
                    <div>
                      <div className="font-black text-xs sm:text-sm">Demo Case 2: Priya Shah (Age 32 • Routine AYUSH OPD)</div>
                      <div className={`text-[11px] font-normal ${isLight ? 'text-emerald-700' : 'text-emerald-300'}`}>
                        Complaint: "Viral Fever & Mild Digestion Issue" • 1-Tap Login
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 shrink-0 text-emerald-500" />
                </button>

              </div>

              {/* Auxiliary Quick-Fill Testing Shortcuts */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1.5 border-t border-slate-700/30">
                <span className={`text-[10px] uppercase font-bold mr-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Quick Fill:</span>
                <button
                  type="button"
                  onClick={() => handleQuickDemo('AYUSH9901', 'password123')}
                  className={`px-2 py-1 rounded-md text-[11px] font-semibold border transition ${
                    isLight
                      ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
                      : 'bg-slate-800 hover:bg-slate-750 text-slate-300 border-slate-700'
                  }`}
                >
                  👤 Rajesh (AYUSH9901)
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDemo('9876543210', '123')}
                  className={`px-2 py-1 rounded-md text-[11px] font-semibold border transition ${
                    isLight
                      ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
                      : 'bg-slate-800 hover:bg-slate-750 text-slate-300 border-slate-700'
                  }`}
                >
                  👩 Dr. Sunita (9876543210)
                </button>
              </div>
            </div>

            {errorMsg && (
              <div className="mb-5 p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-500 flex items-center gap-3 text-sm animate-in fade-in">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span className="font-medium">{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Field 1: ABHA ID / Mobile Number / Login ID */}
              <div className="space-y-1.5">
                <div className="flex items-baseline justify-between">
                  <label className={`block text-sm sm:text-base font-bold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                    ABHA ID / Mobile Number / Login ID <span className="text-emerald-500">*</span>
                  </label>
                  <span className="text-xs font-medium text-emerald-500">आभा आईडी / मोबाइल नंबर</span>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-6 h-6 text-emerald-500" />
                  </div>
                  <input
                    ref={loginInputRef}
                    type="text"
                    value={loginId}
                    onFocus={() => setActiveInput('loginId')}
                    onChange={(e) => {
                      setLoginId(e.target.value);
                      setErrorMsg('');
                    }}
                    placeholder="e.g. 9876543210 or 12-3456-7890"
                    className={`w-full h-12 sm:h-14 pl-12 sm:pl-14 pr-4 rounded-2xl border text-base sm:text-lg font-medium placeholder-slate-400 focus:outline-none transition-all shadow-inner ${
                      isLight
                        ? activeInput === 'loginId'
                          ? 'border-emerald-500 ring-2 ring-emerald-500/30 bg-white text-slate-900'
                          : 'border-slate-300 bg-slate-50 text-slate-900 hover:border-slate-400'
                        : activeInput === 'loginId'
                        ? 'border-emerald-400 ring-2 ring-emerald-500/30 bg-slate-950 text-white'
                        : 'border-slate-700 bg-slate-950 text-white hover:border-slate-600'
                    }`}
                    autoComplete="off"
                  />
                </div>
              </div>

              {/* Field 2: Password / 4-Digit PIN */}
              <div className="space-y-1.5">
                <div className="flex items-baseline justify-between">
                  <label className={`block text-sm sm:text-base font-bold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                    Security PIN / Password <span className={`text-xs font-normal ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>(Default: 123)</span>
                  </label>
                  <span className="text-xs font-medium text-emerald-500">4-अंकीय पिन / पासवर्ड</span>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 sm:pl-4.5 flex items-center pointer-events-none text-slate-400">
                    <KeyRound className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-500" />
                  </div>
                  <input
                    ref={passwordInputRef}
                    type="password"
                    value={password}
                    onFocus={() => setActiveInput('password')}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setErrorMsg('');
                    }}
                    placeholder="Enter 4-digit PIN or Password"
                    className={`w-full h-12 sm:h-14 pl-12 sm:pl-14 pr-4 rounded-2xl border text-base sm:text-lg font-medium placeholder-slate-400 focus:outline-none transition-all shadow-inner ${
                      isLight
                        ? activeInput === 'password'
                          ? 'border-emerald-500 ring-2 ring-emerald-500/30 bg-white text-slate-900'
                          : 'border-slate-300 bg-slate-50 text-slate-900 hover:border-slate-400'
                        : activeInput === 'password'
                        ? 'border-emerald-400 ring-2 ring-emerald-500/30 bg-slate-950 text-white'
                        : 'border-slate-700 bg-slate-950 text-white hover:border-slate-600'
                    }`}
                  />
                </div>
              </div>

              {/* Prominent Green CTA Button */}
              <button
                type="submit"
                disabled={isSubmitting || isGuestLoading}
                className="w-full h-12 sm:h-14 rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-base sm:text-lg flex items-center justify-center gap-2.5 shadow-xl shadow-emerald-500/25 transition-all active:scale-98 disabled:opacity-50 cursor-pointer mt-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin stroke-[2.5]" />
                    <span>Verifying / सत्यापन हो रहा है...</span>
                  </>
                ) : (
                  <>
                    <span>Continue / आगे बढ़ें</span>
                    <ArrowRight className="w-5 h-5 stroke-[3]" />
                  </>
                )}
              </button>

            </form>
          </div>

          {/* Quick ABHA QR Card / Scanner Button */}
          <div
            className={`rounded-2xl p-3 sm:p-4 flex items-center justify-between transition-colors ${
              isLight
                ? 'bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-md text-slate-900'
                : 'bg-slate-900/85 backdrop-blur-md border border-slate-700/60 text-white'
            }`}
          >
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 ${isLight ? 'bg-cyan-50 text-cyan-600' : 'bg-slate-800 text-cyan-400'}`}>
                <QrCode className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <div className="text-xs sm:text-sm font-bold">Scan ABHA Card (आभा कार्ड स्कैन)</div>
                <div className={`text-[11px] sm:text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Hold Ayushman card against scanner</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                handleQuickDemo('14-8899-2311-5544', '123');
              }}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl border font-semibold text-xs transition shrink-0 ${
                isLight
                  ? 'bg-cyan-50 hover:bg-cyan-100 text-cyan-700 border-cyan-300'
                  : 'bg-slate-800 hover:bg-cyan-900/40 text-cyan-300 border-slate-700'
              }`}
            >
              Simulate Scan
            </button>
          </div>

        </div>

        {/* RIGHT COLUMN: Keypad & Instant Emergency Bypass */}
        <div className="space-y-4">
          
          {/* Quick Emergency / Walk-in Bypass Card */}
          <div 
            onClick={!isGuestLoading ? handleInstantWalkIn : undefined}
            className={`group cursor-pointer rounded-3xl p-5 border-2 transition-all duration-300 transform active:scale-98 backdrop-blur-md ${
              isLight
                ? 'bg-gradient-to-br from-rose-50/90 via-white/95 to-amber-50/90 border-rose-300 hover:border-rose-400 shadow-xl shadow-rose-100/40 text-slate-900'
                : 'bg-gradient-to-br from-rose-950/40 via-slate-900/85 to-amber-950/30 border-rose-500/40 hover:border-rose-400 shadow-xl shadow-rose-950/20 text-white'
            }`}
          >
            <div className="flex items-start gap-4">
              <div
                className={`w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform ${
                  isLight
                    ? 'bg-rose-100 border-rose-200 text-rose-600'
                    : 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                }`}
              >
                {isGuestLoading ? (
                  <Loader2 className="w-6 h-6 animate-spin text-rose-500" />
                ) : (
                  <HeartPulse className="w-6 h-6 text-rose-500 animate-pulse" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                      isLight
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-rose-500/20 text-rose-300'
                    }`}
                  >
                    Instant Bypass
                  </span>
                  <span className={`text-xs font-semibold ${isLight ? 'text-amber-700' : 'text-amber-300'}`}>बिना लॉगिन</span>
                </div>
                <h3 className={`text-base sm:text-lg font-black mt-1 group-hover:text-rose-600 transition-colors ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  New Patient / Instant OPD Walk-in
                </h3>
                <p className={`text-xs font-semibold ${isLight ? 'text-rose-700' : 'text-rose-300'}`}>
                  आपातकालीन / नया मरीज़ (सीधा टोकन)
                </p>
                <p className={`text-xs mt-1.5 leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                  No ABHA ID or first time visiting? Tap to auto-generate guest ID (<strong>GUEST-OPD</strong>) and proceed immediately.
                </p>
              </div>
            </div>
            <div
              className={`mt-3 pt-3 border-t flex items-center justify-between text-xs font-bold ${
                isLight
                  ? 'border-rose-200 text-rose-700'
                  : 'border-rose-500/20 text-rose-300'
              }`}
            >
              <span>Skip Login & Generate Token →</span>
              <span className="px-2 py-1 rounded-lg bg-rose-500 text-white font-black shadow-sm">1-TAP CHECK-IN</span>
            </div>
          </div>

          {/* Onscreen Touch Numeric Keypad */}
          <div
            className={`w-full max-w-sm mx-auto rounded-3xl p-4 sm:p-5 shadow-xl transition-colors duration-300 ${
              isLight
                ? 'bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-slate-300/30 text-slate-900'
                : 'bg-slate-900/85 backdrop-blur-md border border-slate-700/60 shadow-emerald-950/30 text-white'
            }`}
          >
            {/* Keypad Header */}
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-2">
                <Keyboard className="w-4 h-4 text-emerald-500" />
                <span className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  Touch Keypad ({activeInput === 'loginId' ? 'ID / Mobile' : 'PIN / Password'})
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setActiveInput(activeInput === 'loginId' ? 'password' : 'loginId')}
                  className={`text-[11px] font-semibold px-2 py-1 rounded-lg border transition ${
                    isLight
                      ? 'text-cyan-700 bg-slate-100 hover:bg-slate-200 border-slate-300'
                      : 'text-cyan-400 hover:text-cyan-300 bg-slate-800 border-slate-700'
                  }`}
                >
                  Switch Field ⇄
                </button>
              </div>
            </div>

            {/* Keypad Grid (3 columns) */}
            <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
              {[
                { label: '1', sub: '' },
                { label: '2', sub: 'ABC' },
                { label: '3', sub: 'DEF' },
                { label: '4', sub: 'GHI' },
                { label: '5', sub: 'JKL' },
                { label: '6', sub: 'MNO' },
                { label: '7', sub: 'PQRS' },
                { label: '8', sub: 'TUV' },
                { label: '9', sub: 'WXYZ' },
                { label: 'CLEAR', action: 'CLEAR', icon: null, text: 'CLR' },
                { label: '0', sub: '+' },
                { label: 'BACKSPACE', action: 'BACKSPACE', icon: Delete, text: '' }
              ].map((keyItem, index) => {
                const isSpecial = keyItem.action === 'CLEAR' || keyItem.action === 'BACKSPACE';
                const IconComponent = keyItem.icon;

                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleKeypadPress(keyItem.action || keyItem.label)}
                    className={`h-14 sm:h-16 rounded-2xl font-bold transition-all active:scale-95 flex flex-col items-center justify-center cursor-pointer select-none shadow-md ${
                      isSpecial
                        ? keyItem.action === 'BACKSPACE'
                          ? isLight
                            ? 'bg-rose-100 hover:bg-rose-200 text-rose-700 border border-rose-300'
                            : 'bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 border border-rose-800/40'
                          : isLight
                          ? 'bg-amber-100 hover:bg-amber-200 text-amber-800 border border-amber-300 text-sm'
                          : 'bg-amber-950/40 hover:bg-amber-900/50 text-amber-300 border border-amber-800/40 text-sm'
                        : isLight
                        ? 'bg-slate-100/90 hover:bg-slate-200 text-slate-900 border border-slate-200 text-xl hover:border-emerald-500/50 hover:text-emerald-700 shadow-sm'
                        : 'bg-slate-800/90 hover:bg-slate-750 text-white border border-slate-700/80 text-xl hover:border-emerald-500/50 hover:text-emerald-300'
                    }`}
                  >
                    {IconComponent ? (
                      <IconComponent className="w-5 h-5" />
                    ) : (
                      <>
                        <span className="leading-tight">{keyItem.text || keyItem.label}</span>
                        {keyItem.sub && (
                          <span className={`text-[9px] font-normal tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                            {keyItem.sub}
                          </span>
                        )}
                      </>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Common Prefixes Bar */}
            <div className={`mt-3 pt-3 border-t grid grid-cols-4 gap-1.5 ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
              {['98', '99', '91', '01'].map((prefix) => (
                <button
                  key={prefix}
                  type="button"
                  onClick={() => handleKeypadPress(prefix)}
                  className={`py-1.5 rounded-xl border text-xs font-semibold transition ${
                    isLight
                      ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
                      : 'bg-slate-950 hover:bg-slate-800 border-slate-800 text-slate-300'
                  }`}
                >
                  +{prefix}
                </button>
              ))}
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};

export default PatientLogin;
