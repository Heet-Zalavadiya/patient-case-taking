const { spawn } = require('child_process');

console.log('--------------------------------------------------');
console.log('🚀 MediKiosk Unified Platform Launcher (SIH26047)');
console.log('--------------------------------------------------');
console.log('🌐 Central Portal Gateway : http://localhost:3000');
console.log('   ↳ Patient Intake Route : http://localhost:3000/patient ➔ :5173');
console.log('   ↳ Doctor Console Route : http://localhost:3000/doctor  ➔ :5174');
console.log('📱 Patient Kiosk Direct   : http://localhost:5173');
console.log('👨‍⚕️ Doctor Dashboard Direct: http://localhost:5174');
console.log('⚙️ FastAPI Backend & Docs : http://localhost:8000/docs\n');

const isWindows = process.platform === 'win32';
const npmCmd = isWindows ? 'npm.cmd' : 'npm';
const nodeCmd = isWindows ? 'node.exe' : 'node';
const pythonCmd = isWindows ? 'python' : 'python3';

// Spawn Central Portal Gateway (Port 3000)
const portalProcess = spawn(nodeCmd, ['frontend/gateway/portal.js'], {
  stdio: 'pipe',
  shell: true,
});

// Spawn Patient UI (Port 5173)
const patientProcess = spawn(npmCmd, ['--prefix', 'frontend/patient', 'run', 'dev'], {
  stdio: 'pipe',
  shell: true,
});

// Spawn Doctor Dashboard (Port 5174)
const doctorProcess = spawn(npmCmd, ['--prefix', 'frontend/doctor', 'run', 'dev'], {
  stdio: 'pipe',
  shell: true,
});

// Spawn FastAPI Backend (Port 8000)
const backendProcess = spawn(pythonCmd, ['-m', 'uvicorn', 'main:app', '--host', '0.0.0.0', '--port', '8000', '--reload'], {
  cwd: './backend',
  stdio: 'pipe',
  shell: true,
});

function logStream(stream, prefix, colorCode) {
  stream.on('data', (data) => {
    const lines = data.toString().split('\n');
    lines.forEach((line) => {
      if (line.trim()) {
        console.log(`\x1b[${colorCode}m[${prefix}]\x1b[0m ${line}`);
      }
    });
  });
}

logStream(portalProcess.stdout, 'Central Portal', '33'); // Yellow
logStream(portalProcess.stderr, 'Central Portal', '31');

logStream(patientProcess.stdout, 'Patient UI', '36'); // Cyan
logStream(patientProcess.stderr, 'Patient UI', '31');

logStream(doctorProcess.stdout, 'Doctor UI', '35');  // Magenta
logStream(doctorProcess.stderr, 'Doctor UI', '31');

logStream(backendProcess.stdout, 'FastAPI Backend', '32'); // Green
logStream(backendProcess.stderr, 'FastAPI Backend', '31');

function cleanup() {
  console.log('\nStopping MediKiosk platform servers...');
  portalProcess.kill();
  patientProcess.kill();
  doctorProcess.kill();
  backendProcess.kill();
  process.exit();
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
