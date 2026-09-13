from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from database.connection import Base, engine
import models   # imports all SQLAlchemy models so Base.metadata is populated
from database.seed_data import seed_database

# ── Initialize Tables & Seed Clinical Data ─────────────────────────────────────
Base.metadata.create_all(bind=engine)
try:
    seed_database()
except Exception as e:
    import logging
    logging.getLogger("uvicorn").warning(f"Database seed check: {e}")

# ── FastAPI App Instance ───────────────────────────────────────────────────────
app = FastAPI(
    title="MediKiosk API",
    description="SIH26047 — Patient Case-Taking Software (Ministry of Ayush)",
    version="1.0.0"
)

# ── CORS Middleware ────────────────────────────────────────────────────────────
# Allows communication between React frontend (ports 5173, 5174, 3000) and FastAPI
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5174",
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Global Exception Handler ───────────────────────────────────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal Server Error",
            "message": str(exc),
            "path": request.url.path
        }
    )

# ── Health check ───────────────────────────────────────────────────────────────
@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "ok", "project": "MediKiosk", "team": "SIH26047"}

# ── Include routers ────────────────────────────────────────────────────────────
from routers.patients import router as patients_router
from routers.clinical import router as clinical_router
from routers.doctors import router as doctor_router
from routers.chat import router as chat_router
from routers.sarvam import router as sarvam_router

# Mount all routers under /api/v1 AND root for complete Doctor & Patient frontend compatibility
app.include_router(patients_router, prefix="/api/v1")
from routers.doctors import router as doctor_router

# Mount all routers under /api/v1 AND root for complete Doctor & Patient frontend compatibility
app.include_router(patients_router, prefix="/api/v1")
app.include_router(patients_router)

app.include_router(clinical_router, prefix="/api/v1")
app.include_router(clinical_router)

app.include_router(doctor_router, prefix="/api/v1")
app.include_router(doctor_router)

app.include_router(chat_router, prefix="/api/v1")
app.include_router(chat_router)

app.include_router(sarvam_router, prefix="/api/v1")
app.include_router(sarvam_router, prefix="/api")
app.include_router(sarvam_router)


app.include_router(doctor_router, prefix="/api/v1")
app.include_router(doctor_router)