# 11Planner Comprehensive Test Plan

---

## 1. Introduction

### 1.1 Overview
This document presents the comprehensive test plan for the 11Planner application, an AI-powered academic schedule planning and task management system. The 11Planner application is designed to help students efficiently manage their assignments, courses, and study schedules using intelligent schedule generation powered by OpenAI APIs.

### 1.2 Purpose
The purpose of this test plan is to define the scope, approach, resources, and schedule for testing the 11Planner application. This document ensures that all functional, non-functional, and safety requirements are thoroughly validated before release. It provides testers with all necessary information to conduct comprehensive testing without requiring additional clarifications.

### 1.3 Objectives
- Ensure all functional requirements are correctly implemented
- Verify system performance and scalability
- Validate user authentication and data security
- Confirm AI-powered schedule generation works accurately
- Ensure proper data synchronization with Canvas and Supabase
- Validate system reliability and error handling

### 1.4 Scope
This testing plan applies to all components of the 11Planner application, including:
- **Frontend**: Next.js React application with TypeScript
- **Backend**: FastAPI Python server
- **API Integration**: Canvas API, OpenAI API, Supabase
- **Features**: User authentication, course/task management, schedule generation, profile settings

### 1.5 Intended Audience
- **Quality Assurance Engineers**: Responsible for executing test cases
- **Test Analysts**: Who will design and maintain test cases
- **Developers**: Who will receive and fix defects
- **Project Management Team**: Who will track testing progress and schedule
- **Product Owners/Stakeholders**: Who will review testing outcomes
- **GTA (Graduate Teaching Assistant)**: Who will conduct acceptance testing and provide written sign-off

---

## 2. Test Objectives

### 2.1 Functional Testing
- Verify all user workflows (login, create tasks, generate schedule, manage courses)
- Validate data CRUD operations (Create, Read, Update, Delete)
- Test integration between frontend and backend APIs
- Verify Canvas assignment import functionality
- Validate schedule generation algorithm with AI optimization
- Ensure proper error handling without sensitive data exposure

### 2.2 Performance Testing
- Verify response times for API endpoints (target: <500ms for most requests)
- Test system behavior under load (concurrent schedule generation requests)
- Validate database query performance with in-memory data structures
- Schedule generation response time: <5 seconds for 10 tasks
- Page load times: <3 seconds

### 2.3 Security Testing
- Verify OpenAI API key is properly secured and not exposed
- Test user authentication and authorization
- Validate input sanitization to prevent XSS and injection attacks
- Ensure API key protection (not exposed in logs, network traffic, or code)
- Validate password security (hashing, not stored in plain text)
- Ensure data encryption in transit (HTTPS/TLS)

### 2.4 Reliability Testing
- Test system behavior when APIs (Canvas, OpenAI) are unavailable
- Verify graceful error handling for network failures
- Validate data persistence across application restarts
- Test session timeout handling
- Verify error recovery without data loss

---

## 3. Test Strategy

### 3.1 Testing Approach
**Combination Strategy (Green-box Testing)**: A combination of Black-box and White-box testing approaches will be employed:

- **Black-box Testing**: Test user-facing features and API contracts without knowledge of implementation details (authentication, schedule generation, task management)
- **White-box Testing**: Test code logic, error handling, and integration points with knowledge of implementation (schedule algorithm validation, API integration)
- **Green-box Testing**: Combination approach using both black-box and white-box techniques to maximize test coverage while maintaining realistic user scenarios

### 3.2 Testing Levels

#### 3.2.1 Unit Testing
- **Scope**: Individual functions, methods, and components
- **Examples**:
  - Schedule generator algorithm (`schedule_generator.py`)
  - Date utility functions (`dateUtils.ts`)
  - Form validation logic
  - Course code parsing logic
  - Task creation form validation
- **Tools**: Python `pytest` framework, JavaScript `Jest` framework
- **Coverage Target**: 85%+ code coverage

#### 3.2.2 Integration Testing
- **Scope**: Component interaction and API integration
- **Examples**:
  - Frontend to Backend API communication
  - OpenAI API integration for schedule optimization
  - Supabase database operations
  - Canvas API data synchronization
- **Tools**: Postman (API testing), Python `unittest.mock` (mocking external services)

#### 3.2.3 System Testing
- **Scope**: End-to-end workflows and non-functional requirements
- **Functional Examples**:
  - Complete user journey: Login → Create Tasks → Generate Schedule → View Schedule
  - Schedule generation with multiple tasks and constraints
  - Course management with multiple semesters
- **Non-Functional Focus** (Performance, Security, Reliability):
  - Response time validation
  - Security validation
  - Data persistence and error recovery

#### 3.2.4 Acceptance Testing
- **Scope**: User acceptance criteria validation
- **Examples**:
  - AI schedule generation produces valid schedules
  - Users can successfully plan their academic workload
  - Schedule respects user preferences (work hours, workdays, study limits)
- **Approval**: Written confirmation from GTA/Professor required

### 3.3 Special Techniques and Tools

| Technique | Tool | Application |
|-----------|------|-------------|
| API Testing | Postman / cURL | Test FastAPI endpoints |
| Frontend Testing | Jest + React Testing Library | Component and integration tests |
| End-to-End Testing | Playwright / Cypress | Browser automation testing |
| Performance Testing | k6 or Artillery | Load and stress testing |
| Mock Services | unittest.mock (Python) | Isolate API dependencies |
| Code Quality | ESLint, Pylint | Ensure code standards |

---

## 4. Test Scope

### 4.1 In Scope (What Will Be Tested)

1. **User Authentication & Account Management**
   - User registration/signup
   - Login with email and password
   - Password reset via email
   - Session management

2. **Course Management**
   - Create, read, update, delete courses
   - Add course meeting times and days
   - View course list

3. **Task/Assignment Management**
   - Create tasks manually
   - Import tasks from Canvas
   - Edit task details (title, deadline, estimated hours, priority)
   - Delete tasks
   - Mark tasks as complete

4. **Schedule Generation**
   - Generate schedule for pending tasks
   - AI-powered schedule optimization
   - Respect user preferences (work hours, workdays, study limits)
   - Handle multiple concurrent requests

5. **Schedule Viewing and Management**
   - View schedule in calendar format
   - Manually adjust schedule blocks
   - Drag and drop schedule items
   - View schedule details

6. **User Preferences**
   - Set work hours
   - Set preferred workdays
   - Set study hour limits
   - Set work style preferences

7. **Focus Features**
   - Background selection and display
   - Ambient sound selection
   - Timer functionality

8. **API Integration**
   - Canvas assignment import
   - OpenAI schedule optimization
   - Supabase database operations

### 4.2 Out of Scope (What Will NOT Be Tested)

1. **Mobile Application**: Only web/desktop testing
2. **Third-party Authentication**: Google login, Microsoft login (if implemented, separate testing)
3. **Accessibility (WCAG)**: Not included in this testing scope
4. **Internationalization**: Non-English language support not tested
5. **Performance beyond baselines**: Stress testing beyond 500ms response times
6. **Infrastructure/Deployment**: Server setup and DevOps testing excluded
7. **Database Migration**: Data migration testing not included

### 4.3 Features In Scope
1. **User Authentication**: Sign up, login, password reset
2. **Course Management**: Create, read, update, delete courses; Add course schedules
3. **Task Management**: Create assignments from Canvas/manual entry; Edit task details
4. **Schedule Generation**: AI-powered schedule generation; Manual schedule adjustments
5. **Schedule Viewing**: Weekly, monthly, and custom views
6. **Profile Settings**: Work hour preferences, work-style preferences, study limits
7. **Focus Features**: Background selection, ambient sound options
8. **Data Import**: Canvas assignment synchronization

---

## 5. Test Deliverables

### 5.1 Test Planning Artifacts
- [x] Test Plan Document (this comprehensive document)
- [ ] Test Strategy and Approach Document
- [ ] Requirement Traceability Matrix (RTM)

### 5.2 Test Design Artifacts
- [x] Test Cases and Test Scripts
- [ ] Test Data Sets
- [ ] Mock Data Specifications

### 5.3 Test Execution Artifacts
- [ ] Test Execution Reports
- [ ] Test Coverage Report
- [ ] Defect Reports with Screenshots
- [ ] Pass/Fail Summary

### 5.4 Test Environmental Artifacts
- [ ] Test Environment Setup Guide
- [ ] API Documentation Reference
- [ ] Test Database Initialization Scripts

---

## 6. Test Schedule

### 6.1 Test Timeline

