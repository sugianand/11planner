"use client";

import { useEffect } from "react";
import { usePlanner } from "@/contexts/PlannerContext";
import Link from "next/link";

export default function Dashboard() {
  const {
    userId,
    tasks,
    courses,
    assignments,
    scheduleBlocks,
    loadTasks,
    loadCourses,
    loadAssignments,
    loadScheduleBlocks,
  } = usePlanner();

  useEffect(() => {
    loadCourses();
    loadTasks();
    loadAssignments();
    loadScheduleBlocks();
  }, [userId]);

  // Calculate upcoming tasks (next 7 days)
  const now = new Date();
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const upcomingTasks = tasks
    .filter((task) => {
      const deadline = new Date(task.deadline);
      return deadline >= now && deadline <= nextWeek && !task.completed;
    })
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
    .slice(0, 5);

  // Calculate overdue tasks
  const overdueTasks = tasks.filter((task) => {
    const deadline = new Date(task.deadline);
    return deadline < now && !task.completed;
  });

  // Calculate statistics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.completed).length;
  const totalHours = tasks.reduce((sum, t) => sum + t.estimated_hours, 0);
  const scheduledHours = tasks
    .filter((t) => scheduleBlocks.some((b) => b.task_id === t.id))
    .reduce((sum, t) => sum + t.estimated_hours, 0);

  const getCourseName = (courseId: string | undefined) => {
    if (!courseId) return "No Course";
    const course = courses.find((c) => c.id === courseId);
    return course?.name || "Unknown Course";
  };

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 5:
        return "bg-red-100 text-red-800 border-l-red-500";
      case 4:
        return "bg-orange-100 text-orange-800 border-l-orange-500";
      case 3:
        return "bg-yellow-100 text-yellow-800 border-l-yellow-500";
      case 2:
        return "bg-blue-100 text-blue-800 border-l-blue-500";
      default:
        return "bg-green-100 text-green-800 border-l-green-500";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-2">11Planner Dashboard</h1>
          <p className="text-blue-100">
            Welcome back! Stay focused and manage your tasks efficiently.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto p-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6 border-t-4 border-t-blue-500">
            <p className="text-slate-600 text-sm font-medium">Total Tasks</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">{totalTasks}</p>
            <p className="text-green-600 text-sm mt-2">
              {completedTasks} completed
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-t-4 border-t-orange-500">
            <p className="text-slate-600 text-sm font-medium">Total Hours</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">
              {totalHours.toFixed(1)}h
            </p>
            <p className="text-slate-600 text-sm mt-2">
              {scheduledHours.toFixed(1)}h scheduled
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-t-4 border-t-red-500">
            <p className="text-slate-600 text-sm font-medium">Overdue</p>
            <p className="text-3xl font-bold text-red-600 mt-2">
              {overdueTasks.length}
            </p>
            <p className="text-slate-600 text-sm mt-2">Needs immediate attention</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-t-4 border-t-green-500">
            <p className="text-slate-600 text-sm font-medium">Courses</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">
              {courses.length}
            </p>
            <p className="text-slate-600 text-sm mt-2">Active courses</p>
          </div>
        </div>

        {/* Overdue Alert */}
        {overdueTasks.length > 0 && (
          <div className="bg-red-50 border-l-4 border-l-red-500 p-6 rounded-lg mb-8">
            <h3 className="text-lg font-bold text-red-900 mb-3">
              Overdue Tasks ({overdueTasks.length})
            </h3>
            <div className="space-y-2">
              {overdueTasks.slice(0, 3).map((task) => (
                <div key={task.id} className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-red-900">{task.title}</p>
                    <p className="text-sm text-red-700">
                      {getCourseName(task.course_id)} • Due{" "}
                      {new Date(task.deadline).toLocaleDateString()}
                    </p>
                  </div>
                  <Link
                    href="/tasks"
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition text-sm font-medium"
                  >
                    View
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upcoming Tasks */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-900">
                  Upcoming This Week
                </h2>
                <Link
                  href="/tasks"
                  className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                >
                  View All →
                </Link>
              </div>

              {upcomingTasks.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-slate-500">No upcoming tasks this week!</p>
                  <Link
                    href="/tasks"
                    className="text-blue-600 hover:text-blue-800 font-medium mt-2 inline-block"
                  >
                    Create a new task
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingTasks.map((task) => (
                    <div
                      key={task.id}
                      className={`p-4 rounded-lg border-l-4 ${getPriorityColor(
                        task.priority
                      )}`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-semibold text-slate-900">
                            {task.title}
                          </h3>
                          <p className="text-sm text-slate-600 mt-1">
                            {getCourseName(task.course_id)}
                          </p>
                          <div className="flex gap-4 mt-2 text-sm">
                            <span>Due {new Date(task.deadline).toLocaleDateString()}</span>
                            <span>{task.estimated_hours}h</span>
                          </div>
                        </div>
                        <button className="text-blue-600 hover:text-blue-800 font-medium">
                          →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-bold text-slate-900 mb-4">
                Quick Actions
              </h3>
              <div className="space-y-3">
                <Link
                  href="/tasks"
                  className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition text-center"
                >
                  + Add Task
                </Link>
                <Link
                  href="/courses"
                  className="block w-full bg-slate-600 hover:bg-slate-700 text-white font-semibold py-3 px-4 rounded-lg transition text-center"
                >
                  + Add Course
                </Link>
                <Link
                  href="/schedule"
                  className="block w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition text-center"
                >
                  View Schedule
                </Link>
              </div>
            </div>

            {/* Completion Progress */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-bold text-slate-900 mb-4">
                Progress
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium text-slate-700">
                      Task Completion
                    </span>
                    <span className="text-sm font-bold text-slate-900">
                      {totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${totalTasks === 0 ? 0 : (completedTasks / totalTasks) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
