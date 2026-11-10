# PRODUCT ROADMAP
## Prioritized Implementation Roadmap
**Assessment Date:** November 2026  
**Framework:** RICE + MoSCoW + Strategic Value

---

## PRIORITIZATION FRAMEWORK

**RICE Score = (Reach × Impact × Confidence) / Effort**
- Reach: Number of users affected (1–10)
- Impact: Value delivered (1–10)
- Confidence: How certain we are this will work (0.5–1.0)
- Effort: Weeks of development work (1–20)

**MoSCoW:**
- **M** Must Have — blocking commercial readiness
- **S** Should Have — substantial competitive improvement
- **C** Could Have — nice to have
- **W** Won't Have (now) — future consideration

---

## STAGE 1: FOUNDATION AND PRODUCT QUALITY
*Target: 4–8 weeks | Goal: Make what exists actually work*

### 1.1 — Fix Fake Integrations Page (CRITICAL)
**MoSCoW:** M | **RICE:** 9×10×1.0/0.5 = 180  
**Problem:** Integrations page has hardcoded `useState(['github'])` fake state  
**Solution:** Remove fake state, replace with "Coming Soon" badges until real integration  
**Effort:** 2 hours  
**Definition of Done:** No hardcoded connected state; honest UI showing available vs coming-soon integrations

---

### 1.2 — Wire Real Email Delivery (CRITICAL)
**MoSCoW:** M | **RICE:** 10×10×1.0/1 = 100  
**Problem:** EMAIL_BACKEND = console.EmailBackend — emails only print to terminal  
**Solution:** Configure SMTP (SendGrid/AWS SES), add email templates for invitations and notifications  
**Effort:** 3–5 days  
**Backend Requirements:**
- Replace console backend with SMTP backend
- Create HTML email templates for: invite, notification, password reset, welcome
- Add EMAIL_HOST, EMAIL_PORT, EMAIL_HOST_USER, EMAIL_HOST_PASSWORD to environment
**Definition of Done:** New user receives welcome email; invite email delivered; notification email sent on task assignment

---

### 1.3 — Fix Security: Rotate Secret Key (CRITICAL)
**MoSCoW:** M | **RICE:** 10×10×1.0/0.1 = 1000  
**Problem:** `SECRET_KEY = 'django-insecure-znl#fw+8%4g9l8m$3wf...'` hardcoded in settings.py  
**Solution:** Move to environment variables using python-dotenv  
**Effort:** 1 hour  
**Definition of Done:** SECRET_KEY loaded from .env; not in version control

---

### 1.4 — Replace alert()/confirm() with Toast (UX CRITICAL)
**MoSCoW:** M | **RICE:** 10×8×1.0/3 = 26.7  
**Problem:** 15+ instances of `window.alert()` and `window.confirm()` in ProjectDetails.jsx  
**Solution:** Replace with custom Toast system (already exists in Toast.jsx) and ConfirmModal component  
**Effort:** 2–3 days  
**Definition of Done:** Zero native alert/confirm dialogs; all replaced with Toast/ConfirmModal

---

### 1.5 — Activate AI Assistant (HIGH IMPACT)
**MoSCoW:** M | **RICE:** 10×10×0.9/5 = 18  
**Problem:** AIService.generate_summary() returns hardcoded string  
**Solution:** Connect OpenAI API; implement 3 initial AI features  
**Effort:** 1–2 weeks  
**Backend Requirements:**
```python
# ai_assistant/services.py — real implementation
import openai
class AIService:
    @staticmethod
    def generate_summary(text: str) -> str:
        response = openai.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": f"Summarize this project update: {text}"}]
        )
        return response.choices[0].message.content
```
**Initial AI Features:**
1. Task description summarization
2. Project status summary (using tasks data)
3. Task priority suggestion based on description
**Definition of Done:** AI endpoints return real responses; usage logged in AIRequestLog; error handling for API failures

---

