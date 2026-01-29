from database import SessionLocal
import models
from datetime import date, datetime

def test_insert():
    db = SessionLocal()
    try:
        # Pick Med ID 1
        med_id = 1
        user_id = 1
        today = date.today()
        
        print(f"Attempting to log for Med ID {med_id} on {today}...")
        
        new_log = models.MedicationLog(
            medication_id=med_id,
            user_id=user_id,
            date=today,
            status="Taken",
            taken_at=datetime.utcnow()
        )
        db.add(new_log)
        db.commit()
        print("Success! Log inserted.")
        
    except Exception as e:
        print(f"Failed to insert: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    test_insert()
