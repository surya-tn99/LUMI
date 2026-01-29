import requests
import json
from datetime import date

BASE_URL = "http://localhost:8000"

def print_pass(msg):
    print(f"✅ PASS: {msg}")

def print_fail(msg, details=""):
    print(f"❌ FAIL: {msg} {details}")

def verify_security():
    print("🚀 Starting Security & Logic Verification")
    
    # 1. Test OTP Endpoint
    try:
        res = requests.post(f"{BASE_URL}/auth/otp", json={"phone": "9999999999"})
        if res.status_code == 200:
            print_pass("Generate OTP Endpoint")
        else:
            print_fail("Generate OTP Endpoint", res.text)
    except Exception as e:
        print_fail("Generate OTP Endpoint", str(e))

    # 2. Test Login with WRONG OTP (Should fail)
    try:
        res = requests.post(f"{BASE_URL}/auth/login", json={"phone": "9999999999", "otp": "0000"})
        if res.status_code == 401:
            print_pass("Login with Wrong OTP (Enforced)")
        else:
            print_fail("Login with Wrong OTP (Should fail)", res.status_code)
    except Exception as e:
        print_fail("Login with Wrong OTP", str(e))

    # 3. Test Register with MISSING OTP (Should fail/unauthorized)
    # Registration logic now checks cache. If we didn't call /otp first or provide wrong otp...
    # Wait, registration schema now requires 'otp'. Logic checks cache.
    # So if we send random OTP without generating it first, it should fail.
    
    new_user = {
        "fullname": "Security Test User",
        "phone": "8888888888",
        "dob": "1990-01-01",
        "blood_group": "A+",
        "address": "Secure St",
        "health_issues": "Diabetes",
        "role": "patient",
        "otp": "9999" 
    }
    
    try:
        res = requests.post(f"{BASE_URL}/auth/register", json=new_user)
        if res.status_code == 401:
            print_pass("Register with Invalid/Missing Cached OTP")
        else:
            print_fail("Register with Invalid OTP (Should 401)", res.status_code)
    except Exception as e:
        print_fail("Register with Invalid OTP", str(e))

    print("\n🏁 Security Verification Complete")

if __name__ == "__main__":
    verify_security()
