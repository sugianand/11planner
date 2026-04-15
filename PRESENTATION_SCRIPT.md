# 11Planner – Prototype 3 Presentation Script

## Skit Flow (Q&A by Page)

---

## Intro – The Stressed Student, Part 2

*(Aaraiz walks in looking overwhelmed, carrying an even bigger stack of books and his laptop)*

**Aaraiz** *(stressed)*:
"Okay, so last time 11Planner helped me organize my tasks... but it's finals season now. I have three massive projects, exams, and I literally don't know how long anything is going to take or what to study first. I have the tasks, but I need something to actually build my life around them and keep me focused while I work!"

*(The 11Planner Team — Sugi, Tamanna, Ayham — enters smiling.)*

**Sugi**:
"Welcome back, Aaraiz! We knew finals season was coming, which is exactly why we didn't stop at Prototype 1. Welcome to the complete 11Planner experience."

"We've taken it from a simple organizational tool to a fully intelligent, immersive planning system. We added AI estimations, a dynamic scheduling engine, deep personalization, and immersive study environments."

**Tamanna**:
"In this version, we aren't just storing your tasks — we are actively predicting how long they take, automatically generating the perfect schedule based on your deadlines, and giving you a customizable space to actually sit down and get the work done."

**Aaraiz**:
"So it actually builds the schedule for me now?"

**Team** *(together)*:
"Yes — and a whole lot more."

---

## Scene 1 – Landing Page & Authentication

**Aaraiz**:
"Alright, let me pull up the site."

*(Opens 11Planner landing page)*

**Ayham**:
"Before you log in, notice the landing page. We built this so any visitor immediately understands what 11Planner does. It highlights our three core pillars — Deadline Drift Control, Rhythm-Based Planning, and One-View Clarity — plus a three-step workflow showing how it works. There's even an interactive demo schedule right here so people can see it in action before signing up."

**Aaraiz**:
"That's clean. Okay let me log in. Wait — last time I forgot my password and had to make a new account..."

**Ayham**:
"Not anymore. We have a full Forgot Password flow now. Click that link, enter your email, and Supabase sends you a secure reset link. The reset page lets you set a new password right in the app."

*(Aaraiz logs in successfully)*

**Aaraiz**:
"Hold on — what's this Demo link on the landing page?"

**Ayham**:
"That's our guided product tour page. We built it as a dedicated space where new visitors can watch a walkthrough video of the entire app before they even create an account. It's still being finalized, but it'll give a full preview of what 11Planner can do."

---

## Scene 2 – The Preference Quiz

**Aaraiz**:
"Wait... I'm seeing a quiz instead of my dashboard?"

**Ayham**:
"Exactly. For new users, right after registration you're greeted with our Onboarding Preference Quiz. We know every student works differently, so this six-step quiz learns your habits before we generate anything."

*(Aaraiz clicks through the step tabs)*

**Ayham**:
"Step one asks your preferred work time — morning, afternoon, or evening. Step two is your available work days. Step three is your break style — anything from short 15-minute bursts to full 90-minute deep-work immersion sessions. Step four asks how you approach assignments — do you start early, sprint near the deadline, or stay balanced? Step five sets your daily study hour limit on a slider from 1 to 12 hours so the system never overloads you. And step six is a free-text box for anything extra."

**Aaraiz**:
"And these tabs at the top are clickable? I can jump between steps?"

**Ayham**:
"Yep — full step navigation with a progress bar. And for returning users, the quiz pre-fills your saved answers so you can update preferences anytime from your profile."

---

## Scene 3 – Profile Page

**Aaraiz**:
"Okay, quiz done. Let me check my profile real quick."

*(Navigates to Profile)*

**Tamanna**:
"Your Profile page shows your avatar, name, and email. You can edit your name inline. But what's really cool is the stats section — it shows your total tasks, completed count, in-progress count, and your overall completion rate as an animated ring."

**Aaraiz**:
"What does 'Locked In' mean next to my name?"

**Tamanna**:
"That's your Focus Tier. It changes based on your completion rate — Getting Started, Building Momentum, In The Zone, or Locked In at 80% and above. It's a nice motivational indicator. You can also see your quiz status and retake it anytime from here."

---

## Scene 4 – Advanced Courses & Syllabus Parsing

**Aaraiz**:
"Alright, let me check my courses. Whoa, this looks different."

**Sugi**:
"Yes! We completely revamped the Courses page. You can now search, sort by name or time, and filter courses by type — All, Online, In-Person, or Lab. There's also a stats bar at the top showing your totals. And all times display in clean 12-hour AM/PM format."

**Aaraiz**:
"Wait, courses have a lab section now?"

**Sugi**:
"Exactly — when creating a course, you can toggle 'Has Lab' and enter separate lab days, times, and whether it's online or in-person. The scheduler treats labs as separate busy blocks so it won't schedule study time during your labs either."

**Aaraiz**:
"And what's this upload button on every course card?"

**Sugi**:
"That's our Syllabus Parser. Upload a syllabus PDF directly to its specific course card, and our backend extracts the core course details automatically."

---

## Scene 5 – Tasks & The AI Estimator