### 1.6 — Set Up Celery Worker (CRITICAL FOR BACKGROUND FEATURES)
**MoSCoW:** M | **RICE:** 9×9×0.9/5 = 14.6  
**Problem:** BackgroundJob model exists, Celery in requirements, but no worker running  
**Solution:** Configure Celery with Redis, wire automation rule execution  
**Effort:** 1 week  
**Requirements:**
- Add celery.py to core_api app
- Configure Redis as broker
- Create periodic tasks for: recurring task generation, SLA breach checks, scheduled automation rules
- Add docker-compose.yml for Redis
**Definition of Done:** Background jobs process; scheduled automation rules execute; recurring tasks generate

---

### 1.7 — Add Loading States and Error Handling
**MoSCoW:** M | **RICE:** 10×7×1.0/5 = 14  
**Problem:** Most components render empty on data fetch with no visual feedback  
**Solution:** Add skeleton loaders, loading spinners, and standardized error states  
**Effort:** 3–5 days  
**Definition of Done:** All data-fetching components show loading state; all errors display user-friendly message via Toast

---

### 1.8 — API Documentation
**MoSCoW:** M | **RICE:** 7×8×0.9/1 = 50.4  
**Problem:** drf-yasg installed but not configured  
**Solution:** Configure Swagger/OpenAPI documentation endpoint  
**Effort:** 1 day  
**Backend Requirements:**
```python
# core_api/urls.py — add:
from drf_yasg import openapi
from drf_yasg.views import get_schema_view
schema_view = get_schema_view(openapi.Info(title="Project API", default_version='v1'))
urlpatterns += [path('api/docs/', schema_view.with_ui('swagger'))]
```
**Definition of Done:** /api/docs/ returns interactive Swagger UI; all endpoints documented

---

### 1.9 — Migrate to PostgreSQL
**MoSCoW:** M | **RICE:** 8×9×1.0/2 = 36  
**Problem:** SQLite not suitable for production multi-user workloads  
**Solution:** Configure PostgreSQL, run migrations  
**Effort:** 1–2 days  
**Definition of Done:** Application runs on PostgreSQL; SQLite no longer used in production

---

## STAGE 2: COMPETITIVE FEATURE DEVELOPMENT
*Target: 2–4 months | Goal: Close major competitive gaps*

### 2.1 — Automation Rules Frontend UI
**MoSCoW:** S | **RICE:** 8×9×0.8/15 = 3.8  
**Problem:** Sophisticated automation backend (8 trigger types, action templates) with zero UI  
**Solution:** Build automation rules management interface  
**Effort:** 2–3 weeks  
**Frontend Requirements:**
- Automation rules list page
- Rule builder with trigger selection
- Condition configuration (JSON-based, visual)
- Action selection (notify/assign/change status)
- Enable/disable toggle
- Execution history viewer
- Pre-built template browser
**Backend Requirements:**
- Wire Django signals to WorkflowRule evaluation on Task/Ticket events
- Implement execute_workflow_rule() in automation/utils.py
**User Stories:**
- As a manager, I can create a rule that auto-assigns tickets to me when priority is CRITICAL
- As a project lead, I can configure a rule that sends a notification when a task moves to REVIEW
- As an admin, I can see all automation executions and their outcomes

---

### 2.2 — Knowledge Base Frontend
**MoSCoW:** S | **RICE:** 7×8×0.8/15 = 3.0  
**Problem:** Wiki pages, documents, folders — comprehensive backend with zero frontend  
**Solution:** Build knowledge base section  
**Effort:** 2–3 weeks  
**Frontend Requirements:**
- /knowledge route with Documents and Wiki tabs
- Wiki page tree sidebar (hierarchical from parent_page)
- Rich text wiki editor
- Document upload with folder organization
- Document version history viewer
- Search within knowledge base
**User Stories:**
- As a team member, I can create wiki pages for project documentation
- As a project manager, I can upload project documents and organize them in folders
- As a user, I can find documents by searching the knowledge base

---

