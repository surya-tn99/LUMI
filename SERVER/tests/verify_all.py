import requests
import json
from datetime import date

BASE_URL = "http://localhost:8000"
PHONE_GOKUL = "1231231234"
OTP = "1234"

def print_pass(msg):
    print(f"✅ PASS: {msg}")

def print_fail(msg, details=""):
    print(f"❌ FAIL: {msg} {details}")

def verify_backend():
    print("🚀 Starting Comprehensive Backend Verification")
    
    # ---------------------------------------------------------
    # 1. AUTHENTICATION PERMUTATIONS
    # ---------------------------------------------------------
    print("\n--- Testing Authentication ---")
    
    # Test 1.1: Check User (Existing)
    try:
        res = requests.post(f"{BASE_URL}/auth/check-user", json={"phone": PHONE_GOKUL})
        if res.status_code == 200 and res.json()["exists"] == True:
            print_pass("Check Existing User (Gokul)")
        else:
            print_fail("Check Existing User (Gokul)", res.text)
    except Exception as e:
        print_fail("Check Existing User (Gokul)", str(e))

    # Test 1.2: Check User (Non-Existent)
    try:
        res = requests.post(f"{BASE_URL}/auth/check-user", json={"phone": "0000000000"})
        if res.status_code == 200 and res.json()["exists"] == False:
            print_pass("Check Non-Existent User")
        else:
            print_fail("Check Non-Existent User", res.text)
    except Exception as e:
        print_fail("Check Non-Existent User", str(e))

    # Test 1.3: Login (Existing User - Success)
    token = None
    try:
        res = requests.post(f"{BASE_URL}/auth/login", json={"phone": PHONE_GOKUL, "otp": OTP})
        if res.status_code == 200 and "access_token" in res.json():
            token = res.json()["access_token"]
            print_pass("Login Existing User (Gokul)")
        else:
            print_fail("Login Existing User (Gokul)", res.text)
    except Exception as e:
        print_fail("Login Existing User (Gokul)", str(e))

    # Test 1.4: Login (Invalid OTP)
    try:
        res = requests.post(f"{BASE_URL}/auth/login", json={"phone": PHONE_GOKUL, "otp": "0000"})
        if res.status_code == 401:
            print_pass("Login with Invalid OTP")
        else:
            print_fail("Login with Invalid OTP (Should fail)", res.status_code)
    except Exception as e:
        print_fail("Login with Invalid OTP", str(e))

    if not token:
        print("⚠️ Cannot proceed with CRUD tests without token.")
        return

    headers = {"Authorization": f"Bearer {token}"}

    # ---------------------------------------------------------
    # 2. MEDICATION CRUD PERMUTATIONS
    # ---------------------------------------------------------
    print("\n--- Testing Medication CRUD ---")
    
    med_id = None
    
    # Test 2.1: Get Medications (Initial State)
    try:
        res = requests.get(f"{BASE_URL}/medications/", headers=headers)
        if res.status_code == 200:
            print_pass("Get Medications (List)")
            print(f"   ℹ️ Found {len(res.json())} medications")
        else:
            print_fail("Get Medications", res.text)
    except Exception as e:
        print_fail("Get Medications", str(e))

    # Test 2.2: Create Medication (Valid)
    new_med = {
        "name": "TestMeds",
        "dosage": "10mg",
        "scheduled_time": "10:00",
        "start_date": str(date.today())
    }
    try:
        res = requests.post(f"{BASE_URL}/medications/", json=new_med, headers=headers)
        if res.status_code == 200:
            data = res.json()
            med_id = data["id"]
            if data["name"] == "TestMeds":
                print_pass("Create Medication (Valid)")
            else:
                print_fail("Create Medication (Content Mismatch)", str(data))
        else:
            print_fail("Create Medication", res.text)
    except Exception as e:
        print_fail("Create Medication", str(e))

    # Test 2.3: Create Medication (Missing Field - Validation Error)
    bad_med = {
        "name": "BadMeds"
        # Missing required fields
    }
    try:
        res = requests.post(f"{BASE_URL}/medications/", json=bad_med, headers=headers)
        if res.status_code == 422:
            print_pass("Create Medication (Missing Fields - Validation)")
        else:
            print_fail("Create Medication (Should fail validation)", res.status_code)
    except Exception as e:
        print_fail("Create Medication (Validation)", str(e))

    if not med_id:
        print("⚠️ Cannot proceed with Update/Delete tests without created medication.")
        return

    # Test 2.4: Update Medication (Valid)
    update_data = {
        "dosage": "20mg"
    }
    try:
        res = requests.put(f"{BASE_URL}/medications/{med_id}", json=update_data, headers=headers)
        if res.status_code == 200 and res.json()["dosage"] == "20mg":
            print_pass("Update Medication (Valid)")
        else:
            print_fail("Update Medication", res.text)
    except Exception as e:
        print_fail("Update Medication", str(e))

    # Test 2.5: Update Medication (Invalid ID)
    try:
        res = requests.put(f"{BASE_URL}/medications/999999", json=update_data, headers=headers)
        if res.status_code == 404:
            print_pass("Update Medication (Non-Existent ID)")
        else:
            print_fail("Update Medication (Should 404)", res.status_code)
    except Exception as e:
        print_fail("Update Medication (Invalid ID)", str(e))

    # Test 2.6: Delete Medication (Valid)
    try:
        res = requests.delete(f"{BASE_URL}/medications/{med_id}", headers=headers)
        if res.status_code == 200:
            print_pass("Delete Medication (Valid)")
        else:
            print_fail("Delete Medication", res.text)
    except Exception as e:
        print_fail("Delete Medication", str(e))

    # Test 2.7: Get Medication (Verify Deletion)
    # Note: Our GET /medications list all, so we check if ID is gone
    try:
        res = requests.get(f"{BASE_URL}/medications/", headers=headers)
        ids = [m["id"] for m in res.json()]
        if med_id not in ids:
            print_pass("Verify Deletion (Medication gone from list)")
        else:
            print_fail("Verify Deletion (Medication still in list)")
    except Exception as e:
        print_fail("Verify Deletion", str(e))
        
    print("\n🏁 Verification Complete")

if __name__ == "__main__":
    verify_backend()
