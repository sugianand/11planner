"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { supabase } from "@/app/auth/supabaseClient";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";







export default function Navigation() {

      const [isLoggedIn, setIsLoggedIn] = useState(false);
      const router = useRouter();

      useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
          setIsLoggedIn(!!data.session);
        })
        const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
          setIsLoggedIn(!!session);
        });

        return () => {
          authListener?.subscription.unsubscribe();
        };
      }, []);

      async function logout(){
        await supabase.auth.signOut();
        router.push("/auth");
      }



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

              {isLoggedIn ? (
                <button
                  onClick={logout}
                  className="font-medium text-slate-700 dark:text-slate-300 hover:text-red-600 transition"
                >
                  Logout
                </button>
              ) : (
                <Link
                  href="/auth"
                  className={`font-medium transition ${
                    isActive("/auth")
                  ? "text-blue-600 dark:text-blue-400 border-b-2 border-b-blue-600 dark:border-b-blue-400"
                  : "text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400"
                  }`}
                >
                  Login
                </Link>
              )}


              
              </div>
            </div>
          </div>
      </div>
    </nav>
  );
}
