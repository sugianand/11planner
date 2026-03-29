## 5.0.2 Frontend Unit Tests (TypeScript — Jest + React Testing Library)

---

| | |
|---|---|
| **ID** | UT-12 |
| **Item to Test & Description** | Course/Time Parsing Utilities: Verify parseCourseDays splits comma and space inputs, normalizeTimeForDb handles 24h/12h and rejects invalid input, and normalizeDeadlineForDb converts to ISO or throws. |
| **Pre-Conditions** | 1. Jest environment running. <br> 2. Functions imported from PlannerContext. |
| **Test Steps** | 1. parseCourseDays with "Monday, Wednesday, Friday" — verify array of three days. <br> 2. With "Mon Wed" (spaces) — verify normalized array. <br> 3. normalizeTimeForDb with "14:30" and "2:30 PM" — both valid. <br> 4. With "not-a-time" — verify rejection. <br> 5. normalizeDeadlineForDb with valid date — verify ISO output. <br> 6. With invalid date — verify throws. |
| **Expected Results** | • Both separators handled by parseCourseDays. <br> • Valid times accepted, bad ones rejected. <br> • Valid dates convert to ISO, bad ones throw. |
| **Priority** | High |
| **Pass/Fail Criteria** | Pass: All valid inputs parsed correctly, invalid inputs rejected. <br> Fail: Valid input parsed wrong or bad input accepted. |

---

| | |
|---|---|
| **ID** | UT-13 |
| **Item to Test & Description** | Data Row Mapping: Verify mapCourseRowToModel and mapTaskRowToModel convert DB rows to UI model shapes with correct defaults and status mapping. |
| **Pre-Conditions** | 1. Jest running. <br> 2. Sample DB rows prepared (full fields and null optionals). |
| **Test Steps** | 1. mapCourseRowToModel with all fields — verify correct mapping. <br> 2. With null optionals — verify defaults applied. <br> 3. mapTaskRowToModel with completed=true — verify completed status. <br> 4. With completed=false — verify pending status. |
| **Expected Results** | • All fields map correctly. <br> • Null optionals get defaults. <br> • Task status reflects completed flag. |
| **Priority** | High |
| **Pass/Fail Criteria** | Pass: Correct shapes, defaults, and status in all cases. <br> Fail: Wrong mapping, missing defaults, or wrong status. |

---

| | |
|---|---|
| **ID** | UT-14 |
| **Item to Test & Description** | Context Data Loading: Verify loadCourses, loadTasks, loadPreferences, loadScheduleBlocks return empty/null for guests, correct data for signed-in users, and handle fetch errors. |
| **Pre-Conditions** | 1. Jest running. <br> 2. Supabase client mocked for guest and signed-in. <br> 3. API fetches mocked for success and error. |
| **Test Steps** | 1. loadCourses as guest — empty array, no API call. <br> 2. As signed-in (success mock) — verify mapped courses returned. <br> 3. As signed-in (error mock) — verify no crash. <br> 4. loadTasks: guest → empty, signed-in → mapped tasks. <br> 5. loadPreferences: guest → null, signed-in → preferences, no profile → defaults. <br> 6. loadScheduleBlocks: success → loaded, error → handled. |
| **Expected Results** | • Guests get empty/null without API calls. <br> • Signed-in users get correct data. <br> • Errors handled gracefully. |
| **Priority** | High |
| **Pass/Fail Criteria** | Pass: Guest paths skip API, auth paths return data, errors don't crash. <br> Fail: Guest triggers API, data unmapped, or error crashes context. |

---

| | |
|---|---|
| **ID** | UT-15 |
| **Item to Test & Description** | Context CRUD: Verify create/update/delete for courses, tasks, and schedule blocks map payloads correctly and update local state. Also verify auth useEffect sets user ID on login and resets on logout. |
| **Pre-Conditions** | 1. Jest + RTL running. <br> 2. Supabase mocked. <br> 3. PlannerContext rendered with test state. |
| **Test Steps** | 1. createCourse — verify DB payload maps course_name, course_days, times correctly; state appended. <br> 2. updateCourse — partial change sent, state patched. <br> 3. deleteCourse — DB delete called, removed from state. <br> 4. createTask — verify task_title, deadline_at, status mapping; state appended. <br> 5. updateTask — partial update, state patched. <br> 6. deleteTask — removed from state. <br> 7. updateScheduleBlock — API called, block replaced in state. <br> 8. Login event — user ID set. Logout — resets to user_demo. |
| **Expected Results** | • Payloads use correct DB field names. <br> • State updates after each operation. <br> • Auth sync works both ways. |
| **Priority** | High |
| **Pass/Fail Criteria** | Pass: Correct field mapping, state updates, and auth sync. <br> Fail: Wrong field names, stale state, or auth sync broken. |

---

