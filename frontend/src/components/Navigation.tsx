"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";







export default function Navigation() {

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
    })
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setIsLoggedIn(!!session);
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  async function logout() {
    await supabase.auth.signOut();
    router.push("/auth");
  }



  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-md shadow-sm border-b border-white/40 dark:border-slate-700/40 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 py-4">
        <div className="flex items-center">
          {/* Logo */}
          <Link href="/" className="text-4xl font-bold text-blue-800 dark:text-blue-500 flex-shrink-0">
            11PLANNER
          </Link>

          {/* Navigation Links */}
          <div className="flex-1 flex justify-center">
            <div className="flex gap-8 items-center">
              <Link
                href="/"
                className={`font-medium transition ${isActive("/")
                  ? "text-blue-600 dark:text-blue-400 border-b-2 border-b-blue-600 dark:border-b-blue-400"
                  : "text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400"
                  }`}
              >
                Home
              </Link>

              {isLoggedIn && (
                <>
                  <Link
                    href="/dashboard"
                    className={`font-medium transition ${isActive("/dashboard")
                      ? "text-blue-600 dark:text-blue-400 border-b-2 border-b-blue-600 dark:border-b-blue-400"
                      : "text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400"
                      }`}
                  >
                    Dashboard
                  </Link>

                  <Link
                    href="/tasks"
                    className={`font-medium transition ${isActive("/tasks")
                      ? "text-blue-600 dark:text-blue-400 border-b-2 border-b-blue-600 dark:border-b-blue-400"
                      : "text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400"
                      }`}
                  >
                    Tasks
                  </Link>

                  <Link
                    href="/courses"
                    className={`font-medium transition ${isActive("/courses")
                      ? "text-blue-600 dark:text-blue-400 border-b-2 border-b-blue-600 dark:border-b-blue-400"
                      : "text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400"
                      }`}
                  >
                    Courses
                  </Link>

                  <Link
                    href="/schedule"
                    className={`font-medium transition ${isActive("/schedule")
                      ? "text-blue-600 dark:text-blue-400 border-b-2 border-b-blue-600 dark:border-b-blue-400"
                      : "text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400"
                      }`}
                  >
                    Schedule
                  </Link>

                  <Link
                    href="/profile"
                    className={`font-medium transition ${isActive("/profile")
                      ? "text-blue-600 dark:text-blue-400 border-b-2 border-b-blue-600 dark:border-b-blue-400"
                      : "text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400"
                      }`}
                  >
                    Profile
                  </Link>

                  <Link
                    href="/settings"
                    className={`font-medium transition ${isActive("/settings")
                      ? "text-blue-600 dark:text-blue-400 border-b-2 border-b-blue-600 dark:border-b-blue-400"
                      : "text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400"
                      }`}
                  >
                    Settings
                  </Link>
                </>
              )}

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
                  className={`font-medium transition ${isActive("/auth")
                    ? "text-slate-900 dark:text-white border-b-2 border-b-white"
                    : "text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
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
