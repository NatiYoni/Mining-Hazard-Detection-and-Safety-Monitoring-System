# Firmware

This folder contains the firmware for ESP32-based devices used in the Mining Hazard Detection and Safety Monitoring System.

## Technologies Used
- **ESP32** (Microcontroller)
- **Arduino/C++** (Programming language)
- **WiFi** (Connectivity)
- **Camera and Sensor libraries**

## Structure
- `esp32_cam/esp32_cam.ino`: Firmware for ESP32-CAM (video streaming)
- `esp32_sensor/esp32_sensor.ino`: Firmware for ESP32 sensor node (data acquisition)

## Features
- Sensor data acquisition (temperature, gas, etc.)
- Camera streaming (ESP32-CAM)
- WiFi connectivity
- Communication with backend via MQTT/HTTP
