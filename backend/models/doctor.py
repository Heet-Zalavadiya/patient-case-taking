from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from database.connection import Base

class Doctor(Base):
    __tablename__ = "doctors"

    doctor_id             = Column(Integer, primary_key=True, autoincrement=True)
    full_name             = Column(String(150), nullable=False)
    department            = Column(String(100), nullable=True)
    is_ayush_practitioner = Column(Integer,     nullable=False, default=0)
    login_id              = Column(String(50),  nullable=False, unique=True)
    password_hash         = Column(String(255), nullable=False)
    created_at            = Column(DateTime,    server_default=func.now())