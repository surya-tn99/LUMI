from sqlalchemy.orm import Session
from database import SessionLocal, engine
import models
from datetime import date
import sys

# Create tables if not exist
models.Base.metadata.create_all(bind=engine)

def seed_data():
    db = SessionLocal()
    try:
        # Check if user exists
        user = db.query(models.User).filter(models.User.phone == "1231231234").first()
        if user:
            print("User 'gokul' already exists.")
        else:
            print("Creating user 'gokul'...")
            user = models.User(
                fullname="Gokul",
                phone="1231231234",
                dob=date(1990, 1, 1),
                blood_group="O+",
                address="123 Main St"
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            print(f"User created with ID: {user.id}")

        # Add medications
        meds = [
            {"name": "Paracetamol", "dosage": "500mg", "scheduled_time": "09:00", "start_date": date.today()},
            {"name": "Vitamin D", "dosage": "1000IU", "scheduled_time": "20:00", "start_date": date.today()}
        ]
        
        for med_data in meds:
            exists = db.query(models.Medication).filter(
                models.Medication.user_id == user.id, 
                models.Medication.name == med_data["name"]
            ).first()
            
            if not exists:
                print(f"Adding medication: {med_data['name']}")
                med = models.Medication(**med_data, user_id=user.id)
                db.add(med)
            else:
                print(f"Medication {med_data['name']} already exists.")
        
        db.commit()
        print("Seeding complete.")
        
    except Exception as e:
        print(f"Error seeding data: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_data()
