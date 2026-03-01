from pydantic import BaseModel
from typing import Optional
from datetime import datetime

# ========== Course Models ==========

class CourseBase(BaseModel):
    name: str
    code: str
    professor: Optional[str] = None
    description: Optional[str] = None
    isOnline: bool = False
    hasLab: bool = False
    labDay: Optional[str] = None
    labStartTime: Optional[str] = None
    labEndTime: Optional[str] = None
    labIsOnline: bool = False

class CourseCreate(CourseBase):
    user_id: str

class Course(CourseBase):
    id: str
    user_id: str
    created_at: datetime
    
    class Config:
        from_attributes = True

# ========== Assignment Models ==========

class AssignmentBase(BaseModel):
    title: str
    course_id: str
    deadline: datetime
    description: Optional[str] = None
    priority: int = 2  # 1-5 scale

class AssignmentCreate(AssignmentBase):
    user_id: str

class Assignment(AssignmentBase):
    id: str
    user_id: str
    created_at: datetime
    completed: bool = False
    
    class Config:
        from_attributes = True

# ========== Task Models ==========

class TaskBase(BaseModel):
    title: str
    assignment_id: Optional[str] = None
    course_id: Optional[str] = None
    deadline: datetime
    estimated_hours: float
    priority: int = 2  # 1-5 scale
    description: Optional[str] = None

class TaskCreate(TaskBase):
    user_id: str

class Task(TaskBase):
    id: str
    user_id: str
    created_at: datetime
    completed: bool = False
    
    class Config:
        from_attributes = True

# ========== Schedule Block Models ==========

class ScheduleBlockBase(BaseModel):
    task_id: str
    date: datetime
    start_time: datetime
    end_time: datetime
    duration_minutes: int = 30

class ScheduleBlockCreate(ScheduleBlockBase):
    user_id: str

class ScheduleBlock(ScheduleBlockBase):
    id: str
    user_id: str
    created_at: datetime
    completed: bool = False
    
    class Config:
        from_attributes = True

# ========== Schedule Summary Models ==========

class WeeklyScheduleSummary(BaseModel):
    user_id: str
    week_start: datetime
    total_tasks: int
    completed_tasks: int
    total_hours: float
    schedule_blocks: list[ScheduleBlock]
    
    class Config:
        from_attributes = True
