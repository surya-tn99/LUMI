from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from database import get_db
import models, schemas
from typing import List
import datetime
import json
from dependencies import get_current_user

router = APIRouter(
    prefix="/emergency",
    tags=["emergency"]
)

# WebSocket Connection Manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        # Convert datetime objects to string for JSON serialization
        def json_serial(obj):
            if isinstance(obj, (datetime.datetime, datetime.date)):
                return obj.isoformat()
            raise TypeError ("Type %s not serializable" % type(obj))

        data = json.dumps(message, default=json_serial)
        
        for connection in self.active_connections:
            try:
                await connection.send_text(data)
            except:
                # If sending fails (broken pipe), clean up? 
                # Ideally self.disconnect(connection) but strictly removing from list while iterating is risky
                pass

manager = ConnectionManager()

@router.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    await manager.connect(websocket)
    try:
        while True:
            # Keep alive / listen for client acks (optional)
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@router.post("/trigger", response_model=dict)
async def trigger_emergency(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # Check if already active
    active = db.query(models.EmergencyAlert).filter(
        models.EmergencyAlert.user_id == current_user.id,
        models.EmergencyAlert.is_active == True
    ).first()
    
    # Enrich user data for broadcast
    user_data = {
        "user_id": current_user.id,
        "user_name": current_user.fullname,
        "user_phone": current_user.phone,
        "blood_group": current_user.blood_group,
        "address": current_user.address,
        "health_issues": current_user.health_issues,
        "nominee_phone": current_user.nominees[0].phone if current_user.nominees else None
    }
    
    if active:
        # Re-broadcast active alert in case caretaker missed it or just connected
        await manager.broadcast({
            "type": "EMERGENCY_TRIGGER",
            "alert_id": active.id,
            "data": {**user_data, "triggered_at": active.created_at}
        })
        return {"status": "already_active", "alert_id": active.id}
    
    new_alert = models.EmergencyAlert(
        user_id = current_user.id,
        stage = "triggered",
        is_active = True,
        created_at = datetime.datetime.utcnow()
    )
    
    db.add(new_alert)
    db.commit()
    db.refresh(new_alert)
    
    # Broadcast to Websockets
    await manager.broadcast({
        "type": "EMERGENCY_TRIGGER",
        "alert_id": new_alert.id,
        "data": {**user_data, "triggered_at": new_alert.created_at}
    })
    
    # Sync with PatientStatus
    status_entry = db.query(models.PatientStatus).filter(models.PatientStatus.user_id == current_user.id).first()
    if not status_entry:
        status_entry = models.PatientStatus(user_id=current_user.id, phone=current_user.phone)
        db.add(status_entry)
    
    # Triggering via API usually implies immediate emergency or at least alert
    status_entry.status = "emergency" # Default fall through
    status_entry.last_updated = datetime.datetime.utcnow()
    db.commit()
    
    return {"status": "triggered", "alert_id": new_alert.id}

@router.post("/status", response_model=dict)
async def update_patient_status(
    status_data: dict, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user)
):
    """
    Update patient status: normal, warning, alert, emergency
    """
    new_status = status_data.get("status")
    if new_status not in ["normal", "warning", "alert", "emergency"]:
        raise HTTPException(status_code=400, detail="Invalid status")

    status_entry = db.query(models.PatientStatus).filter(models.PatientStatus.user_id == current_user.id).first()
    if not status_entry:
        status_entry = models.PatientStatus(user_id=current_user.id, phone=current_user.phone)
        db.add(status_entry)
    
    status_entry.status = new_status
    status_entry.last_updated = datetime.datetime.utcnow()
    
    # If explicitly setting to emergency, ensure EmergencyAlert exists?
    # Or just rely on status?
    # The requirement says "change state to emergency" when call now is pressed.
    
    db.commit()

    # Broadcast status change
    await manager.broadcast({
        "type": "STATUS_UPDATE",
        "user_id": current_user.id,
        "status": new_status,
        "data": {
            "user_name": current_user.fullname,
            "user_phone": current_user.phone,
            "blood_group": current_user.blood_group,
            "address": current_user.address,
            "health_issues": current_user.health_issues,
            "nominee_phone": current_user.nominees[0].phone if current_user.nominees else None,
            "updated_at": status_entry.last_updated
        }
    })

    return {"status": "updated", "current_status": new_status}

