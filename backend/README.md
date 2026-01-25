# Backend

This folder contains the Go backend server for the Mining Hazard Detection and Safety Monitoring System.

## Technologies Used
- **Go** (Golang)
- **Gin** (HTTP web framework)
- **GORM** (ORM for PostgreSQL)
- **JWT** (Authentication)
- **WebSocket** (Real-time communication)
- **Docker** (Containerization)

## Structure
- `cmd/server/`: Main server entry point
- `delivery/controllers/`: REST API controllers
- `delivery/router/`: API routing
- `domain/`: Domain entities and repository interfaces
- `infrastructure/database/`: Database connection and repositories
- `infrastructure/middleware/`: Auth, CORS, logging, role-based middleware
- `infrastructure/utils/`: Utility functions (e.g., JWT)
- `infrastructure/websocket/`: WebSocket hub for real-time updates
- `usecases/`: Business logic
- `config/`: Configuration management
- `docs/`: Architecture and API documentation
- `docker-compose.yml`, `Dockerfile`: Containerization

## Features
- RESTful API for device, sensor, user, and alert management
- Real-time updates via WebSocket
- Middleware for authentication, CORS, logging, and role-based access
- PostgreSQL integration
- Dockerized for easy deployment
