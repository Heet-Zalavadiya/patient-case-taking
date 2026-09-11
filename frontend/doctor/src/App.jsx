import React, { useState } from 'react';
import Header from './components/Header';
import LoginPage from './components/LoginPage';
import PatientListPage from './components/PatientListPage';
import PatientDetailPage from './components/PatientDetailPage';
import { doctors } from './data/mockData';
import { mockPatients } from './data/mockFallbackData';

export function App() {
  // Global Doctor Session State
  const [currentDoctor, setCurrentDoctor] = useState(doctors[0]); // Starts logged in as Dr. Anand Kulkarni
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (message, type = 'success') => {
    setToastMessage({ message, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Switch between Allopathic and AYUSH doctor profiles
  const handleSwitchDoctor = () => {
    const nextDoctor = doctors.find(
      d => d.is_ayush_practitioner !== currentDoctor?.is_ayush_practitioner
    ) || doctors[0];
    setCurrentDoctor(nextDoctor);
    showToast(
      `Switched profile to ${nextDoctor.name} (${nextDoctor.is_ayush_practitioner ? 'AYUSH OPD' : 'Allopathic OPD'})`,
      'info'
    );
  };

  // Login handler
  const handleLoginSuccess = (doctor) => {
    setCurrentDoctor(doctor);
    showToast(`Logged in successfully as ${doctor.name}`);
  };

  // Logout handler
  const handleLogout = () => {
    setCurrentDoctor(null);
    setSelectedPatientId(null);
    showToast('Logged out of clinical console');
  };

  // Alert acknowledgment from detail view
  const handleAlertAcknowledged = (alertId, isAcknowledged) => {
    showToast(
      isAcknowledged
        ? 'Emergency Alert acknowledged & logged in clinical audit trail'
        : 'Emergency Alert marked as pending action',
      isAcknowledged ? 'success' : 'warning'
    );
  };

  // Find active patient by ID
  const selectedPatient = mockPatients.find(p => p.patient_id === selectedPatientId) || {
    patient_id: selectedPatientId,
    full_name: "Ramesh Kumar",
    age: 58,
    gender: "Male",
    mrn: "AIIA-2026-9812",
    token: "EM-101",
    queue_number: "Q-01",
    check_in_time: "10:30 AM",
    status: "waiting",
    blood_group: "B+",
    phone: "+91 98112 34567",
    vitals_summary: {
      bp: "168/102 mmHg",
      pulse: "108 bpm",
      spo2: "91%",
      temp: "98.8 °F",
      rr: "26 /min"
    },
    triage_category: "Emergency / Priority 1"
  };

  // If user is logged out, render Login Page
  if (!currentDoctor) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-[#fafaf7] text-slate-800 flex flex-col selection:bg-[#0e4d34] selection:text-white">
      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 animate-bounce">
          <div className={`px-4 py-3 rounded-2xl shadow-xl border text-xs font-bold flex items-center gap-2 ${
            toastMessage.type === 'warning'
              ? 'bg-rose-50 border-rose-300 text-rose-900'
              : toastMessage.type === 'info'
              ? 'bg-sky-50 border-sky-300 text-sky-900'
              : 'bg-emerald-50 border-emerald-300 text-emerald-950'
          }`}>
            <span>{toastMessage.message}</span>
          </div>
        </div>
      )}

      {/* Main Clinical Header */}
      <Header
        currentDoctor={currentDoctor}
        onSwitchDoctor={handleSwitchDoctor}
        onLogout={handleLogout}
        activeRedFlagsCount={1}
        waitingPatientsCount={mockPatients.filter(p => p.status === 'waiting').length}
        onNavigateHome={() => setSelectedPatientId(null)}
        isDetailView={!!selectedPatientId}
      />

      {/* Main Clinical Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {!selectedPatientId ? (
          <PatientListPage
            currentDoctor={currentDoctor}
            onSelectPatient={(patientId) => setSelectedPatientId(patientId)}
          />
        ) : (
          <PatientDetailPage
            patient={selectedPatient}
            currentDoctor={currentDoctor}
            onBack={() => setSelectedPatientId(null)}
            onAlertAcknowledged={handleAlertAcknowledged}
          />
        )}
      </main>

      {/* Institutional Footer */}
      <footer className="border-t border-[#e2ece5] py-4 bg-white text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#0e4d34]">MediKiosk v1.0</span>
            <span>• Smart India Hackathon 2026 (SIH26047)</span>
          </div>
          <p className="text-[11px] text-slate-500">
            Ministry of Ayush • All India Institute of Ayurveda (AIIA) • Clinical Decision Support Interface
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
