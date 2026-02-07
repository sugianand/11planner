"""
Tests for Schedule Generator
Tests the scheduling algorithm, validation, and edge cases
"""

import unittest
from datetime import datetime, timedelta
from app.schedule_generator import ScheduleGenerator
from app.models import Task

class TestScheduleGenerator(unittest.TestCase):
    
    def setUp(self):
        """Set up test fixtures"""
        self.generator = ScheduleGenerator(max_hours_per_day=8, focus_block_hours=2)
        self.start_date = datetime(2026, 2, 4, 0, 0, 0)  # Today
    
    def create_task(self, task_id: str, title: str, hours: float, priority: int, days_until: int) -> Task:
        """Helper to create test tasks"""
        deadline = self.start_date + timedelta(days=days_until)
        return Task(
            id=task_id,
            title=title,
            assignment_id=None,
            course_id=None,
            deadline=deadline,
            estimated_hours=hours,
            priority=priority,
            description=None,
            user_id="test_user",
            created_at=self.start_date,
            completed=False
        )
    
    def test_basic_schedule_generation(self):
        """Test basic schedule generation with single task"""
        tasks = [self.create_task("t1", "Study Math", 3, 2, 5)]
        blocks = self.generator.generate_schedule(tasks, self.start_date)
        
        self.assertEqual(len(blocks), 2)  # 3 hours = 1 block of 2 + 1 block of 1
        self.assertEqual(sum(b.duration_minutes for b in blocks) / 60, 3)
    
    def test_urgent_task_priority(self):
        """Test that urgent tasks are scheduled first"""
        tasks = [
            self.create_task("t1", "Urgent Task", 2, 1, 1),     # 1 day away - highest urgency
            self.create_task("t2", "Later Task", 2, 1, 10),     # 10 days away
        ]
        blocks = self.generator.generate_schedule(tasks, self.start_date)
        
        # First block should be for urgent task (t1)
        self.assertEqual(blocks[0].task_id, "t1")
    
    def test_multiple_tasks(self):
        """Test scheduling multiple tasks"""
        tasks = [
            self.create_task("t1", "Task 1", 2, 1, 3),
            self.create_task("t2", "Task 2", 2, 1, 5),
            self.create_task("t3", "Task 3", 2, 1, 7),
        ]
        blocks = self.generator.generate_schedule(tasks, self.start_date)
        
        # Should have blocks for all tasks
        total_hours = sum(b.duration_minutes for b in blocks) / 60
        self.assertEqual(total_hours, 6)  # 2+2+2 hours
    
    def test_focus_block_limit(self):
        """Test that individual blocks don't exceed focus block limit"""
        tasks = [self.create_task("t1", "Long Task", 10, 1, 5)]
        blocks = self.generator.generate_schedule(tasks, self.start_date)
        
        # Each block should be max 2 hours (focus_block_hours)
        for block in blocks:
            self.assertLessEqual(block.duration_minutes / 60, 2.1)  # Allow small rounding error
    
    def test_daily_limit_respected(self):
        """Test that daily work limit (8 hours) is respected"""
        tasks = [self.create_task("t1", "Task 1", 20, 1, 5)]
        blocks = self.generator.generate_schedule(tasks, self.start_date)
        
        # Group blocks by day
        blocks_by_day = {}
        for block in blocks:
            day = block.start_time.date()
            if day not in blocks_by_day:
                blocks_by_day[day] = []
            blocks_by_day[day].append(block)
        
        # Check no day exceeds 8 hours
        for day, day_blocks in blocks_by_day.items():
            daily_hours = sum(b.duration_minutes for b in day_blocks) / 60
            self.assertLessEqual(daily_hours, 8.1)  # Allow small rounding error
    
    def test_no_schedule_for_completed_tasks(self):
        """Test that completed tasks are filtered out"""
        task = self.create_task("t1", "Task 1", 2, 1, 5)
        task.completed = True
        
        blocks = self.generator.generate_schedule([task], self.start_date)
        self.assertEqual(len(blocks), 0)
    
    def test_empty_task_list(self):
        """Test handling of empty task list"""
        blocks = self.generator.generate_schedule([], self.start_date)
        self.assertEqual(len(blocks), 0)
    
    def test_overdue_task_priority(self):
        """Test that overdue tasks get highest priority"""
        tasks = [
            self.create_task("t1", "Normal Task", 2, 1, 5),
            self.create_task("t2", "Overdue Task", 2, 1, -1),  # Yesterday
        ]
        blocks = self.generator.generate_schedule(tasks, self.start_date)
        
        # Overdue task should be first
        self.assertEqual(blocks[0].task_id, "t2")
    
    def test_schedule_validation(self):
        """Test schedule validation"""
        tasks = [self.create_task("t1", "Task 1", 3, 1, 5)]
        blocks = self.generator.generate_schedule(tasks, self.start_date)
        stats = self.generator.validate_schedule(blocks)
        
        self.assertTrue(stats["valid"])
        self.assertEqual(stats["total_blocks"], len(blocks))
        self.assertEqual(stats["total_hours"], 3.0)
    
    def test_no_scheduling_past_11pm(self):
        """Test that blocks don't extend past 11 PM"""
        tasks = [self.create_task("t1", "Task 1", 3, 1, 5)]
        blocks = self.generator.generate_schedule(tasks, self.start_date)
        
        for block in blocks:
            self.assertLessEqual(block.end_time.hour, 23)
    
    def test_break_time_between_blocks(self):
        """Test that breaks are added between blocks"""
        tasks = [self.create_task("t1", "Task 1", 6, 1, 5)]
        blocks = self.generator.generate_schedule(tasks, self.start_date)
        
        # Should have multiple blocks with breaks in between
        self.assertGreater(len(blocks), 1)
        
        # Check gap between blocks is break time
        for i in range(len(blocks) - 1):
            gap = (blocks[i+1].start_time - blocks[i].end_time).total_seconds() / 60
            self.assertGreater(gap, 0)  # There should be a gap for break
    
    def test_deadline_respected(self):
        """Test that tasks are scheduled before their deadline"""
        deadline = self.start_date + timedelta(days=3)
        task = Task(
            id="t1",
            title="Deadline Task",
            assignment_id=None,
            course_id=None,
            deadline=deadline,
            estimated_hours=2,
            priority=1,
            description=None,
            user_id="test_user",
            created_at=self.start_date,
            completed=False
        )
        
        blocks = self.generator.generate_schedule([task], self.start_date)
        
        # All blocks should end before the deadline
        for block in blocks:
            self.assertLess(block.end_time, deadline)


