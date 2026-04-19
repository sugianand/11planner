"use client";

import Image from "next/image";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { usePlanner } from "@/contexts/PlannerContext";
import { useTheme } from "@/contexts/ThemeContext";

type ChatRole = "assistant" | "user";
type WidgetView = "chat-list" | "chat" | "news" | "news-detail" | "help-center" | "article";

type ChatMessage = {
  id: string;
  role: ChatRole;
  text: string;
};

type ChatSession = {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
  ended?: boolean;
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

type SupportChatApiResponse = {
  reply: string;
  suggested_view?: string | null;
};

const SUPPORT_API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const SUPPORT_EMAIL = "11planner.support@gmail.com";

const routeHints: Array<{ match: RegExp; hint: string }> = [
  { match: /^\/dashboard/, hint: "Use the Dashboard to pick a Focus Atmosphere background, choose Spotify or YouTube Music, run the timer, and track Total Tasks, Total Hours, Productivity Score, Overdue, and Today's Checklist." },
  { match: /^\/tasks/, hint: "Use Pending and Completed tabs, plus the task filters and sorts, to manage assignments, exams, and projects." },
  { match: /^\/courses/, hint: "Upload syllabi when needed, then use Search, All Types, Online, In-Person, Has Lab, and the name/time sort options to narrow courses." },
  { match: /^\/schedule/, hint: "Use Day, Week, Month, or Year views, then Subscribe (Live), Export, Today, and drag blocks to manage your schedule." },
  { match: /^\/profile\/quiz/, hint: "The Preference Quiz has 6 steps (Work Time, Work Days, Break Style, Assignments, Productivity, Extra Notes); complete required choices, set Daily Study Limit, then Submit to save and return to Dashboard." },
  { match: /^\/profile/, hint: "Profile shows your identity card, momentum stats, Weekly Snapshot, streaks, and a Start Preference Quiz or Retake Preference Quiz button." },
  { match: /^\/about/, hint: "The About page explains what 11Planner is, its core mission to reduce deadline panic, the 30-minute focus block model, and the team behind the project." },
  { match: /^\/faq/, hint: "The FAQ page covers setup, syllabus uploads, schedule editing, recovery when you fall behind, privacy, setup time, calendar use, and support." },
  { match: /^\/privacy/, hint: "The Privacy page explains what data 11Planner collects, how it is used, what is shared, and how to request deletion or support help." },
  { match: /^\/terms/, hint: "The Terms page explains acceptable use, content ownership, availability, account actions, and the limits of scheduling guidance." },
  { match: /^\/logo-story/, hint: "The Logo Story page explains the inspiration behind the logo and the student-centered brand story." },
  { match: /^\/demo/, hint: "The Demo page plays a product tour video that showcases the main features of 11Planner." },
  { match: /^\/settings/, hint: "Settings has five panels: Appearance, Notifications, Privacy, Account, and Data. Use Search settings to filter them, and manage Theme Mode, Accent Theme, Push Notifications, Notification Sound, Browser Permission, Reminder lead time, Email Updates, Weekly Report, privacy controls (personalization, insights history, anonymous analytics, export identity), password reset, export PDF, delete learning insights history, clear data, delete account, and Reset This Section." },
  { match: /^\/notifications/, hint: "Notifications page shows live reminder status, Task Alerts for overdue and due-soon tasks, a Mark Complete button for overdue tasks, and Study Block Alerts for current and upcoming blocks." },
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

// Builds a fallback assistant response, optionally including page-specific guidance.
const createAssistantReply = (input: string, pathname: string): string => {
  const hint = routeHints.find((entry) => entry.match.test(pathname))?.hint;
  return (
    "I couldn't reach the AI support service just now. " +
    (hint ? `${hint} ` : "") +
    "Please try again in a moment."
  );
};

// Sends the current prompt and recent chat history to the backend support endpoint.
const sendSupportChatMessage = async (
  message: string,
  pathname: string,
  history: ChatMessage[]
): Promise<SupportChatApiResponse> => {
  const response = await fetch(`${SUPPORT_API_URL}/api/support/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message,
      pathname,
      messages: history.slice(-8),
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to load support response");
  }

  return response.json() as Promise<SupportChatApiResponse>;
};

// Estimates reading time for help center articles from total word count.
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

// Renders the assistant avatar used in message rows.
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

// Main support assistant widget with chat history, help content, and escalation flow.
export default function SupportAssistantWidget() {
  const pathname = usePathname();
  const { userId } = usePlanner();
  const { effectiveTheme } = useTheme();

  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<WidgetView>("chat-list");
  const [selectedNewsId, setSelectedNewsId] = useState<string | null>(null);
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const [articleBackView, setArticleBackView] = useState<"help-center">("help-center");
  const [searchValue, setSearchValue] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [isCloseFlowOpen, setIsCloseFlowOpen] = useState(false);
  const [closeFlowStep, setCloseFlowStep] = useState<"prompt" | "escalate">("prompt");
  const [escalationNotes, setEscalationNotes] = useState("");
  const [didCreateSupportEmail, setDidCreateSupportEmail] = useState(false);
  const chatMessageMaxLength = 250;
  const escalationNotesMaxLength = 500;

  const listRef = useRef<HTMLDivElement | null>(null);
  const composerRef = useRef<HTMLTextAreaElement | null>(null);

  const panelBackgroundStyle = useMemo(() => {
    if (effectiveTheme === "dark") {
      return {
        backgroundImage:
          "linear-gradient(180deg, color-mix(in srgb, var(--theme-accent-soft) 32%, rgb(15, 23, 42)) 0%, color-mix(in srgb, var(--theme-accent-soft) 18%, rgb(15, 23, 42)) 38%, rgb(2, 6, 23) 100%)",
        backgroundColor: "rgb(15, 23, 42)",
      } as const;
    }

    return {
      backgroundImage:
        "linear-gradient(180deg, color-mix(in srgb, var(--theme-accent-soft) 78%, white) 0%, color-mix(in srgb, var(--theme-accent-soft) 46%, white) 38%, rgba(255,255,255,0.94) 100%)",
      backgroundColor: "#fff",
    } as const;
  }, [effectiveTheme]);

  const panelGlowStyle = useMemo(() => {
    if (effectiveTheme === "dark") {
      return {
        backgroundImage:
          "radial-gradient(circle at top right, color-mix(in srgb, var(--theme-accent) 26%, transparent), transparent 32%), radial-gradient(circle at bottom left, color-mix(in srgb, var(--theme-accent-strong) 18%, transparent), transparent 36%)",
      } as const;
    }

    return {
      backgroundImage:
        "radial-gradient(circle at top right, color-mix(in srgb, var(--theme-accent) 38%, transparent), transparent 32%), radial-gradient(circle at bottom left, color-mix(in srgb, var(--theme-accent-strong) 26%, transparent), transparent 36%)",
    } as const;
  }, [effectiveTheme]);

  // Creates stable IDs for sessions/messages without depending on backend identifiers.
  const makeUniqueId = (prefix: string) => {
    const randomPart =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    return `${prefix}-${randomPart}`;
  };

  // Derives a readable session title from the first user-authored message.
  const nextMessageId = (prefix: string) => makeUniqueId(prefix);
  const createSessionTitle = (sessionMessages: ChatMessage[]) => {
    const firstUserMessage = sessionMessages.find((message) => message.role === "user")?.text.trim();
    if (!firstUserMessage) {
      return "New chat";
    }
    return firstUserMessage.length > 44 ? `${firstUserMessage.slice(0, 44)}...` : firstUserMessage;
  };

  // Creates the initial assistant greeting for new conversations.
  const createInitialMessages = (): ChatMessage[] => [
    {
      id: nextMessageId("assistant"),
      role: "assistant",
      text: "Hi, I am your 11Planner guide. Ask me where to find features or what to do next.",
    },
  ];

  // Creates a fresh chat session object with timestamps and welcome message.
  const createInitialSession = (): ChatSession => {
    const now = Date.now();
    const initialMessages = createInitialMessages();
    return {
      id: makeUniqueId("chat"),
      title: createSessionTitle(initialMessages),
      messages: initialMessages,
      createdAt: now,
      updatedAt: now,
    };
  };

  const storageKey = userId ? `support-assistant-chat:${userId}` : "support-assistant-chat:guest";
  const [chatSessions, setChatSessions] = useState<ChatSession[]>(() => {
    if (typeof window === "undefined") {
      return [createInitialSession()];
    }

    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as {
          messages?: ChatMessage[];
          sessions?: ChatSession[];
        };

        if (Array.isArray(parsed.sessions) && parsed.sessions.length > 0) {
          const usedSessionIds = new Set<string>();
          const restoredSessions = parsed.sessions
            .filter((session) => Array.isArray(session.messages) && session.messages.length > 0)
            .map((session) => {
              const safeSessionId =
                session.id && !usedSessionIds.has(session.id)
                  ? session.id
                  : makeUniqueId("chat");
              usedSessionIds.add(safeSessionId);

              const usedMessageIds = new Set<string>();
              const restoredMessages = session.messages.map((message) => {
                const safeMessageId =
                  message.id && !usedMessageIds.has(message.id)
                    ? message.id
                    : nextMessageId(message.role || "message");
                usedMessageIds.add(safeMessageId);
                return { ...message, id: safeMessageId };
              });

              const baseMessages = restoredMessages.some((message) => message.role === "user")
                ? restoredMessages
                : createInitialMessages();
              const createdAt = typeof session.createdAt === "number" ? session.createdAt : Date.now();
              const updatedAt = typeof session.updatedAt === "number" ? session.updatedAt : createdAt;

              return {
                id: safeSessionId,
                title:
                  typeof session.title === "string" && session.title.trim().length > 0
                    ? session.title
                    : createSessionTitle(baseMessages),
                messages: baseMessages,
                createdAt,
                updatedAt,
              };
            });

          if (restoredSessions.length > 0) {
            return restoredSessions.sort((a, b) => b.updatedAt - a.updatedAt);
          }
        }

        if (Array.isArray(parsed.messages) && parsed.messages.length > 0) {
          const usedMessageIds = new Set<string>();
          const restoredMessages = parsed.messages.map((message) => {
            const safeMessageId =
              message.id && !usedMessageIds.has(message.id)
                ? message.id
                : nextMessageId(message.role || "message");
            usedMessageIds.add(safeMessageId);
            return { ...message, id: safeMessageId };
          });

          const legacyMessages = restoredMessages.some((message) => message.role === "user")
            ? restoredMessages
            : createInitialMessages();
          const now = Date.now();

          return [
            {
              id: makeUniqueId("chat"),
              title: createSessionTitle(legacyMessages),
              messages: legacyMessages,
              createdAt: now,
              updatedAt: now,
            },
          ];
        }
      }
    } catch {
      // fall back to default messages
    }

    return [createInitialSession()];
  });

  const [activeChatId, setActiveChatId] = useState<string | null>(() => {
    if (typeof window === "undefined") {
      return null;
    }
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as { activeChatId?: string };
      return typeof parsed.activeChatId === "string" ? parsed.activeChatId : null;
    } catch {
      return null;
    }
  });

  const sortedChatSessions = useMemo(
    () => [...chatSessions].sort((a, b) => b.updatedAt - a.updatedAt),
    [chatSessions]
  );

  const activeSession = useMemo(() => {
    if (chatSessions.length === 0) return null;
    return (
      chatSessions.find((session) => session.id === activeChatId) ||
      sortedChatSessions[0] ||
      null
    );
  }, [activeChatId, chatSessions, sortedChatSessions]);

  const messages = useMemo(() => activeSession?.messages ?? [], [activeSession]);

  useEffect(() => {
    if (!activeSession || chatSessions.length === 0) return;
    localStorage.setItem(
      storageKey,
      JSON.stringify({
        sessions: chatSessions,
        activeChatId: activeSession.id,
      })
    );
  }, [activeSession, chatSessions, storageKey]);

  // Applies message changes to the active session and updates title/timestamp.
  const updateMessages = (updater: (prevMessages: ChatMessage[]) => ChatMessage[]) => {
    if (!activeSession) return;
    setChatSessions((prevSessions) =>
      prevSessions.map((session) => {
        if (session.id !== activeSession.id) {
          return session;
        }
        const nextMessages = updater(session.messages);
        return {
          ...session,
          messages: nextMessages,
          title: createSessionTitle(nextMessages),
          updatedAt: Date.now(),
        };
      })
    );
  };

  // Starts a new chat and resets transient UI state.
  const startNewChat = () => {
    const newSession = createInitialSession();
    setChatSessions((prevSessions) => [newSession, ...prevSessions]);
    setActiveChatId(newSession.id);
    setView("chat");
    setInputValue("");
    setIsThinking(false);
    setIsCloseFlowOpen(false);
    setCloseFlowStep("prompt");
    setEscalationNotes("");
    setDidCreateSupportEmail(false);
  };

  // Opens an existing session and resets in-chat prompt/escalation UI.
  const openChatSession = (sessionId: string) => {
    setActiveChatId(sessionId);
    setView("chat");
    setInputValue("");
    setIsCloseFlowOpen(false);
    setCloseFlowStep("prompt");
    setEscalationNotes("");
    setDidCreateSupportEmail(false);
  };

  // Toggles the end-chat confirmation panel.
  const handleCloseChatPrompt = () => {
    setIsCloseFlowOpen((prev) => !prev);
    setCloseFlowStep("prompt");
    setDidCreateSupportEmail(false);
  };

  // Marks the active chat as ended without creating a new session.
  const handleSatisfiedClose = () => {
    if (activeSession) {
      endChat(activeSession.id);
    }
    setIsCloseFlowOpen(false);
    setCloseFlowStep("prompt");
  };

  // Moves the close flow from confirmation to escalation details.
  const handleEscalation = () => {
    setCloseFlowStep("escalate");
    setEscalationNotes("");
    setDidCreateSupportEmail(false);
  };

  // Ends the current chat then starts a fresh conversation after escalation.
  const handleEndAndStartNewAfterEscalation = () => {
    if (activeSession) {
      endChat(activeSession.id);
    }
    startNewChat();
  };

  // Builds and opens a prefilled support email containing metadata and transcript.
  const handleCreateSupportEmail = () => {
    const transcript = messages
      .map((message, index) => {
        const speaker = message.role === "user" ? "User" : "Assistant";
        return `${index + 1}. ${speaker}: ${message.text}`;
      })
      .join("\n\n");

    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const metadataLines = [
      `User ID: ${userId || "guest"}`,
      `Timezone: ${timezone || "unknown"}`,
      `Message count: ${messages.length}`,
    ].join("\n");

    const subject = encodeURIComponent("11Planner Support Request from Chat Assistant");
    const body = encodeURIComponent(
      [
        "Hi 11Planner Support Team,",
        "",
        "I need help with an issue from the in-app chatbot.",
        "",
        "Session metadata:",
        metadataLines,
        "",
        "Additional comments:",
        escalationNotes.trim() || "No additional comments provided.",
        "",
        "Chat transcript:",
        transcript || "No messages captured.",
      ].join("\n")
    );

    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
    setDidCreateSupportEmail(true);
  };

  // Keeps the latest chat messages visible as conversation content grows.
  const scrollChatToBottom = () => {
    requestAnimationFrame(() => {
      if (!listRef.current) return;
      listRef.current.scrollTop = listRef.current.scrollHeight;
    });
  };

  // Auto-resizes the composer textarea based on content height.
  const adjustComposerHeight = () => {
    const composer = composerRef.current;
    if (!composer) return;
    composer.style.height = "auto";
    const nextHeight = Math.min(composer.scrollHeight, 120);
    composer.style.height = `${nextHeight}px`;
  };

  useEffect(() => {
    if (view !== "chat") return;
    scrollChatToBottom();
  }, [messages.length, isThinking, view]);

  useEffect(() => {
    adjustComposerHeight();
  }, [inputValue]);

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

  const hasUserSentMessage = useMemo(
    () => messages.some((message) => message.role === "user"),
    [messages]
  );

  // Handles user text submission, calls support API, and appends assistant reply.
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = inputValue.trim();
    if (!trimmed || isThinking || activeSession?.ended) return;

    const userMessage: ChatMessage = {
      id: nextMessageId("user"),
      role: "user",
      text: trimmed,
    };

    updateMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsThinking(true);
    scrollChatToBottom();

    let replyText = createAssistantReply(trimmed, pathname || "");
    try {
      const apiResponse = await sendSupportChatMessage(
        trimmed,
        pathname || "",
        [...messages, userMessage]
      );
      replyText = apiResponse.reply || replyText;
    } catch {
      // fall back to the local assistant reply
    }

    const assistantMessage: ChatMessage = {
      id: nextMessageId("assistant"),
      role: "assistant",
      text: replyText,
    };

    updateMessages((prev) => [...prev, assistantMessage]);
    setIsThinking(false);
    scrollChatToBottom();
  };

  // Sends one-tap quick prompts through the same message pipeline as typed input.
  const handleQuickQuestion = async (question: string) => {
    if (isThinking) return;

    const userMessage: ChatMessage = { id: nextMessageId("user"), role: "user", text: question };
    updateMessages((prev) => [...prev, userMessage]);
    setIsThinking(true);
    scrollChatToBottom();

    const history = [...messages, userMessage];
    let replyText = createAssistantReply(question, pathname || "");
    try {
      const apiResponse = await sendSupportChatMessage(question, pathname || "", history);
      replyText = apiResponse.reply || replyText;
    } catch {
      // fall back to the local assistant reply
    }

    const assistantMessage: ChatMessage = {
      id: nextMessageId("assistant"),
      role: "assistant",
      text: replyText,
    };

    updateMessages((prev) => [...prev, assistantMessage]);
    setIsThinking(false);
    scrollChatToBottom();
  };

  // Opens a help article and records where to return when navigating back.
  const openArticle = (articleId: string, origin: "help-center") => {
    setSelectedArticleId(articleId);
    setArticleBackView(origin);
    setView("article");
  };

  // Opens the full view for a selected news item.
  const openNewsDetail = (newsId: string) => {
    setSelectedNewsId(newsId);
    setView("news-detail");
  };

  // Returns to chat list and clears detail selections.
  const closeToHome = () => {
    setView("chat-list");
    setSelectedNewsId(null);
    setSelectedArticleId(null);
  };

  // Returns from an article to its origin view.
  const handleArticleBack = () => {
    setView(articleBackView);
  };

  // Returns from a news detail page to the news list.
  const handleNewsBack = () => {
    setView("news");
  };

  // Deletes a chat session and safely resets selection if it was active.
  const deleteChat = (sessionId: string) => {
    setChatSessions((prev) => prev.filter((s) => s.id !== sessionId));
    if (activeChatId === sessionId) {
      setActiveChatId(null);
      setView("chat-list");
    }
  };

  // Marks a chat session as ended to disable additional messages.
  const endChat = (sessionId: string) => {
    setChatSessions((prev) =>
      prev.map((s) => (s.id === sessionId ? { ...s, ended: true } : s))
    );
  };

  // Shared back handler for section views that should return to the chat list.
  const handleBackFromSection = () => {
    setView("chat-list");
  };

  if (userId === "user_demo") {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-[60] flex flex-col items-end">
      {isOpen && (
        <section
          className={`relative overflow-hidden font-[var(--font-manrope)] rounded-[32px] border border-white/70 dark:border-slate-700/80 shadow-[0_40px_90px_-35px_rgba(15,23,42,0.92)] flex flex-col animate-in fade-in zoom-in-95 transition-all duration-300 ease-out ${view === "article" || view === "news-detail" ? "w-[min(96vw,760px)] h-[min(86vh,760px)]" : "w-[min(92vw,420px)] h-[min(80vh,680px)]"}`}
          style={panelBackgroundStyle}
        >
          <div
            className="pointer-events-none absolute inset-0"
            style={panelGlowStyle}
          />
          <header className="relative overflow-hidden px-5 pt-4 pb-3 border-b border-slate-200/75 dark:border-slate-700/80 bg-white/85 dark:bg-slate-950/80 text-slate-900 dark:text-white backdrop-blur-xl">
            <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[var(--theme-accent)]/50 to-transparent" />
            <div className="relative z-10">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-[var(--theme-accent-strong)] text-white shadow-[0_14px_26px_-16px_rgba(15,23,42,0.45)] flex items-center justify-center ring-1 ring-white/60">
                    <span className="material-symbols-outlined text-[20px]">school</span>
                  </div>
                  <div>
                    <h2 className="text-[24px] font-extrabold leading-none tracking-tight">11Planner</h2>
                    <p className="mt-1 text-[12px] uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Chat Support Assistant</p>
                  </div>
                </div>
              </div>

              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 dark:border-slate-700/80 bg-white/70 dark:bg-slate-900/70 px-3 py-1 text-[12px] font-medium text-slate-600 dark:text-slate-300 shadow-[0_10px_24px_-22px_rgba(15,23,42,0.55)]">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Fast answers, saved history, and escalation when needed
              </div>
            </div>
          </header>

          <div className={view === "chat" ? "relative flex-1 min-h-0 px-4 pt-3 pb-3" : "relative flex-1 overflow-y-auto px-4 pt-3 pb-3 space-y-3.5"}>
            {view === "chat-list" && (
              <div className="px-1 py-1">
                <div className="flex items-end justify-between pb-3 border-b border-slate-200/70 dark:border-slate-700/80">
                  <div>
                    <p className="font-semibold text-[15px] text-slate-900 dark:text-white">Your chats</p>
                    <p className="text-xs text-slate-500 dark:text-slate-300">Open a previous conversation or start a new one.</p>
                  </div>
                  <span className="inline-flex items-center rounded-full border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/70 px-2.5 py-1 text-[11px] font-semibold text-slate-500 dark:text-slate-300">
                    {sortedChatSessions.length} total
                  </span>
                </div>

                <button
                  type="button"
                  onClick={startNewChat}
                  className="mt-3 w-full inline-flex items-center justify-center gap-2 rounded-2xl px-3.5 py-3 text-sm font-semibold text-white shadow-[0_16px_30px_-18px_rgba(15,23,42,0.35)] transition hover:brightness-105"
                  style={{ backgroundColor: "var(--theme-accent-strong)" }}
                >
                  <span className="material-symbols-outlined text-[18px]">add_circle</span>
                  Start new chat
                </button>

                <div className="mt-4 space-y-3 max-h-[430px] overflow-y-auto pr-1 pb-1">
                  {sortedChatSessions.map((session) => {
                    const previewMessage =
                      [...session.messages]
                        .reverse()
                        .find((message) => message.role === "assistant" || message.role === "user")?.text || "No messages yet.";
                    const preview = previewMessage.length > 72 ? `${previewMessage.slice(0, 72)}...` : previewMessage;

                    return (
                      <div
                        key={session.id}
                        className={`group rounded-[22px] border px-3 py-3 shadow-[0_16px_30px_-26px_rgba(15,23,42,0.55)] transition-all duration-200 ${
                          activeSession?.id === session.id
                            ? "border-[var(--theme-accent)] bg-[var(--theme-accent-soft)]/35 dark:bg-slate-900"
                            : "border-slate-200/80 dark:border-slate-700 bg-white/88 dark:bg-slate-900/55 hover:-translate-y-0.5 hover:shadow-[0_20px_36px_-26px_rgba(15,23,42,0.75)]"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <button
                            type="button"
                            onClick={() => openChatSession(session.id)}
                            className="flex-1 min-w-0 text-left"
                          >
                            <div className="flex min-w-0 items-center gap-2">
                              <p className="font-semibold text-[14px] text-slate-900 dark:text-white truncate">{session.title}</p>
                              {session.ended && (
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-200 whitespace-nowrap">ended</span>
                              )}
                            </div>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-300 line-clamp-2">{preview}</p>
                          </button>

                          <div className="flex flex-none flex-col items-end">
                            <p className="max-w-[92px] truncate text-[11px] font-medium text-slate-500 dark:text-slate-300 whitespace-nowrap text-right">
                              {new Date(session.updatedAt).toLocaleDateString()}
                            </p>
                            <button
                              type="button"
                              onClick={() => deleteChat(session.id)}
                              className="mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full text-red-600 dark:text-red-400 hover:bg-red-100/80 dark:hover:bg-red-900/30 transition"
                              aria-label="Delete chat"
                            >
                              <span className="material-symbols-outlined text-[17px]">delete</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {view === "chat" && (
              <div className="flex-1 min-h-0 h-full flex flex-col">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200/75 dark:border-slate-700/80">
                  <button
                    type="button"
                    onClick={() => setView("chat-list")}
                    className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-semibold border border-slate-200/80 dark:border-slate-700 bg-white/90 dark:bg-slate-900/70 text-slate-700 dark:text-slate-200 shadow-[0_10px_24px_-20px_rgba(15,23,42,0.7)]"
                  >
                    <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                    Back
                  </button>
                  <div className="flex flex-1 min-w-0 items-center justify-end gap-2 pl-3">
                    <p className="min-w-0 text-sm font-semibold text-slate-900 dark:text-white truncate text-right">
                      {activeSession?.title || "Chat"}
                    </p>
                    {activeSession?.ended && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-200 whitespace-nowrap">ended</span>
                    )}
                  </div>
                </div>

                <div ref={listRef} className="relative flex-1 min-h-0 overflow-y-auto space-y-3 pr-1 pt-3 pb-2">
                  {messages.map((message) => (
                    <div key={message.id} className={`flex gap-2 ${message.role === "assistant" ? "justify-start" : "justify-end"}`}>
                      {message.role === "assistant" && <ElevenAvatar size="sm" />}
                      <div
                        className={`max-w-[82%] rounded-[22px] px-3.5 py-3 text-sm leading-relaxed whitespace-pre-line break-words shadow-[0_14px_30px_-24px_rgba(15,23,42,0.55)] ${
                          message.role === "assistant"
                            ? "border border-slate-200/80 dark:border-slate-700/80 bg-white/90 dark:bg-slate-900/75 text-slate-800 dark:text-slate-100 backdrop-blur"
                            : "text-white"
                        }`}
                        style={message.role === "user" ? { backgroundColor: "var(--theme-accent-strong)" } : undefined}
                      >
                        {message.text}
                      </div>
                    </div>
                  ))}

                  {isThinking && (
                    <div className="flex gap-2 justify-start">
                      <ElevenAvatar size="sm" />
                      <div className="border border-slate-200/80 dark:border-slate-700/80 bg-white/90 dark:bg-slate-900/75 rounded-[22px] px-3.5 py-2.5 inline-flex items-center gap-1.5 shadow-[0_14px_30px_-24px_rgba(15,23,42,0.55)]">
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-500 dark:bg-slate-300 animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-500 dark:bg-slate-300 animate-bounce" style={{ animationDelay: "120ms" }} />
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-500 dark:bg-slate-300 animate-bounce" style={{ animationDelay: "240ms" }} />
                      </div>
                    </div>
                  )}
                </div>

                {!activeSession?.ended && (
                  <div className="sticky bottom-0 z-10 mt-auto pt-3 space-y-2 border-t border-slate-200/70 dark:border-slate-700/80 bg-transparent backdrop-blur-xl">
                    {!hasUserSentMessage && (
                      <div className="flex flex-wrap gap-2 pr-1">
                        {quickQuestions.map((question) => (
                          <button
                            key={question}
                            onClick={() => handleQuickQuestion(question)}
                            className="rounded-full px-3 py-1.5 text-left text-[12px] border border-slate-200/80 dark:border-slate-700/80 bg-white/70 dark:bg-slate-900/65 text-slate-700 dark:text-slate-200 shadow-[0_10px_24px_-22px_rgba(15,23,42,0.45)] transition hover:-translate-y-0.5 hover:border-[var(--theme-accent)]"
                          >
                            {question}
                          </button>
                        ))}
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={handleCloseChatPrompt}
                      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold border border-slate-200/80 dark:border-slate-700 bg-white/80 dark:bg-slate-900/65 text-slate-700 dark:text-slate-200 shadow-[0_10px_24px_-22px_rgba(15,23,42,0.45)]"
                    >
                      <span className="material-symbols-outlined text-[16px]">close</span>
                      End chat
                    </button>

                    {isCloseFlowOpen && (
                      <div className="rounded-[22px] border border-slate-200/85 dark:border-slate-700/80 bg-white/75 dark:bg-slate-900/78 p-3 space-y-2 shadow-[0_18px_34px_-26px_rgba(15,23,42,0.7)] backdrop-blur-md">
                        {closeFlowStep === "prompt" ? (
                          <>
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">Are you satisfied with this chat?</p>
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={handleSatisfiedClose}
                                className="rounded-full px-3 py-1.5 text-xs font-semibold text-white shadow-[0_12px_22px_-18px_rgba(15,23,42,0.32)]"
                                style={{ backgroundColor: "var(--theme-accent-strong)" }}
                              >
                                Yes, close and end chat
                              </button>
                              <button
                                type="button"
                                onClick={handleEscalation}
                                className="rounded-full px-3 py-1.5 text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/65 text-slate-700 dark:text-slate-200"
                              >
                                I need human support
                              </button>
                            </div>
                          </>
                        ) : (
                          <>
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">Escalate to support</p>
                            <p className="text-xs text-slate-600 dark:text-slate-300">
                              Add any extra context below, then create an email draft with this chat transcript.
                            </p>
                            <textarea
                              value={escalationNotes}
                              onChange={(event) => setEscalationNotes(event.target.value)}
                              rows={3}
                              placeholder="Describe your issue or what you want support to know..."
                              maxLength={escalationNotesMaxLength}
                              className="w-full rounded-2xl border border-slate-200/80 dark:border-slate-700 bg-white/30 dark:bg-slate-950/20 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 outline-none backdrop-blur-md"
                            />
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={handleCreateSupportEmail}
                                className="rounded-full px-3 py-1.5 text-xs font-semibold text-white shadow-[0_12px_22px_-18px_rgba(15,23,42,0.32)]"
                                style={{ backgroundColor: "var(--theme-accent-strong)" }}
                              >
                                Create support email
                              </button>
                              {didCreateSupportEmail && (
                                <button
                                  type="button"
                                  onClick={handleEndAndStartNewAfterEscalation}
                                  className="rounded-full px-3 py-1.5 text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/65 text-slate-700 dark:text-slate-200"
                                >
                                  End and start new chat
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => setCloseFlowStep("prompt")}
                                className="rounded-full px-3 py-1.5 text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/65 text-slate-700 dark:text-slate-200"
                              >
                                Back
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    )}

                    <form onSubmit={handleSubmit} className="flex items-center gap-2">
                        <textarea
                          ref={composerRef}
                        value={inputValue}
                          onChange={(event) => setInputValue(event.target.value)}
                        placeholder="Write a message..."
                        maxLength={chatMessageMaxLength}
                          rows={1}
                          disabled={activeSession?.ended}
                          className="flex-1 min-h-11 max-h-28 resize-none overflow-y-auto rounded-2xl border border-slate-200/75 dark:border-slate-700 bg-white/18 dark:bg-slate-950/12 px-3.5 py-2.5 text-sm leading-5 text-slate-900 dark:text-slate-100 outline-none shadow-[0_16px_30px_-26px_rgba(15,23,42,0.35)] backdrop-blur-md placeholder:text-slate-400/80 disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                      <button
                        type="submit"
                        className="h-11 px-4 rounded-2xl text-sm font-semibold text-white transition hover:brightness-105 disabled:opacity-60 shadow-[0_16px_30px_-20px_rgba(15,23,42,0.32)]"
                        style={{ backgroundColor: "var(--theme-accent-strong)" }}
                        disabled={isThinking || activeSession?.ended}
                      >
                        {isThinking ? "Thinking..." : activeSession?.ended ? "Ended" : "Send"}
                      </button>
                    </form>
                  </div>
                )}
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
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white/75 dark:bg-slate-900/45 overflow-hidden"
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

          <div className="h-3 border-t border-slate-200/75 dark:border-slate-700/80 bg-transparent" />
        </section>
      )}

      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="group relative h-14 w-14 rounded-full shadow-[0_20px_40px_-18px_rgba(15,23,42,0.9)] transition-transform duration-200 hover:scale-[1.05] flex items-center justify-center"
        aria-label={isOpen ? "Hide support assistant" : "Open support assistant"}
        title="Support Assistant"
      >
        <span className="absolute inset-0 rounded-full border-2 border-white/90 dark:border-slate-200/80" />
        <span
          className="absolute inset-[3px] rounded-full border"
          style={{
            backgroundImage: isOpen
              ? "linear-gradient(135deg, #0f172a, #334155)"
              : "linear-gradient(135deg, var(--theme-accent-strong), var(--theme-accent), var(--theme-accent-soft))",
            borderColor: isOpen ? "#1e293b" : "#0284c7",
          }}
        />
        <span className="relative z-10 h-6 w-6">
          <span
            className={`absolute inset-0 material-symbols-outlined text-[23px] text-white leading-none transition-all duration-250 ease-out ${
              isOpen ? "opacity-0 scale-75 rotate-45" : "opacity-100 scale-100 rotate-0"
            }`}
          >
            forum
          </span>
          <span
            className={`absolute inset-0 material-symbols-outlined text-[23px] text-white leading-none transition-all duration-250 ease-out ${
              isOpen ? "opacity-100 scale-100 rotate-0" : "opacity-0 scale-75 -rotate-45"
            }`}
          >
            close
          </span>
        </span>
      </button>

    </div>
  );
}
