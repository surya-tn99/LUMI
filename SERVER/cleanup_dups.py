from database import SessionLocal
import models

def cleanup_duplicates():
    db = SessionLocal()
    try:
        users = db.query(models.User).all()
        by_name = {}
        for u in users:
            if u.fullname not in by_name:
                by_name[u.fullname] = []
            by_name[u.fullname].append(u)
        
        for name, user_list in by_name.items():
            if len(user_list) > 1:
                print(f"Cleaning up duplicates for '{name}'...")
                
                # Sort by last_active_at desc, then ID desc
                import datetime
                user_list.sort(key=lambda u: (u.last_active_at or datetime.datetime.min, u.id), reverse=True)
                
                # Keep the first one (most recent)
                keep = user_list[0]
                remove_list = user_list[1:]
                
                print(f"  Keeping User ID: {keep.id} (Phone: {keep.phone})")
                
                for remove in remove_list:
                    print(f"  Deleting User ID: {remove.id} (Phone: {remove.phone})...")
                    
                    # Delete related data manually
                    db.query(models.Nominee).filter(models.Nominee.user_id == remove.id).delete()
                    db.query(models.HealthMetric).filter(models.HealthMetric.user_id == remove.id).delete()
                    db.query(models.EmergencyAlert).filter(models.EmergencyAlert.user_id == remove.id).delete()
                    
                    # Medications have related logs, delete logs first
                    meds = db.query(models.Medication).filter(models.Medication.user_id == remove.id).all()
                    for med in meds:
                        db.query(models.MedicationLog).filter(models.MedicationLog.medication_id == med.id).delete()
                    db.query(models.Medication).filter(models.Medication.user_id == remove.id).delete()
                    
                    # Finally delete user
                    db.delete(remove)
        
        db.commit()
        print("Cleanup complete.")
            
    except Exception as e:
        print(f"Error during cleanup: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    cleanup_duplicates()
