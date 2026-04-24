<div align="center">

# 11Planner

### AI-powered academic scheduling for students who hate the 11:59 PM scramble.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110-009688?logo=fastapi)](https://fastapi.tiangolo.com)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?logo=python)](https://python.org)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase)](https://supabase.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)](https://typescriptlang.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**[🚀 Live Demo](https://11planner.vercel.app)** &nbsp;·&nbsp; **[📖 Run Instructions](./RUN_INSTRUCTIONS.md)** &nbsp;·&nbsp; **[📋 User Manual](./USER_MANUAL.md)**

</div>

---

## What is 11Planner?

11Planner is a web-based productivity app that turns your courses, assignments, and deadlines into a realistic, optimized weekly study schedule — automatically. Instead of manually deciding when to work on what, 11Planner figures it out for you: it ranks tasks by urgency, breaks them into focused study blocks, respects your availability, and builds a calendar you can actually follow.

The name "11" is a nod to the 11:59 PM deadline culture that every student knows too well.

---

## ✨ Features

### 📅 Smart Schedule Generation
Automatically builds a personalized weekly study plan. Tasks are ranked by urgency (deadline proximity vs. estimated effort), split into focus blocks of up to 2 hours, and distributed across your available days — avoiding class times, respecting your daily study cap, and inserting 15-minute breaks.

### 📚 Course Management
Add courses with meeting times, days, professor, and description. Upload a syllabus PDF and 11Planner automatically extracts the course code, name, professor, and schedule — saving manual entry time.

### ✅ Task & Assignment Tracking
Create tasks with a title, deadline, estimated hours, priority level, and course link. Tasks are sorted by deadline so the most urgent work is always visible first. Canvas assignments can be imported automatically via the Chrome extension.

### 🗓️ Multiple Calendar Views
View your generated schedule in Day, Week, Month, or Year layout. Color-coded blocks (red = high priority, yellow = medium, blue = normal) make it easy to see what needs attention. Move blocks by drag-and-drop.

### 🎯 Focus Dashboard
A dedicated study environment with a built-in Pomodoro timer, 30 looping video backgrounds across 5 categories (Nature, Anime, Cafe, City, Abstract), 7 ambient soundscapes, and distraction-reducing UI modes including Glass and Hide-All-UI modes.

### 🔗 Canvas LMS Sync
A Chrome extension scrapes your Canvas courses and assignments and syncs them directly into 11Planner — no manual re-entry needed.

### 🔔 Notifications & Reminders
In-app toast alerts, browser push notifications, and weekly progress summary emails. Configure how far in advance you get reminded (1–168 hours before any deadline).

### 🎨 Themes & Personalization
Light, Dark, and Auto themes. Six color accent options. Adjustable daily study hour cap (1–12 hrs). Per-user settings persist in Supabase across devices.

### 🔒 Secure Authentication
Supabase Auth with email verification, JWT session management, and Row-Level Security so your data is only ever accessible to you.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS v4 |
| Backend | Python 3.11+, FastAPI 0.110 |
| Database & Auth | Supabase (PostgreSQL + RLS) |
| AI — Scheduling | OpenAI API (task ordering & optimization) |
| AI — Parsing | Google Gemini API (syllabus extraction enrichment) |
| PDF Parsing | pypdf |
| Browser Extension | Chrome Manifest V3 |
| Frontend Deploy | Vercel |
| Backend Deploy | Render |

---

## 🚀 How It Works

```
1. Add your courses      →   Upload your syllabus or fill in meeting times manually
        ↓
2. Create your tasks     →   Set deadlines, estimated hours, and priority for each task
        ↓
3. Generate schedule     →   11Planner ranks tasks by urgency, builds focused study blocks,
                             and fills your week around your classes and preferences
        ↓
4. Study with focus      →   Use the Dashboard timer, pick a background, and work
```

---

## 📸 Screenshots

> _Screenshots show the live application._

| Dashboard | Schedule View |
|---|---|
| ![Dashboard](./frontend/public/images/background.png) | ![Schedule](./frontend/public/images/background.png) |

> 💡 Add your own screenshots to `frontend/public/images/` and update the paths above.

---

## 📁 Project Structure

```
11Planner/
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI entry point, router wiring, CORS
│   │   ├── models.py                # Pydantic data models
│   │   ├── schedule_generator.py    # Core scheduling algorithm
│   │   ├── syllabus_parser.py       # PDF syllabus text extraction
│   │   ├── ai_task_estimator.py     # AI-assisted time estimation
│   │   └── api/
│   │       ├── tasks.py             # Task CRUD + schedule generation endpoints
│   │       ├── assignments.py       # Assignment CRUD + Canvas sync endpoint
│   │       ├── schedule_blocks.py   # Schedule block CRUD + ICS export
│   │       ├── syllabus.py          # PDF upload/parse endpoint
│   │       ├── email.py             # Weekly summary email worker
│   │       ├── support.py           # AI support assistant
│   │       └── music.py             # Spotify/music integration
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── app/                     # Next.js App Router pages
│       │   ├── dashboard/           # Focus dashboard + timer
│       │   ├── tasks/               # Task management
│       │   ├── courses/             # Course management
│       │   ├── schedule/            # Calendar views
│       │   ├── profile/             # User profile + preferences quiz
│       │   └── settings/            # Theme, notifications, study limit
│       ├── components/              # Reusable UI (ScheduleView, Timer, Nav, etc.)
│       ├── contexts/                # PlannerContext, ThemeContext, TimerContext, MusicContext
│       ├── lib/                     # Supabase client, API helpers
│       ├── types/                   # Shared TypeScript interfaces
│       └── utils/                   # Date utilities, ICS export helpers
├── canvas-extension/                # Chrome extension for Canvas LMS sync
├── RUN_INSTRUCTIONS.md              # Full local setup guide
└── USER_MANUAL.md                   # End-user documentation
```

---

## ⚡ Quick Start

See **[RUN_INSTRUCTIONS.md](./RUN_INSTRUCTIONS.md)** for the complete setup guide.

**TL;DR:**

```bash
# Terminal 1 — Backend
cd backend
cp .env.example .env        # fill in your keys
python -m venv .venv && .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload

# Terminal 2 — Frontend
cd frontend
# create .env.local with your Supabase keys
npm install
npm run dev
```

Open `http://localhost:3000` in your browser.

---

## 🔑 Environment Variables

**`backend/.env`**
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-service-role-key
OPENAI_API_KEY=your-openai-key          # optional — enables AI schedule ordering
GEMINI_API_KEY=your-gemini-key          # optional — enables AI syllabus enrichment
```

**`frontend/.env.local`**
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## 👥 Team

| Name | Role |
|---|---|
| Tamana Gaur | Team Lead & Documentation Lead |
| Suganeshwara Anand | Frontend, UX & Scheduling Engine Lead |
| Ayham Huq | Backend Lead |
| Aaraiz Sohail | Deployment & QA Lead |

**Wayne State University — CSC 4996 Senior Capstone, 2026**

---

<div align="center">

Made with ☕ and way too many 11:59 PM deadlines.

</div>
