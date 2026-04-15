import json

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.models import (
    CourseBase, CourseCreate, Course, 
    AssignmentBase, AssignmentCreate, Assignment,
    TaskBase, TaskCreate, Task
)
from app.schedule_generator import BusyBlock, Preferences, ScheduleGenerator
from app.ai_task_estimator import estimate_task_hours
from typing import List
from datetime import date, datetime, time, timedelta, timezone
import os
from uuid import uuid4
try:
    from openai import OpenAI
except Exception:
    OpenAI = None

from supabase import Client, create_client

router = APIRouter(prefix="/api", tags=["tasks"])


class TaskEstimateRequest(BaseModel):
    user_id: str


class ScheduleGenerateRequest(BaseModel):
    study_limit_hours: float | None = None

# Supabase client is used for all data operations
_supabase_client: Client | None = None


def get_supabase() -> Client:
    global _supabase_client
    if _supabase_client is not None:
        return _supabase_client

    url = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
    key = (
        os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        or os.getenv("SUPABASE_KEY")
        or os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
    )

    if not url or not key:
        raise HTTPException(
            status_code=500,
            detail=(
                "Supabase credentials are missing. Set SUPABASE_URL and "
                "SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_KEY)."
            ),
        )

    _supabase_client = create_client(url, key)
    return _supabase_client


def parse_dt(value: str | datetime) -> datetime:
    if isinstance(value, datetime):
        dt = value
    else:
        # Normalize the ISO string - handle various formats
        iso_str = value.replace("Z", "+00:00")
        
        try:
            # Try Python 3.11+ fromisoformat
            dt = datetime.fromisoformat(iso_str)
        except ValueError:
            try:
                # Try removing timezone info and parsing without it
                if "+" in iso_str or iso_str.endswith("00:00"):
                    # Split at timezone marker
                    base = iso_str.split("+")[0].split("-")[:-1]  # Remove timezone
                    iso_str_no_tz = iso_str[:iso_str.rfind("+") if "+" in iso_str else len(iso_str)]
                    dt = datetime.fromisoformat(iso_str_no_tz)
                else:
                    raise ValueError(f"Could not parse ISO format: {value}")
            except (ValueError, IndexError):
                # Last resort: use datetime.strptime with a flexible format
                try:
                    dt = datetime.strptime(iso_str.split("+")[0].split("Z")[0], "%Y-%m-%dT%H:%M:%S.%f")
                except ValueError:
                    dt = datetime.strptime(iso_str.split("+")[0].split("Z")[0], "%Y-%m-%dT%H:%M:%S")
    
    if dt.tzinfo is not None:
        return dt.astimezone().replace(tzinfo=None)
    return dt


def work_window_from_profile(worktime_value: str | None) -> tuple[time, time]:
    """
    Returns work window as tuple of (start_time, end_time).
    
    TODO: These times are currently interpreted as local time but may need
    timezone handling to ensure consistency between backend schedule generation
    and frontend display. Consider adding a timezone field to user profiles
    to properly handle conversions.
    """
    value = (worktime_value or "").strip().lower()
    if value == "morning":
        return time(6, 0), time(12, 0)
    if value == "afternoon":
        return time(12, 0), time(18, 0)
    if value == "evening":
        return time(18, 0), time(23, 0)
    return time(9, 0), time(17, 0)


def focus_hours_from_workstyle(workstyle: str | None) -> float:
    value = (workstyle or "").strip().lower()
    if value == "short":
        return 0.33
    if value == "classic":
        return 0.5
    if value == "deep-work":
        return 1.0
    if value == "full-immersion":
        return 2.0
    return 2.0


def parse_study_limit(value: object, fallback: float = 4.0) -> float:
    try:
        numeric = float(value)
    except (TypeError, ValueError):
        return fallback
    return max(1.0, min(12.0, numeric))


def to_storage_iso(dt: datetime) -> str:
    if dt.tzinfo is None:
        local_tz = datetime.now().astimezone().tzinfo
        dt = dt.replace(tzinfo=local_tz)
    return dt.astimezone(timezone.utc).isoformat()


