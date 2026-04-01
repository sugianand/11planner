"""
Tests for Schedule Generator
Tests the scheduling algorithm, validation, and edge cases
"""

import unittest
from datetime import datetime, timedelta, time
from app.schedule_generator import ScheduleGenerator, Preferences
from app.models import Task

class TestScheduleGenerator(unittest.TestCase):
    
    def setUp(self):
        """Set up test fixtures"""
        self.generator = ScheduleGenerator(max_hours_per_day=8, focus_block_hours=2)
        self.start_date = datetime(2026, 2, 4, 0, 0, 0)  # Today
        self.prefs = Preferences(
            workdays=["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
            work_start=time(9, 0),
            work_end=time(17, 0),
            study_limit_hours=8,
        )
    
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
        blocks = self.generator.generate_schedule(tasks, self.prefs, start_date=self.start_date)
        
        self.assertEqual(len(blocks), 2)  # 3 hours = 1 block of 2 + 1 block of 1
        self.assertEqual(sum(b.duration_minutes for b in blocks) / 60, 3)
    
    def test_urgent_task_priority(self):
        """Test that urgent tasks are scheduled first"""
        tasks = [
            self.create_task("t1", "Urgent Task", 2, 1, 1),     # 1 day away - highest urgency
            self.create_task("t2", "Later Task", 2, 1, 10),     # 10 days away
        ]
        blocks = self.generator.generate_schedule(tasks, self.prefs, start_date=self.start_date)
        
        # First block should be for urgent task (t1)
        self.assertEqual(blocks[0].task_id, "t1")
    
    def test_multiple_tasks(self):
        """Test scheduling multiple tasks"""
        tasks = [
            self.create_task("t1", "Task 1", 2, 1, 3),
            self.create_task("t2", "Task 2", 2, 1, 5),
            self.create_task("t3", "Task 3", 2, 1, 7),
        ]
        blocks = self.generator.generate_schedule(tasks, self.prefs, start_date=self.start_date)
        
        # Should have blocks for all tasks
        total_hours = sum(b.duration_minutes for b in blocks) / 60
        self.assertEqual(total_hours, 6)  # 2+2+2 hours
    
    def test_focus_block_limit(self):
        """Test that individual blocks don't exceed focus block limit"""
        tasks = [self.create_task("t1", "Long Task", 10, 1, 5)]
        blocks = self.generator.generate_schedule(tasks, self.prefs, start_date=self.start_date)
        
        # Each block should be max 2 hours (focus_block_hours)
        for block in blocks:
            self.assertLessEqual(block.duration_minutes / 60, 2.1)  # Allow small rounding error
    
    def test_daily_limit_respected(self):
        """Test that daily work limit (8 hours) is respected"""
        tasks = [self.create_task("t1", "Task 1", 20, 1, 5)]
        blocks = self.generator.generate_schedule(tasks, self.prefs, start_date=self.start_date)
        
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
        
        blocks = self.generator.generate_schedule([task], self.prefs, start_date=self.start_date)
        self.assertEqual(len(blocks), 0)
    
    def test_empty_task_list(self):
        """Test handling of empty task list"""
        blocks = self.generator.generate_schedule([], self.prefs, start_date=self.start_date)
        self.assertEqual(len(blocks), 0)
    
    def test_overdue_task_priority(self):
        """Test that overdue tasks get highest priority"""
        tasks = [
            self.create_task("t1", "Normal Task", 2, 1, 5),
            self.create_task("t2", "Overdue Task", 2, 1, -1),  # Yesterday
        ]
        blocks = self.generator.generate_schedule(tasks, self.prefs, start_date=self.start_date)
        
        # Overdue task should be first
        self.assertEqual(blocks[0].task_id, "t2")
    
    def test_schedule_validation(self):
        """Test schedule validation"""
        tasks = [self.create_task("t1", "Task 1", 3, 1, 5)]
        blocks = self.generator.generate_schedule(tasks, self.prefs, start_date=self.start_date)
        stats = self.generator.validate_schedule(blocks)
        
        self.assertTrue(stats["valid"])
        self.assertEqual(stats["total_blocks"], len(blocks))
        self.assertEqual(stats["total_hours"], 3.0)
    
    def test_no_scheduling_past_11pm(self):
        """Test that blocks don't extend past 11 PM"""
        tasks = [self.create_task("t1", "Task 1", 3, 1, 5)]
        blocks = self.generator.generate_schedule(tasks, self.prefs, start_date=self.start_date)
        
        for block in blocks:
            self.assertLessEqual(block.end_time.hour, 23)
    
    def test_break_time_between_blocks(self):
        """Test that breaks are added between blocks"""
        tasks = [self.create_task("t1", "Task 1", 6, 1, 5)]
        blocks = self.generator.generate_schedule(tasks, self.prefs, start_date=self.start_date)
        
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
        
        blocks = self.generator.generate_schedule([task], self.prefs, start_date=self.start_date)
        
        # All blocks should end before the deadline
        for block in blocks:
            self.assertLess(block.end_time, deadline)


class TestScheduleGeneratorEdgeCases(unittest.TestCase):
    
    def setUp(self):
        self.generator = ScheduleGenerator(max_hours_per_day=4, focus_block_hours=1)
        self.start_date = datetime(2026, 2, 4, 0, 0, 0)
        self.prefs = Preferences(
            workdays=["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
            work_start=time(9, 0),
            work_end=time(17, 0),
            study_limit_hours=4,
        )
    
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
        blocks = self.generator.generate_schedule(tasks, self.prefs, start_date=self.start_date)
        self.assertGreater(len(blocks), 0)
    
    def test_many_short_tasks(self):
        """Test scheduling many short tasks"""
        tasks = [self.create_task(f"t{i}", 0.5, i+1) for i in range(10)]
        blocks = self.generator.generate_schedule(tasks, self.prefs, start_date=self.start_date)
        
        total_hours = sum(b.duration_minutes for b in blocks) / 60
        self.assertEqual(total_hours, 5.0)  # 10 * 0.5


class TestScheduleGeneratorNewFeatures(unittest.TestCase):
    """Tests for new prioritization, assignment plan, and workstyle features"""

    def setUp(self):
        self.generator = ScheduleGenerator(max_hours_per_day=8, focus_block_hours=2)
        self.start_date = datetime(2026, 2, 4, 9, 0, 0)  # Tuesday
        self.prefs = Preferences(
            workdays=["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
            work_start=time(9, 0),
            work_end=time(17, 0),
            study_limit_hours=8,
        )

    def create_task(self, task_id: str, hours: float, priority: int, days_until: int) -> Task:
        deadline = self.start_date + timedelta(days=days_until)
        return Task(
            id=task_id,
            title=f"Task {task_id}",
            assignment_id=None,
            course_id=None,
            deadline=deadline,
            estimated_hours=hours,
            priority=priority,
            description=None,
            user_id="test_user",
            created_at=self.start_date,
            completed=False,
        )

    def test_higher_priority_wins_equal_deadline(self):
        """High priority task should be scheduled before low priority with same deadline"""
        tasks = [
            self.create_task("low", 2, 1, 5),   # priority 1, 5 days
            self.create_task("high", 2, 5, 5),  # priority 5, 5 days
        ]
        blocks = self.generator.generate_schedule(tasks, self.prefs, start_date=self.start_date)
        self.assertEqual(blocks[0].task_id, "high")

    def test_closer_deadline_wins_same_priority(self):
        """Task due sooner should be scheduled first when priority is equal"""
        tasks = [
            self.create_task("far", 2, 1, 10),  # 10 days
            self.create_task("near", 2, 1, 3),  # 3 days
        ]
        blocks = self.generator.generate_schedule(tasks, self.prefs, start_date=self.start_date)
        self.assertEqual(blocks[0].task_id, "near")

    def test_assignment_plan_early_uses_small_blocks(self):
        """'early' assignment plan should create 1-hour blocks"""
        prefs_early = Preferences(
            workdays=["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
            work_start=time(9, 0),
            work_end=time(17, 0),
            study_limit_hours=8,
            assignment_plan="early",
        )
        generator_early = ScheduleGenerator(max_hours_per_day=8, focus_block_hours=2)
        tasks = [self.create_task("t1", 4, 1, 7)]
        blocks = generator_early.generate_schedule(tasks, prefs_early, start_date=self.start_date)

        # With 'early', max block should be 1 hour (60 min)
        for block in blocks:
            self.assertLessEqual(block.duration_minutes, 65)  # allow small rounding

    def test_assignment_plan_deadline_uses_large_blocks(self):
        """'deadline' assignment plan should create up to 3-hour blocks"""
        prefs_deadline = Preferences(
            workdays=["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
            work_start=time(9, 0),
            work_end=time(17, 0),
            study_limit_hours=8,
            assignment_plan="deadline",
        )
        generator_dl = ScheduleGenerator(max_hours_per_day=8, focus_block_hours=2)
        tasks = [self.create_task("t1", 6, 1, 7)]
        blocks = generator_dl.generate_schedule(tasks, prefs_deadline, start_date=self.start_date)

        # With 'deadline', blocks of up to 3 hours are allowed
        max_block = max(b.duration_minutes for b in blocks)
        self.assertGreater(max_block, 120)  # should have at least one block > 2hr

    def test_assignment_plan_balanced_default_blocks(self):
        """'balanced' assignment plan should use default focus_block size"""
        prefs_balanced = Preferences(
            workdays=["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
            work_start=time(9, 0),
            work_end=time(17, 0),
            study_limit_hours=8,
            assignment_plan="balanced",
        )
        generator_bal = ScheduleGenerator(max_hours_per_day=8, focus_block_hours=2)
        tasks = [self.create_task("t1", 6, 1, 7)]
        blocks = generator_bal.generate_schedule(tasks, prefs_balanced, start_date=self.start_date)

        # With 'balanced', blocks should be ≤ 2 hours (focus_block_hours)
        for block in blocks:
            self.assertLessEqual(block.duration_minutes, 125)

    def test_study_limit_4h_respected(self):
        """Study limit of 4 hours per day should cap daily work"""
        prefs_4h = Preferences(
            workdays=["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
            work_start=time(9, 0),
            work_end=time(17, 0),
            study_limit_hours=4,
        )
        gen = ScheduleGenerator(max_hours_per_day=4, focus_block_hours=2)
        tasks = [self.create_task("t1", 12, 1, 7)]
        blocks = gen.generate_schedule(tasks, prefs_4h, start_date=self.start_date)

        # No day should exceed 4 hours
        blocks_by_day: dict = {}
        for block in blocks:
            day = block.start_time.date()
            blocks_by_day.setdefault(day, []).append(block)

        for day, day_blocks in blocks_by_day.items():
            daily_hours = sum(b.duration_minutes for b in day_blocks) / 60
            self.assertLessEqual(daily_hours, 4.1)

    def test_lowercase_workdays_from_preferences_quiz(self):
        """Lowercase workdays from profile quiz should still be respected"""
        prefs_lowercase_days = Preferences(
            workdays=["monday", "tuesday", "wednesday", "thursday", "friday"],
            work_start=time(9, 0),
            work_end=time(17, 0),
            study_limit_hours=8,
        )
        tasks = [self.create_task("t1", 2, 2, 3)]
        blocks = self.generator.generate_schedule(tasks, prefs_lowercase_days, start_date=self.start_date)

        self.assertGreater(len(blocks), 0)
        for block in blocks:
            self.assertIn(block.start_time.strftime("%A"), ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"])

    def test_empty_workdays_does_not_hang(self):
        """If workdays are missing in preferences quiz, generator should still produce blocks"""
        prefs_no_days = Preferences(
            workdays=[],
            work_start=time(9, 0),
            work_end=time(17, 0),
            study_limit_hours=8,
        )
        tasks = [self.create_task("t1", 1, 2, 2)]
        blocks = self.generator.generate_schedule(tasks, prefs_no_days, start_date=self.start_date)
        self.assertGreater(len(blocks), 0)

    def test_non_positive_study_limit_uses_fallback(self):
        """Invalid study_limit_hours should fall back to generator defaults"""
        prefs_bad_limit = Preferences(
            workdays=["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
            work_start=time(9, 0),
            work_end=time(17, 0),
            study_limit_hours=0,
        )
        tasks = [self.create_task("t1", 2, 2, 2)]
        blocks = self.generator.generate_schedule(tasks, prefs_bad_limit, start_date=self.start_date)
        self.assertGreater(len(blocks), 0)


if __name__ == "__main__":
    unittest.main()
