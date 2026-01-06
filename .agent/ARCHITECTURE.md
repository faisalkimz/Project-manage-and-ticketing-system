---
title: "Omni-PMS: Enterprise Project Management & Ticketing System"
subtitle: "Technical Architecture & Implementation Specification"
version: "1.0.0"
date: "2026-01-05"
---

# 🏗️ OMNI-PMS: COMPLETE TECHNICAL ARCHITECTURE

## 📋 TABLE OF CONTENTS

1. Executive Summary
2. System Architecture Overview
3. Role-Based Access Control (RBAC)
4. Database Design & Schema
5. Backend Architecture
6. Frontend Architecture
7. Feature Modules
8. Security & Compliance
9. Performance & Scalability
10. Implementation Roadmap

---

## 1. EXECUTIVE SUMMARY

**Omni-PMS** is a next-generation, unified Project Management and Internal Ticketing System designed to eliminate fragmentation between help desk operations and project execution. It combines the best aspects of industry leaders:

- **Jira**: Advanced dependencies, sprint planning, agile workflows
- **Asana**: Task hierarchies, templates, portfolio management
- **ClickUp**: Multiple views, automation, custom fields
- **Monday.com**: Visual workflows, colorization, intuitive dashboards
- **Trello**: Simplicity and visual Kanban
- **Zendesk/Freshservice**: SLA management, ticket categorization

### Key Differentiators

1. **Unified System**: Tickets seamlessly convert to tasks within projects
2. **Role Segregation**: Employees see simplified ticket interface; developers see everything
3. **Human-Centric Design**: No AI-generated feel; clean, professional aesthetics
4. **Complete Feature Parity**: Nothing missing from leading PMSs
5. **Enterprise-Grade**: Audit logs, RBAC, SLA tracking, compliance-ready

---

## 2. SYSTEM ARCHITECTURE OVERVIEW

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │   Employee   │  │   Developer  │  │  Admin/Manager   │  │
│  │   Portal     │  │   Workspace  │  │   Dashboard      │  │
│  └──────┬───────┘  └──────┬───────┘  └────────┬─────────┘  │
└─────────┼──────────────────┼──────────────────┼─────────────┘
          │                  │                  │
          └──────────────────┼──────────────────┘
                             │
┌─────────────────────────────┼─────────────────────────────────┐
│                       API GATEWAY                             │
│  • Authentication   • Rate Limiting   • Request Routing      │
│  • Load Balancing   • API Versioning  • WebSocket Gateway    │
└─────────────────────────────┼─────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
┌─────────▼─────────┐ ┌───────▼────────┐ ┌───────▼────────┐
│  TICKET SERVICE   │ │  PROJECT SVC   │ │   AUTH SERVICE │
│                   │ │                │ │                │
│ • Create Ticket   │ │ • Projects     │ │ • Users        │
│ • Assign/Update   │ │ • Tasks        │ │ • Roles        │
│ • SLA Tracking    │ │ • Subtasks     │ │ • Permissions  │
│ • Categories      │ │ • Dependencies │ │ • Sessions     │
└─────────┬─────────┘ └───────┬────────┘ └───────┬────────┘
          │                   │                   │
┌─────────▼─────────┐ ┌───────▼────────┐ ┌───────▼────────┐
│ ACTIVITY SERVICE  │ │ NOTIFICATION   │ │  FILE SERVICE  │
│                   │ │    SERVICE     │ │                │
│ • Comments        │ │ • Email        │ │ • Upload       │
│ • Audit Logs      │ │ • Push         │ │ • Storage      │
│ • Attachments     │ │ • In-App       │ │ • CDN          │
│ • History         │ │ • Webhooks     │ │ • Thumbnails   │
└─────────┬─────────┘ └───────┬────────┘ └───────┬────────┘
          │                   │                   │
