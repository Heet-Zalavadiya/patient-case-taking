/**
 * MediKiosk Day 2 Backend API Service Layer (SIH26047)
 * Handles real HTTP communication with backend API and provides
 * seamless, graceful fallback to mock data when the backend is offline.
 */

import { loginPatient, generateTokenNumber } from './mockApi';

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const DEFAULT_TIMEOUT_MS = 4000;

/**
 * Fetch wrapper with timeout and error handling
 */
const fetchWithTimeout = async (url, options = {}, timeoutMs = DEFAULT_TIMEOUT_MS) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
};

/**
 * 1. Register or Login Patient
 * POST /patients
 */
export const registerOrLoginPatient = async (data) => {
  const endpoint = `${API_BASE_URL}/patients`;
  console.log(`%c[API Request] POST ${endpoint}`, 'color: #0284c7; font-weight: bold;', data);

  try {
    const res = await fetchWithTimeout(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (res.ok) {
      const responseData = await res.json();
      console.log(`%c[API Response] POST ${endpoint} SUCCESS`, 'color: #059669; font-weight: bold;', responseData);
      return responseData;
    }
    throw new Error(`Server returned HTTP ${res.status}: ${res.statusText}`);
  } catch (error) {
    console.warn(`[API Fallback] ${endpoint} unreachable (${error.message}). Using mock fallback.`);
    // Fallback using mockApi
    return await loginPatient(data.login_id || 'GUEST-OPD', data.password || '123');
  }
};

/**
 * 2. Save Patient Consent
 * POST /patients/{patient_id}/consent
 */
export const saveConsent = async (patient_id, consent_data) => {
  const endpoint = `${API_BASE_URL}/patients/${patient_id}/consent`;
  console.log(`%c[API Request] POST ${endpoint}`, 'color: #0284c7; font-weight: bold;', consent_data);

  try {
    const res = await fetchWithTimeout(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(consent_data)
    });

    if (res.ok) {
      const responseData = await res.json();
      console.log(`%c[API Response] POST ${endpoint} SUCCESS`, 'color: #059669; font-weight: bold;', responseData);
      return responseData;
    }
    throw new Error(`Server returned HTTP ${res.status}: ${res.statusText}`);
  } catch (error) {
    console.warn(`[API Fallback] ${endpoint} unreachable (${error.message}). Using mock fallback.`);
    return {
      success: true,
      patient_id,
      consents: consent_data,
      timestamp: new Date().toISOString(),
      message: 'Consent preferences recorded (mock fallback)'
    };
  }
};

/**
 * 3. Create Clinical Session
 * POST /sessions
 * Returns: { session_id: number }
 */
export const createClinicalSession = async (patient_id, history_mode = 'allopathic') => {
  const endpoint = `${API_BASE_URL}/sessions`;
  const payload = {
    patient_id,
    history_mode,
    started_at: new Date().toISOString()
  };

  console.log(`%c[API Request] POST ${endpoint}`, 'color: #0284c7; font-weight: bold;', payload);

  try {
    const res = await fetchWithTimeout(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      const responseData = await res.json();
      console.log(`%c[API Response] POST ${endpoint} SUCCESS`, 'color: #059669; font-weight: bold;', responseData);
      return responseData;
    }
    throw new Error(`Server returned HTTP ${res.status}: ${res.statusText}`);
  } catch (error) {
    console.warn(`[API Fallback] ${endpoint} unreachable (${error.message}). Using mock fallback.`);
    const mockSessionId = Math.floor(100000 + Math.random() * 900000);
    return {
      success: true,
      session_id: mockSessionId,
      patient_id,
      history_mode,
      created_at: new Date().toISOString(),
      message: 'Clinical session created (mock fallback)'
    };
  }
};

/**
 * 4. Save Interview Turn
 * POST /sessions/{session_id}/turns
 * Payload: { turn_number, input_mode: 'voice' | 'touch', ai_question, patient_response_text, response_language }
 */
