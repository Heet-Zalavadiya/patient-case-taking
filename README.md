# MediKiosk — Patient Case-Taking Software (Ministry of Ayush)

A full-stack, AI-powered OPD case-taking and clinical document ingestion platform for the **Smart India Hackathon 2026 (Problem Statement: SIH26047)**.

---

## Repository Structure

```
patient-case-taking/
├── backend/          # FastAPI core backend service & database ORM (SQL Server)
├── frontend/         # React / Vite patient kiosk UI
├── ai/               # Adaptive clinical interview service (Gemini adaptive SOCRATES)
├── ocr/              # Azure Document Intelligence + Gemini clinical vision OCR microservice
├── documents/        # Clinical templates, Ayush intake schemas & specifications
└── tests/            # End-to-end integration tests
```

---

## Microservices & Documentation

- **[OCR & Clinical Document Engine README](ocr/README.md)**: Full architecture, spatial geometry, PII masking, 250k drug verification index, universal adapter, and backend integration guide.
- **Backend API**: Core patient management, session creation, clinical turn storage, and Ayush medical history.
- **AI Interviewer**: Conversational case-taking with real-time red-flag emergency detection.