| | |
|---|---|
| **ID** | UT-16 |
| **Item to Test & Description** | API Client: Verify fetchAPI parses JSON on success and throws on errors. Verify API wrappers hit correct methods/paths. Verify API_BASE_URL respects env override and has a fallback. |
| **Pre-Conditions** | 1. Jest running. <br> 2. Global fetch mocked. <br> 3. Env var controllable. |
| **Test Steps** | 1. Mock 200 — fetchAPI returns parsed JSON. <br> 2. Mock 400/500 — fetchAPI throws. <br> 3. courseAPI.create — POST to /api/courses. <br> 4. taskAPI.getAll — GET with user_id param. <br> 5. scheduleAPI.generate — POST to /api/schedule/generate. <br> 6. Set API_BASE_URL env — verify used. Unset — verify fallback. |
| **Expected Results** | • Success parsed, errors thrown. <br> • Wrappers use correct methods/paths. <br> • URL configurable with fallback. |
| **Priority** | Medium |
| **Pass/Fail Criteria** | Pass: Parsing, errors, paths, and URL config all work. <br> Fail: Any of those behaviors is wrong. |

---

| | |
|---|---|
| **ID** | UT-17 |
| **Item to Test & Description** | Schedule Page: Verify generateSchedule sets blocks/stats on success and error on failure. Verify pendingTasks excludes completed. Verify event colors match priority and times become Dates. Verify handleEventMove sends correct payload. |
| **Pre-Conditions** | 1. Jest + RTL running. <br> 2. Schedule page rendered with mocked context. <br> 3. Backend APIs mocked. |
| **Test Steps** | 1. Successful generate — blocks and stats set, blocks reloaded. <br> 2. Failed generate — error message set. <br> 3. Mix of tasks — filter returns only pending. <br> 4. Events from blocks — colors match task priority, times are Date objects. <br> 5. Drag event — recalculated payload sent. <br> 6. With stats → cards shown. Without → hidden. No pending tasks → button disabled. |
| **Expected Results** | • State management works for success and error. <br> • Filtering, mapping, and UI conditions all correct. |
| **Priority** | High |
| **Pass/Fail Criteria** | Pass: All generation, filtering, mapping, and UI logic works. <br> Fail: State not set, wrong filter, wrong colors, or UI doesn't respond. |

---

| | |
|---|---|
| **ID** | UT-18 |
| **Item to Test & Description** | Auth Page: Verify handleInputChange updates only target field. Verify register/login validate before API calls. Verify session redirect and mode switch clears form. |
| **Pre-Conditions** | 1. Jest + RTL running. <br> 2. Auth page rendered with mocked Supabase auth. |
| **Test Steps** | 1. handleInputChange on email — only email changes. <br> 2. Register with empty field — validation error, no signUp call. <br> 3. Register with password mismatch — match error shown. <br> 4. Register with valid input — signUp + profile insert fire, mode resets. <br> 5. Login with empty fields — error, no API. <br> 6. Login success — redirect. Login failure — error message. <br> 7. Existing session on mount — redirects. <br> 8. Switch login↔register — form clears. |
| **Expected Results** | • Input changes are targeted. <br> • Validation runs before API calls. <br> • Success/failure handled correctly. <br> • Session redirect and form clear work. |
| **Priority** | High |
| **Pass/Fail Criteria** | Pass: Validation, API calls, redirects, and form clearing all work. <br> Fail: Validation skipped, wrong API calls, or stale form data. |

---

| | |
|---|---|
| **ID** | UT-19 |
| **Item to Test & Description** | Preference Quiz: Verify step navigation stays in bounds, toggleWorkday adds/removes correctly, required fields validated, logged-out gets auth error, valid submit maps correct payload, and saved preferences hydrate form. |
| **Pre-Conditions** | 1. Jest + RTL running. <br> 2. Quiz component rendered with mocked Supabase. |
| **Test Steps** | 1. Last step → nextStep — stays at max. First step → prevStep — stays at 0. <br> 2. toggleWorkday: add new day → array grows. Remove existing → array shrinks. <br> 3. Submit with missing fields — validation error, no API call. <br> 4. Submit logged out — auth error. <br> 5. Submit logged in — payload includes worktime, workdays, workstyle, assignmentplan, additional_info. <br> 6. Load with saved preferences — form pre-filled. |
| **Expected Results** | • Steps bounded. Toggle works. <br> • Validation and auth checks run before submit. <br> • Payload correct. Preferences hydrate. |
| **Priority** | High |
| **Pass/Fail Criteria** | Pass: Navigation, toggle, validation, auth, payload, and hydration all work. <br> Fail: Any of those behaviors is wrong. |

---

| | |
|---|---|
| **ID** | UT-20 |
| **Item to Test & Description** | Reset Password: Verify all validation rules (empty, min length, special char, mismatch), successful/failed updateUser, show/hide toggles, and loading state. |
| **Pre-Conditions** | 1. Jest + RTL running. <br> 2. supabase.auth.updateUser mocked. |
| **Test Steps** | 1. Empty fields → required error. <br> 2. Short password → min length error. <br> 3. No special char → special char error. <br> 4. Mismatch → mismatch error. <br> 5. Valid + mock success → updateUser called, success message. <br> 6. Valid + mock failure → error message. <br> 7. Click show/hide toggles — visibility switches. <br> 8. Submit → button shows loading state. |
| **Expected Results** | • All validation rules trigger correctly. <br> • Success/failure messages shown. <br> • Toggles and loading state work. |
| **Priority** | Medium |
| **Pass/Fail Criteria** | Pass: Validation, API call, messaging, toggles, loading all work. <br> Fail: Validation skipped, wrong messages, or UI issues. |