@router.get("/active", response_model=List[dict])
def get_active_alerts(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # If user is caretaker, return alerts ONLY for patients who have listed this caretaker as nominee
    # Return both EmergencyAlerts AND high-priority statuses
    
    if current_user.role != "caretaker":
        return []
    
    # Get patients who have listed this caretaker (by phone) as a nominee
    # Same logic as /users/patients endpoint
    my_patients = db.query(models.User).join(models.Nominee).filter(
        models.Nominee.phone == current_user.phone
    ).distinct().all()
    
    my_patient_ids = [p.id for p in my_patients]
    
    if not my_patient_ids:
        return []  # No assigned patients, no alerts
    
    # Get active alerts (legacy/compatibility) - ONLY for my patients
    alerts = db.query(models.EmergencyAlert).filter(
        models.EmergencyAlert.is_active == True,
        models.EmergencyAlert.user_id.in_(my_patient_ids)
    ).all()
    
    # Get critical statuses - ONLY for my patients
    critical_statuses = db.query(models.PatientStatus).filter(
        models.PatientStatus.status.in_(["emergency", "alert"]),
        models.PatientStatus.user_id.in_(my_patient_ids)
    ).all()
    
    result = []
    seen_users = set()
    
    # Merge logic
    for status in critical_statuses:
        user = db.query(models.User).filter(models.User.id == status.user_id).first()
        if user:
            seen_users.add(user.id)
            result.append({
                "id": status.id, # Using status ID as alert ID for UI compatibility
                "user_id": user.id,
                "user_name": user.fullname,
                "user_phone": user.phone,
                "blood_group": user.blood_group,
                "address": user.address,
                "health_issues": user.health_issues,
                "triggered_at": status.last_updated,
                "nominee_phone": user.nominees[0].phone if user.nominees else None,
                "status": status.status
            })
            
    # Add legacy alerts if not already covered
    for alert in alerts:
        if alert.user_id not in seen_users:
            user = db.query(models.User).filter(models.User.id == alert.user_id).first()
            if user:
                result.append({
                    "id": alert.id,
                    "user_id": user.id,
                    "user_name": user.fullname,
                    "user_phone": user.phone,
                    "blood_group": user.blood_group,
                    "address": user.address,
                    "health_issues": user.health_issues,
                    "triggered_at": alert.created_at,
                    "nominee_phone": user.nominees[0].phone if user.nominees else None,
                    "status": "emergency" # Default for old alerts
                })
            
    return result

@router.post("/resolve/{alert_id}")
def resolve_emergency(alert_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # ... resolution logic ...
    # Also resolve patient status to normal
    
    # Only caretakers or the user themselves can resolve?
    # Let's verify rights.
    
    # Try to find mostly by user_id if we have it? 
    # Currently alert_id might be status_id or alert_id. 
    # Hacky fix: Try to find status by alert_id? No, alert_id is int.
    
    # Better approach: Pass user_id to resolve? 
    # For now, let's assume we are resolving the status for the user associated with this alert.
    
    # If checking EmergencyAlert table
    alert = db.query(models.EmergencyAlert).filter(models.EmergencyAlert.id == alert_id).first()
    target_user_id = None
    
    if alert:
        target_user_id = alert.user_id
        alert.is_active = False
        alert.resolved_at = datetime.datetime.utcnow()
    else:
        # Check status table
        status = db.query(models.PatientStatus).filter(models.PatientStatus.id == alert_id).first()
        if status:
            target_user_id = status.user_id
            status.status = "normal"
            status.last_updated = datetime.datetime.utcnow()
    
    if target_user_id:
        # Ensure status is normal
        p_status = db.query(models.PatientStatus).filter(models.PatientStatus.user_id == target_user_id).first()
        if p_status:
            p_status.status = "normal"
            db.commit()
            
    db.commit()
    
    return {"status": "resolved"}