### 2.3 — Rich Text Task Descriptions
**MoSCoW:** S | **RICE:** 10×8×1.0/5 = 16  
**Problem:** Task descriptions are plain text textareas  
**Solution:** Integrate a lightweight rich text editor  
**Technology:** TipTap or react-quill  
**Effort:** 1 week  
**Requirements:**
- Markdown support with live preview
- Bold, italic, code blocks, bullet lists
- Image paste support
- @mention trigger for user references (prerequisite for mention system)
**User Story:** As a developer, I can write technical documentation in my task description using code blocks and formatting

---

### 2.4 — Project Templates
**MoSCoW:** S | **RICE:** 8×8×0.9/8 = 7.2  
**Problem:** No template system; every project starts from scratch  
**Solution:** Build project template creation and application  
**Effort:** 1–2 weeks  
**Backend Requirements:**
- Use existing `is_template` boolean on Project model
- Add endpoint: POST /api/projects/{id}/create_from_template/
- Clone project with its tasks, sprints, milestones, custom statuses
**Frontend Requirements:**
- Template gallery in project creation flow
- "Save as Template" option in project settings
- Template management page
**Built-in Templates to Create:**
- Software Development Sprint
- Marketing Campaign
- Bug Tracking
- Product Launch
- Onboarding Process

---

### 2.5 — Table/Spreadsheet View
**MoSCoW:** S | **RICE:** 8×8×0.9/8 = 7.2  
**Problem:** No table view — users who want spreadsheet-style task management must use a different tool  
**Solution:** Build table view in ProjectDetails  
**Effort:** 1–2 weeks  
**Requirements:**
- Sortable, filterable table of tasks
- Inline cell editing (click to edit title, status, priority, assignee, due date)
- Column show/hide
- Bulk select with row checkboxes
- Export to CSV directly from table view

---

### 2.6 — Custom Dashboard Builder
**MoSCoW:** S | **RICE:** 8×9×0.8/15 = 3.8  
**Problem:** Dashboard is a fixed static layout; no customization  
**Solution:** Drag-and-drop widget dashboard  
**Technology:** react-grid-layout  
**Effort:** 2–3 weeks  
**Widget Types:**
- Task completion KPI
- Project health grid
- Burndown chart
- Team workload bar chart
- Recent activity feed
- Open ticket count
- My tasks list
- Overdue tasks alert

---

### 2.7 — Multiple Assignees Per Task
**MoSCoW:** S | **RICE:** 9×7×0.9/4 = 14.2  
**Problem:** Only one assignee per task  
**Solution:** Change to ManyToMany assignment  
**Effort:** 3–5 days  
**Backend Requirements:**
- Add `assignees = ManyToManyField(User)` to Task model
- Keep `assigned_to` for primary assignee compatibility
- Create migration
**Frontend Requirements:**
- Multi-select user dropdown in task modal
- Display multiple assignee avatars on task cards

---

### 2.8 — Ticket SLA Dashboard
**MoSCoW:** S | **RICE:** 7×8×0.8/5 = 8.9  
**Problem:** Sophisticated SLA backend with no reporting UI  
**Solution:** Build SLA performance dashboard  
**Effort:** 1 week  
**Requirements:**
- SLA compliance rate by priority
- Average resolution time vs target
- Breached tickets list with reasons
- SLA trend over time
- Escalation report

---

### 2.9 — @Mention System
**MoSCoW:** S | **RICE:** 9×7×0.9/8 = 7.1  
**Problem:** No @mention capability in comments or chat  
**Solution:** Implement mention parsing with notifications  
**Effort:** 1–2 weeks  
**Requirements:**
- Trigger @mention dropdown in comment/chat inputs
- Parse mentions on save and create Notifications
- Display mentioned users in comment UI
- Send email notification to mentioned user

---

## STAGE 3: ADVANCED WORK MANAGEMENT
*Target: 3–6 months | Goal: Enterprise-ready capabilities*

### 3.1 — Real-Time Collaboration (WebSockets)
**MoSCoW:** S | **RICE:** 10×9×0.8/20 = 3.6  
**Problem:** No real-time updates — chat requires manual refresh  
**Solution:** Implement Django Channels with WebSockets  
**Effort:** 3–4 weeks  
**Requirements:**
- Real-time task status updates
- Real-time chat messages
- User presence indicators (online/offline)
- Optimistic updates with server confirmation
**Technology:** Django Channels + Redis channel layer

