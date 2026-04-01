"use client";

import Link from "next/link";
import Image from "next/image";
import { FormEvent, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";

type ChatRole = "assistant" | "user";
type WidgetView = "home" | "chat" | "news" | "news-detail" | "help-center" | "article";

type ChatMessage = {
  id: string;
  role: ChatRole;
  text: string;
};

type BottomAction = {
  label: string;
  action: "home" | "chat" | "news" | "help";
  icon: string;
};

type HelpArticle = {
  id: string;
  category: string;
  title: string;
  subtitle: string;
  sections: Array<{
    title: string;
    paragraphs: string[];
    bullets?: string[];
  }>;
};

const routeHints: Array<{ match: RegExp; hint: string }> = [
  { match: /^\/dashboard/, hint: "Use Focus Mode in Dashboard to lock into deep work blocks." },
  { match: /^\/tasks/, hint: "Tag tasks as assignment, exam, or project to stay organized." },
  { match: /^\/courses/, hint: "Upload class and lab syllabi separately for better extraction." },
  { match: /^\/schedule/, hint: "Use Week view first to catch overload early." },
  { match: /^\/settings/, hint: "Tune reminders and accent theme in Settings." },
];

const bottomActions: BottomAction[] = [
  { label: "Home", action: "home", icon: "home" },
  { label: "Chat", action: "chat", icon: "chat_bubble" },
  { label: "News", action: "news", icon: "campaign" },
  { label: "Help", action: "help", icon: "help" },
];

const quickQuestions = [
  "How do I add a class?",
  "How do I mark a task as complete?",
  "How do I get started with 11Planner?",
  "How do I add an exam?",
  "Help! I have a technical issue. What should I do?",
];

const newsItems: Array<{
  id: string;
  title: string;
  body: string;
  date: string;
  imageSrc?: string;
  details: string[];
}> = [
  {
    id: "task-categories",
    title: "Task categories released",
    body: "Assignments, exams, and projects are now separated in the Tasks workflow.",
    date: "Apr 2026",
    imageSrc: "/images/background.png",
    details: [
      "Task organization now supports separate assignment, exam, and project categories.",
      "Category filters help you quickly inspect workload balance and upcoming pressure points.",
      "This update improves schedule planning quality during high-demand academic weeks.",
    ],
  },
  {
    id: "time-picker",
    title: "Course setup speed upgrade",
    body: "Native time pickers are now available for faster course and lab setup.",
    date: "Apr 2026",
    imageSrc: "/images/background.png",
    details: [
      "Course and lab forms now use native browser time pickers for cleaner input.",
      "Input normalization was improved so common time formats parse more reliably.",
      "Faster setup means less friction when entering schedules for multiple classes.",
    ],
  },
  {
    id: "support-refresh",
    title: "Support Assistant refresh",
    body: "Help Center and article reading are now built directly into this widget.",
    date: "Apr 2026",
    details: [
      "Support experience now includes categorized help content with richer article structure.",
      "The chat path opens directly with assistant context and guided quick-question chips.",
      "News and help flows were reorganized for cleaner navigation and faster discovery.",
    ],
  },
];

const helpArticles: HelpArticle[] = [
  {
    id: "migrate",
    category: "Getting Started",
    title: "How to migrate from old version of 11Planner",
    subtitle: "Move to the latest setup without losing momentum.",
    sections: [
      {
        title: "What changed in the new version",
        paragraphs: [
          "The latest 11Planner version improves scheduling speed, task categorization, and reminder handling.",
          "You can now organize work into assignments, exams, and projects, which makes planning significantly easier during high-load weeks."
        ]
      },
      {
        title: "Migration checklist",
        paragraphs: [
          "Complete these steps in order to avoid missing data and to stabilize your weekly schedule quickly:"
        ],
        bullets: [
          "Confirm account access and update profile basics",
          "Add active courses and meeting times",
          "Upload class and lab syllabi where available",
          "Review extracted dates before generating schedule",
          "Generate one week first, then tune block placement"
        ]
      },
      {
        title: "If data looks wrong",
        paragraphs: [
          "Open Support with screenshots, the exact page where the issue appears, and the actions you took before the error.",
          "That context lets support reproduce and fix your case much faster."
        ]
      }
    ],
  },
  {
    id: "syllabus",
    category: "Courses & Syllabus",
    title: "Upload class and lab syllabi correctly",
    subtitle: "Improve extraction quality and reduce manual edits.",
    sections: [
      {
        title: "Best file format",
        paragraphs: [
          "Text-based PDFs produce the highest extraction quality.",
          "Scanned images can work, but may need manual correction for dates and assignment names."
        ]
      },
      {
        title: "Class and lab setup",
        paragraphs: [
          "If a course has a lab, upload each syllabus separately so both deadline streams are captured.",
          "This avoids missing lab reports, practical assessments, and separate quiz schedules."
        ],
        bullets: [
          "Upload class syllabus first",
          "Upload lab syllabus second",
          "Validate generated tasks in Tasks view",
          "Edit titles and due dates where needed"
        ]
      },
      {
        title: "After extraction",
        paragraphs: [
          "Do a quick review before schedule generation. Confirm dates, effort estimates, and task category labels.",
          "Small corrections at this stage dramatically improve schedule quality later."
        ]
      }
    ],
  },
  {
    id: "tasks",
    category: "Task Management",
    title: "Organize assignments, exams, and projects",
    subtitle: "Keep your workload visible and balanced.",
    sections: [
      {
        title: "Why categorization matters",
        paragraphs: [
          "Different work types need different planning behavior.",
          "Exams are fixed high-priority anchors, projects need milestone breakdown, and assignments usually have shorter cycles."
        ]
      },
      {
        title: "Recommended workflow",
        paragraphs: [
          "Use this recurring loop weekly for reliable execution:"
        ],
        bullets: [
          "Add or import new tasks",
          "Assign each task a category and due date",
          "Sort by urgency and complexity",
          "Split large tasks into focused blocks",
          "Generate or adjust weekly schedule"
        ]
      },
      {
        title: "Common mistakes to avoid",
        paragraphs: [
          "Avoid keeping everything as one generic task type.",
          "Do not leave project work as a single giant item. Break it into specific outcomes with clear due checkpoints."
        ]
      }
    ],
  },
  {
    id: "recovery",
    category: "Schedule Recovery",
    title: "Recover quickly when you fall behind",
    subtitle: "A practical reset workflow for overloaded days.",
    sections: [
      {
        title: "Stabilize first",
        paragraphs: [
          "When workload spikes, do not try to repair the entire week in one step.",
          "Stabilize the next 48-72 hours first, then expand planning horizon."
        ]
      },
      {
        title: "Recovery sequence",
        paragraphs: [
          "Apply this sequence at the end of each day until back on track:"
        ],
        bullets: [
          "Mark completed work",
          "Pull forward urgent deadlines",
          "Drop low-impact items temporarily",
          "Regenerate only the next few days",
          "Lock in 2-3 high-value focus sessions"
        ]
      },
      {
        title: "Sustainable pacing",
        paragraphs: [
          "The goal is stability, not perfection.",
          "Short consistent recovery wins are better than one massive unsustainable push."
        ]
      }
    ],
  },
  {
    id: "focus",
    category: "Focus System",
    title: "Build a stronger focus routine",
    subtitle: "Use timers in a way you can sustain.",
    sections: [
      {
        title: "Session design",
        paragraphs: [
          "Pick one concrete output before each focus block.",
          "Avoid vague goals like study more. Use outcomes like finish section summary or solve 20 practice questions."
        ]
      },
      {
        title: "Recommended cadence",
        paragraphs: [
          "Use a repeatable cadence to reduce friction and decision fatigue."
        ],
        bullets: [
          "5 min setup",
          "25-45 min focused work",
          "5-10 min break",
          "2-4 cycles depending on day load"
        ]
      },
      {
        title: "Long-term consistency",
        paragraphs: [
          "Measure consistency by weekly completed blocks, not by perfect days.",
          "Steady execution compounds better than occasional extreme sessions."
        ]
      }
    ],
  },
];

const createAssistantReply = (input: string, pathname: string): string => {
  const normalized = input.toLowerCase();

  if (normalized.includes("task") || normalized.includes("assignment") || normalized.includes("exam")) {
    return "Use Tasks to add and organize assignments, exams, and projects.";
  }
  if (normalized.includes("schedule") || normalized.includes("calendar") || normalized.includes("time block")) {
    return "Use Schedule to review and adjust your weekly focus blocks.";
  }
  if (normalized.includes("course") || normalized.includes("syllabus") || normalized.includes("lab")) {
    return "Open Courses to manage classes and upload class/lab syllabi.";
  }
  if (normalized.includes("notification") || normalized.includes("reminder") || normalized.includes("email")) {
    return "Go to Settings to tune reminders, lead time, and notification channels.";
  }
  if (normalized.includes("bug") || normalized.includes("error") || normalized.includes("issue") || normalized.includes("support")) {
    return "Open Support and include page, steps, and screenshots so we can help quickly.";
  }

  const hint = routeHints.find((entry) => entry.match.test(pathname))?.hint;
  return hint || "I can guide you through Tasks, Courses, Schedule, Settings, and Help Center articles.";
};

const getReadTimeLabel = (article: HelpArticle): string => {
  const words = [
    article.title,
    article.subtitle,
    ...article.sections.flatMap((section) => [
      section.title,
      ...section.paragraphs,
      ...(section.bullets || []),
    ]),
  ]
    .join(" ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  // Average reading speed ~220 words/min.
  const minutes = Math.max(1, Math.round(words / 220));
  return `${minutes} min read`;
};

function TopCard({
  title,
  subtitle,
  icon,
  iconColor,
  href,
  onClick,
}: {
  title: string;
  subtitle: string;
  icon: string;
  iconColor?: string;
  href?: string;
  onClick?: () => void;
}) {
  const content = (
    <div className="w-full rounded-2xl bg-white/94 dark:bg-slate-800/92 border border-slate-200/90 dark:border-slate-700/80 px-4 py-3 shadow-[0_10px_26px_-22px_rgba(15,23,42,0.7)] hover:shadow-[0_16px_30px_-22px_rgba(15,23,42,0.75)] transition-all duration-200">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-semibold text-slate-900 dark:text-white text-[16px] leading-tight">{title}</p>
          <p className="text-[13px] text-slate-500 dark:text-slate-300 mt-1 leading-snug">{subtitle}</p>
        </div>
        <span className="material-symbols-outlined text-[21px]" style={iconColor ? { color: iconColor } : undefined}>
          {icon}
        </span>
      </div>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return (
    <button onClick={onClick} className="w-full text-left">
      {content}
    </button>
  );
}

function ElevenAvatar({ size = "md" }: { size?: "sm" | "md" }) {
  const avatarSize = size === "sm" ? "h-8 w-8" : "h-10 w-10";
  const textSize = size === "sm" ? "text-[12px]" : "text-[13px]";

  return (
    <div
      className={`relative ${avatarSize} rounded-full border text-white flex items-center justify-center shadow-[0_8px_18px_-10px_rgba(15,23,42,0.9)]`}
      style={{
        borderColor: "var(--theme-accent)",
        backgroundImage:
          "linear-gradient(135deg, var(--theme-accent-strong), var(--theme-accent))",
      }}
    >
      <span className={`font-extrabold tracking-tight leading-none ${textSize}`}>11</span>
      <span
        className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-white/90 text-[8px] text-slate-800 border flex items-center justify-center"
        style={{ borderColor: "var(--theme-accent)" }}
      >
        AI
      </span>
    </div>
  );
}

export default function SupportAssistantWidget() {
  const pathname = usePathname();
  const routeHintText = routeHints.find((entry) => entry.match.test(pathname || ""))?.hint;

  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<WidgetView>("home");
  const [selectedNewsId, setSelectedNewsId] = useState<string | null>(null);
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const [articleBackView, setArticleBackView] = useState<"home" | "help-center">("help-center");
  const [searchValue, setSearchValue] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      text: "Hi, I am your 11Planner guide. Ask me where to find features or what to do next.",
    },
    {
      id: "route-hint",
      role: "assistant",
      text: routeHintText || "Need help navigating? I can point you to the right page in seconds.",
    },
  ]);

  const listRef = useRef<HTMLDivElement | null>(null);
  const messageIdRef = useRef(0);

  const nextMessageId = (prefix: string) => {
    messageIdRef.current += 1;
    return `${prefix}-${messageIdRef.current}`;
  };

  const filteredArticles = useMemo(() => {
    const normalized = searchValue.trim().toLowerCase();
    if (!normalized) return helpArticles;
    return helpArticles.filter(
      (article) =>
        article.title.toLowerCase().includes(normalized) ||
        article.subtitle.toLowerCase().includes(normalized) ||
        article.category.toLowerCase().includes(normalized)
    );
  }, [searchValue]);

  const groupedFilteredArticles = useMemo(() => {
    const categoryOrder = [
      "Getting Started",
      "Courses & Syllabus",
      "Task Management",
      "Schedule Recovery",
      "Focus System",
    ];

    return categoryOrder
      .map((category) => ({
        category,
        items: filteredArticles.filter((article) => article.category === category),
      }))
      .filter((group) => group.items.length > 0);
  }, [filteredArticles]);

  const selectedArticle = useMemo(() => {
    if (!selectedArticleId) return null;
    return helpArticles.find((article) => article.id === selectedArticleId) || null;
  }, [selectedArticleId]);

  const selectedNewsItem = useMemo(() => {
    if (!selectedNewsId) return null;
    return newsItems.find((item) => item.id === selectedNewsId) || null;
  }, [selectedNewsId]);

  const compactHeaderTitle =
    view === "chat"
      ? "Chat"
      : view === "news" || view === "news-detail"
        ? "News"
        : view === "help-center"
          ? "Help Center"
          : view === "article"
            ? "Help Article"
            : "Home";

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = inputValue.trim();
    if (!trimmed) return;

    const userMessage: ChatMessage = {
      id: nextMessageId("user"),
      role: "user",
      text: trimmed,
    };

    const assistantMessage: ChatMessage = {
      id: nextMessageId("assistant"),
      role: "assistant",
      text: createAssistantReply(trimmed, pathname || ""),
    };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setInputValue("");

    requestAnimationFrame(() => {
      if (!listRef.current) return;
      listRef.current.scrollTop = listRef.current.scrollHeight;
    });
  };

  const handleQuickQuestion = (question: string) => {
    const assistantMessage: ChatMessage = {
      id: nextMessageId("assistant"),
      role: "assistant",
      text: createAssistantReply(question, pathname || ""),
    };

    setMessages((prev) => [
      ...prev,
      { id: nextMessageId("user"), role: "user", text: question },
      assistantMessage,
    ]);

    requestAnimationFrame(() => {
      if (!listRef.current) return;
      listRef.current.scrollTop = listRef.current.scrollHeight;
    });
  };

  const openArticle = (articleId: string, origin: "home" | "help-center") => {
    setSelectedArticleId(articleId);
    setArticleBackView(origin);
    setView("article");
  };

  const openNewsDetail = (newsId: string) => {
    setSelectedNewsId(newsId);
    setView("news-detail");
  };

  const closeToHome = () => {
    setView("home");
    setSelectedNewsId(null);
    setSelectedArticleId(null);
  };

  const handleArticleBack = () => {
    setView(articleBackView);
  };

  const handleNewsBack = () => {
    setView("news");
  };

  const handleBackFromSection = () => {
    setView("home");
  };

  const handleBottomAction = (action: BottomAction["action"]) => {
    if (action === "home") {
      closeToHome();
      return;
    }
    if (action === "chat") {
      setView("chat");
      return;
    }
    if (action === "news") {
      setView("news");
      setSelectedArticleId(null);
      return;
    }
    setView("help-center");
    setSelectedNewsId(null);
  };

  return (
    <div className="fixed bottom-6 right-6 z-[60] flex flex-col items-end">
      {isOpen && (
        <section className={`font-[var(--font-manrope)] rounded-[28px] border border-slate-200/90 dark:border-slate-700/80 bg-slate-100/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-[0_32px_75px_-30px_rgba(15,23,42,0.9)] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 transition-all duration-300 ease-out ${view === "article" || view === "news-detail" ? "w-[min(96vw,760px)] h-[min(86vh,760px)]" : "w-[min(92vw,420px)] h-[min(80vh,680px)]"}`}>
          <header
            className={`relative px-5 text-white ${view === "home" ? "pt-4 pb-4" : "pt-3 pb-2"}`}
            style={{
              backgroundImage:
                "linear-gradient(165deg, var(--theme-accent-strong), var(--theme-accent) 68%, var(--theme-accent))",
            }}
          >
            <div className="absolute -right-14 top-16 h-44 w-44 rounded-full bg-cyan-300/55 blur-3xl" />
            <div className="absolute left-7 top-2 h-24 w-24 rounded-full bg-white/10 blur-xl" />

            <div className="relative z-10">
              <div className={`flex items-center justify-between gap-3 ${view === "home" ? "mb-6" : "mb-3"}`}>
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-white/20 border border-white/30 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[18px]">school</span>
                  </div>
                  <h2 className="text-[24px] font-extrabold leading-none tracking-tight">11Planner</h2>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="h-8 w-8 rounded-full border border-white/40 bg-white/10 hover:bg-white/20 transition"
                  aria-label="Close support assistant"
                >
                  <span className="material-symbols-outlined text-[18px] leading-none">close</span>
                </button>
              </div>

              {view === "home" ? (
                <>
                  <p className="text-[17px] leading-none">Hi</p>
                  <h3 className="mt-1 text-[30px] font-extrabold leading-[1.02] tracking-tight max-w-[290px]">
                    How can we help you today?
                  </h3>
                </>
              ) : (
                <>
                  <p className="text-[18px] leading-none font-semibold">{compactHeaderTitle}</p>
                </>
              )}
            </div>
          </header>

          <div className="flex-1 overflow-y-auto px-4 pt-3 pb-3 space-y-3.5">
            {view === "home" && (
              <>
                <TopCard
                  title="Ask a question"
                  subtitle="We are here to help."
                  icon="chat_bubble"
                  iconColor="var(--theme-accent-strong)"
                  onClick={() => setView("chat")}
                />

                <TopCard
                  title="Report an issue"
                  subtitle="Found a bug? Let us know."
                  icon="bug_report"
                  iconColor="#dc2626"
                  href="/support"
                />

                <TopCard
                  title="Request a feature"
                  subtitle="What would you like to see next?"
                  icon="lightbulb"
                  iconColor="#d97706"
                  href="/support"
                />

                <div className="rounded-2xl bg-white/94 dark:bg-slate-800/92 border border-slate-200/90 dark:border-slate-700/80 px-3 py-3 shadow-[0_10px_26px_-22px_rgba(15,23,42,0.7)]">
                  <div className="relative">
                    <input
                      value={searchValue}
                      onChange={(event) => setSearchValue(event.target.value)}
                      placeholder="Search for help"
                      className="w-full h-11 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100/85 dark:bg-slate-900/75 px-4 pr-10 text-sm text-slate-900 dark:text-slate-100 outline-none"
                    />
                    <button
                      onClick={() => setView("help-center")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 rounded-md flex items-center justify-center text-slate-500 hover:bg-slate-200/70 dark:hover:bg-slate-700/70"
                      aria-label="Open help center"
                    >
                      <span className="material-symbols-outlined text-[20px]">search</span>
                    </button>
                  </div>

                  <div className="mt-3 divide-y divide-slate-200 dark:divide-slate-700">
                    {filteredArticles.slice(0, 3).map((article) => (
                      <button
                        key={article.id}
                        onClick={() => openArticle(article.id, "home")}
                        className="w-full flex items-center justify-between gap-3 py-3 text-left"
                      >
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white text-[14px] leading-tight">{article.title}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-300 mt-1">{article.subtitle}</p>
                        </div>
                        <span className="material-symbols-outlined" style={{ color: "var(--theme-accent-strong)" }}>
                          chevron_right
                        </span>
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => setView("help-center")}
                    className="mt-2 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-900/70 px-3 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200"
                  >
                    Open Help Center
                  </button>
                </div>
              </>
            )}

            {view === "chat" && (
              <div className="min-h-[520px] flex flex-col">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-slate-700/80">
                  <div className="flex items-center gap-2.5">
                    <ElevenAvatar size="sm" />
                    <div>
                      <p className="font-semibold text-[16px] text-slate-900 dark:text-white">11</p>
                      <p className="text-[12px] text-slate-500 dark:text-slate-300">11Planner AI Assistant</p>
                    </div>
                  </div>
                  <button type="button" onClick={closeToHome} className="h-7 w-7 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-300">
                    <span className="material-symbols-outlined text-[20px]">close</span>
                  </button>
                </div>

                <div className="pt-3 pb-2 flex justify-center">
                  <button
                    onClick={() => handleQuickQuestion("How do I get started with 11Planner?")}
                    className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-white text-sm font-semibold"
                    style={{ backgroundColor: "var(--theme-accent-strong)" }}
                  >
                    Send us a message
                    <span className="material-symbols-outlined text-[16px]">send</span>
                  </button>
                </div>

                <div ref={listRef} className="max-h-[290px] overflow-y-auto space-y-2 pr-1 pt-1">
                  {messages.map((message) => (
                    <div key={message.id} className={`flex gap-2 ${message.role === "assistant" ? "justify-start" : "justify-end"}`}>
                      {message.role === "assistant" && <ElevenAvatar size="sm" />}
                      <div
                        className={`max-w-[82%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                          message.role === "assistant"
                            ? "border border-slate-200/80 dark:border-slate-700/80 bg-slate-50/90 dark:bg-slate-900/75 text-slate-800 dark:text-slate-100"
                            : "text-white"
                        }`}
                        style={message.role === "user" ? { backgroundColor: "var(--theme-accent-strong)" } : undefined}
                      >
                        {message.text}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-3 space-y-2 max-h-[160px] overflow-y-auto pr-1">
                  {quickQuestions.map((question) => (
                    <button
                      key={question}
                      onClick={() => handleQuickQuestion(question)}
                      className="ml-auto block max-w-[92%] rounded-2xl px-3 py-2 text-left text-[13px] border border-indigo-100 dark:border-indigo-700/50 bg-indigo-50/90 dark:bg-indigo-900/25 text-indigo-700 dark:text-indigo-200"
                    >
                      {question}
                    </button>
                  ))}
                </div>

                <form onSubmit={handleSubmit} className="flex items-center gap-2 mt-3">
                  <input
                    value={inputValue}
                    onChange={(event) => setInputValue(event.target.value)}
                    placeholder="Write a message..."
                    className="flex-1 h-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm text-slate-900 dark:text-slate-100 outline-none"
                  />
                  <button
                    type="submit"
                    className="h-10 px-4 rounded-xl text-sm font-semibold text-white transition hover:opacity-90"
                    style={{ backgroundColor: "var(--theme-accent-strong)" }}
                  >
                    Send
                  </button>
                </form>
              </div>
            )}

            {view === "news" && (
              <div className="px-1 py-1">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-slate-700/80">
                  <div>
                    <p className="font-semibold text-[15px] text-slate-900 dark:text-white">News</p>
                    <p className="text-xs text-slate-500 dark:text-slate-300">Latest product updates</p>
                  </div>
                  <button type="button" onClick={handleBackFromSection} className="text-xs font-semibold text-slate-500 dark:text-slate-300">
                    Back
                  </button>
                </div>

                <div className="mt-3 space-y-2 max-h-[420px] overflow-y-auto pr-1">
                  {newsItems.map((item) => (
                    <button
                      key={item.title}
                      onClick={() => openNewsDetail(item.id)}
                      className="w-full text-left rounded-xl border border-slate-200 dark:border-slate-700 bg-white/75 dark:bg-slate-900/45 overflow-hidden"
                    >
                      {item.imageSrc ? (
                        <Image
                          src={item.imageSrc}
                          alt={item.title}
                          width={1200}
                          height={280}
                          className="w-full h-28 object-cover"
                        />
                      ) : (
                        <div
                          className="w-full h-20"
                          style={{
                            backgroundImage:
                              "linear-gradient(135deg, var(--theme-accent-strong), var(--theme-accent))",
                          }}
                        />
                      )}
                      <div className="px-3 py-3">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="font-semibold text-sm text-slate-900 dark:text-white">{item.title}</h4>
                          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-300">{item.date}</span>
                        </div>
                        <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{item.body}</p>
                        <div className="mt-2 flex justify-end">
                          <span className="material-symbols-outlined text-[18px]" style={{ color: "var(--theme-accent-strong)" }}>
                            chevron_right
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {view === "news-detail" && selectedNewsItem && (
              <article className="h-full flex flex-col">
                <div className="h-14 px-2 sm:px-3 border-b border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleNewsBack}
                    className="h-8 w-8 rounded-full flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                    aria-label="Back to news"
                  >
                    <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                  </button>
                  <p className="text-[16px] sm:text-[20px] font-semibold text-slate-900 dark:text-white text-center truncate px-2">
                    {selectedNewsItem.title}
                  </p>
                  <button
                    type="button"
                    onClick={closeToHome}
                    className="h-8 w-8 rounded-full flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                    aria-label="Close news detail"
                  >
                    <span className="material-symbols-outlined text-[20px]">close</span>
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto px-3 sm:px-10 py-5 sm:py-8 animate-in fade-in slide-in-from-right-2 duration-200">
                  {selectedNewsItem.imageSrc ? (
                    <Image
                      src={selectedNewsItem.imageSrc}
                      alt={selectedNewsItem.title}
                      width={1600}
                      height={900}
                      className="w-full h-52 sm:h-72 object-cover rounded-2xl border border-slate-200/80 dark:border-slate-700/80"
                    />
                  ) : null}
                  <h4 className="mt-4 text-[27px] sm:text-[32px] font-extrabold leading-tight text-slate-900 dark:text-white">{selectedNewsItem.title}</h4>
                  <p className="mt-2 text-[15px] sm:text-[16px] text-slate-500 dark:text-slate-300">{selectedNewsItem.date}</p>

                  <div className="mt-6 space-y-4">
                    {selectedNewsItem.details.map((line, index) => (
                      <p key={`${selectedNewsItem.id}-detail-${index}`} className="text-[16px] sm:text-[18px] leading-relaxed text-slate-700 dark:text-slate-200">
                        {line}
                      </p>
                    ))}
                  </div>
                </div>
              </article>
            )}

            {view === "help-center" && (
              <div className="px-1 py-1">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-slate-700/80">
                  <div>
                    <p className="font-semibold text-[15px] text-slate-900 dark:text-white">Help Center</p>
                    <p className="text-xs text-slate-500 dark:text-slate-300">Detailed guides and walkthroughs</p>
                  </div>
                  <button type="button" onClick={handleBackFromSection} className="text-xs font-semibold text-slate-500 dark:text-slate-300">
                    Back
                  </button>
                </div>

                <div className="relative mt-3">
                  <input
                    value={searchValue}
                    onChange={(event) => setSearchValue(event.target.value)}
                    placeholder="Search help articles"
                    className="w-full h-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100/80 dark:bg-slate-900/70 px-3 pr-9 text-sm"
                  />
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-[19px]">
                    search
                  </span>
                </div>

                <div className="mt-3 space-y-2 max-h-[380px] overflow-y-auto pr-1">
                  {filteredArticles.length === 0 && (
                    <p className="text-sm text-slate-500 dark:text-slate-300 px-1 py-2">No articles found for this search.</p>
                  )}
                  {groupedFilteredArticles.map((group) => (
                    <div key={group.category} className="space-y-2">
                      <p className="text-[11px] uppercase tracking-[0.08em] font-semibold text-slate-500 dark:text-slate-300 px-1 pt-1">
                        {group.category}
                      </p>
                      {group.items.map((article) => (
                        <button
                          key={article.id}
                          onClick={() => openArticle(article.id, "help-center")}
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white/75 dark:bg-slate-900/45 px-3 py-3 text-left flex items-center justify-between gap-3"
                        >
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white text-[14px]">{article.title}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-300 mt-1">{article.subtitle}</p>
                            <p className="text-[11px] text-slate-400 dark:text-slate-400 mt-1">{getReadTimeLabel(article)}</p>
                          </div>
                          <span className="material-symbols-outlined" style={{ color: "var(--theme-accent-strong)" }}>
                            chevron_right
                          </span>
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {view === "article" && selectedArticle && (
              <article className="h-full flex flex-col">
                <div className="h-14 px-2 sm:px-3 border-b border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleArticleBack}
                    className="h-8 w-8 rounded-full flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                    aria-label="Back to help center"
                  >
                    <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                  </button>
                  <p className="text-[16px] sm:text-[20px] font-semibold text-slate-900 dark:text-white text-center truncate px-2">
                    {selectedArticle.title}
                  </p>
                  <button
                    type="button"
                    onClick={closeToHome}
                    className="h-8 w-8 rounded-full flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                    aria-label="Close article"
                  >
                    <span className="material-symbols-outlined text-[20px]">close</span>
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto px-3 sm:px-10 py-5 sm:py-8 animate-in fade-in slide-in-from-right-2 duration-200">
                  <h4 className="text-[27px] sm:text-[32px] font-extrabold leading-tight text-slate-900 dark:text-white">{selectedArticle.title}</h4>
                  <p className="mt-2 text-[15px] sm:text-[16px] text-slate-500 dark:text-slate-300">{selectedArticle.subtitle}</p>
                  <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/60 px-3 py-1 text-[12px] text-slate-500 dark:text-slate-300">
                    <span>{selectedArticle.category}</span>
                    <span>•</span>
                    <span>{getReadTimeLabel(selectedArticle)}</span>
                  </div>

                  <div className="mt-7 space-y-8">
                    {selectedArticle.sections.map((section, index) => (
                      <section key={`${selectedArticle.id}-section-${index}`}>
                        <h5 className="text-[20px] sm:text-[23px] font-bold text-slate-900 dark:text-white mb-3">{section.title}</h5>
                        <div className="space-y-4">
                          {section.paragraphs.map((paragraph, pIndex) => (
                            <p
                              key={`${selectedArticle.id}-${index}-p-${pIndex}`}
                              className="text-[16px] sm:text-[18px] leading-relaxed text-slate-700 dark:text-slate-200"
                            >
                              {paragraph}
                            </p>
                          ))}
                        </div>
                        {section.bullets && section.bullets.length > 0 && (
                          <ul className="mt-4 space-y-2">
                            {section.bullets.map((bullet, bIndex) => (
                              <li
                                key={`${selectedArticle.id}-${index}-b-${bIndex}`}
                                className="flex items-start gap-2 text-[15px] sm:text-[17px] text-slate-700 dark:text-slate-200"
                              >
                                <span className="mt-1.5 h-2 w-2 rounded-full" style={{ backgroundColor: "var(--theme-accent-strong)" }} />
                                <span>{bullet}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </section>
                    ))}
                  </div>
                </div>
              </article>
            )}
          </div>

          <div className="h-14 border-t border-slate-200/80 dark:border-slate-700/80 bg-white/96 dark:bg-slate-900/96 px-2 grid grid-cols-4 items-center text-center">
            {bottomActions.map((action) => {
              const isActive =
                (action.action === "home" && view === "home") ||
                (action.action === "chat" && view === "chat") ||
                (action.action === "news" && (view === "news" || view === "news-detail")) ||
                (action.action === "help" && (view === "help-center" || view === "article"));

              return (
                <button
                  key={action.label}
                  onClick={() => handleBottomAction(action.action)}
                  className="flex flex-col items-center justify-center gap-0.5 text-slate-500 dark:text-slate-300 transition-colors duration-200"
                  style={isActive ? { color: "var(--theme-accent-strong)" } : undefined}
                >
                  <span className="material-symbols-outlined text-[20px] leading-none">{action.icon}</span>
                  <span className="text-[10px] font-semibold leading-none">{action.label}</span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="group relative h-14 w-14 rounded-full shadow-[0_16px_30px_-16px_rgba(15,23,42,0.9)] transition-transform duration-200 hover:scale-[1.04]"
        aria-label={isOpen ? "Hide support assistant" : "Open support assistant"}
        title="Support Assistant"
      >
        <span className="absolute inset-0 rounded-full border-2 border-white/85 dark:border-slate-200/80" />
        <span
          className="absolute inset-[3px] rounded-full border"
          style={{
            backgroundColor: isOpen ? "#0f172a" : "#0ea5e9",
            borderColor: isOpen ? "#1e293b" : "#0284c7",
          }}
        />
        <span className="relative z-10 material-symbols-outlined text-[22px] text-white">
          {isOpen ? "close" : "chat"}
        </span>
      </button>
    </div>
  );
}
