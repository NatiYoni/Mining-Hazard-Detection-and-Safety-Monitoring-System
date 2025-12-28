# Deployment Guide

## 1. Database (Supabase)
1.  Create a new project on [Supabase](https://supabase.com/).
2.  Go to **Project Settings > Database**.
3.  Copy the **Connection String (URI)**. It should look like: `postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres`
4.  **Important**: For the backend to work reliably with Supabase, make sure to use the "Session" mode port (5432) or "Transaction" mode port (6543). The code is configured to support the transaction pooler (`PreferSimpleProtocol: true`).

## 2. Backend (Render)
1.  Create a new **Web Service** on [Render](https://render.com/).
2.  Connect your GitHub repository.
3.  **Root Directory**: `backend`
4.  **Build Command**: `go build -o main .`
5.  **Start Command**: `./main`
6.  **Environment Variables**:
    *   `DATABASE_URL`: Paste your Supabase Connection String here.
    *   `PORT`: `8080` (Render sets this automatically, but good to be explicit).
    *   `JWT_SECRET`: Set a strong random string.
    *   `GIN_MODE`: `release`
7.  Deploy the service.
8.  Copy the **Service URL** (e.g., `https://mining-hazard-backend.onrender.com`).

## 3. Frontend (Vercel)
1.  Create a new Project on [Vercel](https://vercel.com/).
2.  Import your GitHub repository.
3.  **Root Directory**: `frontend`
4.  **Framework Preset**: Next.js (should be detected automatically).
5.  **Environment Variables**:
    *   `NEXT_PUBLIC_API_URL`: Paste your Render Backend URL + `/api/v1` (e.g., `https://mining-hazard-backend.onrender.com/api/v1`).
6.  Deploy.

## 4. Demo Simulation
To run the demo script against your live cloud deployment:

1.  Open a terminal.
2.  Run the script with your Render URL:
    ```bash
    python scripts/demo_sim.py https://mining-hazard-backend.onrender.com/api/v1/sensor-data
    ```
3.  Watch your Vercel-deployed dashboard update in real-time!
