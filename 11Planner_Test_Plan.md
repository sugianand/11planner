# 11Planner Test Plan

## 1. Introduction

### 1.1 Overview
This document presents the comprehensive test plan for the 11Planner application, an AI-powered academic schedule planning and task management system. The 11Planner application is designed to help students efficiently manage their assignments, courses, and study schedules using intelligent schedule generation powered by OpenAI APIs.

### 1.2 Purpose
The purpose of this test plan is to define the scope, approach, resources, and schedule for testing the 11Planner application. This document ensures that all functional, non-functional, and safety requirements are thoroughly validated before release.

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
- QA Engineers and Test Analysts
- Developers
- Project Management Team
- Product Owners

---

## 2. Test Objectives

### 2.1 Functional Testing
- Verify all user workflows (login, create tasks, generate schedule, manage courses)
- Validate data CRUD operations (Create, Read, Update, Delete)
- Test integration between frontend and backend APIs
- Verify Canvas assignment import functionality
- Validate schedule generation algorithm with AI optimization

### 2.2 Performance Testing
- Verify response times for API endpoints (target: <500ms for most requests)
- Test system behavior under load (concurrent schedule generation requests)
- Validate database query performance with in-memory data structures

### 2.3 Security Testing
- Verify OpenAI API key is properly secured and not exposed
- Test user authentication and authorization
- Validate input sanitization to prevent XSS and injection attacks
- Ensure proper error handling without sensitive data exposure

### 2.4 Reliability Testing
- Test system behavior when APIs (Canvas, OpenAI) are unavailable
- Verify graceful error handling for network failures
- Validate data persistence across application restarts

---

## 3. Test Strategy

### 3.1 Testing Approach
**Combination Strategy**: A combination of Black-box and White-box testing approaches will be employed:

- **Black-box Testing**: Test user-facing features and API contracts without knowledge of implementation details (authentication, schedule generation, task management)
- **White-box Testing**: Test code logic, error handling, and integration points with knowledge of implementation (schedule algorithm validation, API integration)

### 3.2 Testing Levels

#### 3.2.1 Unit Testing
- **Scope**: Individual functions, methods, and components
- **Examples**:
  - Schedule generator algorithm (`schedule_generator.py`)
  - Date utility functions (`dateUtils.ts`)
  - Form validation logic
  - Course code parsing logic

#### 3.2.2 Integration Testing
- **Scope**: Component interaction and API integration
- **Examples**:
  - Frontend to Backend API communication
  - OpenAI API integration for schedule optimization
  - Supabase database operations
  - Canvas API data synchronization

#### 3.2.3 System Testing
- **Scope**: End-to-end workflows
- **Examples**:
  - Complete user journey: Login → Create Tasks → Generate Schedule → View Schedule
  - Schedule generation with multiple tasks and constraints
  - Course management with multiple semesters

#### 3.2.4 Acceptance Testing
- **Scope**: User acceptance criteria validation
- **Examples**:
  - AI schedule generation produces valid schedules
  - Users can successfully plan their academic workload
  - Schedule respects user preferences (work hours, workdays, study limits)

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

### 4.1 Features In Scope
1. **User Authentication**: Sign up, login, password reset
2. **Course Management**: Create, read, update, delete courses; Add course schedules
3. **Task Management**: Create assignments from Canvas/manual entry; Edit task details (title, deadline, estimated hours, priority)
4. **Schedule Generation**: AI-powered schedule generation; Manual schedule adjustments
5. **Schedule Viewing**: Weekly, monthly, and custom views
6. **Profile Settings**: Work hour preferences, work-style preferences, study limits
7. **Focus Features**: Background selection, ambient sound options
8. **Data Import**: Canvas assignment synchronization

### 4.2 Features Out of Scope
- Third-party authentication (Google, Microsoft login) - if not implemented
- Mobile application testing - only web/desktop
- Performance testing beyond 500ms baseline
- Accessibility testing (WCAG compliance) - if not required
- Internationalization (non-English languages)

---

## 5. Test Deliverables

### 5.1 Test Planning Artifacts
- [ ] Test Plan Document (this document)
- [ ] Test Strategy and Approach Document
- [ ] Requirement Traceability Matrix (RTM)

### 5.2 Test Design Artifacts
- [ ] Test Cases and Test Scripts
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

| Phase | Duration | Start Date | End Date | Deliverables |
|-------|----------|-----------|----------|--------------|
| Test Planning & Design | 2 days | Day 1 | Day 2 | Test Plan, Test Cases |
| Unit & Integration Testing | 3 days | Day 3 | Day 5 | Unit test results, API validation results |
| System Testing | 3 days | Day 6 | Day 8 | End-to-end test results, bug reports |
| UAT & Regression Testing | 2 days | Day 9 | Day 10 | UAT Sign-off, final defect list |
| Test Reporting & Closure | 1 day | Day 11 | Day 11 | Final test report, RTM coverage |

