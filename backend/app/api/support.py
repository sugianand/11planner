import json
import logging
import os
import re
from typing import Literal

from fastapi import APIRouter
from pydantic import BaseModel, Field

try:
    from openai import OpenAI
except Exception:
    OpenAI = None


router = APIRouter(prefix="/api/support", tags=["support"])
logger = logging.getLogger(__name__)


SUPPORT_SYSTEM_PROMPT = (
    "You are the 11Planner support assistant. "
    "Your job is to help students navigate this specific website, complete tasks quickly, and troubleshoot common issues. "
    "Be concise, friendly, accurate, and action-oriented. "
    "Never invent features that are not in the provided app context. "
    "Always match the real website flow and visible control labels exactly. "
    "For workflows, list required fields first, then optional fields. "
    "Mention prerequisites when they exist (for example, tasks require at least one course). "
    "If a user asks for a feature that is not in context, clearly say it is not available and offer the closest supported path. "
    "When users ask how to do something, give clear numbered steps with each step on a new line (for example: 1. ..., 2. ..., 3. ...). "
    "Prefer exact page names, route names, and visible button labels in your guidance. "
    "If the user appears to be on a page already, start from that page and give the shortest path to success. "
    "If the request is unclear, ask one short clarifying question only when needed. "
    "If a user asks for anything unrelated to 11Planner product usage/support, politely refuse and redirect to 11Planner-only help. "
    "Do not teach external subjects (for example biology, math, programming, writing, or general homework). "
    "You must respond as valid JSON only, matching the provided output schema."
)


OFF_TOPIC_REPLY = (
    "I can only help with 11Planner features and troubleshooting. "
    "I can’t answer external quiz or subject questions here. "
    "If you want, I can help you with your task inside 11Planner (for example setting task type/priority, deadline filters, and scheduling blocks)."
)


ON_TOPIC_KEYWORDS = {
    "11planner",
    "dashboard",
    "task",
    "tasks",
    "course",
    "courses",
    "schedule",
    "settings",
    "support",
    "profile",
    "quiz",
    "syllabus",
    "assignment",
    "assignments",
    "exam",
    "project",
    "deadline",
    "deadlines",
    "reminder",
    "reminders",
    "notification",
    "notifications",
    "calendar",
    "subscribe",
    "export",
    "spotify",
    "youtube",
    "timer",
    "checklist",
    "focus",
    "pomodoro",
    "new",
    "create",
    "edit",
    "delete",
    "filter",
    "sort",
    "pending",
    "completed",
    "overdue",
}

ROUTE_HINT_KEYWORDS = {
    "/dashboard",
    "/tasks",
    "/courses",
    "/schedule",
    "/settings",
    "/notifications",
    "/profile",
    "/support",
    "/about",
    "/faq",
    "/privacy",
    "/terms",
    "/demo",
    "/logo-story",
}

GENERIC_UI_HELP_WORDS = {
    "how",
    "where",
    "what",
    "can",
    "could",
    "should",
    "help",
    "issue",
    "problem",
    "stuck",
    "this",
    "that",
}


