from sqlalchemy import Column, Integer, String, Date, DateTime
from sqlalchemy.sql import func
from database.connection import Base

class Patient(Base):
    __tablename__ = "patients"

    patient_id          = Column(Integer, primary_key=True, autoincrement=True)
    abha_id             = Column(String(20),  nullable=True,  unique=True)
    aadhaar_ref         = Column(String(20),  nullable=True)
    full_name           = Column(String(150), nullable=False)
    date_of_birth       = Column(Date,        nullable=True)
    age                 = Column(Integer,     nullable=True)
    gender              = Column(String(10),  nullable=True)
    phone_number        = Column(String(15),  nullable=True)
    preferred_language  = Column(String(30),  nullable=False, default="Hindi")
    accessibility_mode  = Column(String(30),  nullable=True)
    is_first_visit      = Column(Integer,     nullable=False, default=1)   # 1 = True, 0 = False
    login_id            = Column(String(50),  nullable=True,  unique=True)
    password_hash       = Column(String(255), nullable=True)
    registered_at       = Column(DateTime,    server_default=func.now())
    is_active           = Column(Integer,     nullable=False, default=1)