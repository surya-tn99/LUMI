import requests
import uuid

BASE_URL = "http://127.0.0.1:8000"

def create_random_user(prefix):
    phone = str(uuid.uuid4().int)[:10] # random 10 digit phone
    data = {
        "fullname": f"{prefix} User",
        "phone": phone,
        "dob": "1980-01-01",
        "blood_group": "O+",
        "address": f"{prefix} Address"
    }
    # Register
    print(f"[{prefix}] Registering with phone {phone}...")
    resp = requests.post(f"{BASE_URL}/auth/register", json=data)
    if resp.status_code != 200:
        print(f"Failed to register {prefix}: {resp.text}")
        return None, None
    token = resp.json()["access_token"]
    return phone, token

def test_multi_user_isolation():
    print("--- Starting Multi-User Isolation Test ---")
    
    # 1. Create User A
    phone_a, token_a = create_random_user("Alice")
    headers_a = {"Authorization": f"Bearer {token_a}"}
    
    # 2. Create User B
    phone_b, token_b = create_random_user("Bob")
    headers_b = {"Authorization": f"Bearer {token_b}"}
    
    # 3. User A adds a nominee
    print("[Alice] Adding nominee 'AliceMom'...")
    nominee_a = {
        "name": "AliceMom",
        "relationship": "Mother",
        "phone": "1111111111"
    }
    resp = requests.post(f"{BASE_URL}/nominees/", json=nominee_a, headers=headers_a)
    assert resp.status_code == 200
    
    # 4. User B adds a nominee
    print("[Bob] Adding nominee 'BobDad'...")
    nominee_b = {
        "name": "BobDad",
        "relationship": "Father",
        "phone": "2222222222"
    }
    resp = requests.post(f"{BASE_URL}/nominees/", json=nominee_b, headers=headers_b)
    assert resp.status_code == 200
    
    # 5. Verify Alice only sees AliceMom
    print("[Alice] Fetching nominees...")
    resp = requests.get(f"{BASE_URL}/nominees/", headers=headers_a)
    data = resp.json()
    names = [n["name"] for n in data]
    print(f"[Alice] Sees: {names}")
    
    if "AliceMom" in names and "BobDad" not in names:
        print("PASS: Alice sees correct data.")
    else:
        print("FAIL: Alice saw wrong data!")
        
    # 6. Verify Bob only sees BobDad
    print("[Bob] Fetching nominees...")
    resp = requests.get(f"{BASE_URL}/nominees/", headers=headers_b)
    data = resp.json()
    names = [n["name"] for n in data]
    print(f"[Bob] Sees: {names}")
    
    if "BobDad" in names and "AliceMom" not in names:
        print("PASS: Bob sees correct data.")
    else:
        print("FAIL: Bob saw wrong data!")

    print("--- Test Complete ---")

if __name__ == "__main__":
    test_multi_user_isolation()
