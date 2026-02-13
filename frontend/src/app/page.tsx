'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import Footer from "@/components/Footer";

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
    });
  }, []);

  const handleStartClick = () => {
    if (isLoggedIn) {
      router.push('/dashboard');
    } else {
      router.push('/auth');
    }
  };

  return (
    <div className="min-h-screen">
      <div className="fixed inset-0 bg-focus-light dark:bg-focus-dark -z-20"></div>

      <main className="w-full max-w-[1200px] mx-auto px-6 mt-16 md:mt-24 mb-32 relative">
        <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-3xl p-8 md:p-12 text-center relative overflow-hidden shadow-2xl dark:border dark:border-slate-700/50 max-w-4xl mx-auto">


          <div className="flex flex-col items-center gap-8 relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/40 dark:bg-slate-700/40 text-slate-800 dark:text-slate-200 text-xs font-bold uppercase tracking-widest border border-white/20 dark:border-slate-600/30">
              <span className="material-symbols-outlined text-sm">auto_awesome</span>
              Quietly Productive
            </div>
            <h1 className="text-slate-900 dark:text-white text-5xl md:text-7xl font-extrabold leading-[1.1] tracking-tight max-w-[800px]">
              Work at a slower, <br />
              <span className="text-slate-800 dark:text-slate-200 italic font-serif">smarter</span> pace.
            </h1>
            <p className="text-slate-700 dark:text-slate-300 text-xl font-medium leading-relaxed max-w-[620px]">
              11Planner is an intelligent academic dashboard that transforms overwhelming syllabi into actionable 30-minute focus blocks to eliminate procrastination.
            </p>
            <div className="flex justify-center mt-4">
              <button
                onClick={handleStartClick}
                className="bg-[#306844] dark:bg-[#3d8658] hover:opacity-90 text-white px-10 py-5 rounded-pill text-lg font-extrabold shadow-lg transition-all transform hover:scale-105"
              >
                Start now →
              </button>
            </div>
          </div>
        </div>

        <section className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-3xl p-10 shadow-sm border border-white/40 dark:border-slate-700/40 hover:bg-white/80 dark:hover:bg-slate-700/80 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-6">
              <span className="material-symbols-outlined text-2xl">calendar_month</span>
            </div>
            <h3 className="text-slate-900 dark:text-white text-xl font-bold mb-3">Beat the 11:59 Rush</h3>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              Never submit at the last minute again. Smart scheduling ensures you complete assignments well before the 11:59pm deadline.
            </p>
          </div>
          <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-3xl p-10 shadow-sm border border-white/40 dark:border-slate-700/40 hover:bg-white/80 dark:hover:bg-slate-700/80 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-6">
              <span className="material-symbols-outlined text-2xl">energy_savings_leaf</span>
            </div>
            <h3 className="text-slate-900 dark:text-white text-xl font-bold mb-3">Energy Budgeting</h3>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              Plan tasks based on your energy levels. High focus for deep work, low focus for admin.
            </p>
          </div>
          <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-3xl p-10 shadow-sm border border-white/40 dark:border-slate-700/40 hover:bg-white/80 dark:hover:bg-slate-700/80 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-6">
              <span className="material-symbols-outlined text-2xl">visibility</span>
            </div>
            <h3 className="text-slate-900 dark:text-white text-xl font-bold mb-3">Visual Clarity</h3>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              Minimalist interface designed to reduce cognitive load and prevent digital overwhelm.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
