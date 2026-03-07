from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from app.api.tasks import router as tasks_router
from app.api.courses import router as courses_router
from app.api.assignments import router as assignments_router
from app.api.schedule_blocks import router as schedule_blocks_router
from app.api.syllabus import router as syllabus_router

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

app = FastAPI(
    title="11Planner API",
    description="Backend API for 11Planner - AI-assisted schedule generation",
    version="0.1.0"
)

# Enable CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(tasks_router)
app.include_router(courses_router)
app.include_router(assignments_router)
app.include_router(schedule_blocks_router)
app.include_router(syllabus_router)

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "11Planner API"}

# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "Welcome to 11Planner API",
        "version": "0.1.0",
        "docs": "/docs"
    }

# API ping endpoint
@app.get("/api/ping")
async def api_ping():
    return {"message": "pong"}
