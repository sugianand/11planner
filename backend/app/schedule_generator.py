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
        self.between_block_buffer_minutes = 5  # 5-minute buffer between generated blocks to prevent overwhelm

    def normalized_day_set(self, days: Optional[List[str]]) -> set[str]:
        return {
            (day or "").strip().lower()
            for day in (days or [])
            if (day or "").strip()
        }

    def day_name(self, dt: datetime) -> str:
        return dt.strftime("%A") # returns day names like mon, tues, etc.
    
    def is_workday(self, dt:datetime, pref: Preferences) -> bool:
        workdays = self.normalized_day_set(pref.workdays)
        if not workdays:
            return True
        return self.day_name(dt).lower() in workdays
    
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
        moved = True
        while moved:
            moved = False
            for block in busy_blocks:
                if block.start <= dt < block.end:
                    dt = block.end
                    moved = True
        return dt

    def round_up_to_five(self, dt: datetime) -> datetime:
        """Round up to nearest 5-minute increment (0, 5, 10, 15, 20, etc.)"""
        minute = dt.minute
        remainder = minute % 5
        if remainder == 0 and dt.second == 0 and dt.microsecond == 0:
            return dt
        delta = (5 - remainder) if remainder != 0 else 5
        return (dt + timedelta(minutes=delta)).replace(second=0, microsecond=0)

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
 

    def move_to_preferred_day(
            self,
            dt: datetime,
            prefs: Preferences,
            preferred_days: List[str]
        ) -> datetime:
        if not preferred_days:
            return dt
        preferred_day_set = self.normalized_day_set(preferred_days)
        if not preferred_day_set:
            return dt
        probe = dt
        for _ in range(14):
            if self.day_name(probe).lower() in preferred_day_set and self.is_workday(probe, prefs):
                preferred_start = self.set_time(probe, prefs.work_start)
                if probe.date() == dt.date():
                    return max(dt, preferred_start)
                return preferred_start
            probe += timedelta(days=1)
        return dt


    def apply_ai_task_order(
            self,
            sorted_tasks: List[Task],
            ai_task_order: List[str]
        ) -> List[Task]:
        if not ai_task_order:
            return sorted_tasks
        task_dict = {str(task.id): task for task in sorted_tasks}
        ordered: List[Task] = []
        used = set()

        for task_id in ai_task_order:
            task = task_dict.get(str(task_id))
            if task: 
                ordered.append(task)
                used.add(str(task_id))
        for task in sorted_tasks:
            if str(task.id) not in used:
                ordered.append(task)
        return ordered





    def generate_schedule(
        self,
        tasks: List[Task],
        prefs: Preferences,
        busy: Optional[List[BusyBlock]] = None,
        start_date: Optional[datetime] = None,
        ai_plan: Optional[Callable[[Dict[str, Any]], Dict[str, Any]]] = None,
    ) -> List[ScheduleBlock]:
        
        block_minutes_override: Dict[str, List[int]] = {}
        preferred_days_map: Dict[str, List[str]] = {}
        ai_task_order: List[str] = []
        if busy is None:
            busy = []

        if start_date is None:
            start_date = datetime.now()

        pending_tasks = [t for t in tasks if not t.completed]
        if not pending_tasks:
            return []

        def urgency_key(task: Task):
            # Overdue work must surface first. For remaining tasks, closer deadlines
            # dominate ordering and priority breaks ties inside similar deadlines.
            priority_value = getattr(task, "priority", None)
            if priority_value is None:
                priority_value = getattr(task, "priority_level", 2) or 2

            try:
                priority_value = int(priority_value)
            except (TypeError, ValueError):
                priority_value = 2

            hours_needed = float(task.estimated_hours or 1)
            if hours_needed <= 0:
                hours_needed = 1.0

            minutes_until_deadline = int((task.deadline - start_date).total_seconds() // 60)
            is_not_overdue = minutes_until_deadline > 0

            # For non-overdue tasks, tasks with larger work-to-time pressure should
            # move earlier when deadlines are close.
            available_hours = max(minutes_until_deadline / 60.0, 1.0)
            pressure_score = hours_needed / available_hours

            return (
                is_not_overdue,
                minutes_until_deadline,
                -priority_value,
                -pressure_score,
                -hours_needed,
                str(task.id),
            )

        sorted_tasks = sorted(pending_tasks, key=urgency_key)

        current_dt = start_date
        if not self.is_workday(current_dt, prefs):
            current_dt = self.move_to_next_work_start(current_dt, prefs)
        else:
            work_start_dt = self.set_time(current_dt, prefs.work_start)
            work_end_dt = self.set_time(current_dt, prefs.work_end)
            if current_dt < work_start_dt:
                current_dt = work_start_dt
            elif current_dt >= work_end_dt:
                current_dt = self.next_day_start(current_dt, prefs)
        current_dt = self.skip_if_busy(current_dt, busy)
        current_dt = self.round_up_to_five(current_dt)

        max_hours_per_day = float(prefs.study_limit_hours)
        if max_hours_per_day <= 0:
            max_hours_per_day = float(self.max_hours_per_day)
        if max_hours_per_day <= 0:
            max_hours_per_day = 1.0
        hours_today = 0.0
        scheduled_blocks: List[ScheduleBlock] = []

        block_minutes_override: Dict[str, List[int]] = {}

        if ai_plan:
            context = {
                "tasks": [
                    {
                        "id": str(t.id),
                        "title": getattr(t, "title", None) or getattr(t, "task_title", None),
                        "deadline": t.deadline.isoformat(),
                        "estimated_hours": t.estimated_hours,
                        "priority": getattr(t, "priority", None)
                        if getattr(t, "priority", None) is not None
                        else getattr(t, "priority_level", None),
                        "description": getattr(t, "description", None),
                    }
                    for t in sorted_tasks
                ],
                "prefs": {
                    "workdays": prefs.workdays,
                    "work_start": prefs.work_start.strftime("%H:%M"),
                    "work_end": prefs.work_end.strftime("%H:%M"),
                    "study_limit_hours": prefs.study_limit_hours,
                    "workstyle": prefs.workstyle,
                    "assignment_plan": prefs.assignment_plan,
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
            preferred_days_map = ai_result.get("preferred_days", {}) or {}
            ai_task_order = ai_result.get("task_order", []) or []
            sorted_tasks = self.apply_ai_task_order(sorted_tasks, ai_task_order)

        for task in sorted_tasks:
            task_preferred_days = preferred_days_map.get(str(task.id), [])
            task_preferred_day_set = self.normalized_day_set(task_preferred_days)
            if task_preferred_days:
                candidate_dt = self.move_to_preferred_day(current_dt, prefs, task_preferred_days)
                candidate_dt = self.skip_if_busy(candidate_dt, busy)

                if candidate_dt.date() <= task.deadline.date():
                    current_dt = candidate_dt
                    hours_today = 0.0 if current_dt.time() == prefs.work_start else hours_today
            hours_remaining = float(task.estimated_hours or 1)

            override_list = block_minutes_override.get(str(task.id), [])
            override_idx = 0

            while hours_remaining > 0:
                current_dt = self.round_up_to_five(current_dt)
                current_dt = self.skip_if_busy(current_dt, busy)
                current_dt = self.round_up_to_five(current_dt)

                if not self.is_workday(current_dt, prefs):
                    current_dt = self.move_to_next_work_start(current_dt, prefs)
                    current_dt = self.skip_if_busy(current_dt, busy)
                    current_dt = self.round_up_to_five(current_dt)
                    hours_today = 0.0
                    continue

                if task_preferred_day_set and self.day_name(current_dt).lower() not in task_preferred_day_set:
                    moved_dt = self.move_to_preferred_day(current_dt, prefs, task_preferred_days)
                    moved_dt = self.skip_if_busy(moved_dt, busy)
                    if moved_dt.date() <= task.deadline.date():
                        current_dt = self.round_up_to_five(moved_dt)
                        hours_today = 0.0

                if hours_today >= max_hours_per_day:
                    current_dt = self.next_day_start(current_dt, prefs)
                    current_dt = self.skip_if_busy(current_dt, busy)
                    current_dt = self.round_up_to_five(current_dt)
                    hours_today = 0.0
                    continue

                day_end = self.work_window_end(current_dt, prefs)
                if current_dt >= day_end:
                    current_dt = self.next_day_start(current_dt, prefs)
                    current_dt = self.skip_if_busy(current_dt, busy)
                    current_dt = self.round_up_to_five(current_dt)
                    hours_today = 0.0
                    continue

                remaining_minutes = max(int(round(hours_remaining * 60)), 15)
                available_today_minutes = max(int(round((max_hours_per_day - hours_today) * 60)), 0)
                available_window_minutes = max(int((day_end - current_dt).total_seconds() // 60), 0)

                if override_idx < len(override_list):
                    candidate_minutes = int(override_list[override_idx])
                    override_idx += 1
                else:
                    candidate_minutes = int(round(self.get_block_hours_for_plan(prefs, task, hours_remaining) * 60))

                block_minutes = min(candidate_minutes, remaining_minutes, available_today_minutes, available_window_minutes)
                block_minutes = (block_minutes // 5) * 5  # Round down to nearest 5-minute increment
                preferred_block_minutes = max((candidate_minutes // 5) * 5, 5)

                if block_minutes <= 0:
                    break

                start_time = current_dt
                end_time = start_time + timedelta(minutes=block_minutes)

                overlapping_block = None
                for busy_block in busy:
                    if self.overlaps(start_time, end_time, busy_block.start, busy_block.end):
                        overlapping_block = busy_block
                        break

                if overlapping_block:
                    current_dt = overlapping_block.end
                    current_dt = self.skip_if_busy(current_dt, busy)
                    current_dt = self.round_up_to_five(current_dt)
                    continue

                block = ScheduleBlock(
                    id=f"block_{uuid.uuid4().hex}",
                    task_id=task.id,
                    date=start_time,
                    start_time=start_time,
                    end_time=end_time,
                    duration_minutes=block_minutes,
                    user_id=task.user_id,
                    created_at=datetime.now(),
                )

                scheduled_blocks.append(block)

                consumed_hours = block_minutes / 60.0
                hours_remaining -= consumed_hours
                hours_today += consumed_hours
                current_dt = end_time

                if hours_remaining > 0:
                    # Add a post-block buffer only when the block reached its intended size.
                    # Shortened blocks can run back-to-back so the schedule still fits.
                    if block_minutes >= preferred_block_minutes:
                        current_dt = current_dt + timedelta(minutes=self.between_block_buffer_minutes)
                        current_dt = self.skip_if_busy(current_dt, busy)
                        current_dt = self.round_up_to_five(current_dt)

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
