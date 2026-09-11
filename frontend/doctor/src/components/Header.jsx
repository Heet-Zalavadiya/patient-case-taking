import React from 'react';
import { 
  Shield, 
  Stethoscope, 
  Sparkles, 
  AlertTriangle, 
  LogOut, 
  UserCheck, 
  Clock, 
  Activity,
  ArrowLeft
} from 'lucide-react';

export const Header = ({ 
  currentDoctor, 
  onSwitchDoctor, 
  onLogout, 
  activeRedFlagsCount = 0,
  waitingPatientsCount = 0,
  onNavigateHome,
  isDetailView = false
}) => {
  const initials = currentDoctor?.name
    ? currentDoctor.name
        .split(' ')
        .filter(n => !n.startsWith('Dr.'))
        .map(n => n[0])
        .join('')
        .slice(0, 2)
    : 'MD';

  return (
    <header className="bg-white border-b border-[#e2ece5] sticky top-0 z-30 shadow-xs">
      {/* Top Institutional Banner Strip */}
      <div className="bg-[#093322] text-white text-[11px] font-medium tracking-wide py-1.5 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <span>🌿</span> MediKiosk
            </span>
            <span className="text-emerald-300/40">•</span>
            <span className="text-slate-100 font-semibold">
              Ministry of Ayush • All India Institute of Ayurveda (AIIA)
            </span>
            <span className="text-emerald-300/40 hidden md:inline">•</span>
            <span className="text-emerald-200/80 hidden md:inline">
              SIH26047 AI Patient Case Taking & Triage Terminal
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px]">
            <span className="text-emerald-100 flex items-center gap-1">
              <Clock className="w-3 h-3 text-emerald-300" />
              OPD Session: Today
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-900/90 text-emerald-200 border border-emerald-700 font-mono font-bold">
              30-Sec Glance Mode
            </span>
          </div>
        </div>
      </div>

      {/* Main Doctor Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Logo & Portal Identity */}
        <div 
          onClick={onNavigateHome}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-11 h-11 rounded-2xl bg-[#f4f8f5] border border-[#e2ece5] flex items-center justify-center text-2xl shadow-2xs group-hover:scale-105 transition">
            🌿
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight group-hover:text-[#0e4d34] transition">
                MediKiosk
              </h1>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                currentDoctor?.is_ayush_practitioner 
                  ? 'bg-amber-50 text-amber-900 border-amber-300' 
                  : 'bg-sky-50 text-sky-900 border-sky-300'
              }`}>
                {currentDoctor?.is_ayush_practitioner ? 'AYUSH OPD #14' : 'ALLOPATHIC OPD #104'}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Doctor Clinical Portal & Review Queue
            </p>
          </div>
        </div>

        {/* Live OPD Stats */}
        <div className="hidden lg:flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#f4f8f5] border border-[#e2ece5]">
            <span className="text-xs text-slate-500 font-semibold">Queue Waiting:</span>
            <span className="text-xs font-black text-[#0e4d34] font-mono bg-white px-2 py-0.5 rounded-md border border-[#e2ece5]">
              {waitingPatientsCount} Patients
            </span>
          </div>

          {activeRedFlagsCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200 animate-alert-pulse">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span className="text-xs font-bold text-rose-700">
                {activeRedFlagsCount} Red Flag{activeRedFlagsCount > 1 ? 's' : ''} Triage
              </span>
            </div>
          )}
        </div>

        {/* Doctor Details & Role Switcher */}
        <div className="flex items-center gap-3">
          {currentDoctor && (
            <div className="flex items-center gap-3 bg-[#f4f8f5] border border-[#e2ece5] rounded-2xl px-3 py-1.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 border border-emerald-300 flex items-center justify-center text-[#0e4d34] text-xs font-black shrink-0">
                {initials || 'DR'}
              </div>
              <div className="text-left hidden sm:block">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-900">
                    {currentDoctor.name}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Available for OPD</span>
                </div>
              </div>
            </div>
          )}

          {/* Quick Role Switcher Button */}
          <button
            onClick={onSwitchDoctor}
            title="Switch between AYUSH and Allopathic OPD profile"
            className="px-3 py-2 rounded-xl text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
          >
            <UserCheck className="w-3.5 h-3.5 text-[#0e4d34]" />
            <span className="hidden md:inline">Switch Role</span>
          </button>

          {/* Logout Button */}
          <button
            onClick={onLogout}
            title="Sign out of Doctor Console"
            className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition border border-transparent hover:border-rose-200 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
