from fastapi import FastAPI
from database.connection import Base, engine
import models   # this imports all models so Base knows about them

# This creates all tables in SQL Server if they don't exist yet
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="MediKiosk API",
    description="SIH26047 — Patient Case-Taking Software (Ministry of Ayush)",
    version="1.0.0"
)

# ── Health check ──────────────────────────────────────────────────────────────
@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "ok", "project": "MediKiosk", "team": "SIH26047"}

# ── Include routers ───────────────────────────────────────────────────────────
from routers.patients import router as patients_router
from routers.clinical import router as clinical_router
app.include_router(patients_router)
app.include_router(clinical_router)