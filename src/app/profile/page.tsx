"use client";

import { usePlanner } from "@/contexts/PlannerContext";

export default function ProfilePage() {
  const { userId, tasks, courses } = usePlanner();

  const completedTasks = tasks.filter((t) => t.completed).length;
  const totalTasks = tasks.length;
  const completionRate = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-6 border-t-4 border-t-blue-500">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-4xl font-bold">
              SA
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Suganeshwara Anand</h1>
              <p className="text-slate-600 text-lg mt-2">ID: {userId}</p>
              <p className="text-slate-500 text-sm mt-2">Member since February 2026</p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-l-blue-500">
            <p className="text-slate-600 text-sm font-medium">Total Tasks</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">{totalTasks}</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-l-green-500">
            <p className="text-slate-600 text-sm font-medium">Completed</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">{completedTasks}</p>
            <p className="text-green-600 text-sm mt-2">{completionRate}% complete</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-l-purple-500">
            <p className="text-slate-600 text-sm font-medium">Courses</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">{courses.length}</p>
          </div>
        </div>

        {/* Profile Info */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Profile Information</h2>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Email
              </label>
              <p className="text-slate-900">suganeshwara@11planner.com</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                University
              </label>
              <p className="text-slate-900">Your University</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Major
              </label>
              <p className="text-slate-900">Computer Science</p>
            </div>

            <div className="pt-4 border-t border-slate-200">
              <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition">
                Edit Profile
              </button>
            </div>
          </div>
        </div>

        {/* Completion Progress */}
        <div className="bg-white rounded-lg shadow-md p-6 mt-6">
          <h3 className="text-xl font-bold text-slate-900 mb-4">Overall Progress</h3>
          <div className="w-full bg-slate-200 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-300"
              style={{ width: `${completionRate}%` }}
            />
          </div>
          <p className="text-slate-600 text-sm mt-3">
            You've completed {completedTasks} out of {totalTasks} tasks
          </p>
        </div>
      </div>
    </div>
  );
}