┌─────────▼─────────┐ ┌───────▼────────┐ ┌───────▼────────┐
│ ANALYTICS SERVICE │ │ AUTOMATION SVC │ │  SEARCH ENGINE │
│                   │ │                │ │                │
│ • Dashboards      │ │ • Triggers     │ │ • Elasticsearch│
│ • Reports         │ │ • Rules        │ │ • Full-text    │
│ • Metrics         │ │ • Schedules    │ │ • Filters      │
│ • Export          │ │ • Workflows    │ │ • Suggestions  │
└───────────────────┘ └────────────────┘ └────────────────┘
          │                   │                   │
          └───────────────────┼───────────────────┘
                              │
┌─────────────────────────────▼─────────────────────────────────┐
│                       DATA LAYER                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │  PostgreSQL  │  │     Redis    │  │   S3/Blob Store  │   │
│  │  (Primary DB)│  │  (Cache/Queue)│ │   (File Storage) │   │
│  └──────────────┘  └──────────────┘  └──────────────────┘   │
└───────────────────────────────────────────────────────────────┘
```

### 2.2 Technology Stack

**Backend:**
- Django 5.0+ (Python 3.11+)
- Django REST Framework
- PostgreSQL 15+
- Redis 7+ (caching, celery broker)
- Celery (async tasks, notifications)
- WebSockets (Django Channels)

**Frontend:**
- React 18+
- Vite
- Zustand (state management)
- TanStack Query (data fetching)
- TailwindCSS
- Framer Motion (animations)

**Infrastructure:**
- Docker & Docker Compose
- Nginx (reverse proxy)
- Let's Encrypt (SSL)
- AWS S3 / Azure Blob (file storage)
- Elasticsearch (optional, search)

---

## 3. ROLE-BASED ACCESS CONTROL (RBAC)

### 3.1 User Roles

| Role | Key Permissions | Description |
|------|----------------|-------------|
| **Employee** | `ticket.create`, `ticket.view_own`, `ticket.comment_own` | Can only submit and track their own tickets |
| **Developer** | `ticket.view_all`, `ticket.assign`, `task.manage`, `project.view` | Can manage all tickets, create/assign tasks |
| **Project Manager** | `project.create`, `project.manage`, `team.assign`, `reports.view` | Manages projects, assigns resources |
| **Admin** | `*.*` (all permissions) | Full system access, user management |
| **Client/Guest** | `project.view_assigned`, `ticket.view_assigned` | Limited external access |

### 3.2 Permission Matrix

```
┌──────────────────┬──────────┬───────────┬──────────┬───────┬────────┐
│ Resource/Action  │ Employee │ Developer │ PM       │ Admin │ Client │
├──────────────────┼──────────┼───────────┼──────────┼───────┼────────┤
│ Create Ticket    │    ✓     │     ✓     │    ✓     │   ✓   │   ✓    │
│ View Own Ticket  │    ✓     │     ✓     │    ✓     │   ✓   │   ✓    │
│ View All Tickets │    ✗     │     ✓     │    ✓     │   ✓   │   ✗    │
│ Assign Ticket    │    ✗     │     ✓     │    ✓     │   ✓   │   ✗    │
│ Convert to Task  │    ✗     │     ✓     │    ✓     │   ✓   │   ✗    │
│ Create Project   │    ✗     │     ✗     │    ✓     │   ✓   │   ✗    │
│ Create Task      │    ✗     │     ✓     │    ✓     │   ✓   │   ✗    │
│ View Reports     │    ✗     │     ✓     │    ✓     │   ✓   │   ✗    │
│ Manage Users     │    ✗     │     ✗     │    ✗     │   ✓   │   ✗    │
│ View Gantt/Cal   │    ✗     │     ✓     │    ✓     │   ✓   │   ✗    │
│ Manage Workload  │    ✗     │     ✗     │    ✓     │   ✓   │   ✗    │
└──────────────────┴──────────┴───────────┴──────────┴───────┴────────┘
```

### 3.3 Implementation

```python
# models/permissions.py
class Permission(models.Model):
    name = models.CharField(max_length=100, unique=True)  # e.g., "ticket.view_all"
    description = models.TextField()
    resource = models.CharField(max_length=50)  # e.g., "ticket"
    action = models.CharField(max_length=50)    # e.g., "view_all"

