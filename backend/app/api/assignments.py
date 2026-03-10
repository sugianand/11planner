from fastapi import APIRouter, HTTPException
from typing import List, Optional
from app.models import Assignment, AssignmentCreate, AssignmentUpdate
from datetime import datetime
from uuid import uuid4
import os

from supabase import Client, create_client

router = APIRouter(prefix="/api/assignments", tags=["assignments"])

_supabase_client: Client | None = None


def get_supabase() -> Client:
    global _supabase_client
    if _supabase_client is not None:
        return _supabase_client
    url = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY") or os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
    if not url or not key:
        raise HTTPException(status_code=500, detail="Supabase credentials missing.")
    _supabase_client = create_client(url, key)
    return _supabase_client


def parse_dt(value: str | datetime) -> datetime:
    if isinstance(value, datetime):
        dt = value
    else:
        # Python 3.10 fromisoformat is dangerously strict about microsecond length. 
        # Safely chop off microseconds before parsing, keeping the timezone block
        if "." in value:
            main_part, rest = value.split(".", 1)
            tz_part = ""
            if "+" in rest:
                tz_part = "+" + rest.split("+")[1]
            elif "-" in rest:
                tz_part = "-" + rest.split("-")[1]
            elif "Z" in rest:
                tz_part = "+00:00"
            value = main_part + tz_part
        else:
            value = value.replace("Z", "+00:00")
        dt = datetime.fromisoformat(value)
        
    if dt.tzinfo is not None:
        return dt.astimezone().replace(tzinfo=None)
    return dt


def map_row(row: dict) -> dict:
    return {
        "id": row["id"],
        "user_id": row["user_id"],
        "title": row["title"],
        "course_id": row.get("course_id"),
        "deadline": parse_dt(row["deadline"]),
        "description": row.get("description") or "",
        "priority": row.get("priority") or 2,
        "estimated_hours": float(row.get("estimated_hours") or 1),
        "status": row.get("status") or "pending",
        "points": row.get("points"),
        "url": row.get("url"),
        "source": row.get("source") or "manual",
        "completed": row.get("completed", False),
        "created_at": parse_dt(row["created_at"]) if row.get("created_at") else datetime.now(),
    }


# ========== CRUD ==========

@router.get("/{user_id}", response_model=List[Assignment])
async def get_assignments_by_user(user_id: str):
    import os
    print(f"DEBUG IN UVICORN: Fetching for {user_id}")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY")
    print(f"DEBUG IN UVICORN: Using key ending in... {key[-5:] if key else 'None'} | Is Service Role? {'SUPABASE_SERVICE_ROLE_KEY' in os.environ}")
    
    supabase = get_supabase()
    result = (
        supabase.table("assignments")
        .select("*")
        .eq("user_id", user_id)
        .order("deadline", desc=False)
        .execute()
    )
    return [map_row(r) for r in (result.data or [])]


@router.get("/detail/{assignment_id}", response_model=Assignment)
async def get_assignment_by_id(assignment_id: str):
    supabase = get_supabase()
    result = supabase.table("assignments").select("*").eq("id", assignment_id).limit(1).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Assignment not found")
    return map_row(result.data[0])


