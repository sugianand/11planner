import json
import logging
import os
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
    "When users ask how to do something, give clear numbered steps with each step on a new line (for example: 1. ..., 2. ..., 3. ...). "
    "Prefer exact page names and route names in your guidance. "
    "If the user appears to be on a page already, start from that page and give the shortest path to success. "
    "If the request is unclear, ask one short clarifying question only when needed. "
    "You must respond as valid JSON only, matching the provided output schema."
)


APP_NAVIGATION_CONTEXT = (
    "11Planner website map and usage context:\n"
    "- Primary pages: /dashboard, /tasks, /courses, /schedule, /settings, /support.\n"
    "- Additional pages: /about, /faq, /profile, /profile/quiz, /auth, /terms, /privacy, /demo, /logo-story.\n"
    "- Courses page: add/edit/delete courses, set meeting days/times, optionally configure lab day/time, upload class and lab syllabi.\n"
    "- Tasks page: add/edit/delete tasks, task categories include assignment/exam/project, set due dates and estimated hours, mark tasks complete.\n"
    "- Schedule page: generate and review study blocks, rebalance workload across week/day views, adjust blocks after task updates.\n"
    "- Settings page: planner preferences, reminders/notifications, and appearance controls.\n"
    "- Support widget: quick questions, contextual help by current pathname, and troubleshooting guidance.\n"
    "- Recommended onboarding flow for new users: 1) Add courses and labs, 2) Upload syllabi, 3) Review extracted tasks, 4) Categorize and estimate tasks, 5) Generate schedule, 6) Track completion and adjust weekly."
)


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


def get_openai_unavailable_reason() -> str | None:
    if OpenAI is None:
        return "OpenAI SDK not installed or failed to import"
    if not os.getenv("OPENAI_API_KEY"):
        return "OPENAI_API_KEY is missing"
    return None


def fallback_reply(message: str, pathname: str | None = None) -> tuple[str, str | None]:
    normalized = message.lower()

    if any(keyword in normalized for keyword in ("get started", "start", "onboard", "first time", "new user")):
        return (
            "Here is the fastest way to start using 11Planner:\n"
            "1. Open Courses and add each class with meeting days/times.\n"
            "2. If a class has a lab, enable lab and enter its day/time.\n"
            "3. Upload class/lab syllabi so tasks can be extracted.\n"
            "4. Open Tasks and verify due dates, categories, and estimated hours.\n"
            "5. Open Schedule and generate your study blocks for the week.\n"
            "6. As you finish work, mark tasks complete and regenerate as needed.",
            "dashboard",
        )

    if (
        "add" in normalized
        and any(keyword in normalized for keyword in ("class", "course"))
    ):
        return (
            "Here are the steps to add a class in 11Planner:\n"
            "1. Open the Courses page.\n"
            "2. Click Add Course (or the + button).\n"
            "3. Enter course name, code, and meeting days/times.\n"
            "4. If there is a lab, enable lab and add lab day/time.\n"
            "5. Save the course.\n"
            "6. (Optional) Upload class/lab syllabus so tasks can be extracted automatically.",
            "courses",
        )

    if "add" in normalized and any(keyword in normalized for keyword in ("task", "assignment", "exam", "project")):
        return (
            "To add a task in 11Planner:\n"
            "1. Open Tasks.\n"
            "2. Click Add Task.\n"
            "3. Set title, due date, category (assignment/exam/project), and estimated hours.\n"
            "4. Save, then go to Schedule and generate blocks.",
            "tasks",
        )

    if any(keyword in normalized for keyword in ("task", "assignment", "exam", "project")):
        return "Use Tasks to add assignments, exams, and projects, then mark them complete when finished.", "tasks"
    if any(keyword in normalized for keyword in ("schedule", "calendar", "block", "time")):
        return "Open Schedule to generate or adjust your study blocks and review your weekly workload.", "schedule"
    if any(keyword in normalized for keyword in ("course", "syllabus", "lab")):
        return "Go to Courses to manage classes and upload syllabi for better task extraction.", "courses"
    if any(keyword in normalized for keyword in ("setting", "notification", "theme", "reminder")):
        return "Check Settings to tune reminders, appearance, and planner preferences.", "settings"
    if any(keyword in normalized for keyword in ("bug", "error", "issue", "support", "problem")):
        return "If something looks broken, open Support with the page name and the steps you took so the issue can be reproduced.", "support"

    route = (pathname or "").lower()
    if route.startswith("/schedule"):
        return "I can help with the schedule page. Ask me about generating blocks, moving items, or balancing deadlines.", "schedule"
    if route.startswith("/tasks"):
        return "I can help with tasks. Ask me how to add, edit, or prioritize work items.", "tasks"
    if route.startswith("/courses"):
        return "I can help with courses and syllabi. Ask me about class setup, labs, or imports.", "courses"

    return "I can help with Tasks, Courses, Schedule, Settings, and support issues. Tell me what you’re trying to do.", None


@router.get("/status", response_model=SupportStatusResponse)
async def support_status():
    reason = get_openai_unavailable_reason()
    return SupportStatusResponse(openai_enabled=reason is None, reason=reason)


@router.post("/chat", response_model=SupportChatResponse)
async def chat_support(request: SupportChatRequest):
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
                    "assistant_format_rules": [
                        "Use line breaks between steps and sections.",
                        "For how-to answers, use numbered steps with one step per line.",
                        "Keep steps concrete to 11Planner pages and controls.",
                    ],
                    "output_schema": {
                        "reply": "string with concise, practical guidance and newline-separated steps when relevant",
                        "suggested_view": "optional one of: home|chat|news|help|tasks|courses|schedule|settings|support",
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