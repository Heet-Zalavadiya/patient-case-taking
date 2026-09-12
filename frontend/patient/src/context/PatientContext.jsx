import React, { createContext, useContext, useState, useEffect } from 'react';

/**
 * Backend SQL Schema Alignment:
 * - login_id: string (varchar 50)
 * - password: string (raw password for authentication / registration)
 * - full_name: string (varchar 150)
 * - preferred_language: 'Hindi' | 'English' | 'Gujarati' (default: 'Hindi')
 * - accessibility_mode: 'standard' | 'audio-guided' | 'large-text-high-contrast' (default: 'standard')
 * - consents: array of { consent_type: 'data_capture' | 'abdm_sharing', is_granted: boolean, granted_via: 'touch' | 'audio' }
 * - current_step: number (1 to 6)
 * - token_number: string (e.g., 'A-102')
 * - session_id: number | null
 * - session_status: 'in_progress' | 'completed' (default: 'in_progress')
 * - summary_id: number | null
 * - summary_data: object | null
 * - history_mode: 'allopathic' | 'ayush' (default: 'allopathic')
 * - interview_turns: array of { turn_number, input_mode, ai_question, patient_response_text, response_language }
 * - red_flag_alert: object | null
 * - uploaded_documents: array of { document_id, document_type, ocr_status, file_name, ... }
 */

const initialPatientState = {
  patient_id: null,
  login_id: '',
  password: '',
  full_name: '',
  age: null,
  gender: '',
  demo_chief_complaint: '',
  preferred_language: 'Hindi', // 'Hindi' | 'English' | 'Gujarati'
  accessibility_mode: 'standard', // 'standard' | 'audio-guided' | 'large-text-high-contrast'
  consents: [
    { consent_type: 'data_capture', is_granted: false, granted_via: 'touch' },
    { consent_type: 'abdm_sharing', is_granted: false, granted_via: 'touch' }
  ],
  current_step: 1, // 1 to 6
  token_number: '', // e.g. 'A-102'
  session_id: null,
  session_status: 'in_progress', // 'in_progress' | 'completed'
  summary_id: null,
  summary_data: null,
  history_mode: 'allopathic', // 'allopathic' | 'ayush'
  interview_turns: [],
  red_flag_alert: null,
  uploaded_documents: [],
  painLocations: [], // Body map selected pain areas e.g. ['Stomach & Abdomen']
  pain_locations: []
};

const PatientContext = createContext(undefined);

