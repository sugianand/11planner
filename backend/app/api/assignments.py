from fastapi import APIRouter, HTTPException
from typing import List
from app.models import Assignment, AssignmentCreate
from uuid import uuid4

router = APIRouter(prefix="/api/assignments", tags=["assignments"])

# In-memory storage
assignments_db: dict[str, Assignment] = {}

@router.post("", response_model=Assignment)
async def create_assignment(assignment: AssignmentCreate):
    assignment_id = str(uuid4())
    new_assignment = Assignment(id=assignment_id, **assignment.dict())
    assignments_db[assignment_id] = new_assignment
    return new_assignment

@router.get("/{user_id}", response_model=List[Assignment])
async def get_assignments_by_user(user_id: str):
    user_assignments = [a for a in assignments_db.values() if a.user_id == user_id]
    return user_assignments

@router.get("/detail/{assignment_id}", response_model=Assignment)
async def get_assignment_by_id(assignment_id: str):
    if assignment_id not in assignments_db:
        raise HTTPException(status_code=404, detail="Assignment not found")
    return assignments_db[assignment_id]

@router.put("/{assignment_id}", response_model=Assignment)
async def update_assignment(assignment_id: str, assignment_update: AssignmentCreate):
    if assignment_id not in assignments_db:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    updated_assignment = Assignment(id=assignment_id, **assignment_update.dict())
    assignments_db[assignment_id] = updated_assignment
    return updated_assignment

@router.delete("/{assignment_id}")
async def delete_assignment(assignment_id: str):
    if assignment_id not in assignments_db:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    del assignments_db[assignment_id]
    return {"message": "Assignment deleted successfully"}
