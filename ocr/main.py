from fastapi import FastAPI, UploadFile, File, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from services.hybrid_ocr import process_hybrid_ocr, ClinicalSummary

app = FastAPI(
    title="MediKiosk Hybrid Vision OCR Microservice",
    description="Stage 1: OpenCV+EasyOCR | Stage 2: Groq Llama-3.3-70B Structuring",
    version="1.0.0"
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
