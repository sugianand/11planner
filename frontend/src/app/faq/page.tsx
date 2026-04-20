"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Footer from "@/components/Footer";
import { usePlanner } from "@/contexts/PlannerContext";

export default function FaqPage() {
  const { userId } = usePlanner();
  const isLoggedIn = userId !== "user_demo";
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  useEffect(() => {
    const revealElements = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
    if (revealElements.length === 0) {
      return;
    }
    revealElements.forEach((element, index) => {
      element.style.setProperty('--reveal-delay', `${Math.min(index * 50, 320)}ms`);
      element.classList.add('reveal-from-down');
    });

    requestAnimationFrame(() => {
      revealElements.forEach((element) => {
        element.classList.add('reveal-visible');
      });
    });

    return () => {
      // No cleanup required for one-time reveal.
    };
  }, []);

  const faqItems = [
    {
      question: "What exactly does 11Planner do that a normal to-do list does not?",
      answer:
        "11Planner is built for academic planning, not just task tracking. It breaks large assignments into time-boxed focus blocks, distributes them across your available week, and helps you finish before deadline pressure builds. A normal to-do list tells you what exists. 11Planner helps you decide what to do next and when to do it."
    },
    {
      question: "Do I need to upload a syllabus before I can use 11Planner?",
      answer:
        "No. You can start immediately by creating courses and tasks manually. Syllabus upload is optional and can be added later. Many users begin manually for week one, then import more detailed course data once they are comfortable with the workflow."
    },
    {
      question: "Can I edit the schedule after blocks are generated?",
      answer:
        "Yes. Generated blocks are fully editable. You can move, resize, split, or remove blocks to fit your energy and availability. The scheduler is meant to provide a strong first draft, not lock you into a rigid plan."
    },
    {
      question: "What happens if I miss a focus block or fall behind for a day?",
      answer:
        "Missing one block does not break your week. You can quickly reschedule unfinished work into open windows and continue. The system is designed around adjustment, so recovery is part of the workflow rather than a failure state."
    },
    {
      question: "Is my planning data sold, shared, or used for advertising?",
      answer:
        "11Planner does not sell your personal data. Limited data may be processed by essential service providers (for example hosting or analytics) only to run and improve the product. You can review full details in Privacy and request data deletion through support."
    },
    {
      question: "How long does setup take for a new user?",
      answer:
        "Most users can set up their first workable week in about 10 to 20 minutes. A quick setup usually includes adding current courses, entering the nearest deadlines, and generating the first set of focus blocks. You can refine details over time instead of doing everything on day one."
    },
    {
      question: "Does 11Planner replace my calendar app?",
      answer:
        "Not necessarily. 11Planner focuses on academic execution planning and workload visibility. Many users still keep their existing calendar for meetings, events, and personal commitments while using 11Planner to stay on top of coursework."
    },
    {
      question: "How quickly can I get support if something breaks?",
      answer:
        "Most support requests receive a response within 2-3 business days. To get help faster, include the page where the issue occurred, steps to reproduce, and screenshots or error text."
    }
  ];

  return (
    <div className="min-h-screen relative overflow-hidden transition-colors duration-500 pb-0">
      <div className="fixed inset-0 bg-focus-light dark:bg-focus-dark -z-20"></div>
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute top-10 left-10 h-72 w-72 rounded-full blur-3xl" style={{ backgroundColor: "var(--theme-accent-soft)" }} />
        <div className="absolute right-[-4rem] top-1/3 h-96 w-96 rounded-full bg-sky-200/25 dark:bg-sky-500/15 blur-3xl" />
      </div>

      <div className="max-w-4xl mx-auto p-6 lg:p-10 mt-16 mb-24">
        <div data-reveal data-reveal-once="true" className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-3xl shadow-sm p-6 md:p-10 border border-white/40 dark:border-slate-700/40 space-y-8">
          <div data-reveal data-reveal-once="true" className="mb-2 border-b border-slate-200/50 dark:border-slate-700/50 pb-6">
            <p className="text-sm font-semibold uppercase tracking-widest" style={{ color: "var(--theme-accent-strong)" }}>FAQ</p>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight mt-2">
              Answers before you sign up
            </h1>
            <p className="text-slate-600 dark:text-slate-300 mt-3 font-medium">
              Important questions on setup, flexibility, privacy, and support before you create an account.
            </p>
          </div>

          <section className="space-y-4">
            {faqItems.map((item, index) => {
              const isOpen = openIndex === index;

              return (
              <article
                key={item.question}
                data-reveal
                data-reveal-once="true"
                className="rounded-2xl bg-white/75 dark:bg-slate-800/65 border border-white/65 dark:border-slate-700/55 overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="w-full px-5 py-4 text-left flex items-center justify-between gap-3"
                  aria-expanded={isOpen}
                >
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">{item.question}</h2>
                  <span
                    className={`material-symbols-outlined text-slate-600 dark:text-slate-300 transition-transform duration-300 ${
                      isOpen ? "rotate-180" : "rotate-0"
                    }`}
                  >
                    expand_more
                  </span>
                </button>
                <div
                  className={`px-5 transition-all duration-300 ease-out ${
                    isOpen ? "max-h-96 pb-4 opacity-100" : "max-h-0 pb-0 opacity-0"
                  }`}
                >
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{item.answer}</p>
                </div>
              </article>
              );
            })}
          </section>

          <section
            data-reveal
            data-reveal-once="true"
            className="rounded-2xl p-5"
            style={{
              backgroundColor: "var(--theme-accent-soft)",
              border: "1px solid color-mix(in srgb, var(--theme-accent) 35%, transparent)"
            }}
          >
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Need more help?</h2>
            <p className="text-slate-700 dark:text-slate-300 mt-2">
              For account-specific support, email 11planner.support@gmail.com.
            </p>
          </section>

          {isLoggedIn && (
            <div data-reveal data-reveal-once="true" className="pt-4 border-t border-slate-200/70 dark:border-slate-700/70 flex flex-wrap gap-4">
              <Link
                href="/"
                className="inline-flex items-center gap-2 font-semibold"
                style={{ color: "var(--theme-accent-strong)" }}
              >
                <span className="material-symbols-outlined text-base">arrow_back</span>
                Back to home
              </Link>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
