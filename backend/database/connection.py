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

# ── Connection string & Engine Initialization ─────────────────────────────
explicit_url = os.getenv("DATABASE_URL")

def build_engine():
    if explicit_url:
        connect_args = {"check_same_thread": False} if explicit_url.startswith("sqlite") else {}
        return create_engine(explicit_url, echo=False, connect_args=connect_args)

    # Attempt SQL Server
    if settings.DATABASE_USERNAME:
        sql_server_url = (
            f"mssql+pyodbc://{settings.DATABASE_USERNAME}:{settings.DATABASE_PASSWORD}"
            f"@{settings.DATABASE_SERVER}/{settings.DATABASE_NAME}"
            f"?driver=ODBC+Driver+17+for+SQL+Server"
        )
    else:
        sql_server_url = (
            f"mssql+pyodbc://@{settings.DATABASE_SERVER}/{settings.DATABASE_NAME}"
            f"?driver=ODBC+Driver+17+for+SQL+Server&trusted_connection=yes"
        )

    try:
        eng = create_engine(sql_server_url, echo=False)
        with eng.connect() as conn:
            pass
        return eng
    except Exception as e:
        # Fallback to local SQLite for seamless development & offline evaluation
        import logging
        logging.getLogger("uvicorn").warning(
            f"SQL Server unavailable ({e}). Falling back to SQLite database at ./medikiosk.db"
        )
        return create_engine("sqlite:///./medikiosk.db", echo=False, connect_args={"check_same_thread": False})

engine = build_engine()
DATABASE_URL = str(engine.url)

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