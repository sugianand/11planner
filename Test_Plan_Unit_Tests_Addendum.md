# 5.0 Unit Test Cases

Unit tests target individual functions and components in isolation, confirming logic correctness before integration testing.

**Tools:** pytest (backend), Jest + React Testing Library (frontend)
**Coverage Target:** 85%+ for backend logic.

## 5.0.1 Backend Unit Tests

---

| | |
|---|---|
| **ID** | UT-01 |
| **Item to Test & Description** | Route Responses: Verify health_check, root, api_ping, and fallback sync routes return correct status codes and payloads. |
| **Pre-Conditions** | 1. Backend test environment running. <br> 2. FastAPI TestClient configured. |
| **Test Steps** | 1. GET /health — verify 200 with `{"status":"ok","service":"11planner-backend"}`. <br> 2. GET / — verify 200 with welcome payload including docs_url. <br> 3. GET /api/ping — verify `{"message":"pong"}`. <br> 4. Hit each fallback sync path — verify they call sync_assignments and return matching body. |
| **Expected Results** | • All routes return 200 with expected payloads. <br> • Fallback routes delegate to sync_assignments correctly. |
| **Priority** | Medium |
| **Pass/Fail Criteria** | Pass: All routes return correct responses. <br> Fail: Any route returns wrong status or payload. |

---

| | |
|---|---|
| **ID** | UT-02 |
| **Item to Test & Description** | Syllabus Upload Validation: Verify parse_syllabus rejects non-PDFs and empty files, catches extraction/parser errors, and returns correct data for valid PDFs. |
| **Pre-Conditions** | 1. Backend test environment running. <br> 2. Test files ready: valid PDF, empty PDF, non-PDF, corrupted PDF. |
| **Test Steps** | 1. Pass a .txt file — verify rejection with file type error. <br> 2. Pass empty PDF — verify rejection. <br> 3. Pass corrupted PDF — verify exception is caught, no crash. <br> 4. Pass PDF that triggers parser error — verify caught gracefully. <br> 5. Pass valid syllabus — verify correct course name, professor, times, assignments returned. |
| **Expected Results** | • Bad files rejected with clear errors. <br> • Exceptions caught without crashing. <br> • Valid PDF returns all parsed fields. |
| **Priority** | Medium |
| **Pass/Fail Criteria** | Pass: Invalid inputs rejected, exceptions handled, valid PDF returns correct data. <br> Fail: Unhandled crash or wrong parsed output. |

---

| | |
|---|---|
| **ID** | UT-03 |
| **Item to Test & Description** | Timestamp Parsing: Verify parse_dt handles ISO with Z, with timezone offset, and plain ISO — always returning timezone-naive datetime. |
| **Pre-Conditions** | 1. Backend test environment running. <br> 2. Sample timestamps in multiple formats prepared. |
| **Test Steps** | 1. Parse `"2026-03-25T14:30:00Z"` — check correct datetime, no tzinfo. <br> 2. Parse `"2026-03-25T14:30:00+05:00"` — check normalized correctly, still naive. <br> 3. Parse plain ISO string — check correct result. |
| **Expected Results** | • All formats parse to correct values. <br> • No timezone info in any output. |
| **Priority** | High |
| **Pass/Fail Criteria** | Pass: All formats parsed correctly, output always timezone-naive. <br> Fail: Wrong values or timezone info leaks through. |

---

| | |
|---|---|
| **ID** | UT-04 |
| **Item to Test & Description** | Preference Mapping: Verify work_window_from_profile and focus_hours_from_workstyle return correct values for known inputs and default for unknown inputs. |
| **Pre-Conditions** | 1. Backend test environment running. <br> 2. Both functions imported from api/tasks.py. |
| **Test Steps** | 1. work_window_from_profile with "morning", "afternoon", "evening" — verify correct windows. <br> 2. Pass unknown value — verify default window. <br> 3. focus_hours_from_workstyle with "short", "classic", "deep-work", "full-immersion" — verify correct durations. <br> 4. Pass unknown value — verify default duration. |
| **Expected Results** | • Known values map correctly. <br> • Unknown values fall back to defaults without error. |
| **Priority** | High |
| **Pass/Fail Criteria** | Pass: Correct mappings for all known values, defaults for unknown. <br> Fail: Wrong mapping or exception on unknown input. |

---

| | |
|---|---|
| **ID** | UT-05 |
| **Item to Test & Description** | Weekday and Clock Parsing: Verify parse_course_weekday handles full names, abbreviations, and unknown strings. Verify parse_clock handles HH:MM, HH:MM:SS, AM/PM, and invalid input. Both return None for bad input. |
| **Pre-Conditions** | 1. Backend test environment running. <br> 2. Both functions imported from api/tasks.py. |
| **Test Steps** | 1. parse_course_weekday with "Monday"–"Sunday" — verify correct integers. <br> 2. With abbreviations ("Mon", "Tue", etc.) — verify same integers. <br> 3. With "Holiday" — verify None. <br> 4. parse_clock with "14:30" — verify (14, 30). <br> 5. With "02:30:00" — verify (2, 30). <br> 6. With "2:30 PM" — verify (14, 30). <br> 7. With "not-a-time" — verify None. |
| **Expected Results** | • All valid day names/abbreviations return correct integers. <br> • All valid time formats parse correctly. <br> • Invalid inputs return None. |
| **Priority** | High |
| **Pass/Fail Criteria** | Pass: Correct outputs for valid inputs, None for invalid. <br> Fail: Wrong value returned or exception instead of None. |

---