| Phase | Duration | Start Date | End Date | Priority | Deliverables |
|-------|----------|-----------|----------|----------|--------------|
| Test Planning & Design | 2 days | Day 1 | Day 2 | P0 | Test Plan, Test Cases, Test Data |
| Unit Testing | 2 days | Day 3 | Day 4 | P0 | Unit test results, code coverage report |
| Integration Testing | 2 days | Day 5 | Day 6 | P0 | API test results, integration test report |
| System Testing (Functional) | 2 days | Day 7 | Day 8 | P0 | Functional test results, defect report |
| System Testing (Non-Functional) | 1 day | Day 9 | Day 9 | P1 | Performance/security/reliability results |
| Acceptance Testing | 1 day | Day 10 | Day 10 | P0 | UAT report, written sign-off from GTA |
| Defect Remediation | 1 day | Day 11 | Day 11 | P0 | Bug fixes verified |
| Test Closure & Reporting | 1 day | Day 12 | Day 12 | P1 | Final test report, traceability matrix |

**Total Test Timeline**: 12 days

### 6.2 Test Execution Order (by Priority)
1. **P0 (Critical)**: User authentication, task creation, schedule generation
2. **P1 (High)**: Course management, task editing, schedule viewing
3. **P2 (Medium)**: Focus features, preference management
4. **P3 (Low)**: UI refinements, performance optimizations

---

## 7. Test Environment

### 7.1 Hardware Requirements
- **CPU**: Intel i5/AMD Ryzen 5 or better (4+ cores)
- **RAM**: 8GB minimum (16GB recommended)
- **Disk**: 20GB free space
- **Network**: Stable internet connection (for API testing)
- **Monitors**: At least one 1920x1080 monitor (for UI testing)

### 7.2 Software Requirements

**Backend**:
- Python 3.8 or higher
- FastAPI web framework
- Uvicorn ASGI server
- python-dotenv for environment variables
- openai==1.58.0 (for AI optimization)
- pypdf==5.4.0 (for syllabus parsing)
- supabase==2.15.3 (for database)

**Frontend**:
- Node.js 18 or higher
- npm or yarn package manager
- Next.js framework
- TypeScript
- React

**Testing Tools**:
- Python: pytest, unittest, pytest-cov
- JavaScript: Jest, React Testing Library
- API: Postman
- Performance: k6 or Artillery
- Browsers: Chrome, Firefox, Safari, Edge (latest versions)

**Services**:
- Supabase (cloud database)
- OpenAI API (with valid API key)
- Canvas API (for assignment import)

### 7.3 Test Environment Setup

**Backend Setup**:
```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt

# Create .env file
copy .env.example .env
# Edit .env and add OpenAI API key

# Start backend
uvicorn app.main:app --reload
# Backend will run at http://127.0.0.1:8000
```

**Frontend Setup**:
```powershell
cd frontend
npm install
npm run dev
# Frontend will run at http://localhost:3000
```

**Database Setup**:
- Use Supabase cloud (no local setup required)
- Ensure API URL and key are in backend `.env`
- Test with sample data before testing

### 7.4 Test Data Requirements

**Sample User Account**:
```
Email: testuser@wayne.edu
Password: TestPass123!
Name: Test Student
```

**Sample Courses**:
```
Course 1: CS101 - Intro to Computer Science
  Instructor: Dr. Smith
  Days: Monday, Wednesday, Friday
  Time: 09:00 - 10:30

Course 2: MATH201 - Calculus II
  Instructor: Prof. Johnson
  Days: Tuesday, Thursday
  Time: 13:00 - 14:30
```

**Sample Tasks**:
```
Task 1: Lab 6
  Course: CS101
  Deadline: 2026-03-12 23:59:59
  Estimated Hours: 3
  Priority: 4 (High)
  Description: Complete lab assignment

Task 2: Problem Set 5
  Course: MATH201
  Deadline: 2026-03-15 23:59:59
  Estimated Hours: 2
  Priority: 3 (Medium)
  Description: Complete exercises from Ch. 5

Task 3: Book Chapter Reading
  Course: CS101
  Deadline: 2026-03-20 23:59:59
  Estimated Hours: 1.5
  Priority: 2 (Low)
  Description: Read and summarize chapter
```

---

## 8. Test Entry and Exit Criteria

### 8.1 Entry Criteria (When Testing Can Begin)
- ✓ Code freeze: No new code commits without testing team approval
- ✓ Test environment is set up and verified (backend running, frontend running)
- ✓ Test plan is approved by project manager/professor
- ✓ Test cases are designed, reviewed, and approved
- ✓ Test data is prepared and loaded into test environment
- ✓ All testing tools are installed and working
- ✓ OpenAI API key is configured and working
- ✓ Supabase database is accessible
- ✓ Sample user account is created in system
- ✓ Requirements traceability matrix is prepared

### 8.2 Exit Criteria (When Testing Can Stop)
- ✓ All high-priority test cases have passed
- ✓ Critical/blocking defects are resolved
- ✓ Test coverage reaches minimum 80%
- ✓ All API response times meet performance targets
- ✓ No data loss or corruption issues detected
- ✓ Security vulnerabilities are addressed
- ✓ Test report is completed and signed off
- ✓ Traceability matrix shows 100% requirement coverage

---

## 9. Test Pass and Fail Criteria

### 9.1 Test Pass Criteria
A test case **PASSES** if:
- Expected results are achieved exactly as specified
- No unexpected errors or warnings occur
- Data is correctly persisted and retrieved
- User interface responds correctly to inputs
- Performance metrics are within acceptable range

### 9.2 Test Fail Criteria
A test case **FAILS** if:
- Expected results are not achieved
- Application crashes or hangs
- Data is corrupted or lost
- Incorrect data is displayed to the user
- Security vulnerabilities are discovered
- Performance is below acceptable threshold

### 9.3 Test Result Examples

| Scenario | Expected | Actual | Result |
|----------|----------|--------|--------|
| Create task with deadline | Task saved with deadline | Task created successfully | PASS |
| Generate schedule with 0 tasks | Display message "No pending tasks" | Message displays correctly | PASS |
| Update task estimated hours | Hours updated in database | Hours saved correctly | PASS |
| Generate schedule under 5 seconds | Response time <5000ms | Response time <5000ms | PASS |
| API key in logs | API key NOT visible | Key properly protected (not shown) | PASS |

---

## 10. Test Suspension and Resumption Criteria

