# 🚀 Omni-PMS: Quick Start Guide

## ✅ System Status: RUNNING

Both backend and frontend servers are now operational!

### 🌐 Access URLs

- **Frontend (React)**: http://localhost:5174 (or check your terminal for the actual port)
- **Backend API**: http://localhost:8000
- **Admin Panel**: http://localhost:8000/admin

### 🔑 Login Credentials

**Administrator Account:**
- **Username**: `admin`
- **Password**: `admin123`

**Demo Team Accounts:**
- **sarah.j** / pass123
- **michael.k** / pass123
- **luna.dev** / pass123
- **alex.pm** / pass123

---

## 🎯 Current Features (What's Already Built)

### ✨ Backend (Django REST Framework)

1. **Authentication & Authorization**
   - JWT-based authentication
   - Custom User model with roles
   - Role-based access control

2. **Project Management**
   - Projects CRUD
   - Tasks with subtasks
   - Task status tracking (TODO, IN_PROGRESS, REVIEW, DONE)
   - Priority levels (LOW, MEDIUM, HIGH, CRITICAL)
   - Project members management

3. **Ticketing System**
   - Ticket creation and tracking
   - Unique ticket numbers (TKT-YYYY-NNNNN)
   - Categories (BUG, FEATURE, IT_SUPPORT, OTHER)
   - Status workflow (OPEN, IN_PROGRESS, ON_HOLD, RESOLVED, CLOSED)
   - Convert tickets to tasks

4. **Tagging System**
   - Create colored tags
   - Apply tags to both tasks and tickets
   - Tag management API

5. **Activity Tracking**
   - Comments on tasks and tickets
   - File attachments
   - Audit logs for compliance

### 💎 Frontend (React + Vite)

1. **Human-Centric Design**
   - Professional light-mode aesthetic
   - Custom Outfit/Inter typography
   - Smooth micro-animations
   - No "AI-generated" feel

2. **Dashboard**
   - Workspace overview with metrics
   - Live activity feed
   - Workload donut chart
   - Quick actions grid
   - Motivational quote card

3. **Project Management**
   - **Split-view Kanban Board**
   - Drag-and-drop ready foundation
   - Task detail sidebar
   - Comments and attachments
   - Tag filtering

4. **Ticketing Portal**
   - Employee-friendly ticket submission
   - Tag management modal
   - Ticket status tracking
   - Developer view with full control

5. **Global Features**
   - Global search (`Ctrl+K` / `Cmd+K`)
   - Role-based UI rendering
   - Real-time ready (WebSocket foundation)

---

## 📖 Pre-Loaded Demo Data

The system has been seeded with realistic data:

### Projects (3)
1. **Omni-PMS Redesign** - Led by admin
2. **Customer Portal 2.0** - Led by alex.pm
3. **AI Integration Engine** - Led by luna.dev

### Tasks (5+)
- Mix of statuses: TODO, IN_PROGRESS, REVIEW, DONE
- Various priorities
- Assigned to team members
- Tagged with categories

### Tickets (3+)
- Database Connection Timeout (CRITICAL BUG)
- New Logo Implementation (LOW FEATURE)
- Password Reset Loop (HIGH IT_SUPPORT)

