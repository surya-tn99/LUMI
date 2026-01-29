from database import engine
from sqlalchemy import text

def migrate():
    with engine.connect() as conn:
        try:
            print("Checking and migrating 'users' table...")
            
            # Check/Add health_issues
            try:
                conn.execute(text("SELECT health_issues FROM users LIMIT 1"))
                print("✅ 'health_issues' column exists.")
            except Exception:
                print("⚠️ 'health_issues' column missing. Adding...")
                conn.execute(text("ALTER TABLE users ADD COLUMN health_issues VARCHAR"))
                print("✅ Added 'health_issues'.")

            # Check/Add role
            try:
                conn.execute(text("SELECT role FROM users LIMIT 1"))
                print("✅ 'role' column exists.")
            except Exception:
                print("⚠️ 'role' column missing. Adding...")
                conn.execute(text("ALTER TABLE users ADD COLUMN role VARCHAR DEFAULT 'patient'"))
                print("✅ Added 'role'.")

            # Check/Add last_active_at
            try:
                conn.execute(text("SELECT last_active_at FROM users LIMIT 1"))
                print("✅ 'last_active_at' column exists.")
            except Exception:
                print("⚠️ 'last_active_at' column missing. Adding...")
                conn.execute(text("ALTER TABLE users ADD COLUMN last_active_at DATETIME"))
                print("✅ Added 'last_active_at'.")

            # Check/Add session_id
            try:
                conn.execute(text("SELECT session_id FROM users LIMIT 1"))
                print("✅ 'session_id' column exists.")
            except Exception:
                print("⚠️ 'session_id' column missing. Adding...")
                conn.execute(text("ALTER TABLE users ADD COLUMN session_id VARCHAR"))
                print("✅ Added 'session_id'.")
                
            conn.commit()
            print("🎉 Migration complete!")
            
        except Exception as e:
            print(f"❌ Migration failed: {e}")

if __name__ == "__main__":
    migrate()
