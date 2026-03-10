'use client';

import Link from 'next/link';
import Footer from '@/components/Footer';

export default function AboutPage() {
  const teamMembers = [
    {
      name: "Tamana Gaur",
      role: "Team Lead & Documentation Lead",
      icon: "groups",
      color: "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400",
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

  return (
    <div className="min-h-screen relative overflow-hidden transition-colors duration-500 pb-0">
      <div className="fixed inset-0 bg-focus-light dark:bg-focus-dark -z-20"></div>

      <main className="w-full max-w-[1200px] mx-auto px-6 py-16">
        <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-3xl p-8 md:p-12 shadow-2xl dark:border dark:border-slate-700/50 mb-12">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/40 dark:bg-slate-700/40 text-slate-800 dark:text-slate-200 text-xs font-bold uppercase tracking-widest border border-white/20 dark:border-slate-600/30 mb-6">
              <span className="material-symbols-outlined text-sm">badge</span>
              Our Team
            </div>
            <h1 className="text-slate-900 dark:text-white text-4xl md:text-5xl font-extrabold leading-tight tracking-tight mb-4">
              About Us
            </h1>
            <p className="text-slate-700 dark:text-slate-300 text-lg font-medium leading-relaxed max-w-3xl mx-auto">
              Our team is organized to ensure clear ownership across all major areas of the software development timeline,
              including planning, implementation, testing, documentation, and deployment. While each member has primary
              responsibilities, all group members contribute across all different tasks.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {teamMembers.map((member, index) => (
              <div
                key={index}
                className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md rounded-2xl p-8 shadow-sm border border-white/40 dark:border-slate-700/40 hover:shadow-lg transition-all"
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
                      <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-base mt-0.5 flex-shrink-0">
                        check_circle
                      </span>
                      <span>{responsibility}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-12 p-8 bg-emerald-50/50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-200/50 dark:border-emerald-800/30 text-center">
            <h3 className="text-slate-900 dark:text-white text-2xl font-bold mb-3">
              Collaborative Approach
            </h3>
            <p className="text-slate-700 dark:text-slate-300 text-base leading-relaxed max-w-3xl mx-auto">
              While each team member has designated leadership areas, we embrace a collaborative culture where
              everyone contributes across all aspects of the project. This ensures knowledge sharing, maintains
              project continuity, and delivers a cohesive product.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
