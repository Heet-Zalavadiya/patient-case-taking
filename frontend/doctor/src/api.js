/**
 * MediKiosk Clinical REST API Service Layer
 * Interfaces with FastAPI endpoints with resilient fallbacks to mock clinical datasets.
 */

import {
  mockPatients,
  mockStructuredHistories,
  mockRedFlagAlerts,
  mockExtractedLabValues,
  mockClinicalSummaries
} from './data/mockFallbackData';
import { doctors } from './data/mockData';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const DEFAULT_TIMEOUT_MS = 4000;

async function fetchWithTimeout(url, options = {}, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  const token = localStorage.getItem('medikiosk_token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

export function normalizePatientId(id) {
  if (!id) return 1;
  const str = String(id).replace(/^(pat_|P)/i, '');
  const parsed = parseInt(str, 10);
  return isNaN(parsed) ? 1 : parsed;
}

export async function loginDoctor(credentials) {
  try {
    const res = await fetchWithTimeout(`${BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      body: JSON.stringify({
        login_id: credentials.login_id || credentials.username,
        password: credentials.password
      })
    });

    if (!res.ok) {
      throw new Error(`Login status ${res.status}`);
    }

    const data = await res.json();
    if (data.access_token) {
      localStorage.setItem('medikiosk_token', data.access_token);
    }

    return {
      success: true,
      data: {
        doctor_id: data.doctor_id,
        login_id: credentials.login_id,
        name: data.full_name,
        full_name: data.full_name,
        department: data.department,
        qualification: data.qualification,
        is_ayush_practitioner: data.is_ayush_practitioner,
        active_opd_room: data.active_opd_room || 'OPD Room #104'
      },
      isLive: true
    };
  } catch (err) {
    console.warn(`[api] Login endpoint unavailable (${err.message}). Using local doctor profiles.`);
    const searchId = (credentials.login_id || '').trim().toLowerCase();
    const matched = doctors.find(
      (d) => d.login_id.toLowerCase() === searchId || d.name.toLowerCase().includes(searchId)
    );

    if (matched) {
      return { success: true, data: matched, isLive: false };
    }

    const isAyush = credentials.is_ayush_practitioner ?? true;
    return {
      success: true,
      data: {
        doctor_id: isAyush ? 'doc_custom_ayush' : 'doc_custom_allopathic',
        login_id: credentials.login_id || (isAyush ? 'dr.anand' : 'dr.rajesh'),
        name: isAyush ? 'Dr. Anand Kulkarni' : 'Dr. Rajesh Sharma',
        qualification: isAyush ? 'BAMS, MD (Ayurveda)' : 'MBBS, MD (Internal Medicine)',
        department: isAyush ? 'General Medicine & Kayachikitsa' : 'Department of Clinical Medicine',
        is_ayush_practitioner: isAyush,
        active_opd_room: isAyush ? 'OPD Room #14' : 'OPD Room #104'
      },
      isLive: false
    };
  }
}

export async function fetchPatientsQueue() {
  try {
    let res = await fetchWithTimeout(`${BASE_URL}/api/v1/patients`);
    if (!res.ok) {
      res = await fetchWithTimeout(`${BASE_URL}/patients`);
    }
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    const list = Array.isArray(data) ? data : data.patients || mockPatients;
    return { data: list.length > 0 ? list : mockPatients, isLive: true, error: null };
  } catch (err) {
    return { data: mockPatients, isLive: false, error: err.message };
  }
}

export async function fetchPatientHistory(patientId) {
  const normId = normalizePatientId(patientId);
  try {
    let res = await fetchWithTimeout(`${BASE_URL}/api/v1/patients/${normId}/history`);
    if (!res.ok) {
      res = await fetchWithTimeout(`${BASE_URL}/patients/${patientId}/history`);
    }
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    const historyData = data.structured_history || data;

    return {
      data: {
        ...mockStructuredHistories[patientId],
        ...historyData,
        patient_id: patientId,
        session_id: data.session_id || normId,
        history_mode: data.history_mode || 'allopathic',
        ayush_history: data.ayush_history || null,
        chief_complaint: historyData.chief_complaint || mockStructuredHistories[patientId]?.chief_complaint || 'General consultation',
        hpi_associated_symptoms: historyData.hpi_associated_symptoms || mockStructuredHistories[patientId]?.hpi_associated_symptoms || []
      },
      isLive: true,
      error: null
    };
  } catch (err) {
    const fallback = mockStructuredHistories[patientId] || mockStructuredHistories['pat_001'];
    return { data: { ...fallback, patient_id: patientId, session_id: normId }, isLive: false, error: err.message };
  }
}

export async function fetchSessionRedFlags(sessionId) {
  try {
    let res = await fetchWithTimeout(`${BASE_URL}/api/v1/sessions/${sessionId}/red-flags`);
    if (!res.ok) {
      res = await fetchWithTimeout(`${BASE_URL}/alerts`);
    }
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    return { data: Array.isArray(data) ? data : [], isLive: true, error: null };
  } catch (err) {
    const alerts = mockRedFlagAlerts.filter(
      (a) => a.session_id === sessionId || a.patient_id === `pat_00${sessionId}` || a.patient_id === sessionId
    );
    return { data: alerts.length > 0 ? alerts : mockRedFlagAlerts.slice(0, 1), isLive: false, error: err.message };
  }
}

export async function fetchAllAlerts() {
  try {
    let res = await fetchWithTimeout(`${BASE_URL}/alerts`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    return { data: Array.isArray(data) ? data : mockRedFlagAlerts, isLive: true, error: null };
  } catch (err) {
    return { data: mockRedFlagAlerts, isLive: false, error: err.message };
  }
}

export async function acknowledgeAlert(alertId, isAcknowledged = true) {
  try {
    let res = await fetchWithTimeout(`${BASE_URL}/api/v1/alerts/${alertId}/acknowledge`, {
      method: 'PATCH',
      body: JSON.stringify({ is_acknowledged: isAcknowledged })
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    return { data, isLive: true, error: null };
  } catch (err) {
    return {
      data: { alert_id: alertId, is_acknowledged: isAcknowledged, acknowledged_at: new Date().toISOString() },
      isLive: false,
      error: err.message
    };
  }
}

export async function fetchSessionLabValues(sessionId, patientId = null) {
  try {
    const url = sessionId
      ? `${BASE_URL}/api/v1/sessions/${sessionId}/lab-values`
      : `${BASE_URL}/patients/${patientId}/labs`;
    const res = await fetchWithTimeout(url);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    return { data: Array.isArray(data) ? data : [], isLive: true, error: null };
  } catch (err) {
    const key = patientId || (sessionId ? `pat_00${sessionId}` : 'pat_001');
    const labs = mockExtractedLabValues[key] || mockExtractedLabValues['pat_001'] || [];
    return { data: labs, isLive: false, error: err.message };
  }
}

export async function fetchSessionSummary(sessionId, patientId = null) {
  try {
    const url = sessionId
      ? `${BASE_URL}/api/v1/sessions/${sessionId}/summary`
      : `${BASE_URL}/patients/${patientId}/summary`;
    const res = await fetchWithTimeout(url);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    return { data, isLive: true, error: null };
  } catch (err) {
    const key = patientId || (sessionId ? `pat_00${sessionId}` : 'pat_001');
    const sum = mockClinicalSummaries[key] || {
      summary_id: `sum_${key}`,
      patient_id: key,
      status: 'draft',
      draft_text: 'Clinical intake completed via MediKiosk. Pending physician evaluation.',
      physician_notes: '',
      last_modified_by: 'AI Synthesizer'
    };
    return { data: sum, isLive: false, error: err.message };
  }
}

export async function updateSessionSummary(sessionId, payload, patientId = null) {
  try {
    const url = sessionId
      ? `${BASE_URL}/api/v1/sessions/${sessionId}/summary`
      : `${BASE_URL}/patients/${patientId}/summary`;
    const res = await fetchWithTimeout(url, {
      method: 'PATCH',
      body: JSON.stringify({
        status: (payload.status || 'ACCEPTED').toUpperCase(),
        amended_text: payload.amended_text || null,
        physician_notes: payload.physician_notes || null
      })
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    return { data, isLive: true, error: null };
  } catch (err) {
    return {
      data: {
        session_id: sessionId,
        status: payload.status.toUpperCase(),
        draft_text: payload.amended_text || '',
        physician_notes: payload.physician_notes || '',
        last_modified_by: `Physician (${payload.status.toUpperCase()})`
      },
      isLive: false,
      error: err.message
    };
  }
}
