from fastapi import FastAPI, UploadFile, File, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from services.hybrid_ocr import process_hybrid_ocr, ClinicalSummary
from services.document_router import process_medical_document, extract_medical_document

app = FastAPI(
    title="MediKiosk Hybrid Vision OCR Service",
    description=(
        "Stage 1: Azure Document Intelligence (prebuilt-read & prebuilt-layout) | "
        "Stage 1.5: Deterministic dosage/frequency pairing (Python, no ML) | "
        "Stage 2: Gemini LLM structuring (gemini-3.6-flash, temp=0.0) | "
        "Stage 3: RapidFuzz drug DB verification (offline, Indian pharma)"
    ),
    version="2.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "pipeline": "Hybrid Vision OCR (Azure Doc Intelligence + Gemini 3.6 Flash + RapidFuzz)",
        "port": 8001,
    }


@app.post(
    "/ocr/process-prescription",
    response_model=ClinicalSummary,
    status_code=status.HTTP_200_OK,
    summary="Upload prescription photo and receive structured clinical JSON summary",
)
@app.post(
    "/ocr/process-hybrid",
    response_model=ClinicalSummary,
    status_code=status.HTTP_200_OK,
    include_in_schema=False,
    summary="Backwards-compatible alias for /ocr/process-prescription",
)
async def process_prescription_endpoint(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file uploaded.")

    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=400, detail="Uploaded file is 0 bytes.")

    result = process_hybrid_ocr(contents)
    return result


@app.post(
    "/ocr/process-document",
    status_code=status.HTTP_200_OK,
    summary="Upload any medical document (Prescription, Lab Report, Discharge Summary) with automatic routing",
)
async def process_document_endpoint(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file uploaded.")

    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=400, detail="Uploaded file is 0 bytes.")

    result = process_medical_document(contents)
    return result


@app.post(
    "/ocr/extract-unified",
    status_code=status.HTTP_200_OK,
    summary="Unified normalized extraction matching database schema (medications, lab_values, conditions)",
)
async def extract_unified_endpoint(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file uploaded.")

    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=400, detail="Uploaded file is 0 bytes.")

    result = extract_medical_document(contents)
    return result


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8001, reload=True)
