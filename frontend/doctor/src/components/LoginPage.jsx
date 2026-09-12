import React, { useState } from 'react';
import { 
  HeartPulse, 
  ShieldCheck, 
  Stethoscope, 
  Sparkles, 
  Lock, 
  User, 
  Check, 
  ArrowRight, 
  Zap, 
  Clock, 
  Building2,
  AlertCircle,
  Sun,
  Moon,
  KeyRound
} from 'lucide-react';
import { doctors } from '../data/mockData';

export const LoginPage = ({ onLoginSuccess, theme = 'dark', onToggleTheme }) => {
  const isDark = theme === 'dark';
  const [selectedDoctorIndex, setSelectedDoctorIndex] = useState(0);
  const [loginId, setLoginId] = useState(doctors[0]?.login_id || 'dr.anand');
  const [password, setPassword] = useState('Doctor@123');
  const [isAyushPractitioner, setIsAyushPractitioner] = useState(doctors[0]?.is_ayush_practitioner ?? true);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Switch doctor preset
  const handleSelectDoctorPreset = (doc, idx) => {
    setSelectedDoctorIndex(idx);
    setLoginId(doc.login_id);
    setIsAyushPractitioner(doc.is_ayush_practitioner);
    setErrorMsg('');
  };

  // Toggle active medical department tab
  const handleToggleAyush = (value) => {
    setIsAyushPractitioner(value);
    const matched = doctors.find(d => d.is_ayush_practitioner === value);
    if (matched) {
      setLoginId(matched.login_id);
    }
  };

  // Auto-detect doctor if user edits loginId text field directly
  const handleLoginIdChange = (e) => {
    const val = e.target.value;
    setLoginId(val);
    const trimmed = val.trim().toLowerCase();
    const docMatch = doctors.find(d => d.login_id.toLowerCase() === trimmed);
    if (docMatch) {
      setIsAyushPractitioner(docMatch.is_ayush_practitioner);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    setTimeout(() => {
      const trimmedId = loginId.trim().toLowerCase();
      // Match doctor by exact or partial login_id or name
      const matched = doctors.find(
        d => d.login_id.toLowerCase() === trimmedId || 
             d.name.toLowerCase().includes(trimmedId)
      );

      let activeDoctor;
      if (matched) {
        // Authenticate into that specific known doctor
        activeDoctor = { ...matched };
      } else {
        // Dynamic doctor profile for custom login
        activeDoctor = {
          doctor_id: isAyushPractitioner ? "doc_custom_ayush" : "doc_custom_allopathic",
          login_id: loginId.trim() || (isAyushPractitioner ? 'dr.anand' : 'dr.rajesh'),
          name: isAyushPractitioner ? "Dr. Anand Kulkarni" : "Dr. Rajesh Sharma",
          qualification: isAyushPractitioner ? "BAMS, MD (Ayurveda)" : "MBBS, MD (Internal Medicine)",
          department: isAyushPractitioner ? "General Medicine & Kayachikitsa" : "Department of Clinical Medicine",
          institution: "All India Institute of Ayurveda • Ministry of AYUSH",
          is_ayush_practitioner: isAyushPractitioner,
          avatar: isAyushPractitioner 
            ? "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80"
            : "https://images.unsplash.com/photo-1594824813580-77a83d78c3b7?w=150&auto=format&fit=crop&q=80",
          active_opd_room: isAyushPractitioner ? "OPD Room #14" : "OPD Room #104"
        };
      }

      setIsLoading(false);
      onLoginSuccess(activeDoctor);
    }, 350);
  };

  return (
    <div className={`min-h-screen w-full flex flex-col justify-between relative overflow-hidden font-sans select-none transition-colors duration-200 ${
      isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      
      {/* Background Medical Ambient Glow & Grid Lines matching Patient UI */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className={`absolute top-0 left-1/4 w-[600px] h-[350px] rounded-full blur-[140px] ${
          isDark ? 'bg-cyan-600/10' : 'bg-cyan-500/15'
        }`} />
        <div className={`absolute bottom-0 right-1/4 w-[600px] h-[350px] rounded-full blur-[140px] ${
          isDark ? 'bg-teal-600/10' : 'bg-teal-500/15'
        }`} />
        <div 
          className="absolute inset-0 opacity-[0.03]" 
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.8) 1px, transparent 0)`,
            backgroundSize: '36px 36px'
          }}
        />
      </div>

      {/* Top Header Strip */}
      <header className={`relative z-10 w-full backdrop-blur-xl border-b px-4 sm:px-8 py-3 flex items-center justify-between shadow-lg ${
        isDark ? 'bg-slate-900/90 border-slate-800/80' : 'bg-white/95 border-slate-200 shadow-sm'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-br from-teal-400 to-cyan-600 flex items-center justify-center shadow-lg shadow-cyan-500/25 p-2 shrink-0">
            <HeartPulse className="w-5 h-5 sm:w-6 sm:h-6 text-slate-950 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-lg sm:text-xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Medi<span className="text-cyan-500">Kiosk</span>
              </span>
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-bold text-emerald-500 uppercase tracking-wider">
                DOCTOR PORTAL
              </span>
            </div>
            <p className={`text-[10px] sm:text-[11px] font-medium hidden xs:block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Ministry of Ayush • All India Institute of Ayurveda
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          {onToggleTheme && (
            <button
              onClick={onToggleTheme}
              type="button"
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer shadow-sm ${
                isDark 
                  ? 'bg-slate-800 hover:bg-slate-750 border-slate-700 text-slate-200' 
                  : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
              }`}
            >
              {isDark ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span className="hidden sm:inline">Light</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-cyan-600" />
                  <span className="hidden sm:inline">Dark</span>
                </>
              )}
            </button>
          )}
          <div className={`hidden sm:flex items-center gap-1.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            <ShieldCheck className="w-4 h-4 text-teal-500" />
            <span className="font-semibold text-[11px]">Intranet Secured • ABDM Node</span>
          </div>
        </div>
      </header>

      {/* Main Login Workspace */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-3 sm:p-6 my-auto">
        <div className="w-full max-w-xl space-y-3.5 sm:space-y-4">
          
          {/* Page Title & Subtitle */}
          <div className="text-center space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs font-semibold shadow-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Ayush Hospital Doctor Portal / आयुष अस्पताल चिकित्सक पोर्टल</span>
            </div>
            <h2 className={`text-2xl sm:text-3xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Physician Consultation Sign In
            </h2>
            <p className="text-emerald-500 font-semibold text-xs sm:text-sm">
              चिकित्सक प्रमाणीकरण एवं ओपीडी कंसोल
            </p>
            <p className={`text-xs sm:text-sm max-w-md mx-auto ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Select your clinical role to review pre-triaged patients, instant AYUSH Prakriti assessments, and emergency red flags.
            </p>
          </div>

          {/* Main Card */}
          <div className={`backdrop-blur-xl border rounded-3xl p-5 sm:p-7 shadow-2xl transition-all ${
            isDark 
              ? 'bg-slate-900/90 border-slate-800 shadow-cyan-950/40 text-slate-100' 
              : 'bg-white/95 border-slate-200 shadow-slate-200/80 text-slate-900'
          }`}>
            
            {/* Quick 1-Click Doctor Profile Presets */}
            <div className={`mb-5 p-3 sm:p-3.5 rounded-2xl border ${
              isDark ? 'bg-slate-950/70 border-slate-800/80' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <span className={`text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                  isDark ? 'text-slate-400' : 'text-slate-600'
                }`}>
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  <span>Choose Doctor Account (चिकित्सक चयन):</span>
                </span>
                <span className="text-[10px] text-cyan-500 font-semibold">
                  1-Click Select
                </span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {doctors.map((doc, idx) => {
                  const isSelected = loginId.trim().toLowerCase() === doc.login_id.toLowerCase();
                  return (
                    <button
                      key={doc.doctor_id}
                      type="button"
                      onClick={() => handleSelectDoctorPreset(doc, idx)}
                      className={`text-left p-3 sm:p-3.5 rounded-xl sm:rounded-2xl border transition-all cursor-pointer relative ${
                        isSelected
                          ? isDark
                            ? 'bg-cyan-500/15 border-cyan-400 ring-2 ring-cyan-400/30 text-cyan-200 shadow-md shadow-cyan-950/40'
                            : 'bg-cyan-50/90 border-cyan-500 ring-2 ring-cyan-500/30 text-cyan-950 shadow-md shadow-cyan-100'
                          : isDark
                          ? 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300 hover:bg-slate-900'
                          : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0 ${
                            doc.is_ayush_practitioner
                              ? 'bg-gradient-to-br from-amber-400 to-emerald-500 text-slate-950'
                              : 'bg-gradient-to-br from-teal-400 to-cyan-500 text-slate-950'
                          }`}>
                            {doc.name.replace('Dr. ', '').split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </div>
                          <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            {doc.name}
                          </span>
                        </div>
                        {isSelected && (
                          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-cyan-500/20 text-cyan-500 text-[10px] font-bold">
                            <Check className="w-3 h-3 stroke-[3]" />
                            <span>Selected</span>
                          </span>
                        )}
                      </div>

                      <span className={`text-[11px] block truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        {doc.qualification}
                      </span>

                      <div className="mt-2 flex items-center justify-between gap-1.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          doc.is_ayush_practitioner
                            ? 'bg-amber-500/15 text-amber-500 border border-amber-500/30'
                            : 'bg-cyan-500/15 text-cyan-600 border border-cyan-500/30'
                        }`}>
                          {doc.active_opd_room || (doc.is_ayush_practitioner ? 'AYUSH OPD #14' : 'Allopathic OPD #104')}
                        </span>
                        <span className={`text-[10px] font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                          {doc.login_id}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Department Role Switcher Pill */}
            <div className="mb-4">
              <label className={`block text-[11px] font-bold uppercase tracking-wider mb-2 ${
                isDark ? 'text-slate-400' : 'text-slate-600'
              }`}>
                Active Clinical Department:
              </label>
              <div className={`grid grid-cols-2 gap-2 p-1 rounded-2xl border ${
                isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-100 border-slate-200'
              }`}>
                <button
                  type="button"
                  onClick={() => handleToggleAyush(true)}
                  className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isAyushPractitioner
                      ? 'bg-gradient-to-r from-teal-400 to-cyan-500 text-slate-950 shadow-md font-black'
                      : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>AYUSH / Ayurveda</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleAyush(false)}
                  className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    !isAyushPractitioner
                      ? 'bg-gradient-to-r from-teal-400 to-cyan-500 text-slate-950 shadow-md font-black'
                      : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Stethoscope className="w-3.5 h-3.5" />
                  <span>Allopathic Medicine</span>
                </button>
              </div>
            </div>

            {/* Credential Inputs */}
            <form onSubmit={handleSubmit} className="space-y-3.5 sm:space-y-4">
              <div className="space-y-1.5">
                <label className={`block text-xs font-bold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                  Doctor ID / Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 sm:pl-4 flex items-center pointer-events-none">
                    <User className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" />
                  </div>
                  <input
                    type="text"
                    required
                    value={loginId}
                    onChange={handleLoginIdChange}
                    placeholder="e.g. dr.anand or dr.rajesh"
                    className={`w-full h-11 sm:h-12 pl-11 sm:pl-12 pr-4 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 transition-all shadow-inner border ${
                      isDark
                        ? 'bg-slate-950 border-slate-700 text-white placeholder-slate-500 focus:border-cyan-400 focus:ring-cyan-500/30'
                        : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-cyan-600 focus:ring-cyan-500/20'
                    }`}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className={`block text-xs font-bold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                  Security PIN / Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 sm:pl-4 flex items-center pointer-events-none">
                    <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`w-full h-11 sm:h-12 pl-11 sm:pl-12 pr-4 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 transition-all shadow-inner border ${
                      isDark
                        ? 'bg-slate-950 border-slate-700 text-white placeholder-slate-500 focus:border-cyan-400 focus:ring-cyan-500/30'
                        : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-cyan-600 focus:ring-cyan-500/20'
                    }`}
                  />
                </div>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-xs font-medium text-rose-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 sm:h-13 rounded-2xl bg-gradient-to-r from-teal-400 via-cyan-400 to-cyan-500 hover:from-teal-300 hover:to-cyan-400 text-slate-950 font-black text-sm sm:text-base flex items-center justify-center gap-2 transition shadow-lg shadow-cyan-500/25 cursor-pointer disabled:opacity-50 mt-2 active:scale-[0.99]"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>Signing into Doctor Console...</span>
                  </span>
                ) : (
                  <>
                    <span>Enter Clinical Consultation Console</span>
                    <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </main>

      {/* Institutional Footer */}
      <footer className={`relative z-10 w-full backdrop-blur-xl border-t px-4 sm:px-8 py-2.5 flex flex-col sm:flex-row items-center justify-between text-xs gap-2 text-center sm:text-left ${
        isDark ? 'bg-slate-900/90 border-slate-800/80 text-slate-400' : 'bg-white/90 border-slate-200 text-slate-600'
      }`}>
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-teal-500 shrink-0" />
          <span>DPDP Act 2023 & Ayushman Bharat (ABDM) Compliant Doctor Node</span>
        </div>
        <div className="flex items-center gap-2 font-mono text-[11px]">
          <span>MediKiosk v1.0 • SIH26047</span>
        </div>
      </footer>
    </div>
  );
};

export default LoginPage;