class Role(models.Model):
    name = models.CharField(max_length=50, unique=True)
    permissions = models.ManyToManyField(Permission)
    is_system_role = models.BooleanField(default=False)  # Prevent deletion

class User(AbstractUser):
    role = models.ForeignKey(Role, on_delete=models.PROTECT)
    department = models.CharField(max_length=100, blank=True)
    # ... other fields

# Middleware/Decorator for permission checks
def require_permission(permission_name):
    def decorator(view_func):
        @wraps(view_func)
        def wrapped(request, *args, **kwargs):
            if not request.user.role.permissions.filter(name=permission_name).exists():
                raise PermissionDenied
            return view_func(request, *args, **kwargs)
        return wrapped
    return decorator
```

---

## 4. DATABASE DESIGN & SCHEMA

### 4.1 Core Tables

```sql
-- USERS & AUTH
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(150) UNIQUE NOT NULL,
    email VARCHAR(254) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role_id UUID REFERENCES roles(id),
    department VARCHAR(100),
    avatar_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    is_system_role BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,  -- Format: resource.action
    resource VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    description TEXT
);

CREATE TABLE role_permissions (
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- PROJECTS & TASKS
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    key VARCHAR(10) UNIQUE NOT NULL,  -- e.g., "OMNI" for OMNI-123
    status VARCHAR(20) DEFAULT 'ACTIVE',  -- ACTIVE, ON_HOLD, COMPLETED,ARCHIVED
    priority VARCHAR(20) DEFAULT 'MEDIUM',
    start_date DATE,
    end_date DATE,
    created_by UUID REFERENCES users(id),
    client_id UUID REFERENCES users(id),  -- Optional external client
    budget DECIMAL(12, 2),
    health_status VARCHAR(20),  -- ON_TRACK, AT_RISK, CRITICAL
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE project_members (
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50),  -- LEAD, CONTRIBUTOR, OBSERVER
    joined_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (project_id, user_id)
);

CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    parent_task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,  -- For subtasks
    title VARCHAR(500) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'TODO',  -- TODO, IN_PROGRESS, REVIEW, DONE
    priority VARCHAR(20) DEFAULT 'MEDIUM',  -- LOW, MEDIUM, HIGH, CRITICAL
    assigned_to UUID REFERENCES users(id),
    created_by UUID REFERENCES users(id),
    due_date DATE,
    estimated_hours DECIMAL(5, 2),
    actual_hours DECIMAL(5, 2),
    position INTEGER,  -- For ordering in Kanban
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE task_dependencies (
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    depends_on_task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    dependency_type VARCHAR(20) DEFAULT 'FINISH_TO_START',
    PRIMARY KEY (task_id, depends_on_task_id),
    CHECK (task_id != depends_on_task_id)  -- Prevent self-dependency
);

-- TICKETING SYSTEM
CREATE TABLE tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_number VARCHAR(20) UNIQUE NOT NULL,  -- Auto-generated: TKT-2024-00001
    title VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,  -- BUG, FEATURE, IT_SUPPORT, HR, FACILITIES
    priority VARCHAR(20) DEFAULT 'MEDIUM',
    status VARCHAR(20) DEFAULT 'OPEN',  -- OPEN, IN_PROGRESS, ON_HOLD, RESOLVED, CLOSED
    submitted_by UUID REFERENCES users(id),
    assigned_to UUID REFERENCES users(id),
    project_task_id UUID REFERENCES tasks(id),  -- Linked task if converted
    sla_due_date TIMESTAMP,  -- Calculated based on category/priority
    resolution_notes TEXT,
    resolved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- TAGS (for tasks and tickets)
CREATE TABLE tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) UNIQUE NOT NULL,
    color VARCHAR(7) DEFAULT '#6366F1',  -- Hex color
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE task_tags (
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (task_id, tag_id)
);

