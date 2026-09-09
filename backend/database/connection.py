from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from pydantic_settings import BaseSettings
from dotenv import load_dotenv
import os

load_dotenv()  # reads your .env file

# ── Settings ──────────────────────────────────────────────────────────────────
class Settings(BaseSettings):
    DATABASE_SERVER:   str = os.getenv("DATABASE_SERVER", "localhost\\SQLEXPRESS")
    DATABASE_NAME:     str = os.getenv("DATABASE_NAME",   "medikiosk")
    DATABASE_USERNAME: str = os.getenv("DATABASE_USERNAME", "")
    DATABASE_PASSWORD: str = os.getenv("DATABASE_PASSWORD", "")

settings = Settings()

# ── Connection string ─────────────────────────────────────────────────────────
# Option A — SQL Server Authentication (username + password in .env)
if settings.DATABASE_USERNAME:
    DATABASE_URL = (
        f"mssql+pyodbc://{settings.DATABASE_USERNAME}:{settings.DATABASE_PASSWORD}"
        f"@{settings.DATABASE_SERVER}/{settings.DATABASE_NAME}"
        f"?driver=ODBC+Driver+17+for+SQL+Server"
    )
else:
    # Option B — Windows Authentication (trusted connection, no username needed)
    DATABASE_URL = (
        f"mssql+pyodbc://@{settings.DATABASE_SERVER}/{settings.DATABASE_NAME}"
        f"?driver=ODBC+Driver+17+for+SQL+Server&trusted_connection=yes"
    )

# ── Engine & Session ──────────────────────────────────────────────────────────
engine = create_engine(DATABASE_URL, echo=True)   # echo=True prints SQL to console — helpful for debugging

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# ── Base class all models inherit from ───────────────────────────────────────
class Base(DeclarativeBase):
    pass

# ── DB dependency — used in every router ─────────────────────────────────────
def get_db():
    """
    FastAPI dependency. Use like:
        def my_route(db: Session = Depends(get_db)):
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()