"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/contexts/ThemeContext";

export default function Navigation() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [userInitials, setUserInitials] = useState("");
  const router = useRouter();
  const { setTheme, setColorTheme } = useTheme();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
      if (session) {
        const email = session.user?.email || "";
        const initial = email.charAt(0).toUpperCase();
        setUserInitials(initial);
      }
    });
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setIsLoggedIn(!!session);
      if (session) {
        const email = session.user?.email || "";
        const initial = email.charAt(0).toUpperCase();
        setUserInitials(initial);
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  async function logout() {
    try {
      localStorage.setItem("colorTheme", "emerald");
      localStorage.removeItem("theme");
      document.documentElement.setAttribute("data-theme", "emerald");
      document.documentElement.removeAttribute("class");
      if (document.body) {
        document.body.setAttribute("data-theme", "emerald");
        document.body.removeAttribute("class");
      }
      setTheme("light");
      setColorTheme("emerald");
    } catch {
      // Ignore client storage failures and continue sign out.
    }
    await supabase.auth.signOut();
    router.push("/auth");
  }

  const pathname = usePathname();
  const isActive = (path: string) => pathname === path;

  return (
    <nav
      data-dashboard-nav="true"
      className="relative bg-white/60 dark:bg-slate-800/60 backdrop-blur-md shadow-sm border-b border-white/40 dark:border-slate-700/40 sticky top-0 z-50 transition-transform transition-opacity duration-500 ease-out"
    >
      <div className="max-w-6xl mx-auto px-4 md:px-6 h-16 md:h-16">
        <div className="flex items-center justify-between h-full">
          {/* Logo */}
          <div className="absolute left-24 top-1/2 -translate-y-1/2 z-50 flex items-center h-full w-fit">
            <Link
              href={isLoggedIn ? "/dashboard" : "/"}
              className="absolute inset-0 z-10"
              aria-label={isLoggedIn ? "Go to dashboard" : "Go to home page"}
            />
            <Image
              src="/images/logo.png"
              alt="11Planner Logo"
              width={224}
              height={112}
              className="h-28 w-auto pointer-events-none relative z-0 translate-y-1"
            />
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
              {!isLoggedIn && (
                <Link
                  href="/"
                  className={`font-medium transition ${isActive("/")
                    ? "text-emerald-600 dark:text-emerald-400 border-b-2 border-b-emerald-600 dark:border-b-emerald-400"
                    : "text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400"
                    }`}
                >
                  Home
                </Link>
              )}

              {!isLoggedIn && (
                <Link
                  href="/demo"
                  className={`font-medium transition ${isActive("/demo")
                    ? "text-emerald-600 dark:text-emerald-400 border-b-2 border-b-emerald-600 dark:border-b-emerald-400"
                    : "text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400"
                    }`}
                >
                  Demo
                </Link>
              )}

              {!isLoggedIn && (
                <Link
                  href="/about"
                  className={`font-medium transition ${isActive("/about")
                    ? "text-emerald-600 dark:text-emerald-400 border-b-2 border-b-emerald-600 dark:border-b-emerald-400"
                    : "text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400"
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
                </>
              )}
            </div>
          </div>

          {/* User Dropdown / Login Button - Desktop */}
          <div className="hidden lg:flex items-center absolute right-24 top-1/2 -translate-y-1/2 z-50">
            {isLoggedIn ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                  className="flex items-center justify-center w-11 h-11 rounded-full border-2 bg-white dark:bg-slate-900 font-bold shadow-md hover:shadow-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent)]"
                  style={{
                    borderColor: "var(--theme-accent)",
                    color: "var(--theme-accent-strong)",
                    boxShadow: "0 6px 20px -14px var(--theme-accent-strong)",
                  }}
                  aria-label="Open user menu"
                >
                  <span className="text-lg select-none">{userInitials}</span>
                </button>
                
                {isUserDropdownOpen && (
                  <div className="absolute right-0 mt-3 w-56 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 z-50 overflow-hidden animate-fadeIn">
                    <div className="py-2">
                      <Link
                        href="/profile"
                        onClick={() => setIsUserDropdownOpen(false)}
                        className="flex items-center gap-3 px-5 py-3 text-slate-800 dark:text-slate-100 hover:bg-emerald-50 dark:hover:bg-slate-700/60 text-base font-medium transition group"
                      >
                        <span className="material-symbols-outlined text-xl text-emerald-500 group-hover:scale-110 transition">person</span>
                        Profile
                      </Link>
                      <Link
                        href="/settings"
                        onClick={() => setIsUserDropdownOpen(false)}
                        className="flex items-center gap-3 px-5 py-3 text-slate-800 dark:text-slate-100 hover:bg-emerald-50 dark:hover:bg-slate-700/60 text-base font-medium transition group"
                      >
                        <span className="material-symbols-outlined text-xl text-emerald-500 group-hover:scale-110 transition">settings</span>
                        Settings
                      </Link>
                      <Link
                        href="/settings?panel=reminders"
                        onClick={() => setIsUserDropdownOpen(false)}
                        className="flex items-center gap-3 px-5 py-3 text-slate-800 dark:text-slate-100 hover:bg-emerald-50 dark:hover:bg-slate-700/60 text-base font-medium transition group"
                      >
                        <span className="material-symbols-outlined text-xl text-emerald-500 group-hover:scale-110 transition">notifications</span>
                        Notifications & Reminders
                      </Link>
                    </div>
                    <div className="border-t border-slate-100 dark:border-slate-700">
                      <button
                        onClick={() => {
                          logout();
                          setIsUserDropdownOpen(false);
                        }}
                        className="flex items-center gap-3 w-full text-left px-5 py-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 text-base font-semibold transition group"
                      >
                        <span className="material-symbols-outlined text-xl text-red-400 group-hover:scale-110 transition">logout</span>
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/auth"
                className={`font-medium transition px-3 ${isActive("/auth")
                  ? "text-emerald-600 dark:text-emerald-400 border-b-2 border-b-emerald-600 dark:border-b-emerald-400"
                  : "text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400"
                  }`}
              >
                Register/Login
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 pb-4 bg-white/70 dark:bg-slate-800/70 border-t border-white/40 dark:border-slate-700/40 rounded-b-lg">
            <div className="flex flex-col gap-3 pt-4 px-3">
              {!isLoggedIn && (
                <Link
                  href="/"
                  className={`block font-medium py-2 px-3 rounded transition ${isActive("/")
                    ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20"
                    : "text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-700/30"
                    }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Home
                </Link>
              )}

              {!isLoggedIn && (
                <Link
                  href="/demo"
                  className={`block font-medium py-2 px-3 rounded transition ${isActive("/demo")
                    ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20"
                    : "text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-700/30"
                    }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Demo
                </Link>
              )}

              {isLoggedIn && (
                <>
                  <Link
                    href="/dashboard"
                    className={`block font-medium py-2 px-3 rounded transition ${isActive("/dashboard")
                      ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20"
                      : "text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-700/30"
                      }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Dashboard
                  </Link>

                  <Link
                    href="/tasks"
                    className={`block font-medium py-2 px-3 rounded transition ${isActive("/tasks")
                      ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20"
                      : "text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-700/30"
                      }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Tasks
                  </Link>

                  <Link
                    href="/courses"
                    className={`block font-medium py-2 px-3 rounded transition ${isActive("/courses")
                      ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20"
                      : "text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-700/30"
                      }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Courses
                  </Link>

                  <Link
                    href="/schedule"
                    className={`block font-medium py-2 px-3 rounded transition ${isActive("/schedule")
                      ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20"
                      : "text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-700/30"
                      }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Schedule
                  </Link>
                </>
              )}

              {/* Mobile Logout/Login */}
              <div className="border-t border-white/20 dark:border-slate-700/40 pt-3 mt-2">
                {isLoggedIn ? (
                  <>
                    <Link
                      href="/profile"
                      className={`block font-medium py-2 px-3 rounded transition ${isActive("/profile")
                        ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20"
                        : "text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-700/30"
                        }`}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Profile
                    </Link>
                    <Link
                      href="/settings"
                      className={`block font-medium py-2 px-3 rounded transition ${isActive("/settings")
                        ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20"
                        : "text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-700/30"
                        }`}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Settings
                    </Link>
                    <Link
                      href="/settings?panel=reminders"
                      className={`block font-medium py-2 px-3 rounded transition ${pathname.startsWith("/settings")
                        ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20"
                        : "text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-700/30"
                        }`}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Notifications & Reminders
                    </Link>
                    <button
                      onClick={() => {
                        logout();
                        setIsMenuOpen(false);
                      }}
                      className="block w-full text-left font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 py-2 px-3 rounded transition hover:bg-slate-100 dark:hover:bg-slate-700/30"
                    >
                      Logout
                    </button>
                  </>
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
