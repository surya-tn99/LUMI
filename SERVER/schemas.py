from pydantic import BaseModel
from typing import List, Optional
from datetime import date, datetime

# Token Schemas
class Token(BaseModel):
    access_token: str
    token_type: str
    is_registered: bool = True

class TokenData(BaseModel):
    phone: Optional[str] = None

# User Schemas
class UserBase(BaseModel):
    fullname: str
    phone: str
    dob: date
    blood_group: str
    address: Optional[str] = None
    health_issues: Optional[str] = None
    role: Optional[str] = "patient"

class UserCreate(UserBase):
    otp: str

class UserUpdate(BaseModel):
    fullname: Optional[str] = None
    dob: Optional[date] = None
    blood_group: Optional[str] = None
    address: Optional[str] = None
    health_issues: Optional[str] = None
    role: Optional[str] = "patient"

class User(UserBase):
    id: int
    id: int
    created_at: datetime
    last_active_at: Optional[datetime] = None
    status: Optional[str] = "normal"

    class Config:
        orm_mode = True

# Login Request
class LoginRequest(BaseModel):
    phone: str
    otp: str

class CheckUserRequest(BaseModel):
    phone: str

class CheckUserResponse(BaseModel):
    exists: bool

# Nominee Schemas
class NomineeBase(BaseModel):
    name: str
    relationship: str
    phone: str

class NomineeCreate(NomineeBase):
    pass

class NomineeUpdate(BaseModel):
    name: Optional[str] = None
    relationship: Optional[str] = None
    phone: Optional[str] = None

class Nominee(NomineeBase):
    id: int
    user_id: int

    class Config:
        orm_mode = True

# Medication Schemas
class MedicationBase(BaseModel):
    name: str
    dosage: str
    scheduled_time: str
    start_date: date
    end_date: Optional[date] = None

class MedicationCreate(MedicationBase):
    pass

class MedicationUpdate(BaseModel):
    name: Optional[str] = None
    dosage: Optional[str] = None
    scheduled_time: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None

class Medication(MedicationBase):
    id: int
    user_id: int

    class Config:
        orm_mode = True

class MedicationLogBase(BaseModel):
    status: str
    taken_at: Optional[datetime] = None

class MedicationLogCreate(MedicationLogBase):
    medication_id: int
    date: date

class MedicationLog(MedicationLogBase):
    id: int
    medication_id: int
    user_id: int
    date: date

    class Config:
        orm_mode = True

# Emergency Alert Schemas
class EmergencyAlertBase(BaseModel):
    stage: str

class EmergencyAlertCreate(EmergencyAlertBase):
    pass

class EmergencyAlert(EmergencyAlertBase):
    id: int
    user_id: int
    is_active: bool
    created_at: datetime
    resolved_at: Optional[datetime] = None

    class Config:
        orm_mode = True

# Health Metric Schemas
class HealthMetricBase(BaseModel):
    metric_type: str
    value: str
    unit: str
    timestamp: datetime

class HealthMetricCreate(HealthMetricBase):
    pass

class HealthMetric(HealthMetricBase):
    id: int
    user_id: int

    class Config:
        orm_mode = True
