import React, { useState } from 'react';
import { usePatient } from '../../context/PatientContext';
import { apiRegisterOrLoginPatient } from '../../services/api';
import { 
  User, 
  Phone, 
  Calendar, 
  MapPin, 
  Stethoscope, 
  PhoneCall, 
  ArrowRight, 
  Sparkles, 
  ShieldCheck, 
  AlertCircle,
  Loader2,
  CheckCircle2,
  HeartPulse,
  Sun,
  Moon,
  Zap,
  CreditCard,
  Flame,
  Bot
} from 'lucide-react';

export const PatientLogin = () => {
  const { 
    patientData, 
    theme,
    toggleTheme,
    updatePatient,
    setHistoryMode, 
    nextStep, 
    setTokenNumber
  } = usePatient();

  const isLight = theme === 'light';

  // Patient Registration Form State
  const [fullName, setFullName] = useState(patientData.full_name || '');
  const [age, setAge] = useState(patientData.age || '');
  const [gender, setGender] = useState(patientData.gender || 'Male');
  const [loginId, setLoginId] = useState(patientData.login_id || '');
  const [historyMode, setLocalHistoryMode] = useState(patientData.history_mode || 'allopathic'); // 'allopathic' | 'ayush'
  const [chiefComplaint, setChiefComplaint] = useState(patientData.demo_chief_complaint || '');
  const [address, setAddress] = useState(patientData.address || '');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGuestLoading, setIsGuestLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // 1-Tap Demo Patient Preset Selection
  const handleDemoProfileSelect = async (profile) => {
    const targetMode = profile.history_mode || 'allopathic';
    setFullName(profile.full_name);
    setAge(profile.age);
    setGender(profile.gender);
    setLoginId(profile.login_id);
    setLocalHistoryMode(targetMode);
    setChiefComplaint(profile.demo_chief_complaint);
    setAddress(profile.address || 'Ahmedabad, Gujarat');
    setErrorMsg('');

    setIsSubmitting(true);

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

      setHistoryMode(targetMode);
      updatePatient({
        patient_id: patientId,
        login_id: profile.login_id,
        full_name: profile.full_name,
        age: profile.age,
        gender: profile.gender,
        history_mode: targetMode,
        demo_chief_complaint: profile.demo_chief_complaint,
        address: profile.address || 'Ahmedabad, Gujarat',
        preferred_language: patientData.preferred_language || 'Hindi',
        accessibility_mode: patientData.accessibility_mode || 'standard',
        token_number: response.token_number || patientData.token_number || 'A-101'
      });

      if (response.token_number) setTokenNumber(response.token_number);
      nextStep();
    } catch (err) {
      console.warn('Demo profile login offline fallback:', err.message);
      setHistoryMode(targetMode);
      updatePatient({
        patient_id: profile.fallback_id || 1,
        login_id: profile.login_id,
        full_name: profile.full_name,
        age: profile.age,
        gender: profile.gender,
        history_mode: targetMode,
        demo_chief_complaint: profile.demo_chief_complaint,
        address: profile.address || 'Ahmedabad, Gujarat'
      });
      nextStep();
    } finally {
      setIsSubmitting(false);
    }
  };

  // Main Form Submission Handler
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    if (!fullName.trim()) {
      setErrorMsg('कृपया मरीज़ का पूरा नाम दर्ज करें (Please enter patient full name).');
      return;
    }

    if (!loginId.trim()) {
      setErrorMsg('कृपया मोबाइल नंबर या आभा आईडी दर्ज करें (Please enter mobile or ABHA ID).');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    const effectiveLoginId = loginId.trim();

    try {
      const response = await apiRegisterOrLoginPatient({
        login_id: effectiveLoginId,
        password: '123',
        full_name: fullName.trim(),
        age: age ? Number(age) : undefined,
        gender: gender,
        preferred_language: patientData.preferred_language || 'Hindi',
        accessibility_mode: patientData.accessibility_mode || 'standard'
      });

      const patientObj = response?.patient || response || {};
      const assignedPatientId = response?.patient_id || patientObj.patient_id || Math.floor(100 + Math.random() * 900);

      setHistoryMode(historyMode);
      updatePatient({
        patient_id: assignedPatientId,
        login_id: effectiveLoginId,
        full_name: fullName.trim(),
        age: age ? Number(age) : null,
        gender: gender,
        history_mode: historyMode,
        demo_chief_complaint: chiefComplaint.trim(),
        address: address.trim(),
        preferred_language: patientObj.preferred_language || patientData.preferred_language || 'Hindi',
        accessibility_mode: patientObj.accessibility_mode || patientData.accessibility_mode || 'standard',
        token_number: response.token_number || patientData.token_number || 'A-101'
      });

      if (response?.token_number) setTokenNumber(response.token_number);
      nextStep();
    } catch (err) {
      console.warn('Registration fallback notice:', err.message);
      setHistoryMode(historyMode);
      updatePatient({
        patient_id: 101,
        login_id: effectiveLoginId,
        full_name: fullName.trim(),
        age: age ? Number(age) : null,
        gender: gender,
        history_mode: historyMode,
        demo_chief_complaint: chiefComplaint.trim(),
        address: address.trim()
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
    const guestName = `Walk-in Patient (आपातकालीन #${randomSuffix})`;

    try {
      const response = await apiRegisterOrLoginPatient({
        login_id: guestId,
        password: 'guest123',
        full_name: guestName,
        preferred_language: patientData.preferred_language || 'Hindi',
        accessibility_mode: patientData.accessibility_mode || 'standard'
      });

      const patientObj = response?.patient || response || {};
      const assignedPatientId = response?.patient_id || patientObj.patient_id || 1;

      setHistoryMode(historyMode);
      updatePatient({
        patient_id: assignedPatientId,
        login_id: guestId,
        full_name: guestName,
        age: 35,
        gender: 'Male',
        history_mode: historyMode,
        demo_chief_complaint: 'Emergency Walk-in Triage',
        token_number: response?.token_number || 'A-100'
      });

      if (response?.token_number) setTokenNumber(response.token_number);
      nextStep();
    } catch (err) {
      console.warn('Walk-in offline fallback:', err.message);
      setHistoryMode(historyMode);
      updatePatient({
        patient_id: 1,
        login_id: guestId,
        full_name: guestName,
        history_mode: historyMode
      });
      nextStep();
    } finally {
      setIsGuestLoading(false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto px-2 flex flex-col items-center justify-center py-2">
      
      {/* RICH PATIENT ONBOARDING FORM CARD */}
      <div
        className={`w-full rounded-3xl p-5 sm:p-6 text-center transition-all duration-300 border backdrop-blur-xl shadow-2xl ${
          isLight
            ? 'bg-white/95 border-slate-200 shadow-slate-300/40 text-slate-900'
            : 'bg-slate-900/90 border-slate-700/80 shadow-slate-950/60 text-white'
        }`}
      >
        {/* Top Header Row with Brand & Theme Toggle */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-teal-400 to-cyan-600 flex items-center justify-center shadow-md shadow-cyan-500/25">
              <HeartPulse className="w-6 h-6 text-slate-950 stroke-[2.5]" />
            </div>
            <div className="text-left">
              <h1 className="text-lg sm:text-xl font-black tracking-tight leading-none">
                Medi<span className="text-cyan-500">Kiosk</span> Intake
              </h1>
              <span className={`text-[10px] font-bold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Patient Onboarding & Triage Form
              </span>
            </div>
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
            {isLight ? <Moon className="w-4 h-4 fill-amber-500" /> : <Sun className="w-4 h-4 fill-amber-400" />}
          </button>
        </div>

        {errorMsg && (
          <div className="my-2 p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-500 flex items-center gap-2 text-xs text-left animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="font-semibold">{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 text-left mt-3">
          
          {/* 1. FULL NAME & AGE ROW */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* Full Name (col-span-2) */}
            <div className="sm:col-span-2 space-y-1">
              <label className={`block text-[11px] font-black uppercase tracking-wider ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                Full Name / नाम <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-cyan-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Ramesh Patel / रमेंश पटेल"
                  className={`w-full h-11 pl-9 pr-3 rounded-xl border text-xs sm:text-sm font-bold placeholder-slate-400 focus:outline-none transition-all ${
                    isLight
                      ? 'border-slate-300 bg-slate-50 text-slate-900 focus:border-cyan-500 focus:bg-white'
                      : 'border-slate-700 bg-slate-950 text-white focus:border-cyan-400'
                  }`}
                />
              </div>
            </div>

            {/* Age (col-span-1) */}
            <div className="space-y-1">
              <label className={`block text-[11px] font-black uppercase tracking-wider ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                Age / उम्र
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-cyan-500">
                  <Calendar className="w-4 h-4" />
                </div>
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="e.g. 35"
                  className={`w-full h-11 pl-9 pr-3 rounded-xl border text-xs sm:text-sm font-bold placeholder-slate-400 focus:outline-none transition-all ${
                    isLight
                      ? 'border-slate-300 bg-slate-50 text-slate-900 focus:border-cyan-500 focus:bg-white'
                      : 'border-slate-700 bg-slate-950 text-white focus:border-cyan-400'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* 2. GENDER & MOBILE / ABHA ID ROW */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* Gender Selector (col-span-1) */}
            <div className="space-y-1">
              <label className={`block text-[11px] font-black uppercase tracking-wider ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                Gender / लिंग
              </label>
              <div className="grid grid-cols-3 gap-1">
                {['Male', 'Female', 'Other'].map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGender(g)}
                    className={`h-11 rounded-xl border text-xs font-black transition cursor-pointer flex items-center justify-center ${
                      gender === g
                        ? isLight
                          ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-sm'
                          : 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-sm'
                        : isLight
                        ? 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                        : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    {g === 'Male' ? 'M' : g === 'Female' ? 'F' : 'O'}
                  </button>
                ))}
              </div>
            </div>

            {/* Mobile or ABHA ID (col-span-2) */}
            <div className="sm:col-span-2 space-y-1">
              <label className={`block text-[11px] font-black uppercase tracking-wider ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                Mobile / ABHA ID <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-cyan-500">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  placeholder="e.g. 9876543210 or ABHA ID"
                  className={`w-full h-11 pl-9 pr-3 rounded-xl border text-xs sm:text-sm font-bold placeholder-slate-400 focus:outline-none transition-all ${
                    isLight
                      ? 'border-slate-300 bg-slate-50 text-slate-900 focus:border-cyan-500 focus:bg-white'
                      : 'border-slate-700 bg-slate-950 text-white focus:border-cyan-400'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* 3. CONSULTATION SYSTEM PROTOCOL SELECTOR: ALLOPATHIC VS AYUSH */}
          <div className="space-y-1">
            <label className={`block text-[11px] font-black uppercase tracking-wider ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
              Consultation Protocol / चिकित्सा प्रणाली चुनें <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setLocalHistoryMode('allopathic')}
                className={`p-2.5 rounded-xl border-2 font-black transition text-left flex items-center gap-2 cursor-pointer shadow-xs ${
                  historyMode === 'allopathic'
                    ? isLight
                      ? 'bg-cyan-50 border-cyan-500 text-cyan-950 ring-2 ring-cyan-500/20'
                      : 'bg-cyan-950/60 border-cyan-400 text-cyan-200 ring-2 ring-cyan-400/20'
                    : isLight
                    ? 'bg-slate-50 border-slate-300 text-slate-700 hover:bg-slate-100'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-cyan-500 text-slate-950 flex items-center justify-center shrink-0">
                  <Stethoscope className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div>
                  <div className="text-xs font-black">🩺 Allopathic Triage</div>
                  <div className="text-[10px] text-slate-400 font-bold">SOCRATES Clinical Intake</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setLocalHistoryMode('ayush')}
                className={`p-2.5 rounded-xl border-2 font-black transition text-left flex items-center gap-2 cursor-pointer shadow-xs ${
                  historyMode === 'ayush'
                    ? isLight
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-950 ring-2 ring-emerald-500/20'
                      : 'bg-emerald-950/60 border-emerald-400 text-emerald-200 ring-2 ring-emerald-400/20'
                    : isLight
                    ? 'bg-slate-50 border-slate-300 text-slate-700 hover:bg-slate-100'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-500 text-slate-950 flex items-center justify-center shrink-0">
                  <Flame className="w-4 h-4 text-amber-300 fill-amber-300 shrink-0" />
                </div>
                <div>
                  <div className="text-xs font-black">🌿 Ayush Agni Triage</div>
                  <div className="text-[10px] text-slate-400 font-bold">Ayurvedic Dashavidha</div>
                </div>
              </button>
            </div>
          </div>

          {/* 4. CHIEF COMPLAINT / SYMPTOMS */}
          <div className="space-y-1">
            <label className={`block text-[11px] font-black uppercase tracking-wider ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
              Chief Complaint / स्वास्थ समस्या (Optional)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-cyan-500">
                <Stethoscope className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={chiefComplaint}
                onChange={(e) => setChiefComplaint(e.target.value)}
                placeholder="e.g. Chest pain, fever, severe headache, stomach ache..."
                className={`w-full h-11 pl-9 pr-3 rounded-xl border text-xs sm:text-sm font-bold placeholder-slate-400 focus:outline-none transition-all ${
                  isLight
                    ? 'border-slate-300 bg-slate-50 text-slate-900 focus:border-cyan-500 focus:bg-white'
                    : 'border-slate-700 bg-slate-950 text-white focus:border-cyan-400'
                }`}
              />
            </div>
          </div>

          {/* 5. ADDRESS / CITY */}
          <div className="space-y-1">
            <label className={`block text-[11px] font-black uppercase tracking-wider ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
              Address / City / निवास स्थान (Optional)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-cyan-500">
                <MapPin className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. Sector 5, Gandhinagar, Gujarat"
                className={`w-full h-11 pl-9 pr-3 rounded-xl border text-xs sm:text-sm font-bold placeholder-slate-400 focus:outline-none transition-all ${
                  isLight
                    ? 'border-slate-300 bg-slate-50 text-slate-900 focus:border-cyan-500 focus:bg-white'
                    : 'border-slate-700 bg-slate-950 text-white focus:border-cyan-400'
                }`}
              />
            </div>
          </div>

          {/* SUBMIT BUTTON */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting || isGuestLoading}
              className="w-full h-13 rounded-2xl bg-gradient-to-r from-teal-400 via-cyan-500 to-emerald-400 hover:from-teal-300 hover:to-emerald-300 text-slate-950 font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 transition-all active:scale-98 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin stroke-[2.5]" />
                  <span>Registering Patient Details...</span>
                </>
              ) : (
                <>
                  <span>Save Details & Proceed to Language / आगे बढ़ें</span>
                  <ArrowRight className="w-5 h-5 stroke-[2.5]" />
                </>
              )}
            </button>
          </div>

        </form>

        {/* QUICK EMERGENCY & DEMO PATIENTS SECTION */}
        <div className="mt-3 pt-3 border-t border-slate-700/30 space-y-2">
          
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-black uppercase tracking-wider ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
              Or Select 1-Tap Quick Patient Preset:
            </span>
            
            <button
              type="button"
              disabled={isGuestLoading}
              onClick={handleInstantWalkIn}
              className="text-[11px] font-black text-rose-500 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Emergency Walk-in</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleDemoProfileSelect({
                login_id: 'RAVI45',
                full_name: 'Ravi Patel',
                age: 45,
                gender: 'Male',
                history_mode: 'allopathic',
                demo_chief_complaint: 'Acute Chest Pain',
                address: 'Surat, Gujarat',
                fallback_id: 101
              })}
              className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition active:scale-98 cursor-pointer min-h-[75px] ${
                isLight
                  ? 'bg-rose-50 hover:bg-rose-100 border-rose-300 text-rose-950'
                  : 'bg-rose-950/40 hover:bg-rose-900/50 border-rose-600 text-rose-200'
              }`}
            >
              <div className="text-[10px] font-black text-rose-500 uppercase">Emergency (Allopathic)</div>
              <div className="text-xs font-black">⚠️ Ravi Patel (45, M)</div>
              <div className="text-[10px] text-slate-400 font-medium truncate">Chest pain & tightness</div>
            </button>

            <button
              type="button"
              onClick={() => handleDemoProfileSelect({
                login_id: 'PRIYA32',
                full_name: 'Priya Shah',
                age: 32,
                gender: 'Female',
                history_mode: 'ayush',
                demo_chief_complaint: 'Fever & Digestion (Mandagni)',
                address: 'Ahmedabad, Gujarat',
                fallback_id: 102
              })}
              className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition active:scale-98 cursor-pointer min-h-[75px] ${
                isLight
                  ? 'bg-emerald-50 hover:bg-emerald-100 border-emerald-300 text-emerald-950'
                  : 'bg-emerald-950/40 hover:bg-emerald-900/50 border-emerald-600 text-emerald-200'
              }`}
            >
              <div className="text-[10px] font-black text-emerald-500 uppercase">Ayush Profile</div>
              <div className="text-xs font-black">🌿 Priya Shah (32, F)</div>
              <div className="text-[10px] text-slate-400 font-medium truncate">Fever & digestion</div>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};

export default PatientLogin;