APP_NAVIGATION_CONTEXT = (
    "11Planner website map and usage context:\n"
    "- Primary pages: /dashboard, /tasks, /courses, /schedule, /settings, /support.\n"
    "- Additional pages: /about, /faq, /profile, /profile/quiz, /auth, /terms, /privacy, /demo, /logo-story.\n"
    "- Dashboard page exact flow:\n"
    "  1) Use the Focus Atmosphere area to pick a live background and a soundscape.\n"
    "  2) The left-side panel shows Total Tasks and Total Hours, plus the Focus Music controls.\n"
    "  3) Focus Music can switch between Spotify and YouTube, and users can Connect Spotify or open YouTube.\n"
    "  4) The center of the page is the Timer, with Focus, Short Break, and Long Break modes plus reset/start/settings controls.\n"
    "  5) The right-side panel shows Productivity Score, Overdue, and Today's Checklist.\n"
    "  6) Today's Checklist combines scheduled items and tasks due today, and checkboxes can mark items complete.\n"
    "  7) There is also a hidden UI mode with a mini timer and show/hide controls.\n"
    "- Courses page exact flow:\n"
    "  1) Click New Course.\n"
    "  2) Required fields in normal in-person flow: Course Name, Course Code, Course Days, Start Time, End Time.\n"
    "  3) Optional fields: Professor, Description, This is an online/asynchronous class, This course has a lab component.\n"
    "  4) If online/asynchronous class is checked, class day/time fields are hidden and not required.\n"
    "  5) If lab component is checked, lab section appears with optional Upload Lab Syllabus PDF; required lab timing fields only apply when Lab is online/asynchronous is not checked.\n"
    "  6) Syllabus path: Upload Syllabus PDF can auto-fill most details; user should review fields before saving.\n"
    "  7) Save with Create Course (or Update Course when editing).\n"
    "  8) Course list controls include Search by name, code, professor, or day; filter buttons All Types, Online, In-Person, Has Lab; and sort options Name (A-Z), Name (Z-A), Time (earliest), Time (latest).\n"
    "- Tasks page exact flow:\n"
    "  1) If no courses exist, user must add a course first; New Task is disabled and UI shows Go to Courses.\n"
    "  2) Click New Task.\n"
    "  3) Required fields: Task Title, Course, Deadline.\n"
    "  4) Optional fields: Type (Assignment/Exam/Project), Estimated Hours, Priority, Description.\n"
    "  5) Save with Create Task (or Update Task when editing).\n"
    "  6) Use Complete/Undo on a task card to change status.\n"
    "  7) Tasks are split into Pending and Completed tabs, and controls include Type filters (All Types, Assignment, Exam, Project), Course filter, Deadline filter (All deadlines, Due today, Due in next 7 days, Due in next 30 days, Overdue), sort options (Deadline earliest/latest, Name A-Z/Z-A, Priority high to low), search, and tasks-per-page controls.\n"
    "- Schedule page exact flow:\n"
    "  1) Requires tasks to exist first; otherwise user sees Create tasks first to generate a schedule.\n"
    "  2) Click Generate Schedule.\n"
    "  3) The schedule can be viewed in Day, Week, Month (default), and Year views.\n"
    "  4) Use Subscribe (Live) to connect a calendar feed and Export to download an ICS backup; Today jumps to the current date.\n"
    "  5) After generation, users can drag schedule blocks; overlapping blocks are prevented.\n"
    "  6) Color by Priority or Color by Course changes the event coloring.\n"
    "- Settings page exact flow:\n"
    "  1) Use Search settings to filter the three panels: Personalize, Notifications, and Account.\n"
    "  2) Personalize controls Theme Mode (light/dark) and Accent Theme (emerald, ocean, rose, slate, amber, violet).\n"
    "  3) Notifications controls Push Notifications, Notification Sound, Browser Permission, Reminder lead time (1-168 hours), Email Updates, and Weekly Report.\n"
    "  4) Account includes Change Password, Public Profile Visibility, Usage Analytics, Personalized Insights, Share Progress with Integrations, Export Schedule as PDF, Clear Account Data, and Delete Account.\n"
    "  5) The bottom status bar shows All changes saved or Saving..., and Reset This Section resets the currently open panel.\n"
    "- Notifications page exact flow:\n"
    "  1) The header shows live reminder status, current lead window, and counts for Task Alerts and Block Alerts.\n"
    "  2) Task Alerts includes overdue tasks and due-soon tasks based on the selected reminder lead time.\n"
    "  3) Overdue task cards include a Mark Complete button for users who already finished the task.\n"
    "  4) Study Block Alerts shows current study blocks and upcoming blocks in the current reminder window.\n"
    "  5) The page links back to /settings?panel=notifications for reminder configuration.\n"
    "- Profile page exact flow:\n"
    "  1) Profile shows Focus Profile identity info, email state, and initials avatar.\n"
    "  2) Users can click Edit Name, update First name and Last name, then Save Name (or Cancel).\n"
    "  3) Profile stats include Total Tasks, Completed, Courses, Current Momentum, Done, Remaining, Current Streak, Best Streak, and Next Goal.\n"
    "  4) Weekly Snapshot includes a 7-Day Completed Trend chart based on completed task deadlines.\n"
    "  5) Preference quiz entry is in the profile card with Start Preference Quiz or Retake Preference Quiz button linking to /profile/quiz.\n"
    "  6) Retake flow: open /profile, click Retake Preference Quiz, complete steps, then Submit to save and redirect to dashboard.\n"
    "- Preference Quiz page (/profile/quiz) exact flow:\n"
    "  1) Quiz has 6 steps: Work Time, Work Days, Break Style, Assignments, Productivity, Extra Notes.\n"
    "  2) Required quiz fields: work time, at least one work day, break style, assignment plan.\n"
    "  3) Daily Study Limit is set with slider/input from 1 to 12 hours.\n"
    "  4) Use Previous/Next to navigate, then Submit to save preferences and redirect to dashboard.\n"
    "- Support widget: quick questions, contextual help by current pathname, and troubleshooting guidance.\n"
    "- Recommended onboarding flow for new users: 1) Add courses and labs, 2) Add tasks, 3) Categorize and estimate tasks, 4) Generate schedule, 5) Study while on the dashboard, 6) Track completion and adjust weekly."
)


