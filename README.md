# LUMI [Listen Understand Monitor Interact] 
   - Voice-First Health Companion for the Elderly

**LUMI** is a voice-first web application designed to bridge the digital gap for the elderly. By simulating a mobile app experience within a web browser, it allows seniors to manage their health independently without the need for typing or navigating complex menus.

---

## 📖 Problem Statement & Solution

**The Problem:**
Elderly individuals often struggle with modern interfaces due to small text, complex navigation, and the physical difficulty of typing on small keyboards. Caretakers, conversely, struggle to stay informed about their loved ones' health remotely.

**The LUMI Solution:**
*   **Voice-First Interface:** No typing required. Users simply speak to interact.
*   **High-Accessibility Design:** High-contrast visuals, bold typography, and distinct buttons.
*   **Dual-Role System:** Distinct logins for **Patients** (monitoring & SOS) and **Caretakers** (remote tracking & alerts).

---

## 🚀 Key Features

### For Patients
*   **Voice Assistant:** Powered by **Phi3**, allowing natural language interaction for health updates.
*   **One-Tap SOS:** Instantly notifies the nominated caretaker during emergencies. If unacknowledged, the system is designed to escalate (e.g., call ambulance).
*   **Health Visualization:** Simple graphs for Heart Rate, Blood Pressure, and Step count.
*   **Medication Reminders:** Easy-to-view checklists for daily intake.

### For Caretakers
*   **Remote Dashboard:** View real-time vitals and medication adherence of the patient.
*   **Emergency Alerts:** Immediate notifications when the Patient triggers an SOS.
*   **Profile Management:** Assist in configuring health data and contacts.

---

## 🛠️ Technical Approach

LUMI uses a modern web stack to ensure speed, accessibility, and ease of deployment.

### Tech Stack
*   **Frontend:** React + Vite, Tailwind CSS (for responsive, mobile-app-like styling).
*   **Backend:** Python, FastAPI.
*   **Database:** SQLite (Lightweight local storage).
*   **AI Model:** Phi3 (for text generation and voice command processing).
*   **Audio:** Native JS Audio Modules (Mic access).
*   **Icons:** Lucide-React.

### Architecture
1.  **Input:** Voice Command or Touch.
2.  **Processing:** Web Audio API captures sound -> Backend processes via Phi3.
3.  **Output:** Visual Interface update (React) + Audio feedback.

---

## 📸 Application Constraints & Workflow

### 1. Login & Setup
Users verify their phone number via OTP, set up their profile (Name, Age, Address), and nominate a Caretaker (Emergency Contact).

### 2. Patient Dashboard
A simplified interface featuring:
*   **Live Vitals:** Real-time charts.
*   **Microphone Button:** "Tap to Speak" for commands.
*   **SOS Button:** Prominent red button for emergencies.
*   **Transcript Box:** Displays what the AI heard to ensure accuracy.

### 3. Caretaker Dashboard
A monitoring view showing:
*   Patient status (Active/Normal).
*   Vitals history graphs.
*   Medication adherence logs.
*   Incoming SOS alerts.

---

## 💻 Getting Started (Localhost)

Follow these steps to run LUMI locally on your machine.

### Prerequisites
*   Node.js & npm
*   Python 3.8+
*   Git

### Installation

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/surya-tn99/LUMI.git
    cd LUMI
    ```

2.  **Backend Setup**
    Navigate to the backend directory and install dependencies.
    ```bash
    cd backend
    # Create a virtual environment (optional but recommended)
    python -m venv venv
    source venv/bin/activate  # On Windows: venv\Scripts\activate
    
    # Install requirements
    pip install -r requirements.txt
    
    # Start the FastAPI server
    uvicorn main:app --reload
    ```

3.  **Frontend Setup**
    Open a new terminal, navigate to the frontend directory, and start the React app.
    ```bash
    cd frontend
    npm install
    npm run dev
    ```

4.  **Access the App**
    Open your browser (preferably Chrome for best voice API support) and go to:
    `http://localhost:5173` (or the port shown in your terminal).

---

## 🚧 Challenges & Feasibility
*   **Permissions:** The browser will request permission to access the Microphone and Camera. This is essential for the Voice and SOS features.
*   **Voice Tuning:** Background noise can affect recognition. We use a transcript box so users can verify their commands.

## 👥 Societal Impact
LUMI empowers the elderly to live more independently while reducing anxiety for their families. It turns a standard smartphone browser into a powerful medical alert and monitoring tool without requiring expensive dedicated hardware.

---

*This project was developed for KANAM'26 - 24 Hour Hackathon.*
