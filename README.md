# Omni-PMS — Unified Project Management & Ticketing System

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![CI/CD Pipeline](https://github.com/faisalkimz/Project-manage-and-ticketing-system/actions/workflows/ci.yml/badge.svg)](https://github.com/faisalkimz/Project-manage-and-ticketing-system/actions/workflows/ci.yml)
[![Python: 3.11+](https://img.shields.io/badge/Python-3.11+-3776AB.svg?logo=python&logoColor=white)](https://python.org)
[![Django: 5.x](https://img.shields.io/badge/Django-5.x-092E20.svg?logo=django&logoColor=white)](https://djangoproject.com)
[![React: 18](https://img.shields.io/badge/React-18-61DAFB.svg?logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Bundler-Vite-646CFF.svg?logo=vite&logoColor=white)](https://vitejs.dev)

An intelligent, modern open-source work management ecosystem combining **Agile Project Management**, **Interactive Gantt & Kanban Views**, **Customer Support Ticketing with automated SLAs**, and an embedded **AI Assistant Copilot**.

---

## 🌟 Key Features

### 🤖 1. Built-in AI Assistant Copilot
- **AI Subtask Breakdown**: Automatically decompose tasks and epics into estimated, prioritized subtasks with 1-click database creation.
- **AI Sprint Planner & Task Suggester**: Analyzes project backlog context and synthesizes next sprint task recommendations.
- **AI Executive Task Summarizer**: Summarizes tasks, progress, and blockers into crisp executive briefs.
- **AI Ticket Auto-Triage & SLA Target**: Predicts ticket priority, categorizes issues (Bug, Feature, Support), and calculates resolution SLA windows based on customer tiers.
- *Supports OpenAI (`gpt-4o-mini`) with seamless fallback to deterministic heuristic analysis when offline.*

### 📋 2. Project & Work Management
- **Interactive Kanban Boards**: Drag-and-drop workflow status updates, task filtering, points estimation.
- **Dynamic Gantt Charts**: Interactive SVG dependency visualizations with drag-to-reschedule date shifting.
- **Sprints & Retrospectives**: Backlog planning, capacity allocation, sprint goals, and structured retrospectives.
- **Milestones & Releases**: Track delivery targets across versions and roadmaps.

### 🎫 3. Native Helpdesk & Ticketing System
- **Ticket Queues**: Triage incoming user issues with multi-tier SLA policies.
- **Automated SLA Breach Tracking**: Monitors response and resolution deadlines with auto-escalation.
- **Direct Task-to-Ticket Link**: Convert customer tickets directly into sprint tasks without duplicate entries.

### ⚡ 4. Automation & Outbound Webhooks
- **Trigger-Action Workflows**: Execute rules on status changes, assignments, or approaching due dates.
- **Outbound Webhooks Manager**: Dispatch automated payloads to third-party services (`TASK_CREATED`, `TICKET_RESOLVED`, `SLA_BREACHED`, etc.) with built-in delivery test pings.
- **Asynchronous Workers**: Pre-configured Celery task queues for high-throughput background automation.

### 📖 5. Interactive OpenAPI & Developer Hub
- **Live Swagger UI**: Available at `http://localhost:8000/api/docs/`
- **ReDoc Interactive Spec**: Available at `http://localhost:8000/api/redoc/`
- **Integrations Hub**: Manage OAuth providers and developer API credentials.

---

## 🏗️ Architecture & Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS, Lucide Icons, Zustand State Store |
| **Backend API** | Django 5.x, Django REST Framework, SimpleJWT (Bearer auth) |
| **Async Task Queue** | Celery 5.x, Redis |
| **API Docs** | drf-yasg (Swagger 2.0 & OpenAPI specifications) |
| **Database** | SQLite (default dev), PostgreSQL ready (`psycopg2-binary`) |

---

## 🚀 Quick Start Guide

### Prerequisites
- Python 3.11 or higher
- Node.js 20 or higher
- Git

### 1. Clone Repository
```bash
git clone https://github.com/faisalkimz/Project-manage-and-ticketing-system.git
cd Project-manage-and-ticketing-system
```

### 2. Automated One-Command Startup (Windows PowerShell)
```powershell
.\start.ps1
```

### 3. Manual Step-by-Step Setup

#### Backend Setup
```bash
cd backend
python -m venv venv

# Windows:
.\venv\Scripts\Activate.ps1
# Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env

# Run migrations & seed data
python manage.py migrate
python manage.py runserver
```
*Backend runs at `http://127.0.0.1:8000`*

#### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
*Frontend runs at `http://localhost:5173`*

---

## 🧪 Testing & Verification

Run the automated full-stack verification suite covering Django system checks, Django tests, and Vite production bundle compilation:

```powershell
powershell -ExecutionPolicy Bypass -File .\test.ps1
```

Or run individual component tests:

```bash
# Backend checks & tests
cd backend
python manage.py check
python manage.py test

# Frontend build & lint
cd frontend
npm run build
```

---

## ⚙️ Environment Configuration (`backend/.env`)

| Variable | Description | Default |
|---|---|---|
| `SECRET_KEY` | Cryptographic secret for signing tokens and sessions | *Auto-generated / Set in .env* |
| `DEBUG` | Enable Django debug mode | `True` |
| `ALLOWED_HOSTS` | Comma-separated list of allowed hostnames | `localhost,127.0.0.1` |
| `CORS_ALLOWED_ORIGINS` | Permitted frontend origins | `http://localhost:5173` |
| `OPENAI_API_KEY` | Optional API key for OpenAI AI features | `""` *(Uses built-in heuristic engine if omitted)* |
| `AI_MODEL` | OpenAI Model selection | `gpt-4o-mini` |
| `CELERY_BROKER_URL` | Redis broker URL for async tasks | `redis://localhost:6379/0` |

---

## 📚 Strategic Documentation

Extensive research, architecture reviews, and benchmark audits are documented in `docs/product-strategy/`:

- [INDEX.md](docs/product-strategy/INDEX.md) — Master strategy library index
- [EXECUTIVE_PRODUCT_ASSESSMENT.md](docs/product-strategy/EXECUTIVE_PRODUCT_ASSESSMENT.md) — Baseline capability inventory
- [COMPETITIVE_ANALYSIS.md](docs/product-strategy/COMPETITIVE_ANALYSIS.md) — Market benchmark vs ClickUp, Jira, Monday, Linear
- [FEATURE_GAP_ANALYSIS.md](docs/product-strategy/FEATURE_GAP_ANALYSIS.md) — 100+ feature matrix and innovation opportunities
- [TECHNICAL_FEASIBILITY.md](docs/product-strategy/TECHNICAL_FEASIBILITY.md) — System scaling and architecture roadmap
- [PRODUCT_SCORECARD.md](docs/product-strategy/PRODUCT_SCORECARD.md) — Evaluation scorecard

---

## 📄 License

This project is open-source and licensed under the [MIT License](LICENSE).
Feel free to use, modify, distribute, and contribute.
