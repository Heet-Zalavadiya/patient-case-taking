import { useState, useEffect, useCallback } from 'react';
import {
  fetchPatientHistory,
  fetchSessionLabValues,
  fetchSessionRedFlags,
  fetchSessionSummary,
  acknowledgeAlert,
  updateSessionSummary
} from '../api';

export function usePatientDetails(patientId, initialSessionId = null) {
  const [history, setHistory] = useState(null);
  const [labValues, setLabValues] = useState([]);
  const [activeAlert, setActiveAlert] = useState(null);
  const [summary, setSummary] = useState(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isLiveApi, setIsLiveApi] = useState(false);
  const [error, setError] = useState(null);
  const [isAlertAck, setIsAlertAck] = useState(false);

  const loadDetails = useCallback(async () => {
    if (!patientId) return;
    setIsLoading(true);
    setError(null);

    try {
      // 1. Fetch History
      const histRes = await fetchPatientHistory(patientId);
      setHistory(histRes.data);
      setIsLiveApi(histRes.isLive);

      const resolvedSessionId = histRes.data?.session_id || initialSessionId;

      // 2. Fetch Lab Values, Red Flags, and Summary in parallel
      const [labsRes, alertsRes, sumRes] = await Promise.all([
        fetchSessionLabValues(resolvedSessionId, patientId),
        fetchSessionRedFlags(resolvedSessionId || 1),
        fetchSessionSummary(resolvedSessionId, patientId)
      ]);

      setLabValues(labsRes.data);

      const matchedAlert =
        alertsRes.data.find(
          (a) => a.patient_id === patientId || a.session_id === resolvedSessionId
        ) || (alertsRes.data.length > 0 ? alertsRes.data[0] : null);

      setActiveAlert(matchedAlert);
      setIsAlertAck(matchedAlert?.is_acknowledged || false);

      setSummary(sumRes.data);

    } catch (err) {
      console.error('[usePatientDetails] Error loading details:', err);
      setError('Could not load full clinical records from API server.');
    } finally {
      setIsLoading(false);
    }
  }, [patientId, initialSessionId]);

  useEffect(() => {
    loadDetails();
  }, [loadDetails]);

  // Optimistic Alert Acknowledgment
  const handleAcknowledgeAlert = useCallback(async (alertId, shouldAcknowledge = true) => {
    const prevAlert = activeAlert;
    const prevAck = isAlertAck;

    // Optimistic state
    setIsAlertAck(shouldAcknowledge);
    if (activeAlert) {
      setActiveAlert((prev) => ({
        ...prev,
        is_acknowledged: shouldAcknowledge
      }));
    }

    try {
      const res = await acknowledgeAlert(alertId, shouldAcknowledge);
      return res.data;
    } catch (err) {
      // Revert on failure
      setActiveAlert(prevAlert);
      setIsAlertAck(prevAck);
      throw err;
    }
  }, [activeAlert, isAlertAck]);

  // Optimistic Summary Verification
  const handleVerifySummary = useCallback(async (physicianNotes = '') => {
    const sessionId = history?.session_id || initialSessionId || 1;
    const prevSummary = summary;

    setSummary((prev) => ({
      ...prev,
      status: 'ACCEPTED',
      physician_notes: physicianNotes,
      last_modified_by: 'Physician (ACCEPTED)'
    }));

    try {
      const res = await updateSessionSummary(
        sessionId,
        {
          status: 'ACCEPTED',
          amended_text: summary?.draft_text,
          physician_notes: physicianNotes
        },
        patientId
      );
      setSummary(res.data);
      return res.data;
    } catch (err) {
      setSummary(prevSummary);
      throw err;
    }
  }, [history, initialSessionId, summary, patientId]);

  // Optimistic Summary Amendment
  const handleAmendSummary = useCallback(async (amendedText, physicianNotes = '') => {
    const sessionId = history?.session_id || initialSessionId || 1;
    const prevSummary = summary;

    setSummary((prev) => ({
      ...prev,
      status: 'AMENDED',
      draft_text: amendedText,
      physician_notes: physicianNotes,
      last_modified_by: 'Physician (AMENDED)'
    }));

    try {
      const res = await updateSessionSummary(
        sessionId,
        {
          status: 'AMENDED',
          amended_text: amendedText,
          physician_notes: physicianNotes
        },
        patientId
      );
      setSummary(res.data);
      return res.data;
    } catch (err) {
      setSummary(prevSummary);
      throw err;
    }
  }, [history, initialSessionId, summary, patientId]);

  // Optimistic Summary Rejection
  const handleRejectSummary = useCallback(async (rejectReason = '') => {
    const sessionId = history?.session_id || initialSessionId || 1;
    const prevSummary = summary;

    setSummary((prev) => ({
      ...prev,
      status: 'REJECTED',
      physician_notes: rejectReason,
      last_modified_by: 'Physician (REJECTED)'
    }));

    try {
      const res = await updateSessionSummary(
        sessionId,
        {
          status: 'REJECTED',
          amended_text: summary?.draft_text,
          physician_notes: rejectReason
        },
        patientId
      );
      setSummary(res.data);
      return res.data;
    } catch (err) {
      setSummary(prevSummary);
      throw err;
    }
  }, [history, initialSessionId, summary, patientId]);

  return {
    history,
    labValues,
    activeAlert,
    summary,
    isLoading,
    isLiveApi,
    error,
    isAlertAck,
    acknowledgeAlert: handleAcknowledgeAlert,
    verifySummary: handleVerifySummary,
    amendSummary: handleAmendSummary,
    rejectSummary: handleRejectSummary,
    refetch: loadDetails
  };
}

export default usePatientDetails;