**Total Test Timeline**: 11 days (2 weeks including weekends)

---

## 7. Test Environment

### 7.1 Hardware Requirements
- **CPU**: Intel i5/AMD Ryzen 5 or better
- **RAM**: 8GB minimum
- **Disk**: 20GB free space
- **Network**: Stable internet connection (for API testing)

### 7.2 Software Requirements
- **Backend**: Python 3.8+, FastAPI, Uvicorn
- **Frontend**: Node.js 18+, npm/yarn, Next.js
- **Database**: Supabase (cloud backend)
- **APIs**: OpenAI API (with valid API key), Canvas API
- **Testing Tools**: Postman, Jest, pytest
- **Browsers**: Chrome, Firefox, Safari, Edge (latest versions)

### 7.3 Test Environment Setup

```bash
# Backend Setup
cd backend
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt

# Frontend Setup
cd ../frontend
npm install

# Start Backend (Port 8000)
cd ../backend
uvicorn app.main:app --reload

# Start Frontend (Port 3000)
cd ../frontend
npm run dev
```

### 7.4 Test Data Requirements
- Test user accounts with different roles
- Sample courses (CS101, MATH201, etc.)
- Sample tasks with various priorities and deadlines
- Sample schedule preferences (workdays, work hours, study limits)

---

## 8. Test Entry and Exit Criteria

### 8.1 Entry Criteria
- ✓ Test plan is approved and documented
- ✓ Test cases are designed and reviewed
- ✓ Test environment is set up and validated
- ✓ All backend APIs are deployed and accessible
- ✓ Frontend application is in stable state
- ✓ Test data is prepared and available
- ✓ Testing tools and frameworks are installed
- ✓ OpenAI API key is configured in backend

### 8.2 Exit Criteria
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
| Update task estimated hours | Hours updated in database | Hours not saved | FAIL |
| Generate schedule under 3 seconds | Response time <3000ms | Response time >5000ms | FAIL |

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
- **Advantage**: Better for exploratory testing, UX validation, complex scenarios

#### Automated Testing
- **Use Cases**: API endpoint validation, regression testing, performance testing
- **Tools**: pytest (backend), Jest (frontend), Postman (API automation)
- **Advantage**: Faster execution, consistency, repeatability

### 11.2 Test Design
Test cases follow standard structure:
- Test ID
- Test Case Title
- Priority
- Pre-conditions
- Test Steps (detailed sequence)
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

#### Phase 4: UAT (Days 8-10)
- User acceptance validation
- Real-world workflow testing
- Performance validation

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

---

## 15. Test Cases

### 15.1 Test Case Template

```
TEST CASE ID: TC-001
Title: User Registration and Login
Component: Authentication
Priority: P0 (Critical)
Pre-Conditions:
  - Application is running
  - Test database is populated
  - User doesn't already exist

Test Steps:
  1. Navigate to application home page
  2. Click "Sign Up" button
  3. Enter email: testuser@wayne.edu
  4. Enter password: TestPass123!
  5. Enter name: Test Student
  6. Click "Create Account" button
  7. Verify email is sent
  8. Click email verification link
  9. Log in with email and password
  10. Verify dashboard loads

Expected Results:
  - Account is created successfully
  - Verification email is sent
  - User can log in
  - Dashboard displays user name
  - User session is established

Pass/Fail Criteria:
  - PASS if all steps complete without errors
  - FAIL if any step produces unexpected result or error

Priority: P0 (Critical)
```

### 15.2 Core Test Cases

#### **TC-001: User Authentication - Signup**
```
ID: TC-001
Title: User can successfully register new account
Component: Authentication
Priority: P0
Pre-conditions:
  - Fresh application environment
  - Browser is open
Expected Result: Account created, verification email sent
Pass Criteria: User receives confirmation email and can log in
```

#### **TC-002: User Authentication - Login**
```
ID: TC-002
Title: Registered user can log in with correct credentials
Component: Authentication
Priority: P0
Pre-conditions:
  - User account exists (from TC-001)
Expected Result: User is authenticated and dashboard loads
Pass Criteria: User session established, user name displayed in profile
```

#### **TC-003: Course Creation**
```
ID: TC-003
Title: User can create a new course
Component: Course Management
Priority: P1
Pre-conditions:
  - User is logged in
  - User is on Courses page
Expected Result: Course is created with all details
Pass Criteria: Course appears in course list with correct information
```

#### **TC-004: Task Creation - Manual**
```
ID: TC-004
Title: User can manually create a new task
Component: Task Management
Priority: P1
Pre-conditions:
  - User is logged in
  - At least one course exists
Expected Result: Task is created with deadline and estimated hours
Pass Criteria: Task appears in task list, required fields are saved
```

