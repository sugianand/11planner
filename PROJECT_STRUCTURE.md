# Project Structure Guide

This guide explains how your 11Planner project is organized, what each file does, and why it's located there.

## Top-Level Directory (`11Planner/`)

This is the root of your repository (Monorepo). It splits the project into two distinct parts:

-   **`backend/`**: The "brain" of the app (Python/FastAPI). It handles data, logic, and APIs.
-   **`frontend/`**: The "face" of the app (Next.js/React). It handles what the user sees and clicks.

---

## 1. Backend (`11Planner/backend/`)

| File / Folder | Purpose |
| :--- | :--- |
| **`app/`** | Contains the actual source code for the API. |
| &nbsp;&nbsp;`main.py` | The **entry point**. This file starts the server and defines the API routes. |
| &nbsp;&nbsp;`models.py` | Defines data structures (e.g., what a "Task" or "Course" looks like). |
| &nbsp;&nbsp;`api/` | Folders for specific API routes (e.g., `tasks.py`, `courses.py`). |
| **`requirements.txt`** | Lists all Python libraries the backend needs (like `fastapi`, `uvicorn`). |
| **`.venv/`** | (Hidden) The "Virtual Environment". It's a sandbox where your Python libraries are installed so they don't mess up your computer. |

---

## 2. Frontend (`11Planner/frontend/`)

This is where all your design, dark mode, and dashboard work lives.

### Core Configuration
| File | Purpose |
| :--- | :--- |
| **`package.json`** | The "Manifest". text file listing the project name and all installed libraries (React, Tailwind, Next.js). |
| **`next.config.ts`** | Settings for the Next.js server. |
| **`tsconfig.json`** | Rules for TypeScript (the programming language we use). |
| **`postcss.config.mjs`** | Configuration for processing CSS (used by Tailwind). |

### Source Code (`src/`)
This is where 99% of your work happens.

| Folder | Purpose |
| :--- | :--- |
| **`app/`** | **The Pages**. Every folder here creates a URL route. |
| &nbsp;&nbsp;`page.tsx` | The Home Page (`/`). |
| &nbsp;&nbsp;`dashboard/` | The Dashboard Page (`/dashboard`). |
| &nbsp;&nbsp;`layout.tsx` | The "Frame" of your app. It holds the Navigation Bar and loads fonts/CSS. |
| &nbsp;&nbsp;`globals.css` | Global styles (where we added your Dark Mode gradients!). |
| **`components/`** | **Building Blocks**. Reusable pieces of UI. |
| &nbsp;&nbsp;`Dashboard/` | Specific components for the dashboard (Timer, StatCards). |
| **`contexts/`** | **State Management**. Helps share data (like "Is Dark Mode on?" or "What are my tasks?") across the whole app. |

### Other Folders
| Folder | Purpose |
| :--- | :--- |
| **`public/`** | Static assets like images, icons, and fonts that anyone can access directly. |
| **`node_modules/`** | **The Engine Room**. Contains thousands of downloaded code libraries. It's managed automatically by `npm`. **Never edit this manually.** |
| **`.next/`** | (Hidden) A build cache Next.js uses to make your site fast. |

---

## Quick Summary
-   **Editing Code?** Go to `frontend/src/`.
-   **Adding a library?** Run `npm install` in `frontend/`.
-   **Changing the API?** Go to `backend/app/`.