---

### 3.2 — SSO Implementation
**MoSCoW:** S | **RICE:** 6×9×0.9/8 = 6.1  
**Problem:** SSO model fields exist but no implementation  
**Solution:** Implement SAML/OIDC SSO for enterprise  
**Effort:** 2–3 weeks  
**Technology:** python-social-auth or django-allauth for Google/Okta/Azure
**Requirements:**
- Enterprise SSO configuration UI
- SAML 2.0 support
- OAuth 2.0 (Google Workspace) support
- Auto-provisioning of users on SSO login

---

### 3.3 — Fine-Grained RBAC
**MoSCoW:** S | **RICE:** 7×8×0.8/15 = 3.0  
**Problem:** Role-level only permissions, no resource-level access control  
**Solution:** Implement object-level permissions  
**Effort:** 2–3 weeks  
**Requirements:**
- Project-level role assignment (can be Admin of one project, Member of another)
- Task-level visibility control
- Custom role creation
- Permission inheritance (org → workspace → project → task)

---

### 3.4 — GitHub/GitLab Integration (Real)
**MoSCoW:** S | **RICE:** 8×9×0.8/15 = 3.8  
**Problem:** Integration page shows fake connected state  
**Solution:** Build real bi-directional GitHub integration  
**Effort:** 3–4 weeks  
**Requirements:**
- OAuth app registration for GitHub/GitLab
- Webhook receiver for push events, PR events
- Link PR to task (auto-update task status when PR merged)
- Branch name auto-suggestion from task
- Commit reference in task activity log

---

### 3.5 — Ticket→Task Pipeline UI
**MoSCoW:** S | **RICE:** 7×9×0.9/5 = 11.3  
**Problem:** Ticket→Task bridge exists in backend (project_task OneToOne) but no UI  
**Solution:** Build the ticket-to-task conversion workflow  
**Effort:** 1 week  
**This is a unique differentiator — no major competitor does this natively**  
**Requirements:**
- "Convert to Task" button on ticket detail page
- Select project and sprint when converting
- Linked ticket shows task status and vice versa
- Ticket status auto-updates when linked task completes
- Bidirectional navigation between ticket and task

---

### 3.6 — Backlog Management View
**MoSCoW:** S | **RICE:** 8×8×0.9/8 = 7.2  
**Problem:** No dedicated backlog management UI  
**Solution:** Create a dedicated backlog view with sprint assignment  
**Effort:** 1–2 weeks  
**Requirements:**
- Filtered list of unassigned/backlog tasks
- Drag tasks into sprints
- Priority reordering
- Epic filter
- Story point estimation

---

## STAGE 4: INTELLIGENT PRODUCT CAPABILITIES
*Target: 6–12 months | Goal: AI as genuine product differentiator*

### 4.1 — AI Project Risk Intelligence
**MoSCoW:** C | **RICE:** 8×9×0.7/15 = 3.4  
**Features:**
- Analyze task completion velocity vs deadlines
- Identify at-risk projects before they miss deadlines
- Weekly AI risk report to project managers
- Suggested interventions (reassign tasks, adjust scope)

---

### 4.2 — AI Task Breakdown
**MoSCoW:** C | **RICE:** 9×8×0.8/10 = 5.8  
**Features:**
- Input a high-level task or epic
- AI generates subtask breakdown with estimates
- One-click import of suggested subtasks
- Story point suggestions based on complexity

---

### 4.3 — Natural Language Automation Builder
**MoSCoW:** C | **RICE:** 8×8×0.7/15 = 3.0  
**Features:**
- Type: "When a task is marked done, notify the manager"
- AI parses intent and constructs WorkflowRule JSON config
- Preview generated rule before saving
- Edit generated rule manually

---

### 4.4 — Predictive Workload Balancing
**MoSCoW:** C | **RICE:** 7×8×0.7/12 = 3.3  
**Features:**
- Analyze current task distribution and capacity
- Predict team member burnout risk
- Suggest task reassignments
- Weekly workload forecast

