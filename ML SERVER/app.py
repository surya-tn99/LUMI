import os
import subprocess
import uuid
import socket
import uvicorn
import requests
import pyttsx3
from fastapi import FastAPI, UploadFile, File
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL_NAME = "phi3:mini"

# Paths (using absolute paths based on analysis)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FFMPEG_PATH = os.path.join(BASE_DIR, "wishper", "ffmpeg.exe")
WHISPER_CLI = os.path.join(BASE_DIR, "wishper", "Release", "whisper-cli.exe")
WHISPER_MODEL = os.path.join(BASE_DIR, "wishper", "models", "ggml-base.bin")
STATIC_DIR = os.path.join(BASE_DIR, "static")

# Ensure static directory exists for audio files
if not os.path.exists(STATIC_DIR):
    os.makedirs(STATIC_DIR)

# Mount static files moved to end


# In-memory chat history
chat_history = []

class ChatRequest(BaseModel):
    message: str

def query_ollama(prompt):
    payload = {
        "model": MODEL_NAME,
        "prompt": prompt,
        "stream": False,
        "options": {"temperature": 0.2, "top_p": 0.9}
    }
    try:
        r = requests.post(OLLAMA_URL, json=payload, timeout=60)
        r.raise_for_status()
        return r.json().get("response", "").strip()
    except Exception as e:
        print(f"Ollama Error: {e}")
        return "Sorry, I couldn't connect to my brain."

def text_to_speech(text):
    filename = f"response_{uuid.uuid4().hex}.wav"
    filepath = os.path.join(STATIC_DIR, filename)
    
    # Initialize engine per request to avoid loop issues (basic approach)
    # Note: On heavy load, this might need a queue or separate process
    try:
        engine = pyttsx3.init()
        
        voices = engine.getProperty('voices')
        if len(voices) > 1:
            engine.setProperty('voice', voices[1].id)  # female voice
        
        engine.setProperty('rate', 140)
        engine.setProperty('volume', 1.0)
        
        engine.save_to_file(text, filepath)
        engine.runAndWait()
        return f"/static/{filename}"
    except Exception as e:
        print(f"TTS Error: {e}")
        return None

@app.post("/chat")
def chat(req: ChatRequest):
    chat_history.append(f"User: {req.message}")
    
    recent = "\n".join(chat_history[-5:])
    system_prompt = f"""You are a health assistant.try to give within two lines. \nBe concise.\nConversation:\n{recent}\nAssistant:"""
    
    reply = query_ollama(system_prompt)
    chat_history.append(f"Assistant: {reply}")
    
    # Generate audio for text chat too
    audio_url = text_to_speech(reply)
    
    return {"reply": reply, "audio": audio_url}

@app.post("/voice")
async def voice_chat(file: UploadFile = File(...)):
    # 1. Save uploaded audio
    input_filename = f"input_{uuid.uuid4().hex}.wav"
    input_path = os.path.join(STATIC_DIR, input_filename)
    
    with open(input_path, "wb") as buffer:
        buffer.write(await file.read())
        
    # 2. Convert to 16kHz mono WAV for Whisper
    clean_wav = input_path.replace(".wav", "_16k.wav")
    subprocess.run([
        FFMPEG_PATH, "-y", "-i", input_path, 
        "-ar", "16000", "-ac", "1", "-c:a", "pcm_s16le", clean_wav
    ], capture_output=True)
    
    # 3. Run Whisper
    # Command: whisper-cli.exe -m model.bin -f file.wav -otxt
    # We will read stdout directly or use -nt (no timestamps)
    result = subprocess.run([
        WHISPER_CLI, 
        "-m", WHISPER_MODEL, 
        "-f", clean_wav, 
        "--no-timestamps"
    ], capture_output=True, text=True)
    
    user_text = result.stdout.strip()
    # Whisper output often contains metadata, we assume standard output or parse if needed.
    # The CLI usually prints only text if we use the right flags, but standard output includes headers.
    # Let's clean it up. If valid text isn't found, handle gracefully.
    
    # Simple cleanup: remove lines starting with [ or ( system info
    lines = [line for line in user_text.split('\n') if not line.strip().startswith('[') and "system_info" not in line] 
    user_text = " ".join(lines).strip()
    
    if not user_text:
        user_text = "(Unintelligible)"
        
    print(f"Whisper heard: {user_text}")

    # 4. Get AI Response
    chat_history.append(f"User: {user_text}")
    recent = "\n".join(chat_history[-5:])
    system_prompt = f"""You are a health assistant. Be concise.\nConversation:\n{recent}\nAssistant:"""
    
    reply = query_ollama(system_prompt)
    chat_history.append(f"Assistant: {reply}")
    
    # 5. Generate TTS
    audio_url = text_to_speech(reply)
    
    return {
        "text": user_text,
        "reply": reply,
        "audio": audio_url
    }


# Mount static files (After API routes to avoid catch-all blocking)
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")
app.mount("/", StaticFiles(directory=".", html=True), name="root")

def get_ip_address():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"

if __name__ == "__main__":
    ip = get_ip_address()
    port = 8000
    print(f"Running on http://{ip}:{port}")
    uvicorn.run(app, host="0.0.0.0", port=port)


