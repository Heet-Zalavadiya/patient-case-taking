from fastapi import FastAPI, UploadFile, File, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from services.hybrid_ocr import process_hybrid_ocr, ClinicalSummary

app = FastAPI(
    title="MediKiosk Hybrid Vision OCR Microservice",
    description=(
        "Stage 1: Azure Document Intelligence (prebuilt-read) — spatial 2D OCR | "
        "Stage 1.5: Deterministic dosage/frequency pairing (Python, no ML) | "
        "Stage 2: Gemini LLM structuring (gemini-3.6-flash, temp=0.0) | "
        "Stage 3: RapidFuzz drug DB verification (offline, Indian pharma)"
    ),
    version="2.0.0"
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
    return {"status": "ok", "mode": "Hybrid Vision OCR (EasyOCR + Groq Llama 70B)", "port": 8001}

@app.post(
    "/ocr/process-hybrid",
    response_model=ClinicalSummary,
    status_code=status.HTTP_200_OK,
    summary="Upload prescription photo and receive structured clinical JSON summary"
)
async def process_hybrid_endpoint(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file uploaded.")

    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=400, detail="Uploaded file is 0 bytes.")

    result = process_hybrid_ocr(contents)
    return result

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8001, reload=True)
