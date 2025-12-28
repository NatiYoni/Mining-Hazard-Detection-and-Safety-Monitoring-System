import requests
import time
import random
import json
import uuid
import os
import sys
import base64
import threading

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
    """Creates a new device to ensure valid Device ID."""
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
            return device_id
        else:
            print(f"Failed to create device: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"Error creating device: {e}")
    return None

def capture_webcam_frame():
    """Captures a frame from the webcam and returns it as a Base64 string."""
    if not CV2_AVAILABLE:
        return None
    
    # Open default camera
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("Error: Could not open webcam.")
        return None
    
    # Warm up camera (skip a few frames)
    # for _ in range(5):
    #     cap.read()

    ret, frame = cap.read()
    cap.release()
    
    if not ret:
        print("Error: Could not read frame.")
        return None
    
    # Resize to reduce payload size (e.g., 320x240 for stream)
    frame = cv2.resize(frame, (320, 240))
    
    # Encode to JPEG with lower quality for speed
    encode_param = [int(cv2.IMWRITE_JPEG_QUALITY), 50]
    _, buffer = cv2.imencode('.jpg', frame, encode_param)
    
    # Convert to Base64
    jpg_as_text = base64.b64encode(buffer).decode('utf-8')
    return f"data:image/jpeg;base64,{jpg_as_text}"

def stream_video(device_id, token):
    """Continuously streams video frames to the backend."""
    print("Starting video stream thread...")
    headers = {"Authorization": f"Bearer {token}"}
    
    while True:
        try:
            image_data = capture_webcam_frame()
            if image_data:
                payload = {
                    "device_id": device_id,
                    "image_url": image_data
                }
                # Use the stream endpoint to avoid filling DB
                requests.post(STREAM_URL, json=payload, headers=headers)
            
            # 2 FPS
            time.sleep(0.5)
        except Exception as e:
            print(f"Stream error: {e}")
            time.sleep(1)

def send_video_event(device_id, token):
    """Simulates sending a video/image capture during an event."""
    # Now that we stream, this might be redundant, or we can use it to save a high-res snapshot to DB
    print("Uploading event snapshot (High Res)...")
    
    # Capture high res for event
    if CV2_AVAILABLE:
        cap = cv2.VideoCapture(0)
        ret, frame = cap.read()
        cap.release()
        if ret:
            frame = cv2.resize(frame, (640, 480))
            _, buffer = cv2.imencode('.jpg', frame)
            jpg_as_text = base64.b64encode(buffer).decode('utf-8')
            image_data = f"data:image/jpeg;base64,{jpg_as_text}"
        else:
            image_data = None
    else:
        image_data = None

    if not image_data:
        print("Using placeholder image.")
        image_data = "https://placehold.co/600x400/red/white?text=HAZARD+DETECTED"

    headers = {"Authorization": f"Bearer {token}"}
    payload = {
        "device_id": device_id,
        "image_url": image_data
    }
    try:
        response = requests.post(IMAGES_URL, json=payload, headers=headers)
        if response.status_code == 201:
            print("Snapshot uploaded successfully.")
        else:
            print(f"Failed to upload snapshot: {response.status_code}")
    except Exception as e:
        print(f"Error uploading snapshot: {e}")

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

def simulate_warning():
    """Simulates warning temperature"""
    return {
        "temp": round(random.uniform(32, 37), 1), # > 31 is Warning
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
