from datetime import datetime, time, timedelta
from typing import Any, Callable, Dict, List, Optional
from app.models import Task, ScheduleBlock
import uuid
from dataclasses import dataclass


# using dataclass for structure when building out schedule generator 
@dataclass
class Preferences:
    workdays: List[str]
    work_start: time
    work_end: time
    study_limit_hours: float
    workstyle: Optional[str] = None  
    additional_info: Optional[str] = None
    assignment_plan: Optional[str] = None

@dataclass 
class BusyBlock:
    start: datetime
    end: datetime
    title: str



class ScheduleGenerator:
    """
    Advanced schedule generation algorithm that:
    - Prioritizes urgent tasks
    - Spaces out work with breaks
    - Considers task difficulty/duration
    - Optimizes focus time (2-4 hour blocks)
    - Prevents burnout (max 8 hours/day)
    """
    
    def __init__(self, max_hours_per_day: float = 8, focus_block_hours: float = 2):
        self.max_hours_per_day = max_hours_per_day
        self.focus_block_hours = focus_block_hours
        self.break_minutes = 15

    def day_name(self, dt: datetime) -> str:
        return dt.strftime("%A") # returns day names like mon, tues, etc.
    
    def is_workday(self, dt:datetime, pref: Preferences) -> bool:
        return self.day_name(dt) in pref.workdays
    
    def set_time(self, dt: datetime, t: time) -> datetime:
        return dt.replace(hour=t.hour, minute =t.minute, second = 0, microsecond=0)
    
    def move_to_next_work_start(self, dt: datetime, pref: Preferences) -> datetime:
        while not self.is_workday(dt, pref):
            dt += timedelta(days=1)
        return self.set_time(dt, pref.work_start)
    
    def work_window_end(self, dt: datetime, pref: Preferences) -> datetime:
        return self.set_time(dt, pref.work_end)
    
    def overlaps(self, a_start: datetime, a_end: datetime, b_start: datetime, b_end: datetime) -> bool:
        return a_start < b_end and b_start < a_end #checks if time ranges overlap
    
    def overlaps_busy(self, start: datetime, end: datetime, busy_blocks: List[BusyBlock]) -> bool:
        for block in busy_blocks:
            if self.overlaps(start, end, block.start, block.end):
                return True
        return False
    #checks to see if proposed schedule block overlaps with any busy blocks 

    def skip_if_busy(self, dt: datetime, busy_blocks: List[BusyBlock]) -> datetime:
        for block in busy_blocks:
            if block.start <= dt < block.end:
                return block.end
        return dt
    #if current time is in busy block, jump to end of that block

    def next_day_start(self, dt: datetime, pref: Preferences) -> datetime:
        dt += timedelta(days=1)
        return self.move_to_next_work_start(dt, pref)
    #move to next day and set to work start time, used when current day time ends and you want to go to the next day 

    def get_block_hours_for_plan(self, prefs: Preferences, task: Task, hours_remaining: float) -> float:
        """
        Determine block size based on assignment plan preference.
        - early: Smaller blocks (0.5-1 hr) to spread over more days
        - deadline: Larger blocks (2-3 hr) to finish closer to deadline
        - balanced: Default behavior (1-2 hr blocks)
        """
        plan = (prefs.assignment_plan or "").strip().lower()
        
        if plan == "early":
            # Smaller blocks to spread work out
            return min(1.0, hours_remaining)
        elif plan == "deadline":
            # Larger blocks to complete faster
            return min(3.0, hours_remaining)
        else:  # balanced or default
            # Standard focus blocks
            return min(self.focus_block_hours, hours_remaining)
 

        
    def generate_schedule(
        self,
        tasks: List[Task],
        prefs: Preferences,
        busy: Optional[List[BusyBlock]] = None,
        start_date: Optional[datetime] = None,
        ai_plan: Optional[Callable[[Dict[str, Any]], Dict[str, Any]]] = None,
    ) -> List[ScheduleBlock]:
        if busy is None:
            busy = []

        if start_date is None:
            start_date = datetime.now()

        pending_tasks = [t for t in tasks if not t.completed]
        if not pending_tasks:
            return []

        def urgency_score(task: Task):
            days_until = (task.deadline - start_date).days
            hours_needed = task.estimated_hours or 1
            priority = task.priority or 2
            if days_until <= 0:
                return -999
            return (days_until / hours_needed) / priority

        sorted_tasks = sorted(pending_tasks, key=urgency_score)

        current_dt = self.move_to_next_work_start(start_date, prefs)
        current_dt = self.skip_if_busy(current_dt, busy)

        max_hours_per_day = float(prefs.study_limit_hours)
        hours_today = 0.0
        scheduled_blocks: List[ScheduleBlock] = []

        block_minutes_override: Dict[str, List[int]] = {}

        if ai_plan:
            context = {
                "tasks": [
                    {
                        "id": t.id,
                        "title": getattr(t, "title", None)
                        or getattr(t, "task_title", None),
                        "deadline": t.deadline.isoformat(),
                        "estimated_hours": t.estimated_hours,
                        "priority": getattr(t, "priority_level", None),
                    }
                    for t in sorted_tasks
                ],
                "prefs": {
                    "workdays": prefs.workdays,
                    "work_start": prefs.work_start.strftime("%H:%M"),
                    "work_end": prefs.work_end.strftime("%H:%M"),
                    "study_limit_hours": prefs.study_limit_hours,
                    "workstyle": prefs.workstyle,
                    "additional_info": prefs.additional_info,
                },
                "busy": [
                    {
                        "start": b.start.isoformat(),
                        "end": b.end.isoformat(),
                        "title": b.title,
                    }
                    for b in busy
                ],
            }

            ai_result = ai_plan(context) or {}
            block_minutes_override = ai_result.get("block_minutes_override", {}) or {}

        for task in sorted_tasks:
            hours_remaining = float(task.estimated_hours or 1)

            override_list = block_minutes_override.get(str(task.id), [])
            override_idx = 0

            while hours_remaining > 0:
                if hours_today >= max_hours_per_day:
                    current_dt = self.next_day_start(current_dt, prefs)
                    current_dt = self.skip_if_busy(current_dt, busy)
                    hours_today = 0.0

                day_end = self.work_window_end(current_dt, prefs)
                if current_dt >= day_end:
                    current_dt = self.next_day_start(current_dt, prefs)
                    current_dt = self.skip_if_busy(current_dt, busy)
                    hours_today = 0.0
                    continue

                if override_idx < len(override_list):
                    block_hours = override_list[override_idx] / 60.0
                    override_idx += 1
                else:
                    block_hours = self.get_block_hours_for_plan(prefs, task, hours_remaining)

                block_hours = min(block_hours, max_hours_per_day - hours_today)

                if block_hours <= 0:
                    break

                start_time = current_dt
                end_time = start_time + timedelta(hours=block_hours)

                if end_time > day_end:
                    end_time = day_end
                    block_hours = (end_time - start_time).total_seconds() / 3600.0

                overlapping_block = None
                for busy_block in busy:
                    if self.overlaps(start_time, end_time, busy_block.start, busy_block.end):
                        overlapping_block = busy_block
                        break
                if overlapping_block:
                    current_dt = overlapping_block.end
                    continue

                block = ScheduleBlock(
                    id=f"block_{uuid.uuid4().hex}",
                    task_id=task.id,
                    date=start_time,
                    start_time=start_time,
                    end_time=end_time,
                    duration_minutes=int(round(block_hours * 60)),
                    user_id=task.user_id,
                    created_at=datetime.now(),
                )

                scheduled_blocks.append(block)

                hours_remaining -= block_hours
                hours_today += block_hours
                current_dt = end_time

                if hours_remaining > 0:
                    current_dt = current_dt + timedelta(minutes=self.break_minutes)
                    current_dt = self.skip_if_busy(current_dt, busy)

        return scheduled_blocks
        


       
    
    def validate_schedule(self, blocks: List[ScheduleBlock]) -> dict:
        """
        Validate generated schedule.
        Returns stats about the schedule.
        """
        if not blocks:
            return {"valid": True, "stats": "No tasks to schedule"}
        
        total_hours = sum(b.duration_minutes for b in blocks) / 60
        days_span = (blocks[-1].end_time - blocks[0].start_time).days
        
        stats = {
            "valid": True,
            "total_blocks": len(blocks),
            "total_hours": round(total_hours, 2),
            "days_span": days_span + 1,
            "avg_hours_per_day": round(total_hours / (days_span + 1), 2),
            "start_date": blocks[0].start_time.isoformat(),
            "end_date": blocks[-1].end_time.isoformat(),
        }
        
        # Check for violations
        violations = []

            
        # Check overlap with next block
        for i, block in enumerate(blocks):
            if i < len(blocks) - 1:
                next_block = blocks[i + 1]
                if block.end_time > next_block.start_time:
                    violations.append(f"Block {i+1} overlaps with block {i+2}")
    
        stats["violations"] = violations
        stats["valid"] = len(violations) == 0
        
        return stats
