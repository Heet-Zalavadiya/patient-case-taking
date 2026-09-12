from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from database.connection import Base, engine
import models   # imports all SQLAlchemy models
from database.seed_data import seed_database

# ── Initialize Tables & Seed Clinical Data ─────────────────────────────────────
Base.metadata.create_all(bind=engine)
try:
    seed_database()
except Exception as e:
    import logging
    logging.getLogger("uvicorn").warning(f"Database seed check: {e}")

# ── FastAPI App Instance ──────────────────────────────────────────────────────
app = FastAPI(
    title="MediKiosk API",
    description="SIH26047 — Patient Case-Taking Software (Ministry of Ayush)",
    version="1.0.0"
)

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── CORS Middleware Configuration ─────────────────────────────────────────────
# Allows seamless communication between React frontend (ports 5174, 5173, 3000) and FastAPI
origins = [
    "http://localhost:5174",
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5174",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Global Exception Handler for MedTech API Resilience ───────────────────────
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

# ── Health check ──────────────────────────────────────────────────────────────
@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "ok", "project": "MediKiosk", "team": "SIH26047"}

# ── Include routers ───────────────────────────────────────────────────────────
from routers.patients import router as patients_router
from routers.clinical import router as clinical_router
from routers.doctor import router as doctor_router

# Include legacy kiosk routers
app.include_router(patients_router)
app.include_router(clinical_router)

# Mount primary Doctor Console REST endpoints under /api/v1 contract
app.include_router(doctor_router, prefix="/api/v1")

# Also mount under root for backwards-compatible direct paths
app.include_router(doctor_router)