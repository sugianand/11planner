from fastapi import APIRouter, HTTPException
from typing import List
from app.models import Course, CourseCreate
from uuid import uuid4

router = APIRouter(prefix="/api/courses", tags=["courses"])

# In-memory storage
courses_db: dict[str, Course] = {}

@router.post("", response_model=Course)
async def create_course(course: CourseCreate):
    course_id = str(uuid4())
    new_course = Course(id=course_id, **course.dict())
    courses_db[course_id] = new_course
    return new_course

@router.get("/{user_id}", response_model=List[Course])
async def get_courses_by_user(user_id: str):
    user_courses = [c for c in courses_db.values() if c.user_id == user_id]
    return user_courses

@router.get("/detail/{course_id}", response_model=Course)
async def get_course_by_id(course_id: str):
    if course_id not in courses_db:
        raise HTTPException(status_code=404, detail="Course not found")
    return courses_db[course_id]

@router.put("/{course_id}", response_model=Course)
async def update_course(course_id: str, course_update: CourseCreate):
    if course_id not in courses_db:
        raise HTTPException(status_code=404, detail="Course not found")
    
    updated_course = Course(id=course_id, **course_update.dict())
    courses_db[course_id] = updated_course
    return updated_course

@router.delete("/{course_id}")
async def delete_course(course_id: str):
    if course_id not in courses_db:
        raise HTTPException(status_code=404, detail="Course not found")
    
    del courses_db[course_id]
    return {"message": "Course deleted successfully"}
