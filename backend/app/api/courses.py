from fastapi import APIRouter, HTTPException
from typing import List
from app.models import Course, CourseCreate, CourseUpdate
from uuid import uuid4

router = APIRouter(prefix="/api/courses", tags=["courses"])

# In-memory storage
courses_db: dict[str, Course] = {}

# Creates a course record in the in-memory store.
@router.post("", response_model=Course)
async def create_course(course: CourseCreate):
    course_id = str(uuid4())
    new_course = Course(id=course_id, **course.dict())
    courses_db[course_id] = new_course
    return new_course

# Returns all courses that belong to a given user.
@router.get("/{user_id}", response_model=List[Course])
async def get_courses_by_user(user_id: str):
    user_courses = [c for c in courses_db.values() if c.user_id == user_id]
    return user_courses

# Fetches a single course by id.
@router.get("/detail/{course_id}", response_model=Course)
async def get_course_by_id(course_id: str):
    if course_id not in courses_db:
        raise HTTPException(status_code=404, detail="Course not found")
    return courses_db[course_id]

# Applies partial updates to an existing course.
@router.put("/{course_id}", response_model=Course)
async def update_course(course_id: str, course_update: CourseUpdate):
    if course_id not in courses_db:
        raise HTTPException(status_code=404, detail="Course not found")

    existing = courses_db[course_id]
    updated_fields = course_update.dict(exclude_unset=True)
    updated_course = Course(**{**existing.dict(), **updated_fields})
    courses_db[course_id] = updated_course
    return updated_course

# Deletes a course by id from the in-memory store.
@router.delete("/{course_id}")
async def delete_course(course_id: str):
    if course_id not in courses_db:
        raise HTTPException(status_code=404, detail="Course not found")
    
    del courses_db[course_id]
    return {"message": "Course deleted successfully"}
