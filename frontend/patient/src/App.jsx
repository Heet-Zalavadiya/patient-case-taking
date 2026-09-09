import React from 'react';
import { PatientProvider } from './context/PatientContext';
import { KioskShell } from './components/layout/KioskShell';

function App() {
  return (
    <PatientProvider>
      <KioskShell />
    </PatientProvider>
  );
}

export default App;
