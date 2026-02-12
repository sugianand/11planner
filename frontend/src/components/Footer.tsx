import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="w-full bg-white/60 dark:bg-slate-800/60 backdrop-blur-3xl py-10 px-6 border-t border-white/40 dark:border-slate-700/40">
      <div className="max-w-[1200px] mx-auto flex flex-col lg:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-900 dark:bg-slate-700 flex items-center justify-center">
            <span className="material-symbols-outlined text-white text-sm">calendar_today</span>
          </div>
          <h2 className="text-slate-900 dark:text-white text-xl font-bold tracking-tight">11 Planner</h2>
        </div>
        <div className="flex flex-wrap justify-center gap-8 text-sm font-semibold text-slate-900 dark:text-white">
          <Link className="hover:text-blue-600 dark:hover:text-blue-400 transition" href="/privacy">Privacy</Link>
          <Link className="hover:text-blue-600 dark:hover:text-blue-400 transition" href="/terms">Terms</Link>
          <Link className="hover:text-blue-600 dark:hover:text-blue-400 transition" href="/about">About Us</Link>
          <Link className="hover:text-blue-600 dark:hover:text-blue-400 transition" href="/support">Support</Link>
        </div>
        <div className="flex flex-col items-center lg:items-end gap-1">
          <p className="text-slate-900 dark:text-white text-sm font-semibold">© 2026 11 Planner. All rights reserved.</p>
          <p className="text-slate-700 dark:text-slate-200 text-sm italic">Work smarter, not harder.</p>
        </div>
      </div>
    </footer>
  );
}
