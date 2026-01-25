# Mining Hazard Detection and Safety Monitoring System

This project is a comprehensive solution for real-time mining hazard detection and safety monitoring, integrating IoT devices, a backend server, a web frontend, and a cross-platform mobile application. The system is designed to enhance safety in mining environments by providing live monitoring, alerting, and device management capabilities.

## Table of Contents
- [Project Structure](#project-structure)
- [Technologies Used](#technologies-used)
- [Folder Overviews](#folder-overviews)
  - [backend](#backend)
  - [frontend](#frontend)
  - [mobile_app](#mobile_app)
  - [firmware](#firmware)
  - [scripts](#scripts)
- [Deployment](#deployment)

---

## Project Structure

```
backend/        # Go backend server (REST API, WebSocket, DB)
frontend/       # Next.js web frontend (React, TypeScript)
mobile_app/     # Flutter mobile app (Android/iOS/Web)
firmware/       # ESP32 firmware for sensors and cameras
scripts/        # Utility scripts (e.g., data simulation)
```

## Technologies Used
- **Backend:** Go, Gin, PostgreSQL, Docker, WebSocket
- **Frontend:** Next.js, React, TypeScript, Tailwind CSS
- **Mobile App:** Flutter, Dart, BLoC State Management, Dio, Provider
- **Firmware:** ESP32 (Arduino/C++), WiFi, Camera, Sensor libraries
- **DevOps:** Docker Compose

---

## Folder Overviews

### backend
- **Language:** Go
- **Frameworks/Libraries:** Gin (HTTP), GORM (ORM), JWT, WebSocket
- **Features:**
  - RESTful API for device, sensor, user, and alert management
  - WebSocket for real-time updates
  - Middleware for authentication, CORS, logging, and role-based access
  - PostgreSQL integration
  - Dockerized for easy deployment
- **Key Files:**
  - `cmd/server/main.go`: Entry point
  - `delivery/controllers/`: API controllers
  - `infrastructure/database/`: DB connection and repositories
  - `usecases/`: Business logic
  - `config/`: Configuration management
  - `docker-compose.yml`, `Dockerfile`: Containerization

### frontend
- **Language:** TypeScript
- **Frameworks/Libraries:** Next.js, React, Tailwind CSS
- **Features:**
  - Modern web dashboard for monitoring and management
  - Authentication and authorization
  - Real-time data visualization
  - Responsive UI
- **Key Files:**
  - `src/app/`: Main app pages and layout
  - `src/components/`: Reusable UI components
  - `src/context/`, `src/hooks/`, `src/lib/`: State and logic helpers
  - `public/`: Static assets
  - `package.json`, `tsconfig.json`: Project config

### mobile_app
- **Language:** Dart
- **Frameworks/Libraries:** Flutter, BLoC, Dio, Provider
- **Features:**
  - Cross-platform mobile app (Android, iOS, Web)
  - Real-time alerts and device status
  - User authentication
  - Device and sensor management
  - State management using BLoC
- **Key Files:**
  - `lib/main.dart`: App entry point
  - `lib/features/`: Feature modules
  - `lib/core/`: Core utilities and services
  - `lib/injection_container.dart`: Dependency injection
  - `test/`: Widget and unit tests
  - `pubspec.yaml`: Dependencies

### firmware
- **Language:** Arduino/C++
- **Devices:** ESP32-CAM, ESP32 Sensor
- **Features:**
  - Sensor data acquisition (temperature, gas, etc.)
  - Camera streaming (ESP32-CAM)
  - WiFi connectivity and MQTT/HTTP communication
- **Key Files:**
  - `esp32_cam/esp32_cam.ino`: Camera firmware
  - `esp32_sensor/esp32_sensor.ino`: Sensor firmware

### scripts
- **Language:** Python
- **Features:**
  - Data simulation and demo scripts
  - Utilities for testing and development
- **Key Files:**
  - `demo_sim.py`: Simulates sensor/device data

---

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions using Docker Compose and environment setup.

---

## Contributor
- Natnael Yonas Asefaw
