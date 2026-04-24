## Table of Contents

1. [What is 11Planner?](#1-what-is-11planner)
2. [Getting Started & Account Setup](#2-getting-started--account-setup)
3. [Navigation](#3-navigation)
4. [Courses](#4-courses)
5. [Tasks](#5-tasks)
6. [Schedule](#6-schedule)
7. [Dashboard & Focus Mode](#7-dashboard--focus-mode)
8. [Focus Music](#8-focus-music)
9. [Connecting Spotify](#9-connecting-spotify)
10. [Canvas LMS Sync (Chrome Extension)](#10-canvas-lms-sync-chrome-extension)
11. [Profile & Preference Quiz](#11-profile--preference-quiz)
12. [Settings & Notifications](#12-settings--notifications)
13. [AI Support Assistant](#13-ai-support-assistant)
14. [Exporting Your Schedule](#14-exporting-your-schedule)
15. [Troubleshooting & FAQ](#15-troubleshooting--faq)
16. [Keyboard Reference & Glossary](#16-keyboard-reference--glossary)

---

## 1. What is 11Planner?

11Planner is an AI-powered academic scheduling tool. You enter your courses and tasks once, and the AI builds a complete, conflict-free weekly study schedule around your class times, deadlines, and personal preferences.

Beyond scheduling, 11Planner includes:
- A full-screen focus environment with animated video backgrounds
- 30+ ambient soundscapes (rain, café, ocean, brainwaves, white noise, and more)
- A customizable Pomodoro timer
- Integrated Spotify and YouTube music players
- Real-time progress stats and a daily checklist
- Syllabus PDF parsing to extract assignment dates automatically
- A Canvas LMS Chrome extension for one-click assignment sync

---

## 2. Getting Started & Account Setup

### Creating a New Account

1. Go to the 11Planner login page at `/auth`.
2. Click **"Don't have an account? Register"** at the bottom of the login form.
3. Enter your:
   - **Email address** (Wayne State or personal)
   - **First name**
   - **Last name**
   - **Password** (minimum 8 characters, letters and numbers)
4. Click **Create Account**. You will be redirected to your dashboard.

### Signing In with Google

1. On the login page, click **"Continue with Google"**.
2. Authorize access using your Google account.
3. You will be redirected to your dashboard after authentication completes.

> **Note:** If your browser blocks the Google popup, allow popups for the 11Planner domain and try again.

### Logging In with Email & Password

1. Enter your registered email and password on the login page.
2. Click **Login**.
3. You will land on your Dashboard.

### Resetting Your Password

1. On the login page, click **"Forgot your password?"**.
2. Enter your email address and submit the form.
3. Check your inbox for a reset link from 11Planner.
4. Click the link in the email to open the password reset page.
5. Enter and confirm your new password, then submit.
6. Log in with your new password.

### Logging Out

Click **Logout** in the top-right navigation bar. You will be returned to the login page.

---

## 3. Navigation

The navigation bar appears at the top of every page with the following links:

| Link | Destination |
|------|-------------|
| **Home** | Landing page |
| **Dashboard** | Focus environment, timer, stats, and music |
| **Tasks** | Create and manage tasks and assignments |
| **Courses** | Add and manage your courses |
| **Schedule** | View your AI-generated schedule |
| **Profile** | Your stats, quiz, and account settings |
| **Settings** | Schedule preferences and notification settings |
| **Logout** | Sign out |

A persistent **AI Support Assistant** chat bubble appears in the bottom-right corner of every page.

---

## 4. Courses

Courses are the foundation of 11Planner. You must add at least one course before you can create tasks or generate a schedule.

Navigate to **Courses** from the navigation bar.

### The Courses Header

The header shows live counts of your course breakdown:
- **Total** — total number of courses
- **Online** — courses marked as online/asynchronous
- **In-Person** — courses with scheduled meeting times
- **Labs** — courses with a lab component

### Creating a New Course

Click **New Course** (top right of the header).

The form expands with the following sections:

---

#### Syllabus Upload (Optional — Do This First)

At the top of the form is a **dashed upload area** labeled "Upload Syllabus PDF to auto-fill information." Click it and select a PDF.

The AI will parse the syllabus and automatically fill in as many fields as it can detect: course name, code, professor, days, start time, end time, and lab details. Review the auto-filled values and correct anything that looks wrong before saving.

> **Tip:** This is the fastest way to add a course. Most syllabi will fill 80–100% of the fields automatically.

---

#### Required Fields

| Field | Label | Notes |
|-------|-------|-------|
| **Course Name** | "Course Name *" | e.g., "Calculus II" |
| **Course Code** | "Course Code *" | e.g., "MATH 241" |

#### Optional Fields

| Field | Label | Notes |
|-------|-------|-------|
| **Professor** | "Professor" | e.g., "Dr. Smith" |
| **Course Days** | "Course Days *" | Multi-select dropdown. Select any combination of Monday–Friday. Hidden if online. |
| **Start Time** | "Start Time *" | Time picker. Hidden if online. |
| **End Time** | "End Time *" | Time picker. Hidden if online. |
| **Description** | "Description" | Free text — course notes, location, etc. |

#### Online Course Checkbox

- **"This is an online/asynchronous class"** — Check this if the course has no fixed meeting time. When checked, the Course Days, Start Time, and End Time fields are hidden and not required.

#### Lab Component Checkbox

- **"This course has a lab component"** — Check this to reveal the Lab Information section.

---

#### Lab Information (appears when "Has Lab" is checked)

| Field | Label | Notes |
|-------|-------|-------|
| **Lab Syllabus** | "Upload lab syllabus PDF (optional)" | Separate upload to auto-fill lab fields |
| **Lab Day** | "Lab Day *" | Single dropdown: Monday–Friday |
| **Lab Start Time** | "Lab Start Time *" | Time picker |
| **Lab End Time** | "Lab End Time *" | Time picker |
| **Lab Online** | "Lab is online/asynchronous" | Checkbox. Hides lab day and time fields if checked. |

---

#### Validation Rules

- Course Name and Course Code are always required.
- For in-person courses: Course Days, Start Time, and End Time are required.
- Start time must be earlier than end time or a dialog appears: "The start time must be earlier than the end time."
- If the course has a non-online lab: Lab Day, Lab Start Time, and Lab End Time are required, and lab start must precede lab end.

#### Saving

Click **Create Course** to save. Click **Cancel** to close the form without saving.

---

### Searching and Filtering Courses

Below the header there is a search and filter bar:

- **Search field** — Searches course name, code, professor, description, and day.
- **Type filter dropdown** — Options: All Types / Online / In-Person / Has Lab
- **Sort dropdown** — Name (A-Z), Name (Z-A), Time (earliest), Time (latest)

The result count shows "Showing X of Y courses."

---

### Course Cards

Each course displays as a card in a grid (1–3 columns depending on screen width). Each card shows:

- **Green left border accent**
- Course name (bold, up to 2 lines)
- Course code (green, uppercase)
- "Lab" badge (emerald pill) if the course has a lab
- Professor name (with person icon)
- Schedule: days + start time – end time (e.g., "Monday Wednesday • 10:00 AM - 11:15 AM")
- For online courses: "Online/Asynchronous" label
- Description (up to 2 lines, with left border accent)
- Lab details (emerald info box, shown if lab exists)
- If schedule is missing: "Schedule not added yet — Upload syllabus or tap Edit to add days and time."

#### Card Actions (bottom of each card)

| Button | Action |
|--------|--------|
| **Upload Syllabus** | Opens a hidden file picker. Select a PDF to parse and update this existing course's details. |
| **Edit** | Opens the form pre-filled with this course's data. |
| **Delete** | Opens a confirmation dialog: "Delete course? This course will be permanently removed." — **Delete** or **Keep** |

---

### Editing a Course

Click **Edit** on a course card. The form opens with all existing values pre-filled. Make changes and click **Update Course** to save, or **Cancel** to discard.

---

## 5. Tasks

Navigate to **Tasks** from the navigation bar.

> **Prerequisite:** You must add at least one course before tasks can be created. If no courses exist, you will see a warning with a **"Go to Courses"** button.

### The Tasks Header

Shows live badge counts:
- **Total** — all tasks
- **Pending** — incomplete tasks
- **Completed** — finished tasks
- **Overdue** — past their deadline and not completed (red)
- **Assignments** (blue badge) / **Exams** (rose badge) / **Projects** (violet badge)

---

### Creating a New Task

Click **New Task** in the header (disabled if no courses exist; hovering shows tooltip "Add a course first to create tasks").

The form opens with these fields:

#### Required Fields

| Field | Label | Notes |
|-------|-------|-------|
| **Title** | "Task Title *" | e.g., "Finish calculus worksheet" |
| **Course** | "Course *" | Dropdown of your existing courses |
| **Deadline** | "Deadline *" | Date and time picker (datetime-local input) |

#### Optional Fields

| Field | Label | Default | Notes |
|-------|-------|---------|-------|
| **Type** | "Type" | Assignment | Dropdown: Assignment / Exam / Project |
| **Estimated Hours** | "Estimated Hours" | 2 | Number input, min 0.5, step 0.5 |
| **Priority** | "Priority" | Low (2) | Dropdown: Very Low (1) / Low (2) / Medium (3) / High (4) / Critical (5) |
| **Description** | "Description" | — | Textarea, 3 rows. URLs in descriptions become clickable links. |

Click **Create Task** to save, or **Cancel** to close.

---

### Task List

#### Tabs

- **Pending (N)** — Shows incomplete tasks
- **Completed (N)** — Shows finished tasks

#### Type Filter (row of pill buttons)

All Types / Assignment / Exam / Project

#### Search & Filters (in the filter bar)

| Control | Options |
|---------|---------|
| **Search** | Searches title, course name, and description (placeholder: "Search by title, course, or description") |
| **Sort** | Deadline (earliest) / Deadline (latest) / Name (A-Z) / Name (Z-A) / Priority (high to low) |
| **Course filter** | All courses / individual course names |
| **Deadline filter** | All deadlines / Due today / Due in next 7 days / Due in next 30 days / Overdue |
| **Tasks per page** | 10 / 25 / 50 |

The filter bar shows "Showing X–Y of Z" and pagination controls (Previous / Page X of Y / Next).

---

### Task Cards

Each task card shows:
- **Task title** (large, bold)
- **Course name** (smaller, below title)
- **Type badge** — Assignment (blue) / Exam (rose) / Project (violet)
- **Priority badge** — Very Low (green) / Low (blue) / Medium (yellow) / High (orange) / Critical (red)
- **Description** (if set) — truncated at 160 characters with a **"Show more"** / **"Show less"** toggle. URLs in descriptions are rendered as clickable links.
- **Deadline** — formatted as date and time
- **Estimated hours**
- **Status** — "Completed" (green) or "Pending" (orange)

#### Task Actions

| Button | Action |
|--------|--------|
| **Get AI Estimated Time** | Sends the task to the AI for time estimation. Shows a dialog with the result (e.g., "AI estimate: 3 hours") and options: **Update Estimated Time** or **Keep Current**. Shows "Estimating..." while loading. Requires a logged-in account (not demo). |
| **Edit** | Opens the form pre-filled with the task's current data. |
| **Delete** | Opens dialog: "Delete task? This task will be permanently removed." — **Delete** or **Keep** |
| **Complete** / **Undo** | Toggles completion status instantly. |

---

### Editing a Task

Click **Edit** on any task card. The form scrolls into view pre-filled with the task's data. Make changes and click **Update Task** to save.

---

## 6. Schedule

Navigate to **Schedule** from the navigation bar.

### Schedule Views

Four views are available via tabs at the top:

| View | Best For |
|------|----------|
| **Day** | Hourly breakdown of a single day — detailed view of today's blocks |
| **Week** | 7-day grid with time slots — default view for weekly planning |
| **Month** | Full month calendar — spot deadline clusters and busy periods |
| **Year** | Full semester overview — identify the heaviest stretches at a glance |

### Navigation Controls

- **Previous / Next arrows** — Move backward or forward by one time period
- **Today button** — Jump back to the current date
- **Generate Schedule button** — Triggers AI schedule generation (see below)

### Generating Your AI Schedule

1. Click **Generate Schedule**.
2. The AI analyzes:
   - All of your courses and their meeting times
   - All tasks with their deadlines, estimated hours, and priorities
   - Your personal preferences from the onboarding quiz (preferred study times, daily hour limits, etc.)
3. Study blocks are placed on the calendar, fitting around your class times.
4. Generation typically takes a few seconds.
5. The new schedule appears on the calendar automatically.

> **Re-generate whenever your workload changes** — after adding new tasks, after finishing a big project, or at the start of each week.

### Schedule Blocks

Each block on the calendar represents a scheduled study session for a specific task. Clicking a block shows its details: task name, course, start/end time, and duration.

### Drag and Drop

On the Week view, you can drag a block to a different time slot to manually reschedule it.

### Conflict Detection

If the schedule detects overlapping blocks or an impossible deadline, a conflict alert appears. Review the flagged items and either drag blocks to resolve the overlap, adjust task deadlines, or regenerate.

### Exporting Your Schedule

From the Schedule page:
- **PDF Export** — Click the download icon (top-right) and select "Export as PDF." A formatted PDF of your current view downloads.
- **Calendar (.ics) Export** — Click "Export to Calendar" to download an `.ics` file compatible with Google Calendar, Apple Calendar, and Outlook.

---

## 7. Dashboard & Focus Mode

Navigate to **Dashboard** from the navigation bar. This is your full-screen focus environment.

### Stats Panel (left column)

Four stat cards display your current standing:

| Card | What It Shows |
|------|---------------|
| **Total Tasks** | Total task count + "X completed" subtext |
| **Total Hours** | Total estimated hours across all tasks + "X hrs scheduled" |
| **Productivity Score** | Percentage of tasks completed. Green ≥80%, Yellow ≥50%, Red <50% |
| **Overdue** | Count of past-deadline incomplete tasks. Red if any, green if none. |

### Today's Checklist (right column)

Shows two sections:

**Scheduled** — Tasks that have a schedule block today. Each item shows:
- Checkbox (click to complete/uncomplete instantly)
- Task title (strikes through when complete)
- Start and end time of the scheduled block

**Due Today** — Tasks with a deadline today (amber background). Each shows:
- Checkbox (click to complete/uncomplete)
- Task title
- Due time

When no tasks or blocks are scheduled today: "No tasks or assignments for today."

---

### Pomodoro Timer (center)

The main timer sits in the center of the dashboard. It supports three modes, switchable at any time:

| Mode | Default Duration | Label |
|------|-----------------|-------|
| **Pomodoro** | 25 minutes | "Focus Session" |
| **Short Break** | 5 minutes | "Short Break" |
| **Long Break** | 15 minutes | "Long Break" |

#### Timer Controls

| Button | Action |
|--------|--------|
| **Play/Pause** (green circle) | Start or pause the current session |
| **Reset** (restart icon) | Reset timer to the start of the current mode |
| **Mode buttons** (Focus / Short Break / Long Break) | Switch between timer modes |
| **Settings** (gear icon) | Opens the Timer Settings dialog |

#### Timer Settings Dialog

Click the gear icon to open the "Focus Setup — Timer Settings" dialog. You can set custom durations for all three modes:

| Field | Range | Label |
|-------|-------|-------|
| **Focus Duration** | 1–60 min | "Focus Duration" |
| **Short Break** | 1–30 min | "Short Break" |
| **Long Break** | 1–60 min | "Long Break" |

Fields accept numbers only. Values snap to their allowed range on blur. Click **Save Settings** to apply. The timer resets to your new durations immediately. Click **Cancel** to discard.

> Your custom timer durations persist across sessions. Default values (25/5/15) are always shown in the field hints.

---

### Focus Atmosphere Panel

Below the timer and stats is the **Focus Atmosphere** panel. It has two controls in the header:

| Button | Action |
|--------|--------|
| **Show / Hide** | Expand or collapse the atmosphere selector grid |
| **Glass / Solid** | Toggle UI transparency (Glass = semi-transparent panel style) |
| **Hide All UI** | Hides all UI elements, leaving only the background video playing. A subtle **Show UI** button and a **Mini Timer toggle** (timer icon) appear at the bottom-left. |

#### Hide All UI Mode

When you click **Hide All UI**, the entire interface fades away. You are left with:
- The full-screen animated background playing unobstructed
- A small timer icon (bottom-left) — click to show the **draggable Mini Timer**
- A **Show UI** button (bottom-left) — click to restore the full interface

#### Draggable Mini Timer

While in Hide All UI mode, click the timer icon to open the Mini Timer — a floating, draggable panel showing:
- Current timer mode label
- Countdown in MM:SS format
- Reset button, Play/Pause button, Settings gear
- Focus / Short / Long mode switcher pills

Drag the panel anywhere on the screen by clicking and dragging its body. Settings opens the same Timer Settings dialog as the main timer.

---

### Live Backgrounds

In the Atmosphere panel, click **Live Backgrounds** to open the background picker.

#### Category Filter

Filter by: All / Nature / Cafe / City / Anime / Abstract

#### Live Preview Toggle

A **"Live Previews: Smart / All"** button in the top-right of the grid controls thumbnail animation:
- **Smart** (default) — only the hovered or active thumbnail animates (better performance)
- **All** — all thumbnails animate simultaneously (more visually rich, heavier on resources)

#### Available Backgrounds

| Category | Options |
|----------|---------|
| **Default** | Static app background |
| **Nature** | Waterfall Forest, Reeds in Wind, Flower Bloom, Forest Water River, Moving Through Forest, Mountains Clouds |
| **Anime** | Girl Coding Dark, Guy Music, Night Time Japan, Girl Studying Night, Girl Studying Day, Train Anime |
| **Cafe** | Moka Pot Leaves, Espresso Beans Falling, Coffee Machine, Boiling Coffee, Coffee with Hot Water, Outside Cafe |
| **City** | Speed City, Slow Skyscrapers, Speed Night City Cars, Eagle Drone Roundabout, Slow Evening Highway, New York City Highways |
| **Abstract** | Blue Lines, Orange Leaves Motion, Particles Plexus Network, Ink Water Underwater, Pink Ink Paint, Sea Waves Reflection |

Hover over a thumbnail to preview the animation. Click to select it as the active background. The active background is highlighted with a green border.

Your selected background is saved automatically and restored the next time you visit the Dashboard.

---

### Soundscapes

In the Atmosphere panel, click **Sounds** to open the soundscape picker.

#### Sound Category Filter

Filter by: All / Ambiance / Workspace / Nature Sounds / Weather / Urban / Brainwaves / Noise

#### Full Soundscape List

| Category | Soundscapes |
|----------|-------------|
| **Ambiance** | Cafe, Fireplace, Lava, Restaurant, Outer Space |
| **Workspace** | Keyboard Typing, Design Lab, Office |
| **Nature Sounds** | Ocean, Wind Chimes, Park, Jungle, Lake Pier, Birds Chirping |
| **Weather** | Rain, Rain Car Roof, Splatty Rain, Thunderstorm |
| **Urban** | City Rooftop, Street |
| **Brainwaves** | Delta Waves, Theta Waves, Alpha Waves, Beta Waves, Gamma Waves |
| **Noise** | White Noise, Pink Noise, Brown Noise, Gray Noise, Blue Noise |
| **Special** | No Sound (silence / stop all audio) |

Each card shows the sound's icon, category label, name, and a short description of what it sounds like. A speaker icon indicates whether that sound is currently playing.

#### Playing a Soundscape

Click any soundscape card to start playing it. Clicking the currently playing sound again stops it. Only one sound plays at a time.

#### Volume Control

At the bottom of the Sounds panel, a volume slider labeled **"Volume"** (range 0–1) adjusts playback in real time. The current sound's description is shown next to a "Now Playing" or "Select a sound to play" label.

Your selected soundscape and volume level are saved automatically per user.

---

## 8. Focus Music

In the left column of the Dashboard, below the stat cards, is the **Focus Music** panel.

Click **Show** to expand it. A provider selector appears with two options:

### Spotify Provider

Select "Spotify" from the provider dropdown. A playlist dropdown offers:
- **Lofi Beats**
- **Deep Focus**
- **Ambient**

The selected Spotify playlist embeds directly in the panel via an iframe player.

Below the player:
- **Connect Spotify** — Initiates the Spotify OAuth popup flow (see Section 9)
- **Open Spotify** — Opens Spotify in a new browser tab

### YouTube Provider

Select "YouTube" from the provider dropdown. A mood dropdown offers:
- **Lofi Beats** — "Deep Focus Lofi" by Lofi Girl (live stream)
- **Synthwave** — "Synthwave Radio" by Lofi Geek (live stream)
- **Coding Mix** — "Coding Mix" by Chill Music Lab

A YouTube embed shows the selected video. Controls:
- **Previous / Play-Pause / Next** buttons
- A **Queue** section listing all three tracks — click any to switch to it and start playback
- **Open YouTube Music** — Opens YouTube Music in a new tab
- **Connect YouTube** — Opens Google sign-in in a new tab

---

## 9. Connecting Spotify

Connecting Spotify allows you to control playback within 11Planner. The connection uses the official Spotify OAuth PKCE flow.

1. In the Focus Music panel (Dashboard), ensure "Spotify" is the selected provider and click **Show**.
2. Click **Connect Spotify**.
3. A Spotify authorization popup opens (520×760 px). If it is blocked by your browser, allow popups for this site and try again.
4. Log in to Spotify and grant access.
5. The popup closes automatically and the panel shows a green **"Connected"** badge.

**Error states:**
- "Popup was blocked. Allow popups and try again." — Browser blocked the authorization window.
- "Spotify connect window was closed before finishing." — You closed the popup early; try again.
- "Spotify authorization was canceled or failed." — You denied access or an error occurred in Spotify.
- "Spotify token exchange failed. Check Spotify redirect URI and backend server." — Backend configuration issue; contact support.

> **Note:** A Spotify Premium account is required for in-app playback control. Free accounts can still open Spotify in a new tab via the "Open Spotify" button.

---

## 10. Canvas LMS Sync (Chrome Extension)

11Planner includes a Chrome extension that pulls your assignments directly from Canvas into your task list.

### Installing the Extension

1. Download the extension files from the **Courses** page (link provided in the app).
2. Open Chrome and go to `chrome://extensions`.
3. Toggle **Developer Mode** on (top-right).
4. Click **Load Unpacked** and select the downloaded `canvas-extension/` folder.
5. The 11Planner extension icon appears in your Chrome toolbar.

### Syncing Assignments

1. In Chrome, navigate to any of your Canvas LMS course pages.
2. Click the 11Planner extension icon in the toolbar.
3. Click **Sync to 11Planner**.
4. Your assignments and syllabus-derived deadlines will appear in your Tasks list within seconds.

---

## 11. Profile & Preference Quiz

Navigate to **Profile** from the navigation bar.

### Profile Overview

Your profile page shows:
- **Your name and email address**
- **Account creation date**
- **Total Tasks** — count of all tasks created
- **Completed Tasks** — count of finished tasks
- **Overall Completion** — percentage of tasks completed
- **Total Courses** — number of courses this semester

### Preference Quiz

Click **"Take Preference Quiz"** to open the onboarding questionnaire. This quiz asks about:
- Your year of study and major
- Preferred study times (morning, afternoon, evening)
- Learning style preferences (Visual, Auditory, Reading, Kinesthetic)
- Preferred study session length and break frequency
- Workload tolerance per week

The AI uses these preferences when generating your schedule to fit your lifestyle. You can retake the quiz at any time to update your preferences.

After submitting, you are redirected to the **Quiz Submitted** confirmation page.

### Account Actions

From your Profile page:
- **Change Password** — navigate to Settings → Security
- **Delete Account** — permanently removes your account and all data. This action cannot be undone. Contact support if needed.

---

## 12. Settings & Notifications

Navigate to **Settings** from the navigation bar.

### Schedule Preferences

| Setting | Description |
|---------|-------------|
| **Maximum daily study hours** | Caps how many hours the AI will schedule in a single day to prevent burnout |
| **Preferred study start time** | Earliest time the AI will place a study block |
| **Preferred study end time** | Latest time the AI will place a study block |
| **Session duration** | Preferred length of each study block (e.g., 50 minutes) |
| **Break frequency** | How often the AI inserts breaks between blocks |
| **Difficulty preference** | Conservative / Balanced / Aggressive — controls how tightly the AI packs your schedule |

Click **Save Preferences** to apply. The app will suggest regenerating your schedule to reflect the changes.

### Notification Settings

Navigate to **Notifications** from the navigation bar (or Settings → Notifications).

| Option | Description |
|--------|-------------|
| **Email reminders** | Receive email alerts for upcoming deadlines |
| **Daily digest** | A daily email summarizing tasks due that week |
| **Completion milestones** | Notifications when you hit progress milestones |
| **In-app notifications** | Browser notifications for reminders and alerts |
| **Focus session alerts** | Notification when a Pomodoro session or break ends |

### Theme & Display

| Option | Options |
|--------|---------|
| **Dark Mode** | Toggles between light and dark UI themes |
| **System Default** | Follows your device's system theme setting |

---

## 13. AI Support Assistant

A chat bubble labeled with a headset icon is fixed in the bottom-right corner of every page.

### Opening the Assistant

Click the chat bubble icon to expand the panel. The assistant greets you and waits for your input.

### What You Can Ask

- **How-to questions** — "How do I generate a schedule?" / "Where do I add a course?"
- **Study advice** — "I have a final exam on Friday, can you help me plan?"
- **Task guidance** — "What tasks are overdue?"
- **General questions** about 11Planner features

The assistant has awareness of your current courses and tasks, so it can give context-relevant answers.

### Closing the Assistant

Click the **X** on the chat panel to close it.

---

## 14. Exporting Your Schedule

From the **Schedule** page, two export options are available:

### PDF Export
1. Click the **download icon** in the top-right of the Schedule page.
2. Select **"Export as PDF"**.
3. A formatted PDF of your current view downloads to your device.
4. Share this with professors or print it for your planner.

### Calendar Export (.ics)
1. Click **"Export to Calendar"**.
2. An `.ics` file downloads.
3. Import it into:
   - **Google Calendar** — Settings → Import & Export → Import
   - **Apple Calendar** — File → Import
   - **Outlook** — File → Open & Export → Import/Export

---

## 15. Troubleshooting & FAQ

**Q: Why can't I create a task?**  
A: The "New Task" button is disabled until you have at least one course. Navigate to Courses and add one first.

**Q: My schedule isn't generating.**  
A: Confirm you have at least one course and one task with a due date and estimated hours. Check that your internet connection is stable and the backend server is running.

**Q: The AI time estimate is unavailable.**  
A: This feature requires a signed-in account (not the demo mode) and a running backend server with a valid OpenAI API key configured.

**Q: The Spotify popup was blocked.**  
A: Allow popups for the 11Planner domain in your browser settings (usually found under Settings → Privacy → Site Settings → Pop-ups).

**Q: My background video failed to load.**  
A: A small toast notification appears in the bottom-right: "Video failed to load. Showing static fallback." This is typically a slow connection or cached file issue. Refresh the page to retry.

**Q: My saved soundscape or background isn't loading on the Dashboard.**  
A: Preferences are saved in your browser's localStorage per user. Clearing browser data will reset them. Switching accounts also resets the atmosphere to defaults.

**Q: My course days are saving in the wrong order.**  
A: Days are always stored and displayed in Monday–Friday order regardless of the order you selected them.

**Q: I uploaded a syllabus but the fields didn't fill in.**  
A: Some syllabi have non-standard formatting that the AI cannot parse reliably. A dialog will explain what went wrong. Fill in the fields manually and save.

**Q: I can't log out.**  
A: Click **Logout** in the top navigation. If this doesn't work, clear your browser cookies for the site and reload.

---

### Common Issues Quick Reference

| Issue | Solution |
|-------|----------|
| Login fails | Check password; use "Forgot password?" if needed; clear browser cache |
| Tasks not appearing | Refresh the page; check that the backend is running |
| Schedule empty after generate | Verify you have courses with times and tasks with deadlines |
| Notifications not arriving | Check browser notification permissions; confirm email address is correct |
| Timer not working | Refresh; check that JavaScript is enabled; try a different browser |
| Slow performance | Close excess browser tabs; try a different browser |
| Canvas sync not working | Make sure you are logged into Canvas in the same Chrome session |

---

## 16. Keyboard Reference & Glossary

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + P` | Print current page or schedule view |
| `Escape` | Close open dialogs and modals |
| `Tab` | Navigate between form fields |
| `Enter` | Submit forms or confirm dialogs |

---

### Glossary

| Term | Definition |
|------|------------|
| **Schedule Block** | A time slot on the calendar dedicated to studying a specific task |
| **Pomodoro** | A time management method: 25 minutes focused work + 5-minute break, repeat 4× then take a 15-minute break |
| **Soundscape** | An ambient audio environment generated or streamed for background listening during focus sessions |
| **Priority Level** | A 1–5 rating indicating how urgent a task is: Very Low → Low → Medium → High → Critical |
| **Productivity Score** | Completed tasks ÷ total tasks, expressed as a percentage |
| **Syllabus Parsing** | AI extraction of course details (name, code, professor, times, assignments) from an uploaded PDF |
| **PKCE** | Proof Key for Code Exchange — the secure OAuth flow used for Spotify authentication |
| **Canvas LMS** | The learning management system used by Wayne State University for course materials and assignments |
| **Conflict** | Two schedule blocks occupying the same time slot, or a deadline that cannot be met given available hours |
| **Overdue** | A task whose deadline has passed and which has not been marked complete |

---

**11Planner Development Team**  
Wayne State University — For feedback or corrections, visit the Support page.