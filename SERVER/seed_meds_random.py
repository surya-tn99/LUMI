from database import SessionLocal
import models
from datetime import date, timedelta, datetime
import random

def seed_data():
    db = SessionLocal()
    try:
        # Find P1 or first user
        user = db.query(models.User).filter(models.User.fullname.ilike("%P1%")).first()
        if not user:
            user = db.query(models.User).first()
        
        if not user:
            print("No users found to seed.")
            return

        print(f"Seeding data for User: {user.fullname} (ID: {user.id})")

        # Define some sample meds
        sample_meds = [
            {"name": "Metformin", "dosage": "500mg", "time": "08:00"},
            {"name": "Lisinopril", "dosage": "10mg", "time": "09:00"},
            {"name": "Atorvastatin", "dosage": "20mg", "time": "20:00"},
            {"name": "Aspirin", "dosage": "81mg", "time": "08:00"},
            {"name": "Vitamin D", "dosage": "1000IU", "time": "09:00"}
        ]

        created_meds = []
        
        # specific meds to add (randomly pick 3)
        meds_to_add = random.sample(sample_meds, 3)

        for m_data in meds_to_add:
            print(f"  Adding Medication: {m_data['name']}")
            med = models.Medication(
                user_id=user.id,
                name=m_data['name'],
                dosage=m_data['dosage'],
                scheduled_time=m_data['time'],
                start_date=date.today() - timedelta(days=30) # Started 30 days ago
            )
            db.add(med)
            db.commit() # Commit to get ID
            db.refresh(med)
            created_meds.append(med)

        # Generate Logs for last 7 days
        print("  Generating Logs for last 7 days...")
        today = date.today()
        for i in range(7):
            log_date = today - timedelta(days=i)
            # 0 = Today, 1 = Yesterday...
            
            for med in created_meds:
                # 80% chance of taking it
                status = "Taken" if random.random() < 0.8 else "Pending"
                
                # If "Pending" and date is in past, effectively "Skipped" or "Missed"
                # But schema uses status string.
                
                # Random time deviation +/- 30 mins
                taken_time = None
                if status == "Taken":
                    sched_hour, sched_min = map(int, med.scheduled_time.split(':'))
                    act_hour = sched_hour
                    act_min = sched_min + random.randint(-15, 30)
                    if act_min >= 60:
                        act_hour += 1
                        act_min -= 60
                    if act_min < 0:
                        act_hour -= 1
                        act_min += 60
                    
                    taken_time = datetime.combine(log_date, datetime.min.time()).replace(hour=act_hour, minute=act_min)

                log = models.MedicationLog(
                    medication_id=med.id,
                    user_id=user.id,
                    date=log_date,
                    status=status,
                    taken_at=taken_time
                )
                db.add(log)
        
        db.commit()
        print("Seeding Complete!")

    except Exception as e:
        print(f"Error seeding: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_data()
