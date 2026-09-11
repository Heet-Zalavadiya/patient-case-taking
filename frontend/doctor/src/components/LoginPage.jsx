import React, { useState } from 'react';
import { 
  Shield, 
  Stethoscope, 
  Sparkles, 
  Lock, 
  User, 
  CheckCircle2, 
  ArrowRight,
  Check,
  Building2
} from 'lucide-react';
import { doctors } from '../data/mockData';

export const LoginPage = ({ onLoginSuccess }) => {
  const [selectedDoctorIndex, setSelectedDoctorIndex] = useState(0);
  const [loginId, setLoginId] = useState(doctors[0].login_id);
  const [password, setPassword] = useState('Doctor@123');
  const [isAyushPractitioner, setIsAyushPractitioner] = useState(doctors[0].is_ayush_practitioner);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Switch doctor preset
  const handleSelectDoctorPreset = (doc, idx) => {
    setSelectedDoctorIndex(idx);
    setLoginId(doc.login_id);
    setIsAyushPractitioner(doc.is_ayush_practitioner);
    setErrorMsg('');
  };

  const handleToggleAyush = (value) => {
    setIsAyushPractitioner(value);
    const matched = doctors.find(d => d.is_ayush_practitioner === value) || doctors[0];
    setLoginId(matched.login_id);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    setTimeout(() => {
      const matched = doctors.find(
        d => d.login_id.toLowerCase() === loginId.trim().toLowerCase()
      ) || {
        doctor_id: isAyushPractitioner ? "doc_custom_ayush" : "doc_custom_allopathic",
        login_id: loginId,
        name: isAyushPractitioner ? "Dr. Anand Kulkarni" : "Dr. Rajesh Sharma",
        qualification: isAyushPractitioner ? "BAMS, MD (Ayurveda)" : "MBBS, MD (Internal Medicine)",
        department: isAyushPractitioner ? "General Medicine & Kayachikitsa" : "Department of Clinical Medicine",
        institution: "All India Institute of Ayurveda • Ministry of AYUSH",
        is_ayush_practitioner: isAyushPractitioner,
        active_opd_room: isAyushPractitioner ? "OPD Room #14" : "OPD Room #104"
      };

      const activeDoctor = {
        ...matched,
        is_ayush_practitioner: isAyushPractitioner
      };

      setIsLoading(false);
      onLoginSuccess(activeDoctor);
    }, 350);
  };

  return (
    <div className="min-h-screen bg-[#fafaf7] text-slate-800 flex flex-col justify-between selection:bg-[#0e4d34] selection:text-white">
      {/* Top Ministry Header */}
      <header className="bg-white border-b border-[#e2ece5] shadow-xs sticky top-0 z-20">
        <div className="bg-[#093322] text-white text-[11px] font-medium tracking-wide py-1.5 px-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-semibold">
              <span className="text-emerald-400">🌿</span> Ministry of Ayush • All India Institute of Ayurveda (AIIA)
            </span>
            <span className="font-mono text-[10px] text-emerald-200">
              ABDM Certified Platform • SIH26047
            </span>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#f4f8f5] border border-[#e2ece5] flex items-center justify-center text-xl shadow-xs">
              🌿
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-slate-900 tracking-tight text-lg">
                  MediKiosk
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#e7f3ec] text-[#0e4d34] border border-[#e2ece5]">
                  DOCTOR PORTAL
                </span>
              </div>
              <p className="text-xs text-slate-500">
                AI Clinical Intake & Case Review Terminal
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500">
            <Shield className="w-4 h-4 text-[#0e4d34]" />
            <span className="font-semibold text-slate-700">Hospital Intranet Secured</span>
          </div>
        </div>
      </header>

      {/* Main Login Card */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-4">
        <div className="w-full max-w-lg space-y-6">
          {/* Welcome Badge & Title */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#e7f3ec] border border-[#e2ece5] text-[#0e4d34] text-xs font-bold shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-[#0e4d34]" />
              Rapid 30-Second Clinical Review
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Physician Consultation Sign In
            </h1>
            <p className="text-sm text-slate-600 max-w-md mx-auto">
              Select your clinical role to review pre-triaged patients, instant AYUSH Prakriti assessments, and emergency red flags.
            </p>
          </div>

          {/* Login Form Box */}
          <div className="bg-white border border-[#e2ece5] rounded-3xl p-6 sm:p-8 shadow-sm hover:shadow-md transition-shadow">
            {/* Quick 1-Click Doctor Profile Presets */}
            <div className="mb-6 space-y-2.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                Choose Doctor Account (1-Click Login):
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {doctors.map((doc, idx) => {
                  const isSelected = loginId === doc.login_id;
                  return (
                    <button
                      key={doc.doctor_id}
                      type="button"
                      onClick={() => handleSelectDoctorPreset(doc, idx)}
                      className={`text-left p-3.5 rounded-2xl border transition-all relative cursor-pointer ${
                        isSelected
                          ? 'bg-[#f4f8f5] border-[#0e4d34] ring-2 ring-[#0e4d34]/20 shadow-xs'
                          : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-slate-900">
                          {doc.name}
                        </span>
                        {isSelected && (
                          <span className="w-4 h-4 rounded-full bg-[#0e4d34] text-white flex items-center justify-center">
                            <Check className="w-2.5 h-2.5" />
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-600 font-medium block">
                        {doc.qualification}
                      </span>
                      <div className="mt-2 flex items-center gap-1.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          doc.is_ayush_practitioner
                            ? 'bg-amber-100 text-amber-900 border border-amber-200'
                            : 'bg-sky-100 text-sky-900 border border-sky-200'
                        }`}>
                          {doc.is_ayush_practitioner ? 'AYUSH OPD #14' : 'Allopathic OPD #104'}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Role Switcher Pill */}
            <div className="mb-6">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Active Medical Department:
              </label>
              <div className="grid grid-cols-2 gap-2 p-1.5 bg-[#f4f8f5] rounded-2xl border border-[#e2ece5]">
                <button
                  type="button"
                  onClick={() => handleToggleAyush(true)}
                  className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isAyushPractitioner
                      ? 'bg-[#0e4d34] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  AYUSH / Ayurveda
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleAyush(false)}
                  className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    !isAyushPractitioner
                      ? 'bg-[#0e4d34] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Stethoscope className="w-3.5 h-3.5" />
                  Allopathic Medicine
                </button>
              </div>
            </div>

            {/* Credential Inputs */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Doctor ID / Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={loginId}
                    onChange={(e) => setLoginId(e.target.value)}
                    placeholder="e.g. dr.anand or dr.rajesh"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-[#0e4d34] focus:ring-2 focus:ring-[#0e4d34]/15 transition font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-[#0e4d34] focus:ring-2 focus:ring-[#0e4d34]/15 transition font-medium"
                  />
                </div>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-medium text-rose-700">
                  {errorMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl bg-[#0e4d34] hover:bg-[#093322] text-white font-bold text-sm flex items-center justify-center gap-2 transition shadow-sm hover:shadow-md disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? (
                  <span>Opening Doctor Console...</span>
                ) : (
                  <>
                    <span>Enter Clinical Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </main>

      {/* Institutional Footer */}
      <footer className="border-t border-[#e2ece5] py-3.5 bg-white text-center text-xs text-slate-500">
        MediKiosk v1.0 • Ministry of Ayush & AIIA Clinical Portal • SIH26047
      </footer>
    </div>
  );
};

export default LoginPage;
