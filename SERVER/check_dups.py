from database import SessionLocal
import models
from sqlalchemy import func

def list_duplicates():
    db = SessionLocal()
    try:
        # Group by name
        users = db.query(models.User).all()
        by_name = {}
        for u in users:
            if u.fullname not in by_name:
                by_name[u.fullname] = []
            by_name[u.fullname].append(u)
        
        print(f"Total Users: {len(users)}")
        print("-" * 30)
        found_dups = False
        for name, user_list in by_name.items():
            if len(user_list) > 1:
                found_dups = True
                print(f"Duplicate Name: '{name}'")
                for u in user_list:
                    print(f"  - ID: {u.id}, Phone: {u.phone}, Last Active: {u.last_active_at}")
        
        if not found_dups:
            print("No duplicate names found.")
            
    finally:
        db.close()

if __name__ == "__main__":
    list_duplicates()
