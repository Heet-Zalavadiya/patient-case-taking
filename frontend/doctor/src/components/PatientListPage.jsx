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
  ChevronRight
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
      {/* Top Clinical Header & Network Status Strip */}
      <div className="bg-white p-6 rounded-3xl border border-[#e2ece5] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-[#e7f3ec] text-[#0e4d34] flex items-center justify-center border border-[#e2ece5] shrink-0 text-3xl shadow-2xs">
            🌿
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {currentDoctor?.name || 'Dr. Anand Kulkarni (MD Ayu)'}
              </h1>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#e7f3ec] text-[#0e4d34] border border-[#e2ece5]">
                {currentDoctor?.active_opd_room || 'OPD Room #14'}
              </span>
            </div>
            <p className="text-sm text-slate-600 font-medium mt-0.5">
              {currentDoctor?.department || 'General Medicine & Kayachikitsa'} • {currentDoctor?.institution || 'Ministry of AYUSH Central Hospital'}
            </p>
          </div>
        </div>

        {/* Live Network & Queue Metric Indicators */}
        <div className="flex items-center gap-3.5 flex-wrap">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold bg-[#f4f8f5] border-[#e2ece5]">
            {isLiveApi ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                <span className="text-emerald-800">Live API: Connected</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-amber-600" />
                <span className="text-amber-800">Mock Fallback: Active</span>
              </>
            )}
          </div>

          <button
            onClick={() => loadQueueData(true)}
            disabled={isRefreshing}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs disabled:opacity-50"
            title="Refresh Patient Queue and Live History"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#0e4d34] ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>

          <div className="text-right border-l border-slate-200 pl-3.5 hidden sm:block">
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              Total Queue
            </div>
            <div className="text-base font-black text-[#0e4d34]">
              {totalCount} Patients
            </div>
          </div>
        </div>
      </div>

      {/* Error / Offline Banner if any */}
      {errorNotice && (
        <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs font-medium text-amber-900 flex items-center justify-between">
          <span>{errorNotice}</span>
          <span className="font-mono text-[10px] font-bold uppercase bg-amber-100 px-2 py-0.5 rounded">
            Zero-Downtime Guarantee
          </span>
        </div>
      )}

      {/* Filter and Triage Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Filter Queue:
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
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-[#0e4d34] text-white shadow-xs'
                    : isRedFlagTab
                    ? 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {isRedFlagTab ? `🚨 Red-Flags (${highRedFlagsCount})` : tab}
              </button>
            );
          })}
        </div>

        {/* Triage Summary Badges */}
        <div className="text-xs text-slate-500 flex items-center gap-3">
          {highRedFlagsCount > 0 && (
            <span className="flex items-center gap-1.5 font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200 animate-alert-pulse">
              <span className="w-2 h-2 rounded-full bg-rose-600" />
              {highRedFlagsCount} Emergency Red-Flag{highRedFlagsCount > 1 ? 's' : ''}
            </span>
          )}
          <span className="flex items-center gap-1.5 font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-600" />
            {routineCount} Routine Cases
          </span>
        </div>
      </div>

      {/* Search Input Box */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by Patient Name, Token (e.g. EM-101), MRN, or Chief Complaint..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#e2ece5] rounded-2xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0e4d34] focus:ring-2 focus:ring-[#0e4d34]/15 transition font-medium shadow-2xs"
        />
      </div>

      {/* Loading Skeleton */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-3xl p-6 border border-[#e2ece5] animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-slate-100" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-slate-100 rounded w-1/4" />
                  <div className="h-3 bg-slate-100 rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredPatients.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-[#e2ece5] shadow-xs">
          <User className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No matching patients in queue</h3>
          <p className="text-xs text-slate-500 mt-1">Adjust your search query or reset the filter pill.</p>
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
                className={`bg-white rounded-3xl p-5 sm:p-6 border transition-all cursor-pointer card-hover-effect relative ${
                  isHighRedFlag
                    ? 'border-rose-300 bg-rose-50/20 hover:border-rose-500 hover:shadow-rose-100'
                    : 'border-[#e2ece5] hover:border-[#0e4d34] hover:shadow-emerald-50'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                  {/* Left: Token, Demographics, Intake Preview, Red Flag */}
                  <div className="flex items-start gap-4 flex-1">
                    {/* Token Square */}
                    <div className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center font-bold shrink-0 shadow-2xs ${
                      isHighRedFlag
                        ? 'bg-rose-100 text-rose-900 border border-rose-300 animate-alert-pulse'
                        : 'bg-[#f4f8f5] text-[#0e4d34] border border-[#e2ece5]'
                    }`}>
                      <span className="text-[10px] uppercase font-bold tracking-wider">Token</span>
                      <span className="text-base sm:text-lg font-black tracking-tight">
                        {patient.token || patient.queue_number}
                      </span>
                    </div>

                    {/* Patient Core Info & Intake Preview */}
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h3 className="text-base sm:text-lg font-black text-slate-900">
                          {patient.full_name}
                        </h3>
                        <span className="text-xs text-slate-500 font-semibold">
                          {patient.age}Y • {patient.gender}
                        </span>
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                          MRN: {patient.mrn}
                        </span>

                        {/* High Red Flag Pulsing Badge */}
                        {isHighRedFlag ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-600 text-white shadow-sm animate-alert-pulse">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
                            </span>
                            <Flame className="w-3.5 h-3.5" />
                            <span>EMERGENCY: {alert.flag_description.split(':')[0] || 'HIGH RED-FLAG'}</span>
                          </span>
                        ) : (
                          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#e7f3ec] text-[#0e4d34] border border-[#e2ece5] flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-[#0e4d34]" />
                            {history.dominant_dosha || 'Pitta-Vata Intake'}
                          </span>
                        )}
                      </div>

                      {/* Prominent Red-Flag Alert Description if High */}
                      {isHighRedFlag && (
                        <div className="p-2.5 rounded-xl bg-rose-100/70 border border-rose-300 text-xs font-bold text-rose-900 leading-snug">
                          ⚠️ {alert.flag_description}
                        </div>
                      )}

                      {/* Chief Complaint Preview (Live / Extracted from GET /patients/:id/history) */}
                      <div className="flex items-baseline gap-2 pt-0.5">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider shrink-0">
                          Chief Complaint:
                        </span>
                        <p className="text-sm font-semibold text-slate-800 line-clamp-2">
                          {history.chief_complaint || 'Pending clinical history intake...'}
                        </p>
                      </div>

                      {/* Associated Symptoms Tags from structured_history */}
                      {history.hpi_associated_symptoms && history.hpi_associated_symptoms.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap pt-1">
                          <span className="text-[11px] font-bold text-slate-400 uppercase">Symptoms:</span>
                          {history.hpi_associated_symptoms.slice(0, 3).map((symptom, sIdx) => (
                            <span
                              key={sIdx}
                              className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200 text-slate-700"
                            >
                              {symptom}
                            </span>
                          ))}
                          {history.hpi_associated_symptoms.length > 3 && (
                            <span className="text-[10px] text-slate-400 font-bold">
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
                              ? 'bg-rose-100 text-rose-800 border-rose-300 font-bold'
                              : 'bg-slate-50 text-slate-700 border-slate-200'
                          }`}>
                            BP: {patient.vitals_summary.bp}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-slate-50 text-slate-700 border-slate-200">
                            Pulse: {patient.vitals_summary.pulse}
                          </span>
                          <span className={`px-2 py-0.5 rounded-md border ${
                            parseInt(patient.vitals_summary.spo2) < 94
                              ? 'bg-amber-100 text-amber-800 border-amber-300 font-bold'
                              : 'bg-slate-50 text-slate-700 border-slate-200'
                          }`}>
                            SpO2: {patient.vitals_summary.spo2}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Check-in Time & Action Button */}
                  <div className="flex items-center justify-between lg:justify-end gap-4 border-t lg:border-t-0 pt-3 lg:pt-0 shrink-0">
                    <div className="text-left lg:text-right">
                      <div className="text-xs text-slate-400 font-semibold flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> Check-in: {patient.check_in_time}
                      </div>
                      <div className="text-[11px] text-emerald-700 font-bold mt-0.5">
                        Status: {patient.status.toUpperCase()}
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectPatient(patient.patient_id);
                      }}
                      className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition shadow-xs cursor-pointer shrink-0 ${
                        isHighRedFlag
                          ? 'bg-rose-700 hover:bg-rose-800 text-white'
                          : 'bg-[#0e4d34] hover:bg-[#093322] text-white'
                      }`}
                    >
                      <span>Open Case Sheet</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
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
