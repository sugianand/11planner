# 11Planner

An AI-powered academic scheduling and productivity web application for students. 11Planner helps you manage courses, assignments, and deadlines by automatically generating an optimized weekly study schedule tailored to your preferences.

---

## Features

- **Smart Schedule Generation** — AI-assisted task prioritization and time-blocking based on deadlines, estimated effort, and your study preferences
- **Course Management** — Add courses with meeting times; upload a syllabus PDF to auto-fill details
- **Task & Assignment Tracking** — Create, prioritize, and track tasks linked to courses
- **Multiple Calendar Views** — Day, Week, Month, and Year views for your schedule
- **Focus Dashboard** — Built-in Pomodoro timer, 30 video backgrounds, ambient soundscapes, and distraction-free UI modes
- **Canvas LMS Sync** — Chrome extension to import courses and assignments directly from Canvas
- **Notifications** — In-app toasts, browser push notifications, and weekly email summaries
- **Customizable Settings** — Light/Dark/Auto themes, daily study hour cap, notification preferences
- **Secure Auth** — Supabase authentication with email verification and JWT session management

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS v4 |
| Backend | Python 3.11+, FastAPI 0.110 |
| Database & Auth | Supabase (PostgreSQL) |
| AI | OpenAI API, Google Gemini API |
| PDF Parsing | pypdf |
| Deployment | Vercel (frontend), Render (backend) |

---

## Project Structure

```
11Planner/
├── backend/
│   ├── app/
│   │   ├── main.py                 # FastAPI app entry point
│   │   ├── models.py               # Pydantic data models
│   │   ├── schedule_generator.py   # Core scheduling algorithm
│   │   ├── syllabus_parser.py      # PDF syllabus extraction
│   │   ├── ai_task_estimator.py    # AI-assisted time estimation
│   │   └── api/                    # Route handlers (tasks, courses, assignments, etc.)
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── app/                    # Next.js pages (dashboard, tasks, courses, schedule, etc.)
│       ├── components/             # Reusable UI components
│       ├── contexts/               # Global state (PlannerContext, ThemeContext, etc.)
│       ├── lib/                    # Supabase client, API helpers
│       ├── types/                  # Shared TypeScript interfaces
│       └── utils/                  # Date and ICS utilities
├── canvas-extension/               # Chrome extension for Canvas LMS sync
└── RUN_INSTRUCTIONS.md             # Setup and run guide
```

---

## Getting Started

See **[RUN_INSTRUCTIONS.md](./RUN_INSTRUCTIONS.md)** for the full setup guide.

**Quick summary:**
1. Set up `.env` in `backend/` with your Supabase and API keys
2. Set up `.env.local` in `frontend/` with your Supabase public keys
3. Run `uvicorn app.main:app --reload` in the `backend/` directory
4. Run `npm install && npm run dev` in the `frontend/` directory
5. Open `http://localhost:3000`

---

## Environment Variables

**Backend (`backend/.env`):**
```
SUPABASE_URL=
SUPABASE_KEY=
OPENAI_API_KEY=
GEMINI_API_KEY=
```

**Frontend (`frontend/.env.local`):**
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## Team

| Name | Role |
|---|---|
| Tamana Gaur | Team Lead & Documentation Lead |
| Suganeshwara Anand | Frontend, UX & Scheduling Engine Lead |
| Ayham Huq | Backend Lead |
| Aaraiz Sohail | Deployment & QA Lead |

**Wayne State University — CSC 4996 Senior Capstone, 2026**
