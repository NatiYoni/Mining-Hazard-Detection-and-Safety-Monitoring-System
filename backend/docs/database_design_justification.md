# Database Layer Design and Justification
## Mining Hazard Detection and Safety Monitoring System

### 1. Database Choice: PostgreSQL (via Supabase)

For this academic MVP, **PostgreSQL** is the optimal choice for the primary database.

*   **Relational Integrity**: The system requires strict relationships between Devices, Sensors, Alerts, and Users. PostgreSQL enforces these constraints (Foreign Keys) natively, ensuring data consistency which is critical for safety systems.
*   **JSON Support**: The `SensorReading` entity uses a `jsonb` column (`Payload`) to store flexible sensor data (MPU6050, DHT22, MQ-2). PostgreSQL's binary JSON support allows us to query specific sensor values (e.g., `payload->>'co2'`) efficiently without altering the schema for every new sensor type.
*   **Time-Series Capability**: While not a dedicated time-series DB, PostgreSQL (especially with partitioning or simple indexing on `timestamp`) handles the volume of data expected in an MVP context efficiently.
*   **Supabase (Managed Service)**:
    *   **Zero Maintenance**: Supabase handles backups, updates, and scaling, allowing the team to focus on application logic.
    *   **Real-time Features**: Supabase offers real-time subscriptions, which could be leveraged in the future for the dashboard.
    *   **Cost-Effective**: Excellent free tier suitable for academic projects.

### 2. Schema Design

The schema follows a normalized relational model to ensure data integrity while allowing flexibility for sensor payloads.

*   **Devices**: Stores metadata (Name, Location). Acts as the root entity for all data streams.
*   **SensorReadings**:
    *   **Structure**: `ID`, `DeviceID`, `SensorType`, `Payload (JSONB)`, `Timestamp`.
    *   **Justification**: The `JSONB` payload allows a single table to store diverse data from gas sensors (MQ-2), accelerometers (MPU6050), and environmental sensors (DHT22). This simplifies the write path for the ESP32.
*   **Alerts**:
    *   **Structure**: `ID`, `DeviceID`, `Severity`, `Message`, `Timestamp`.
    *   **Justification**: Linked directly to devices to trace the source of hazards.
*   **Images**:
    *   **Structure**: `ID`, `DeviceID`, `ImageURL`, `Timestamp`.
    *   **Justification**: Stores references (URLs) to images stored in object storage (like Supabase Storage or AWS S3), keeping the database lightweight.

### 3. Architecture: Render (Backend) + Supabase (DB)

This decoupled architecture provides significant benefits for reliability and scalability.

#### Connection Security & Configuration
The Go backend running on **Render** connects to **Supabase** using a secure connection string.

1.  **Environment Variables**:
    *   The connection string is never hardcoded. It is injected via the `DATABASE_URL` environment variable on Render.
    *   `DATABASE_URL=postgres://user:password@db.supabase.co:5432/postgres`
    *   The backend code checks for `DATABASE_URL` first. If present (Production), it uses it. If not (Local), it falls back to individual host/port variables.

2.  **Security**:
    *   **SSL/TLS**: The connection to Supabase is encrypted by default.
    *   **Network Isolation**: While the database is public-facing (protected by strong credentials), Supabase allows configuring network restrictions if needed.

#### Benefits for an Academic MVP

*   **Reliability**:
    *   **Stateless Backend**: The Go backend on Render is stateless (Docker container). If it crashes, Render automatically restarts it.
    *   **Managed Persistence**: Data is safely stored in Supabase, independent of the backend's lifecycle.
*   **Scalability**:
    *   **Horizontal Scaling**: We can run multiple instances of the Go backend on Render to handle increased traffic without changing the code.
    *   **Database Scaling**: Supabase can scale vertically (more RAM/CPU) with a few clicks.
*   **Maintainability**:
    *   **Docker**: The `Dockerfile` ensures the environment is identical between development and production.
    *   **Separation of Concerns**: Database management is offloaded to Supabase, reducing the operational burden on the student team.
