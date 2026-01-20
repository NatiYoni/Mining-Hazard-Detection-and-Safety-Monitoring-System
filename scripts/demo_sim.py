import requests
import time
import random
import json
import uuid
import os
import sys
import base64
import threading

# Global state for video frame sharing
LATEST_FRAME = None
FRAME_LOCK = threading.Lock()

try:
    import cv2
    CV2_AVAILABLE = True
except ImportError:
    CV2_AVAILABLE = False
    print("Warning: 'opencv-python' not installed. Video features will use placeholders.")

# Configuration
# Default to localhost, but allow override via env var or arg
DEFAULT_BASE_URL = "http://localhost:8080"
BASE_URL = os.getenv("API_URL", DEFAULT_BASE_URL).rstrip('/')

if len(sys.argv) > 1:
    BASE_URL = sys.argv[1].rstrip('/')

print(f"Targeting API Base: {BASE_URL}")

SENSOR_DATA_URL = f"{BASE_URL}/api/v1/sensor-data"
LOGIN_URL = f"{BASE_URL}/api/v1/login"
REGISTER_URL = f"{BASE_URL}/api/v1/register"
DEVICES_URL = f"{BASE_URL}/api/v1/devices"
IMAGES_URL = f"{BASE_URL}/api/v1/images"
STREAM_URL = f"{BASE_URL}/api/v1/images/stream"

# Demo User Credentials
ADMIN_USERNAME = "demo_admin"
ADMIN_PASSWORD = "password123"

SUPERVISOR_USERNAME = "demo_supervisor"
SUPERVISOR_PASSWORD = "password123"

def get_auth_token(username, password, role="User"):
    """Authenticates the user and returns the JWT token and User ID."""
    print(f"Authenticating as {username}...")
    
    # Try to login first
    try:
        login_payload = {"username": username, "password": password}
        response = requests.post(LOGIN_URL, json=login_payload)
        
        if response.status_code == 200:
            print("Login successful.")
            data = response.json()
            return data.get("token"), data.get("user", {}).get("id")
        elif response.status_code == 400 or response.status_code == 404 or response.status_code == 401:
             # If login fails, try to register
            print("Login failed, attempting registration...")
            register_payload = {"username": username, "password": password, "role": role}
            reg_response = requests.post(REGISTER_URL, json=register_payload)
            
            if reg_response.status_code == 200 or reg_response.status_code == 201:
                print("Registration successful. Logging in...")
                # Login again to get token
                response = requests.post(LOGIN_URL, json=login_payload)
                if response.status_code == 200:
                     data = response.json()
                     return data.get("token"), data.get("user", {}).get("id")
            else:
                print(f"Registration failed: {reg_response.text}")
        else:
            print(f"Login failed with unexpected status: {response.status_code} - {response.text}")

    except Exception as e:
        print(f"Authentication error: {e}")
    
    return None, None

