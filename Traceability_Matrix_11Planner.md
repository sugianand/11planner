# 11Planner — Traceability Matrix

**Date:** 03/24/2026  
**Authors:** Suganeshwara Anand, Tamanna Gaur, Ayham Huq, Aaraiz Sohail

This matrix maps each SRS requirement to its corresponding use case(s) from the Design Document and test case(s) from the Test Plan)

---

## Functional Requirements

| Requirement ID | Requirement Name | Use Case ID | Test Case ID(s) | Test Category | Priority | Pass/Fail | Tester(s) | Date | Comments |
|---|---|---|---|---|---|---|---|---|---|
| FR-1 | Sign Up Authentication | UC-01 | TC-01 | Functional | High | Pass | Suganeshwara, Aaraiz | 03/24/2026 | Account created, verification email received, login succeeded after verification. |
|  |  |  | TC-29 | System | High |  | Tamanna, Ayham |  | First-time user end-to-end setup includes sign up. |
|  |  |  | TC-33 | Acceptance | High |  | All |  | Core planning workflow starts with login. |
| FR-2 | Log In Authentication | UC-01 | TC-02 | Functional | High | Pass | Suganeshwara, Aaraiz | 03/24/2026 | Valid credentials created persistent session; protected routes accessible after refresh. |
|  |  |  | TC-19 | Non-Functional | High |  | Ayham, Tamanna |  | Authentication and dashboard redirect performance. |
|  |  |  | TC-28 | System | High |  | Tamanna, Ayham |  | End-to-end validation starts with login. |
|  |  |  | TC-31 | System | Medium |  | Tamanna, Ayham |  | Session persistence and recovery after re-login. |
| FR-3 | Log Out | UC-01 | TC-28 | System | High |  | Tamanna, Ayham |  | End-to-end includes logout/re-login. |
|  |  |  | TC-31 | System | Medium |  | Tamanna, Ayham |  | Session persistence through logout/login cycle. |
| FR-4 | Timer - Dashboard | N/A | TC-18 | Functional | High |  | Aaraiz, Tamanna |  | Timer start/pause/resume/restart functionality. |
| FR-5 | Quick Actions - Dashboard | N/A | TC-25 | Integration | Medium |  | Ayham, Tamanna |  | Quick actions (Add Task, Add Course, View Schedule) navigation. |
| FR-6 | New Task - Task Page | UC-04, UC-05 | TC-05 | Functional | High |  | Suganeshwara, Aaraiz |  | Task creation and Supabase storage verified. |
|  |  |  | TC-06 | Functional | Medium |  | Suganeshwara, Aaraiz |  | Task creation validation (invalid inputs rejected). |
|  |  |  | TC-21 | Integration | High |  | Suganeshwara, Aaraiz, Ayham |  | Task creation → dashboard stats update. |
| FR-7 | Update Tasks | UC-05 | TC-12 | Functional | Medium |  | Suganeshwara, Ayham |  | Edit task propagation to Tasks page and schedule. |
| FR-8 | Delete Tasks | UC-05 | TC-13 | Functional | Medium |  | Aaraiz, Tamanna |  | Delete task propagation — removed from UI, schedule, and Supabase. |
| FR-9 | Change Status of Tasks | UC-05 | TC-28 | System | High |  | Tamanna, Ayham |  | Marking task as completed in end-to-end flow. |
|  |  |  | TC-36 | Acceptance | Medium |  | Ayham, Tamanna |  | Mark task complete → schedule rebalance. |
| FR-10 | New Course - Courses Page | UC-02 | TC-03 | Functional | High | Pass | Suganeshwara, Aaraiz | 03/24/2026 | Course created, persisted, and appeared in task dropdown. |
|  |  |  | TC-04 | Functional | Medium |  | Suganeshwara, Aaraiz |  | Course creation validation (invalid inputs rejected). |
|  |  |  | TC-16 | Functional | Low |  | Aaraiz, Tamanna |  | Syllabus PDF parsing autofills course fields. |
| FR-11 | Edit Course | UC-02 | TC-14 | Functional | Medium |  | Aaraiz, Tamanna |  | Edit course propagation to schedule and backend. |
|  |  |  | TC-30 | System | High |  | Tamanna, Ayham |  | Regeneration ripple test after editing course. |
| FR-12 | Delete Course | UC-02 | TC-15 | Functional | Medium |  | Aaraiz, Tamanna |  | Delete course propagation — removed from UI, schedule, Supabase. |
| FR-13 | Generate Schedule | UC-06, UC-09, UC-10 | TC-07 | Functional | High |  | Suganeshwara, Ayham |  | Schedule generation with courses/tasks → study blocks displayed and stored. |
|  |  |  | TC-08 | Functional | High |  | Suganeshwara, Ayham |  | Task prioritization logic in schedule generation. |
|  |  |  | TC-10 | Functional | High |  | Suganeshwara, Ayham |  | Course conflict prevention (no overlap with class times). |
|  |  |  | TC-22 | Integration | High |  | Suganeshwara, Aaraiz, Ayham |  | Full schedule generation workflow. |
| FR-14 | Schedule Views | UC-03 | TC-27 | Integration | High |  | Tamanna, Ayham |  | Day, Week, Month, Year view consistency. |
| FR-15 | Preference Quiz | UC-07 | TC-09 | Functional | High |  | Suganeshwara, Ayham |  | Preference and study limit enforcement in generation. |
|  |  |  | TC-11 | Functional | Medium |  | Suganeshwara, Ayham |  | Break preference enforcement in schedule structure. |
|  |  |  | TC-26 | Integration | High |  | Ayham, Tamanna |  | Preference quiz persistence and usage in schedule generation. |
| FR-16 | Navigation Bar | N/A | TC-25 | Integration | Medium |  | Ayham, Tamanna |  | Quick actions navigation validates nav bar routing. |
|  |  |  | TC-34 | Acceptance | Medium |  | All |  | Interface clarity and usability — navigation testing. |
| FR-17 | Change Appearance | N/A | TC-34 | Acceptance | Medium |  | All |  | Theme switching (Light/Dark) readability verification. |
| FR-18 | Set Study Limit | UC-07 | TC-09 | Functional | High |  | Suganeshwara, Ayham |  | Study limit slider enforcement during generation. |
|  |  |  | TC-23 | Integration | High |  | Suganeshwara, Aaraiz, Ayham |  | Schedule regeneration after changing study limit. |
| FR-19 | Edit Notifications | UC-08, UC-11 | — | — | Low | — | — | — | Not directly covered by a dedicated test case. |
| FR-20 | Edit Account | UC-01 | — | — | Medium | — | — | — | Not directly covered by a dedicated test case. |
| FR-21 | Reset to Defaults | UC-07 | — | — | Low | — | — | — | Not directly covered by a dedicated test case. |
| FR-22 | Footer | N/A | — | — | Low | — | — | — | Not directly covered by a dedicated test case. |
| FR-23 | Schedule Regeneration | UC-06, UC-10 | TC-23 | Integration | High |  | Suganeshwara, Aaraiz, Ayham |  | Schedule regeneration accuracy after task/preference changes. |
|  |  |  | TC-30 | System | High |  | Tamanna, Ayham |  | Regeneration ripple test after course/task edits. |
|  |  |  | TC-36 | Acceptance | Medium |  | Ayham, Tamanna |  | Real-world weekly re-planning after completing a task. |

