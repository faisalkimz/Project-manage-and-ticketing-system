# 📘 Omni-PMS Master Specification

## 1. Vision
A unified Project Management System that eliminates fragmentation between help desk operations and project execution. A "Best-in-Class" Enterprise Project Management System (EPM) that combines:
- **Projects + Tasks + Tickets**
- **Role-Based Simplicity**
- **Deep Analytics**

---

## 2. Core Modules & Implementation Status

### 2.1 Project Management 🏗️
*Project creation, lifecycle, objectives, ownership.*
- [x] **Project Creation**: Create projects with names, descriptions, leads. (`/projects`)
- [x] **Lifecycle**: Status tracking (Active, On Hold, etc.).
- [ ] **Milestones**: Define key delivery dates within a project.
- [ ] **Objectives/Scope**: Dedicated fields or modules for project charter.

### 2.2 Task Management ✅
*Tasks, subtasks, assignments, deadlines, priorities.*
- [x] **Basic Tasks**: Title, description, assignee, priority, due date.
- [x] **Status Tracking**: To Do -> In Progress -> Done.
- [ ] **Subtasks**: Hierarchical task struture (Parent/Child).
- [ ] **Dependencies**: Blocking relationships (Task B waits for Task A).

### 2.3 Workflow & Status Tracking 🔄
*Custom statuses, Kanban, Approval flows.*
- [x] **Kanban Board**: Drag-and-drop interface. (`/projects/:id`)
- [ ] **Custom Statuses**: User-defined columns per project.
- [ ] **Approvals**: Explicit sign-off steps (e.g., Manager Approval required for 'Done').

### 2.4 Collaboration & Communication 💬
*Comments, mentions, attachments, logs.*
- [x] **Comments**: Threaded discussions on tasks.
- [x] **Attachments**: File upload and linking.
- [x] **Activity Logs**: Audit trail of changes.
- [ ] **Mentions**: `@user` notification system.

### 2.5 User, Roles & Permissions (RBAC) 🛡️
*Admin, Manager, Member, Guest controls.*
- [x] **Roles**: Admin, Developer, Project Manager, Employee.
- [x] **Permissions**: Granular capability checks (e.g., `ticket.create`).
- [ ] **Project-Level Access**: Private projects visible only to members.

### 2.6 Time & Resource Management ⏱️
*Time tracking, workload, capacity.*
- [ ] **Time Tracking**: Log hours spent on tasks (Start/Stop timer or manual entry).
- [ ] **Workload Distribution**: Visualizing who is overloaded.
- [ ] **Capacity Planning**: Estimating available hours vs. required hours.

### 2.7 Reporting & Analytics 📊
*Progress, velocity, productivity.*
- [x] **Basic Dashboard**: High-level counters (Open Tickets, Active Projects).
- [ ] **Burndown Charts**: Tracking sprint progress.
- [ ] **Velocity**: Measuring team output over time.
- [ ] **SLA Reports**: Compliance with response times.

---

## 3. Technology Stack Strategy
*Built for scalability and modularity.*

- **Frontend**: React (Vite) + TailwindCSS (Zinc/High-Density Theme) + Zustand.
- **Backend**: Django REST Framework + Postgres.
- **Realtime**: WebSockets (Activity updates).
- **Auth**: JWT + RBAC Middleware.

---

## 4. Implementation Roadmap (The "Build Slowly" Plan)

**Phase 1: Foundation (Completed) ✅**
- Basic Projects, Tasks, Tickets.
- Auth & RBAC.
- Design System (Linear-style).

**Phase 2: Depth (Current Focus) 🚧**
1.  **Time Tracking Module**: Add `TimeEntry` model and UI timers.
2.  **Advanced Task Features**: Subtasks and Dependencies.
3.  **Workflow Engine**: Custom statuses and transitions.

**Phase 3: Intelligence 🧠**
1.  **Reporting Engine**: Charts and specialized views.
2.  **Automation**: "When Ticket Created -> Assign to X".
3.  **Search & Filtering**: Global search with filters.

---

*This document serves as the single source of truth for the Omni-PMS development.*
