import React, { createContext, useContext, useState, useEffect } from 'react';

/**
 * Backend SQL Schema Alignment:
 * - login_id: string (varchar 50)
 * - password: string (raw password for authentication / registration)
 * - full_name: string (varchar 150)
 * - preferred_language: 'Hindi' | 'English' | 'Gujarati' (default: 'Hindi')
 * - accessibility_mode: 'standard' | 'audio-guided' | 'large-text-high-contrast' (default: 'standard')
 * - consents: array of { consent_type: 'data_capture' | 'abdm_sharing', is_granted: boolean, granted_via: 'touch' | 'audio' }
 * - current_step: number (1 to 4)
 * - token_number: string (e.g., 'A-102')
 */

const initialPatientState = {
  login_id: '',
  password: '',
  full_name: '',
  preferred_language: 'Hindi', // 'Hindi' | 'English' | 'Gujarati'
  accessibility_mode: 'standard', // 'standard' | 'audio-guided' | 'large-text-high-contrast'
  consents: [
    { consent_type: 'data_capture', is_granted: false, granted_via: 'touch' },
    { consent_type: 'abdm_sharing', is_granted: false, granted_via: 'touch' }
  ],
  current_step: 1, // 1 to 4
  token_number: '' // e.g. 'A-102'
};

const PatientContext = createContext(undefined);

export const PatientProvider = ({ children }) => {
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

  // Step navigation (bounded 1 to 4)
  const nextStep = () => {
    setPatientData((prev) => ({
      ...prev,
      current_step: Math.min(prev.current_step + 1, 4)
    }));
  };

  const prevStep = () => {
    setPatientData((prev) => ({
      ...prev,
      current_step: Math.max(prev.current_step - 1, 1)
    }));
  };

  const goToStep = (stepNumber) => {
    if (stepNumber >= 1 && stepNumber <= 4) {
      setPatientData((prev) => ({
        ...prev,
        current_step: stepNumber
      }));
    }
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
      ...initialPatientState,
      token_number: ''
    });
    setError(null);
    setIsLoading(false);
  };

  const value = {
    patientData,
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
    nextStep,
    prevStep,
    goToStep,
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