**Aaraiz**:
"Okay, courses are in. Let me add my final paper to Tasks."

*(Types in task details)*

"But honestly... I have no idea how long a 15-page Capstone report takes. Should I guess?"

**Tamanna**:
"You don't have to! Hit the AI Estimate button. Our backend sends your task title, description, deadline, and priority to GPT-4o-mini, which analyzes the complexity and suggests a realistic time estimate rounded to the nearest quarter hour."

**Aaraiz**:
"It actually predicts the time? And I can accept or change it?"

**Tamanna**:
"Exactly — a confirmation dialog pops up and you can accept or dismiss the suggestion. And notice — I pasted a link to my rubric in the description and it's actually clickable now."

**Aaraiz**:
"Nice. What about organizing all my tasks?"

**Tamanna**:
"We've got tabs for Pending and Completed tasks, a search bar, sorting by deadline, name, or priority, and filters by course, deadline window — today, next 7 days, next 30 days, or overdue — and by type: Assignment, Exam, or Project. Each type gets its own color-coded pill. Plus pagination so it doesn't get overwhelming."

**Aaraiz**:
"And I can check things off from here?"

**Tamanna**:
"Yep — one click toggles a task between pending and completed."

---

## Scene 6 – The Smart Scheduling Engine & Calendar Views

**Aaraiz**:
"Tasks are loaded. In Prototype 1, Generate Schedule was just a UI mockup. What happens now?"

*(Clicks "Generate Schedule" — a fully blocked-out calendar populates)*

**Aaraiz** *(amazed)*: "Whoa. It actually put everything into time slots."

**Tamanna**:
"Our backend scheduling engine is fully live. The algorithm reads your quiz preferences — work time window, available days, break style, and daily hour limit. It sorts tasks by deadline urgency and priority, then maps them into study blocks that fit your schedule. It even avoids your class times and lab sessions automatically."

**Aaraiz**:
"And I've got four different views? Day, Week, Month, Year?"

**Tamanna**:
"Yes — Day View shows a 15-minute slot grid. Week View gives you a 7-day timeline. Month View is a traditional calendar with event dots. And Year View is a 12-month overview with event indicators. You can navigate with Previous, Next, and Today buttons on all views."

**Aaraiz**:
"Wait — can I drag this block to a different time?"

**Sugi**:
"Absolutely. Day and Week views support full drag-and-drop rescheduling with 5-minute snap precision. Month view lets you drag events between days. The system checks for overlaps and course conflicts in real time — if there's a collision, it shows an error and prevents it."

**Aaraiz**:
"This is amazing. But what if I want to sync this to my phone calendar?"

**Sugi**:
"Hit the Export button — it generates an ICS file you can import directly into Google Calendar, Apple Calendar, or Outlook. Or use Subscribe for a live-syncing calendar link."

**Aaraiz**:
"And I see a Color-by toggle here..."

**Sugi**:
"You can color your blocks by Priority — red, yellow, blue — or by Course, which gives each course its own color. Makes it easy to visually scan your week."

---

## Scene 7 – The Immersive Focus Dashboard

**Aaraiz**:
"Okay, schedule is built. Now I actually have to study. Last time you mentioned music and vibes... did you deliver?"

**Sugi**:
"We didn't just deliver — we built a completely immersive study environment."

*(Navigates to Dashboard)*

"Welcome to the Focus Dashboard. First — your visual atmosphere. We have over 30 video backgrounds across six categories: Nature scenes like waterfalls and forests, Anime study vibes, Cozy Cafe settings, City skylines, and Abstract visuals. You can filter by category or browse them all."

**Aaraiz**:
"And the audio side?"

**Sugi**:
"We built a full ambient soundscape engine with over 25 sounds across seven categories — Nature sounds like ocean waves and birds chirping, Weather like rain and thunderstorms, Cafe and fireplace ambiance, Workspace sounds like keyboard typing, Brainwave frequencies for focus — delta, theta, alpha, beta, and gamma waves — plus white, pink, and brown noise. Each has a volume slider."

**Aaraiz**:
"What about actual music?"

**Sugi**:
"Three providers. Spotify — we built a full OAuth authentication flow so you log into your real Spotify account and control your playlists right here, embedded in the page. YouTube — we have curated focus tracks with Lofi, Synthwave, and Coding moods, plus a built-in player. And Apple Music — we pull previews from iTunes with mood-based search. All without ever leaving the dashboard."

**Aaraiz** *(selecting a cafe background and playing rain sounds with Spotify)*:
"Okay... I could seriously stay on this page for hours."

**Sugi**:
"And don't forget the Pomodoro Timer up top — Focus, Short Break, and Long Break modes, all with customizable durations. The circular progress ring gives you a visual countdown. And even if you navigate away, the timer keeps running — you'll see a floating badge showing your remaining time on every other page."

**Aaraiz**:
"And these stat cards on the side?"

**Sugi**:
"Those show your productivity score, total tasks, completed tasks, estimated hours, scheduled hours, and overdue count. And below that is Today's Checklist — your scheduled study blocks for today with their times, plus any tasks due today. You can check them off right from the dashboard."