def create_device(token, supervisor_id=None):
    """Creates a new device or reuses existing one from .device_id file."""
    device_id_file = ".device_id"
    
    # Try to load existing device ID
    if os.path.exists(device_id_file):
        try:
            with open(device_id_file, "r") as f:
                existing_id = f.read().strip()
            print(f"Found existing device ID: {existing_id}")
            # Verify if it exists on backend (optional, but good practice)
            # For now, we'll assume it's valid if we have it, or we could try to fetch it.
            # If we wanted to be robust, we'd check GET /devices/{id}
            return existing_id
        except Exception as e:
            print(f"Error reading device ID file: {e}")

    print("Creating a new simulated device...")
    headers = {"Authorization": f"Bearer {token}"}
    payload = {
        "device_name": f"Simulated Device {uuid.uuid4().hex[:8]}",
        "location": "Simulation Script"
    }
    if supervisor_id:
        payload["supervisor_id"] = supervisor_id
        print(f"Assigning to Supervisor ID: {supervisor_id}")

    try:
        response = requests.post(DEVICES_URL, json=payload, headers=headers)
        if response.status_code == 201:
            device_id = response.json().get("id")
            print(f"Device created successfully: {device_id}")
            # Save to file
            with open(device_id_file, "w") as f:
                f.write(device_id)
            return device_id
        else:
            print(f"Failed to create device: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"Error creating device: {e}")
    return None

def stream_video(device_id, token):
    """Continuously streams video frames to the backend."""
    global LATEST_FRAME
    print("Starting video stream thread...")
    headers = {"Authorization": f"Bearer {token}"}
    session = requests.Session()
    
    if not CV2_AVAILABLE:
        print("OpenCV not available, skipping stream.")
        return

    # Open camera ONCE and keep it open
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("Error: Could not open webcam for streaming.")
        return

    print("Webcam opened successfully. Streaming started.")

    while True:
        try:
            ret, frame = cap.read()
            if ret:
                # Resize for performance (480x360 is decent for demo)
                frame = cv2.resize(frame, (480, 360))
                
                # Encode to JPEG
                encode_param = [int(cv2.IMWRITE_JPEG_QUALITY), 60]
                _, buffer = cv2.imencode('.jpg', frame, encode_param)
                
                # Convert to Base64
                jpg_as_text = base64.b64encode(buffer).decode('utf-8')
                image_data = f"data:image/jpeg;base64,{jpg_as_text}"
                
                # Update global frame for event snapshots
                with FRAME_LOCK:
                    LATEST_FRAME = image_data

                payload = {
                    "device_id": device_id,
                    "image_url": image_data
                }
                # Send to stream endpoint
                try:
                    resp = session.post(STREAM_URL, json=payload, headers=headers)
                    if resp.status_code != 200:
                        print(f"Stream Error: {resp.status_code} - {resp.text}")
                except Exception as e:
                    print(f"Stream Connection Error: {e}")
            
            # Target ~15-20 FPS (0.05s)
            time.sleep(0.05)
        except Exception as e:
            print(f"Stream error: {e}")
            time.sleep(1)

    cap.release()

def send_video_event(device_id, token):
    """Simulates sending a video/image capture during an event."""
    print("Event detected! (Video stream is active)")
    # Snapshot upload removed as per "Video Only" requirement
    pass

def send_data(device_id, data, token):
    payload = {
        "device_id": device_id,
        "sensor_type": "telemetry",
        "payload": data
    }
    headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"
        
    try:
        response = requests.post(SENSOR_DATA_URL, json=payload, headers=headers)
        if response.status_code == 401:
             print("Error: 401 Unauthorized. Token might be invalid or expired.")
        elif response.status_code == 500:
             print(f"Error: 500 Internal Server Error. Check backend logs. Data: {data}")
        else:
             print(f"Sent: {data} | Status: {response.status_code}")
    except Exception as e:
        print(f"Error: {e}")

def simulate_normal():
    """Simulates normal safe conditions"""
    return {
        "temp": round(random.uniform(20, 23), 1),
        "gas": round(random.uniform(100, 300), 1),
        "vibration": round(random.uniform(0, 50), 1),
        "fall": False
    }

def simulate_gas_leak():
    """Simulates a gas leak event"""
    return {
        "temp": round(random.uniform(20, 23), 1),
        "gas": round(random.uniform(750, 1200), 1), # > 700 is Critical
        "vibration": round(random.uniform(0, 50), 1),
        "fall": False
    }

def simulate_heat_wave():
    """Simulates high temperature"""
    return {
        "temp": round(random.uniform(26, 35), 1), # > 25 is Critical
        "gas": round(random.uniform(200, 400), 1),
        "vibration": round(random.uniform(0, 50), 1),
        "fall": False
    }

def simulate_warning():
    """Simulates warning temperature"""
    return {
        "temp": round(random.uniform(24.1, 24.9), 1), # > 24 is Warning
        "gas": round(random.uniform(200, 400), 1),
        "vibration": round(random.uniform(0, 50), 1),
        "fall": False
    }

def simulate_fall():
    """Simulates a worker fall"""
    return {
        "temp": round(random.uniform(20, 23), 1),
        "gas": round(random.uniform(100, 300), 1),
        "vibration": round(random.uniform(100, 200), 1), # Impact vibration
        "fall": True
    }

def run_demo():
    # 1. Get Supervisor ID (Create if needed)
    print("--- Setup: Supervisor ---")
    _, supervisor_id = get_auth_token(SUPERVISOR_USERNAME, SUPERVISOR_PASSWORD, "Supervisor")
    if not supervisor_id:
        print("Failed to get Supervisor ID.")
        return

    # 2. Get Admin Token (to create device)
    print("\n--- Setup: Admin ---")
    admin_token, _ = get_auth_token(ADMIN_USERNAME, ADMIN_PASSWORD, "Admin")
    if not admin_token:
        print("Failed to get Admin Token.")
        return

    # 3. Create Device assigned to Supervisor
    device_id = create_device(admin_token, supervisor_id)
    if not device_id:
        print("WARNING: Could not create device. Using random UUID (Expect 500 Error).")
        device_id = str(uuid.uuid4())

    print(f"\nSimulating Device: {device_id}")
    print(f"Assigned to Supervisor: {supervisor_id}")
    
    # Start Video Stream in background
    if CV2_AVAILABLE:
        stream_thread = threading.Thread(target=stream_video, args=(device_id, admin_token))
        stream_thread.daemon = True
        stream_thread.start()
    
    print("\nStarting Simulation...")
    print("1. Normal Operation (10s)")
    for _ in range(10):
        send_data(device_id, simulate_normal(), admin_token)
        time.sleep(1)

    print("\n2. GAS LEAK DETECTED! (5s)")
    send_video_event(device_id, admin_token) # Send snapshot at start of event
    for _ in range(5):
        send_data(device_id, simulate_gas_leak(), admin_token)
        time.sleep(1)

    print("\n3. Returning to Normal (5s)")
    for _ in range(5):
        send_data(device_id, simulate_normal(), admin_token)
        time.sleep(1)

    print("\n4. WARNING LEVEL HEAT (5s)")
    for _ in range(5):
        send_data(device_id, simulate_warning(), admin_token)
        time.sleep(1)

    print("\n5. HEAT STRESS DETECTED! (5s)")
    for _ in range(5):
        send_data(device_id, simulate_heat_wave(), admin_token)
        time.sleep(1)
    
    print("\n6. MAN DOWN! (Single Event)")
    send_video_event(device_id, admin_token) # Send snapshot
    send_data(device_id, simulate_fall(), admin_token)
    
    print("\nSimulation Complete.")

if __name__ == "__main__":
    # You might need to install requests: pip install requests
    run_demo()
