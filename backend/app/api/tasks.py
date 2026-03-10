import json

from fastapi import APIRouter, HTTPException
from app.models import (
    CourseBase, CourseCreate, Course, 
    AssignmentBase, AssignmentCreate, Assignment,
    TaskBase, TaskCreate, Task
)
from app.schedule_generator import BusyBlock, Preferences, ScheduleGenerator
from typing import List
from datetime import date, datetime, time, timedelta
import os
from uuid import uuid4
try:
    from openai import OpenAI
except Exception:
    OpenAI = None

from supabase import Client, create_client

router = APIRouter(prefix="/api", tags=["tasks"])

courses_db = {}
assignments_db = {}
tasks_db = {}

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
    dt = value if isinstance(value, datetime) else datetime.fromisoformat(value.replace("Z", "+00:00"))
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

    for row in course_rows:
        weekday_numbers = {
            day_num
            for day_num in (parse_course_weekday(day) for day in (row.get("course_days") or []))
            if day_num is not None
        }
        start_t = parse_clock(row.get("start_time"))
        end_t = parse_clock(row.get("end_time"))
        if not weekday_numbers or start_t is None or end_t is None:
            continue

        cursor = start_day
        while cursor <= end_day:
            if cursor.weekday() in weekday_numbers:
                start_dt = datetime.combine(cursor, start_t)
                end_dt = datetime.combine(cursor, end_t)
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

# ========== COURSE ENDPOINTS ==========

@router.post("/courses", response_model=Course)
async def create_course(course: CourseCreate):
    """Create a new course"""
    course_id = f"course_{len(courses_db) + 1}"
    course_data = {
        "id": course_id,
        **course.dict(),
        "created_at": datetime.now()
    }
    courses_db[course_id] = course_data
    return course_data

@router.get("/courses/{user_id}", response_model=List[Course])
async def get_user_courses(user_id: str):
    """Get all courses for a user"""
    user_courses = [c for c in courses_db.values() if c["user_id"] == user_id]
    return user_courses

@router.get("/courses/detail/{course_id}", response_model=Course)
async def get_course(course_id: str):
    """Get a specific course"""
    if course_id not in courses_db:
        raise HTTPException(status_code=404, detail="Course not found")
    return courses_db[course_id]

@router.put("/courses/{course_id}", response_model=Course)
async def update_course(course_id: str, course: CourseBase):
    """Update a course"""
    if course_id not in courses_db:
        raise HTTPException(status_code=404, detail="Course not found")
    courses_db[course_id].update(course.dict())
    return courses_db[course_id]

@router.delete("/courses/{course_id}")
async def delete_course(course_id: str):
    """Delete a course"""
    if course_id not in courses_db:
        raise HTTPException(status_code=404, detail="Course not found")
    del courses_db[course_id]
    return {"message": "Course deleted"}



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




# ========== ASSIGNMENT ENDPOINTS ==========

@router.post("/assignments", response_model=Assignment)
async def create_assignment(assignment: AssignmentCreate):
    """Create a new assignment"""
    assignment_id = f"assignment_{len(assignments_db) + 1}"
    assignment_data = {
        "id": assignment_id,
        **assignment.dict(),
        "completed": False,
        "created_at": datetime.now()
    }
    assignments_db[assignment_id] = assignment_data
    return assignment_data

@router.get("/assignments/{user_id}", response_model=List[Assignment])
async def get_user_assignments(user_id: str):
    """Get all assignments for a user"""
    user_assignments = [a for a in assignments_db.values() if a["user_id"] == user_id]
    return user_assignments

@router.get("/assignments/detail/{assignment_id}", response_model=Assignment)
async def get_assignment(assignment_id: str):
    """Get a specific assignment"""
    if assignment_id not in assignments_db:
        raise HTTPException(status_code=404, detail="Assignment not found")
    return assignments_db[assignment_id]

@router.put("/assignments/{assignment_id}", response_model=Assignment)
async def update_assignment(assignment_id: str, assignment: AssignmentBase):
    """Update an assignment"""
    if assignment_id not in assignments_db:
        raise HTTPException(status_code=404, detail="Assignment not found")
    assignments_db[assignment_id].update(assignment.dict())
    return assignments_db[assignment_id]

@router.delete("/assignments/{assignment_id}")
async def delete_assignment(assignment_id: str):
    """Delete an assignment"""
    if assignment_id not in assignments_db:
        raise HTTPException(status_code=404, detail="Assignment not found")
    del assignments_db[assignment_id]
    return {"message": "Assignment deleted"}

# ========== TASK ENDPOINTS ==========

@router.post("/tasks", response_model=Task)
async def create_task(task: TaskCreate):
    """Create a new task"""
    task_id = f"task_{len(tasks_db) + 1}"
    task_data = {
        "id": task_id,
        **task.dict(),
        "completed": False,
        "created_at": datetime.now()
    }
    tasks_db[task_id] = task_data
    return task_data

@router.get("/tasks/{user_id}", response_model=List[Task])
async def get_user_tasks(user_id: str):
    """Get all tasks for a user"""
    user_tasks = [t for t in tasks_db.values() if t["user_id"] == user_id]
    return user_tasks

@router.get("/tasks/detail/{task_id}", response_model=Task)
async def get_task(task_id: str):
    """Get a specific task"""
    if task_id not in tasks_db:
        raise HTTPException(status_code=404, detail="Task not found")
    return tasks_db[task_id]

@router.put("/tasks/{task_id}", response_model=Task)
async def update_task(task_id: str, task: TaskBase):
    """Update a task"""
    if task_id not in tasks_db:
        raise HTTPException(status_code=404, detail="Task not found")
    tasks_db[task_id].update(task.dict())
    return tasks_db[task_id]

@router.delete("/tasks/{task_id}")
async def delete_task(task_id: str):
    """Delete a task"""
    if task_id not in tasks_db:
        raise HTTPException(status_code=404, detail="Task not found")
    del tasks_db[task_id]
    return {"message": "Task deleted"}

# ========== SCHEDULE GENERATION ENDPOINTS ==========

@router.post("/schedule/generate/{user_id}")
async def generate_schedule(user_id: str):
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
    supabase = get_supabase()

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

    profile_result = (
        supabase.table("profiles")
        .select("worktime, workdays, workstyle, additional_info, assignmentplan")
        .eq("id", user_id)
        .limit(1)
        .execute()
    )
    profile_row = (profile_result.data or [{}])[0]
    work_start, work_end = work_window_from_profile(profile_row.get("worktime"))
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
        study_limit_hours=4,
        workstyle=profile_row.get("workstyle"),
        additional_info=profile_row.get("additional_info"),
        assignment_plan=profile_row.get("assignmentplan"),
    )

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

    courses_result = (
        supabase.table("courses")
        .select("course_name, course_days, start_time, end_time")
        .eq("user_id", user_id)
        .execute()
    )
    now = datetime.now()
    max_deadline = max((task.deadline for task in task_objects), default=now)
    planning_end = max(max_deadline, now + timedelta(days=14))
    busy.extend(build_course_busy_blocks(courses_result.data or [], now, planning_end))

    generator = ScheduleGenerator(
        max_hours_per_day=float(prefs.study_limit_hours),
        focus_block_hours=focus_hours_from_workstyle(profile_row.get("workstyle")),
    )
    generated = generator.generate_schedule(task_objects, prefs, busy=busy, ai_plan=ai__optimizer)
    validation = generator.validate_schedule(generated)


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

    generation_id = str(uuid4())
    insert_payload = [
        {
            "user_id": user_id,
            "starts_at": block.start_time.isoformat(),
            "ends_at": block.end_time.isoformat(),
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
