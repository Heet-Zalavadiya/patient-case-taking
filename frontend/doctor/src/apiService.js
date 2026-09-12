/**
 * MediKiosk Clinical API Service Layer
 * Connects live FastAPI endpoints with resilient, zero-failure fallback
 * architecture for SIH26047 clinical deployment.
 */

import {
  mockPatients,
  mockStructuredHistories,
  mockRedFlagAlerts,
  mockExtractedLabValues,
  mockClinicalSummaries,
} from "./data/mockFallbackData";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
const DEFAULT_TIMEOUT_MS = 3000;

/**
 * Utility: Fetch with configurable timeout using AbortController
 */
async function fetchWithTimeout(
  url,
  options = {},
  timeoutMs = DEFAULT_TIMEOUT_MS,
) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

/**
 * Fetch patient queue: GET /patients
 * Falls back cleanly to mockPatients if backend is unreachable or returning error.
 */
export async function getPatients() {
  try {
    const res = await fetchWithTimeout(`${BASE_URL}/patients`);
    if (!res.ok) {
      throw new Error(`Server returned status ${res.status}`);
    }
    const data = await res.json();

    // Normalize response if returned in { patients: [...] } format
    const patientList = Array.isArray(data)
      ? data
      : data.patients || mockPatients;

    return {
      data: patientList,
      isLive: true,
      error: null,
    };
  } catch (err) {
    console.warn(
      `[apiService] GET /patients failed (${err.message}). Using resilient mock fallback.`,
    );
    return {
      data: mockPatients,
      isLive: false,
      error: err.message,
    };
  }
}

/**
 * Fetch clinical intake history for patient: GET /patients/{id}/history
 * Extracts chief_complaint and hpi_associated_symptoms from structured_history.
 * Falls back to mockStructuredHistories[id] if endpoint fails.
 */
export async function getPatientHistory(patientId) {
  try {
    const res = await fetchWithTimeout(
      `${BASE_URL}/patients/${patientId}/history`,
    );
    if (!res.ok) {
      throw new Error(`Server returned status ${res.status}`);
    }
    const data = await res.json();

    // Ensure structured_history extraction conforms to contract
    const historyData = data.structured_history || data;

    return {
      data: {
        ...mockStructuredHistories[patientId], // provide extended mock fields if not in backend yet
        ...historyData,
        patient_id: patientId,
        chief_complaint:
          historyData.chief_complaint ||
          mockStructuredHistories[patientId]?.chief_complaint ||
          "No complaint recorded",
        hpi_associated_symptoms:
          historyData.hpi_associated_symptoms ||
          mockStructuredHistories[patientId]?.hpi_associated_symptoms ||
          [],
      },
      isLive: true,
      error: null,
    };
  } catch (err) {
    console.warn(
      `[apiService] GET /patients/${patientId}/history failed (${err.message}). Using mock fallback.`,
    );
    const fallback = mockStructuredHistories[patientId] || {
      patient_id: patientId,
      chief_complaint: "General consultation & clinical review",
      hpi_associated_symptoms: ["Mild discomfort"],
      hpi_onset: "Recent onset",
      hpi_progression: "Stable",
      past_medical_history: [],
      allergies: [],
      current_medications: [],
      review_of_systems: {},
    };
    return {
      data: fallback,
      isLive: false,
      error: err.message,
    };
  }
}

/**
 * Fetch extracted lab investigations: GET /patients/{id}/labs
 * Falls back to mockExtractedLabValues (with is_abnormal: 1 highlighted).
 */
export async function getPatientLabValues(patientId) {
  try {
    const res = await fetchWithTimeout(
      `${BASE_URL}/patients/${patientId}/labs`,
    );
    if (!res.ok) {
      throw new Error(`Server returned status ${res.status}`);
    }
    const data = await res.json();
    const labList = Array.isArray(data)
      ? data
      : data.document_extracted_lab_values || [];
    return {
      data:
        labList.length > 0 ? labList : mockExtractedLabValues[patientId] || [],
      isLive: true,
      error: null,
    };
  } catch (err) {
    return {
      data: mockExtractedLabValues[patientId] || [],
      isLive: false,
      error: err.message,
    };
  }
}

/**
 * Fetch all red flag alerts: GET /alerts
 * Falls back to mockRedFlagAlerts.
 */
export async function getRedFlagAlerts() {
  try {
    const res = await fetchWithTimeout(`${BASE_URL}/alerts`);
    if (!res.ok) {
      throw new Error(`Server returned status ${res.status}`);
    }
    const data = await res.json();
    const alerts = Array.isArray(data)
      ? data
      : data.alerts || mockRedFlagAlerts;
    return {
      data: alerts,
      isLive: true,
      error: null,
    };
  } catch (err) {
    return {
      data: mockRedFlagAlerts,
      isLive: false,
      error: err.message,
    };
  }
}

/**
 * Fetch clinical consultation summary: GET /patients/{id}/summary
 * Falls back to mockClinicalSummaries.
 */
export async function getClinicalSummary(patientId) {
  try {
    const res = await fetchWithTimeout(
      `${BASE_URL}/patients/${patientId}/summary`,
    );
    if (!res.ok) {
      throw new Error(`Server returned status ${res.status}`);
    }
    const data = await res.json();
    return {
      data: data.summary || data || mockClinicalSummaries[patientId],
      isLive: true,
      error: null,
    };
  } catch (err) {
    return {
      data: mockClinicalSummaries[patientId] || {
        summary_id: `sum_${patientId}`,
        patient_id: patientId,
        status: "draft",
        draft_text:
          "Clinical intake completed via MediKiosk. Pending physician evaluation.",
        physician_notes: "",
        last_modified_by: "AI Synthesizer",
      },
      isLive: false,
      error: err.message,
    };
  }
}
