# Omni-PMS — Consolidated Documentation

## Table of Contents
- 1. Overview
- 2. Quick Start
- 3. Features Summary
- 4. Architecture & Technology
- 5. Specification & Roadmap
- 6. Implementation Notes
- 7. Integration & QA
- 8. Design & Workflows
- 9. Development Commands
- Appendix: Archived Docs and References

---

## 1. Overview
Omni-PMS is an enterprise-ready Project Management and Ticketing System that unifies Tickets → Tasks → Projects with role-based access control and a human-centric design.

Key differentiators:
- Unified workflow: tickets convert to tasks
- Role segregation: simple employee view, powerful developer/manager views
- Enterprise features: RBAC, audit logs, SLA monitoring

---

## 2. Quick Start
Frontend: http://localhost:5174
Backend API: http://localhost:8000
Admin: http://localhost:8000/admin

Seeded demo accounts are available for local testing (see original README in the docs archive).

---

## 3. Features Summary
- Projects: CRUD, Kanban, Templates
- Tasks: Subtasks, Priorities, Tags, Dependencies
- Tickets: Categories, SLA, Conversion to tasks
- Notifications: Email, Push, In-app, Rules/Automation
- Search: Global, saved views, full-text ready
- Analytics: Dashboards, Burndown/Burnup, Exports (CSV/PDF)
- Security: JWT, 2FA, OAuth/SSO, IP whitelisting

See the Specification & Features sections below for implementation status and endpoints.

---

## 4. Architecture & Technology
- Backend: Django REST Framework, (Postgres recommended in prod)
- Frontend: React + Vite, TailwindCSS, Zustand
- Async & Caching: Celery + Redis
- Storage: Local / S3-compatible storage for files
- Realtime: Django Channels (WebSockets)

High-level architecture and diagrams are in the archived architecture doc.

---

## 5. Specification & Roadmap
- Core MVP: Users, Projects, Tasks, Tickets, Comments, Attachments.
- Phase 2: Time tracking, custom statuses, workflow engine.
- Phase 3: Reporting engine and automation.
- Phase 4: Enterprise readiness and compliance.

For the detailed spec, refer to `SPECIFICATION.md` in `docs/archive/`.

---

## 6. Implementation Notes
- Ticket numbers use format `TKT-YYYY-00001` (see ticket service in architecture)
- File upload and document versioning implemented in `knowledge` app
- Saved views and reporting endpoints are available under `/api/reports/` and `/api/knowledge/`

---

## 7. Integration & QA
Integration endpoints and QA checks include:
- `/api/automation/rules/` — automation rules
- `/api/reports/export_pdf/` — PDF exports
- `/api/search/` — global search

Deployment checklist: switch to PostgreSQL, configure Celery/Redis, set `DEBUG=False`, and configure HTTPS.

---

## 8. Design & Workflows
Design system, color palette, and implementation plan are included from the agent workflows. See `design_specs.md` and `implementation_plan.md` in `docs/archive/` for details.

---

## 9. Development Commands
Backend
```
cd backend
.\venv\Scripts\Activate.ps1
python manage.py migrate
python manage.py runserver
```

Frontend
```
cd frontend
npm install
npm run dev
```

---

## Appendix: Archived Docs and References
The following original docs were consolidated and moved to `docs/archive/`:
- `README.md` (original full quickstart & details)
- `SPECIFICATION.md`
- `FEATURES_COMPLETE.md`
- `FEATURES_ADVANCED.md`
- `ADVANCED_FEATURES.md`
- `IMPLEMENTATION_COMPLETE.md`
- `INTEGRATION_AND_QA.md`
- `.agent/ARCHITECTURE.md` and workflows (`.agent/workflows/*`)

---

If anything is missing or you want sections expanded (API reference, diagrams, or a small quick-reference cheat sheet), tell me what to prioritize and I'll extend this consolidated doc.
