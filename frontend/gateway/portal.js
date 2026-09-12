const http = require('http');

const PORT = 3000;

const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MediKiosk — Central Platform Portal (SIH26047)</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700;800&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-gradient: linear-gradient(135deg, #0f172a 0%, #064e3b 50%, #022c22 100%);
      --card-bg: rgba(15, 23, 42, 0.75);
      --card-border: rgba(52, 211, 153, 0.2);
      --card-hover: rgba(52, 211, 153, 0.12);
      --accent-green: #10b981;
      --accent-emerald: #059669;
      --accent-cyan: #06b6d4;
      --text-main: #f8fafc;
      --text-muted: #94a3b8;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Inter', sans-serif;
      background: var(--bg-gradient);
      color: var(--text-main);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem 1rem;
    }

    .container {
      max-width: 1100px;
      width: 100%;
      text-align: center;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: rgba(16, 185, 129, 0.15);
      border: 1px solid rgba(16, 185, 129, 0.4);
      color: #34d399;
      padding: 0.4rem 1rem;
      border-radius: 9999px;
      font-size: 0.875rem;
      font-weight: 600;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      margin-bottom: 1.5rem;
    }

    .status-dot {
      width: 8px;
      height: 8px;
      background-color: #10b981;
      border-radius: 50%;
      box-shadow: 0 0 10px #10b981;
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.5; transform: scale(1.2); }
    }

    h1 {
      font-family: 'Outfit', sans-serif;
      font-size: 3rem;
      font-weight: 800;
      background: linear-gradient(to right, #ffffff, #a7f3d0);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 0.75rem;
      line-height: 1.2;
    }

    .subtitle {
      font-size: 1.125rem;
      color: var(--text-muted);
      max-width: 650px;
      margin: 0 auto 3rem auto;
      line-height: 1.6;
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 1.75rem;
      text-align: left;
    }

    .card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border-radius: 1.25rem;
      padding: 2rem;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      position: relative;
      overflow: hidden;
    }

    .card:hover {
      transform: translateY(-6px);
      border-color: rgba(52, 211, 153, 0.5);
      box-shadow: 0 20px 40px -15px rgba(6, 78, 59, 0.5);
    }

    .icon-wrapper {
      width: 56px;
      height: 56px;
      border-radius: 0.875rem;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.75rem;
      margin-bottom: 1.25rem;
    }

    .card-patient .icon-wrapper { background: rgba(6, 182, 212, 0.15); color: #38bdf8; }
    .card-doctor .icon-wrapper { background: rgba(16, 185, 129, 0.15); color: #34d399; }
    .card-backend .icon-wrapper { background: rgba(168, 85, 247, 0.15); color: #c084fc; }

    .card h3 {
      font-family: 'Outfit', sans-serif;
      font-size: 1.5rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
      color: #ffffff;
    }

    .card p {
      font-size: 0.95rem;
      color: var(--text-muted);
      line-height: 1.5;
      margin-bottom: 1.5rem;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.875rem 1.5rem;
      border-radius: 0.75rem;
      font-weight: 600;
      font-size: 0.95rem;
      text-decoration: none;
      transition: all 0.2s ease;
      cursor: pointer;
    }

    .btn-patient { background: #0284c7; color: white; }
    .btn-patient:hover { background: #0369a1; box-shadow: 0 4px 12px rgba(2, 132, 199, 0.4); }

    .btn-doctor { background: var(--accent-emerald); color: white; }
    .btn-doctor:hover { background: #047857; box-shadow: 0 4px 12px rgba(5, 150, 105, 0.4); }

    .btn-backend { background: #7e22ce; color: white; }
    .btn-backend:hover { background: #6b21a8; box-shadow: 0 4px 12px rgba(126, 34, 206, 0.4); }

    .port-tag {
      font-size: 0.8rem;
      color: #64748b;
      font-family: monospace;
      margin-top: 0.75rem;
    }

    footer {
      margin-top: 4rem;
      color: #64748b;
      font-size: 0.875rem;
    }
  </style>
</head>
<body>

  <div class="container">
    <div class="badge">
      <span class="status-dot"></span>
      SIH26047 — MediKiosk Platform Live
    </div>

    <h1>MediKiosk Central Portal</h1>
    <p class="subtitle">AI Clinical History-Taking Software Platform · All India Institute of Ayurveda (Ministry of Ayush)</p>

    <div class="grid">

      <!-- Patient Kiosk UI -->
      <div class="card card-patient">
        <div>
          <div class="icon-wrapper">📱</div>
          <h3>Patient Kiosk Portal</h3>
          <p>Multimodal intake flow with voice-to-text, consent capture, and AI interview follow-ups for OPD patients.</p>
        </div>
        <div>
          <a href="http://localhost:5173" target="_blank" class="btn btn-patient">
            Open Patient Portal ➔
          </a>
          <div class="port-tag">Local Dev Port: http://localhost:5173</div>
        </div>
      </div>

      <!-- Doctor Dashboard -->
      <div class="card card-doctor">
        <div>
          <div class="icon-wrapper">👨‍⚕️</div>
          <h3>Doctor Dashboard</h3>
          <p>Physician evaluation console displaying structured clinical history, red-flag emergency alerts, and OCR lab values.</p>
        </div>
        <div>
          <a href="http://localhost:5174" target="_blank" class="btn btn-doctor">
            Open Doctor Console ➔
          </a>
          <div class="port-tag">Local Dev Port: http://localhost:5174</div>
        </div>
      </div>

      <!-- FastAPI Backend & API Docs -->
      <div class="card card-backend">
        <div>
          <div class="icon-wrapper">⚙️</div>
          <h3>FastAPI Backend & API Docs</h3>
          <p>Interactive Swagger API documentation, SQL Server database tables, and ABDM FHIR integration endpoints.</p>
        </div>
        <div>
          <a href="http://localhost:8000/docs" target="_blank" class="btn btn-backend">
            Open Swagger Docs ➔
          </a>
          <div class="port-tag">Local Dev Port: http://localhost:8000</div>
        </div>
      </div>

    </div>

    <footer>
      MediKiosk Monorepo Portal · Powered by FastAPI, React & SQL Server
    </footer>
  </div>

</body>
</html>`;

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(htmlContent);
});

server.listen(PORT, () => {
  console.log(`🌐 Central Platform Gateway Portal running on http://localhost:${PORT}`);
});
