import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Separate Database Setup
SQLALCHEMY_DATABASE_URL = "sqlite:///./manager.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Example Model for Manager DB
class SystemLog(Base):
    __tablename__ = "system_logs"
    id = Column(Integer, primary_key=True, index=True)
    message = Column(String)

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Lumi Database Manager")

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex='.*',
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Database Manager Service Running on Port 8002", "database": "manager.db"}

@app.get("/logs")
def get_logs():
    db = SessionLocal()
    logs = db.query(SystemLog).all()
    db.close()
    return logs

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8002)