---

### 4.5 — AI Sprint Retrospective Generation
**MoSCoW:** C | **RICE:** 7×7×0.7/8 = 4.3  
**Features:**
- Analyze sprint metrics (velocity, completion rate, overdue tasks)
- Generate retrospective template pre-filled with data insights
- Suggest action items based on patterns

---

## STAGE 5: MARKET DIFFERENTIATION
*Target: 12+ months | Goal: Unique capabilities that competitors don't have*

### 5.1 — Ticket Intelligence Layer
**Concept:** An SLA-aware intelligence layer that works across both PM and ticketing  
**Features:**
- Tasks that auto-escalate when blocked past defined duration
- Cross-system SLA: project milestone tied to ticket resolution
- Automatic ticket→task creation when ticket SLA breaches
- Executive SLA compliance dashboard

---

### 5.2 — Universal Activity Timeline
**Concept:** A single timeline showing all activity across projects AND tickets for any user or team  
**Features:**
- Unified view: tasks completed, tickets resolved, comments, meetings
- Filterable by team, project, person, time range
- AI-generated daily digest

---

### 5.3 — Ecosystem API Marketplace
**Concept:** Open API with developer documentation enabling third-party integrations  
**Features:**
- GraphQL API endpoint
- API key management UI
- Webhook studio (create, test, debug webhooks)
- Integration SDK and documentation
- Public integration directory

---

### 5.4 — Native Mobile Application
**Technology:** React Native (shared component logic)  
**Features:**
- Task creation and updates
- Push notifications (real)
- Quick time tracking
- Approval workflows

---

## IMPLEMENTATION COMPLEXITY GUIDE

| Feature | Backend Effort | Frontend Effort | Total | Risk |
|---|---|---|---|---|
| Fix secret key | 1 hour | — | 1 hour | Low |
| Wire email | 2 days | 1 day | 3 days | Low |
| AI basic features | 3 days | 2 days | 1 week | Medium |
| Automation UI | 1 week | 2 weeks | 3 weeks | Medium |
| Knowledge base UI | — | 2 weeks | 2 weeks | Low |
| Rich text editor | — | 1 week | 1 week | Low |
| Project templates | 3 days | 1 week | 2 weeks | Medium |
| Table view | — | 2 weeks | 2 weeks | Low |
| Dashboard builder | 2 days | 3 weeks | 4 weeks | Medium |
| Real-time (WebSockets) | 3 weeks | 1 week | 4 weeks | High |
| SSO implementation | 2 weeks | 1 week | 3 weeks | High |
| GitHub integration | 2 weeks | 1 week | 3 weeks | High |
| AI risk intelligence | 2 weeks | 1 week | 3 weeks | High |

---

## RECOMMENDED SPRINT STRUCTURE

### Sprint 1 (Week 1–2): Critical Fixes
- Secret key rotation
- Email delivery wiring
- Remove fake integrations state
- Replace alert() with Toast
- Add API documentation

### Sprint 2 (Week 3–4): AI Activation
- Connect OpenAI API
- Implement task summarization
- Implement project risk summary
- Build AI UI components in task modal

### Sprint 3 (Week 5–8): Automation UI
- Build automation rules list page
- Build rule builder interface
- Wire Django signals to automation execution
- Automation execution history

### Sprint 4 (Week 9–12): Knowledge Base + Templates
- Build knowledge base frontend
- Build wiki editor
- Build project template system
- Template gallery

### Sprint 5 (Week 13–16): Views + Dashboard
- Table/spreadsheet view
- Custom dashboard builder
- Rich text editor
- Multiple assignees

### Sprint 6 (Week 17–20): Enterprise Features
- SSO implementation
- Fine-grained RBAC
- Ticket→Task pipeline UI
- SLA dashboard

---

*All estimates assume a team of 2–3 developers. Estimates are ranges, not guarantees. Actual velocity will depend on team composition and familiarity with the codebase.*