PATHNAME_CONTEXT = {
    "dashboard": (
        "Current-page hints for /dashboard:"
        " mention Focus Atmosphere, Live Backgrounds, Sounds, Connect Spotify, Open YouTube, the Timer, Focus/Short Break/Long Break modes, Total Tasks, Total Hours, Productivity Score, Overdue, and Today's Checklist."
    ),
    "courses": (
        "Current-page hints for /courses:"
        " use button labels New Course, Create Course, Update Course, Upload Syllabus PDF, Upload Lab Syllabus PDF, Upload Syllabus, Edit, Delete, and mention Search by name, code, professor, or day; All Types, Online, In-Person, Has Lab; Name (A-Z), Name (Z-A), Time (earliest), Time (latest)."
    ),
    "tasks": (
        "Current-page hints for /tasks:"
        " use button labels New Task, Create Task, Update Task, Get AI Estimated Time, Complete, Undo, Edit, Delete, Go to Courses; mention Pending and Completed tabs plus All Types, Assignment, Exam, Project, All courses, deadline filters, sort options, and tasks-per-page."
    ),
    "schedule": (
        "Current-page hints for /schedule:"
        " use button labels Generate Schedule, Subscribe (Live), Export, Today, Day, Week, Month, Year, Color by Priority, and Color by Course; mention drag-to-move blocks."
    ),
    "settings": (
        "Current-page hints for /settings:"
        " use Search settings, panel names Schedule Setup/Personalize/Reminders/Account/Support, and mention key controls like Daily Study Limit, Theme Mode, Accent Theme, Push Notifications, Notification Sound, Browser Permission, reminder lead time, Email Updates, Weekly Report, Change Password, Export Schedule as PDF, Clear Account Data, Delete Account, and Reset This Section."
    ),
    "profile": (
        "Current-page hints for /profile:"
        " mention Focus Profile identity, Edit Name, Save Name, Weekly Snapshot, Current Momentum, Total Tasks, Completed, Courses, Current Streak, Best Streak, Next Goal, and Start Preference Quiz/Retake Preference Quiz."
    ),
    "profile_quiz": (
        "Current-page hints for /profile/quiz:"
        " mention 6 quiz steps (Work Time, Work Days, Break Style, Assignments, Productivity, Extra Notes), required answers, Daily Study Limit, and Submit to save then redirect to dashboard."
    ),
}


# Provides route-specific context hints used in support responses.
def get_pathname_context(pathname: str | None) -> str:
    route = (pathname or "").lower()
    if route.startswith("/profile/quiz"):
        return PATHNAME_CONTEXT["profile_quiz"]
    if route.startswith("/profile"):
        return PATHNAME_CONTEXT["profile"]
    if route.startswith("/dashboard"):
        return PATHNAME_CONTEXT["dashboard"]
    if route.startswith("/courses"):
        return PATHNAME_CONTEXT["courses"]
    if route.startswith("/tasks"):
        return PATHNAME_CONTEXT["tasks"]
    if route.startswith("/schedule"):
        return PATHNAME_CONTEXT["schedule"]
    if route.startswith("/settings"):
        return PATHNAME_CONTEXT["settings"]
    return "Current-page hints: if pathname is unknown, ask one short clarifying question before detailed multi-step instructions."


class SupportChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    text: str


