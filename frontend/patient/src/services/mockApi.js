/**
 * Mock API service for Smart India Hackathon (SIH26047 - MediKiosk)
 * Simulates backend interaction for OPD Patient Kiosk Intake
 */

// Sample pre-registered patient database for instant touch kiosk demo testing
const MOCK_PATIENT_DB = {
  'AYUSH9901': {
    login_id: 'AYUSH9901',
    password: 'password123',
    full_name: 'Rajesh Kumar Sharma',
    preferred_language: 'Hindi',
    accessibility_mode: 'standard',
    phone_number: '9876543210',
    abha_id: '12-3456-7890-1234',
    age: 48,
    gender: 'Male'
  },
  '9876543210': {
    login_id: '9876543210',
    password: '123',
    full_name: 'Dr. Sunita Patel',
    preferred_language: 'Gujarati',
    accessibility_mode: 'large-text-high-contrast',
    phone_number: '9876543210',
    abha_id: '98-7654-3210-9876',
    age: 36,
    gender: 'Female'
  },
  'PATIENT01': {
    login_id: 'PATIENT01',
    password: '123',
    full_name: 'Amitabh Verma',
    preferred_language: 'English',
    accessibility_mode: 'audio-guided',
    phone_number: '9988776655',
    abha_id: '44-5566-7788-9900',
    age: 52,
    gender: 'Male'
  }
};

/**
 * Generate a realistic OPD token number (e.g. A-102, B-204)
 */
export const generateTokenNumber = (departmentPrefix = 'A') => {
  const randomNum = Math.floor(100 + Math.random() * 900);
  return `${departmentPrefix}-${randomNum}`;
};

/**
 * Login patient via Kiosk (ABHA, Phone, or Login ID)
 * @param {string} login_id - Patient ABHA, Mobile Number, or Kiosk Login ID
 * @param {string} password - Patient PIN or Password
 * @returns {Promise<Object>} Mock patient record with token
 */
export const loginPatient = async (login_id, password) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (!login_id || !password) {
        reject(new Error('Please enter both Login ID / Mobile / ABHA and Password / PIN.'));
        return;
      }

      const cleanId = login_id.trim();
      const existing = MOCK_PATIENT_DB[cleanId];

      if (existing) {
        const token = generateTokenNumber('A');
        console.log(
          '%c[MediKiosk MockAPI] loginPatient SUCCESS:%c',
          'background: #059669; color: white; padding: 2px 6px; border-radius: 4px; font-weight: bold;',
          'color: inherit;',
          { login_id, patient: existing, token_number: token }
        );

        resolve({
          success: true,
          token_number: token,
          patient: {
            login_id: existing.login_id,
            full_name: existing.full_name,
            preferred_language: existing.preferred_language || 'Hindi',
            accessibility_mode: existing.accessibility_mode || 'standard',
            phone_number: existing.phone_number,
            abha_id: existing.abha_id,
            consents: [
              { consent_type: 'data_capture', is_granted: true, granted_via: 'touch' },
              { consent_type: 'abdm_sharing', is_granted: true, granted_via: 'touch' }
            ]
          }
        });
      } else {
        // Fallback for new kiosk registrations/walk-ins
        const generatedToken = generateTokenNumber('A');
        const defaultName = cleanId.includes('@')
          ? cleanId.split('@')[0]
          : `Patient (${cleanId.slice(-4) || 'Walk-in'})`;

        const newPatient = {
          login_id: cleanId,
          full_name: defaultName,
          preferred_language: 'Hindi',
          accessibility_mode: 'standard',
          phone_number: cleanId.length === 10 && /^\d+$/.test(cleanId) ? cleanId : '9876543210',
          abha_id: `91-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
          consents: [
            { consent_type: 'data_capture', is_granted: false, granted_via: 'touch' },
            { consent_type: 'abdm_sharing', is_granted: false, granted_via: 'touch' }
          ]
        };

        console.log(
          '%c[MediKiosk MockAPI] loginPatient (Walk-in / New Profile Created):%c',
          'background: #0284c7; color: white; padding: 2px 6px; border-radius: 4px; font-weight: bold;',
          'color: inherit;',
          { login_id, patient: newPatient, token_number: generatedToken }
        );

        resolve({
          success: true,
          token_number: generatedToken,
          patient: newPatient
        });
      }
    }, 500);
  });
};

/**
 * Save Patient Onboarding Data
 * Transmits full onboarding payload matching backend SQL schema
 * @param {Object} data - Patient data payload
 * @returns {Promise<Object>} Response with generated token and confirmation
 */
export const savePatientOnboarding = async (data) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const generatedToken = data.token_number || generateTokenNumber('A');

      const payload = {
        login_id: data.login_id || 'KIOSK_ANON_' + Date.now(),
        full_name: data.full_name || 'Walk-in Patient',
        preferred_language: data.preferred_language || 'Hindi',
        accessibility_mode: data.accessibility_mode || 'standard',
        consents: data.consents || [],
        token_number: generatedToken,
        timestamp: new Date().toISOString(),
        kiosk_id: 'AI-KIOSK-OPD-04',
        hospital: 'All India Institute of Ayurveda (AIIA) / Ayush OPD',
        status: 'CHECKED_IN'
      };

      console.group(
        '%c[MediKiosk MockAPI] savePatientOnboarding Payload Transmitted%c',
        'background: #10b981; color: #022c22; font-weight: bold; padding: 4px 8px; border-radius: 4px;',
        'color: inherit;'
      );
      console.log('📦 Backend SQL Target: patients & consents tables');
      console.table({
        'Full Name': payload.full_name,
        'Login / ABHA ID': payload.login_id,
        'Preferred Language': payload.preferred_language,
        'Accessibility Mode': payload.accessibility_mode,
        'Token Assigned': payload.token_number,
        'Data Capture Consent': payload.consents.find(c => c.consent_type === 'data_capture')?.is_granted ? 'Granted (Touch)' : 'Denied',
        'ABDM Sharing Consent': payload.consents.find(c => c.consent_type === 'abdm_sharing')?.is_granted ? 'Granted (Touch)' : 'Denied',
        'Timestamp': payload.timestamp
      });
      console.log('Complete JSON Payload:', payload);
      console.groupEnd();

      resolve({
        success: true,
        message: 'Patient intake details recorded successfully in hospital database.',
        token_number: generatedToken,
        queue_position: 4,
        estimated_wait_minutes: 15,
        room_number: 'Room 104 (Ayush Kayachikitsa OPD)',
        timestamp: payload.timestamp
      });
    }, 600);
  });
};

export default {
  loginPatient,
  savePatientOnboarding,
  generateTokenNumber
};
