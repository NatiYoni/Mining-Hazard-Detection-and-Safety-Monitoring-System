import requests
import time
import random
import json
import uuid
import os
import sys

# Configuration
# Default to localhost, but allow override via env var or arg
DEFAULT_URL = "http://localhost:8080/api/v1/sensor-data"
API_URL = os.getenv("API_URL", DEFAULT_URL)

if len(sys.argv) > 1:
    API_URL = sys.argv[1]

print(f"Targeting API: {API_URL}")

DEVICE_ID = str(uuid.uuid4()) # Generate a random device ID for this session
# Or use a fixed one if you want to track the same device
# DEVICE_ID = "550e8400-e29b-41d4-a716-446655440000"

print(f"Simulating Device: {DEVICE_ID}")

def send_data(data):
    payload = {
        "device_id": DEVICE_ID,
        "sensor_type": "telemetry",
        "payload": data
    }
    try:
        response = requests.post(API_URL, json=payload)
        print(f"Sent: {data} | Status: {response.status_code}")
    except Exception as e:
        print(f"Error: {e}")

def simulate_normal():
    """Simulates normal safe conditions"""
    return {
        "temp": round(random.uniform(20, 28), 1),
        "gas": round(random.uniform(100, 300), 1),
        "vibration": round(random.uniform(0, 50), 1),
        "fall": False
    }

def simulate_gas_leak():
    """Simulates a gas leak event"""
    return {
        "temp": round(random.uniform(25, 30), 1),
        "gas": round(random.uniform(750, 1200), 1), # > 700 is Critical
        "vibration": round(random.uniform(0, 50), 1),
        "fall": False
    }

def simulate_heat_wave():
    """Simulates high temperature"""
    return {
        "temp": round(random.uniform(39, 45), 1), # > 38 is Critical
        "gas": round(random.uniform(200, 400), 1),
        "vibration": round(random.uniform(0, 50), 1),
        "fall": False
    }

def simulate_fall():
    """Simulates a worker fall"""
    return {
        "temp": round(random.uniform(20, 28), 1),
        "gas": round(random.uniform(100, 300), 1),
        "vibration": round(random.uniform(100, 200), 1), # Impact vibration
        "fall": True
    }

def run_demo():
    print("Starting Simulation...")
    print("1. Normal Operation (10s)")
    for _ in range(10):
        send_data(simulate_normal())
        time.sleep(1)

    print("\n2. GAS LEAK DETECTED! (5s)")
    for _ in range(5):
        send_data(simulate_gas_leak())
        time.sleep(1)

    print("\n3. Returning to Normal (5s)")
    for _ in range(5):
        send_data(simulate_normal())
        time.sleep(1)

    print("\n4. HEAT STRESS DETECTED! (5s)")
    for _ in range(5):
        send_data(simulate_heat_wave())
        time.sleep(1)
    
    print("\n5. MAN DOWN! (Single Event)")
    send_data(simulate_fall())
    
    print("\nSimulation Complete.")

if __name__ == "__main__":
    # You might need to install requests: pip install requests
    run_demo()