CREATE TABLE ticket_tags (
    ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (ticket_id, tag_id)
);

-- ACTIVITY & COLLABORATION
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    content_type VARCHAR(20) NOT NULL,  -- 'task' or 'ticket'
    object_id UUID NOT NULL,
    text TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT FALSE,  -- Internal dev notes vs public
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_type VARCHAR(20) NOT NULL,
    object_id UUID NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT,
    mime_type VARCHAR(100),
    uploaded_by UUID REFERENCES users(id),
    uploaded_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,  -- e.g., 'ticket.created', 'task.status_changed'
    content_type VARCHAR(20),
    object_id UUID,
    changes JSONB,  -- {"status": {"from": "TODO", "to": "IN_PROGRESS"}}
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- TIME TRACKING
CREATE TABLE time_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    task_id UUID REFERENCES tasks(id),
    description TEXT,
    hours DECIMAL(5, 2) NOT NULL,
    logged_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- CUSTOM FIELDS (extensibility)
CREATE TABLE custom_fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    field_type VARCHAR(20) NOT NULL,  -- TEXT, NUMBER, DATE, SELECT
    entity_type VARCHAR(20) NOT NULL,  -- task, project, ticket
    options JSONB,  -- For SELECT type: ["Option 1", "Option 2"]
    is_required BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE custom_field_values (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    custom_field_id UUID REFERENCES custom_fields(id) ON DELETE CASCADE,
    entity_type VARCHAR(20) NOT NULL,
    entity_id UUID NOT NULL,
    value TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- NOTIFICATIONS
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    type VARCHAR(50),  -- TASK_ASSIGNED, TICKET_UPDATE, COMMENT_ADDED
    entity_type VARCHAR(20),
    entity_id UUID,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- AUTOMATION RULES
CREATE TABLE automation_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    trigger_event VARCHAR(100) NOT NULL,  -- ticket.created, task.status_changed
    conditions JSONB,  -- {"priority": "HIGH", "category": "BUG"}
    actions JSONB,  -- [{"type": "assign", "user_id": "..."}]
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- TEMPLATES
CREATE TABLE project_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    template_data JSONB,  -- Full project/task structure
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- SLA DEFINITIONS
CREATE TABLE sla_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50),
    priority VARCHAR(20),
    response_time_hours INTEGER,  -- Time to first response
    resolution_time_hours INTEGER,  -- Time to resolve
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### 4.2 Indexes for Performance

```sql
-- High-frequency queries
CREATE INDEX idx_tasks_project_status ON tasks(project_id, status);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tickets_status_priority ON tickets(status, priority);
CREATE INDEX idx_tickets_assigned_to ON tickets(assigned_to);
CREATE INDEX idx_tickets_submitted_by ON tickets(submitted_by);
CREATE INDEX idx_comments_object ON comments(content_type, object_id);
CREATE INDEX idx_attachments_object ON attachments(content_type, object_id);
CREATE INDEX idx_audit_logs_user_created ON audit_logs(user_id, created_at DESC);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read, created_at DESC);

-- Full-text search
CREATE INDEX idx_tasks_search ON tasks USING GIN(to_tsvector('english', title || ' ' || COALESCE(description, '')));
CREATE INDEX idx_tickets_search ON tickets USING GIN(to_tsvector('english', title || ' ' || COALESCE(description, '')));
```

---

## 5. BACKEND ARCHITECTURE

### 5.1 Service Layer Pattern

