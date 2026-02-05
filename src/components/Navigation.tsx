"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navigation() {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="bg-white dark:bg-slate-800 shadow-md sticky top-0 z-50">
      <div className="w-full px-6 py-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link href="/" className="text-4xl font-bold text-blue-600 dark:text-blue-400 flex-shrink-0">
            11Planner
          </Link>

          {/* Navigation Links */}
          <div className="flex gap-8 items-center">
            <Link
              href="/"
              className={`font-medium transition ${
                isActive("/")
                  ? "text-blue-600 dark:text-blue-400 border-b-2 border-b-blue-600"
                  : "text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400"
              }`}
            >
              Home
            </Link>

            <Link
              href="/dashboard"
              className={`font-medium transition ${
                isActive("/dashboard")
                  ? "text-blue-600 border-b-2 border-b-blue-600"
                  : "text-slate-700 hover:text-blue-600"
              }`}
            >
              Dashboard
            </Link>

            <Link
              href="/tasks"
              className={`font-medium transition ${
                isActive("/tasks")
                  ? "text-blue-600 border-b-2 border-b-blue-600"
                  : "text-slate-700 hover:text-blue-600"
              }`}
            >
              Tasks
            </Link>

            <Link
              href="/courses"
              className={`font-medium transition ${
                isActive("/courses")
                  ? "text-blue-600 border-b-2 border-b-blue-600"
                  : "text-slate-700 hover:text-blue-600"
              }`}
            >
              Courses
            </Link>

            <Link
              href="/schedule"
              className={`font-medium transition ${
                isActive("/schedule")
                  ? "text-blue-600 border-b-2 border-b-blue-600"
                  : "text-slate-700 hover:text-blue-600"
              }`}
            >
              Schedule
            </Link>

            <Link
              href="/settings"
              className={`font-medium transition ${
                isActive("/settings")
                  ? "text-blue-600 border-b-2 border-b-blue-600"
                  : "text-slate-700 hover:text-blue-600"
              }`}
            >
              Settings
            </Link>
          </div>

          {/* User Profile Button */}
          <Link
            href="/profile"
            className="bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition"
          >
            Profile
          </Link>
        </div>
      </div>
    </nav>
  );
}