export const PatientProvider = ({ children }) => {
  const [theme, setThemeState] = useState(() => {
    try {
      const savedTheme = localStorage.getItem('medikiosk_theme') || sessionStorage.getItem('medikiosk_theme');
      if (savedTheme === 'light' || savedTheme === 'dark') return savedTheme;
    } catch (e) {
      console.warn('Could not restore theme:', e);
    }
    return 'dark'; // Default MEDI-OS dark kiosk theme
  });

  const [patientData, setPatientData] = useState(() => {
    try {
      const saved = sessionStorage.getItem('medikiosk_patient_session');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Could not restore session from storage:', e);
    }
    return initialPatientState;
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Sync theme to storage
  const setTheme = (newTheme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem('medikiosk_theme', newTheme);
      sessionStorage.setItem('medikiosk_theme', newTheme);
    } catch (e) {
      console.warn('Could not persist theme:', e);
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  // Sync to session storage for kiosk recovery in case of accidental refresh
  useEffect(() => {
    try {
      sessionStorage.setItem('medikiosk_patient_session', JSON.stringify(patientData));
    } catch (e) {
      console.warn('Failed to persist kiosk session:', e);
    }
  }, [patientData]);

  // Update a single key-value
  const setPatientField = (field, value) => {
    setPatientData((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  // Bulk update
  const updatePatient = (fields) => {
    setPatientData((prev) => ({
      ...prev,
      ...fields
    }));
  };

  // Language switcher
  const setLanguage = (preferred_language) => {
    setPatientData((prev) => ({
      ...prev,
      preferred_language
    }));
  };

  // Accessibility switcher
  const setAccessibilityMode = (accessibility_mode) => {
    setPatientData((prev) => ({
      ...prev,
      accessibility_mode
    }));
  };

  // Consent toggling with granted_via metadata
  const setConsent = (consent_type, is_granted, granted_via = 'touch') => {
    setPatientData((prev) => {
      const existing = prev.consents || [];
      const updated = existing.map((item) => {
        if (item.consent_type === consent_type) {
          return {
            ...item,
            is_granted: Boolean(is_granted),
            granted_via
          };
        }
        return item;
      });

      // If consent wasn't in array, add it
      if (!updated.some((c) => c.consent_type === consent_type)) {
        updated.push({
          consent_type,
          is_granted: Boolean(is_granted),
          granted_via
        });
      }

      return {
        ...prev,
        consents: updated
      };
    });
  };

  const toggleConsent = (consent_type, granted_via = 'touch') => {
    setPatientData((prev) => {
      const item = prev.consents.find((c) => c.consent_type === consent_type);
      const nextGranted = item ? !item.is_granted : true;
      return {
        ...prev,
        consents: prev.consents.map((c) =>
          c.consent_type === consent_type
            ? { ...c, is_granted: nextGranted, granted_via }
            : c
        )
      };
    });
  };

  // Day 2 Clinical Session & Intake Helpers
  const setPatientId = (patient_id) => {
    setPatientData((prev) => ({
      ...prev,
      patient_id
    }));
  };

  const setSessionId = (session_id) => {
    setPatientData((prev) => ({
      ...prev,
      session_id
    }));
  };

  const setSessionStatus = (session_status) => {
    setPatientData((prev) => ({
      ...prev,
      session_status
    }));
  };

  const setSummaryData = (summary_id, summary_data) => {
    setPatientData((prev) => ({
      ...prev,
      summary_id: summary_id || prev.summary_id,
      summary_data: summary_data || prev.summary_data
    }));
  };

  const setHistoryMode = (history_mode) => {
    setPatientData((prev) => ({
      ...prev,
      history_mode
    }));
  };

  const addInterviewTurn = (turn) => {
    setPatientData((prev) => ({
      ...prev,
      interview_turns: [...(prev.interview_turns || []), turn]
    }));
  };

  const setRedFlagAlert = (red_flag_alert) => {
    setPatientData((prev) => ({
      ...prev,
      red_flag_alert
    }));
  };

  const clearRedFlagAlert = () => {
    setPatientData((prev) => ({
      ...prev,
      red_flag_alert: null
    }));
  };

  const addUploadedDocument = (doc) => {
    setPatientData((prev) => ({
      ...prev,
      uploaded_documents: [...(prev.uploaded_documents || []), doc]
    }));
  };

  const updateUploadedDocument = (docId, updates) => {
    setPatientData((prev) => ({
      ...prev,
      uploaded_documents: (prev.uploaded_documents || []).map((d) =>
        (d.id === docId || d.document_id === docId) ? { ...d, ...updates } : d
      )
    }));
  };

  const removeUploadedDocument = (docId) => {
    setPatientData((prev) => ({
      ...prev,
      uploaded_documents: (prev.uploaded_documents || []).filter(
        (d) => d.id !== docId && d.document_id !== docId
      )
    }));
  };

  // Step navigation (bounded 1 to 7)
  const nextStep = () => {
    setPatientData((prev) => ({
      ...prev,
      current_step: Math.min(prev.current_step + 1, 7)
    }));
  };

  const prevStep = () => {
    setPatientData((prev) => ({
      ...prev,
      current_step: Math.max(prev.current_step - 1, 1)
    }));
  };

  const goToStep = (stepNumber) => {
    if (stepNumber >= 1 && stepNumber <= 7) {
      setPatientData((prev) => ({
        ...prev,
        current_step: stepNumber
      }));
    }
  };

  const setPainLocations = (locations) => {
    setPatientData((prev) => ({
      ...prev,
      painLocations: locations,
      pain_locations: locations
    }));
  };

  const setTokenNumber = (token_number) => {
    setPatientData((prev) => ({
      ...prev,
      token_number
    }));
  };

  // Reset for next patient on kiosk
  const resetSession = () => {
    sessionStorage.removeItem('medikiosk_patient_session');
    setPatientData({
      ...initialPatientState
    });
    setError(null);
    setIsLoading(false);
  };

  const value = {
    patientData,
    theme,
    setTheme,
    toggleTheme,
    isLoading,
    error,
    setIsLoading,
    setError,
    setPatientField,
    updatePatient,
    setLanguage,
    setAccessibilityMode,
    setConsent,
    toggleConsent,
    setPatientId,
    setSessionId,
    setSessionStatus,
    setSummaryData,
    setHistoryMode,
    addInterviewTurn,
    setRedFlagAlert,
    clearRedFlagAlert,
    addUploadedDocument,
    updateUploadedDocument,
    removeUploadedDocument,
    nextStep,
    prevStep,
    goToStep,
    setPainLocations,
    setTokenNumber,
    resetSession
  };

  return (
    <PatientContext.Provider value={value}>
      {children}
    </PatientContext.Provider>
  );
};

export const usePatient = () => {
  const context = useContext(PatientContext);
  if (!context) {
    throw new Error('usePatient must be used within a PatientProvider');
  }
  return context;
};

export default PatientContext;