class SupportChatRequest(BaseModel):
    message: str = Field(min_length=1)
    pathname: str | None = None
    messages: list[SupportChatMessage] = Field(default_factory=list)


class SupportChatResponse(BaseModel):
    reply: str
    suggested_view: str | None = None


class SupportStatusResponse(BaseModel):
    openai_enabled: bool
    reason: str | None = None


# Reports why OpenAI support is currently unavailable, if applicable.
def get_openai_unavailable_reason() -> str | None:
    if OpenAI is None:
        return "OpenAI SDK not installed or failed to import"
    if not os.getenv("OPENAI_API_KEY"):
        return "OPENAI_API_KEY is missing"
    return None


# Filters messages to keep support focused on 11Planner topics.
def is_11planner_related(message: str, pathname: str | None) -> bool:
    normalized = message.lower().strip()
    tokens = set(re.findall(r"[a-z0-9_/-]+", normalized))

    if any(keyword in normalized for keyword in ROUTE_HINT_KEYWORDS):
        return True

    if any(keyword in normalized for keyword in ON_TOPIC_KEYWORDS):
        return True

    if tokens.intersection(ON_TOPIC_KEYWORDS):
        return True

    # If user is already inside a known planner route, allow short generic UI help asks.
    route = (pathname or "").lower()
    if any(route.startswith(prefix) for prefix in ROUTE_HINT_KEYWORDS):
        if len(tokens) <= 20 and tokens.intersection(GENERIC_UI_HELP_WORDS):
            return True

    return False


