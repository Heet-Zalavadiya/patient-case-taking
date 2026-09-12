import React, { useState } from 'react';
import LoginPage from './components/LoginPage';
import Header from './components/Header';
import PatientListPage from './components/PatientListPage';
import PatientDetailPage from './components/PatientDetailPage';
import SignedConsultationView from './components/SignedConsultationView';
import { doctors } from './data/mockData';
import { mockPatients } from './data/mockFallbackData';
import { ShieldCheck, PhoneCall, Check, Users, FileText, Sparkles, FileCheck } from 'lucide-react';

export function App() {
  // Global Doctor Session State — starts as null so user sees proper login screen first
  const [currentDoctor, setCurrentDoctor] = useState(null);
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [currentStep, setCurrentStep] = useState(1); // 1: Queue, 2: Case Sheet, 3: Sign-Off & Summary
  const [toastMessage, setToastMessage] = useState(null);

  // Theme state: 'dark' | 'light'
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('medikiosk_theme') || 'dark';
    } catch {
      return 'dark';
    }
  });

  // Sync theme with document class and storage
  React.useEffect(() => {
    try {
      localStorage.setItem('medikiosk_theme', theme);
    } catch (e) {
      console.warn('Could not save theme:', e);
    }

    if (theme === 'light') {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    }
  }, [theme]);

  const handleToggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    showToast(`Switched to ${nextTheme === 'dark' ? 'Dark' : 'Light'} Mode`, 'info');
  };

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

  // Login handler — authenticates as the selected/verified doctor
  const handleLoginSuccess = (doctor) => {
    setCurrentDoctor(doctor);
    setSelectedPatientId(null);
    setCurrentStep(1);
    showToast(`Welcome ${doctor.name}! Logged into ${doctor.active_opd_room || 'OPD'}`, 'success');
  };

  // Logout handler — returns to login screen
  const handleLogout = () => {
    setCurrentDoctor(null);
    setSelectedPatientId(null);
    setCurrentStep(1);
    showToast('Signed out of clinical console', 'info');
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
    patient_id: selectedPatientId || "P001",
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

  // 3-Step Workflow matching Patient UI Stepper Bar
  const workflowSteps = [
    { number: 1, title: 'Patient Queue', sub: 'प्रतीक्षा सूची', icon: Users },
    { number: 2, title: 'Case Sheet', sub: 'केस शीट', icon: FileText },
    { number: 3, title: 'Sign-Off & Summary', sub: 'सहमति व सारांश', icon: FileCheck }
  ];

  const handleStepClick = (stepNumber) => {
    if (stepNumber === 1) {
      setCurrentStep(1);
    } else if (stepNumber === 2) {
      if (selectedPatientId) {
        setCurrentStep(2);
      } else {
        showToast('Please select a patient from the queue first', 'info');
      }
    } else if (stepNumber === 3) {
      if (selectedPatientId) {
        setCurrentStep(3);
      } else {
        showToast('Please select and review a patient first', 'info');
      }
    }
  };

  // If no doctor is logged in, show the proper login screen first
  if (!currentDoctor) {
    return (
      <LoginPage
        onLoginSuccess={handleLoginSuccess}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />
    );
  }

  return (
    <div className={`min-h-screen w-full flex flex-col relative overflow-x-hidden font-sans transition-colors duration-200 ${
      theme === 'dark'
        ? 'dark bg-slate-950 text-slate-100 selection:bg-cyan-500 selection:text-slate-950'
        : 'light bg-slate-50 text-slate-900 selection:bg-cyan-500 selection:text-white'
    }`}>
      {/* Background Medical Ambient Glow & Grid Lines matching Patient UI */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-0 left-1/4 w-[600px] h-[350px] bg-cyan-600/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[350px] bg-teal-600/10 rounded-full blur-[140px]" />
        <div 
          className="absolute inset-0 opacity-[0.03]" 
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.8) 1px, transparent 0)`,
            backgroundSize: '36px 36px'
          }}
        />
      </div>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 animate-bounce">
          <div className={`px-4 py-3 rounded-2xl shadow-2xl border text-xs font-bold flex items-center gap-2 ${
            toastMessage.type === 'warning'
              ? 'bg-rose-950/95 border-rose-500/50 text-rose-200'
              : toastMessage.type === 'info'
              ? 'bg-sky-950/95 border-sky-500/50 text-sky-200'
              : 'bg-slate-900/95 border-emerald-500/50 text-emerald-300'
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
        onNavigateHome={() => {
          setSelectedPatientId(null);
          setCurrentStep(1);
        }}
        isDetailView={currentStep > 1}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      {/* Horizontal Stepper Sub-Navbar matching Patient UI */}
      <div className="relative z-20 w-full bg-slate-900/60 backdrop-blur-md border-b border-slate-800/60 py-2 sm:py-3 px-2 sm:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-3 gap-1.5 sm:gap-4 relative">
            {workflowSteps.map((step) => {
              const isCompleted = step.number < currentStep;
              const isCurrent = step.number === currentStep;

              return (
                <button
                  key={step.number}
                  type="button"
                  onClick={() => handleStepClick(step.number)}
                  className={`group flex items-center gap-1.5 sm:gap-3 p-1.5 sm:p-2.5 rounded-xl sm:rounded-2xl transition-all text-left cursor-pointer min-w-0 ${
                    isCurrent
                      ? 'bg-cyan-500/15 border border-cyan-500/40 shadow-md shadow-cyan-500/10'
                      : isCompleted
                      ? 'bg-slate-900/40 border border-teal-500/30 text-teal-300'
                      : 'bg-slate-950/30 border border-slate-800/50 text-slate-500 hover:border-slate-700'
                  }`}
                >
                  <div
                    className={`w-6 h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl flex items-center justify-center font-bold text-[11px] sm:text-sm shrink-0 transition-all ${
                      isCompleted
                        ? 'bg-teal-500 text-slate-950 shadow-sm'
                        : isCurrent
                        ? 'bg-cyan-400 text-slate-950 ring-2 sm:ring-4 ring-cyan-500/20 font-black'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {isCompleted ? <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" /> : step.number}
                  </div>

                  <div className="truncate min-w-0">
                    <div className={`text-[11px] sm:text-sm font-bold truncate ${
                      isCurrent ? 'text-white' : isCompleted ? 'text-teal-300' : 'text-slate-400'
                    }`}>
                      {step.title}
                    </div>
                    <div className="text-[10px] text-slate-500 hidden sm:block">
                      {step.sub}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Clinical Workspace */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-2 sm:px-6 py-4 sm:py-6">
        {currentStep === 1 && (
          <PatientListPage
            currentDoctor={currentDoctor}
            onSelectPatient={(patientId) => {
              setSelectedPatientId(patientId);
              setCurrentStep(2);
            }}
          />
        )}

        {currentStep === 2 && (
          <PatientDetailPage
            patient={selectedPatient}
            currentDoctor={currentDoctor}
            onBack={() => {
              setSelectedPatientId(null);
              setCurrentStep(1);
            }}
            onSignOff={() => {
              setCurrentStep(3);
              showToast('Consultation verified & digitally signed (ABDM Committed)');
            }}
            onAlertAcknowledged={handleAlertAcknowledged}
          />
        )}

        {currentStep === 3 && (
          <SignedConsultationView
            patient={selectedPatient}
            currentDoctor={currentDoctor}
            onBackToCaseSheet={() => setCurrentStep(2)}
            onNextPatient={() => {
              setSelectedPatientId(null);
              setCurrentStep(1);
              showToast('Ready for next patient in OPD queue');
            }}
          />
        )}
      </main>

      {/* Institutional Footer matching Patient UI */}
      <footer className="flex-shrink-0 relative z-20 w-full bg-slate-900/90 backdrop-blur-xl border-t border-slate-800/80 px-4 sm:px-8 py-2.5 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-teal-400" />
          <span className="hidden sm:inline">DPDP Act 2023 & Ayushman Bharat (ABDM) Compliant Doctor Node</span>
          <span className="sm:hidden">DPDP & ABDM Compliant</span>
        </div>

        <div className="hidden md:flex items-center gap-2 font-mono text-[11px] text-slate-500">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>AIIA Central Hospital • Clinical Decision Support Terminal</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-slate-400">
            <PhoneCall className="w-3.5 h-3.5 text-cyan-400" />
            <span>Staff Desk: <strong>Ext. 104</strong></span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
