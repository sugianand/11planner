# How to Run the 11Planner Application

This application consists of a **FastAPI backend** and a **Next.js frontend**. 
Currently, the backend uses an **in-memory database**, so no external database setup (like PostgreSQL) is required.

## Prerequisites
- **Python** (3.8+)
- **Node.js** (18+)
- **npm**

## Quick Start

### 1. Backend Setup (Terminal 1)
Navigate to the `backend` directory and set up the Python environment:

```powershell
cd backend
# Create virtual environment
python -m venv .venv

# Activate virtual environment
.\.venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the server
uvicorn app.main:app --reload
```
The backend will run at `http://127.0.0.1:8000`.
API Docs available at: `http://127.0.0.1:8000/docs`

### 2. Frontend (Next.js)
Navigate to the `frontend` directory:

```powershell
    cd frontend
# Install dependencies
npm install

# Start the frontend
npm run dev
```
The frontend will run at `http://localhost:3000`.

## Notes
- Since the database is **in-memory**, restarting the backend will **reset all data** (tasks, courses, etc.).
- The backend configuration is in `backend/app/main.py`.
- The frontend configuration is in `next.config.ts`.