# Returns deterministic fallback help when AI output is unavailable.
def fallback_reply(message: str, pathname: str | None = None) -> tuple[str, str | None]:
    normalized = message.lower()
    route = (pathname or "").lower()

    if route.startswith("/about"):
        return (
            "The About page explains what 11Planner is and who built it. It highlights the core mission to reduce deadline panic, the 30-minute focus block model, and the team members responsible for the project. Use it if you want a quick overview of the product and team.",
            "support",
        )

    if route.startswith("/faq"):
        return (
            "The FAQ page answers common questions about what 11Planner does, syllabus uploads, schedule editing, recovery when you fall behind, privacy, setup time, calendar use, and support. Use it when you want quick pre-signup guidance.",
            "support",
        )

    if route.startswith("/privacy"):
        return (
            "The Privacy page explains what 11Planner collects, how the data is used, when it is shared, your rights and choices, and how to request deletion or support help. Use it to review data handling and privacy controls.",
            "support",
        )

    if route.startswith("/terms"):
        return (
            "The Terms page explains acceptable use, ownership of your content, service availability, account actions, and the limits of the scheduling guidance. Use it to understand the rules for using 11Planner.",
            "support",
        )

    if route.startswith("/logo-story"):
        return (
            "The Logo Story page explains the inspiration behind the 11Planner logo and brand identity, including the 11:59 deadline idea and the project’s student-centered design. Use it if you want the story behind the branding.",
            "support",
        )

    if route.startswith("/demo"):
        return (
            "The Demo page plays a product tour video. The video showcases the main features of 11Planner after you sign up.",
            "support",
        )

    if route.startswith("/notifications"):
        return (
            "The Notifications page is your live alert center. It shows task alerts for overdue and due-soon tasks based on the reminder lead time, lets you mark overdue tasks complete, and shows current and upcoming study blocks. It is the place to review and act on reminders, not just read them.",
            "notifications",
        )

    if route.startswith("/settings"):
        return (
            "The Settings page lets you control how 11Planner looks and behaves. Use Search settings to find panels, then adjust Personalize, Notifications, or Account options. You can change Theme Mode and Accent Theme, manage Push Notifications and Reminder lead time, update email and weekly report preferences, and handle password, privacy, export, and account actions from there.",
            "settings",
        )

    if any(keyword in normalized for keyword in ("get started", "start", "onboard", "first time", "new user")):
        return (
            "Here is the fastest way to start using 11Planner:\n"
            "1. Open Courses and click New Course.\n"
            "2. Fill required course fields (Course Name and Course Code, plus Course Days/Start Time/End Time for in-person classes).\n"
            "3. Optional: add Professor, Description, and lab details, or upload syllabus PDFs to auto-fill most information.\n"
            "4. Click Create Course.\n"
            "5. Open Tasks, click New Task, and add required fields (Task Title, Course, Deadline).\n"
            "6. Open Schedule and click Generate Schedule.\n"
            "7. Mark tasks Complete as you finish work and regenerate when needed.",
            "dashboard",
        )

    if "profile" in normalized or "quiz" in normalized or any(keyword in normalized for keyword in ("retake", "name", "streak", "momentum")):
        return (
            "On Profile, you can view your Focus Profile info, Total Tasks, Completed, Courses, Current Momentum, Weekly Snapshot, Current Streak, Best Streak, and Next Goal. To retake preferences, open Profile and click Retake Preference Quiz (or Start Preference Quiz), complete the 6 steps, then click Submit to save and return to Dashboard.",
            "profile",
        )

    if "dashboard" in normalized or any(keyword in normalized for keyword in ("focus", "music", "spotify", "youtube", "timer", "productivity", "overdue", "checklist", "background")):
        return (
            "Open Dashboard to build your study environment with Focus Atmosphere, choose a live background and soundscape, switch between Spotify and YouTube Music, use the Timer, and review Total Tasks, Total Hours, Productivity Score, Overdue, and Today's Checklist.",
            "dashboard",
        )

    if "schedule" in normalized or any(keyword in normalized for keyword in ("calendar", "block", "time", "view", "views", "subscribe", "export")):
        return (
            "Schedule has four views: Day, Week, Month (default), and Year. Use Subscribe (Live) to add the feed to a calendar app, Export to download an ICS backup, Today to jump back to the current date, and drag blocks to move them around.",
            "schedule",
        )

    if any(keyword in normalized for keyword in ("course", "syllabus", "lab", "filter", "sort", "search")):
        return (
            "On Courses, use Search by name, code, professor, or day; filter with All Types, Online, In-Person, or Has Lab; and sort by Name (A-Z), Name (Z-A), Time (earliest), or Time (latest).",
            "courses",
        )

    if any(keyword in normalized for keyword in ("task", "assignment", "exam", "project", "completed", "pending", "filter", "sort", "tab")):
        return (
            "Tasks has Pending and Completed tabs. Filters include All Types, Assignment, Exam, Project, All courses, and deadline filters for All deadlines, Due today, Due in next 7 days, Due in next 30 days, and Overdue. Sort options are Deadline earliest/latest, Name A-Z/Z-A, and Priority high to low.",
            "tasks",
        )

    if any(keyword in normalized for keyword in ("setting", "notification", "theme", "reminder", "password", "privacy", "account", "delete", "export")):
        return (
            "Settings is organized into three panels: Personalize, Notifications, and Account. Use Search settings to jump to the right panel. Personalize controls Theme Mode and Accent Theme; Notifications controls Push Notifications, Notification Sound, Browser Permission, Reminder lead time, Email Updates, and Weekly Report; Account controls Change Password, privacy toggles, Export Schedule as PDF, Clear Account Data, and Delete Account. Reset This Section resets only the current panel.",
            "settings",
        )
    if any(keyword in normalized for keyword in ("bug", "error", "issue", "support", "problem")):
        return "If something looks broken, open Support with the page name and the steps you took so the issue can be reproduced.", "support"

    if route.startswith("/dashboard"):
        return "I can help with the dashboard. Ask me about focus backgrounds, sounds, Spotify or YouTube Music, the timer, or the dashboard stats and checklist.", "dashboard"
    if route.startswith("/profile/quiz"):
        return "I can help with the preference quiz. Ask me what each step means, which answers are required, or how Submit saves your preferences and returns you to Dashboard.", "profile"
    if route.startswith("/profile"):
        return "I can help with Profile. Ask me what each profile stat means, how to edit your name, or how to retake the preference quiz.", "profile"
    if route.startswith("/about"):
        return "I can help explain what the About page is for, who built 11Planner, and the project’s core mission.", "support"
    if route.startswith("/faq"):
        return "I can help explain what the FAQ page covers, like setup, privacy, editing schedules, and support.", "support"
    if route.startswith("/privacy"):
        return "I can help explain the Privacy page, including what data 11Planner collects and how you can request deletion.", "support"
    if route.startswith("/terms"):
        return "I can help explain the Terms page and the rules for using 11Planner.", "support"
    if route.startswith("/logo-story"):
        return "I can help explain the Logo Story page and the brand inspiration behind 11Planner.", "support"
    if route.startswith("/demo"):
        return "I can help explain the Demo page and its walkthrough video.", "support"
    if route.startswith("/schedule"):
        return "I can help with Schedule. Ask me about Day, Week, Month, or Year views, Subscribe (Live), Export, Today, or moving blocks.", "schedule"
    if route.startswith("/tasks"):
        return "I can help with Tasks. Ask me about Pending vs Completed tabs, filters, sorts, or marking a task complete.", "tasks"
    if route.startswith("/courses"):
        return "I can help with Courses. Ask me about course setup, labs, syllabi, filters, or sort options.", "courses"
    if route.startswith("/settings"):
        return "I can help with Settings. Ask me about the Search settings filter, Personalize, Notifications, Account options, or how Reset This Section works.", "settings"
    if route.startswith("/notifications"):
        return "I can help with Notifications. Ask me about Task Alerts, overdue and due-soon reminders, reminder lead time, the Mark Complete button for overdue tasks, or Study Block Alerts.", "notifications"

    return "I can help with Tasks, Courses, Schedule, Settings, and support issues. Tell me what you’re trying to do.", None


