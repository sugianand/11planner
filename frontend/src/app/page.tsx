'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import Footer from "@/components/Footer";

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeDemoDay, setActiveDemoDay] = useState('Monday');
  const router = useRouter();

  const focusPillars = [
    {
      icon: 'target',
      title: 'Deadline Drift Control',
      body: 'We turn due dates into visible runway so every assignment starts earlier and ends calmer.',
      accent: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
    },
    {
      icon: 'schedule',
      title: 'Rhythm-Based Planning',
      body: 'Heavy work lands in high-energy windows and lighter tasks fill the edges of your day.',
      accent: 'bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300'
    },
    {
      icon: 'stacks',
      title: 'One-View Clarity',
      body: 'Courses, tasks, and schedule blocks stay aligned so you always know what matters next.',
      accent: 'bg-[#e8f6ea] dark:bg-emerald-900/30 text-[#166534] dark:text-emerald-300'
    }
  ];

  const workflow = [
    {
      step: '01',
      title: 'Bring in your real semester',
      body: 'Add syllabus and assignment data once so your plan starts from reality, not guesswork.'
    },
    {
      step: '02',
      title: 'Break tasks into 30-minute moves',
      body: 'Big projects become short, executable sessions distributed across your available time.'
    },
    {
      step: '03',
      title: 'Move forward without panic',
      body: 'Stay ahead of deadlines while keeping enough room for rest, revision, and life outside class.'
    }
  ];

  const demoSchedule: Record<string, Array<{ time: string; task: string; tag: string; tagColor: string }>> = {
    Monday: [
      { time: '4:00 PM', task: 'Read Biology Chapter 5', tag: 'Deep Work', tagColor: 'text-emerald-300' },
      { time: '4:30 PM', task: 'Summarize key diagrams', tag: 'Review', tagColor: 'text-sky-300' },
      { time: '8:00 PM', task: 'Draft English outline', tag: 'Writing', tagColor: 'text-amber-300' }
    ],
    Wednesday: [
      { time: '2:30 PM', task: 'Calculus problem set (Q1-Q6)', tag: 'Problem Solving', tagColor: 'text-sky-300' },
      { time: '7:00 PM', task: 'Chemistry flashcards', tag: 'Recall', tagColor: 'text-emerald-300' },
      { time: '9:00 PM', task: 'Upload discussion response', tag: 'Submission', tagColor: 'text-amber-300' }
    ],
    Friday: [
      { time: '3:00 PM', task: 'Lab reflection first draft', tag: 'Writing', tagColor: 'text-amber-300' },
      { time: '6:00 PM', task: 'Edit and final checks', tag: 'Polish', tagColor: 'text-emerald-300' },
      { time: '8:30 PM', task: 'Submit before deadline', tag: 'Done Early', tagColor: 'text-sky-300' }
    ]
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.push('/dashboard');
      }
      setIsLoggedIn(!!session);
    });
  }, [router]);

  useEffect(() => {
    const revealElements = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
    if (revealElements.length === 0) {
      return;
    }

    let scrollDirection: 'up' | 'down' = 'down';
    let previousScrollY = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      scrollDirection = currentScrollY < previousScrollY ? 'up' : 'down';
      previousScrollY = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const revealOnce = (entry.target as HTMLElement).dataset.revealOnce === 'true';

          if (entry.isIntersecting) {
            if (scrollDirection === 'up') {
              entry.target.classList.add('reveal-from-up');
              entry.target.classList.remove('reveal-from-down');
            } else {
              entry.target.classList.add('reveal-from-down');
              entry.target.classList.remove('reveal-from-up');
            }
            entry.target.classList.add('reveal-visible');
          } else {
            if (!revealOnce) {
              entry.target.classList.remove('reveal-visible');
            }
          }
        });
      },
      {
        threshold: 0,
        rootMargin: '-12% 0px -12% 0px'
      }
    );

    revealElements.forEach((element, index) => {
      element.style.setProperty('--reveal-delay', `${Math.min(index * 65, 420)}ms`);
      observer.observe(element);
    });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      observer.disconnect();
    };
  }, []);

  const handleStartClick = () => {
    if (isLoggedIn) {
      router.push('/dashboard');
    } else {
      router.push('/auth');
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="fixed inset-0 bg-focus-light dark:bg-focus-dark -z-20"></div>
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute -top-12 left-10 w-72 h-72 rounded-full bg-emerald-200/35 dark:bg-emerald-500/15 blur-3xl"></div>
        <div className="absolute right-[-4rem] top-32 w-96 h-96 rounded-full bg-[#b8d8ff]/35 dark:bg-sky-500/20 blur-3xl"></div>
        <div className="absolute bottom-[-5rem] left-1/4 w-80 h-80 rounded-full bg-[#c8f0d0]/25 dark:bg-emerald-500/15 blur-3xl"></div>
      </div>

      <main className="w-full max-w-[1220px] mx-auto px-5 md:px-7 mt-14 md:mt-20 mb-28 relative">
        <section className="grid lg:grid-cols-[1.2fr_0.8fr] gap-8 items-stretch">
          <div data-reveal data-reveal-once="true" className="rounded-[2.2rem] bg-[#f5fbf7]/85 dark:bg-slate-900/75 border border-emerald-100 dark:border-slate-700/70 shadow-[0_30px_80px_-35px_rgba(15,23,42,0.45)] p-8 md:p-12 backdrop-blur-sm">
            <p className="inline-flex items-center gap-2 text-[11px] font-black tracking-[0.16em] uppercase text-[#306844] dark:text-emerald-300 bg-white/70 dark:bg-slate-800/60 border border-emerald-100 dark:border-slate-600/70 rounded-full px-3 py-1.5">
              <span className="material-symbols-outlined text-sm">bolt</span>
              Semester Control Room
            </p>
            <h1 className="mt-5 text-5xl md:text-7xl font-black leading-[0.98] tracking-tight text-[#1f2937] dark:text-slate-100">
              Plan less.
              <br />
              <span className="text-[#306844] dark:text-emerald-300">Finish earlier.</span>
            </h1>
            <p className="mt-6 max-w-[640px] text-lg md:text-xl leading-relaxed text-slate-700 dark:text-slate-300 font-medium">
              11Planner turns syllabus chaos into a weekly execution map so you can stay ahead without living in last-minute mode.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                onClick={handleStartClick}
                className="bg-[#1f2937] dark:bg-slate-100 text-white dark:text-slate-900 px-9 py-4 rounded-pill text-base md:text-lg font-black shadow-lg hover:translate-y-[-1px] transition-transform"
              >
                Open My Planner
              </button>
              <button
                onClick={() => router.push('/about')}
                className="bg-white/70 dark:bg-slate-800/70 text-slate-900 dark:text-slate-100 border border-white/70 dark:border-slate-600 px-9 py-4 rounded-pill text-base md:text-lg font-bold hover:bg-white dark:hover:bg-slate-700 transition-colors"
              >
                Product Tour
              </button>
            </div>

            <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3">
              <div data-reveal data-reveal-once="true" className="rounded-2xl bg-white/70 dark:bg-slate-800/70 px-4 py-3 border border-white/70 dark:border-slate-700/70">
                <p className="text-[11px] uppercase tracking-widest text-slate-500 dark:text-slate-400">Block Unit</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white">30m</p>
              </div>
              <div data-reveal data-reveal-once="true" className="rounded-2xl bg-white/70 dark:bg-slate-800/70 px-4 py-3 border border-white/70 dark:border-slate-700/70">
                <p className="text-[11px] uppercase tracking-widest text-slate-500 dark:text-slate-400">Course Load</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white">Synced</p>
              </div>
              <div data-reveal data-reveal-once="true" className="rounded-2xl bg-white/70 dark:bg-slate-800/70 px-4 py-3 border border-white/70 dark:border-slate-700/70">
                <p className="text-[11px] uppercase tracking-widest text-slate-500 dark:text-slate-400">Task Signal</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white">Clear</p>
              </div>
              <div data-reveal data-reveal-once="true" className="rounded-2xl bg-white/70 dark:bg-slate-800/70 px-4 py-3 border border-white/70 dark:border-slate-700/70">
                <p className="text-[11px] uppercase tracking-widest text-slate-500 dark:text-slate-400">Stress Level</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white">Lower</p>
              </div>
            </div>
          </div>

          <aside data-reveal data-reveal-once="true" className="rounded-[2rem] bg-[#1f2937]/92 dark:bg-slate-950/92 text-slate-100 p-7 md:p-8 border border-slate-700/70 shadow-[0_30px_70px_-45px_rgba(0,0,0,0.9)]">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-300 font-bold">This Week Snapshot</p>
            <div className="mt-5 space-y-3">
              <div data-reveal data-reveal-once="true" className="rounded-2xl bg-white/10 border border-white/15 p-4">
                <p className="text-sm text-slate-300">Monday</p>
                <p className="text-xl font-black">Research Methods Reading</p>
                <p className="text-xs text-emerald-300 mt-1">2 blocks scheduled</p>
              </div>
              <div data-reveal data-reveal-once="true" className="rounded-2xl bg-white/10 border border-white/15 p-4">
                <p className="text-sm text-slate-300">Wednesday</p>
                <p className="text-xl font-black">Calculus Problem Set Draft</p>
                <p className="text-xs text-sky-300 mt-1">3 blocks scheduled</p>
              </div>
              <div data-reveal data-reveal-once="true" className="rounded-2xl bg-white/10 border border-white/15 p-4">
                <p className="text-sm text-slate-300">Friday</p>
                <p className="text-xl font-black">Lab Reflection Submission</p>
                <p className="text-xs text-orange-300 mt-1">1 block + final review</p>
              </div>
            </div>
            <div data-reveal data-reveal-once="true" className="mt-5 rounded-2xl border border-dashed border-slate-500/80 p-4 bg-white/5">
              <p className="text-sm text-slate-300">Planning principle</p>
              <p className="mt-1 text-base font-semibold">Keep tomorrow visible before today ends.</p>
            </div>
          </aside>
        </section>

        <section className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          {focusPillars.map((item) => (
            <article
              key={item.title}
              data-reveal
              data-reveal-once="true"
              className="rounded-[1.8rem] bg-white/70 dark:bg-slate-900/75 border border-white/65 dark:border-slate-700/60 p-7 shadow-sm backdrop-blur-sm hover:translate-y-[-2px] transition-transform"
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-5 ${item.accent}`}>
                <span className="material-symbols-outlined text-2xl">{item.icon}</span>
              </div>
              <h3 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">{item.title}</h3>
              <p className="mt-3 text-slate-700 dark:text-slate-300 leading-relaxed">{item.body}</p>
            </article>
          ))}
        </section>

        <section data-reveal className="mt-12 rounded-[2rem] bg-white/70 dark:bg-slate-900/75 border border-white/70 dark:border-slate-700/65 p-8 md:p-10 backdrop-blur-sm shadow-sm">
          <div className="flex items-center gap-2 text-xs tracking-[0.16em] uppercase font-bold text-emerald-700 dark:text-emerald-300">
            <span className="material-symbols-outlined text-sm">play_circle</span>
            Try Demo First
          </div>
          <div className="mt-4 grid lg:grid-cols-[1.05fr_0.95fr] gap-6 items-start">
            <div>
              <h2 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
                Try a sample week before creating an account.
              </h2>
              <p className="mt-3 text-slate-700 dark:text-slate-300 text-lg leading-relaxed max-w-xl">
                Click a day to preview how 11Planner breaks workload into focused blocks. If it feels right, save your own plan in one step.
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                {Object.keys(demoSchedule).map((day) => {
                  const isActive = activeDemoDay === day;
                  return (
                    <button
                      key={day}
                      onClick={() => setActiveDemoDay(day)}
                      className={`px-4 py-2 rounded-pill font-bold text-sm transition-colors border ${
                        isActive
                          ? 'bg-[#306844] text-white border-[#306844] dark:bg-[#3d8658] dark:border-[#3d8658]'
                          : 'bg-white/75 dark:bg-slate-800/75 text-slate-800 dark:text-slate-200 border-white/70 dark:border-slate-600/70 hover:bg-white dark:hover:bg-slate-700'
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  onClick={handleStartClick}
                  className="bg-[#306844] dark:bg-[#3d8658] text-white px-7 py-3 rounded-pill font-extrabold hover:opacity-90 transition-opacity"
                >
                  Save this as my plan
                </button>
                <button
                  onClick={() => router.push('/demo')}
                  className="bg-white/75 dark:bg-slate-800/75 border border-white/70 dark:border-slate-600/70 text-slate-900 dark:text-slate-100 px-7 py-3 rounded-pill font-bold hover:bg-white dark:hover:bg-slate-700 transition-colors"
                >
                  Open full demo
                </button>
              </div>
            </div>

            <div className="rounded-2xl bg-[#1f2937]/95 dark:bg-slate-950/95 border border-slate-700/70 p-5 md:p-6 text-slate-100">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-300 font-bold">Demo Planner - {activeDemoDay}</p>
              <div className="mt-4 space-y-3">
                {demoSchedule[activeDemoDay].map((block) => (
                  <article key={`${block.time}-${block.task}`} className="rounded-xl bg-white/10 border border-white/15 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-bold text-slate-200">{block.time}</p>
                      <p className={`text-xs font-bold uppercase tracking-wider ${block.tagColor}`}>{block.tag}</p>
                    </div>
                    <p className="mt-2 font-semibold text-slate-100">{block.task}</p>
                  </article>
                ))}
              </div>
              <p className="text-xs text-slate-300 mt-4">Preview mode only. Create an account to save and personalize your blocks.</p>
            </div>
          </div>
        </section>

        <section data-reveal className="mt-12 rounded-[2rem] bg-gradient-to-r from-[#1f2937]/95 via-[#0f172a]/95 to-[#1e5f3b]/95 text-slate-100 border border-slate-700/60 p-8 md:p-10 shadow-xl">
          <div className="flex items-center gap-2 text-xs tracking-[0.16em] uppercase font-bold text-emerald-200">
            <span className="material-symbols-outlined text-sm">conversion_path</span>
            How It Works In 3 Steps
          </div>
          <div className="mt-6 grid md:grid-cols-3 gap-5">
            {workflow.map((item) => (
              <article key={item.step} data-reveal className="rounded-2xl bg-white/10 border border-white/15 p-6">
                <p className="text-sm font-black tracking-[0.16em] text-emerald-200">STEP {item.step}</p>
                <h3 className="text-xl font-extrabold mt-2 mb-2">{item.title}</h3>
                <p className="text-slate-200 leading-relaxed">{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section data-reveal className="mt-12 text-center">
          <div data-reveal className="max-w-3xl mx-auto rounded-[2rem] bg-white/80 dark:bg-slate-900/80 border border-white/70 dark:border-slate-700/70 p-8 md:p-10 backdrop-blur-sm shadow-sm">
            <p className="text-xs uppercase tracking-[0.16em] font-black text-slate-500 dark:text-slate-300">Ready to switch from reactive planning to intentional planning?</p>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white mt-3">Make this your least chaotic semester yet.</h2>
            <p className="mt-4 text-slate-700 dark:text-slate-300 text-lg leading-relaxed max-w-2xl mx-auto">
              Start with one real week. Once you see your blocks, momentum becomes a system, not a mood.
            </p>
            <button
              onClick={handleStartClick}
              className="mt-7 bg-[#306844] dark:bg-[#3d8658] hover:opacity-90 text-white px-10 py-5 rounded-pill text-lg font-extrabold shadow-lg transition-all"
            >
              Start Planning
            </button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
