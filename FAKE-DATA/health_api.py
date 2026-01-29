from fastapi import FastAPI
import random
import datetime
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Allow CORS for ease of testing from browsers/frontends
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex='.*',
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

import socket

def get_local_ip():
    try:
        # Connect to an external server to get the interface IP (doesn't actually send data)
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"

@app.on_event("startup")
async def startup_event():
    ip = get_local_ip()
    print(f"\n\n\033[92mINFO:     Server accessible at http://{ip}:8001\033[0m\n")

# Global variable to simulate accumulating steps
current_steps = 0
last_step_update = datetime.datetime.now()

def get_timestamp():
    return datetime.datetime.now().isoformat()

@app.get("/heart-beat")
def get_heart_beat():
    """Returns a realistic heart rate that mimics human physiology."""
    # Base resting heart rate for a healthy adult
    base_hr = 72
    
    # Natural variation throughout the day (±8 bpm)
    time_variation = random.uniform(-8, 8)
    
    # Small random fluctuation for realism (±5 bpm)
    natural_variation = random.uniform(-5, 5)
    
    # Occasional activity spike (10% chance of elevated heart rate)
    activity_spike = 0
    if random.random() > 0.9:
        activity_spike = random.uniform(15, 35)  # Light to moderate activity
    
    # Calculate final heart rate
    bpm = int(base_hr + time_variation + natural_variation + activity_spike)
    
    # Ensure it stays within realistic human range (50-140 bpm)
    bpm = max(50, min(140, bpm))
    
    return {
        "heart_rate": bpm,
        "unit": "bpm",
        "timestamp": get_timestamp()
    }

@app.get("/blood-pressure")
def get_blood_pressure():
    """Returns realistic blood pressure that mimics human physiology."""
    # Base normal blood pressure for a healthy adult
    base_systolic = 120
    base_diastolic = 80
    
    # Natural daily variation
    systolic_variation = random.uniform(-10, 10)
    
    # Diastolic is correlated with systolic (not independent)
    # Typically diastolic is about 60-70% of systolic
    # Add some variation but maintain correlation
    diastolic_ratio = random.uniform(0.60, 0.70)
    
    # Calculate systolic
    systolic = int(base_systolic + systolic_variation)
    
    # Calculate diastolic based on systolic with some independent variation
    diastolic = int(systolic * diastolic_ratio + random.uniform(-5, 5))
    
    # Ensure realistic ranges
    # Normal: 90-120 systolic, 60-80 diastolic
    # Slightly elevated: up to 130/85
    systolic = max(95, min(135, systolic))
    diastolic = max(60, min(90, diastolic))
    
    # Ensure diastolic is always less than systolic
    if diastolic >= systolic:
        diastolic = systolic - random.randint(30, 40)
    
    return {
        "systolic": systolic,
        "diastolic": diastolic,
        "unit": "mmHg",
        "timestamp": get_timestamp()
    }

@app.get("/step-count")
def get_step_count():
    """Returns an accumulating step count."""
    global current_steps, last_step_update
    
    now = datetime.datetime.now()
    # If it's a new day, reset steps? For simplicity, we'll just keep adding.
    # But let's verify if we want to simulate a reset or just simple accumulation.
    # For a simple demo, just add 0-10 steps every call if enough time passed,
    # or just add random steps simulating 'walking' since last call.
    
    # Let's add random steps (0 to 20) to simulate activity
    new_steps = random.randint(0, 15)
    current_steps += new_steps
    
    return {
        "steps": current_steps,
        "unit": "count",
        "timestamp": get_timestamp()
    }

@app.get("/all")
def get_all_metrics():
    """Returns all health metrics in one response."""
    return {
        "heart_beat": get_heart_beat(),
        "blood_pressure": get_blood_pressure(),
        "step_count": get_step_count(),
        "timestamp": get_timestamp()
    }

@app.get("/")
def read_root():
    return {"message": "Fake Health Data API is running. Use /heart-beat, /blood-pressure, or /step-count"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
