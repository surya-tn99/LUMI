from database import SessionLocal, engine, Base
import models
from datetime import date, datetime, timedelta
import random

# Ensure tables exist
Base.metadata.create_all(bind=engine)

db = SessionLocal()

def seed_data():
    # 1. Create a demo user if not exists
    phone = "9876543210"
    user = db.query(models.User).filter(models.User.phone == phone).first()
    
    if not user:
        print("Creating demo user...")
        user = models.User(
            fullname="Surya Tester",
            phone=phone,
            dob=date(1950, 1, 1),
            blood_group="O+",
            address="123 Elder Lane, Care City"
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        
        # 2. Add Medications
        meds = [
            {"name": "Aspirin", "dosage": "100mg", "scheduled_time": "08:00"},
            {"name": "Vitamin D", "dosage": "1000IU", "scheduled_time": "09:00"},
            {"name": "Metformin", "dosage": "500mg", "scheduled_time": "20:00"},
        ]
        
        db_meds = []
        for m in meds:
            med = models.Medication(
                user_id=user.id,
                name=m["name"],
                dosage=m["dosage"],
                scheduled_time=m["scheduled_time"],
                start_date=date.today() - timedelta(days=30)
            )
            db.add(med)
            db_meds.append(med)
        
        db.commit()
        for m in db_meds:
            db.refresh(m) # get IDs
            
        # 3. Add Logs for past 2 weeks
        # Iterate simply: for last 14 days, random chance of taken/missed
        print("Seeding logs for past 2 weeks...")
        today = date.today()
        for i in range(14):
            day = today - timedelta(days=i)
            # For each med on this day
            for med in db_meds:
                # Random status: 80% taken, 10% missed, 10% None (if today/future, but we are looking at past)
                rand = random.random()
                status = "taken"
                if rand > 0.85:
                    status = "missed"
                
                # Create log
                # Time taken: scheduled time +/- random mins
                taken_at = None
                if status == "taken":
                    # Parse scheduled time
                    h, m = map(int, med.scheduled_time.split(":"))
                    taken_time = datetime.combine(day, datetime.min.time()) + timedelta(hours=h, minutes=m)
                    # Add jitter
                    jitter = random.randint(-30, 30)
                    taken_at = taken_time + timedelta(minutes=jitter)
                
                log = models.MedicationLog(
                    medication_id=med.id,
                    user_id=user.id,
                    date=day,
                    status=status,
                    taken_at=taken_at
                )
                db.add(log)
        
        db.commit()
        print("Seeding complete!")
    else:
        print("Demo user already exists.")

if __name__ == "__main__":
    seed_data()
