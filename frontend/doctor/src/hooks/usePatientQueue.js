import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  fetchPatientsQueue,
  fetchPatientHistory,
  fetchAllAlerts,
  markPatientAsCompleted,
  getCompletedPatientIds,
  resetCompletedPatients
} from '../api';

export function usePatientQueue() {
  const [patients, setPatients] = useState([]);
  const [patientHistories, setPatientHistories] = useState({});
  const [alerts, setAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLiveApi, setIsLiveApi] = useState(false);
  const [error, setError] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  const loadQueue = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      // 1. Fetch queue & alerts in parallel
      const [queueRes, alertsRes] = await Promise.all([
        fetchPatientsQueue(),
        fetchAllAlerts()
      ]);

      const rawList = Array.isArray(queueRes.data) ? queueRes.data : queueRes.data?.patients || [];
      const completedIds = getCompletedPatientIds();

      const normalizedQueue = rawList.map((p, idx) => {
        const pIdStr = String(p.patient_id || idx + 1);
        const isCompleted = completedIds.has(pIdStr) || p.status === 'completed';
        return {
          ...p,
          status: isCompleted ? 'completed' : (p.status || 'waiting'),
          token: p.token || p.queue_number || `A-${100 + (p.patient_id || idx + 1)}`,
          queue_number: p.queue_number || p.token || `A-${100 + (p.patient_id || idx + 1)}`,
          mrn: p.mrn || `MRN-2026-0${p.patient_id || idx + 1}`,
          check_in_time: p.check_in_time || 'Just now',
          age: p.age || 35,
          gender: p.gender || 'Male',
          vitals_summary: p.vitals_summary || { bp: '120/80', pulse: '76 bpm', spo2: '98%' }
        };
      });

      setPatients(normalizedQueue);
      setAlerts(alertsRes.data || []);
      setIsLiveApi(queueRes.isLive);

      // 2. Fetch chief complaints for preview
      const historyMap = {};
      await Promise.all(
        normalizedQueue.map(async (p) => {
          const histRes = await fetchPatientHistory(p.patient_id);
          historyMap[p.patient_id] = histRes.data;
        })
      );
      setPatientHistories(historyMap);

    } catch (err) {
      console.error('[usePatientQueue] Error fetching queue:', err);
      setError('Could not connect to clinical API server. Switched to offline fallback mode.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  // Sync when queue updated from any other component or tab
  useEffect(() => {
    const handleSync = () => {
      const completedIds = getCompletedPatientIds();
      setPatients((prev) =>
        prev.map((p) => {
          const pIdStr = String(p.patient_id);
          if (completedIds.has(pIdStr) && p.status !== 'completed') {
            return { ...p, status: 'completed' };
          }
          if (!completedIds.has(pIdStr) && p.status === 'completed') {
            return { ...p, status: 'waiting' };
          }
          return p;
        })
      );
    };

    window.addEventListener('medikiosk_queue_updated', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('medikiosk_queue_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  // Compute counts for queue badges
  const counts = useMemo(() => {
    let waiting = 0;
    let inConsultation = 0;
    let completed = 0;
    let redFlags = 0;

    patients.forEach((p) => {
      const pStatus = p.status || 'waiting';
      if (pStatus === 'waiting') waiting++;
      if (pStatus === 'in_consultation') inConsultation++;
      if (pStatus === 'completed') completed++;

      const hasFlag =
        p.has_red_flags ||
        alerts.some(
          (a) => (a.patient_id === p.patient_id || a.session_id === p.session_id) && a.severity === 'HIGH'
        );
      if (hasFlag && pStatus !== 'completed') redFlags++;
    });

    return {
      total: patients.length,
      waiting,
      inConsultation,
      completed,
      redFlags
    };
  }, [patients, alerts]);

  // Filtered and searched patient queue
  const filteredPatients = useMemo(() => {
    const list = patients.filter((patient) => {
      const history = patientHistories[patient.patient_id] || {};
      const alert = alerts.find(
        (a) => a.patient_id === patient.patient_id || a.session_id === patient.session_id
      );

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (patient.full_name && patient.full_name.toLowerCase().includes(q)) ||
        (patient.mrn && patient.mrn.toLowerCase().includes(q)) ||
        (patient.token && patient.token.toLowerCase().includes(q)) ||
        (history.chief_complaint && history.chief_complaint.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      // CRITICAL: Filter OUT completed patients from the active queue ('All', 'Waiting', 'In Consultation', 'Red-Flags')
      // A completed patient must only show if doctor explicitly clicks the 'Completed' tab!
      if (activeFilter !== 'Completed' && patient.status === 'completed') {
        return false;
      }

      if (activeFilter === 'Red-Flags') {
        return patient.has_red_flags || (alert && alert.severity === 'HIGH');
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

    // Requirement: Sort patients flagged as emergency/urgent at the top
    return list.sort((a, b) => {
      const aAlert = alerts.find((x) => x.patient_id === a.patient_id || x.session_id === a.session_id);
      const bAlert = alerts.find((x) => x.patient_id === b.patient_id || x.session_id === b.session_id);
      const aUrgent = Boolean(a.has_red_flags || (aAlert && aAlert.severity === 'HIGH'));
      const bUrgent = Boolean(b.has_red_flags || (bAlert && bAlert.severity === 'HIGH'));

      if (aUrgent && !bUrgent) return -1;
      if (!aUrgent && bUrgent) return 1;
      return 0;
    });
  }, [patients, patientHistories, alerts, searchQuery, activeFilter]);

  /**
   * Immediately mark a patient as completed in local state, persistent storage, and backend
   */
  const markPatientCompleted = useCallback(async (patientId, sessionId = null) => {
    if (!patientId) return;
    const pIdStr = String(patientId);

    // 1. Optimistic synchronous update of local state before navigation
    setPatients((prev) =>
      prev.map((p) =>
        String(p.patient_id) === pIdStr ? { ...p, status: 'completed' } : p
      )
    );

    // 2. Persist to storage and backend
    await markPatientAsCompleted(patientId, sessionId);
  }, []);

  /**
   * Find the next waiting patient in the active queue, excluding completed cases
   */
  const getNextWaitingPatient = useCallback((excludePatientId = null) => {
    const excludeStr = excludePatientId ? String(excludePatientId) : null;
    const completedIds = getCompletedPatientIds();

    const waitingCandidates = patients.filter((p) => {
      const pIdStr = String(p.patient_id);
      if (excludeStr && pIdStr === excludeStr) return false;
      if (p.status === 'completed' || completedIds.has(pIdStr)) return false;
      return true;
    });

    // Sort emergency/urgent first
    waitingCandidates.sort((a, b) => {
      const aAlert = alerts.find((x) => x.patient_id === a.patient_id || x.session_id === a.session_id);
      const bAlert = alerts.find((x) => x.patient_id === b.patient_id || x.session_id === b.session_id);
      const aUrgent = Boolean(a.has_red_flags || (aAlert && aAlert.severity === 'HIGH'));
      const bUrgent = Boolean(b.has_red_flags || (bAlert && bAlert.severity === 'HIGH'));

      if (aUrgent && !bUrgent) return -1;
      if (!aUrgent && bUrgent) return 1;
      return 0;
    });

    return waitingCandidates.length > 0 ? waitingCandidates[0] : null;
  }, [patients, alerts]);

  /**
   * Reset all completed patient records to allow re-testing
   */
  const resetAllCompleted = useCallback(() => {
    resetCompletedPatients();
    loadQueue(true);
  }, [loadQueue]);

  return {
    patients,
    patientHistories,
    alerts,
    isLoading,
    isRefreshing,
    isLiveApi,
    error,
    searchQuery,
    setSearchQuery,
    activeFilter,
    setActiveFilter,
    filteredPatients,
    counts,
    markPatientCompleted,
    getNextWaitingPatient,
    resetAllCompleted,
    refetch: () => loadQueue(true),
    retry: () => loadQueue(false)
  };
}

export default usePatientQueue;