```python
# services/ticket_service.py
class TicketService:
    @staticmethod
    def create_ticket(data, user):
        """Create a new ticket with SLA calculation"""
        # Generate ticket number
        ticket_number = TicketService._generate_ticket_number()
        
        # Calculate SLA due date
        sla_policy = SLAPolicy.objects.filter(
            category=data['category'],
            priority=data['priority'],
            is_active=True
        ).first()
        
        sla_due_date = None
        if sla_policy:
            sla_due_date = timezone.now() + timedelta(hours=sla_policy.resolution_time_hours)
        
        # Create ticket
        ticket = Ticket.objects.create(
            ticket_number=ticket_number,
            title=data['title'],
            description=data['description'],
            category=data['category'],
            priority=data['priority'],
            submitted_by=user,
            sla_due_date=sla_due_date
        )
        
        # Auto-assign based on automation rules
        AutomationService.process_ticket_created(ticket)
        
        # Send notifications
        NotificationService.notify_ticket_created(ticket)
        
        # Audit log
        AuditService.log_action(user, 'ticket.created', ticket)
        
        return ticket
    
    @staticmethod
    def convert_to_task(ticket, project_id, user):
        """Convert a ticket to a project task"""
        if not user.has_permission('ticket.convert_to_task'):
            raise PermissionDenied
        
        task = Task.objects.create(
            project_id=project_id,
            title=ticket.title,
            description=ticket.description,
            priority=ticket.priority,
            created_by=user
        )
        
        # Link ticket to task
        ticket.project_task_id = task.id
        ticket.status = 'RESOLVED'
        ticket.save()
        
        # Copy attachments
        for attachment in ticket.attachments.all():
            attachment.pk = None
            attachment.content_type = 'task'
            attachment.object_id = task.id
            attachment.save()
        
        # Notify
        NotificationService.notify_ticket_converted(ticket, task)
        AuditService.log_action(user, 'ticket.converted_to_task', ticket)
        
        return task
    
    @staticmethod
    def _generate_ticket_number():
        """Generate TKT-2024-00001 format"""
        year = timezone.now().year
        last_ticket = Ticket.objects.filter(
            ticket_number__startswith=f'TKT-{year}'
        ).order_by('-ticket_number').first()
        
        if last_ticket:
            seq = int(last_ticket.ticket_number.split('-')[-1]) + 1
        else:
            seq = 1
        
        return f'TKT-{year}-{seq:05d}'
```

### 5.2 Celery Async Tasks

```python
# tasks/notification_tasks.py
from celery import shared_task

@shared_task
def send_email_notification(user_id, subject, message):
    """Send email asynchronously"""
    user = User.objects.get(id=user_id)
    send_mail(subject, message, settings.FROM_EMAIL, [user.email])

@shared_task
def check_sla_violations():
    """Periodic task to check SLA violations"""
    overdue_tickets = Ticket.objects.filter(
        status__in=['OPEN', 'IN_PROGRESS'],
        sla_due_date__lt=timezone.now()
    )
    
    for ticket in overdue_tickets:
        NotificationService.notify_sla_breach(ticket)

@shared_task
def generate_daily_report():
    """Generate and email daily summary reports"""
    # Implementation for analytics
    pass
```

### 5.3 WebSocket for Real-Time Updates

```python
# consumers.py
from channels.generic.websocket import AsyncWebsocketConsumer

class DashboardConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user_id = self.scope['user'].id
        self.room_group_name = f'user_{self.user_id}'
        
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()
    
    async def notify_task_update(self, event):
        """Send task update to client"""
        await self.send(text_data=json.dumps({
            'type': 'task_update',
            'data': event['data']
        }))
```

---

## 6. FRONTEND ARCHITECTURE

### 6.1 Component Structure

