from database import SessionLocal
import models
from datetime import date, timedelta, datetime
import random

def seed_multi_user():
    db = SessionLocal()
    targets = ["P2", "P3", "P4"]
    
    try:
        sample_meds_pool = [
            {"name": "Metformin", "dosage": "500mg", "time": "08:00"},
            {"name": "Lisinopril", "dosage": "10mg", "time": "09:00"},
            {"name": "Atorvastatin", "dosage": "20mg", "time": "20:00"},
            {"name": "Aspirin", "dosage": "81mg", "time": "08:00"},
            {"name": "Vitamin D", "dosage": "1000IU", "time": "09:00"},
            {"name": "Ibuprofen", "dosage": "200mg", "time": "14:00"},
            {"name": "Amoxicillin", "dosage": "500mg", "time": "10:00"},
            {"name": "Omeprazole", "dosage": "20mg", "time": "07:00"},
             {"name": "Losartan", "dosage": "50mg", "time": "09:00"},
            {"name": "Gabapentin", "dosage": "300mg", "time": "21:00"}
        ]

        for target_name in targets:
            print(f"Searching for user '{target_name}'...")
            user = db.query(models.User).filter(models.User.fullname.ilike(f"%{target_name}%")).first()
            
            if not user:
                print(f"  User '{target_name}' not found. Skipping.")
                continue
            
            print(f"  Found User: {user.fullname} (ID: {user.id})")
            
            # Check if user already has meds to avoid double seeding if run multiple times
            existing_count = db.query(models.Medication).filter(models.Medication.user_id == user.id).count()
            if existing_count > 0:
                print(f"  User already has {existing_count} medications. Skipping creation, just ensuring logs.")
                meds_to_process = db.query(models.Medication).filter(models.Medication.user_id == user.id).all()
            else:
                # Create new meds
                # Pick 2-4 random meds
                num_meds = random.randint(2, 4)
                meds_to_add = random.sample(sample_meds_pool, num_meds)
                meds_to_process = []
                
                for m_data in meds_to_add:
                    print(f"    Adding Medication: {m_data['name']}")
                    med = models.Medication(
                        user_id=user.id,
                        name=m_data['name'],
                        dosage=m_data['dosage'],
                        scheduled_time=m_data['time'],
                        start_date=date.today() - timedelta(days=30)
                    )
                    db.add(med)
                    db.commit()
                    db.refresh(med)
                    meds_to_process.append(med)

            # Generate Logs for last 7 days
            print("    Generating Logs for last 7 days...")
            today = date.today()
            for i in range(7):
                log_date = today - timedelta(days=i)
                
                for med in meds_to_process:
                    # Check if log exists
                    exists = db.query(models.MedicationLog).filter(
                        models.MedicationLog.medication_id == med.id,
                        models.MedicationLog.date == log_date
                    ).first()
                    
                    if not exists:
                        # Random compliance per user to make graphs look different
                        # P2 = high compliance (90%), P3 = med (60%), P4 = low (30%)
                        compliance = 0.5
                        if "P2" in user.fullname: compliance = 0.9
                        elif "P3" in user.fullname: compliance = 0.6
                        elif "P4" in user.fullname: compliance = 0.3
                        
                        status = "Taken" if random.random() < compliance else "Pending"
                        
                        taken_time = None
                        if status == "Taken":
                            taken_time = datetime.combine(log_date, datetime.min.time()) # Simplified time
                        
                        log = models.MedicationLog(
                            medication_id=med.id,
                            user_id=user.id,
                            date=log_date,
                            status=status,
                            taken_at=taken_time
                        )
                        db.add(log)
            
            db.commit()
            print(f"  Seeding complete for {user.fullname}.\n")

    except Exception as e:
        print(f"Error seeding: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_multi_user()