def map_schedule_block_row(row: dict) -> dict:
    starts_at = parse_dt(row["starts_at"])
    ends_at = parse_dt(row["ends_at"])
    minutes = int((ends_at - starts_at).total_seconds() // 60)
    return {
        "id": row["id"],
        "task_id": row.get("source_task_id"),
        "date": starts_at,
        "start_time": starts_at,
        "end_time": ends_at,
        "duration_minutes": max(minutes, 0),
        "user_id": row["user_id"],
        "created_at": parse_dt(row["created_at"]) if row.get("created_at") else datetime.now(),
        "completed": False,
    }


def parse_course_weekday(day: str) -> int | None:
    normalized = (day or "").strip().lower()
    mapping = {
        "monday": 0,
        "mon": 0,
        "tuesday": 1,
        "tue": 1,
        "tues": 1,
        "wednesday": 2,
        "wed": 2,
        "thursday": 3,
        "thu": 3,
        "thurs": 3,
        "friday": 4,
        "fri": 4,
        "saturday": 5,
        "sat": 5,
        "sunday": 6,
        "sun": 6,
    }
    return mapping.get(normalized)


def parse_course_weekdays(days_value: object) -> set[int]:
    if isinstance(days_value, list):
        raw_tokens = [str(item) for item in days_value]
    elif isinstance(days_value, str):
        raw_tokens = [days_value]
    else:
        raw_tokens = []

    expanded_tokens: list[str] = []
    for token in raw_tokens:
        normalized = token.strip().lower()
        if not normalized:
            continue
        if normalized in {"mwf", "m/w/f"}:
            expanded_tokens.extend(["mon", "wed", "fri"])
            continue
        if normalized in {"tth", "tu/th", "t/th", "tr"}:
            expanded_tokens.extend(["tue", "thu"])
            continue
        split_tokens = normalized.replace(",", " ").replace("/", " ").split()
        if split_tokens:
            expanded_tokens.extend(split_tokens)
        else:
            expanded_tokens.append(normalized)

    return {
        weekday
        for weekday in (parse_course_weekday(token) for token in expanded_tokens)
        if weekday is not None
    }


def parse_clock(value: str | None) -> time | None:
    if not value:
        return None
    text = value.strip()
    try:
        return time.fromisoformat(text)
    except ValueError:
        pass
    for fmt in ("%H:%M", "%I:%M%p", "%I:%M %p"):
        try:
            return datetime.strptime(text, fmt).time()
        except ValueError:
            continue
    return None


def build_course_busy_blocks(course_rows: list[dict], window_start: datetime, window_end: datetime) -> list[BusyBlock]:
    busy_blocks: list[BusyBlock] = []
    start_day: date = window_start.date()
    end_day: date = window_end.date()
    
    # Add 15-minute buffer before and after classes for transition time
    buffer = timedelta(minutes=15)

    for row in course_rows:
        weekday_numbers = parse_course_weekdays(row.get("course_days"))
        start_t = parse_clock(row.get("start_time"))
        end_t = parse_clock(row.get("end_time"))
        if not weekday_numbers or start_t is None or end_t is None:
            continue

        cursor = start_day
        while cursor <= end_day:
            if cursor.weekday() in weekday_numbers:
                start_dt = datetime.combine(cursor, start_t) - buffer
                end_dt = datetime.combine(cursor, end_t) + buffer
                if end_dt <= start_dt:
                    end_dt += timedelta(days=1)
                if end_dt > window_start and start_dt < window_end:
                    busy_blocks.append(
                        BusyBlock(
                            start=start_dt,
                            end=end_dt,
                            title=row.get("course_name") or "Class",
                        )
                    )
            cursor += timedelta(days=1)

    return busy_blocks


# AI schedule optimizer
openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY")) if (OpenAI and os.getenv("OPENAI_API_KEY")) else None


def ai__optimizer(context: dict) -> dict:
    if openai_client is None:
        return {"task_order": [], "block_minutes_override": {}, "preferred_days": {}}

    try:
        prompt = (
            "You are an academic schedule optimization assistant. Your task is to generate an "
            "optimal study schedule for a student based on their pending tasks, preferences, and existing commitments.\n"
            "Return only valid JSON.\n"
            "Goal:\n"
            "- choose the best order to schedule tasks\n"
            "- choose how each task should be split into study blocks\n"
            "- choose preferred days for each task\n\n"
            "Important rules:\n"
            "- Use task deadline, estimated_hours, priority, and description\n"
            "- Respect the user's preferred workdays, work window, and daily study limit\n"
            "- Use the user's assignment plan preference when deciding block sizes and spacing\n"
            "- Spread large tasks across multiple days when that makes sense\n"
            "- Prefer earlier scheduling for urgent/high priority tasks\n"
            "- Keep block lengths realistic, such as 30, 45, 60, 90, or 120 minutes\n"
            "- Do not invent task ids\n\n"
            "Return ONLY valid JSON with keys: task_order, block_minutes_override, preferred_days.\n"
            "For block minutes, only use: 30, 45, 60, 90, 120.\n\n"
            f"TASKS:\n{json.dumps(context.get('tasks', []), indent=2)}\n"
            f"PREFERENCES:\n{json.dumps(context.get('prefs', {}), indent=2)}\n"
            f"BUSY TIMES:\n{json.dumps(context.get('busy', []), indent=2)}\n"
        )

        response = openai_client.chat.completions.create(
            model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
            temperature=0.2,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": "Output strict JSON only."},
                {"role": "user", "content": prompt},
            ],
        )
        parsed = json.loads(response.choices[0].message.content or "{}")

        cleaned_blocks = {}
        for task_id, mins in parsed.get("block_minutes_override", {}).items():
            cleaned = []
            for m in mins if isinstance(mins, list) else []:
                try:
                    value = int(m)
                except Exception:
                    continue
                if value in (30, 45, 60, 90, 120):
                    cleaned.append(value)
            if cleaned:
                cleaned_blocks[str(task_id)] = cleaned

        cleaned_days = {}
        valid_days = {"monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"}
        for task_id, days in parsed.get("preferred_days", {}).items():
            if not isinstance(days, list):
                continue
            cleaned_days[str(task_id)] = [
                d.strip().capitalize() for d in days
                if isinstance(d, str) and d.strip().lower() in valid_days
            ]
        cleaned_order = [str(task_id) for task_id in parsed.get("task_order", []) if task_id is not None]

        return {
            "task_order": cleaned_order,
            "block_minutes_override": cleaned_blocks,
            "preferred_days": cleaned_days,
        }
    except Exception as e:
        print(f"Error occurred while calling OpenAI API: {e}")
        return {
            "task_order": [],
            "block_minutes_override": {},
            "preferred_days": {},
        }






