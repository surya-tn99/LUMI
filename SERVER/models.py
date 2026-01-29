from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Date
from sqlalchemy.orm import relationship as sqlalchemy_relationship
from database import Base
import datetime

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    fullname = Column(String, index=True)
    phone = Column(String, unique=True, index=True)
    dob = Column(Date)
    blood_group = Column(String)
    address = Column(String)
    health_issues = Column(String, nullable=True)
    role = Column(String, default="patient")
    role = Column(String, default="patient")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    last_active_at = Column(DateTime, default=datetime.datetime.utcnow)
    session_id = Column(String, nullable=True)
    
    # Relationships
    nominees = sqlalchemy_relationship("Nominee", back_populates="user")
    medications = sqlalchemy_relationship("Medication", back_populates="user")
    medication_logs = sqlalchemy_relationship("MedicationLog", back_populates="user")
    emergency_alerts = sqlalchemy_relationship("EmergencyAlert", back_populates="user")
    health_metrics = sqlalchemy_relationship("HealthMetric", back_populates="user")
    patient_status = sqlalchemy_relationship("PatientStatus", uselist=False, back_populates="user")

class Nominee(Base):
    __tablename__ = "nominees"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String)
    relationship = Column(String)
    phone = Column(String)
    
    user = sqlalchemy_relationship("User", back_populates="nominees")

class Medication(Base):
    __tablename__ = "medications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String)
    dosage = Column(String)
    scheduled_time = Column(String) # For simplicity, storing as string "HH:MM"
    start_date = Column(Date)
    end_date = Column(Date, nullable=True)
    
    user = sqlalchemy_relationship("User", back_populates="medications")
    logs = sqlalchemy_relationship("MedicationLog", back_populates="medication")

class MedicationLog(Base):
    __tablename__ = "medication_logs"

    id = Column(Integer, primary_key=True, index=True)
    medication_id = Column(Integer, ForeignKey("medications.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    taken_at = Column(DateTime, nullable=True)
    status = Column(String) # 'taken', 'missed', 'pending'
    date = Column(Date) # The schedule date this log corresponds to
    
    medication = sqlalchemy_relationship("Medication", back_populates="logs")
    user = sqlalchemy_relationship("User", back_populates="medication_logs")

class EmergencyAlert(Base):
    __tablename__ = "emergency_alerts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    stage = Column(String) # 'voice_alert', 'calling_ambulance', etc.
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)
    
    user = sqlalchemy_relationship("User", back_populates="emergency_alerts")

class HealthMetric(Base):
    __tablename__ = "health_metrics"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    metric_type = Column(String) # 'heart_rate', 'blood_pressure', 'steps'
    value = Column(String) # Storing as string to handle '120/80' BP format easily
    unit = Column(String)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    
    user = sqlalchemy_relationship("User", back_populates="health_metrics")

class PatientStatus(Base):
    __tablename__ = "patient_statuses"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True) # One status per user
    phone = Column(String, index=True) # redundant but requested "phone number, status"
    status = Column(String, default="normal") # normal, warning, alert, emergency
    last_updated = Column(DateTime, default=datetime.datetime.utcnow)

    user = sqlalchemy_relationship("User", back_populates="patient_status")