### 10.1 Suspension Criteria
Testing may be suspended if:
- Critical blocker bug prevents test execution (e.g., backend won't start)
- Test environment is unavailable or corrupted
- Required APIs (Canvas, OpenAI) are down and cannot be mocked
- No valid test data is available
- More than 50% of critical functionality is broken

### 10.2 Suspension Process
1. Document the reason for suspension
2. Notify project stakeholders
3. Create defect ticket for blocking issue
4. Assign resolution owner and timeline
5. Pause all ongoing test execution

### 10.3 Resumption Criteria
Testing may resume when:
- Blocking issue is resolved and tested
- Test environment is restored
- Test data is available
- At least 80% of critical functionality is working

### 10.4 Resumption Process
1. Verify blocking issue is resolved
2. Re-run test cases affected by the issue
3. Document resumption in test report
4. Continue with remaining test cases

---

## 11. Test Design and Execution

### 11.1 Testing Approach
**Manual Testing** combined with **Automated Testing**:

#### Manual Testing
- **Use Cases**: User authentication, schedule generation workflows, UI interactions
- **Tools**: Chrome DevTools, browser manual testing
- **When Used**: UI/UX validation, complex user workflows, issue reproduction, exploratory testing
- **Advantage**: Better for exploratory testing, UX validation, complex scenarios

#### Automated Testing
- **Use Cases**: API endpoint validation, regression testing, performance testing
- **Tools**: pytest (backend), Jest (frontend), Postman (API automation)
- **When Used**: Repetitive tests, API validation, performance metrics
- **Advantage**: Faster execution, consistency, repeatability

### 11.2 Test Case Structure
Test cases follow standard structure:
- Test ID and Title
- Component/Feature Being Tested
- Priority Level (P0, P1, P2, P3)
- Pre-conditions
- Test Steps (detailed sequence)
- Test Data
- Expected Results
- Actual Results (to be filled during execution)
- Pass/Fail Status
- Comments/Evidence

### 11.3 Test Execution Plan

#### Phase 1: Unit Testing (Days 1-2)
- Test individual functions in isolation
- Mock external dependencies
- Achieve 85%+ code coverage

#### Phase 2: Integration Testing (Days 2-3)
- Test API endpoints
- Test component integration
- Test database operations

#### Phase 3: System Testing (Days 4-7)
- Test complete workflows
- Test data flow across components
- Validate error handling
- Performance validation

#### Phase 4: UAT (Days 8-10)
- User acceptance validation
- Real-world workflow testing
- Performance validation under typical usage

---

## 12. Test Data & Defect Management

### 12.1 Test Data Management

#### Test Data Categories
1. **User Data**: Test accounts with various roles and permissions
2. **Course Data**: Sample courses with schedules and meeting times
3. **Task Data**: Assignments with various priorities, deadlines, and durations
4. **Preference Data**: Different work preferences (early bird, night owl, etc.)

#### Test Data Preparation
```python
# Sample Test Data
TEST_USER = {
    "email": "testuser@wayne.edu",
    "password": "TestPass123!",
    "name": "Test Student"
}

TEST_COURSE = {
    "course_name": "CS101 - Intro to CS",
    "course_code": "CS-101",
    "instructor": "Dr. Smith",
    "start_time": "09:00",
    "end_time": "10:30",
    "course_days": ["Monday", "Wednesday", "Friday"]
}

TEST_TASK = {
    "title": "Lab 6",
    "deadline": "2026-03-12T23:59:59Z",
    "estimated_hours": 3,
    "priority": 4,
    "description": "Complete lab assignment"
}
```

#### Data Cleanup
- Reset test data between test runs
- Use fresh instances for each test suite
- Archive test evidence before cleanup

### 12.2 Defect Management

#### Defect Report Template
```
Defect ID: DEF-001
Title: [Brief description]
Severity: Critical/High/Medium/Low
Priority: P0/P1/P2/P3
Component: [API/UI/Schedule Generator/etc.]
Test Case ID: [Reference to failing test]
Steps to Reproduce: [Detailed steps]
Expected Result: [What should happen]
Actual Result: [What actually happened]
Environment: [Browser, OS, test setup]
Screenshots/Logs: [Attached evidence]
Assigned To: [Developer name]
Status: [Open/In Progress/Fixed/Closed]
```

#### Severity Levels
- **Critical**: System crash, data loss, security breach, complete feature failure
- **High**: Major functionality broken, significant performance degradation
- **Medium**: Minor functionality issue, workaround available
- **Low**: Cosmetic issues, minor inconveniences

#### Defect Tracking
- Use JIRA or GitHub Issues for defect tracking
- Link defects to test cases
- Track defect lifecycle and resolution time

---

## 13. Risk Analysis

### 13.1 Identified Risks

| Risk | Probability | Impact | Severity | Mitigation Strategy |
|------|-------------|--------|----------|-------------------|
| OpenAI API key exposed in code | Medium | Critical | HIGH | Code review, environment variables, secrets management |
| Schedule generation algorithm produces invalid schedules | Medium | High | HIGH | Extensive unit testing, edge case testing, AI response validation |
| Canvas API connection failures | Low | High | MEDIUM | Mock Canvas API, implement retry logic, fallback to manual entry |
| Database data corruption | Low | Critical | HIGH | Regular backups, transaction testing, rollback testing |
| Performance degradation under load | Medium | High | HIGH | Load testing, optimization, caching strategies |
| Authentication token expiration during long sessions | Low | Medium | MEDIUM | Implement token refresh, session timeout handling |
| Race conditions in concurrent schedule generation | Low | High | MEDIUM | Implement proper locking, test concurrent scenarios |
| Memory leaks in long-running processes | Low | Medium | MEDIUM | Memory profiling, process monitoring |

### 13.2 Mitigation Strategies

1. **Security Risks**
   - Implement secure credential storage (environment variables)
   - Conduct security code review
   - Test with OWASP Top 10 principles
   - Implement input validation and sanitization

2. **Performance Risks**
   - Establish performance baselines
   - Conduct load and stress testing
   - Implement caching where appropriate
   - Optimize database queries

3. **Dependency Risks**
   - Mock external APIs for testing
   - Implement proper error handling
   - Create fallback mechanisms
   - Test API integration thoroughly

4. **Data Integrity Risks**
   - Validate all data before persistence
   - Implement transaction management
   - Regular backup and recovery testing
   - Data consistency verification

---

## 14. Roles and Responsibilities

| Role | Responsibilities | Person |
|------|-----------------|--------|
| **Test Lead/QA Manager** | - Overall test planning and strategy<br>- Test schedule management<br>- Risk assessment<br>- Stakeholder communication | [Name] |
| **QA Engineer (Manual)** | - Test case design<br>- Manual test execution<br>- Defect reporting<br>- Test documentation | [Name] |
| **QA Automation Engineer** | - Test automation script development<br>- CI/CD integration<br>- Performance test setup<br>- Tool management | [Name] |
| **Developer (Backend)** | - Bug fixes<br>- Code review<br>- Unit test development<br>- API documentation | [Name] |
| **Developer (Frontend)** | - Bug fixes<br>- Component testing<br>- UI/UX validation<br>- Performance optimization | [Name] |
| **Product Owner** | - Requirements clarification<br>- UAT coordination<br>- Sign-off approval<br>- Release decision | [Name] |
| **GTA/Professor** | - UAT execution<br>- Written sign-off approval<br>- Stakeholder feedback | [Name] |

---

## 15. Test Cases

### 15.1 Test Execution Instructions
For each test case below, execute the test steps exactly as written using the provided test data. Record the actual result and compare to the expected result. Mark as PASS or FAIL.

---

## TC-001: User Registration with Valid Data

| Field | Value |
|-------|-------|
| Test ID | TC-001 |
| Item to Test | User registration (signup) |
| Description | User can create a new account with valid email and password |
| Component | Authentication |
| Priority | **P0 - Critical** |

**Pre-Conditions**:
- Application is loaded at http://localhost:3000
- Test database is empty (fresh start)
- User with email "testuser@wayne.edu" does not exist in database

**Test Steps**:
1. Click "Sign Up" button on home page
2. Enter email: `testuser@wayne.edu`
3. Enter password: `TestPass123!`
4. Enter password confirmation: `TestPass123!`
5. Enter full name: `Test Student`
6. Click "Create Account" button
7. Verify confirmation email appears in inbox
8. Click email verification link in message
9. Verify redirect to login page with success message

**Test Data**:
```
Email: testuser@wayne.edu
Password: TestPass123!
Name: Test Student
```

**Expected Result**:
- Account created successfully
- Confirmation email sent to testuser@wayne.edu
- User redirected to login page
- Success message: "Email verified successfully"
- User can log in with new credentials

**Actual Result**: 
[To be filled during test execution]

**Pass/Fail Criteria**:
- **PASS**: All steps complete successfully, user account exists in database, email verified
- **FAIL**: Account not created, verification email not sent, user cannot login with new credentials

**Priority**: P0 (blocks all further testing)

**Notes**: 
________________________________________________________________________________

---

## TC-002: User Login with Valid Credentials

| Field | Value |
|-------|-------|
| Test ID | TC-002 |
| Item to Test | User login |
| Description | Registered user can log in with correct email and password |
| Component | Authentication |
| Priority | **P0 - Critical** |

**Pre-Conditions**:
- User account from TC-001 exists and is verified
- User is on login page (http://localhost:3000/auth)
- User is not currently logged in

**Test Steps**:
1. Click on "Email" field
2. Type: `testuser@wayne.edu`
3. Click on "Password" field
4. Type: `TestPass123!`
5. Click "Log In" button
6. Wait for page to load (max 3 seconds)
7. Verify user is redirected to dashboard

**Test Data**:
```
Email: testuser@wayne.edu
Password: TestPass123!
```

**Expected Result**:
- Login successful
- Page redirects to /dashboard
- Dashboard displays "Welcome, Test Student"
- Dashboard shows "Pending Tasks" section
- User name appears in profile icon/menu

**Actual Result**: 
[To be filled during test execution]

**Pass/Fail Criteria**:
- **PASS**: User successfully logged in, dashboard displays, session is established
- **FAIL**: Login error, user remains on login page, dashboard doesn't load

**Priority**: P0 (blocks all feature testing)

**Notes**: 
________________________________________________________________________________

---

## TC-003: Create Course with Complete Details

| Field | Value |
|-------|-------|
| Test ID | TC-003 |
| Item to Test | Course creation |
| Description | User can create a new course with all required details |
| Component | Course Management |
| Priority | **P1 - High** |

**Pre-Conditions**:
- User is logged in (from TC-002)
- User is on Courses page (/courses)
- No course with code "CS101" exists

**Test Steps**:
1. Click "Add Course" or "Create New Course" button
2. Enter course name: `CS101 - Intro to Computer Science`
3. Enter course code: `CS101`
4. Enter instructor: `Dr. Smith`
5. Select days: Monday, Wednesday, Friday (check all three)
6. Enter start time: `09:00` (9:00 AM)
7. Enter end time: `10:30` (10:30 AM)
8. Click "Save Course" button
9. Verify success message appears

**Test Data**:
```
Course Name: CS101 - Intro to Computer Science
Course Code: CS101
Instructor: Dr. Smith
Days: Monday, Wednesday, Friday
Start Time: 09:00
End Time: 10:30
```

**Expected Result**:
- Course saved successfully
- Success message: "Course created successfully"
- Course appears in course list
- Course displays correct name, code, and instructor
- Course meeting times are saved correctly

**Actual Result**: 
[To be filled during test execution]

**Pass/Fail Criteria**:
- **PASS**: Course appears in list with all details correct, database record created
- **FAIL**: Course not saved, error message displayed, course missing from list

**Priority**: P1 (needed for task creation)

**Notes**: 
________________________________________________________________________________

---

## TC-004: Create Task Manually with All Required Fields

| Field | Value |
|-------|-------|
| Test ID | TC-004 |
| Item to Test | Manual task creation |
| Description | User can create a task manually with deadline and estimated hours |
| Component | Task Management |
| Priority | **P0 - Critical** |

**Pre-Conditions**:
- User is logged in (from TC-002)
- User is on Tasks page (/tasks)
- Course "CS101" exists (from TC-003)
- Task "Lab 6" does not exist

**Test Steps**:
1. Click "Add Task" or "Create Task" button
2. Enter title: `Lab 6`
3. Select course: `CS101 - Intro to Computer Science`
4. Enter deadline: `2026-03-12` (format: YYYY-MM-DD)
5. Enter estimated hours: `3`
6. Select priority: `4` (High)
7. Enter description: `Complete lab assignment`
8. Click "Save Task" button
9. Verify success message appears

**Test Data**:
```
Title: Lab 6
Course: CS101 - Intro to Computer Science
Deadline: 2026-03-12
Estimated Hours: 3
Priority: 4 (High)
Description: Complete lab assignment
```

**Expected Result**:
- Task saved successfully
- Success message: "Task created successfully"
- Task appears in pending task list
- Task shows correct title, deadline, estimated hours, and priority
- Task status is "Pending" (not completed)

**Actual Result**: 
[To be filled during test execution]

**Pass/Fail Criteria**:
- **PASS**: Task in list with correct details, database record created, can be edited later
- **FAIL**: Task not saved, error message, task missing from list, wrong data saved

**Priority**: P0 (required for schedule generation testing)

**Notes**: 
________________________________________________________________________________

---

## TC-005: Edit Task and Update Estimated Hours

| Field | Value |
|-------|-------|
| Test ID | TC-005 |
| Item to Test | Task editing |
| Description | User can edit existing task and update estimated hours |
| Component | Task Management |
| Priority | **P1 - High** |

**Pre-Conditions**:
- User is logged in
- Task "Lab 6" exists (from TC-004)
- Task has estimated hours: 3

**Test Steps**:
1. Navigate to Tasks page (/tasks)
2. Find task "Lab 6" in the list
3. Click "Edit" button next to the task
4. Click on "Estimated Hours" field
5. Clear the current value
6. Type: `4` (increase from 3 to 4)
7. Click "Save Changes" button
8. Verify success message appears
9. Verify estimated hours changed to 4 in task list

**Test Data**:
```
Task: Lab 6
New Estimated Hours: 4 (was 3)
```

**Expected Result**:
- Task updated successfully
- Success message: "Task updated successfully"
- Estimated hours now shows "4" in task list
- Database record reflects new value

**Actual Result**: 
[To be filled during test execution]

**Pass/Fail Criteria**:
- **PASS**: Estimated hours changed to 4, message confirms update, persists on reload
- **FAIL**: Hours not updated, error message, hours still show 3, changes don't save

**Priority**: P1 (important for schedule generation)

**Notes**: 
________________________________________________________________________________

---

## TC-006: Create Multiple Tasks for Schedule Testing

| Field | Value |
|-------|-------|
| Test ID | TC-006 |
| Item to Test | Multiple task creation |
| Description | Create multiple tasks with different deadlines and priorities |
| Component | Task Management |
| Priority | **P1 - High** |

**Pre-Conditions**:
- User is logged in
- Course "MATH201" does not exist yet
- Previous tasks from earlier test cases exist

**Test Steps**:
1. Create new course "MATH201":
   - Name: `MATH201 - Calculus II`
   - Code: `MATH201`
   - Instructor: `Prof. Johnson`
   - Days: Tuesday, Thursday
   - Time: 13:00 - 14:30

2. Create first additional task:
   - Title: `Problem Set 5`
   - Course: `MATH201`
   - Deadline: `2026-03-15`
   - Estimated Hours: `2`
   - Priority: `3` (Medium)

3. Create second additional task:
   - Title: `Book Chapter Reading`
   - Course: `CS101`
   - Deadline: `2026-03-20`
   - Estimated Hours: `1.5`
   - Priority: `2` (Low)

4. Verify all three tasks appear in pending list

**Test Data**:
```
Course: MATH201 - Calculus II
Task 1: Problem Set 5, 2026-03-15, 2 hrs, Priority 3
Task 2: Book Chapter Reading, 2026-03-20, 1.5 hrs, Priority 2
```

**Expected Result**:
- All tasks created successfully
- Tasks appear in pending task list
- Tasks show deadline and priority correctly
- Total pending tasks count increases

**Actual Result**: 
[To be filled during test execution]

**Pass/Fail Criteria**:
- **PASS**: 3+ tasks in list, all with correct deadlines/priorities, ready for scheduling
- **FAIL**: Task creation failed, tasks missing from list, wrong data displayed

**Priority**: P1 (prerequisite for schedule generation)

**Notes**: 
________________________________________________________________________________

---

## TC-007: Generate Schedule with Pending Tasks

| Field | Value |
|-------|-------|
| Test ID | TC-007 |
| Item to Test | Schedule generation |
| Description | System generates valid schedule for all pending tasks |
| Component | Schedule Generation |
| Priority | **P0 - Critical** |

**Pre-Conditions**:
- User is logged in
- User has at least 3 pending tasks (from TC-006)
- User has set work preferences (Mon-Fri, 9:00-17:00, 4 hrs/day limit)
- OpenAI API is configured and working
- User is on Schedule page (/schedule)

**Test Steps**:
1. Verify page shows: "3 pending tasks to schedule"
2. Review user preferences displayed:
   - Work days: Monday - Friday
   - Work hours: 09:00 - 17:00
   - Daily limit: 4 hours
3. Click "Generate Schedule" button
4. Wait for generation to complete (max 10 seconds)
5. Verify success message or schedule appears
6. Check that schedule blocks appear on calendar
7. Verify all 3 tasks have schedule blocks

**Test Data**:
```
Pending Tasks: 3 (Lab 6, Problem Set 5, Book Chapter Reading)
User Preferences: Mon-Fri, 09:00-17:00, 4 hrs/day
```

**Expected Result**:
- Schedule generated successfully
- Success message: "Schedule generated successfully"
- Schedule calendar displays with multiple blocks
- Each pending task has at least one schedule block
- Blocks respect work hours and deadlines
- Total study hours per day ≤ 4 hours
- No blocks scheduled on weekends

**Actual Result**: 
[To be filled during test execution]

**Pass/Fail Criteria**:
- **PASS**: Schedule created, all tasks have blocks, respects constraints, response < 5 sec
- **FAIL**: Schedule not generated, tasks missing blocks, constraints violated, timeout

**Priority**: P0 (core feature)

**Notes**: 
________________________________________________________________________________

---

## TC-008: Verify AI Schedule Optimization

| Field | Value |
|-------|-------|
| Test ID | TC-008 |
| Item to Test | AI-powered schedule optimization |
| Description | Generated schedule reflects AI prioritization based on deadline and priority |
| Component | AI Schedule Optimizer |
| Priority | **P1 - High** |

**Pre-Conditions**:
- User is logged in
- Schedule from TC-007 has been generated
- OpenAI API is working
- Tasks have varied priorities and deadlines

**Test Steps**:
1. Open generated schedule (view from TC-007)
2. Examine task order in schedule:
   - Lab 6: Priority 4, Deadline 2026-03-12 (today in test)
   - Problem Set 5: Priority 3, Deadline 2026-03-15
   - Book Chapter Reading: Priority 2, Deadline 2026-03-20
3. Verify high-priority/urgent tasks are scheduled first
4. Confirm schedule block sizes are reasonable (not too large)
5. Check that urgent tasks (Lab 6) appear earlier in week

**Test Data**:
```
Task 1: Lab 6 - Priority 4 (High), Due TODAY
Task 2: Problem Set 5 - Priority 3 (Medium), Due 3 days
Task 3: Book Reading - Priority 2 (Low), Due 8 days
```

**Expected Result**:
- Lab 6 scheduled first/earliest (due today)
- Problem Set 5 scheduled second
- Book Reading scheduled last
- Block durations are realistic (90 min - 2 hrs)
- No single task scheduled for > 3 hours per day

**Actual Result**: 
[To be filled during test execution]

**Pass/Fail Criteria**:
- **PASS**: Tasks ordered by urgency, blocks sized reasonably, respects deadline priority
- **FAIL**: High-priority task pushed to later dates, unrealistic block sizes, poor AI optimization

**Priority**: P1 (quality of schedule depends on this)

**Notes**: 
________________________________________________________________________________

---

## TC-009: View Schedule in Week View

| Field | Value |
|-------|-------|
| Test ID | TC-009 |
| Item to Test | Schedule week view |
| Description | User can view schedule in weekly format |
| Component | Schedule Viewing |
| Priority | **P1 - High** |

**Pre-Conditions**:
- User is logged in
- Schedule has been generated (from TC-007)
- User is on Schedule page (/schedule)

**Test Steps**:
1. Look for view option (Week, Month, Day buttons)
2. Click "Week View" button
3. Verify calendar displays 7 days (Mon-Sun)
4. Verify schedule blocks appear under their respective days
5. Verify times are displayed (e.g., "09:00 - 10:30")
6. Click next week arrow to navigate forward
7. Verify calendar updates to show next week
8. Click previous week arrow to return

**Test Data**:
```
Current Week: March 9-15, 2026
Visible Tasks: Lab 6 (due 3/12), Problem Set 5 (due 3/15)
```

**Expected Result**:
- Week view displays correctly
- All schedule blocks visible in week format
- Task names and times displayed accurately
- Navigation arrows work (prev/next week)
- Current date is highlighted
- All 3 days with tasks show blocks

**Actual Result**: 
[To be filled during test execution]

**Pass/Fail Criteria**:
- **PASS**: Week view shows all blocks, correct dates/times, navigation works
- **FAIL**: Blocks are missing, times are wrong, navigation broken, layout incorrect

**Priority**: P1 (users need to see their schedule)

**Notes**: 
________________________________________________________________________________

---

## TC-010: Modify Schedule Block - Drag and Drop

| Field | Value |
|-------|-------|
| Test ID | TC-010 |
| Item to Test | Manual schedule adjustment |
| Description | User can drag schedule block to different time/day |
| Component | Schedule Management |
| Priority | **P2 - Medium** |

**Pre-Conditions**:
- User is logged in
- Schedule has been generated
- User is viewing schedule in week view
- A schedule block is visible (e.g., Lab 6 block)

**Test Steps**:
1. Identify a schedule block on the calendar (not today's date)
2. Click and hold on the block
3. Drag block to a different time slot (e.g., 2 hours earlier)
4. Release mouse button
5. Verify block moved to new position
6. Verify success message or confirmation
7. Navigate away and back to schedule
8. Verify block stayed in new position (persistent)

**Test Data**:
```
Block to Move: Problem Set 5
From: Wednesday 14:00
To: Wednesday 16:00
```

**Expected Result**:
- Block moves to new time slot
- Task duration remains the same
- Block duration persists (not extended/shrunk)
- Change is saved to database
- Block still shows task name and time

**Actual Result**: 
[To be filled during test execution]

**Pass/Fail Criteria**:
- **PASS**: Block moved, duration unchanged, change persisted after page reload
- **FAIL**: Block didn't move, duration changed, change not saved, error occurred

**Priority**: P2 (nice to have but not critical)

**Notes**: 
________________________________________________________________________________

---

## TC-011: Set User Work Preferences

| Field | Value |
|-------|-------|
| Test ID | TC-011 |
| Item to Test | Profile work preferences |
| Description | User can set and save work day and hour preferences |
| Component | Profile Settings |
| Priority | **P1 - High** |

**Pre-Conditions**:
- User is logged in
- User is on Settings or Profile page
- Current preferences are default (Mon-Fri, 09:00-17:00)

**Test Steps**:
1. Click on "Settings" or "Profile" link in navigation
2. Find "Work Preferences" section
3. Click on "Work Days" field
4. Uncheck Saturday if checked
5. Verify Monday-Friday are checked
6. Set "Work Start Time": `09:00`
7. Set "Work End Time": `17:00`
8. Set "Daily Study Limit": `4` hours
9. Set "Workstyle": `Balanced` (from dropdown)
10. Click "Save Preferences" button
11. Verify success message appears

**Test Data**:
```
Work Days: Monday, Tuesday, Wednesday, Thursday, Friday
Work Start: 09:00
Work End: 17:00
Daily Limit: 4 hours
Workstyle: Balanced
```

**Expected Result**:
- Preferences saved successfully
- Success message: "Preferences updated successfully"
- Page shows updated values
- Preferences apply to next schedule generation

**Actual Result**: 
[To be filled during test execution]

**Pass/Fail Criteria**:
- **PASS**: Settings saved, apply to future schedules, persist after logout/login
- **FAIL**: Settings not saved, error occurred, don't apply to schedules, lost on reload

**Priority**: P1 (affects schedule quality)

**Notes**: 
________________________________________________________________________________

---

## TC-012: Error Handling - Generate Schedule with No Tasks

| Field | Value |
|-------|-------|
| Test ID | TC-012 |
| Item to Test | Error handling - no tasks |
| Description | System handles schedule generation when no pending tasks exist |
| Component | Error Handling |
| Priority | **P2 - Medium** |

**Pre-Conditions**:
- User is logged in
- All tasks have been marked as "Completed"
- User is on Schedule page
- "Generate Schedule" button should be disabled

**Test Steps**:
1. Navigate to Tasks page
2. Mark all tasks as complete (if not already)
3. Return to Schedule page
4. Observe "Generate Schedule" button
5. Verify button is disabled (grayed out)
6. Verify message shows: "0 pending tasks to schedule"

**Test Data**:
```
Pending Tasks: 0 (all completed)
Expected Action: Button disabled
```

**Expected Result**:
- "Generate Schedule" button is disabled
- Help message clearly states no pending tasks
- No error is thrown
- User understands they need to create tasks first

**Actual Result**: 
[To be filled during test execution]

**Pass/Fail Criteria**:
- **PASS**: Button disabled, helpful message displayed, no confusing errors
- **FAIL**: Button enabled but generates error, confusing message, crash occurs

**Priority**: P2 (user experience)

**Notes**: 
________________________________________________________________________________

---

## TC-013: Performance - Schedule Generation Response Time

| Field | Value |
|-------|-------|
| Test ID | TC-013 |
| Item to Test | Performance - generation speed |
| Description | Schedule generation completes in acceptable time (< 5 seconds) |
| Component | Performance |
| Priority | **P1 - High** |

**Pre-Conditions**:
- User is logged in
- User has 5-10 pending tasks
- User preferences are set
- OpenAI API is accessible
- User is on Schedule page

**Test Steps**:
1. Note current time (or use browser developer tools timer)
2. Click "Generate Schedule" button
3. Measure time until schedule appears or success message shows
4. Record actual response time

**Test Data**:
```
Number of Tasks: 7 tasks
Expected Time: < 5000 milliseconds
```

**Expected Result**:
- Schedule generates in < 5 seconds
- Response is responsive (not hanging/freezing)
- UI shows loading indicator during generation
- Success message appears after generation

**Actual Result**: 
[To be filled during test execution]
Response Time: ____________ milliseconds

**Pass/Fail Criteria**:
- **PASS**: Response time < 5000ms, UI responsive, no freezing
- **FAIL**: Response time > 5000ms, UI freezes, timeout occurs

**Priority**: P1 (users won't wait long)

**Notes**: 
________________________________________________________________________________

---

## TC-014: Security - API Key Not Exposed

| Field | Value |
|-------|-------|
| Test ID | TC-014 |
| Item to Test | Security - API key protection |
| Description | OpenAI API key is not exposed in logs, network traffic, or frontend |
| Component | Security |
| Priority | **P1 - High** |

**Pre-Conditions**:
- Application is running
- Developer tools are open (F12)
- Backend logs are visible
- Network requests can be monitored

**Test Steps**:
1. Open browser Developer Tools (F12)
2. Go to "Console" tab
3. Generate a schedule (from TC-007)
4. Check Console for any API keys in logs (should be none)
5. Go to "Network" tab
6. Look at POST request to `/api/schedule/generate`
7. Verify API key is NOT in request body or headers visible to frontend
8. Check browser LocalStorage (DevTools → Application → LocalStorage)
9. Verify API key is NOT stored in LocalStorage

**Test Data**:
```
Sensitive Data: OpenAI API key (should NOT appear anywhere)
Check Locations: Console logs, Network requests, LocalStorage
```

**Expected Result**:
- No API key appears in browser console
- No API key in network requests visible to frontend
- No API key in LocalStorage or SessionStorage
- API key only used on backend (secret)
- Frontend never has direct access to API key

**Actual Result**: 
[To be filled during test execution]

**Pass/Fail Criteria**:
- **PASS**: No API key exposed, secret properly protected, backend handles API calls
- **FAIL**: API key visible in console, in network requests, or in storage

**Priority**: P1 (critical security issue)

**Notes**: 
________________________________________________________________________________

---

## TC-015: Data Persistence - Logout and Login

| Field | Value |
|-------|-------|
| Test ID | TC-015 |
| Item to Test | Data persistence across sessions |
| Description | User data persists after logout and login |
| Component | Data Management |
| Priority | **P0 - Critical** |

**Pre-Conditions**:
- User is logged in
- User has created tasks and courses
- Generated schedule exists
- User is on any page in application

**Test Steps**:
1. Note current data:
   - Number of tasks visible: 3
   - Number of courses visible: 2
   - One generated schedule exists
2. Click user profile icon
3. Click "Logout" button
4. Verify user is logged out (redirected to login page)
5. Log back in with same credentials (testuser@wayne.edu / TestPass123!)
6. Navigate to Tasks page
7. Verify all 3 tasks still exist
8. Navigate to Courses page
9. Verify both courses still exist
10. Navigate to Schedule page
11. Verify generated schedule still exists

**Test Data**:
```
User: testuser@wayne.edu
Expected Data After Login:
- 3 tasks (Lab 6, Problem Set 5, Book Reading)
- 2 courses (CS101, MATH201)
- 1 generated schedule
```

**Expected Result**:
- User successfully logged out
- Login with same credentials successful
- All tasks visible and unchanged
- All courses visible and unchanged
- Schedule persists with same blocks
- No data lost or corrupted

**Actual Result**: 
[To be filled during test execution]

**Pass/Fail Criteria**:
- **PASS**: All data present and correct after logout/login, no data loss
- **FAIL**: Tasks/courses/schedule missing, data corrupted, wrong values, session failed

**Priority**: P0 (data loss is critical)

**Notes**: 
________________________________________________________________________________

---

## TC-016: Parse Schedule from PDF

| Field | Value |
|-------|-------|
| Test ID | TC-016 |
| Item to Test | PDF syllabus parsing |
| Description | Schedule parsing will accurately parse and retrieve information from the syllabus in PDF format |
| Component | PDF Parsing |
| Priority | **P2 - Medium** |

**Pre-Conditions**:
- User is logged in
- User is on Courses page (/courses)
- PDF syllabus file available with course information (name, code, meeting times, instructor)
- Active Internet Connection required

**Test Steps**:
1. Navigate to Courses page
2. Click "Parse Schedule" or "Import from PDF" button
3. Select a PDF file containing course information
4. System parses the PDF and extracts course details
5. Review extracted information displayed:
   - Course Name
   - Course Code
   - Instructor name
   - Meeting days and times
   - Course description (if available)
6. Verify all fields are auto-filled correctly
7. Click "Create Course" button to save the parsed course
8. Verify success message appears
9. Check that course appears in course list

**Test Data**:
```
PDF File: Sample_Syllabus.pdf
Expected Result:
- Course Name: Computer Science 101
- Course Code: CS101
- Instructor: Dr. Smith
- Meeting Days: Monday, Wednesday, Friday
- Start Time: 09:00 AM
- End Time: 10:30 AM
```

**Expected Result**:
- PDF syllabus parsed successfully
- Course information accurately extracted from PDF
- Auto-filled fields match syllabus content
- Course created with parsed information
- Course appears in Courses page and database
- No missing or corrupted data

**Actual Result**: 
[To be filled during test execution]

**Pass/Fail Criteria**:
- **PASS**: Course information autofilled from syllabus accurately, course created successfully, appears in list
- **FAIL**: Course information not filled, parsing fails, error message displayed, course not created

**Priority**: P2 (convenience feature)

**Notes**: 
________________________________________________________________________________

---

## TC-017: Canvas Extension Assignment Import

| Field | Value |
|-------|-------|
| Test ID | TC-017 |
| Item to Test | Chrome extension Canvas integration |
| Description | Test that Chrome extension will accurately add all assignments from Canvas to tasks |
| Component | Canvas Integration |
| Priority | **P2 - Medium** |

**Pre-Conditions**:
- User is logged in
- Chrome extension installed and enabled
- User is on Canvas course page with assignments visible
- Course exists in 11Planner
- Active Internet Connection required
- Backend is running

**Test Steps**:
1. Log into Canvas with user account
2. Navigate to a course page that has assignments posted
3. Verify assignments are visible on the Canvas page
4. Open the 11Planner Chrome extension
5. Extension displays available assignments from the page
6. Select which assignments to import (check multiple)
7. Click "Import Assignments" or "Add to 11Planner" button
8. Return to 11Planner application
9. Navigate to Tasks page (/tasks)
10. Verify imported assignments appear in task list
11. Check assignment details:
    - Title matches Canvas assignment
    - Due date matches Canvas due date
    - Course association is correct
12. Verify assignments are saved in Supabase database

**Test Data**:
```
Canvas Course: CS101 - Intro to Computer Science
Assignments to Import:
- Lab 5 (Due 2026-03-14)
- Project Proposal (Due 2026-03-21)
- Reading Assignment (Due 2026-03-25)
```

**Expected Result**:
- Chrome extension retrieves assignments from Canvas page
- Assignments are added to Tasks with correct information
- Task titles match assignment names
- Due dates match Canvas due dates
- Course information is preserved
- Assignments appear in Supabase database
- Assignments shown in Task page
- Pending tasks count increases
- No data corruption or loss

**Actual Result**: 
[To be filled during test execution]

**Pass/Fail Criteria**:
- **PASS**: Assignment information retrieved, appears in tasks list, stored in database, details correct
- **FAIL**: Assignment information not retrieved, error message shown, data missing or incorrect, database not updated

**Priority**: P2 (convenience feature)

**Notes**: 
________________________________________________________________________________

---

## TC-018: Timer Functionality

| Field | Value |
|-------|-------|
| Test ID | TC-018 |
| Item to Test | Timer functionality with settings |
| Description | Test that timer works as intended with start, pause, resume, restart, and settings |
| Component | Focus Timer |
| Priority | **P1 - High** |

**Pre-Conditions**:
- User is logged in
- User is on Schedule or Dashboard page where timer is accessible
- Active Internet Connection
- Backend is running
- Frontend is running

**Test Steps**:
1. Navigate to Schedule or Dashboard page
2. Locate Timer widget or button
3. Click on Timer to open it
4. Verify timer settings are visible (default: 25 minutes for Pomodoro)
5. Click "Start" button
6. Verify timer begins counting down from 25:00
7. Verify countdown is accurate (check after 5 seconds)
8. After 10 seconds of running, click "Pause" button
9. Verify timer pauses at the remaining time and displays it
10. Verify timer is no longer counting down
11. Click "Resume" button
12. Verify timer continues counting down from paused time
13. Click "Restart" button
14. Verify timer resets to original 25:00
15. Allow timer to complete or manually stop
16. Verify notification or sound triggers when timer completes

**Test Data**:
```
Timer Default: 25 minutes (Pomodoro)
Expected Behavior:
- Starts at 25:00
- Counts down accurately
- Pause stops countdown
- Resume continues from paused time
- Restart resets to 25:00
- Notifications work when complete
```

**Expected Result**:
- Timer starts and counts down accurately
- Pause functionality works correctly
- Resume functionality continues countdown without error
- Restart resets timer to full duration
- Timer respects user settings
- Notification or alert triggers on completion
- Timer can be restarted multiple times
- No data loss or drift in counting

**Actual Result**: 
[To be filled during test execution]

**Pass/Fail Criteria**:
- **PASS**: Timer starts/pauses/resumes/restarts correctly, countdown accurate, notification works
- **FAIL**: Timer doesn't count down, pause/resume broken, restart doesn't reset, no notification

**Priority**: P1 (important focus feature)

**Notes**: 
________________________________________________________________________________

---

## TC-019: Login and Redirect to Home Page

| Field | Value |
|-------|-------|
| Test ID | TC-019 |
| Item to Test | User login with home page redirect |
| Description | User is able to log in with valid credentials and is redirected to the home/dashboard page |
| Component | Authentication |
| Priority | **P0 - Critical** |

**Pre-Conditions**:
- User is logged out
- User is on login page (http://localhost:3000/auth)
- User has a valid account that is verified
- Active Internet Connection required
- Frontend is running

**Test Steps**:
1. Navigate to login page
2. Enter valid email: `testuser@wayne.edu`
3. Enter valid password: `TestPass123!`
4. Click "Log In" button
5. Wait for page to load (max 3 seconds)
6. Verify user is redirected to dashboard or home page
7. Verify welcome message or user name is displayed
8. Verify navigation menu shows user is logged in
9. Verify sidebar displays user-specific options (Profile, Settings, etc.)

**Test Data**:
```
Email: testuser@wayne.edu
Password: TestPass123!
Expected Redirect: /dashboard or /home
```

**Expected Result**:
- Login request successful
- User redirected to home/dashboard page within 3 seconds
- Home page displays welcome message with user name
- Navigation shows user is logged in
- User menu/profile icon appears in header
- User can access all protected pages
- Session is established and maintained

**Actual Result**: 
[To be filled during test execution]

**Pass/Fail Criteria**:
- **PASS**: User logs in successfully, redirected to dashboard within 3 seconds, user name displayed
- **FAIL**: Login fails, user not redirected, remains on login page, user name not shown

**Priority**: P0 (critical for all feature testing)

**Notes**: 
________________________________________________________________________________

---

## TC-020: Create Task and View on Dashboard

| Field | Value |
|-------|-------|
| Test ID | TC-020 |
| Item to Test | Task creation and dashboard display |
| Description | User can create a task and that task will appear on the dashboard pending tasks |
| Component | Task Management |
| Priority | **P0 - Critical** |

**Pre-Conditions**:
- User is logged in
- User is on Dashboard page
- At least one course exists
- User has no pending tasks (or clear the list first)
- Active Internet Connection
- Backend is running

**Test Steps**:
1. From dashboard, click "Create Task" quick action button or navigate to Tasks page
2. Fill in task details:
   - Title: `Complete Project Proposal`
   - Course: Select existing course from dropdown
   - Deadline: `2026-03-25`
   - Estimated Hours: `5`
   - Priority: `High` or `4`
3. Enter description: `Complete the project proposal document`
4. Click "Save Task" or "Create Task" button
5. Verify success message appears
6. Wait for page to update (2-3 seconds)
7. Navigate to Dashboard or view Pending Tasks section
8. Verify new task appears in the pending task list
9. Verify task shows correct details:
   - Title: "Complete Project Proposal"
   - Course name
   - Deadline date
   - Estimated hours

**Test Data**:
```
Task Title: Complete Project Proposal
Course: CS101 - Intro to Computer Science
Deadline: 2026-03-25
Estimated Hours: 5
Priority: High (4)
```

**Expected Result**:
- Task created successfully
- Success message displays after creation
- Task appears in Tasks page immediately
- Task appears in Dashboard pending task list
- Task count in dashboard statistics increases by 1
- Task details are correct and match input
- Task is available for schedule generation

**Actual Result**: 
[To be filled during test execution]

**Pass/Fail Criteria**:
- **PASS**: Task created, visible on both Tasks list and dashboard pending section, details correct
- **FAIL**: Task not visible, not stored in database, error message, details incorrect

**Priority**: P0 (core functionality)

**Notes**: 
________________________________________________________________________________

---

## TC-021: Generate Weekly Schedule

| Field | Value |
|-------|-------|
| Test ID | TC-021 |
| Item to Test | Weekly schedule generation |
| Description | User is able to generate a weekly schedule based on tasks, preference quiz, and course timings |
| Component | Schedule Generation |
| Priority | **P0 - Critical** |

**Pre-Conditions**:
- User is logged in
- User has created multiple tasks (3+)
- User has created courses with meeting times
- User has completed preference quiz
- User is on Schedule page (/schedule)
- OpenAI API is configured and working
- Active Internet Connection
- Backend is running

**Test Steps**:
1. Navigate to Schedule page
2. Verify dashboard shows pending tasks count (should be 3+)
3. Review pending tasks and courses listed
4. Verify preferences are displayed (work hours, daily limits, etc.)
5. Click "Generate Schedule" button
6. Observe loading indicator (if present)
7. Wait for schedule generation to complete (max 10 seconds)
8. Verify success message appears
9. Verify schedule blocks appear on weekly calendar view
10. Verify all pending tasks have schedule blocks assigned
11. Confirm schedule respects constraints:
    - Course meeting times (no conflicts)
    - Task deadlines (scheduled before due date)
    - Work hour preferences
    - Daily study hour limits
12. Verify break times appear between study blocks

**Test Data**:
```
Pending Tasks: 3+ (Lab 6, Problem Set 5, Reading, etc.)
Courses: 2+ with meeting times
User Preferences: Mon-Fri, 09:00-17:00, 4 hrs/day limit
```

**Expected Result**:
- Schedule generated successfully within 10 seconds
- Success message: "Schedule generated successfully"
- Weekly calendar displays with schedule blocks
- Each pending task has at least one schedule block
- Blocks respect work hours and deadlines
- No schedule conflicts with courses
- Total study hours per day ≤ 4 hours
- No blocks scheduled on weekends
- Break blocks appear between study blocks

**Actual Result**: 
[To be filled during test execution]

**Pass/Fail Criteria**:
- **PASS**: Schedule created, all tasks have blocks, respects constraints, response < 10 sec
- **FAIL**: Schedule not generated, tasks missing blocks, constraints violated, timeout

**Priority**: P0 (core feature)

**Notes**: 
________________________________________________________________________________

---

## TC-022: Update Tasks/Preferences and Regenerate Schedule

| Field | Value |
|-------|-------|
| Test ID | TC-022 |
| Item to Test | Schedule regeneration with updated data |
| Description | User is able to update tasks or preferences, and the regenerated schedule reflects the changes |
| Component | Schedule Management |
| Priority | **P0 - Critical** |

**Pre-Conditions**:
- User is logged in
- Schedule has been previously generated (from TC-021)
- User has pending tasks and courses
- User is on Schedule page
- Active Internet Connection
- Backend is running

**Test Steps**:
1. Note current schedule and task details
2. Navigate to Tasks page
3. Create a new urgent task:
   - Title: `Urgent Essay`
   - Deadline: `2026-03-24` (due tomorrow in test)
   - Estimated Hours: `4`
   - Priority: `High`
4. Return to Schedule page
5. Click "Regenerate Schedule" or "Update Schedule" button
6. Wait for regeneration to complete (max 10 seconds)
7. Verify success message appears
8. Verify new urgent task appears in schedule
9. Verify urgent task is scheduled early/first
10. Navigate to Profile/Settings page
11. Update preferences:
    - Change daily study limit from 4 to 6 hours
12. Return to Schedule page
13. Regenerate schedule again
14. Verify schedule reflects new 6-hour daily limit
15. Verify previously scheduled tasks adjust appropriately

**Test Data**:
```
New Task: Urgent Essay, Due 2026-03-24, 4 hrs, High Priority
Updated Preference: Daily limit 4 → 6 hours
```

**Expected Result**:
- Schedule regenerates successfully
- New urgent task appears in schedule at higher priority
- Urgent task scheduled before other tasks
- Changed preferences apply to regenerated schedule
- Daily study hours can now reach 6 hours (was 4)
- Previously scheduled tasks adjust to accommodate changes
- Schedule remains optimized and organized
- No data lost during regeneration

**Actual Result**: 
[To be filled during test execution]

**Pass/Fail Criteria**:
- **PASS**: Regenerated schedules reflect task/preference changes, urgent task prioritized, new limits applied
- **FAIL**: Changes not reflected, tasks missing, conflicts created, data lost

**Priority**: P0 (core functionality)

**Notes**: 
________________________________________________________________________________

---

## TC-023: Dashboard Displays Accurate Statistics

| Field | Value |
|-------|-------|
| Test ID | TC-023 |
| Item to Test | Dashboard statistics accuracy |
| Description | Dashboard data accurately shows total tasks, overdue tasks, and total hours needed |
| Component | Dashboard |
| Priority | **P1 - High** |

**Pre-Conditions**:
- User is logged in
- User has multiple tasks with various statuses
- Some tasks have deadlines in the past (overdue)
- User is on Dashboard page
- Active Internet Connection
- Backend is running

**Test Steps**:
1. View dashboard home page
2. Locate statistics section showing:
   - Total Tasks count
   - Overdue Tasks count
   - Total Hours Needed (estimated)
3. Note the displayed values
4. Navigate to Tasks page
5. Manually count and verify:
   - Total number of tasks (should match dashboard)
   - How many tasks are overdue (before today's date)
   - Sum of all estimated hours
6. Return to Dashboard
7. Compare manual counts to dashboard statistics
8. Create a new task and return to dashboard
9. Verify total tasks count increases by 1
10. Verify total hours updated correctly
11. Mark a task as complete
12. Return to dashboard
13. Verify total tasks count decreases

**Test Data**:
```
Today's Date: 2026-03-23
Tasks: Lab 6 (due 3/12, 3hrs), Problem Set (due 3/15, 2hrs), Reading (due 3/20, 1.5hrs)
Overdue: Lab 6, Problem Set
Total Hours: 6.5 hours
```

**Expected Result**:
- Dashboard displays correct total task count
- Dashboard displays correct overdue task count (2)
- Dashboard displays correct total hours (6.5 hours)
- Statistics match manual count from Tasks page
- Statistics update when tasks are added
- Statistics update when tasks are marked complete
- Changes reflected within 1-2 seconds
- No calculation errors

**Actual Result**: 
[To be filled during test execution]

**Pass/Fail Criteria**:
- **PASS**: All dashboard statistics correct, match Tasks page, update when data changes
- **FAIL**: Statistics incorrect, don't match, not updated, calculation errors

**Priority**: P1 (important for user awareness)

**Notes**: 
________________________________________________________________________________

---

## TC-024: Quick Actions from Dashboard

| Field | Value |
|-------|-------|
| Test ID | TC-024 |
| Item to Test | Dashboard quick action buttons |
| Description | Quick Actions from dashboard page are able to add task, add course, and view schedule |
| Component | Dashboard |
| Priority | **P1 - High** |

**Pre-Conditions**:
- User is logged in
- User is on Dashboard page
- Active Internet Connection
- Frontend is running

**Test Steps**:
1. From dashboard, locate quick actions section (usually near top or in cards)
2. Click "Add Task" quick action button
3. Verify user is redirected to task creation form or modal appears
4. Verify form fields are empty and ready for input
5. Close the form/modal without saving
6. Return to dashboard (verify still on dashboard)
7. Click "Add Course" quick action button
8. Verify user is redirected to course creation form or modal appears
9. Verify form fields are empty and ready for input
10. Close the form/modal without saving
11. Return to dashboard
12. Click "View Schedule" quick action button
13. Verify user is redirected to Schedule page (/schedule)
14. Verify calendar with schedule blocks is displayed

**Test Data**:
```
Quick Actions Expected:
- Add Task button
- Add Course button
- View Schedule button
```

**Expected Result**:
- Quick action buttons are visible and clearly labeled
- "Add Task" redirects to task creation
- "Add Course" redirects to course creation
- "View Schedule" redirects to schedule page
- All quick actions function without errors
- Forms open properly (modal or page redirect)
- User can complete actions without additional navigation
- Quick actions save time for common tasks

**Actual Result**: 
[To be filled during test execution]

**Pass/Fail Criteria**:
- **PASS**: All quick actions work, redirect to correct pages/forms, no errors
- **FAIL**: Buttons missing, redirect wrong page, action fails, modal doesn't open

**Priority**: P1 (improves user experience)

**Notes**: 
________________________________________________________________________________

---

## TC-025: Preference Quiz Saved to Backend

| Field | Value |
|-------|-------|
| Test ID | TC-025 |
| Item to Test | Preference quiz persistence |
| Description | User inputs from the preference quiz are saved to Supabase Backend and used in schedule generation |
| Component | User Preferences |
| Priority | **P1 - High** |

**Pre-Conditions**:
- User is logged in
- User is on Profile or Settings page
- No quiz has been completed yet (or quiz can be retaken)
- Active Internet Connection
- Backend is running

**Test Steps**:
1. Navigate to Profile or Settings page
2. Click "Preference Quiz" or "Take Quiz" button
3. Complete preference quiz by selecting responses:
   - Study Style: `Balanced`
   - Preferred Break Duration: `15 minutes`
   - Focus Block Size: `90 minutes`
   - Peak Productivity Time: `Morning (6-12 PM)`
   - Work Pace: `Moderate`
4. Click "Save Quiz" or "Submit" button
5. Verify success message appears
6. Refresh page (F5) or navigate away and back
7. Return to quiz section
8. Verify quiz selections are saved and displayed
9. Create courses and tasks
10. Generate a schedule
11. Verify schedule respects quiz selections:
    - Study blocks approximately 90 minutes
    - Break blocks are 15 minutes between work blocks
    - More tasks scheduled in morning time slots
    - Break preferences are respected
12. Verify quiz data is stored in Supabase database

**Test Data**:
```
Quiz Responses:
- Study Style: Balanced
- Break Duration: 15 min
- Focus Block: 90 min
- Peak Time: Morning
```

**Expected Result**:
- Quiz responses saved successfully to database
- Quiz selections persist after page refresh
- Quiz preferences actively used in schedule generation
- Schedule generation respects all quiz selections
- Block sizes match quiz preferences (90 min)
- Break durations match quiz preferences (15 min)
- Peak time preferences applied (morning tasks prioritized)
- Quiz can be re-taken and changes apply to future schedules

**Actual Result**: 
[To be filled during test execution]

**Pass/Fail Criteria**:
- **PASS**: Quiz saved to backend, used in schedule generation, selections persist and applied
- **FAIL**: Quiz not saved, not used in generation, preferences not applied, not persistent

**Priority**: P1 (important for schedule quality)

**Notes**: 
________________________________________________________________________________

---

## TC-026: Multiple View Formats Show Accurate Data

| Field | Value |
|-------|-------|
| Test ID | TC-026 |
| Item to Test | Calendar view formats |
| Description | Day, Week, Month, and Year view all accurately show user's courses, tasks, and timeblocks |
| Component | Schedule Viewing |
| Priority | **P1 - High** |

**Pre-Conditions**:
- User is logged in
- Schedule has been generated with multiple courses and tasks
- User has courses and tasks spanning multiple weeks
- User is on Schedule page (/schedule)
- Active Internet Connection
- Frontend is running

**Test Steps**:
1. Navigate to Schedule page
2. **Day View**:
   - Click "Day View" or select day view option
   - Verify calendar shows single day with hourly grid
   - Verify course meeting times displayed
   - Verify task time blocks displayed with task titles
   - Verify correct start and end times shown
   - Verify break blocks appear between study sessions
   - Navigate to next day (verify blocks update)
   - Verify blocks don't repeat across days

3. **Week View**:
   - Click "Week View" option
   - Verify calendar shows 7 days (Mon-Sun or Sun-Sat)
   - Verify all blocks visible for entire week
   - Verify correct day alignment
   - Verify courses appear on correct meeting days
   - Verify tasks appear on correct days
   - Click next week arrow to navigate forward
   - Verify calendar updates to show next week

4. **Month View**:
   - Click "Month View" option
   - Verify full month calendar displayed
   - Verify blocks shown as indicators on each day
   - Verify task/course indicators visible
   - Verify current day highlighted
   - Click month navigation arrows to move forward/backward

5. **Year View**:
   - Click "Year View" option
   - Verify full year calendar displayed
   - Verify month overview layout
   - Verify key courses/deadlines visible
   - Verify navigation works

**Test Data**:
```
Schedule Includes:
- Courses: CS101 (MWF), MATH201 (TR)
- Tasks: Lab 6, Problem Set, Reading
- Spanning: March 2026
```

**Expected Result**:
- Day view shows accurate single-day schedule
- Week view shows all 7 days with proper alignment
- Month view shows monthly overview with indicators
- Year view shows annual overview
- All views show same underlying schedule data
- Times and dates consistent across all views
- No missing blocks or data when switching views
- Course and task information visible in all views
- Navigation works smoothly between views

**Actual Result**: 
[To be filled during test execution]

**Pass/Fail Criteria**:
- **PASS**: All view formats show accurate, consistent data; times correct; navigation works
- **FAIL**: Data inconsistent between views, missing blocks, incorrect times, navigation broken

**Priority**: P1 (important for usability)

**Notes**: 
________________________________________________________________________________

---



| TC ID | Test Case Title | Component | Priority | Status | Pass/Fail | Comments |
|-------|-----------------|-----------|----------|--------|-----------|----------|
| TC-001 | User Registration | Auth | P0 | [Pending] | [ ] | |
| TC-002 | User Login | Auth | P0 | [Pending] | [ ] | |
| TC-003 | Create Course | Courses | P1 | [Pending] | [ ] | |
| TC-004 | Create Task | Tasks | P0 | [Pending] | [ ] | |
| TC-005 | Edit Task Hours | Tasks | P1 | [Pending] | [ ] | |
| TC-006 | Multiple Tasks | Tasks | P1 | [Pending] | [ ] | |
| TC-007 | Generate Schedule | Schedule | P0 | [Pending] | [ ] | |
| TC-008 | AI Optimization | AI | P1 | [Pending] | [ ] | |
| TC-009 | Week View | Schedule | P1 | [Pending] | [ ] | |
| TC-010 | Drag & Drop Block | Schedule | P2 | [Pending] | [ ] | |
| TC-011 | Work Preferences | Settings | P1 | [Pending] | [ ] | |
| TC-012 | No Tasks Error | Error Handling | P2 | [Pending] | [ ] | |
| TC-013 | Performance Speed | Performance | P1 | [Pending] | [ ] | |
| TC-014 | API Key Security | Security | P1 | [Pending] | [ ] | |
| TC-015 | Data Persistence | Data | P0 | [Pending] | [ ] | |
| TC-016 | PDF Schedule Parsing | Integration | P2 | [Pending] | [ ] | |
| TC-017 | Canvas Extension Import | Integration | P2 | [Pending] | [ ] | |
| TC-018 | Timer Functionality | Features | P1 | [Pending] | [ ] | |
| TC-019 | Login & Redirect Home | Integration | P0 | [Pending] | [ ] | |
| TC-020 | Create Task on Dashboard | Integration | P0 | [Pending] | [ ] | |
| TC-021 | Generate Weekly Schedule | Integration | P0 | [Pending] | [ ] | |
| TC-022 | Update & Regenerate | Integration | P0 | [Pending] | [ ] | |
| TC-023 | Dashboard Statistics | Dashboard | P1 | [Pending] | [ ] | |
| TC-024 | Quick Actions | Dashboard | P1 | [Pending] | [ ] | |
| TC-025 | Preference Quiz Save | Integration | P1 | [Pending] | [ ] | |
| TC-026 | Multiple View Formats | Schedule | P1 | [Pending] | [ ] | |

---

## Test Execution Summary

**Tester Name**: ____________________________  
**Date Started**: ____________________________  
**Date Completed**: ____________________________  
**Total Tests Run**: 26  
**Passed**: _____ / Passed Percentage: _____%  
**Failed**: _____ / Failed Percentage: _____%  

### Critical Issues Found
[Document any critical/blocking issues]

### High Priority Issues Found
[Document any high-priority issues]

### Low Priority Issues Found
[Document any low-priority issues]

---

**Document Version**: 3.0  
**Last Updated**: March 23, 2026  
**Status**: Comprehensive Test Plan - 26 Test Cases Complete - Ready for Execution
