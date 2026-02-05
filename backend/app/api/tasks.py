from fastapi import APIRouter, HTTPException
from app.models import (
    CourseBase, CourseCreate, Course, 
    AssignmentBase, AssignmentCreate, Assignment,
    TaskBase, TaskCreate, Task, 
    ScheduleBlockBase, ScheduleBlockCreate, ScheduleBlock
)
from typing import List
from datetime import datetime

router = APIRouter(prefix="/api", tags=["tasks"])

# Mock database for now (will replace with real DB)
courses_db = {}
assignments_db = {}
tasks_db = {}
schedule_blocks_db = {}

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

# ========== SCHEDULE BLOCK ENDPOINTS ==========

@router.post("/schedule-blocks", response_model=ScheduleBlock)
async def create_schedule_block(block: ScheduleBlockCreate):
    """Create a new schedule block"""
    block_id = f"block_{len(schedule_blocks_db) + 1}"
    block_data = {
        "id": block_id,
        **block.dict(),
        "completed": False,
        "created_at": datetime.now()
    }
    schedule_blocks_db[block_id] = block_data
    return block_data

@router.get("/schedule-blocks/{user_id}", response_model=List[ScheduleBlock])
async def get_user_schedule_blocks(user_id: str):
    """Get all schedule blocks for a user"""
    user_blocks = [b for b in schedule_blocks_db.values() if b["user_id"] == user_id]
    return sorted(user_blocks, key=lambda x: x["start_time"])

@router.put("/schedule-blocks/{block_id}", response_model=ScheduleBlock)
async def update_schedule_block(block_id: str, block: ScheduleBlockBase):
    """Update a schedule block"""
    if block_id not in schedule_blocks_db:
        raise HTTPException(status_code=404, detail="Schedule block not found")
    schedule_blocks_db[block_id].update(block.dict())
    return schedule_blocks_db[block_id]

@router.delete("/schedule-blocks/{block_id}")
async def delete_schedule_block(block_id: str):
    """Delete a schedule block"""
    if block_id not in schedule_blocks_db:
        raise HTTPException(status_code=404, detail="Schedule block not found")
    del schedule_blocks_db[block_id]
    return {"message": "Schedule block deleted"}
