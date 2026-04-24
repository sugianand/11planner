# How to Run 11Planner

11Planner has two parts that run simultaneously:
- **Backend** — FastAPI server (Python) on port `8000`
- **Frontend** — Next.js app on port `3000`

Both must be running at the same time for the app to work.

---

## Prerequisites

| Tool | Version | Check with |
|---|---|---|
| Python | 3.11+ | `python --version` |
| Node.js | 18+ | `node --version` |
| npm | Any recent | `npm --version` |

You will also need:
- A **Supabase account** — for auth and database ([supabase.com](https://supabase.com))
- An **OpenAI API key** — for AI schedule optimization ([platform.openai.com](https://platform.openai.com/api-keys))
- A **Google Gemini API key** — for syllabus PDF parsing ([aistudio.google.com](https://aistudio.google.com/app/apikey))

---

## Step 1 — Backend Setup (Terminal 1)

```powershell
cd backend
```

**Create your `.env` file:**

```powershell
copy .env.example .env
notepad .env
```

Fill in the following values in `.env`:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-anon-or-service-key
OPENAI_API_KEY=your-openai-api-key
GEMINI_API_KEY=your-gemini-api-key
```

**Create and activate a virtual environment:**

```powershell
python -m venv .venv
.\.venv\Scripts\activate
```

**Install dependencies:**

```powershell
pip install -r requirements.txt
```

**Start the backend server:**

```powershell
uvicorn app.main:app --reload
```

The backend will be running at `http://127.0.0.1:8000`  
Interactive API docs: `http://127.0.0.1:8000/docs`

---

## Step 2 — Frontend Setup (Terminal 2)

Open a **second terminal window**, then:

```powershell
cd frontend
```

**Create your `.env.local` file** in the `frontend/` folder:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
NEXT_PUBLIC_API_URL=http://localhost:8000
```

**Install dependencies:**

```powershell
npm install
```

**Start the frontend:**

```powershell
npm run dev
```

The frontend will be running at `http://localhost:3000`

---

## Step 3 — Open the App

Go to `http://localhost:3000` in your browser.  
Register an account, verify your email, and you're in.

---

## Canvas Extension (Optional)

To enable Canvas LMS sync, load the Chrome extension manually:

1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer mode** (top right toggle)
3. Click **Load unpacked**
4. Select the `canvas-extension/` folder in the project root
5. Navigate to Canvas in your browser — the extension will appear automatically

---

## Notes

- **Both servers must be running** at the same time. The frontend calls the backend for schedule generation and syllabus parsing.
- **OpenAI key is optional** — without it, schedules are generated using urgency-based scoring only (no AI ordering hints).
- **Gemini key is optional** — without it, syllabus PDF parsing uses regex extraction only (no AI enrichment).
- **All data persists** in Supabase — restarting the backend does not reset any data.
- Backend config: `backend/app/main.py`
- Frontend config: `frontend/next.config.ts`
