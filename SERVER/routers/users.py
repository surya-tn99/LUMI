from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
import models, schemas, dependencies
from database import get_db

router = APIRouter(
    prefix="/users",
    tags=["users"]
)

@router.get("/me", response_model=schemas.User)
def read_users_me(current_user: models.User = Depends(dependencies.get_current_user)):
    return current_user

@router.put("/me", response_model=schemas.User)
def update_user_me(user_update: schemas.UserUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(dependencies.get_current_user)):
    # Update fields if provided
    if user_update.fullname is not None:
        current_user.fullname = user_update.fullname
    if user_update.dob is not None:
        current_user.dob = user_update.dob
    if user_update.blood_group is not None:
        current_user.blood_group = user_update.blood_group
    if user_update.address is not None:
        current_user.address = user_update.address
    if user_update.health_issues is not None:
        current_user.health_issues = user_update.health_issues
    if user_update.role is not None:
        current_user.role = user_update.role
    
    db.commit()
    db.refresh(current_user)
    return current_user

from typing import List

@router.get("/patients", response_model=List[schemas.User])
def get_my_patients(db: Session = Depends(get_db), current_user: models.User = Depends(dependencies.get_current_user)):
    # Return patients who have listed this user (by phone) as a nominee
    # Check if current user is a caretaker? (Optional, but good practice)
    
    # Query: Users joined with Nominees where Nominee.phone == current_user.phone
    patients = db.query(models.User).join(models.Nominee).filter(models.Nominee.phone == current_user.phone).distinct().all()
    
    # Enrich with status
    for p in patients:
        p.status = p.patient_status.status if p.patient_status else "normal"
        
    return patients

@router.post("/logout")
def logout_user(db: Session = Depends(get_db), current_user: models.User = Depends(dependencies.get_current_user)):
    # Force user to be "offline" by setting last_active_at to past
    import datetime
    current_user.last_active_at = datetime.datetime.utcnow() - datetime.timedelta(hours=1)
    db.commit()
    return {"message": "Logged out successfully"}
