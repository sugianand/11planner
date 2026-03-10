from datetime import datetime, timedelta
import os
from typing import List
from uuid import uuid4

from fastapi import APIRouter, HTTPException
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
        return value
    else:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))


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
    block_id = str(uuid4())
    payload = {
        "id": block_id,
        "user_id": block.user_id,
        "starts_at": block.start_time.isoformat(),
        "ends_at": block.end_time.isoformat(),
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


@router.put("/{block_id}", response_model=ScheduleBlock)
async def update_schedule_block(block_id: str, block_update: ScheduleBlockUpdate):
    supabase = get_supabase()
    update_data = block_update.model_dump(exclude_unset=True)
    payload = {}
    if "start_time" in update_data:
        payload["starts_at"] = update_data["start_time"].isoformat()
    if "end_time" in update_data:
        payload["ends_at"] = update_data["end_time"].isoformat()
    if "task_id" in update_data:
        payload["source_task_id"] = update_data["task_id"]
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
    if not rows:
        raise HTTPException(status_code=404, detail="Schedule block not found")
    return map_row_to_block(rows[0])


@router.delete("/{block_id}")
async def delete_schedule_block(block_id: str):
    supabase = get_supabase()
    existing = supabase.table("schedule_blocks").select("id").eq("id", block_id).limit(1).execute()
    if not (existing.data or []):
        raise HTTPException(status_code=404, detail="Schedule block not found")
    supabase.table("schedule_blocks").delete().eq("id", block_id).execute()
    return {"message": "Schedule block deleted successfully"}
