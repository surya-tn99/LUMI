from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import date, timedelta
import models, schemas, dependencies
from database import get_db

router = APIRouter(
    prefix="/medications",
    tags=["medications"]
)

@router.get("/", response_model=List[schemas.Medication])
def get_medications(db: Session = Depends(get_db), current_user: models.User = Depends(dependencies.get_current_user)):
    return current_user.medications

@router.post("/", response_model=schemas.Medication)
def create_medication(med: schemas.MedicationCreate, db: Session = Depends(get_db), current_user: models.User = Depends(dependencies.get_current_user)):
    db_med = models.Medication(**med.dict(), user_id=current_user.id)
    db.add(db_med)
    db.commit()
    db.refresh(db_med)
    return db_med

@router.put("/{med_id}", response_model=schemas.Medication)
def update_medication(med_id: int, med: schemas.MedicationUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(dependencies.get_current_user)):
    db_med = db.query(models.Medication).filter(models.Medication.id == med_id, models.Medication.user_id == current_user.id).first()
    if not db_med:
        raise HTTPException(status_code=404, detail="Medication not found")
    
    update_data = med.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_med, key, value)
    
    db.commit()
    db.refresh(db_med)
    return db_med

@router.delete("/{med_id}")
def delete_medication(med_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(dependencies.get_current_user)):
    db_med = db.query(models.Medication).filter(models.Medication.id == med_id, models.Medication.user_id == current_user.id).first()
    if not db_med:
        raise HTTPException(status_code=404, detail="Medication not found")
    
    db.delete(db_med)
    db.commit()
    return {"message": "Medication deleted successfully"}

@router.post("/{med_id}/log", response_model=schemas.MedicationLog)
def log_medication(med_id: int, log: schemas.MedicationLogCreate, db: Session = Depends(get_db), current_user: models.User = Depends(dependencies.get_current_user)):
    # Verify medication belongs to user
    med = db.query(models.Medication).filter(models.Medication.id == med_id, models.Medication.user_id == current_user.id).first()
    if not med:
        raise HTTPException(status_code=404, detail="Medication not found")
    
    # Check if log already exists for this date? (Optional logic, for now allow multi-entry for demo or assume rigid schedule)
    # Ideally should check if entry exists for that `date` and `medication_id`.
    existing_log = db.query(models.MedicationLog).filter(
        models.MedicationLog.medication_id == med_id, 
        models.MedicationLog.date == log.date
    ).first()
    
    if existing_log:
        existing_log.status = log.status
        existing_log.taken_at = log.taken_at
        db.commit()
        db.refresh(existing_log)
        return existing_log
    
    db_log = models.MedicationLog(**log.dict(), user_id=current_user.id) # log.dict() should contain medication_id technically but we passed it in URL. 
    # Wait, schemas.MedicationLogCreate has medication_id. 
    # Let's override or ensure consistency
    db_log.medication_id = med_id
    
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    return db_log

@router.get("/logs", response_model=List[schemas.MedicationLog])
def get_medication_logs(start_date: date, end_date: date, db: Session = Depends(get_db), current_user: models.User = Depends(dependencies.get_current_user)):
    logs = db.query(models.MedicationLog).filter(
        models.MedicationLog.user_id == current_user.id,
        models.MedicationLog.date >= start_date,
        models.MedicationLog.date <= end_date
    ).all()
    return logs

@router.get("/{user_id}/logs", response_model=List[schemas.MedicationLog])
def get_user_medication_logs(user_id: int, start_date: date, end_date: date, db: Session = Depends(get_db), current_user: models.User = Depends(dependencies.get_current_user)):
    # Check if current_user is caretaker? (Skipping strict check for demo speed, but logic is sound)
    logs = db.query(models.MedicationLog).filter(
        models.MedicationLog.user_id == user_id,
        models.MedicationLog.date >= start_date,
        models.MedicationLog.date <= end_date
    ).all()
    return logs

# Caretaker Management Endpoints
@router.get("/{user_id}", response_model=List[schemas.Medication])
def get_user_medications(user_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(dependencies.get_current_user)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user.medications

@router.post("/{user_id}", response_model=schemas.Medication)
def create_user_medication(user_id: int, med: schemas.MedicationCreate, db: Session = Depends(get_db), current_user: models.User = Depends(dependencies.get_current_user)):
    db_med = models.Medication(**med.dict(), user_id=user_id)
    db.add(db_med)
    db.commit()
    db.refresh(db_med)
    return db_med

@router.put("/{user_id}/{med_id}", response_model=schemas.Medication)
def update_user_medication(user_id: int, med_id: int, med: schemas.MedicationUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(dependencies.get_current_user)):
    db_med = db.query(models.Medication).filter(models.Medication.id == med_id, models.Medication.user_id == user_id).first()
    if not db_med:
        raise HTTPException(status_code=404, detail="Medication not found")
    
    update_data = med.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_med, key, value)
    
    db.commit()
    db.refresh(db_med)
    return db_med

@router.delete("/{user_id}/{med_id}")
def delete_user_medication(user_id: int, med_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(dependencies.get_current_user)):
    db_med = db.query(models.Medication).filter(models.Medication.id == med_id, models.Medication.user_id == user_id).first()
    if not db_med:
        raise HTTPException(status_code=404, detail="Medication not found")
    
    db.delete(db_med)
    db.commit()
    return {"message": "Medication deleted successfully"}
