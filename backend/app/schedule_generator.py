from datetime import datetime, timedelta
from typing import List
from app.models import Task, ScheduleBlock
import math

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
        
    def generate_schedule(self, tasks: List[Task], start_date: datetime = None) -> List[ScheduleBlock]:
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
