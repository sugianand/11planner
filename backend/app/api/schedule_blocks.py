from fastapi import APIRouter, HTTPException
from typing import List
from app.models import ScheduleBlock, ScheduleBlockCreate
from uuid import uuid4

router = APIRouter(prefix="/api/schedule-blocks", tags=["schedule"])

# In-memory storage
schedule_blocks_db: dict[str, ScheduleBlock] = {}

@router.post("", response_model=ScheduleBlock)
async def create_schedule_block(block: ScheduleBlockCreate):
    block_id = str(uuid4())
    new_block = ScheduleBlock(id=block_id, **block.dict())
    schedule_blocks_db[block_id] = new_block
    return new_block

@router.get("/{user_id}", response_model=List[ScheduleBlock])
async def get_schedule_blocks_by_user(user_id: str):
    user_blocks = [b for b in schedule_blocks_db.values() if b.user_id == user_id]
    return user_blocks

@router.put("/{block_id}", response_model=ScheduleBlock)
async def update_schedule_block(block_id: str, block_update: ScheduleBlockCreate):
    if block_id not in schedule_blocks_db:
        raise HTTPException(status_code=404, detail="Schedule block not found")
    
    updated_block = ScheduleBlock(id=block_id, **block_update.dict())
    schedule_blocks_db[block_id] = updated_block
    return updated_block

@router.delete("/{block_id}")
async def delete_schedule_block(block_id: str):
    if block_id not in schedule_blocks_db:
        raise HTTPException(status_code=404, detail="Schedule block not found")
    
    del schedule_blocks_db[block_id]
    return {"message": "Schedule block deleted successfully"}