```
frontend/src/
├── components/
│   ├── common/
│   │   ├── Button.jsx
│   │   ├── Modal.jsx
│   │   ├── Card.jsx
│   │   └── DataTable.jsx
│   ├── layout/
│   │   ├── Sidebar.jsx
│   │   ├── Header.jsx
│   │   └── Breadcrumbs.jsx
│   ├── tickets/
│   │   ├── TicketList.jsx
│   │   ├── TicketDetails.jsx
│   │   ├── TicketForm.jsx
│   │   └── TicketStatusBadge.jsx
│   ├── projects/
│   │   ├── ProjectList.jsx
│   │   ├── ProjectBoard.jsx
│   │   ├── KanbanColumn.jsx
│   │   ├── TaskCard.jsx
│   │   ├── GanttChart.jsx
│   │   ├── CalendarView.jsx
│   │   └── ResourceTimeline.jsx
│   └── dashboard/
│       ├── StatsWidget.jsx
│       ├── ActivityFeed.jsx
│       └── QuickActions.jsx
├── pages/
│   ├── Dashboard.jsx
│   ├── Tickets.jsx
│   ├── TicketDetails.jsx
│   ├── Projects.jsx
│   ├── ProjectDetails.jsx
│   ├── Reports.jsx
│   └── Settings.jsx
├── hooks/
│   ├── useAuth.js
│   ├── usePermissions.js
│   ├── useWebSocket.js
│   └── useNotifications.js
├── services/
│   ├── api.js
│   ├── ticketService.js
│   ├── projectService.js
│   └── authService.js
├── store/
│   ├── authStore.js
│   ├── ticketStore.js
│   └── projectStore.js
└── utils/
    ├── permissions.js
    ├── dateFormatter.js
    └── validators.js
```

### 6.2 State Management Strategy

```javascript
// store/ticketStore.js
import create from 'zustand';

export const useTicketStore = create((set, get) => ({
    tickets: [],
    selectedTicket: null,
    filters: { status: 'all', priority: 'all' },
    
    fetchTickets: async () => {
        const data = await ticketService.getAll(get().filters);
        set({ tickets: data });
    },
    
    createTicket: async (ticketData) => {
        const newTicket = await ticketService.create(ticketData);
        set(state => ({ tickets: [...state.tickets, newTicket] }));
        return newTicket;
    },
    
    updateTicket: async (id, updates) => {
        const updated = await ticketService.update(id, updates);
        set(state => ({
            tickets: state.tickets.map(t => t.id === id ? updated : t),
            selectedTicket: state.selectedTicket?.id === id ? updated : state.selectedTicket
        }));
    },
    
    setFilters: (newFilters) => {
        set({ filters: newFilters });
        get().fetchTickets();
    }
}));
```

### 6.3 Permission-Based Rendering

```javascript
// hooks/usePermissions.js
export const usePermissions = () => {
    const { user } = useAuthStore();
    
    const can = (permission) => {
        if (!user) return false;
        return user.permissions?.includes(permission) || false;
    };
    
    return { can };
};

// Usage in component
const TicketList = () => {
    const { can } = usePermissions();
    
    return (
        <div>
            {can('ticket.view_all') ? <AllTicketsView /> : <MyTicketsView />}
            {can('ticket.assign') && <AssignButton />}
        </div>
    );
};
```

---

## 7. FEATURE MODULES

### 7.1 Multi-View Support

**Kanban Board**
- Drag-and-drop task cards between columns
- Swimlanes by assignee/priority
- WIP limits per column
- Card colorization by priority/type

**List View**
- Sortable/filterable table
- Bulk actions (assign, update status)
- Inline editing
- Export to CSV/Excel

**Calendar View**
- Tasks plotted by due date
- Drag to reschedule
- Month/Week/Day views
- Color coding

**Gantt/Timeline View**
- Task dependencies visualization
- Critical path highlighting
- Milestone markers
- Drag to adjust dates

---

### 7.2 Advanced Features

**Dependencies & Critical Path**
```python
# Algorithm to detect circular dependencies
def detect_circular_dependency(task_id, new_dependency_id):
    visited = set()
    
    def dfs(current_id):
        if current_id == task_id:
            return True  # Circular!
        if current_id in visited:
            return False
        visited.add(current_id)
        
        for dependency in Task.objects.get(id=current_id).dependencies.all():
            if dfs(dependency.depends_on_task_id):
                return True
        return False
    
    return dfs(new_dependency_id)
```

**Automation Engine**
```python
# Example automation rule
{
    "trigger": "ticket.created",
    "conditions": {
        "category": "BUG",
        "priority": "CRITICAL"
    },
    "actions": [
        {
            "type": "assign",
            "user_id": "senior_dev_team_lead"
        },
        {
            "type": "notify",
            "channel": "slack",
            "message": "CRITICAL BUG: {{ticket.title}}"
        },
        {
            "type": "update_field",
            "field": "status",
            "value": "IN_PROGRESS"
        }
    ]
}
```