@router.post("", response_model=Assignment)
async def create_assignment(assignment: AssignmentCreate):
    supabase = get_supabase()
    payload = {
        "user_id": assignment.user_id,
        "title": assignment.title,
        "course_id": assignment.course_id or None,
        "deadline": assignment.deadline.isoformat(),
        "description": assignment.description or None,
        "priority": assignment.priority,
        "estimated_hours": assignment.estimated_hours,
        "status": assignment.status,
        "completed": False,
        "points": assignment.points,
        "url": assignment.url,
        "source": assignment.source,
    }
    supabase.table("assignments").insert(payload).execute()
    # Fetch the newly created row back
    result = (
        supabase.table("assignments")
        .select("*")
        .eq("user_id", assignment.user_id)
        .eq("title", assignment.title)
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create assignment")
    return map_row(result.data[0])


@router.put("/{assignment_id}", response_model=Assignment)
async def update_assignment(assignment_id: str, assignment: AssignmentUpdate):
    supabase = get_supabase()
    update_data = assignment.model_dump(exclude_unset=True)
    payload = {}
    if "title" in update_data:
        payload["title"] = update_data["title"]
    if "course_id" in update_data:
        payload["course_id"] = update_data["course_id"]
    if "deadline" in update_data:
        payload["deadline"] = update_data["deadline"].isoformat()
    if "description" in update_data:
        payload["description"] = update_data["description"]
    if "priority" in update_data:
        payload["priority"] = update_data["priority"]
    if "estimated_hours" in update_data:
        payload["estimated_hours"] = update_data["estimated_hours"]
    if "status" in update_data:
        payload["status"] = update_data["status"]
    if "points" in update_data:
        payload["points"] = update_data["points"]
    if "url" in update_data:
        payload["url"] = update_data["url"]
    result = (
        supabase.table("assignments")
        .update(payload)
        .eq("id", assignment_id)
        .select("*")
        .single()
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Assignment not found")
    return map_row(result.data)


@router.delete("/{assignment_id}")
async def delete_assignment(assignment_id: str):
    supabase = get_supabase()
    supabase.table("assignments").delete().eq("id", assignment_id).execute()
    return {"message": "Assignment deleted successfully"}


# ========== CANVAS EXTENSION SYNC ==========

from pydantic import BaseModel as PydanticBase

class ExtensionAssignment(PydanticBase):
    title: str
    dueDate: Optional[str] = None
    course: Optional[str] = None
    points: Optional[float] = None
    type: Optional[str] = None
    url: Optional[str] = None
    description: Optional[str] = None

class SyncRequest(PydanticBase):
    userId: str
    assignments: List[ExtensionAssignment]


@router.post("/sync")
async def sync_assignments(sync_request: SyncRequest):
    """
    Called by the Canvas Chrome extension.
    Finds-or-creates courses and assignments from Canvas data.
    Idempotent: won't create duplicates (checks title + user_id).
    """
    supabase = get_supabase()
    synced_count = 0

    for ext in sync_request.assignments:
        # 1. Resolve or create course (search both old 'course_name' and new 'name' columns)
        course_name = (ext.course or "General").strip()
        course_res = (
            supabase.table("courses")
            .select("id")
            .eq("user_id", sync_request.userId)
            .ilike("name", course_name)
            .limit(1)
            .execute()
        )
        if not course_res.data:
            # Also try the old column name
            course_res = (
                supabase.table("courses")
                .select("id")
                .eq("user_id", sync_request.userId)
                .ilike("course_name", course_name)
                .limit(1)
                .execute()
            )
        if course_res.data:
            course_id = course_res.data[0]["id"]
        else:
            # Insert course — populate both old and new column names to satisfy any NOT NULL
            supabase.table("courses").insert({
                "user_id": sync_request.userId,
                "name": course_name,
                "course_name": course_name,          # old NOT NULL column
                "code": course_name[:4].upper(),
                "course_code": course_name[:4].upper(),  # old column
            }).execute()
            # Fetch back
            fetch_res = (
                supabase.table("courses")
                .select("id")
                .eq("user_id", sync_request.userId)
                .ilike("course_name", course_name)
                .limit(1)
                .execute()
            )
            if not fetch_res.data:
                continue
            course_id = fetch_res.data[0]["id"]

        # 2. Upsert assignment — update deadline if already exists
        existing = (
            supabase.table("assignments")
            .select("id")
            .eq("user_id", sync_request.userId)
            .eq("title", ext.title)
            .limit(1)
            .execute()
        )

        try:
            if ext.dueDate:
                from dateutil import parser as dtparser
                deadline_dt = dtparser.parse(ext.dueDate).replace(tzinfo=None)
            else:
                deadline_dt = datetime.now()
        except Exception:
            deadline_dt = datetime.now()

        if existing.data:
            # Update the existing assignment with fresh date/url/points
            supabase.table("assignments").update({
                "deadline": deadline_dt.isoformat(),
                "url": ext.url,
                "points": ext.points,
                "source": "canvas",
            }).eq("id", existing.data[0]["id"]).execute()
        else:
            supabase.table("assignments").insert({
                "user_id": sync_request.userId,
                "title": ext.title,
                "course_id": course_id,
                "deadline": deadline_dt.isoformat(),
                "description": ext.description or (f"Imported from Canvas. URL: {ext.url}" if ext.url else None),
                "priority": 3,
                "estimated_hours": 1.0,
                "status": "pending",
                "completed": False,
                "points": ext.points,
                "url": ext.url,
                "source": "canvas",
            }).execute()
            synced_count += 1

    return {"message": f"Successfully synced {synced_count} new assignments", "count": synced_count}
