# How to Run the 11Planner Application

This application consists of a **FastAPI backend** and a **Next.js frontend**. 
Currently, the backend uses an **in-memory database**, so no external database setup (like PostgreSQL) is required.

## Prerequisites
- **Python** (3.8+)
- **Node.js** (18+)
- **npm**
- **OpenAI API Key** (for AI schedule optimization)

## Quick Start

### 0. Get an OpenAI API Key (Required for AI Features)
1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Sign up or log in to your OpenAI account
3. Create a new API key
4. Copy the key (you won't see it again!)

### 1. Backend Setup (Terminal 1)
Navigate to the `backend` directory and set up the Python environment:

```powershell
cd backend

# Create .env file with your OpenAI API key
# Copy from .env.example and add your actual API key
copy .env.example .env
# Then edit .env and replace "your_api_key_here" with your actual OpenAI API key
notepad .env

# Create virtual environment
python -m venv .venv

# Activate virtual environment
.\.venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the server
python3 -m uvicorn app.main:app --reload
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
- The **OpenAI API key is required** for AI schedule optimization to work. Without it, schedules will be generated using basic urgency scoring only.
- Since the database is **in-memory**, restarting the backend will **reset all data** (tasks, courses, etc.).
- The backend configuration is in `backend/app/main.py`.
- The frontend configuration is in `next.config.ts`.
- If you don't have an OpenAI account, sign up for free at [OpenAI Platform](https://platform.openai.com)
