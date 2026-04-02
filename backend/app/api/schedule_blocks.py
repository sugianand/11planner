from datetime import datetime, time, timedelta, timezone
import os
from typing import List
from uuid import uuid4

from fastapi import APIRouter, HTTPException
from fastapi.responses import PlainTextResponse
from supabase import Client, create_client

from app.models import ScheduleBlock, ScheduleBlockBase, ScheduleBlockCreate, ScheduleBlockUpdate


router = APIRouter(prefix="/api/schedule-blocks", tags=["schedule"])

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
                "Supabase credentials are missing"
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


def round_to_five(dt: datetime) -> datetime:
    """Round up to nearest 5-minute increment for user-moved blocks."""
    dt = dt.replace(second=0, microsecond=0)
    remainder = dt.minute % 5
    if remainder == 0:
        return dt
    return dt + timedelta(minutes=(5 - remainder))


def to_storage_iso(dt: datetime) -> str:
    if dt.tzinfo is None:
        local_tz = datetime.now().astimezone().tzinfo
        dt = dt.replace(tzinfo=local_tz)
    return dt.astimezone(timezone.utc).isoformat()


def overlaps(a_start: datetime, a_end: datetime, b_start: datetime, b_end: datetime) -> bool:
    return a_start < b_end and b_start < a_end


def parse_clock(value: object) -> time | None:
    if not value or not isinstance(value, str):
        return None
    text = value.strip()
    for fmt in ("%H:%M", "%I:%M%p", "%I:%M %p"):
        try:
            return datetime.strptime(text, fmt).time()
        except ValueError:
            continue
    return None


def parse_course_days(value: object) -> set[int]:
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
    days: set[int] = set()
    if isinstance(value, list):
        tokens = [str(item) for item in value]
    elif isinstance(value, str):
        tokens = value.replace(",", " ").replace("/", " ").split()
    else:
        tokens = []

    joined = " ".join(tokens).strip().lower()
    if joined == "mwf":
        return {0, 2, 4}
    if joined == "tth":
        return {1, 3}

    for token in tokens:
        normalized = token.strip().lower()
        day_num = mapping.get(normalized)
        if day_num is not None:
            days.add(day_num)
    return days


def course_time_conflicts(course_row: dict, block_start: datetime, block_end: datetime) -> bool:
    weekday = block_start.weekday()

    meeting_days = parse_course_days(course_row.get("course_days"))
    start_time = parse_clock(course_row.get("start_time"))
    end_time = parse_clock(course_row.get("end_time"))
    if meeting_days and start_time and end_time and weekday in meeting_days:
        course_start = block_start.replace(hour=start_time.hour, minute=start_time.minute, second=0, microsecond=0)
        course_end = block_start.replace(hour=end_time.hour, minute=end_time.minute, second=0, microsecond=0)
        if course_end <= course_start:
            course_end += timedelta(days=1)
        if overlaps(block_start, block_end, course_start, course_end):
            return True

    if course_row.get("has_lab"):
        lab_days = parse_course_days(course_row.get("lab_day"))
        lab_start_time = parse_clock(course_row.get("lab_start_time"))
        lab_end_time = parse_clock(course_row.get("lab_end_time"))
        if lab_days and lab_start_time and lab_end_time and weekday in lab_days:
            lab_start = block_start.replace(hour=lab_start_time.hour, minute=lab_start_time.minute, second=0, microsecond=0)
            lab_end = block_start.replace(hour=lab_end_time.hour, minute=lab_end_time.minute, second=0, microsecond=0)
            if lab_end <= lab_start:
                lab_end += timedelta(days=1)
            if overlaps(block_start, block_end, lab_start, lab_end):
                return True

    return False


def ensure_block_is_available(
    supabase: Client,
    user_id: str,
    block_start: datetime,
    block_end: datetime,
    ignore_block_id: str | None = None,
) -> None:
    if block_end <= block_start:
        raise HTTPException(status_code=400, detail="End time must be after start time")

    course_rows = (
        supabase.table("courses")
        .select("course_days, start_time, end_time, has_lab, lab_day, lab_start_time, lab_end_time")
        .eq("user_id", user_id)
        .execute()
        .data
        or []
    )
    for course_row in course_rows:
        if course_time_conflicts(course_row, block_start, block_end):
            raise HTTPException(status_code=400, detail="Study block conflicts with a class time")

    existing_blocks = (
        supabase.table("schedule_blocks")
        .select("id, starts_at, ends_at, source_task_id")
        .eq("user_id", user_id)
        .execute()
        .data
        or []
    )
    for row in existing_blocks:
        if ignore_block_id and row.get("id") == ignore_block_id:
            continue
        if row.get("source_task_id") is None:
            other_start = parse_dt(row["starts_at"])
            other_end = parse_dt(row["ends_at"])
            if overlaps(block_start, block_end, other_start, other_end):
                raise HTTPException(status_code=400, detail="Study block conflicts with another scheduled block")


def map_row_to_block(row: dict) -> dict:
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


