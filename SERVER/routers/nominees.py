from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import models, schemas, dependencies
from database import get_db

router = APIRouter(
    prefix="/nominees",
    tags=["nominees"]
)

@router.get("/", response_model=List[schemas.Nominee])
def get_nominees(db: Session = Depends(get_db), current_user: models.User = Depends(dependencies.get_current_user)):
    return current_user.nominees

@router.post("/", response_model=schemas.Nominee)
def create_nominee(nominee: schemas.NomineeCreate, db: Session = Depends(get_db), current_user: models.User = Depends(dependencies.get_current_user)):
    db_nominee = models.Nominee(**nominee.dict(), user_id=current_user.id)
    db.add(db_nominee)
    db.commit()
    db.refresh(db_nominee)
    return db_nominee

@router.put("/{nominee_id}", response_model=schemas.Nominee)
def update_nominee(nominee_id: int, nominee_update: schemas.NomineeUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(dependencies.get_current_user)):
    db_nominee = db.query(models.Nominee).filter(models.Nominee.id == nominee_id, models.Nominee.user_id == current_user.id).first()
    if not db_nominee:
        raise HTTPException(status_code=404, detail="Nominee not found")
    
    if nominee_update.name is not None:
        db_nominee.name = nominee_update.name
    if nominee_update.relationship is not None:
        db_nominee.relationship = nominee_update.relationship
    if nominee_update.phone is not None:
        db_nominee.phone = nominee_update.phone
        
    db.commit()
    db.refresh(db_nominee)
    return db_nominee

@router.delete("/{nominee_id}")
def delete_nominee(nominee_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(dependencies.get_current_user)):
    db_nominee = db.query(models.Nominee).filter(models.Nominee.id == nominee_id, models.Nominee.user_id == current_user.id).first()
    if not db_nominee:
        raise HTTPException(status_code=404, detail="Nominee not found")
    db.delete(db_nominee)
    db.commit()
    return {"message": "Nominee deleted"}

# Caretaker Management Endpoints
@router.get("/{user_id}", response_model=List[schemas.Nominee])
def get_user_nominees(user_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(dependencies.get_current_user)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user.nominees

@router.post("/{user_id}", response_model=schemas.Nominee)
def create_user_nominee(user_id: int, nominee: schemas.NomineeCreate, db: Session = Depends(get_db), current_user: models.User = Depends(dependencies.get_current_user)):
    db_nominee = models.Nominee(**nominee.dict(), user_id=user_id)
    db.add(db_nominee)
    db.commit()
    db.refresh(db_nominee)
    return db_nominee

@router.put("/{user_id}/{nominee_id}", response_model=schemas.Nominee)
def update_user_nominee(user_id: int, nominee_id: int, nominee_update: schemas.NomineeUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(dependencies.get_current_user)):
    db_nominee = db.query(models.Nominee).filter(models.Nominee.id == nominee_id, models.Nominee.user_id == user_id).first()
    if not db_nominee:
        raise HTTPException(status_code=404, detail="Nominee not found")
    
    if nominee_update.name is not None:
        db_nominee.name = nominee_update.name
    if nominee_update.relationship is not None:
        db_nominee.relationship = nominee_update.relationship
    if nominee_update.phone is not None:
        db_nominee.phone = nominee_update.phone
        
    db.commit()
    db.refresh(db_nominee)
    return db_nominee

@router.delete("/{user_id}/{nominee_id}")
def delete_user_nominee(user_id: int, nominee_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(dependencies.get_current_user)):
    db_nominee = db.query(models.Nominee).filter(models.Nominee.id == nominee_id, models.Nominee.user_id == user_id).first()
    if not db_nominee:
        raise HTTPException(status_code=404, detail="Nominee not found")
    db.delete(db_nominee)
    db.commit()
    return {"message": "Nominee deleted"}