class TestScheduleGeneratorEdgeCases(unittest.TestCase):
    
    def setUp(self):
        self.generator = ScheduleGenerator(max_hours_per_day=4, focus_block_hours=1)
        self.start_date = datetime(2026, 2, 4, 0, 0, 0)
    
    def create_task(self, task_id: str, hours: float, days_until: int) -> Task:
        deadline = self.start_date + timedelta(days=days_until)
        return Task(
            id=task_id,
            title=f"Task {task_id}",
            assignment_id=None,
            course_id=None,
            deadline=deadline,
            estimated_hours=hours,
            priority=2,
            description=None,
            user_id="test_user",
            created_at=self.start_date,
            completed=False
        )
    
    def test_very_short_deadline(self):
        """Test task due today"""
        tasks = [self.create_task("t1", 1, 0)]
        blocks = self.generator.generate_schedule(tasks, self.start_date)
        self.assertGreater(len(blocks), 0)
    
    def test_many_short_tasks(self):
        """Test scheduling many short tasks"""
        tasks = [self.create_task(f"t{i}", 0.5, i+1) for i in range(10)]
        blocks = self.generator.generate_schedule(tasks, self.start_date)
        
        total_hours = sum(b.duration_minutes for b in blocks) / 60
        self.assertEqual(total_hours, 5.0)  # 10 * 0.5


if __name__ == "__main__":
    unittest.main()