# ========== TASK ENDPOINTS ==========
# Tasks are handled via the schedule generation endpoints below
@router.post("/tasks/{task_id}/estimate-time")
async def estimate_task_time(task_id: str, request: TaskEstimateRequest):
    try:
        supabase = get_supabase()
        task_result = (
            supabase.table("tasks")
            .select("id, user_id, task_title, deadline_at, estimated_hours, priority_level, description")
            .eq("id", task_id)
            .eq("user_id", request.user_id)
            .limit(1)
            .execute()
        )
        rows = task_result.data or []
        if not rows:
            raise HTTPException(status_code=404, detail="Task not found")

        row = rows[0]
        estimated_hours = estimate_task_hours(
            {
                "title": row.get("task_title") or "Untitled task",
                "description": row.get("description") or "",
                "deadline": row.get("deadline_at"),
                "priority": int(row.get("priority_level") or 2),
                "estimated_hours": float(row.get("estimated_hours") or 0),
            }
        )

        update_result = (
            supabase.table("tasks")
            .update({"estimated_hours": estimated_hours})
            .eq("id", task_id)
            .eq("user_id", request.user_id)
            .execute()
        )
        if getattr(update_result, "error", None):
            raise HTTPException(status_code=500, detail="Failed to save estimated time")

        return {
            "task id": task_id,
            "estimated_hours": estimated_hours,
            "message": "AI estimated time updated"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to estimate task time: {str(e)}")

# ========== SCHEDULE GENERATION ENDPOINTS ==========

@router.post("/schedule/generate/{user_id}")
async def generate_schedule(user_id: str, payload: ScheduleGenerateRequest | None = None):
    """
    Generate optimal schedule for all pending tasks.
    Uses smart algorithm that considers:
    - Task deadline (urgency)
    - Estimated duration
    - Priority level
    - Daily work limit (8 hours)
    - Break times (15 min between blocks)
    - Focus blocks (2-4 hours max)
    """
    try:
        supabase = get_supabase()

        # Fetch pending tasks
        tasks_result = (
            supabase.table("tasks")
            .select("*")
            .eq("user_id", user_id)
            .neq("status", "completed")
            .execute()
        )
        task_rows = tasks_result.data or []
        if not task_rows:
            return {"message": "No pending tasks to schedule", "blocks": [], "stats": {"valid": True}}

        # Fetch user preferences/profile (including daily study limit)
        profile_result = (
            supabase.table("profiles")
            .select("worktime, workdays, workstyle, additional_info, assignmentplan, daily_study_limit")
            .eq("id", user_id)
            .limit(1)
            .execute()
        )
        profile_row = (profile_result.data or [{}])[0]
        work_start, work_end = work_window_from_profile(profile_row.get("worktime"))
        profile_study_limit = parse_study_limit(profile_row.get("daily_study_limit"), 4.0)
        requested_study_limit = payload.study_limit_hours if payload else None
        study_limit_hours = parse_study_limit(requested_study_limit, profile_study_limit)

        prefs = Preferences(
            workdays=profile_row.get("workdays") or [
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday",
            ],
            work_start=work_start,
            work_end=work_end,
            study_limit_hours=study_limit_hours,
            workstyle=profile_row.get("workstyle"),
            additional_info=profile_row.get("additional_info"),
            assignment_plan=profile_row.get("assignmentplan"),
        )

        # Convert task rows to Task objects
        task_objects = [
            Task(
                id=row["id"],
                title=row.get("task_title") or "Untitled Task",
                assignment_id=row.get("assignment_id"),
                course_id=row.get("course_id"),
                deadline=parse_dt(row["deadline_at"]),
                estimated_hours=float(row.get("estimated_hours") or 1),
                priority=int(row.get("priority_level") or 2),
                description=row.get("description"),
                user_id=row["user_id"],
                created_at=parse_dt(row["created_at"]) if row.get("created_at") else datetime.now(),
                completed=(row.get("status") == "completed"),
            )
            for row in task_rows
        ]
        task_title_by_id = {task.id: task.title for task in task_objects}

        # Fetch busy blocks (non-task blocks)
        static_busy_result = (
            supabase.table("schedule_blocks")
            .select("id, starts_at, ends_at, title, source_task_id")
            .eq("user_id", user_id)
            .is_("source_task_id", "null")
            .execute()
        )
        busy = [
            BusyBlock(
                start=parse_dt(row["starts_at"]),
                end=parse_dt(row["ends_at"]),
                title=row.get("title") or "Busy",
            )
            for row in (static_busy_result.data or [])
            if row.get("starts_at") and row.get("ends_at")
        ]

        # Fetch courses (including lab fields) and build busy blocks
        courses_result = (
            supabase.table("courses")
            .select("course_name, course_days, start_time, end_time, has_lab, lab_day, lab_start_time, lab_end_time")
            .eq("user_id", user_id)
            .execute()
        )
        now = datetime.now()
        max_deadline = max((task.deadline for task in task_objects), default=now)
        planning_end = max(max_deadline, now + timedelta(days=14))

        # Add class time busy blocks
        busy.extend(build_course_busy_blocks(courses_result.data or [], now, planning_end))

        # Add lab time busy blocks
        for row in (courses_result.data or []):
            if not row.get("has_lab"):
                continue
            lab_day_str = row.get("lab_day")
            lab_start = parse_clock(row.get("lab_start_time"))
            lab_end = parse_clock(row.get("lab_end_time"))
            lab_weekday = parse_course_weekday(lab_day_str) if lab_day_str else None
            if lab_weekday is None or lab_start is None or lab_end is None:
                continue
            cursor = now.date()
            while cursor <= planning_end.date():
                if cursor.weekday() == lab_weekday:
                    lab_start_dt = datetime.combine(cursor, lab_start)
                    lab_end_dt = datetime.combine(cursor, lab_end)
                    if lab_end_dt <= lab_start_dt:
                        lab_end_dt += timedelta(days=1)
                    if lab_end_dt > now and lab_start_dt < planning_end:
                        busy.append(BusyBlock(
                            start=lab_start_dt,
                            end=lab_end_dt,
                            title=f"{row.get('course_name', 'Lab')} - Lab",
                        ))
                cursor += timedelta(days=1)

        # Generate schedule
        generator = ScheduleGenerator(
            max_hours_per_day=float(prefs.study_limit_hours),
            focus_block_hours=focus_hours_from_workstyle(profile_row.get("workstyle")),
        )
        generated = generator.generate_schedule(task_objects, prefs, busy=busy, ai_plan=ai__optimizer)
        validation = generator.validate_schedule(generated)

        # Delete old schedule blocks
        (
            supabase.table("schedule_blocks")
            .delete()
            .eq("user_id", user_id)
            .eq("block_type", "study")
            .execute()
        )

        if not generated:
            return {
                "message": "No schedule blocks generated",
                "blocks": [],
                "stats": validation,
            }

        # Insert new schedule blocks
        generation_id = str(uuid4())
        insert_payload = [
            {
                "user_id": user_id,
                "starts_at": to_storage_iso(block.start_time),
                "ends_at": to_storage_iso(block.end_time),
                "block_type": "study",
                "title": task_title_by_id.get(block.task_id, "Study Session"),
                "course_id": next((t.course_id for t in task_objects if t.id == block.task_id), None),
                "source_task_id": block.task_id,
                "generation_id": generation_id,
            }
            for block in generated
        ]
        insert_result = (
            supabase.table("schedule_blocks")
            .insert(insert_payload)
            .execute()
        )
        inserted_rows = (
            supabase.table("schedule_blocks")
            .select("*")
            .eq("user_id", user_id)
            .eq("generation_id", generation_id)
            .order("starts_at")
            .execute()
            .data
            or []
        )
        response_blocks = [map_schedule_block_row(row) for row in inserted_rows]

        return {
            "message": "Schedule generated successfully",
            "blocks": response_blocks,
            "stats": validation,
        }
    
    except Exception as e:
        import traceback
        error_msg = f"Schedule generation error: {str(e)}"
        traceback.print_exc()
        print(error_msg)
        raise HTTPException(status_code=500, detail=error_msg)

@router.get("/schedule/stats/{user_id}")
async def get_schedule_stats(user_id: str):
    """Get statistics about user's schedule"""
    supabase = get_supabase()
    tasks_result = supabase.table("tasks").select("estimated_hours, status").eq("user_id", user_id).execute()
    blocks_result = (
        supabase.table("schedule_blocks")
        .select("starts_at, ends_at, block_type")
        .eq("user_id", user_id)
        .eq("block_type", "study")
        .execute()
    )

    user_tasks = tasks_result.data or []
    user_blocks = blocks_result.data or []

    total_hours_scheduled = sum(
        max((parse_dt(b["ends_at"]) - parse_dt(b["starts_at"])).total_seconds() / 3600.0, 0)
        for b in user_blocks
        if b.get("starts_at") and b.get("ends_at")
    )
    pending_hours = sum(float(t.get("estimated_hours") or 0) for t in user_tasks if t.get("status") != "completed")
    completed_tasks = len([t for t in user_tasks if t.get("status") == "completed"])

    return {
        "total_tasks": len(user_tasks),
        "completed_tasks": completed_tasks,
        "pending_tasks": len(user_tasks) - completed_tasks,
        "total_hours_needed": round(pending_hours, 2),
        "total_hours_scheduled": round(total_hours_scheduled, 2),
        "schedule_coverage": f"{round((total_hours_scheduled / pending_hours * 100), 1)}%" if pending_hours > 0 else "0%"
    }
