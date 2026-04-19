from fastapi import APIRouter, HTTPException
from typing import List, Optional
from app.models import Assignment, AssignmentCreate, AssignmentUpdate
from datetime import datetime
from datetime import timezone
from zoneinfo import ZoneInfo
from uuid import uuid4
import os

from supabase import Client, create_client

router = APIRouter(prefix="/api/assignments", tags=["assignments"])

_supabase_client: Client | None = None


# Lazily initializes and returns a shared Supabase client.
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


# Parses incoming datetimes and normalizes them to local naive datetime objects.
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


# Maps raw assignment rows from storage into API response shape.
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

# Returns all assignments for a user ordered by deadline.
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


# Returns one assignment by its unique identifier.
@router.get("/detail/{assignment_id}", response_model=Assignment)
async def get_assignment_by_id(assignment_id: str):
    supabase = get_supabase()
    result = supabase.table("assignments").select("*").eq("id", assignment_id).limit(1).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Assignment not found")
    return map_row(result.data[0])


# Creates a new assignment and returns the inserted record.
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


# Updates mutable assignment fields and returns the latest record.
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


# Deletes an assignment by id.
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
    estimatedHours: Optional[float] = None
    priorityLevel: Optional[object] = None

class ExtensionCourse(PydanticBase):
    name: str
    code: Optional[str] = None
    contextCode: Optional[str] = None

class SyncRequest(PydanticBase):
    userId: str
    assignments: List[ExtensionAssignment]
    courses: Optional[List[ExtensionCourse]] = None
    clientTimeZone: Optional[str] = None
    client_timezone: Optional[str] = None


# Syncs Canvas extension payload into courses/tasks while avoiding duplicates.
@router.post("/sync")
async def sync_assignments(sync_request: SyncRequest):
    """
    Called by the Canvas Chrome extension.
    Finds-or-creates courses and tasks from Canvas data.
    Idempotent: won't create duplicates (checks task_title + user_id).
    """
    supabase = get_supabase()
    synced_count = 0
    synced_courses = 0
    local_server_tz = datetime.now().astimezone().tzinfo

    def normalize_estimated_hours(value: object) -> float:
        try:
            hours = float(value)
        except Exception:
            hours = 1.0
        hours = max(0.5, min(16.0, hours))
        return round(hours * 2) / 2

    def normalize_priority_level(value: object) -> int:
        if value is None:
            return 3

        if isinstance(value, str):
            lookup = {
                "low": 1,
                "medium": 3,
                "med": 3,
                "high": 4,
                "urgent": 5,
                "critical": 5,
            }
            mapped = lookup.get(value.strip().lower())
            if mapped is not None:
                return mapped

        try:
            lvl = int(float(value))
        except Exception:
            return 3

        return max(1, min(5, lvl))

    def to_deadline_iso(value: Optional[str]) -> str:
        if not value:
            return datetime.now(timezone.utc).isoformat()

        from dateutil import parser as dtparser

        parsed_deadline = dtparser.parse(value)

        # IMPORTANT:
        # Treat the incoming value as the user's local wall-clock time from Canvas,
        # even if a timezone suffix is present. Canvas sources can mix offsets and
        # produce 1-hour drift around DST boundaries. We preserve clock time first.
        parsed_naive = parsed_deadline.replace(tzinfo=None)

        tz_name = sync_request.clientTimeZone or sync_request.client_timezone
        if tz_name:
            try:
                localized = parsed_naive.replace(tzinfo=ZoneInfo(tz_name))
                return localized.astimezone(timezone.utc).isoformat()
            except Exception:
                pass

        if local_server_tz is not None:
            localized = parsed_naive.replace(tzinfo=local_server_tz)
            return localized.astimezone(timezone.utc).isoformat()

        return parsed_naive.isoformat()

    def resolve_or_create_course(course_name: str) -> Optional[str]:
        clean_name = (course_name or "General").strip()
        if not clean_name:
            clean_name = "General"

        course_res = (
            supabase.table("courses")
            .select("id")
            .eq("user_id", sync_request.userId)
            .ilike("name", clean_name)
            .limit(1)
            .execute()
        )
        if not course_res.data:
            course_res = (
                supabase.table("courses")
                .select("id")
                .eq("user_id", sync_request.userId)
                .ilike("course_name", clean_name)
                .limit(1)
                .execute()
            )

        if course_res.data:
            return course_res.data[0]["id"]

        supabase.table("courses").insert({
            "user_id": sync_request.userId,
            "name": clean_name,
            "course_name": clean_name,
            "code": clean_name[:4].upper(),
            "course_code": clean_name[:4].upper(),
        }).execute()

        fetch_res = (
            supabase.table("courses")
            .select("id")
            .eq("user_id", sync_request.userId)
            .ilike("course_name", clean_name)
            .limit(1)
            .execute()
        )
        if not fetch_res.data:
            return None
        return fetch_res.data[0]["id"]

    # 0. Sync extracted courses first (if provided)
    for ext_course in (sync_request.courses or []):
        course_id = resolve_or_create_course(ext_course.name)
        if course_id:
            synced_courses += 1

    for ext in sync_request.assignments:
        # 1. Resolve or create course for each assignment
        course_id = resolve_or_create_course(ext.course or "General")
        if not course_id:
            continue

        # upsert: update if exists, insert if new
        existing = (
            supabase.table("tasks")
            .select("id")
            .eq("user_id", sync_request.userId)
            .eq("task_title", ext.title)
            .limit(1)
            .execute()
        )

        try:
            deadline_iso = to_deadline_iso(ext.dueDate)
        except Exception:
            # Invalid/missing due date: skip because we only want future deadlines.
            continue

        try:
            from dateutil import parser as dtparser
            deadline_dt = dtparser.isoparse(deadline_iso)
            if deadline_dt.tzinfo is None:
                deadline_dt = deadline_dt.replace(tzinfo=timezone.utc)
            else:
                deadline_dt = deadline_dt.astimezone(timezone.utc)
        except Exception:
            # If we can't parse normalized deadline, skip it.
            continue

        # skip past-due assignments
        if deadline_dt <= datetime.now(timezone.utc):
            continue

        if existing.data:
            # Update the existing task with fresh date/details
            estimated_hours = normalize_estimated_hours(ext.estimatedHours)
            priority_level = normalize_priority_level(ext.priorityLevel)
            supabase.table("tasks").update({
                "deadline_at": deadline_iso,
                "description": ext.description or (f"Imported from Canvas. URL: {ext.url}" if ext.url else None),
                "priority_level": priority_level,
                "estimated_hours": estimated_hours,
                "status": "pending",
                "source": "canvas",
            }).eq("id", existing.data[0]["id"]).execute()
        else:
            estimated_hours = normalize_estimated_hours(ext.estimatedHours)
            priority_level = normalize_priority_level(ext.priorityLevel)
            supabase.table("tasks").insert({
                "user_id": sync_request.userId,
                "task_title": ext.title,
                "course_id": course_id,
                "deadline_at": deadline_iso,
                "description": ext.description or (f"Imported from Canvas. URL: {ext.url}" if ext.url else None),
                "priority_level": priority_level,
                "estimated_hours": estimated_hours,
                "status": "pending",
                "source": "canvas",
            }).execute()
            synced_count += 1

    return {
        "message": f"Successfully synced {synced_count} new tasks and {synced_courses} courses",
        "count": synced_count,
        "courses": synced_courses,
    }