export const saveInterviewTurn = async (session_id, turn_data) => {
  const endpoint = `${API_BASE_URL}/sessions/${session_id}/turns`;
  console.log(`%c[API Request] POST ${endpoint}`, 'color: #0284c7; font-weight: bold;', turn_data);

  try {
    const res = await fetchWithTimeout(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(turn_data)
    });

    if (res.ok) {
      const responseData = await res.json();
      console.log(`%c[API Response] POST ${endpoint} SUCCESS`, 'color: #059669; font-weight: bold;', responseData);
      return responseData;
    }
    throw new Error(`Server returned HTTP ${res.status}: ${res.statusText}`);
  } catch (error) {
    console.warn(`[API Fallback] ${endpoint} unreachable (${error.message}). Using mock fallback.`);
    return {
      success: true,
      session_id,
      turn_id: Date.now(),
      turn_number: turn_data.turn_number || 1,
      input_mode: turn_data.input_mode || 'touch',
      recorded_at: new Date().toISOString(),
      message: 'Interview turn recorded (mock fallback)'
    };
  }
};

/**
 * 5. Trigger Red Flag
 * POST /sessions/{session_id}/red-flags
 * Payload: { flag_description, severity: 'HIGH' }
 */
export const triggerRedFlag = async (session_id, alert_data) => {
  const endpoint = `${API_BASE_URL}/sessions/${session_id}/red-flags`;
  const payload = {
    flag_description: alert_data.flag_description || 'Critical condition detected',
    severity: alert_data.severity || 'HIGH',
    detected_at: new Date().toISOString()
  };

  console.warn(`%c[EMERGENCY RED FLAG] POST ${endpoint}`, 'background: #e11d48; color: white; font-weight: bold; padding: 2px 6px;', payload);

  try {
    const res = await fetchWithTimeout(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      const responseData = await res.json();
      console.log(`%c[API Response] POST ${endpoint} SUCCESS`, 'color: #e11d48; font-weight: bold;', responseData);
      return responseData;
    }
    throw new Error(`Server returned HTTP ${res.status}: ${res.statusText}`);
  } catch (error) {
    console.warn(`[API Fallback] ${endpoint} unreachable (${error.message}). Using mock emergency response.`);
    return {
      success: true,
      session_id,
      flag_id: Date.now(),
      flag_description: payload.flag_description,
      severity: payload.severity,
      status: 'FLAGGED_TRIAGE_NOTIFIED',
      notification_dispatched: true,
      timestamp: new Date().toISOString(),
      message: 'Red flag emergency triage alert triggered (mock fallback)'
    };
  }
};

/**
 * 6. Upload Medical Document (Multipart Upload)
 * POST /documents
 * FormData: patient_id, session_id, document_type, file
 */
export const uploadMedicalDocument = async (formData) => {
  const endpoint = `${API_BASE_URL}/documents`;
  console.log(`%c[API Request] POST ${endpoint} (Multipart Form Data)`, 'color: #0284c7; font-weight: bold;');

  try {
    const res = await fetchWithTimeout(endpoint, {
      method: 'POST',
      // Note: No 'Content-Type' header here; fetch sets boundary automatically for FormData
      body: formData
    }, 10000); // 10s timeout for file upload

    if (res.ok) {
      const responseData = await res.json();
      console.log(`%c[API Response] POST ${endpoint} SUCCESS`, 'color: #059669; font-weight: bold;', responseData);
      return responseData;
    }
    throw new Error(`Server returned HTTP ${res.status}: ${res.statusText}`);
  } catch (error) {
    console.warn(`[API Fallback] ${endpoint} unreachable (${error.message}). Using mock OCR processed fallback.`);
    const mockDocId = Math.floor(1000 + Math.random() * 9000);
    return {
      success: true,
      document_id: mockDocId,
      ocr_status: 'processed',
      ocr_text: 'Patient Clinical Slip - Blood Pressure: 120/80 mmHg | Heart Rate: 72 bpm | Ayush Kayachikitsa referral verified.',
      confidence_score: 0.96,
      uploaded_at: new Date().toISOString(),
      message: 'Document uploaded and analyzed via OCR (mock fallback)'
    };
  }
};

export default {
  API_BASE_URL,
  registerOrLoginPatient,
  saveConsent,
  createClinicalSession,
  saveInterviewTurn,
  triggerRedFlag,
  uploadMedicalDocument
};
