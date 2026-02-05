# 11Planner

Web-based productivity app that generates a realistic weekly schedule from classes, tasks, deadlines, and availability.

**Development Team:** Suganeshwara Anand, Tamanna Gaur, Ayham Huq, Aaraiz Sohail

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Project Purpose, Scope, and Objectives](#project-purpose-scope-and-objectives)
3. [Team Organization](#team-organization)
4. [Problem Resolution Policies](#problem-resolution-policies)
5. [Project Plan](#project-plan)
6. [Configuration Management Plan](#configuration-management-plan)
7. [Technologies](#technologies)
8. [Setup Instructions](#setup-instructions)

---

## Project Overview

Many students struggle to manage their academic workload not because they lack motivation, but because they lack a clear and realistic plan for when to complete their work. While assignments, classes, and deadlines are known, turning that information into an actionable weekly schedule is often time-consuming and stressful, leading to procrastination and burnout. 

11Planner is a web-based productivity application designed to solve this problem by automatically generating realistic weekly schedules based on a student's classes, tasks, deadlines, and availability. Instead of forcing students to manually plan every detail, the system breaks work into manageable time blocks and presents it through a clear, focused dashboard. By reducing planning friction and providing a simple path from deadlines to daily action, 11Planner helps students stay organized, reduce stress, and build consistent study habits.

---

## Project Purpose, Scope, and Objectives

### 2.1 Project Purpose

The purpose of 11Planner is to help students manage academic responsibilities more effectively by reducing the mental effort required to plan their time. Many students struggle not because they do not know their deadlines, but because deciding when to work on each task is time-consuming and stressful. Traditional planners and calendars rely heavily on manual scheduling, which often results in unrealistic plans that break down when schedules change.

11Planner exists to automate this planning process. By generating structured weekly schedules that break work into manageable time blocks, the application helps students move from abstract deadlines to concrete daily actions. The system is designed to reduce procrastination, promote consistent study habits, increase productivity, and improve overall academic well-being.

### 2.2 Scope

The scope of 11Planner includes building a web-based productivity application that uses AI-assisted parsing and scheduling to help students convert academic requirements into an executable weekly plan. The system will support both manual input and document-based input, and it will generate time-blocked schedules that adapt to the user's availability and constraints.

#### In Scope

- Manual entry of courses, assignments, and individual tasks
- Task attributes including deadlines, priority levels, and estimated effort
- AI-assisted parsing of uploaded academic PDFs to extract tasks and deadlines
- Automated generation of a weekly schedule using AI-driven prioritization
- Machine-learning-based workload and time-to-complete estimation
- Decomposition of tasks into manageable 30-minute focus blocks
- Prioritization of tasks based on urgency, importance, and proximity to deadlines
- Manual editing of generated time blocks
- Enforcement of daily workload limits to reduce burnout
- Dashboard view displaying current tasks and upcoming deadlines
- Master weekly schedule view distinguishing fixed commitments from flexible study blocks
- Overall weekly summary showing total estimated workload
- Automatic regeneration of schedules when tasks, priorities, or availability change

#### Out of Scope

- Native mobile application development (iOS or Android)
- OCR-based extraction from screenshots or images
- Full two-way integration with external calendar platforms (Google Calendar, etc.)
- Direct integration with university systems or LMS (Canvas, etc.)
- Desktop-level monitoring of user activity

### 2.3 Objectives

By the conclusion of the project, the team aims to achieve the following objectives:

- Develop a functional web-based application for manual input of courses, assignments, deadlines, and priority levels
- Automatically generate a weekly schedule with no conflicts, composed of 30-minute focus blocks, generated in under 3 seconds
- Implement task prioritization logic based on deadline proximity, remaining estimated effort, and user-defined priority
- Split large tasks across multiple days (tasks longer than 4 hours distributed over at least two days)
- Enforce daily workload limits (default: 4 hours per day)
- Support schedule regeneration when tasks, deadlines, or priorities are modified
- Provide a dashboard view for identifying current tasks and upcoming work within 5 seconds
- Demonstrate system effectiveness using at least three realistic student scenarios

---

## Team Organization

### 3.1 Team Members, Roles, and Responsibilities

**Team Lead & Documentation Lead – Tamanna Gaur**
- Primary point of contact with GTA and instructor
- Oversees overall project direction, timeline, and milestone tracking
- Manages and reviews all written deliverables

**Frontend, UX & Scheduling Engine Lead / Presentation Lead – Suganeshwara Anand**
- Leads design and implementation of user interface
- Oversees dashboard, calendar views, and interaction flow
- Designs and implements the core "Slicer" scheduling engine

**Backend Lead – Ayham Huq**
- Responsible for server-side application logic and API development
- Manages database schema design, migrations, and data integrity

**Deployment & QA Lead – Aaraiz Sohail**
- Manages application deployment and hosting configuration
- Oversees testing environments and test plan execution
- Coordinates bug tracking and regression testing

### 3.2 Communication Channels

- **Weekly Team Meetings:** Monday, Tuesday, Wednesday, Saturday, Sunday (via Google Meet)
- **GTA Meetings:** Sundays, 4:00 PM – 6:00 PM (via Microsoft Teams/Google Meet)
- **Asynchronous Communication:** WhatsApp group chat for day-to-day updates
- **Ad Hoc Meetings:** Scheduled as needed for urgent issues

---

## Problem Resolution Policies

### 4.1 Policy for Addressing Issues

**Technical Disputes:** Options are discussed openly, evaluated on effort, maintainability, performance, and timeline fit. Development leads provide recommendations; Team Lead makes final decisions if needed.

**Risk Mitigation:** MVP features are clearly defined early. Scope creep is controlled by evaluating impact to milestones. Features threatening schedule are deferred.

**Team Member Issues:** Addressed through direct communication to understand underlying causes. Responsibilities may be adjusted or paired development used to maintain progress.

### 4.2 Escalation Procedures

A three-strike escalation system is used:

- **Strike 1 – Initial Warning:** First missed deadline/meeting. Team Lead checks in and clarifies expectations.
- **Strike 2 – Formal Intervention:** Repeated issues. Formal team meeting held. GTA informed.
- **Strike 3 – Academic Escalation:** Persistent issues affecting project. Escalated to course instructor.

---

## Project Plan

### 5.1 Development Iterations & Milestones

**Prototype 1 – Foundational System (Weeks 1-4)**
- Finalize Software Requirements Specification (SRS)
- Set up user authentication and account management
- Design and integrate database schema
- Establish frontend project structure and base UI
- **Deliverables:** Prototype 1 (Feb 10), SRS (Feb 17)

**Prototype 2 – Core Features (Weeks 5-8)**
- Implement CRUD for courses, assignments, and tasks
- Integrate backend APIs with frontend views
- Develop calendar and dashboard interfaces
- Enable basic schedule generation
- **Deliverables:** Design Specification (Mar 3), Prototype 2 (Mar 10)

**Prototype 3 – Scheduling Engine (Weeks 9-12)**
- Integrate Scheduling Engine v1 for task prioritization
- Break tasks into structured study blocks
- Enhance dashboard interactions
- Address edge cases and perform functional testing
- **Deliverables:** Testing Plan (Mar 24), Prototype 3 (Apr 2)

**Final Product – Finalization (Weeks 13-15)**
- Conduct comprehensive testing and bug fixes
- Finalize documentation and technical reports
- Prepare demo scenarios and presentation materials
- Deploy final, stable version
- **Deliverables:** Final Product (Apr 21)

### 5.2 Time Commitment

- **Individual contribution:** ~20-25 hours per person per week
- **Group meetings and coordination:** ~20-25 hours per week
- **Total cumulative team effort:** ~40-50 hours per week

### 5.3 Adherence to Schedule

Progress is reviewed regularly in internal team meetings. Daily updates via asynchronous communication identify potential delays early. Adjustments to responsibilities or scope are made as needed to protect critical milestones.

---

## Configuration Management Plan

### 6.1 Version Control

**Source Control:** Git with GitHub as centralized repository

**Branching Strategy (GitFlow):**
- `main` branch: Production-ready, stable code only
- `develop` branch: Ongoing integration and testing
- Feature branches: Individual features (e.g., `feature/scheduler-engine`)

**Change Review:**
- All changes via Pull Requests
- Reviewed within 48 hours
- Approval from at least two team members required
- Must pass testing before merging

### 6.2 Code Quality

- Common naming conventions and folder structures defined early
- All PRs reviewed by multiple team members
- Reviewers verify readability, correctness, and adherence to standards
- Inline comments for complex logic

### 6.3 Tools

- **Task Tracking:** GitHub Issues
- **Frontend Deployment:** Vercel with CI/CD
- **Backend & Database:** Supabase
- **Technical Communication:** GitHub PR comments and issue threads

---

## Technologies

### Frontend

- **Next.js (v14.1.4):** Framework with server-side rendering, fast page loads, built-in routing
- **React (v18.2.0):** Component-based UI with reusable elements
- **TypeScript (v5.3.3):** Type safety and consistency

### Backend

- **Python (v3.11.8):** Strong ecosystem for data processing and ML
- **FastAPI (v0.110.0):** High-performance APIs with async handling
- **PyTorch (v2.2.1):** Assignment difficulty and workload prediction models
- **TensorFlow (v2.15.1):** Additional ML workflows and deployment

### Database

- **PostgreSQL (v15.6):** Reliable, scalable relational database
- **Prisma ORM (v5.10.2):** Type-safe database access and schema management

### Deployment & Infrastructure

- **Vercel:** Frontend hosting with Next.js integration and CI/CD
- **Supabase:** Backend services, database hosting, and authentication

---

## Setup Instructions

### Repo Structure
- `frontend/` – Next.js + TypeScript + Tailwind
- `backend/` – FastAPI (Python)

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### Backend Setup
```bash
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Environment Variables
Copy `backend/.env.example` to `backend/.env` and fill in values as needed.

### API Endpoints
- API health check: `GET /health`
- API ping: `GET /api/ping`
