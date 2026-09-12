import { useState, useEffect, useCallback, useMemo } from 'react';
import { fetchPatientsQueue, fetchPatientHistory, fetchAllAlerts } from '../api';

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

      setPatients(queueRes.data);
      setAlerts(alertsRes.data);
      setIsLiveApi(queueRes.isLive);

      // 2. Fetch chief complaints for preview
      const historyMap = {};
      await Promise.all(
        queueRes.data.map(async (p) => {
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

  // Compute counts for queue badges
  const counts = useMemo(() => {
    let waiting = 0;
    let inConsultation = 0;
    let completed = 0;
    let redFlags = 0;

    patients.forEach((p) => {
      if (p.status === 'waiting') waiting++;
      if (p.status === 'in_consultation') inConsultation++;
      if (p.status === 'completed') completed++;

      const hasFlag =
        p.has_red_flags ||
        alerts.some(
          (a) => (a.patient_id === p.patient_id || a.session_id === p.session_id) && a.severity === 'HIGH'
        );
      if (hasFlag) redFlags++;
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
    return patients.filter((patient) => {
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
  }, [patients, patientHistories, alerts, searchQuery, activeFilter]);

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
    refetch: () => loadQueue(true),
    retry: () => loadQueue(false)
  };
}

export default usePatientQueue;
