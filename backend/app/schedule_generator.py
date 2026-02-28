from datetime import datetime, timedelta
from typing import List, Optional
from app.models import Task, ScheduleBlock
import uuid 
import math
from dataclasses import dataclass
from datetime import datetime, timedelta, time


# using dataclass for structure when building out schedule generator 
@dataclass
class Preferences:
    workdays: List[str]
    work_start: time
    work_end: time
    study_limit_hours: float
    workstyle: Optional[str] = None  
    additional_info: Optional[str] = None

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

        
    def generate_schedule(self, 
                          tasks: List[Task],
                          prefs: Preferences,
                          start_date: datetime = None,
                          busy: Optional[List[BusyBlock]] = None,
                            ) -> List[ScheduleBlock]:
                          
        """
        Generate optimal schedule for given tasks.
        
        Algorithm:
        1. Filter incomplete tasks
        2. Sort by urgency (deadline - today) / estimated hours
        3. Allocate time blocks respecting constraints
        4. Add breaks between blocks
        5. Avoid scheduling past 11 PM
        """
        
        if start_date is None:
            start_date = datetime.now()
        
        # Filter and sort tasks
        pending_tasks = [t for t in tasks if not t.completed]
        if not pending_tasks:
            return []
        
        # Calculate urgency score: (days until deadline) / hours needed
        # Lower score = more urgent
        def urgency_score(task: Task):
            days_until = (task.deadline - start_date).days
            hours_needed = task.estimated_hours
            if hours_needed == 0:
                hours_needed = 1
            if days_until <= 0:
                return -999  # Overdue - highest priority
            return days_until / hours_needed
        
        sorted_tasks = sorted(pending_tasks, key=urgency_score)

        current_dt = self.move_to_next_work_start(start_date, prefs)
        current_dt = self.skip_if_busy(current_dt, busy)
        
        schedule_blocks = []
        current_date = start_date.replace(hour=9, minute=0, second=0, microsecond=0)
        current_hours_today = 0
        
        for task in sorted_tasks:
            hours_needed = task.estimated_hours
            hours_remaining = hours_needed
            
            while hours_remaining > 0:
                # Check if we've exceeded max hours for today
                if current_hours_today >= self.max_hours_per_day:
                    # Move to next day, 9 AM
                    current_date = current_date + timedelta(days=1)
                    current_date = current_date.replace(hour=9, minute=0)
                    current_hours_today = 0
                
                # Allocate focus block (2-4 hours or remaining, whichever is less)
                block_hours = min(self.focus_block_hours, hours_remaining)
                block_hours = min(block_hours, self.max_hours_per_day - current_hours_today)
                
                if block_hours <= 0:
                    break
                
                start_time = current_date
                end_time = start_time + timedelta(hours=block_hours)
                
                # Don't schedule past 11 PM
                if end_time.hour > 23:
                    # Move to next day instead
                    current_date = current_date + timedelta(days=1)
                    current_date = current_date.replace(hour=9, minute=0)
                    current_hours_today = 0
                    continue
                
                # Create schedule block
                block = ScheduleBlock(
                    id=f"block_{len(schedule_blocks) + 1}",
                    task_id=task.id,
                    date=start_time,
                    start_time=start_time,
                    end_time=end_time,
                    duration_minutes=int(block_hours * 60),
                    user_id=task.user_id,
                    created_at=datetime.now()
                )
                schedule_blocks.append(block)
                
                hours_remaining -= block_hours
                current_hours_today += block_hours
                current_date = end_time
                
                # Add break (15 minutes) unless this was the last block
                if hours_remaining > 0:
                    current_date = current_date + timedelta(minutes=self.break_minutes)
        
        return schedule_blocks
    
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
        
        for i, block in enumerate(blocks):
            # Check if block goes past 11 PM
            if block.end_time.hour > 23:
                violations.append(f"Block {i+1} extends past 11 PM")
            
            # Check overlap with next block
            if i < len(blocks) - 1:
                next_block = blocks[i + 1]
                if block.end_time > next_block.start_time:
                    violations.append(f"Block {i+1} overlaps with block {i+2}")
        
        stats["violations"] = violations
        stats["valid"] = len(violations) == 0
        
        return stats
