from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta
from typing import Optional

import models, schemas, dependencies
from database import get_db
from config import settings

router = APIRouter(
    prefix="/auth",
    tags=["auth"]
)

import random

# Simple in-memory OTP cache for demonstration
# In production, use Redis with expiration
OTP_CACHE = {}

@router.post("/otp")
def generate_otp(request: schemas.CheckUserRequest):
    # Determine if user exists to tailor message (security trade-off: enumeration)
    # For this app, it's fine.
    otp = "1234" # Hardcoded for Hackathon Stability (Resilient to restarts)
    OTP_CACHE[request.phone] = otp
    print(f"🔐 GENERATED OTP for {request.phone}: {otp}")
    return {"message": "OTP sent successfully"}

@router.post("/check-user", response_model=schemas.CheckUserResponse)
def check_user(request: schemas.CheckUserRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.phone == request.phone).first()
    return {"exists": user is not None}

@router.post("/login", response_model=schemas.Token)
def login(request: schemas.LoginRequest, db: Session = Depends(get_db)):
    # 1. Verify OTP
    stored_otp = OTP_CACHE.get(request.phone)
    
    # Master OTP for testing
    if request.otp == "1234":
        pass 
    elif not stored_otp or request.otp != stored_otp:
         raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired OTP",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Clear OTP after use (replay protection) if it was a real one
    if request.otp != "1234" and request.phone in OTP_CACHE:
        del OTP_CACHE[request.phone]
    
    # 2. Check if user exists
    user = db.query(models.User).filter(models.User.phone == request.phone).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found. Please register.",
        )
    
    # Update last_active_at and set new session_id on login
    import datetime
    import uuid
    user.last_active_at = datetime.datetime.utcnow()
    
    # Session Management: Single Device Login
    new_session_id = str(uuid.uuid4())
    user.session_id = new_session_id
    
    db.commit()
        
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = dependencies.create_access_token(
        data={"sub": user.phone, "sid": new_session_id}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer", "is_registered": True}

@router.post("/register", response_model=schemas.Token)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    # Verify OTP
    stored_otp = OTP_CACHE.get(user.phone)
    
    # Master OTP
    if user.otp == "1234":
        pass
    elif not stored_otp or user.otp != stored_otp:
         raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired OTP",
        )
    
    # Clear OTP
    if user.otp != "1234" and user.phone in OTP_CACHE:
        del OTP_CACHE[user.phone]

    db_user = db.query(models.User).filter(models.User.phone == user.phone).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Phone number already registered")
    
    new_user = models.User(
        fullname=user.fullname,
        phone=user.phone,
        dob=user.dob,
        blood_group=user.blood_group,
        address=user.address,
        health_issues=user.health_issues,
        role=user.role
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = dependencies.create_access_token(
        data={"sub": new_user.phone}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer", "is_registered": True}
