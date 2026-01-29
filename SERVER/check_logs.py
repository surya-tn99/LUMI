from database import SessionLocal
import models

def check_structure():
    db = SessionLocal()
    try:
        meds = db.query(models.Medication).all()
        print(f"Total Medications: {len(meds)}")
        for m in meds:
            print(f"  - Med ID: {m.id}, Name: {m.name}, User ID: {m.user_id}")
            
        logs = db.query(models.MedicationLog).all()
        print(f"\nTotal Medication Logs: {len(logs)}")
        for l in logs:
            print(f"  - Log ID: {l.id}, Med ID: {l.medication_id}, Status: {l.status}, Date: {l.date}")
            
    finally:
        db.close()

if __name__ == "__main__":
    check_structure()