# Exposes support AI availability for frontend diagnostics.
@router.get("/status", response_model=SupportStatusResponse)
async def support_status():
    reason = get_openai_unavailable_reason()
    return SupportStatusResponse(openai_enabled=reason is None, reason=reason)


# Handles support chat requests with topic checks and AI response generation.
@router.post("/chat", response_model=SupportChatResponse)
async def chat_support(request: SupportChatRequest):
    if not is_11planner_related(request.message, request.pathname):
        return SupportChatResponse(reply=OFF_TOPIC_REPLY, suggested_view="support")

    reason = get_openai_unavailable_reason()
    if reason is not None:
        return SupportChatResponse(
            reply=(
                "AI support is currently unavailable because "
                f"{reason}. Add the API key in your backend environment, then restart the backend server."
            ),
            suggested_view="support",
        )

    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

    messages = [
        {
            "role": "system",
            "content": SUPPORT_SYSTEM_PROMPT,
        }
    ]

    for item in request.messages[-8:]:
        messages.append({"role": item.role, "content": item.text})

    messages.append(
        {
            "role": "user",
            "content": json.dumps(
                {
                    "message": request.message,
                    "pathname": request.pathname,
                    "app_context": APP_NAVIGATION_CONTEXT,
                    "current_page_context": get_pathname_context(request.pathname),
                    "assistant_format_rules": [
                        "Use line breaks between steps and sections.",
                        "For how-to answers, use numbered steps with one step per line.",
                        "Keep steps concrete to 11Planner pages and controls.",
                        "Name required fields and optional fields explicitly when describing forms.",
                    ],
                    "output_schema": {
                        "reply": "string with concise, practical guidance and newline-separated steps when relevant",
                        "suggested_view": "optional one of: home|chat|news|help|tasks|courses|schedule|profile|settings|support",
                    },
                },
                ensure_ascii=True,
            ),
        }
    )

    try:
        last_exc: Exception | None = None
        for _ in range(2):
            try:
                response = client.chat.completions.create(
                    model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
                    temperature=0.3,
                    response_format={"type": "json_object"},
                    messages=messages,
                )
                content = response.choices[0].message.content or "{}"
                parsed = json.loads(content)
                reply = str(parsed.get("reply") or "")
                suggested_view = parsed.get("suggested_view")
                if not reply.strip():
                    raise ValueError("Missing reply from OpenAI.")
                return SupportChatResponse(reply=reply.strip(), suggested_view=suggested_view if isinstance(suggested_view, str) else None)
            except Exception as inner_exc:
                last_exc = inner_exc

        if last_exc:
            raise last_exc

        raise ValueError("OpenAI request failed without a captured exception.")
    except Exception as exc:
        logger.exception("Support chat OpenAI request failed: %s", exc)
        reply, suggested_view = fallback_reply(request.message, request.pathname)
        return SupportChatResponse(reply=reply, suggested_view=suggested_view)