---

## Scene 8 – Canvas Chrome Extension

**Aaraiz**:
"This is incredible. But I still have to manually type in every assignment from Canvas..."

**Ayham**:
"Not anymore. We built a Chrome Extension for Canvas LMS."

*(Opens the extension popup)*

**Ayham**:
"You install it, log in with your 11Planner credentials, navigate to your Canvas page — whether it's Instructure.com or your school's custom Canvas domain — and it detects you're on Canvas automatically. It extracts your courses from Canvas's sidebar, dashboard, and calendar. Then it pulls your assignments with their deadlines, parsing all of Canvas's different date formats."

**Aaraiz**:
"So I just click sync and it's all in 11Planner?"

**Ayham**:
"Exactly. You can even select which courses to import using the checklist with Select All and Clear All options. One click syncs your courses and tasks directly to Supabase."

---

## Scene 9 – Settings & Theme System

**Aaraiz**:
"What if I want to customize how everything looks and works?"

**Ayham**:
"Check out the Settings page. We organized it into five panels — Personalize, Schedule, Reminders, Account, and Support. And there's a search bar at the top so you can type something like 'dark mode' or 'password' and it filters straight to the right setting."

**Aaraiz**:
"Let me check Personalize."

**Ayham**:
"You've got three theme modes — Light, Dark, and Auto which follows your system setting. Then six color accent themes — Emerald, Ocean, Rose, Slate, Amber, and Violet — each with a gradient swatch preview."

**Aaraiz**:
"What about notifications?"

**Ayham**:
"The Reminders panel lets you enable browser notifications. Set how many hours before a deadline you want to be alerted. You'll get toast notifications — color-coded blue for info, amber for warnings, and red for urgent — that pop up in the corner. It tracks which tasks already notified you so you don't get spammed."

**Aaraiz**:
"And on the Account side?"

**Ayham**:
"You can change your password, export your entire schedule as a PDF, clear all your data, or delete your account permanently. There are also privacy toggles — profile visibility, analytics, personalization, and progress sharing — so you're in full control of your data."

**Aaraiz**:
"And when I log out, does my dark anime theme stay for the next person?"

**Ayham**:
"Nope. The moment you log out, the app resets to our default Emerald guest theme. Your preferences stay completely private."

---

## Scene 10 – Footer Pages

**Aaraiz**:
"I notice there's a footer on every page with a bunch of links. What's all that?"

**Ayham**:
"Those are our informational pages — every real app needs them. The About page tells our story — our mission, our planning philosophy, and each team member's role and responsibilities with smooth scroll-reveal animations. And the Logo Story page shares the creative origin behind the 11Planner name — why 11:59, what it represents, and how the brand came together."

**Sugi**:
"We also have a Privacy Policy that explains exactly what data we collect, how we store it, and how we protect it — so students know their information is safe. And the Terms of Service lays out the usage agreement, which is standard but important for a real production app."

**Tamanna**:
"Then there's our FAQ page, which answers the most common questions about using 11Planner — from getting started to troubleshooting. And the Support page gives users a dedicated place to reach out if they need help."

**Aaraiz**:
"So you really thought of everything — not just the features, but the full experience around them."

**Tamanna**:
"Exactly. A polished product isn't just about functionality — it's about trust, transparency, and giving users all the context they need."

---

## Scene 11 – Support Assistant

**Aaraiz**:
"One more thing — what if I get stuck and need help?"

**Tamanna**:
"See that floating widget in the corner? That's our Support Assistant, available on every page. It has four tabs — Home gives you context-aware hints based on what page you're on, Chat connects you to an AI-powered support bot through our backend, News shows product updates, and Help Center has categorized guides for Getting Started, Courses & Syllabus, and Task Management."

**Aaraiz**:
"So I never have to leave the app to figure something out."

**Tamanna**:
"Exactly — help is always one click away."

---

## Scene 12 – Wrap Up

**Aaraiz** *(closing his laptop slightly, looking incredibly relieved)*:
"I have to be honest. I came in here today panicking about finals. But the AI estimated my time, the schedule literally built itself around my classes, the Canvas extension pulled in all my assignments, and now I'm sitting in a virtual cafe with rain sounds and my Spotify playlist studying with a Pomodoro timer..."

*(pauses)*

"I actually want to study right now."

**Tamanna**:
"That was exactly our vision for Prototype 3. We didn't just want to build an app that holds your tasks. We wanted to build an intelligent assistant that actively removes your stress."

**Sugi**:
"By combining AI-powered estimation, a scheduling algorithm that respects your life, immersive focus environments, and a Canvas extension that eliminates manual entry — 11Planner handles the planning so you can handle the learning."

**Ayham**:
"And with six color themes, 30 video backgrounds, 25 ambient sounds, three music providers, browser notifications, drag-and-drop rescheduling, and ICS export — every part of the experience is built around how real students actually work."

**Aaraiz** *(turns to the audience, grabs his backpack confidently)*:
"You know, I used to start everything at 11:59 PM. But with 11Planner's scheduling engine... I think I might actually be done by 11:59 PM!"

*(Team laughs, end scene)*