#### **TC-005: Task Creation - Canvas Import**
```
ID: TC-005
Title: User can import tasks from Canvas
Component: Canvas Integration
Priority: P1
Pre-conditions:
  - User account is linked to Canvas
  - There are pending assignments in Canvas
Expected Result: Tasks are imported from Canvas
Pass Criteria: Canvas tasks appear in task list with correct deadlines
```

#### **TC-006: Schedule Generation - Basic**
```
ID: TC-006
Title: System generates valid schedule for pending tasks
Component: Schedule Generation
Priority: P0
Pre-conditions:
  - User has at least 1 pending task
  - User has set work preferences
  - OpenAI API is available
Expected Result: Schedule blocks are created for each task
Pass Criteria: Schedule respects deadlines, work hours, and study limits
```

#### **TC-007: Schedule Generation - AI Optimization**
```
ID: TC-007
Title: Created schedule is optimized by AI
Component: AI Schedule Optimizer
Priority: P1
Pre-conditions:
  - User has multiple tasks with different priorities
  - OpenAI API key is configured
Expected Result: Tasks are ordered by urgency and AI recommendations
Pass Criteria: High priority tasks are scheduled earlier, blocks are realistic
```

#### **TC-008: Schedule View - Weekly**
```
ID: TC-008
Title: User can view schedule in weekly view
Component: Schedule Viewing
Priority: P1
Pre-conditions:
  - User has generated schedule
Expected Result: Schedule blocks are displayed in week format
Pass Criteria: All blocks are visible, dates and times are correct
```

#### **TC-009: Schedule Modification**
```
ID: TC-009
Title: User can manually adjust schedule blocks
Component: Schedule Management
Priority: P1
Pre-conditions:
  - Schedule blocks exist
Expected Result: Block is moved to new time
Pass Criteria: Block duration remains same, task is still trackable
```

#### **TC-010: Error Handling - No API Key**
```
ID: TC-010
Title: System handles missing OpenAI API key gracefully
Component: Error Handling
Priority: P2
Pre-conditions:
  - OpenAI API key is not configured
Expected Result: Schedule generates without AI optimization
Pass Criteria: System provides clear message, schedule is still generated
```

#### **TC-011: Profile Settings - Work Preferences**
```
ID: TC-011
Title: User can set work day and hour preferences
Component: Profile Settings
Priority: P1
Pre-conditions:
  - User is logged in
  - User is on Settings page
Expected Result: Preferences are saved to database
Pass Criteria: Saved preferences are applied to future schedules
```

#### **TC-012: Data Persistence**
```
ID: TC-012
Title: User data persists across sessions
Component: Data Management
Priority: P0
Pre-conditions:
  - User has created tasks and courses
Expected Result: Data is available after logout and login
Pass Criteria: All tasks, courses, and schedules are present
```

#### **TC-013: Performance - Schedule Generation**
```
ID: TC-013
Title: Schedule generation completes within 5 seconds
Component: Performance
Priority: P1
Pre-conditions:
  - User has 10 pending tasks
Expected Result: Schedule is generated within timeframe
Pass Criteria: Response time is less than 5000ms
```

#### **TC-014: Security - Password Reset**
```
ID: TC-014
Title: User can securely reset password with token
Component: Security
Priority: P1
Pre-conditions:
  - User has forgotten password
Expected Result: Password reset email is sent with token
Pass Criteria: Token can only be used once, expires in 24 hours
```

#### **TC-015: Concurrent Users**
```
ID: TC-015
Title: System handles multiple users generating schedules simultaneously
Component: System Stability
Priority: P2
Pre-conditions:
  - Multiple user accounts with pending tasks
Expected Result: All schedules generate correctly without errors
Pass Criteria: No data corruption, no performance degradation
```

---

## Summary

This comprehensive test plan provides a structured approach to validating the 11Planner application across all functional and non-functional requirements. The combination of manual and automated testing, along with risk-based prioritization, ensures comprehensive coverage while maintaining efficiency.

### Key Testing Focus Areas
1. **Authentication & Authorization** - User access control
2. **Core Functionality** - Task/Course/Schedule management
3. **AI Integration** - OpenAI API integration and schedule optimization
4. **Data Integrity** - Correct storage and retrieval of user data
5. **Performance** - Response times and system scalability
6. **Security** - Credential protection and input validation
7. **Error Handling** - Graceful degradation when APIs fail

### Success Metrics
- 80%+ code coverage
- All critical defects resolved
- Performance baselines met
- 100% requirement traceability
- Zero security vulnerabilities

---

**Document Version**: 1.0  
**Last Updated**: March 21, 2026  
**Status**: Ready for Review  
**Approved By**: [Signature]  
**Approval Date**: [Date]
