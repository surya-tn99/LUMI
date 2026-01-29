from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import models, schemas, dependencies
from database import get_db

router = APIRouter(
    prefix="/vitals",
    tags=["vitals"]
)

@router.post("/", response_model=List[schemas.HealthMetric])
def create_health_metrics(metrics: List[schemas.HealthMetricCreate], db: Session = Depends(get_db), current_user: models.User = Depends(dependencies.get_current_user)):
    saved_metrics = []
    for metric in metrics:
        db_metric = models.HealthMetric(**metric.dict(), user_id=current_user.id)
        db.add(db_metric)
        saved_metrics.append(db_metric)
    
    import datetime
    current_user.last_active_at = datetime.datetime.utcnow()
    db.add(current_user)
    
    db.commit()
    for metric in saved_metrics:
        db.refresh(metric)
        
    return saved_metrics

@router.get("/", response_model=List[schemas.HealthMetric])
def get_health_metrics(limit: int = 100, db: Session = Depends(get_db), current_user: models.User = Depends(dependencies.get_current_user)):
    metrics = db.query(models.HealthMetric).filter(models.HealthMetric.user_id == current_user.id).order_by(models.HealthMetric.timestamp.desc()).limit(limit).all()
    return metrics

@router.get("/{user_id}", response_model=List[schemas.HealthMetric])
def get_user_health_metrics(user_id: int, limit: int = 50, db: Session = Depends(get_db), current_user: models.User = Depends(dependencies.get_current_user)):
    # In a real app, check if current_user is allowed to view user_id's data (e.g. is caretaker)
    # For now, allow it.
    metrics = db.query(models.HealthMetric).filter(models.HealthMetric.user_id == user_id).order_by(models.HealthMetric.timestamp.desc()).limit(limit).all()
    return metrics
