import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  ArrowRight, 
  Clock, 
  User, 
  Activity, 
  Flame, 
  Sparkles, 
  Stethoscope, 
  AlertTriangle,
  RefreshCw,
  Wifi,
  WifiOff,
  CheckCircle2,
  ChevronRight,
  HeartPulse
} from 'lucide-react';
import { getPatients, getPatientHistory, getRedFlagAlerts } from '../apiService';

export const PatientListPage = ({
  currentDoctor,
  onSelectPatient
}) => {
  const [patients, setPatients] = useState([]);
  const [patientHistories, setPatientHistories] = useState({});
  const [alerts, setAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLiveApi, setIsLiveApi] = useState(false);
  const [errorNotice, setErrorNotice] = useState(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All'); // 'All' | 'Waiting' | 'In Consultation' | 'Completed' | 'Red-Flags'

  // Fetch queue and preview history for all patients
  const loadQueueData = async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) setIsRefreshing(true);
    else setIsLoading(true);

    setErrorNotice(null);

    try {
      // 1. Fetch patients queue
      const patientRes = await getPatients();
      setPatients(patientRes.data);
      setIsLiveApi(patientRes.isLive);

      // 2. Fetch red flag alerts
      const alertsRes = await getRedFlagAlerts();
      setAlerts(alertsRes.data);

      // 3. For each patient in the queue, fetch preview history in parallel
      const historyMap = {};
      await Promise.all(
        patientRes.data.map(async (p) => {
          const histRes = await getPatientHistory(p.patient_id);
          historyMap[p.patient_id] = histRes.data;
        })
      );
      setPatientHistories(historyMap);

    } catch (err) {
      console.error('[PatientListPage] Error loading queue data:', err);
      setErrorNotice('Failed to connect to primary clinical API. Active in resilient fallback mode.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadQueueData();
  }, []);

  // Filter and search computation
  const filteredPatients = patients.filter(patient => {
    const history = patientHistories[patient.patient_id] || {};
    const alert = alerts.find(a => a.patient_id === patient.patient_id);

    // Search query matching
    const matchesSearch = 
      patient.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.mrn?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.token?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      history.chief_complaint?.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    // Filter pill matching
    if (activeFilter === 'Red-Flags') {
      return alert && alert.severity === 'HIGH';
    }
    if (activeFilter === 'Waiting') {
      return patient.status === 'waiting';
    }
    if (activeFilter === 'In Consultation') {
      return patient.status === 'in_consultation';
    }
    if (activeFilter === 'Completed') {
      return patient.status === 'completed';
    }
    return true;
  });

  const totalCount = patients.length;
  const highRedFlagsCount = patients.filter(p => {
    const alert = alerts.find(a => a.patient_id === p.patient_id);
    return alert && alert.severity === 'HIGH';
  }).length;
  const routineCount = totalCount - highRedFlagsCount;

  return (
    <div className="space-y-6">
      {/* Top Clinical Profile & Live Sync Card */}
      <div className="bg-slate-900/90 backdrop-blur-xl p-6 rounded-3xl border border-slate-800 shadow-2xl shadow-cyan-950/20 flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-400 to-cyan-600 text-slate-950 flex items-center justify-center shrink-0 shadow-lg shadow-cyan-500/25">
            <HeartPulse className="w-8 h-8 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {currentDoctor?.name || 'Dr. Anand Kulkarni (MD Ayu)'}
              </h1>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                {currentDoctor?.active_opd_room || 'OPD Room #14'}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 font-medium mt-0.5">
              {currentDoctor?.department || 'General Medicine & Kayachikitsa'} • {currentDoctor?.institution || 'Ministry of AYUSH Central Hospital'}
            </p>
          </div>
        </div>

        {/* Live Network & Sync Actions */}
        <div className="flex items-center gap-3.5 flex-wrap">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold bg-slate-950/80 border-slate-800">
            {isLiveApi ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span className="text-emerald-300">Live API: Connected</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-amber-300">Resilient Fallback</span>
              </>
            )}
          </div>

          <button
            onClick={() => loadQueueData(true)}
            disabled={isRefreshing}
            className="px-3.5 py-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
            title="Refresh Patient Queue and Live History"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>

          <div className="text-right border-l border-slate-800 pl-3.5 hidden sm:block">
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              Total Queue
            </div>
            <div className="text-base font-black text-cyan-400 font-mono">
              {totalCount} Patients
            </div>
          </div>
        </div>
      </div>

      {/* Error / Offline Banner if any */}
      {errorNotice && (
        <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-xs font-medium text-amber-200 flex items-center justify-between">
          <span>{errorNotice}</span>
          <span className="font-mono text-[10px] font-bold uppercase bg-amber-500/20 px-2 py-0.5 rounded text-amber-300">
            Zero-Downtime Resilience
          </span>
        </div>
      )}

      {/* Filter and Triage Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Filter Pills matching Patient Stepper Style */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-cyan-400" /> Filter:
          </span>
          {['All', 'Waiting', 'In Consultation', 'Completed', 'Red-Flags'].map((tab) => {
            const isSelected = activeFilter === tab;
            const isRedFlagTab = tab === 'Red-Flags';
            return (
              <button
                key={tab}
                onClick={() => setActiveFilter(tab)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isSelected
                    ? isRedFlagTab
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50 shadow-md shadow-rose-950/40 animate-alert-pulse'
                      : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-md shadow-cyan-950/40'
                    : isRedFlagTab
                    ? 'bg-slate-900/60 text-rose-400/80 hover:text-rose-300 border border-rose-950 hover:bg-slate-900'
                    : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800 hover:bg-slate-900'
                }`}
              >
                {tab === 'Red-Flags' ? (
                  <span className="flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 text-rose-400" />
                    <span>Red Flags ({highRedFlagsCount})</span>
                  </span>
                ) : (
                  <span>{tab}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search Input Box */}
        <div className="relative w-full md:w-80">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
            <Search className="w-4 h-4 text-cyan-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search patient name, token, MRN..."
            className="w-full pl-10 pr-3.5 py-2 rounded-xl bg-slate-900/90 border border-slate-800 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 transition"
          />
        </div>
      </div>

      {/* Quick Summary Counts Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 font-bold">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-rose-200">High Red-Flag Triaged</div>
              <div className="text-[11px] text-rose-300/70">Immediate clinical attention required</div>
            </div>
          </div>
          <span className="text-xl font-black text-rose-300 font-mono">
            {highRedFlagsCount}
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 font-bold">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-cyan-200">Standard OPD Queue</div>
              <div className="text-[11px] text-cyan-300/70">Pre-case intake completed</div>
            </div>
          </div>
          <span className="text-xl font-black text-cyan-300 font-mono">
            {routineCount}
          </span>
        </div>
      </div>

      {/* Patients Queue List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-slate-900/90 rounded-3xl p-6 border border-slate-800 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-slate-800 rounded-2xl" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-slate-800 rounded w-1/4" />
                  <div className="h-3 bg-slate-800 rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredPatients.length === 0 ? (
        <div className="bg-slate-900/90 rounded-3xl p-12 text-center border border-slate-800 shadow-xl">
          <User className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-200">No matching patients in queue</h3>
          <p className="text-xs text-slate-400 mt-1">Adjust your search query or reset the filter pill.</p>
        </div>
      ) : (
        /* Patient Cards List */
        <div className="grid grid-cols-1 gap-4">
          {filteredPatients.map((patient) => {
            const history = patientHistories[patient.patient_id] || {};
            const alert = alerts.find(a => a.patient_id === patient.patient_id);
            const isHighRedFlag = alert && alert.severity === 'HIGH';

            return (
              <div
                key={patient.patient_id}
                onClick={() => onSelectPatient(patient.patient_id)}
                className={`bg-slate-900/90 backdrop-blur-xl rounded-3xl p-5 sm:p-6 border transition-all cursor-pointer card-hover-effect relative group ${
                  isHighRedFlag
                    ? 'border-rose-500/40 bg-slate-900/95 hover:border-rose-400 shadow-lg shadow-rose-950/20'
                    : 'border-slate-800 hover:border-cyan-500/50 shadow-xl shadow-cyan-950/10'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                  {/* Left: Token, Demographics, Intake Preview, Red Flag */}
                  <div className="flex items-start gap-4 flex-1">
                    {/* Token Square */}
                    <div className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center font-bold shrink-0 shadow-inner ${
                      isHighRedFlag
                        ? 'bg-rose-950/80 text-rose-300 border border-rose-500/50 animate-alert-pulse'
                        : 'bg-slate-950 text-cyan-400 border border-slate-800'
                    }`}>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Token</span>
                      <span className="text-base sm:text-lg font-black tracking-tight font-mono">
                        {patient.token || patient.queue_number}
                      </span>
                    </div>

                    {/* Patient Core Info & Intake Preview */}
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h3 className="text-base sm:text-lg font-black text-white group-hover:text-cyan-300 transition">
                          {patient.full_name}
                        </h3>
                        <span className="text-xs text-slate-400 font-semibold">
                          {patient.age}Y • {patient.gender}
                        </span>
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-slate-950 text-slate-300 border border-slate-800">
                          MRN: {patient.mrn}
                        </span>

                        {/* High Red Flag Pulsing Badge */}
                        {isHighRedFlag ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-black bg-rose-600 text-white shadow-sm animate-alert-pulse">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
                            </span>
                            <Flame className="w-3.5 h-3.5" />
                            <span>EMERGENCY: {alert.flag_description.split(':')[0] || 'HIGH RED-FLAG'}</span>
                          </span>
                        ) : (
                          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-emerald-400" />
                            {history.dominant_dosha || 'Pitta-Vata Intake'}
                          </span>
                        )}
                      </div>

                      {/* Prominent Red-Flag Alert Description if High */}
                      {isHighRedFlag && (
                        <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-xs font-bold text-rose-200 leading-snug">
                          ⚠️ {alert.flag_description}
                        </div>
                      )}

                      {/* Chief Complaint Preview */}
                      <div className="flex items-baseline gap-2 pt-0.5">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0">
                          Chief Complaint:
                        </span>
                        <p className="text-sm font-semibold text-slate-200 line-clamp-2">
                          {history.chief_complaint || 'Pending clinical history intake...'}
                        </p>
                      </div>

                      {/* Associated Symptoms Tags from structured_history */}
                      {history.hpi_associated_symptoms && history.hpi_associated_symptoms.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap pt-1">
                          <span className="text-[11px] font-bold text-slate-500 uppercase">Symptoms:</span>
                          {history.hpi_associated_symptoms.slice(0, 3).map((symptom, sIdx) => (
                            <span
                              key={sIdx}
                              className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-slate-300"
                            >
                              {symptom}
                            </span>
                          ))}
                          {history.hpi_associated_symptoms.length > 3 && (
                            <span className="text-[10px] text-slate-500 font-bold">
                              +{history.hpi_associated_symptoms.length - 3} more
                            </span>
                          )}
                        </div>
                      )}

                      {/* Vitals Quick Bar */}
                      {patient.vitals_summary && (
                        <div className="flex items-center gap-2 pt-1 flex-wrap text-xs font-mono font-medium">
                          <span className={`px-2 py-0.5 rounded-md border ${
                            patient.vitals_summary.bp?.includes('168')
                              ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 font-bold'
                              : 'bg-slate-950 text-slate-300 border border-slate-800'
                          }`}>
                            BP: {patient.vitals_summary.bp}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-slate-950 text-slate-300 border border-slate-800">
                            Pulse: {patient.vitals_summary.pulse}
                          </span>
                          <span className={`px-2 py-0.5 rounded-md border ${
                            parseInt(patient.vitals_summary.spo2) < 94
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold'
                              : 'bg-slate-950 text-slate-300 border border-slate-800'
                          }`}>
                            SpO2: {patient.vitals_summary.spo2}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Side: Wait Time & Action CTA Button */}
                  <div className="flex lg:flex-col items-center lg:items-end justify-between border-t lg:border-t-0 border-slate-800 pt-3 lg:pt-0 gap-2 shrink-0">
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                      <Clock className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Arrived {patient.check_in_time}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${
                        patient.status === 'in_consultation'
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                          : patient.status === 'completed'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-slate-800 text-slate-300 border border-slate-700'
                      }`}>
                        {patient.status.replace('_', ' ')}
                      </span>

                      <button
                        type="button"
                        className="px-3.5 py-2 rounded-xl bg-slate-800 group-hover:bg-gradient-to-r group-hover:from-teal-400 group-hover:to-cyan-400 group-hover:text-slate-950 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition border border-slate-700 shadow-sm"
                      >
                        <span>Open Case Sheet</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PatientListPage;
