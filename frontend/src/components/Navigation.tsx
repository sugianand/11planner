"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";




export default function Navigation() {

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
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
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-3 md:py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div>
            <Link href="/" className="text-2xl md:text-4xl font-bold text-emerald-700 dark:text-emerald-500 flex-shrink-0">
              11PLANNER
            </Link>
          </div>

          {/* Hamburger Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden flex flex-col gap-1.5 p-2"
            aria-label="Toggle menu"
          >
            <span className={`w-6 h-0.5 bg-slate-700 dark:bg-slate-300 transition-all ${isMenuOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
            <span className={`w-6 h-0.5 bg-slate-700 dark:bg-slate-300 transition-all ${isMenuOpen ? 'opacity-0' : ''}`}></span>
            <span className={`w-6 h-0.5 bg-slate-700 dark:bg-slate-300 transition-all ${isMenuOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
          </button>

          {/* Navigation Links - Desktop */}
          <div className="hidden lg:flex flex-1 justify-center">
            <div className="flex gap-6 lg:gap-8 items-center">
              <Link
                href="/"
                className={`font-medium transition ${isActive("/")
                  ? "text-emerald-600 dark:text-emerald-400 border-b-2 border-b-emerald-600 dark:border-b-emerald-400"
                  : "text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400"
                  }`}
              >
                Home
              </Link>

              {!isLoggedIn && (
                <Link
                  href="/about"
                  className={`font-medium transition ${isActive("/about")
                    ? "text-blue-600 dark:text-blue-400 border-b-2 border-b-blue-600 dark:border-b-blue-400"
                    : "text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400"
                    }`}
                >
                  About Us
                </Link>
              )}

              {isLoggedIn && (
                <>
                  <Link
                    href="/dashboard"
                    className={`font-medium transition ${isActive("/dashboard")
                      ? "text-emerald-600 dark:text-emerald-400 border-b-2 border-b-emerald-600 dark:border-b-emerald-400"
                      : "text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400"
                      }`}
                  >
                    Dashboard
                  </Link>

                  <Link
                    href="/tasks"
                    className={`font-medium transition ${isActive("/tasks")
                      ? "text-emerald-600 dark:text-emerald-400 border-b-2 border-b-emerald-600 dark:border-b-emerald-400"
                      : "text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400"
                      }`}
                  >
                    Tasks
                  </Link>

                  <Link
                    href="/courses"
                    className={`font-medium transition ${isActive("/courses")
                      ? "text-emerald-600 dark:text-emerald-400 border-b-2 border-b-emerald-600 dark:border-b-emerald-400"
                      : "text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400"
                      }`}
                  >
                    Courses
                  </Link>

                  <Link
                    href="/schedule"
                    className={`font-medium transition ${isActive("/schedule")
                      ? "text-emerald-600 dark:text-emerald-400 border-b-2 border-b-emerald-600 dark:border-b-emerald-400"
                      : "text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400"
                      }`}
                  >
                    Schedule
                  </Link>

                  <Link
                    href="/profile"
                    className={`font-medium transition ${isActive("/profile")
                      ? "text-emerald-600 dark:text-emerald-400 border-b-2 border-b-emerald-600 dark:border-b-emerald-400"
                      : "text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400"
                      }`}
                  >
                    Profile
                  </Link>

                  <Link
                    href="/settings"
                    className={`font-medium transition ${isActive("/settings")
                      ? "text-emerald-600 dark:text-emerald-400 border-b-2 border-b-emerald-600 dark:border-b-emerald-400"
                      : "text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400"
                      }`}
                  >
                    Settings
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Logout/Login Button - Desktop */}
          <div className="hidden lg:flex ml-auto">
            {isLoggedIn ? (
              <button
                onClick={logout}
                className="font-medium text-slate-700 dark:text-slate-300 hover:text-red-600 transition px-3"
              >
                Logout
              </button>
            ) : (
              <Link
                href="/auth"
                className={`font-medium transition px-3 ${isActive("/auth")
                  ? "text-emerald-600 dark:text-emerald-400 border-b-2 border-b-emerald-600 dark:border-b-emerald-400"
                  : "text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400"
                  }`}
              >
                Login
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-white/20 dark:border-slate-700/40">
            <div className="flex flex-col gap-3 pt-4">
              <Link
                href="/"
                className={`block font-medium py-2 px-3 rounded transition ${isActive("/")
                  ? "text-blue-600 dark:text-blue-400 bg-emerald-50 dark:bg-emerald-900/20"
                  : "text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-700/30"
                  }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>

              {isLoggedIn && (
                <>
                  <Link
                    href="/dashboard"
                    className={`block font-medium py-2 px-3 rounded transition ${isActive("/dashboard")
                      ? "text-blue-600 dark:text-blue-400 bg-emerald-50 dark:bg-emerald-900/20"
                      : "text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-700/30"
                      }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Dashboard
                  </Link>

                  <Link
                    href="/tasks"
                    className={`block font-medium py-2 px-3 rounded transition ${isActive("/tasks")
                      ? "text-blue-600 dark:text-blue-400 bg-emerald-50 dark:bg-emerald-900/20"
                      : "text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-700/30"
                      }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Tasks
                  </Link>

                  <Link
                    href="/courses"
                    className={`block font-medium py-2 px-3 rounded transition ${isActive("/courses")
                      ? "text-blue-600 dark:text-blue-400 bg-emerald-50 dark:bg-emerald-900/20"
                      : "text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-700/30"
                      }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Courses
                  </Link>

                  <Link
                    href="/schedule"
                    className={`block font-medium py-2 px-3 rounded transition ${isActive("/schedule")
                      ? "text-blue-600 dark:text-blue-400 bg-emerald-50 dark:bg-emerald-900/20"
                      : "text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-700/30"
                      }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Schedule
                  </Link>

                  <Link
                    href="/profile"
                    className={`block font-medium py-2 px-3 rounded transition ${isActive("/profile")
                      ? "text-blue-600 dark:text-blue-400 bg-emerald-50 dark:bg-emerald-900/20"
                      : "text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-700/30"
                      }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Profile
                  </Link>

                  <Link
                    href="/settings"
                    className={`block font-medium py-2 px-3 rounded transition ${isActive("/settings")
                      ? "text-blue-600 dark:text-blue-400 bg-emerald-50 dark:bg-emerald-900/20"
                      : "text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-700/30"
                      }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Settings
                  </Link>
                </>
              )}

              {/* Mobile Logout/Login */}
              <div className="border-t border-white/20 dark:border-slate-700/40 pt-3 mt-2">
                {isLoggedIn ? (
                  <button
                    onClick={() => {
                      logout();
                      setIsMenuOpen(false);
                    }}
                    className="block w-full text-left font-medium text-slate-700 dark:text-slate-300 hover:text-red-600 py-2 px-3 rounded transition hover:bg-slate-100 dark:hover:bg-slate-700/30"
                  >
                    Logout
                  </button>
                ) : (
                  <Link
                    href="/auth"
                    className={`block font-medium py-2 px-3 rounded transition ${isActive("/auth")
                      ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20"
                      : "text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-700/30"
                      }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Login
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
