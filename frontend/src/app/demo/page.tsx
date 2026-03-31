"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Footer from "@/components/Footer";

type DemoBlock = {
  id: string;
  title: string;
  course: string;
  duration: string;
  status: "Todo" | "In Progress" | "Done";
};

export default function DemoPage() {
  const [day, setDay] = useState<"Monday" | "Wednesday" | "Friday">("Monday");
  const [statusFilter, setStatusFilter] = useState<"All" | DemoBlock["status"]>("All");
  const [courseFilter, setCourseFilter] = useState<string>("All Courses");
  const [blocks, setBlocks] = useState<Record<string, DemoBlock[]>>({
    Monday: [
      { id: "m1", title: "Read Chapter 5", course: "Biology", duration: "30m", status: "Todo" },
      { id: "m2", title: "Solve Q1-Q4", course: "Calculus", duration: "30m", status: "In Progress" },
      { id: "m3", title: "Outline reflection", course: "Lab", duration: "30m", status: "Done" }
    ],
    Wednesday: [
      { id: "w1", title: "Draft discussion post", course: "English", duration: "30m", status: "Todo" },
      { id: "w2", title: "Chem flashcards", course: "Chemistry", duration: "30m", status: "In Progress" },
      { id: "w3", title: "Review lecture notes", course: "Biology", duration: "30m", status: "Done" }
    ],
    Friday: [
      { id: "f1", title: "Edit lab report", course: "Lab", duration: "30m", status: "Todo" },
      { id: "f2", title: "Practice quiz set", course: "Calculus", duration: "30m", status: "In Progress" },
      { id: "f3", title: "Submit assignment", course: "English", duration: "30m", status: "Done" }
    ]
  });

  const selectedBlocks = blocks[day];

  const courseOptions = useMemo(() => {
    const unique = Array.from(new Set(selectedBlocks.map((item) => item.course)));
    return ["All Courses", ...unique];
  }, [selectedBlocks]);

  const stats = useMemo(() => {
    const done = selectedBlocks.filter((b) => b.status === "Done").length;
    const inProgress = selectedBlocks.filter((b) => b.status === "In Progress").length;
    const todo = selectedBlocks.filter((b) => b.status === "Todo").length;
    const total = selectedBlocks.length;
    const completion = total === 0 ? 0 : Math.round((done / total) * 100);
    return { done, inProgress, todo, completion, total };
  }, [selectedBlocks]);

  const visibleBlocks = useMemo(() => {
    return selectedBlocks.filter((block) => {
      const statusMatches = statusFilter === "All" ? true : block.status === statusFilter;
      const courseMatches = courseFilter === "All Courses" ? true : block.course === courseFilter;
      return statusMatches && courseMatches;
    });
  }, [selectedBlocks, statusFilter, courseFilter]);

  const cycleStatus = (id: string) => {
    setBlocks((prev) => {
      const list = prev[day].map((item) => {
        if (item.id !== id) {
          return item;
        }

        const nextStatus: DemoBlock["status"] =
          item.status === "Todo" ? "In Progress" : item.status === "In Progress" ? "Done" : "Todo";

        return { ...item, status: nextStatus };
      });

      return { ...prev, [day]: list };
    });
  };

  const resetCurrentDay = () => {
    setBlocks((prev) => {
      const resetList = prev[day].map((item) => ({ ...item, status: "Todo" as const }));
      return { ...prev, [day]: resetList };
    });
  };

  const statusClass = (status: DemoBlock["status"]) => {
    if (status === "Done") {
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300";
    }
    if (status === "In Progress") {
      return "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300";
    }
    return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300";
  };

  useEffect(() => {
    const revealElements = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
    if (revealElements.length === 0) {
      return;
    }

    revealElements.forEach((element, index) => {
      element.style.setProperty('--reveal-delay', `${Math.min(index * 55, 360)}ms`);
      element.classList.add('reveal-from-down');
    });

    requestAnimationFrame(() => {
      revealElements.forEach((element) => {
        element.classList.add('reveal-visible');
      });
    });
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden transition-colors duration-500 pb-0">
      <div className="fixed inset-0 bg-focus-light dark:bg-focus-dark -z-20"></div>
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute top-8 left-8 h-72 w-72 rounded-full bg-emerald-200/35 dark:bg-emerald-500/15 blur-3xl" />
        <div className="absolute right-[-4rem] top-1/3 h-96 w-96 rounded-full bg-sky-200/30 dark:bg-sky-500/15 blur-3xl" />
      </div>

      <main className="w-full max-w-[1200px] mx-auto px-6 py-16">
        <section data-reveal data-reveal-once="true" className="bg-white/70 dark:bg-slate-900/70 border border-white/50 dark:border-slate-700/60 rounded-3xl shadow-xl p-7 md:p-10 backdrop-blur-sm">
          <div data-reveal data-reveal-once="true" className="flex flex-wrap items-center justify-between gap-4">
            <div data-reveal data-reveal-once="true">
              <p className="text-xs tracking-[0.16em] uppercase font-bold text-emerald-700 dark:text-emerald-300">Demo Mode</p>
              <h1 className="mt-2 text-3xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight">Try the planner before signup</h1>
              <p className="mt-3 text-slate-700 dark:text-slate-300 max-w-2xl">
                This sandbox simulates a real week. Click any task card to cycle status and see how a focused plan feels in practice.
              </p>
            </div>
            <Link
              href="/auth"
              className="inline-flex items-center gap-2 bg-[#306844] dark:bg-[#3d8658] text-white px-6 py-3 rounded-pill font-bold hover:opacity-90 transition-opacity"
            >
              Start with my account
              <span className="material-symbols-outlined text-base">arrow_forward</span>
            </Link>
          </div>

          <div data-reveal data-reveal-once="true" className="mt-7 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {(["Monday", "Wednesday", "Friday"] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setDay(item)}
                className={`rounded-2xl border px-4 py-3 text-left transition-colors ${
                  day === item
                    ? "bg-[#306844] text-white border-[#306844] dark:bg-[#3d8658] dark:border-[#3d8658]"
                    : "bg-white/75 dark:bg-slate-800/70 border-white/70 dark:border-slate-700/70 text-slate-900 dark:text-slate-100 hover:bg-white dark:hover:bg-slate-700"
                }`}
              >
                <p className="text-xs uppercase tracking-widest opacity-85">Demo Day</p>
                <p className="text-xl font-extrabold">{item}</p>
              </button>
            ))}
          </div>

          <div data-reveal data-reveal-once="true" className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={resetCurrentDay}
              className="inline-flex items-center gap-2 bg-white/80 dark:bg-slate-800/80 border border-white/70 dark:border-slate-600/70 text-slate-900 dark:text-slate-100 px-4 py-2 rounded-pill font-semibold hover:bg-white dark:hover:bg-slate-700 transition-colors"
            >
              <span className="material-symbols-outlined text-base">restart_alt</span>
              Reset Day
            </button>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Click any card to cycle status: <span className="font-semibold">Todo → In Progress → Done</span>
            </p>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div data-reveal data-reveal-once="true" className="rounded-2xl bg-white/75 dark:bg-slate-800/65 border border-white/70 dark:border-slate-700/60 p-4">
              <p className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">Todo</p>
              <p className="text-3xl font-black text-slate-900 dark:text-white">{stats.todo}</p>
            </div>
            <div data-reveal data-reveal-once="true" className="rounded-2xl bg-white/75 dark:bg-slate-800/65 border border-white/70 dark:border-slate-700/60 p-4">
              <p className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">In Progress</p>
              <p className="text-3xl font-black text-slate-900 dark:text-white">{stats.inProgress}</p>
            </div>
            <div data-reveal data-reveal-once="true" className="rounded-2xl bg-white/75 dark:bg-slate-800/65 border border-white/70 dark:border-slate-700/60 p-4">
              <p className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">Done</p>
              <p className="text-3xl font-black text-slate-900 dark:text-white">{stats.done}</p>
            </div>
          </div>

          <div data-reveal data-reveal-once="true" className="mt-4 rounded-2xl bg-white/75 dark:bg-slate-800/65 border border-white/70 dark:border-slate-700/60 p-4">
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Daily completion</p>
              <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">{stats.completion}%</p>
            </div>
            <div className="mt-3 h-2.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
                style={{ width: `${stats.completion}%` }}
              ></div>
            </div>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{stats.done} of {stats.total} blocks completed</p>
          </div>

          <div data-reveal data-reveal-once="true" className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="rounded-2xl bg-white/75 dark:bg-slate-800/65 border border-white/70 dark:border-slate-700/60 p-4">
              <p className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">Filter by status</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {(["All", "Todo", "In Progress", "Done"] as const).map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setStatusFilter(status)}
                    className={`px-3 py-1.5 rounded-pill text-sm font-semibold border transition-colors ${
                      statusFilter === status
                        ? "bg-[#306844] text-white border-[#306844] dark:bg-[#3d8658] dark:border-[#3d8658]"
                        : "bg-white/80 dark:bg-slate-700/80 border-white/70 dark:border-slate-600/70 text-slate-800 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-600"
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl bg-white/75 dark:bg-slate-800/65 border border-white/70 dark:border-slate-700/60 p-4">
              <p className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">Filter by course</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {courseOptions.map((course) => (
                  <button
                    key={course}
                    type="button"
                    onClick={() => setCourseFilter(course)}
                    className={`px-3 py-1.5 rounded-pill text-sm font-semibold border transition-colors ${
                      courseFilter === course
                        ? "bg-[#1f2937] text-white border-[#1f2937] dark:bg-slate-100 dark:text-slate-900 dark:border-slate-100"
                        : "bg-white/80 dark:bg-slate-700/80 border-white/70 dark:border-slate-600/70 text-slate-800 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-600"
                    }`}
                  >
                    {course}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {visibleBlocks.map((block) => (
              <button
                key={block.id}
                type="button"
                onClick={() => cycleStatus(block.id)}
                className="text-left rounded-2xl bg-white/80 dark:bg-slate-800/70 border border-white/70 dark:border-slate-700/60 p-5 hover:-translate-y-0.5 hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">{block.course}</p>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${statusClass(block.status)}`}>{block.status}</span>
                </div>
                <h2 className="mt-2 text-lg font-extrabold text-slate-900 dark:text-white">{block.title}</h2>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Duration: {block.duration}</p>
                <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">Click card to cycle status</p>
              </button>
            ))}
          </div>

          {visibleBlocks.length === 0 && (
            <div data-reveal data-reveal-once="true" className="mt-5 rounded-2xl border border-dashed border-slate-300 dark:border-slate-600 p-6 text-center text-slate-600 dark:text-slate-300">
              No blocks match your filters. Try a different status or course filter.
            </div>
          )}

          {stats.done === stats.total && (
            <div data-reveal data-reveal-once="true" className="mt-5 rounded-2xl bg-emerald-100/80 dark:bg-emerald-900/25 border border-emerald-200 dark:border-emerald-800/40 p-5">
              <p className="font-bold text-emerald-800 dark:text-emerald-200">Demo milestone unlocked: All blocks completed for {day}.</p>
              <p className="mt-1 text-sm text-emerald-700 dark:text-emerald-300">This is what a low-stress completion day looks like. Create an account to build your real week.</p>
            </div>
          )}

          <div data-reveal data-reveal-once="true" className="mt-8 rounded-2xl bg-emerald-50/75 dark:bg-emerald-900/15 border border-emerald-100 dark:border-emerald-800/40 p-5">
            <p className="text-slate-800 dark:text-slate-200 leading-relaxed">
              Like this workflow? Create an account to import your real courses, auto-generate weekly focus blocks, and keep your progress synced.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href="/"
                className="inline-flex items-center gap-2 bg-white/80 dark:bg-slate-800/80 border border-white/70 dark:border-slate-600/70 text-slate-900 dark:text-slate-100 px-6 py-3 rounded-pill font-bold hover:bg-white dark:hover:bg-slate-700 transition-colors"
              >
                Back to home
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
