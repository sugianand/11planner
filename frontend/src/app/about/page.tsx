'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import Footer from '@/components/Footer';

export default function AboutPage() {
  const projectHighlights = [
    {
      label: 'Core Mission',
      value: 'Reduce deadline panic',
      icon: 'psychiatry'
    },
    {
      label: 'Planning Unit',
      value: '30-minute focus blocks',
      icon: 'timer'
    },
    {
      label: 'Team Model',
      value: 'Shared ownership',
      icon: 'diversity_3'
    }
  ];

  const teamMembers = [
    {
      name: "Tamana Gaur",
      role: "Team Lead & Documentation Lead",
      icon: "groups",
      color: "bg-white/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200",
      responsibilities: [
        "Serves as the primary point of contact with the GTA and course instructor",
        "Oversees overall project direction, timeline, and milestone tracking",
        "Ensures alignment with project requirements and grading criteria",
        "Manages and reviews all written deliverables, ensuring clarity, consistency, and professional formatting"
      ]
    },
    {
      name: "Suganeshwara Anand",
      role: "Frontend, UX & Scheduling Engine Lead / Presentation Lead",
      icon: "palette",
      color: "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
      responsibilities: [
        "Leads the design and implementation of the user interface and overall user experience",
        "Oversees development of the dashboard, calendar views, and interaction flow",
        "Designs and implements the core \"Slicer\" scheduling engine and prioritization logic",
        "Coordinates and delivers team presentations and demonstrations"
      ]
    },
    {
      name: "Ayham Huq",
      role: "Backend Lead",
      icon: "storage",
      color: "bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400",
      responsibilities: [
        "Responsible for server-side application logic and API development",
        "Manages database schema design, migrations, and data integrity",
        "Supports backend documentation and system integration",
        "Assists with backend testing and validation"
      ]
    },
    {
      name: "Aaraiz Sohail",
      role: "Deployment & Quality Assurance (QA) Lead",
      icon: "cloud_done",
      color: "bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
      responsibilities: [
        "Manages application deployment and hosting configuration",
        "Oversees testing environments and execution of test plans",
        "Coordinates bug tracking and regression testing",
        "Assists with frontend development and system validation"
      ]
    }
  ];

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
            if (revealOnce) {
              observer.unobserve(entry.target);
            }
          } else if (!revealOnce) {
            entry.target.classList.remove('reveal-visible');
          }
        });
      },
      {
        threshold: 0,
        rootMargin: '-12% 0px -12% 0px'
      }
    );

    revealElements.forEach((element, index) => {
      element.style.setProperty('--reveal-delay', `${Math.min(index * 55, 360)}ms`);
      observer.observe(element);
    });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      observer.disconnect();
    };
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden transition-colors duration-500 pb-0">
      <div className="fixed inset-0 bg-focus-light dark:bg-focus-dark -z-20"></div>
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute top-8 left-8 h-72 w-72 rounded-full blur-3xl" style={{ backgroundColor: "var(--theme-accent-soft)" }} />
        <div className="absolute top-1/3 right-[-5rem] h-96 w-96 rounded-full bg-sky-200/30 dark:bg-sky-500/15 blur-3xl" />
        <div className="absolute bottom-[-5rem] left-1/4 h-80 w-80 rounded-full bg-teal-200/25 dark:bg-teal-500/10 blur-3xl" />
      </div>

      <main className="w-full max-w-[1200px] mx-auto px-6 py-16">
        <div data-reveal data-reveal-once="true" className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-3xl p-8 md:p-12 shadow-2xl dark:border dark:border-slate-700/50 mb-12">
          <div data-reveal data-reveal-once="true" className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/40 dark:bg-slate-700/40 text-slate-800 dark:text-slate-200 text-xs font-bold uppercase tracking-widest border border-white/20 dark:border-slate-600/30 mb-6">
              <span className="material-symbols-outlined text-sm">groups</span>
              Built By Students, For Students
            </div>
            <h1 className="text-slate-900 dark:text-white text-4xl md:text-5xl font-extrabold leading-tight tracking-tight mb-4">
              About 11Planner
            </h1>
            <p className="text-slate-700 dark:text-slate-300 text-lg font-medium leading-relaxed max-w-3xl mx-auto">
              11Planner was created to make academic planning feel practical, calm, and sustainable. We designed the
              product around real student workflows: unpredictable deadlines, uneven energy, and the pressure of 11:59 submissions.
            </p>
          </div>

          <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
            {projectHighlights.map((item) => (
              <article
                key={item.label}
                data-reveal
                data-reveal-once="true"
                className="rounded-2xl bg-white/70 dark:bg-slate-900/65 border border-white/50 dark:border-slate-700/45 p-5"
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center mb-3"
                  style={{
                    backgroundColor: "var(--theme-accent-soft)",
                    color: "var(--theme-accent-strong)"
                  }}
                >
                  <span className="material-symbols-outlined">{item.icon}</span>
                </div>
                <p className="text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400 font-semibold">{item.label}</p>
                <p className="text-slate-900 dark:text-white font-extrabold mt-1 text-lg">{item.value}</p>
              </article>
            ))}
          </section>

          <section data-reveal data-reveal-once="true" className="rounded-2xl border border-white/45 dark:border-slate-700/45 bg-white/55 dark:bg-slate-900/45 p-6 md:p-7 mb-10">
            <h2 className="text-slate-900 dark:text-white text-2xl font-bold mb-3">How we work</h2>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              Our team structure ensures clear ownership across planning, design, implementation, testing, documentation,
              and deployment. Each member leads a core area, while collaboration across responsibilities keeps the product
              cohesive and resilient.
            </p>
          </section>

          <div data-reveal data-reveal-once="true" className="mb-5">
            <h2 className="text-slate-900 dark:text-white text-2xl md:text-3xl font-bold tracking-tight text-center">Meet the team</h2>
            <p className="text-slate-600 dark:text-slate-300 text-center mt-2">Role ownership with cross-functional contribution in every sprint.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {teamMembers.map((member, index) => (
              <div
                key={index}
                data-reveal
                data-reveal-once="true"
                className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md rounded-2xl p-8 shadow-sm border border-white/40 dark:border-slate-700/40 hover:shadow-lg hover:-translate-y-0.5 transition-all"
              >
                <div className="flex items-start gap-4 mb-6">
                  <div className={`w-14 h-14 rounded-2xl ${member.color} flex items-center justify-center flex-shrink-0`}>
                    <span className="material-symbols-outlined text-3xl">{member.icon}</span>
                  </div>
                  <div>
                    <h3 className="text-slate-900 dark:text-white text-xl font-bold mb-1">
                      {member.name}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 text-sm font-semibold">
                      {member.role}
                    </p>
                  </div>
                </div>
                <ul className="space-y-3">
                  {member.responsibilities.map((responsibility, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2 text-slate-700 dark:text-slate-300 text-sm leading-relaxed"
                    >
                      <span className="material-symbols-outlined text-base mt-0.5 flex-shrink-0" style={{ color: "var(--theme-accent-strong)" }}>
                        check_circle
                      </span>
                      <span>{responsibility}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div
            data-reveal
            data-reveal-once="true"
            className="mt-12 p-8 rounded-2xl text-center"
            style={{
              backgroundColor: "var(--theme-accent-soft)",
              border: "1px solid color-mix(in srgb, var(--theme-accent) 35%, transparent)"
            }}
          >
            <h3 className="text-slate-900 dark:text-white text-2xl font-bold mb-3">
              Shared Ownership, One Product Standard
            </h3>
            <p className="text-slate-700 dark:text-slate-300 text-base leading-relaxed max-w-3xl mx-auto">
              We deliberately cross-collaborate instead of working in isolated silos. This improves knowledge transfer,
              strengthens quality, and helps us deliver a product that feels unified from onboarding to daily use.
            </p>
            <div className="mt-6 flex justify-center gap-3 flex-wrap">
              <Link
                href="/support"
                className="inline-flex items-center gap-2 text-white px-6 py-3 rounded-pill font-bold hover:opacity-90 transition-opacity"
                style={{ backgroundColor: "var(--theme-accent-strong)" }}
              >
                <span className="material-symbols-outlined text-base">support_agent</span>
                Contact Support
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
