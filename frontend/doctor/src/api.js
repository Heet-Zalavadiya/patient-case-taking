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

const COMPLETED_PATIENTS_STORAGE_KEY = 'medikiosk_completed_patient_ids';

/**
 * Get set of patient IDs that have been completed during this clinic session
 */
export function getCompletedPatientIds() {
  try {
    const raw = localStorage.getItem(COMPLETED_PATIENTS_STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return new Set(Array.isArray(parsed) ? parsed.map(String) : []);
  } catch (e) {
    console.warn('[api] Could not read completed patient IDs:', e);
    return new Set();
  }
}

/**
 * Save a patient as completed in local storage and notify backend database
 */
export async function markPatientAsCompleted(patientId, sessionId = null) {
  if (!patientId) return;
  const pIdStr = String(patientId);

  // 1. Immediately persist to localStorage
  try {
    const current = getCompletedPatientIds();
    current.add(pIdStr);
    // Also add normalized variant (e.g. pat_001 -> 1)
    const norm = String(normalizePatientId(patientId));
    current.add(norm);
    localStorage.setItem(COMPLETED_PATIENTS_STORAGE_KEY, JSON.stringify(Array.from(current)));
  } catch (e) {
    console.warn('[api] Could not write completed patient ID to storage:', e);
  }

  // 2. Dispatch cross-component custom event so all active hooks update immediately
  try {
    window.dispatchEvent(new CustomEvent('medikiosk_queue_updated', { detail: { patientId: pIdStr } }));
  } catch (e) {
    // Ignore in non-browser context
  }

  // 3. Inform backend API
  try {
    await fetchWithTimeout(`${BASE_URL}/api/v1/queue/${patientId}/complete`, {
      method: 'POST'
    });
  } catch (err1) {
    try {
      await fetchWithTimeout(`${BASE_URL}/queue/${patientId}/complete`, {
        method: 'POST'
      });
    } catch (err2) {
      // Offline/fallback mode handles this gracefully via localStorage
    }
  }

  // 4. Also mark session summary as ACCEPTED if sessionId provided
  if (sessionId) {
    try {
      await updateSessionSummary(sessionId, { status: 'ACCEPTED' }, patientId);
    } catch (e) {
      // Silent fail
    }
  }
}

/**
 * Reset completed patient tracking (useful for tests and demo cycles)
 */
export async function resetCompletedPatients() {
  try {
    localStorage.removeItem(COMPLETED_PATIENTS_STORAGE_KEY);
    window.dispatchEvent(new CustomEvent('medikiosk_queue_updated', { detail: { reset: true } }));
  } catch (e) {
    console.warn('[api] Could not clear completed patients:', e);
  }

  try {
    await fetchWithTimeout(`${BASE_URL}/api/v1/queue/reset`, { method: 'POST' });
  } catch (e) {
    // Silent
  }
}

export async function fetchPatientsQueue() {
  const completedIds = getCompletedPatientIds();

  try {
    let res = await fetchWithTimeout(`${BASE_URL}/api/v1/patients`);
    if (!res.ok) {
      res = await fetchWithTimeout(`${BASE_URL}/patients`);
    }
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    const list = Array.isArray(data) ? data : data.patients || mockPatients;
    const baseList = list.length > 0 ? list : mockPatients;

    const enriched = baseList.map((p) => {
      const pIdStr = String(p.patient_id);
      const isCompleted = completedIds.has(pIdStr) || p.status === 'completed';
      return {
        ...p,
        status: isCompleted ? 'completed' : (p.status || 'waiting')
      };
    });

    return { data: enriched, isLive: true, error: null };
  } catch (err) {
    const enriched = mockPatients.map((p) => {
      const pIdStr = String(p.patient_id);
      const isCompleted = completedIds.has(pIdStr) || p.status === 'completed';
      return {
        ...p,
        status: isCompleted ? 'completed' : (p.status || 'waiting')
      };
    });
    return { data: enriched, isLive: false, error: err.message };
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

/**
 * Local resilient clinical brief generator if backend or Gemini API is offline
 */
export function generateLocalPatientSummary(patientData) {
  const chief =
    patientData?.chief_complaint ||
    patientData?.demo_chief_complaint ||
    'General medical case consultation';
  const painLocs = patientData?.pain_locations || patientData?.painLocations || [];
  const locStr = Array.isArray(painLocs) ? painLocs.join(', ') : String(painLocs || '');
  const alert = patientData?.activeAlert || (patientData?.alerts && patientData.alerts[0]);
  const isEmergency = alert && (alert.severity === 'HIGH' || patientData?.has_red_flags);
  const vitals = patientData?.vitals_summary || patientData?.vitals;

  const bullets = [
    `Chief Complaint: ${chief}`,
    locStr ? `Pain Location: Pinpointed at ${locStr}` : `Pain Location: No localized musculoskeletal pain specified`,
    isEmergency
      ? `Emergency Alert: ${alert?.flag_description || 'High-priority symptom flagged during intake'}`
      : `Emergency Status: Standard clinical priority; no critical red flags detected`,
    patientData?.hpi_onset
      ? `Onset & Duration: ${patientData.hpi_onset}`
      : `Clinical Course: Presenting for primary OPD evaluation`,
    vitals
      ? `Triage Vitals: BP ${vitals.bp || '120/80'}, Pulse ${vitals.pulse || '76 bpm'}, SpO2 ${vitals.spo2 || '98%'}`
      : `Intake Status: Completed via MediKiosk digital kiosk intake terminal`
  ];

  return {
    patient_id: patientData?.patient_id,
    one_line_summary: chief.split('.')[0].trim().slice(0, 115),
    summary_bullets: bullets,
    cached: false,
    source: 'local_fallback'
  };
}

/**
 * AI-Generated Short Patient Summary for Doctor Console (with dual caching)
 */
export async function fetchDoctorPatientSummary(patientId, patientData, forceRefresh = false) {
  const cacheKey = `medikiosk_doc_summary_${patientId}`;

  if (!forceRefresh) {
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed?.summary_bullets?.length > 0) {
          return { data: { ...parsed, cached: true }, isLive: true, error: null };
        }
      }
    } catch (e) {
      // ignore
    }
  }

  try {
    const res = await fetchWithTimeout(
      `${BASE_URL}/api/doctor/summarize-patient`,
      {
        method: 'POST',
        body: JSON.stringify({
          patient_id: String(patientId),
          patient_data: patientData || {}
        })
      },
      8000
    );

    if (res.ok) {
      const data = await res.json();
      try {
        localStorage.setItem(cacheKey, JSON.stringify(data));
      } catch (e) {}
      return { data, isLive: true, error: null };
    }
  } catch (err) {
    console.warn(`[api] summarize-patient API note: ${err.message}. Using intelligent clinical fallback.`);
  }

  const fallback = generateLocalPatientSummary(patientData);
  try {
    localStorage.setItem(cacheKey, JSON.stringify(fallback));
  } catch (e) {}
  return { data: fallback, isLive: false, error: null };
}

