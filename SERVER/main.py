import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import settings
from database import engine, Base
from routers import auth, users, medications, nominees, vitals, emergency

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.PROJECT_VERSION
)

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex='.*',
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(medications.router)
app.include_router(nominees.router)
app.include_router(vitals.router)
app.include_router(emergency.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to Lumi API"}

import subprocess
import sys

@app.on_event("startup")
async def startup_event():
    # Start the Database Manager Service as a child process
    print("🚀 Starting Database Manager Service on Port 8002...")
    subprocess.Popen([sys.executable, "db_manager.py"])


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