@router.post("", response_model=ScheduleBlock)
async def create_schedule_block(block: ScheduleBlockCreate):
    supabase = get_supabase()
    start_time = round_to_five(block.start_time)
    end_time = round_to_five(block.end_time)
    ensure_block_is_available(supabase, block.user_id, start_time, end_time)
    block_id = str(uuid4())
    payload = {
        "id": block_id,
        "user_id": block.user_id,
        "starts_at": to_storage_iso(start_time),
        "ends_at": to_storage_iso(end_time),
        "block_type": "study",
        "title": "Study Session",
        "source_task_id": block.task_id,
    }
    supabase.table("schedule_blocks").insert(payload).execute()
    rows = (
        supabase.table("schedule_blocks")
        .select("*")
        .eq("id", block_id)
        .limit(1)
        .execute()
        .data
        or []
    )
    if not rows:
        raise HTTPException(status_code=500, detail="Failed to create schedule block")
    return map_row_to_block(rows[0])


@router.get("/{user_id}", response_model=List[ScheduleBlock])
async def get_schedule_blocks_by_user(user_id: str):
    supabase = get_supabase()
    result = (
        supabase.table("schedule_blocks")
        .select("*")
        .eq("user_id", user_id)
        .order("starts_at")
        .execute()
    )
    rows = result.data or []
    return [map_row_to_block(row) for row in rows]

@router.get("/{user_id}/calendar.ics")
async def get_schedule_calendar_ics(user_id: str):
    import datetime as dt
    supabase = get_supabase()
    result = (
        supabase.table("schedule_blocks")
        .select("*")
        .eq("user_id", user_id)
        .order("starts_at")
        .execute()
    )
    rows = result.data or []

    lines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//11Planner//EN",
        "CALSCALE:GREGORIAN",
        "X-WR-CALNAME:11Planner Schedule"
    ]
    
    now_str = dt.datetime.now(dt.timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    
    for row in rows:
        block = map_row_to_block(row)
        uid = block["id"]
        
        # Format start and end times to UTC string
        st = block["start_time"]
        et = block["end_time"]
        start_str = st.astimezone(dt.timezone.utc).strftime("%Y%m%dT%H%M%SZ") if st.tzinfo else st.strftime("%Y%m%dT%H%M%SZ")
        end_str = et.astimezone(dt.timezone.utc).strftime("%Y%m%dT%H%M%SZ") if et.tzinfo else et.strftime("%Y%m%dT%H%M%SZ")
        
        # Use task_id for title or fallback
        title = "Study Session"
        # Optional: You could join with tasks table to get exact name here. 
        
        lines.extend([
            "BEGIN:VEVENT",
            f"UID:{uid}@11planner",
            f"DTSTAMP:{now_str}",
            f"DTSTART:{start_str}",
            f"DTEND:{end_str}",
            f"SUMMARY:{title}",
            "END:VEVENT"
        ])
        
    lines.append("END:VCALENDAR")
    return PlainTextResponse(content="\r\n".join(lines), media_type="text/calendar")


@router.put("/{block_id}", response_model=ScheduleBlock)
async def update_schedule_block(block_id: str, block_update: ScheduleBlockUpdate):
    supabase = get_supabase()
    existing_rows = (
        supabase.table("schedule_blocks")
        .select("id, user_id, starts_at, ends_at")
        .eq("id", block_id)
        .limit(1)
        .execute()
        .data
        or []
    )
    if not existing_rows:
        raise HTTPException(status_code=404, detail="Schedule block not found")

    existing_row = existing_rows[0]
    update_data = block_update.model_dump(exclude_unset=True)
    payload = {}
    if "start_time" in update_data:
        payload["starts_at"] = to_storage_iso(round_to_five(update_data["start_time"]))
    if "end_time" in update_data:
        payload["ends_at"] = to_storage_iso(round_to_five(update_data["end_time"]))
    if "task_id" in update_data:
        payload["source_task_id"] = update_data["task_id"]

    updated_start = parse_dt(payload.get("starts_at") or existing_row["starts_at"])
    updated_end = parse_dt(payload.get("ends_at") or existing_row["ends_at"])
    ensure_block_is_available(supabase, existing_row["user_id"], updated_start, updated_end, ignore_block_id=block_id)

    supabase.table("schedule_blocks").update(payload).eq("id", block_id).execute()
    rows = (
        supabase.table("schedule_blocks")
        .select("*")
        .eq("id", block_id)
        .limit(1)
        .execute()
        .data
        or []
    )
    return map_row_to_block(rows[0])


@router.delete("/{block_id}")
async def delete_schedule_block(block_id: str):
    supabase = get_supabase()
    existing = supabase.table("schedule_blocks").select("id").eq("id", block_id).limit(1).execute()
    if not (existing.data or []):
        raise HTTPException(status_code=404, detail="Schedule block not found")
    supabase.table("schedule_blocks").delete().eq("id", block_id).execute()
    return {"message": "Schedule block deleted successfully"}