**Templates**
- Save project structures as templates
- Clone projects with all tasks/subtasks
- Parameterized templates (dates, assignees)

**Custom Fields**
- Add fields per project type
- Budget tracking, contract numbers, etc.

**Workload Management**
- View team capacity
- Prevent over-allocation
- Balance workload across team

---

## 8. SECURITY & COMPLIANCE

### 8.1 Security Measures

**Authentication**
- JWT with refresh tokens
- Password hashing (Argon2)
- Optional 2FA (TOTP)
- Session timeout

**Authorization**
- Row-level security (users only see their tickets unless admin/dev)
- API-level permission checks
- Frontend permission-based rendering

**Data Protection**
- Encryption at rest (database encryption)
- Encryption in transit (TLS 1.3)
- File upload scanning (antivirus)
- Input sanitization (XSS prevention)

**Audit Logging**
- All CRUD operations logged
- IP address & user agent tracking
- Immutable audit trail
- Compliance reporting

**Rate Limiting**
- API throttling per user role
- Prevent brute force attacks
- CAPTCHA on login after failed attempts

---

## 9. PERFORMANCE & SCALABILITY

### 9.1 Optimization Strategies

**Database**
- Proper indexing on frequently queried columns
- Database connection pooling
- Read replicas for analytics queries
- Partitioning for large tables (audit_logs)

**Caching**
- Redis for session storage
- Cache user permissions
- Cache frequently accessed data (project lists)
- Invalidate on updates

**Frontend**
- Code splitting & lazy loading
- Virtualized lists for large datasets
- Debounced search inputs
- Service workers for offline support

**CDN**
- Static assets served via CDN
- Image optimization & compression
- Browser caching headers

---

## 10. IMPLEMENTATION ROADMAP

### Phase 1: Core MVP (Weeks 1-4)
- [ ] User authentication & RBAC
- [ ] Ticket CRUD (Employee portal)
- [ ] Ticket management (Developer view)
- [ ] Basic project/task management
- [ ] Comments & attachments

### Phase 2: Enhanced Features (Weeks 5-8)
- [ ] Multiple views (Kanban, List, Calendar)
- [ ] Task dependencies
- [ ] SLA tracking
- [ ] Notifications (email, in-app)
- [ ] Time tracking

### Phase 3: Advanced Capabilities (Weeks 9-12)
- [ ] Gantt chart / Timeline
- [ ] Automation rules
- [ ] Templates
- [ ] Analytics dashboard
- [ ] Custom fields

### Phase 4: Enterprise Readiness (Weeks 13-16)
- [ ] Audit logging
- [ ] Advanced reporting
- [ ] API rate limiting
- [ ] Mobile responsiveness
- [ ] Load testing & optimization

---

## 11. UNIQUE SELLING POINTS

What makes Omni-PMS superior to competitors:

1. **Unified Workflow**: Tickets → Tasks → Projects in one flow
2. **Role Segregation**: Simplified employee view, power user dev view
3. **Zero Missing Features**: All features from Jira + Asana + ClickUp + Monday
4. **Human-Centric Design**: No generic AI feel, premium aesthetics
5. **Automation Power**: ClickUp-level automation with Monday-style simplicity
6. **SLA Management**: Zendesk-grade SLA tracking built-in
7. **Complete Audit Trail**: Enterprise compliance ready
8. **Flexible Views**: Kanban + Gantt + Calendar + List all in one
9. **Real-Time Updates**: WebSocket-powered live collaboration
10. **Self-Hosted Option**: On-premise deployment for security-conscious orgs

---

**END OF TECHNICAL ARCHITECTURE DOCUMENT**

_This is not an MVP. This is a complete, enterprise-grade system designed to dominate the PMS market._