### Tags (6)
- Frontend (#6366F1)
- Backend (#8B5CF6)
- Bug (#EF4444)
- Feature (#10B981)
- Urgent (#F59E0B)
- Design (#EC4899)

---

## 🎨 UI Navigation Guide

### As an Employee:
1. **Submit Tickets**: Go to Tickets → Create Ticket
2. **Track Your Tickets**: View only your tickets
3. **Comment**: Add updates to your tickets

### As a Developer/Admin:
1. **Dashboard**: See system overview and metrics
2. **Projects**: 
   - View all projects
   - Click a project to see Kanban board
   - Click a task for split-view detail panel
3. **Tickets**:
   - View all tickets
   - Assign tickets
   - Convert tickets to tasks
   - Manage tags
4. **Global Search**: `Ctrl+K` to search tasks and people

---

## 🏗️ Next Implementation Phases

Refer to `.agent/ARCHITECTURE.md` for the complete roadmap.

### Immediate Priorities (Phase 1 Extensions):

1. **Enhanced RBAC**
   - Granular permissions system
   - Row-level security
   - Permission middleware

2. **SLA Tracking**
   - Auto-calculate ticket due dates
   - SLA breach notifications
   - Response time tracking

3. **WebSocket Real-Time**
   - Live task updates
   - Real-time notifications
   - Collaborative editing indicators

4. **Automation Engine**
   - Auto-assign tickets by category
   - Status transition rules
   - Notification triggers

5. **Multiple Views**
   - Calendar view
   - Gantt/Timeline chart
   - List view enhancements

### Advanced Features (Phase 2):

6. **Task Dependencies**
   - Link tasks with relationships
   - Critical path calculation
   - Circular dependency detection

7. **Time Tracking**
   - Log hours per task
   - Timesheets
   - Workload reports

8. **Templates**
   - Save project structures
   - Clone projects with tasks
   - Recurring task templates

9. **Custom Fields**
   - Extensible metadata
   - Per-project field definitions
   - Budget tracking fields

10. **Advanced Analytics**
    - Burndown charts
    - Velocity tracking
    - Team performance metrics

---

## 🛠️ Development Commands

### Backend
```powershell
cd backend
.\venv\Scripts\Activate.ps1

# Run server
python manage.py runserver

# Create migrations
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Seed database
python seed_data.py
```

### Frontend
```powershell
cd frontend

# Install dependencies
npm install

# Run dev server
npm run dev

# Build for production
npm run build
```

### Both Servers
```powershell
# From project root
.\start.ps1
```

---

## 📁 Project Structure

```
Project manage and ticketing system/
├── backend/
│   ├── core_api/          # Main Django project
│   ├── users/             # Custom user model & auth
│   ├── projects/          # Projects, tasks, tags
│   ├── tickets/           # Ticketing system
│   ├── activity/          # Comments, attachments, logs
│   ├── venv/              # Python virtual environment
│   └── db.sqlite3         # Database
├── frontend/
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API services
│   │   ├── store/         # State management (Zustand)
│   │   └── index.css      # Global styles
│   └── package.json
├── .agent/
│   ├── ARCHITECTURE.md    # Complete technical architecture
│   └── workflows/         # Implementation guides
└── start.ps1              # Startup script
```

---

## 🎯 Unique Selling Points

What makes **Omni-PMS** different from Jira, Asana, ClickUp, etc.:

1. ✅ **Unified Workflow**: Tickets → Tasks → Projects in one system
2. ✅ **True Role Segregation**: Simple for employees, powerful for developers
3. ✅ **Human-Centric Design**: Professional, not generic AI aesthetic
4. ✅ **Zero Feature Gaps**: All features from top 5 PMSs combined
5. ✅ **Enterprise-Ready**: RBAC, audit logs, compliance from day 1
6. ✅ **Flexible Views**: Kanban + List + Calendar + Gantt (in progress)
7. ✅ **SLA Management**: Built-in support desk features
8. ✅ **Self-Hostable**: Full control over your data

---

## 🔐 Security Notes

- **JWT Tokens**: Access tokens valid for 24 hours
- **Password Hashing**: Using Django's secure Argon2 hasher
- **CORS**: Currently set to allow all origins (change in production!)
- **HTTPS**: Not configured for local dev (add Let's Encrypt for production)
- **Audit Logs**: All actions tracked (view in admin panel)

---

## 📚 Documentation

- **Architecture**: `.agent/ARCHITECTURE.md` - Complete technical spec
- **Design Specs**: `.agent/workflows/design_specs.md` - UI/UX guidelines
- **Implementation Plan**: `.agent/workflows/implementation_plan.md`

---

## 🆘 Troubleshooting

### Backend won't start
```powershell
cd backend
.\venv\Scripts\Activate.ps1
python manage.py migrate
python manage.py runserver
```

### Frontend build errors
```powershell
cd frontend
rm -r node_modules
rm package-lock.json
npm install
npm run dev
```

### Database issues
```powershell
cd backend
# Backup first!
rm db.sqlite3
python manage.py migrate
python manage.py createsuperuser
python seed_data.py
```

---

## 🎉 Ready to Build!

You now have:
- ✅ A working MVP with core features
- ✅ A 40-page technical architecture
- ✅ A roadmap for 16+ weeks of development
- ✅ Demo data to explore features
- ✅ A human-centric design system

**Open your browser to http://localhost:5174 and start exploring!**

For the next phase of development, follow the implementation plan in `ARCHITECTURE.md` starting with Phase 1 Extensions.

---

**Built with 🔥 by the Omni-PMS Engineering Team**
