"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navigation() {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-white/40 dark:border-slate-800/60 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 py-4">
        <div className="flex items-center">
          {/* Logo */}
          <Link href="/logo-story" className="flex items-center gap-3 flex-shrink-0">
            <img
              src="/11caroon.png"
              alt="11Planner logo"
              className="h-10 w-10 object-cover rounded-xl border border-white/30 dark:border-slate-700/40"
            />
          </Link>

          {/* Navigation Links */}
            <div className="flex-1 flex justify-center">
              <div className="flex gap-8 items-center">
            <Link
              href="/"
              className={`font-medium transition ${
                isActive("/")
                  ? "text-emerald-700 dark:text-emerald-400 border-b-2 border-b-emerald-500"
                  : "text-slate-700 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400"
              }`}
            >
              Home
            </Link>

            <Link
              href="/dashboard"
              className={`font-medium transition ${
                isActive("/dashboard")
                  ? "text-emerald-700 dark:text-emerald-400 border-b-2 border-b-emerald-500"
                  : "text-slate-700 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400"
              }`}
            >
              Dashboard
            </Link>

            <Link
              href="/tasks"
              className={`font-medium transition ${
                isActive("/tasks")
                  ? "text-emerald-700 dark:text-emerald-400 border-b-2 border-b-emerald-500"
                  : "text-slate-700 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400"
              }`}
            >
              Tasks
            </Link>

            <Link
              href="/courses"
              className={`font-medium transition ${
                isActive("/courses")
                  ? "text-emerald-700 dark:text-emerald-400 border-b-2 border-b-emerald-500"
                  : "text-slate-700 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400"
              }`}
            >
              Courses
            </Link>

            <Link
              href="/schedule"
              className={`font-medium transition ${
                isActive("/schedule")
                  ? "text-emerald-700 dark:text-emerald-400 border-b-2 border-b-emerald-500"
                  : "text-slate-700 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400"
              }`}
            >
              Schedule
            </Link>

            <Link
              href="/profile"
              className={`font-medium transition ${
                isActive("/profile")
                  ? "text-emerald-700 dark:text-emerald-400 border-b-2 border-b-emerald-500"
                  : "text-slate-700 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400"
              }`}
            >
              Profile
            </Link>

            <Link
              href="/settings"
              className={`font-medium transition ${
                isActive("/settings")
                  ? "text-emerald-700 dark:text-emerald-400 border-b-2 border-b-emerald-500"
                  : "text-slate-700 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400"
              }`}
            >
              Settings
            </Link>
              </div>
            </div>
          </div>
      </div>
    </nav>
  );
}