---

## Non-Functional Requirements

| Requirement ID | Requirement Name | Use Case ID | Test Case ID(s) | Test Category | Priority | Pass/Fail | Tester(s) | Date | Comments |
|---|---|---|---|---|---|---|---|---|---|
| NFR-1 | Schedule Generation Time | UC-10 | TC-07 | Functional | High |  | Suganeshwara, Ayham |  | Generation response verified via Network tab (HTTP 200). |
|  |  |  | TC-22 | Integration | High |  | Suganeshwara, Aaraiz, Ayham |  | Generation must complete within 10 seconds. |
| NFR-2 | Interface Clarity | N/A | TC-34 | Acceptance | Medium |  | All |  | User identifies next action within 5 seconds on Dashboard. |
| NFR-3 | Availability | N/A | TC-28 | System | High |  | Tamanna, Ayham |  | Full end-to-end flow verifies system stability. |
| NFR-4 | Security (Data Isolation) | N/A | TC-20 | Non-Functional | High |  | Suganeshwara, Aaraiz, Ayham |  | Cross-user data access isolation verified via API. |
| NFR-5 | Data Persistence | N/A | TC-31 | System | Medium |  | Tamanna, Ayham |  | Session persistence and recovery after refresh/re-login. |
|  |  |  | TC-35 | Acceptance | High |  | All |  | Data reliability — task/schedule persist through refresh and re-login. |

---

## Canvas Extension Integration

| Requirement ID | Requirement Name | Use Case ID | Test Case ID(s) | Test Category | Priority | Pass/Fail | Tester(s) | Date | Comments |
|---|---|---|---|---|---|---|---|---|---|
| EXT-1 | Canvas Assignment Sync | N/A | TC-17 | Functional | Low |  | Aaraiz, Tamanna |  | Chrome extension retrieves Canvas assignments → creates tasks. |
|  |  |  | TC-32 | System | Medium |  | All |  | Canvas-to-Planner full system flow (sync → tasks → schedule → dashboard). |

---

## Dashboard Statistics

| Requirement ID | Requirement Name | Use Case ID | Test Case ID(s) | Test Category | Priority | Pass/Fail | Tester(s) | Date | Comments |
|---|---|---|---|---|---|---|---|---|---|
| FR-5 (Dashboard) | Dashboard Statistics Accuracy | UC-09 | TC-24 | Integration | High |  | Suganeshwara, Aaraiz, Ayham |  | Total tasks, overdue tasks, estimated hours verified & updated after changes. |

---

## Summary

| Metric | Count |
|---|---|
| **Total Functional Requirements (FR)** | 23 |
| **Total Non-Functional Requirements (NFR)** | 5 |
| **Total Use Cases (UC)** | 11 (UC-01 to UC-11) |
| **Total Test Cases (TC)** | 36 |
| **Requirements with Test Coverage** | 20 / 23 FR + 5 / 5 NFR |
| **Requirements without Direct Test Coverage** | FR-19 (Edit Notifications), FR-20 (Edit Account), FR-21 (Reset to Defaults), FR-22 (Footer) |

> **Note:** FR-19, FR-20, FR-21, and FR-22 are low-priority features that do not have dedicated test cases in the current test plan. Coverage for these may be added in future testing phases.
