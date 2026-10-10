from pathlib import Path
import os
from contextlib import asynccontextmanager
import asyncio

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from app.api.tasks import router as tasks_router
from app.api.courses import router as courses_router
from app.api.assignments import router as assignments_router
from app.api.schedule_blocks import router as schedule_blocks_router
from app.api.syllabus import router as syllabus_router
from app.api.music import router as music_router
from app.api.support import router as support_router
from app.api.account import router as account_router
from app.api.email import router as email_router, weekly_email_worker, task_alert_worker

load_dotenv(Path(__file__).resolve().parents[1] / ".env", override=True)


@asynccontextmanager
async def lifespan(_app: FastAPI):
    worker_task: asyncio.Task | None = None
    alert_task: asyncio.Task | None = None
    # Long-running loops can't live in serverless functions, so they default off on Vercel.
    default_worker = "false" if os.getenv("VERCEL") else "true"
    run_worker = os.getenv("RUN_WEEKLY_EMAIL_WORKER", default_worker).lower() not in {"0", "false", "no", "off"}

    if run_worker:
        worker_task = asyncio.create_task(weekly_email_worker())
        alert_task = asyncio.create_task(task_alert_worker())

    try:
        yield
    finally:
        for task in [worker_task, alert_task]:
            if task:
                task.cancel()
                try:
                    await task
                except asyncio.CancelledError:
                    pass

app = FastAPI(
    title="11Planner API",
    description="Backend API for 11Planner - AI-assisted schedule generation",
    version="0.1.0",
    lifespan=lifespan,
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
app.include_router(music_router)
app.include_router(support_router)
app.include_router(account_router)
app.include_router(email_router)

# --- Fallback routes to catch Chrome Extension URL typos ---
from app.api.assignments import sync_assignments, SyncRequest

@app.post("//api/assignments/sync")
@app.post("/api/api/assignments/sync")
@app.post("/api/assignments/sync/")
@app.post("/api/tasks/sync")
@app.post("/sync")
# Catches legacy/typo sync paths and forwards to the canonical sync handler.
async def fallback_sync_route(sync_request: SyncRequest):
    return await sync_assignments(sync_request)
# -----------------------------------------------------------


# Health check endpoint
@app.get("/health")
# Reports basic API health for uptime checks.
async def health_check():
    return {"status": "healthy", "service": "11Planner API"}

# Root endpoint
@app.get("/")
# Returns basic API metadata and docs link.
async def root():
    return {
        "message": "Welcome to 11Planner API",
        "version": "0.1.0",
        "docs": "/docs"
    }

# API ping endpoint
@app.get("/api/ping")
# Lightweight ping endpoint used by clients for connectivity checks.
async def api_ping():
    return {"message": "pong"}