| | |
|---|---|
| **ID** | UT-06 |
| **Item to Test & Description** | Course Busy Block Generation: Verify build_course_busy_blocks generates recurring blocks for each meeting day/time and handles overnight time ranges. |
| **Pre-Conditions** | 1. Backend test environment running. <br> 2. Test courses with normal and overnight time ranges prepared. |
| **Test Steps** | 1. Course meeting Mon/Wed 10:00–11:15 AM — verify blocks appear on correct days and times. <br> 2. Add Tue/Thu 2:00–3:30 PM course — verify additional blocks, no overlap. <br> 3. Course with overnight range (10 PM–1 AM) — verify midnight crossover handled. |
| **Expected Results** | • Blocks generated on correct days with correct times. <br> • Multiple courses don't overlap. <br> • Overnight ranges handled properly. |
| **Priority** | High |
| **Pass/Fail Criteria** | Pass: All meetings produce correct blocks, including overnight. <br> Fail: Wrong days/times or overnight range breaks. |

---

| | |
|---|---|
| **ID** | UT-07 |
| **Item to Test & Description** | Schedule Block Row Mapping: Verify map_schedule_block_row renames starts_at/ends_at to API field names and calculates duration_minutes correctly. |
| **Pre-Conditions** | 1. Backend test environment running. <br> 2. Sample DB rows with known timestamps. |
| **Test Steps** | 1. Map a 2-hour block — verify start_time, end_time fields and duration_minutes = 120. <br> 2. Map a 30-minute block — verify duration_minutes = 30. <br> 3. Check other fields (id, user_id, task_id) pass through unchanged. |
| **Expected Results** | • Fields renamed correctly. <br> • Duration calculated accurately. <br> • Other fields unchanged. |
| **Priority** | Medium |
| **Pass/Fail Criteria** | Pass: Correct field names and duration values. <br> Fail: Wrong names, wrong duration, or missing fields. |

---

| | |
|---|---|
| **ID** | UT-08 |
| **Item to Test & Description** | Task CRUD: Verify create_task, get_user_tasks, get_task, update_task, and delete_task work correctly with user filtering, partial updates, and 404 for missing IDs. |
| **Pre-Conditions** | 1. Backend test environment running. <br> 2. In-memory store is empty. <br> 3. Test user ID available. |
| **Test Steps** | 1. Create task — verify ID returned, task in store. <br> 2. get_user_tasks — verify only that user's tasks returned. <br> 3. get_task with valid ID — verify matching fields. <br> 4. get_task with bad ID — verify 404. <br> 5. Update only priority — verify other fields unchanged. <br> 6. Delete task — verify removed. <br> 7. Delete non-existent ID — verify 404. |
| **Expected Results** | • CRUD operations work. <br> • User filtering correct. <br> • Partial updates don't affect other fields. <br> • 404 for missing IDs. |
| **Priority** | High |
| **Pass/Fail Criteria** | Pass: All operations and 404 handling work correctly. <br> Fail: Data doesn't persist, wrong user's data, or missing 404s. |

---

| | |
|---|---|
| **ID** | UT-09 |
| **Item to Test & Description** | In-Memory Course CRUD: Verify create, get, update, delete for courses with user filtering and 404 for missing IDs. |
| **Pre-Conditions** | 1. Backend test environment running. <br> 2. Course store is empty. <br> 3. Test user ID available. |
| **Test Steps** | 1. Create course — verify ID returned and stored. <br> 2. get_user_courses — only that user's courses returned. <br> 3. get_course with bad ID — 404. <br> 4. Update just course name — other fields stay. <br> 5. Delete course — removed from store. <br> 6. Delete bad ID — 404. |
| **Expected Results** | • CRUD works with correct user isolation. <br> • 404 for missing IDs. |
| **Priority** | High |
| **Pass/Fail Criteria** | Pass: Full CRUD cycle works with proper 404s. <br> Fail: Data issues, wrong user's data, or missing 404. |

---

| | |
|---|---|
| **ID** | UT-10 |
| **Item to Test & Description** | In-Memory Assignment CRUD: Verify create, get, update, delete for assignments with user filtering and 404 handling. |
| **Pre-Conditions** | 1. Backend test environment running. <br> 2. Assignment store is empty. <br> 3. Test user ID and course ID available. |
| **Test Steps** | 1. Create assignment — verify ID returned and stored. <br> 2. get_user_assignments — only that user's returned. <br> 3. get_assignment with bad ID — 404. <br> 4. Update just title — other fields unchanged. <br> 5. Delete — removed. Delete again — 404. |
| **Expected Results** | • CRUD works with user filtering. <br> • 404 for missing IDs. |
| **Priority** | High |
| **Pass/Fail Criteria** | Pass: CRUD and 404 handling work correctly. <br> Fail: Data doesn't save, wrong user, or no 404. |

---

| | |
|---|---|
| **ID** | UT-11 |
| **Item to Test & Description** | AI Optimizer Fallback: Verify ai__optimizer returns empty plan when API key is missing, cleans valid AI responses into JSON, and falls back safely on malformed responses. |
| **Pre-Conditions** | 1. Backend test environment running. <br> 2. API key env var controllable. <br> 3. AI responses mockable. |
| **Test Steps** | 1. Remove API key — call function — verify empty plan returned, no error. <br> 2. Set key, mock valid JSON response — verify cleaned plan returned. <br> 3. Mock broken response (bad JSON, empty string) — verify safe fallback, no crash. |
| **Expected Results** | • No key → empty plan. <br> • Valid response → cleaned JSON. <br> • Bad response → fallback, no crash. |
| **Priority** | High |
| **Pass/Fail Criteria** | Pass: All three scenarios handled without exceptions. <br> Fail: Missing key crashes, valid response not cleaned, or bad response throws. |
