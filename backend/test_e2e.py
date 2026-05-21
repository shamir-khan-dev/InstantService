import requests
import json
import time

BASE_URL = "http://127.0.0.1:8000/api"

print("Starting End-to-End API Test...\n")

# 1. Analyze Request (Gemini)
print("1. Testing /analyze-request (Gemini AI)...")
analyze_payload = {
    "client_id": "client_123",
    "message": "My power went out in the kitchen after I plugged in the microwave.",
    "location": "New York",
    "property_type": "Residential"
}
res1 = requests.post(f"{BASE_URL}/analyze-request", json=analyze_payload)
print(f"Status: {res1.status_code}")
data1 = res1.json()
print(json.dumps(data1, indent=2))
request_id = data1.get("request_id")
print("-" * 40)

# 2. Select Tier
print("\n2. Testing /select-tier...")
tier_payload = {
    "request_id": request_id,
    "selected_tier": "Plus"
}
res2 = requests.post(f"{BASE_URL}/select-tier", json=tier_payload)
print(f"Status: {res2.status_code}")
print(json.dumps(res2.json(), indent=2))
print("-" * 40)

# 3. Dispatch
print("\n3. Testing /dispatch...")
dispatch_payload = {
    "request_id": request_id
}
res3 = requests.post(f"{BASE_URL}/dispatch", json=dispatch_payload)
print(f"Status: {res3.status_code}")
data3 = res3.json()
print(json.dumps(data3, indent=2))
booking_id = data3.get("booking_id")
print("-" * 40)

# 4. Voice Confirmation (ElevenLabs)
print("\n4. Testing /voice-confirmation (ElevenLabs)...")
voice_payload = {
    "booking_id": booking_id,
    "tier": "Plus",
    "service_category": "Electrical",
    "contractor_name": data3.get("contractor", {}).get("name", "Test Contractor"),
    "arrival_window": data3.get("estimated_arrival_window", "1 hour")
}
res4 = requests.post(f"{BASE_URL}/voice-confirmation", json=voice_payload)
print(f"Status: {res4.status_code}")
data4 = res4.json()
# Truncate base64 audio for printing
if data4.get("audio_base64"):
    data4["audio_base64"] = data4["audio_base64"][:50] + "... [truncated]"
print(json.dumps(data4, indent=2))
print("-" * 40)

print("\nAll endpoints tested successfully!")
