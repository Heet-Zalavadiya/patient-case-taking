import React, { useState, useEffect } from 'react';
import {
  HeartPulse,
  Clock,
  AlertTriangle,
  Flame,
  LogOut,
  UserCheck,
  Users,
  Sparkles,
  ArrowLeft,
  Activity,
  Sun,
  Moon
} from 'lucide-react';

export const Header = ({
  currentDoctor,
  onSwitchDoctor,
  onLogout,
  activeRedFlagsCount = 0,
  waitingPatientsCount = 0,
  onNavigateHome,
  isDetailView = false,
  theme = 'dark',
  onToggleTheme
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedTime = currentTime.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });

  const formattedDate = currentTime.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  const initials = currentDoctor?.name
    ? currentDoctor.name
      .split(' ')
      .filter(n => !n.startsWith('Dr.'))
      .map(n => n[0])
      .join('')
      .slice(0, 2)
    : 'MD';

  return (
    <header className="relative z-30 w-full bg-slate-900/90 backdrop-blur-xl border-b border-slate-800/80 px-3 sm:px-8 py-2.5 sm:py-3 flex items-center justify-between shadow-lg">
      {/* Left: Branding & Portal Identity */}
      <div
        onClick={onNavigateHome}
        className="flex items-center gap-2 sm:gap-3.5 cursor-pointer group min-w-0"
      >
        <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-gradient-to-br from-teal-400 to-cyan-600 flex items-center justify-center shadow-lg shadow-cyan-500/25 p-1.5 sm:p-2 shrink-0 transition-transform duration-200 group-hover:scale-105">
          <HeartPulse className="w-5 h-5 sm:w-7 sm:h-7 text-slate-950 stroke-[2.5]" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            <h1 className="text-lg sm:text-2xl font-black tracking-tight text-white m-0 p-0 leading-none">
              Medi<span className="text-cyan-400">Kiosk</span>
            </h1>


            <span className="px-1.5 sm:px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-[10px] sm:text-[11px] font-bold text-emerald-400 uppercase tracking-wider whitespace-nowrap">
              {currentDoctor?.is_ayush_practitioner ? 'AYUSH #14' : 'OPD #104'}
            </span>

            {isDetailView && (
              <span className="hidden md:inline-flex px-2 py-0.5 rounded-md bg-cyan-500/15 border border-cyan-500/30 text-[10px] font-bold text-cyan-300 uppercase tracking-wider">
                Case Sheet Active
              </span>
            )}
          </div>
          <p className="hidden xs:block text-[10px] sm:text-[11px] text-slate-400 font-medium tracking-wide truncate max-w-[160px] sm:max-w-none">
            Ministry of Ayush • AIIA Hospital
          </p>
        </div>
      </div>

      {/* Center: Live Clock matching Patient UI */}
      <div className="hidden lg:flex items-center gap-3 px-4 py-1.5 rounded-full bg-slate-950/70 border border-slate-800 text-slate-300 shadow-inner">
        <Clock className="w-4 h-4 text-cyan-400 animate-pulse" />
        <span className="font-mono text-sm font-semibold tracking-wider text-white">
          {formattedTime}
        </span>
        <span className="text-slate-600">|</span>
        <span className="text-xs text-slate-400 font-medium">
          {formattedDate}
        </span>
      </div>

      {/* Right: OPD Stats & Doctor Session Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        {/* Waiting Queue Pill */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/90 border border-slate-700 text-slate-300 text-xs font-semibold">
          <Users className="w-3.5 h-3.5 text-cyan-400" />
          <span>Queue:</span>
          <span className="font-mono font-bold text-white bg-slate-950 px-2 py-0.5 rounded border border-slate-700/80">
            {waitingPatientsCount}
          </span>
        </div>

        {/* Emergency Red Flags Pill */}
        {activeRedFlagsCount > 0 && (
          <div className="flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-[11px] sm:text-xs font-bold animate-alert-pulse">
            <Flame className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
            <span>{activeRedFlagsCount} <span className="hidden xs:inline">Alert</span></span>
          </div>
        )}

        {/* Doctor Identity Pill */}
        {currentDoctor && (
          <div
            title={`${currentDoctor.name} (${currentDoctor.active_opd_room || 'OPD'})`}
            className="flex items-center gap-2 bg-slate-800/80 border border-slate-700 rounded-xl p-1 sm:px-2.5 sm:py-1.5"
          >
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-teal-400 to-cyan-500 text-slate-950 flex items-center justify-center text-xs font-black shrink-0 shadow-xs">
              {initials}
            </div>
            <div className="text-left hidden md:block leading-tight">
              <div className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                <span>{currentDoctor.name}</span>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>{currentDoctor.active_opd_room || 'OPD Active'}</span>
              </div>
            </div>
          </div>
        )}

        {/* Light / Dark Mode Toggle Button */}
        <button
          onClick={onToggleTheme}
          type="button"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="flex items-center gap-1.5 p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 text-xs font-semibold transition cursor-pointer shadow-sm"
        >
          {theme === 'dark' ? (
            <>
              <Sun className="w-4 h-4 text-amber-400" />
              <span className="hidden xl:inline">Light</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-cyan-400" />
              <span className="hidden xl:inline">Dark</span>
            </>
          )}
        </button>

        {/* Switch Role Button */}
        <button
          onClick={onSwitchDoctor}
          type="button"
          title="Switch between AYUSH and Allopathic OPD profile"
          className="flex items-center gap-1.5 p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 text-xs font-semibold transition cursor-pointer"
        >
          <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden sm:inline">Switch</span>
        </button>

        {/* Logout Button */}
        <button
          onClick={onLogout}
          type="button"
          title="Sign out of Doctor Console"
          className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950/50 hover:text-rose-400 hover:border-rose-800/60 border border-slate-700 text-slate-400 transition cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};

export default Header;
