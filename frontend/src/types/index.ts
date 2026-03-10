// ========== Course Types ==========
export interface Course {
  id: string;
  name: string;
  code: string;
  professor?: string;
  description?: string;
  user_id: string;
  created_at: string;
  courseDate: string;
  startTime: string;
  endTime: string;
  isOnline?: boolean;
  hasLab?: boolean;
  labDay?: string;
  labStartTime?: string;
  labEndTime?: string;
  labIsOnline?: boolean;
}

export interface CourseCreate {
  name: string;
  code: string;
  professor?: string;
  description?: string;
  user_id: string;
  courseDate: string;
  startTime: string;
  endTime: string;
  isOnline?: boolean;
  hasLab?: boolean;
  labDay?: string;
  labStartTime?: string;
  labEndTime?: string;
  labIsOnline?: boolean;
}

// ========== Assignment Types ==========
export interface Assignment {
  id: string;
  title: string;
  course_id?: string;
  deadline: string;
  description?: string;
  priority: number;
  estimated_hours: number;
  user_id: string;
  created_at: string;
  status?: string;
  points?: number;
  url?: string;
  source?: string;
  completed: boolean;
}

export interface AssignmentCreate {
  title: string;
  course_id?: string;
  deadline: string;
  description?: string;
  priority: number;
  estimated_hours: number;
  user_id: string;
  status?: string;
  points?: number;
  url?: string;
  source?: string;
}

// ========== Task Types ==========
export interface Task {
  id: string;
  title: string;
  assignment_id?: string;
  course_id?: string;
  deadline: string;
  estimated_hours: number;
  priority: number;
  description?: string;
  user_id: string;
  created_at: string;
  completed: boolean;
}

export interface TaskCreate {
  title: string;
  assignment_id?: string;
  course_id?: string;
  deadline: string;
  estimated_hours: number;
  priority: number;
  description?: string;
  user_id: string;
}

// ========== Schedule Block Types ==========
export interface ScheduleBlock {
  id: string;
  task_id: string;
  date: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  user_id: string;
  created_at: string;
  completed: boolean;
}

export interface ScheduleBlockCreate {
  task_id: string;
  date: string;
  start_time: string;
  end_time: string;
  duration_minutes?: number;
  user_id: string;
}

// ========== Weekly Summary Types ==========
export interface WeeklyScheduleSummary {
  user_id: string;
  week_start: string;
  total_tasks: number;
  completed_tasks: number;
  total_hours: number;
  schedule_blocks: ScheduleBlock[];
}

// ========== UI State Types ==========
export interface UIState {
  loading: boolean;
  error: string | null;
  userId: string;
}

export interface PlannerState {
  courses: Course[];
  assignments: Assignment[];
  tasks: Task[];
  scheduleBlocks: ScheduleBlock[];
  ui: UIState;
}

export interface UserPreferences {
  worktime: string;
  workdays: string[];
  workstyle: string;
  assignmentplan: string;
  additionalInfo: string;
}
