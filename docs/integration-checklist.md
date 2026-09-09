cat << 'EOF' > docs/integration-checklist.md
# Integration Checklist & QA Protocol

## Day 1 Baseline Checks
- [ ] Member 1: Patient UI runs locally (Vite/React).
- [ ] Member 2: Doctor Dashboard runs locally.
- [ ] Member 3: FastAPI boots on port 8000 (Swagger docs accessible at http://localhost:8000/docs).
- [ ] Member 3: Database tables create successfully.
- [ ] Member 4: AI interview script outputs valid structured JSON.
- [ ] Member 5: OCR pipeline extracts text from sample prescription/lab report.

## Schema Contracts to Validate
- [ ] Patient Intake: Member 1 form payload matches Member 3 Pydantic model.
- [ ] AI Summary: Member 4 output format matches Member 3 ClinicalSummary schema.
- [ ] OCR Extraction: Member 5 extracted entities match Member 3 Document schema.
EOF