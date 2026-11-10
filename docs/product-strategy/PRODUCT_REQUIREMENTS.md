# PRODUCT REQUIREMENTS
## Functional Requirements, User Stories, and Acceptance Criteria
**Assessment Date:** November 2026

> This document covers requirements for the highest-priority features identified in the roadmap.
> Requirements are written to inform development without prescribing implementation details unnecessarily.

---

## FEATURE 1: REAL EMAIL DELIVERY

### Business Objective
Enable actual email communication for user invitations, notifications, and account management.

### User Problem
When a user is invited to a team or receives a notification, no email is delivered. This breaks the core team collaboration workflow and prevents user growth.

### User Stories

**US-001: User Invitation Email**
> As a team member, I want to receive an email invitation when someone adds me to a workspace, so that I can join the team.

**Acceptance Criteria:**
- [ ] Invitation email is sent to the recipient's email address within 60 seconds of invitation creation
- [ ] Email contains inviter's name, workspace name, and a one-click join link
- [ ] Join link is unique and expires after 72 hours
- [ ] Invalid/expired links show a clear error with an option to request a new invite
- [ ] Email renders correctly in Gmail, Outlook, and Apple Mail
- [ ] From address shows the product name (not a raw SMTP address)

**US-002: Task Assignment Notification**
> As a team member, I want to receive an email when a task is assigned to me, so that I don't miss new work.

**Acceptance Criteria:**
- [ ] Email sent when `assigned_to` field changes on a Task
- [ ] Email contains task title, project name, priority, due date, and a link to the task
- [ ] Email is not sent if the user has disabled `email_notifications` in settings
- [ ] No duplicate emails if task is reassigned rapidly (debounce within 5 minutes)

**US-003: Due Date Reminder**
> As a task owner, I want to receive an email reminder 24 hours before a task is due, so that I can prioritize accordingly.

**Acceptance Criteria:**
- [ ] Reminder email sent 24 hours before due_date
- [ ] Sent only for tasks in TODO or IN_PROGRESS status
- [ ] Only sent if user has not completed or reassigned the task
- [ ] Celery scheduled task runs reminder check every hour

---

## FEATURE 2: AI ASSISTANT (PHASE 1)

### Business Objective
Transform the placeholder AI stub into real AI capabilities that deliver user value and differentiate the platform.

### User Problem
Task descriptions are often vague. Project status requires manual summarization. Priority decisions are subjective. AI can assist with all of these while reducing cognitive load.

### User Stories

**US-004: AI Task Summary**
> As a project manager, I want to see an AI-generated summary of a task's comments and history, so that I can quickly understand the task status without reading everything.

**Acceptance Criteria:**
- [ ] "Summarize" button appears on task detail panel when task has 3+ comments
- [ ] AI generates a 2–4 sentence summary of the task discussion
- [ ] Summary is displayed in a dismissible card above the comment list
- [ ] Summary includes: current status, main discussion points, blockers mentioned
- [ ] Generation takes < 5 seconds
- [ ] Request is logged in AIRequestLog with token count

**US-005: AI Project Status Summary**
> As a project manager, I want to generate an AI summary of my project's current status, so that I can quickly prepare stakeholder updates.

**Acceptance Criteria:**
- [ ] "AI Summary" button in ProjectDetails header
- [ ] AI analyzes: task completion rate, overdue tasks, sprint progress, recent activity
- [ ] Returns a 3–5 sentence executive summary
- [ ] Includes key risks (overdue items, blocked tasks)
- [ ] Can be copied to clipboard with one click
- [ ] Summary date/time is displayed for context

**US-006: AI Priority Suggestion**
> As a developer, I want AI to suggest a priority for my task based on its title and description, so that I make consistent priority decisions.

**Acceptance Criteria:**
- [ ] "Suggest Priority" button appears next to priority dropdown during task creation
- [ ] AI analyzes title and description text
- [ ] Returns one of: LOW, MEDIUM, HIGH, CRITICAL with a brief reason
- [ ] User can accept or dismiss the suggestion
- [ ] Suggestion is non-binding — user retains full control

**Backend Requirements:**
- `OPENAI_API_KEY` loaded from environment variable
- `AIService` class implements `generate_summary()`, `generate_project_summary()`, `suggest_priority()`
- All requests logged in `AIRequestLog` with status, token count, processing time
- Error handling for API failures with user-friendly fallback message
- Rate limiting: max 50 AI requests per user per day (configurable)

---

## FEATURE 3: AUTOMATION RULES UI

### Business Objective
Make the sophisticated automation backend accessible to users, enabling workflow automation without custom code.

### User Problem
Teams perform repetitive manual actions (notify manager when task is blocked, auto-assign critical tickets) that could be automated. The backend supports this but there is no UI.

### User Stories

**US-007: Create Automation Rule**
> As a project manager, I want to create a rule that automatically notifies me when a critical task is overdue, so that I can intervene before it becomes a blocker.

**Acceptance Criteria:**
- [ ] "Automation" section accessible from project settings sidebar
- [ ] Rule builder has three sections: WHEN (trigger), IF (conditions), THEN (actions)
- [ ] WHEN options: Status Changed, Item Assigned, Due Date Approaching, Item Created, Comment Added
- [ ] IF conditions: priority equals, assignee equals, status equals, due date before
- [ ] THEN actions: Notify user, Change status, Assign to user, Add comment
- [ ] Rule is saved to WorkflowRule model on submission
- [ ] New rule is active by default (is_active=True)
- [ ] Rule appears in rules list with toggle to enable/disable

**US-008: View Automation Execution History**
> As an admin, I want to see the history of automation rule executions, so that I can verify rules are working correctly.

**Acceptance Criteria:**
- [ ] Each rule has an "Executions" tab showing last 50 executions
- [ ] Each execution shows: timestamp, trigger, target object, success/failure, action taken
- [ ] Failed executions show error message
- [ ] Can filter by status (SUCCESS/FAILED/PARTIAL)

**US-009: Automation Template Library**
> As a new user, I want to start with pre-built automation templates, so that I can set up common workflows quickly.

**Acceptance Criteria:**
- [ ] Template gallery accessible from automation section
- [ ] At least 5 pre-built templates available on first use:
  1. "Notify on Critical Priority" — notify assigned user when priority set to CRITICAL
  2. "Auto-close Stale Tasks" — move to DONE if no activity in 30 days
  3. "Manager Alert on Overdue" — notify project lead when task is overdue
  4. "SLA Breach Notification" — notify team on ticket SLA breach
  5. "New Task Welcome Comment" — add comment when task created
- [ ] Each template shows: name, description, trigger, action, estimated use case
- [ ] "Use Template" creates a new rule pre-filled with template config
- [ ] User can customize before saving

**Backend Requirements:**
- Wire Django signals in `projects/signals.py` and `tickets/signals.py` to call `evaluate_rules_for_object()`
- Implement `execute_workflow_rule()` in `automation/utils.py`
- Implement `send_webhook()` function (stub exists in views.py)
- Seed system templates via data migration

**Security Considerations:**
- Rules can only target objects within the user's accessible projects
- Admin-created rules can target all objects
- Webhook URLs must be validated (no localhost, no internal IPs)
- Automation actions cannot change user permissions

---

## FEATURE 4: KNOWLEDGE BASE FRONTEND

### Business Objective
Make the existing wiki and document backend accessible, enabling teams to maintain living project documentation.

### User Stories

**US-010: Create Wiki Page**
> As a developer, I want to create a wiki page for my project documenting the architecture decisions, so that new team members can understand our system.

**Acceptance Criteria:**
- [ ] "Wiki" tab accessible from project navigation
- [ ] Wiki page tree in sidebar showing hierarchy
- [ ] "New Page" button opens wiki editor
- [ ] Editor supports: headings, bold/italic, code blocks, numbered/bullet lists, tables
- [ ] Auto-save every 30 seconds
- [ ] Save creates WikiPageVersion record
- [ ] Parent page can be selected for hierarchical organization
- [ ] Page is immediately visible to project members

**US-011: Document Upload and Organization**
> As a project manager, I want to upload project documents and organize them in folders, so that my team can find resources easily.

**Acceptance Criteria:**
- [ ] "Documents" tab with folder tree
- [ ] Drag-and-drop file upload (max 50MB per file)
- [ ] File type validation (images, PDFs, Office docs, text)
- [ ] Create folders and subfolders
- [ ] Move documents between folders
- [ ] Download documents
- [ ] Document version list showing upload history
- [ ] File size displayed next to each document

**US-012: Search Documents**
> As a team member, I want to find a document by searching for keywords, so that I don't have to browse through folders.

**Acceptance Criteria:**
- [ ] Global search (Ctrl+K) includes Documents and Wiki pages
- [ ] Results show: title, preview snippet, folder path
- [ ] Clicking result opens the document/page

---

## FEATURE 5: PROJECT TEMPLATES

### User Stories

**US-013: Create Project from Template**
> As a team lead, I want to create a new project from a template, so that I don't have to set up the same tasks and structure every sprint cycle.

**Acceptance Criteria:**
- [ ] Template selection shown as first step in project creation flow
- [ ] At least 5 built-in templates available
- [ ] Template preview shows included tasks, sprints, and statuses
- [ ] Creating from template clones: project settings, tasks (without assignees), custom statuses, sprint structure
- [ ] New project is immediately accessible and editable
- [ ] Original template is not modified

**US-014: Save Project as Template**
> As a project manager, I want to save a successfully completed project as a template, so that my team can reuse the structure.

**Acceptance Criteria:**
- [ ] "Save as Template" option in project settings
- [ ] Template name and description can be customized
- [ ] Template shows in template gallery for the organization
- [ ] Creator can delete or update their own templates
- [ ] Admin can mark templates as "org-wide" vs "personal"

---

## FEATURE 6: TICKET→TASK PIPELINE

### Business Objective
Expose the unique native ticket-to-task bridge that no competitor has, enabling seamless flow from customer-reported issues to sprint tasks.

### User Stories

**US-015: Convert Ticket to Task**
> As a developer, I want to convert a support ticket into a sprint task, so that bug fixes appear in our sprint board alongside feature work.

**Acceptance Criteria:**
- [ ] "Convert to Task" button on ticket detail page
- [ ] Modal lets user select: target project, sprint (optional), priority, assignee
- [ ] On conversion: Task is created linked to ticket (project_task OneToOne)
- [ ] Ticket shows "Linked Task: TASK-123" with clickable link
- [ ] Task shows "Source: TKT-20261110-4567" with clickable link
- [ ] When task moves to DONE, linked ticket is automatically moved to RESOLVED
- [ ] Ticket comments are visible from task (and vice versa)

**US-016: View Linked Tickets in Sprint**
> As a sprint manager, I want to see which sprint tasks originated from support tickets, so that I understand what percentage of sprint work is bug fixes vs features.

**Acceptance Criteria:**
- [ ] Sprint board has an optional "Show ticket origin" indicator on tasks
- [ ] Sprint report includes: X% of tasks originated from tickets
- [ ] Can filter sprint tasks by: has linked ticket / no linked ticket
- [ ] Dashboard shows "Ticket→Task conversion rate" as a KPI

---

## FEATURE 7: REAL-TIME NOTIFICATIONS

### User Stories

**US-017: Real-Time In-App Notification**
> As a team member, I want to receive a notification badge immediately when someone assigns a task to me, so that I don't miss important work.

**Acceptance Criteria:**
- [ ] Notification badge appears in sidebar nav within 5 seconds of event
- [ ] Badge shows count of unread notifications
- [ ] Clicking badge opens notification panel
- [ ] Notification includes: actor, action, target object, timestamp
- [ ] Clicking notification navigates to relevant object
- [ ] Mark all as read clears badge

---

## FEATURE 8: CUSTOM DASHBOARD

### User Stories

**US-018: Personalized Dashboard**
> As a manager, I want to customize my dashboard with the metrics I care about, so that my home screen shows the information most relevant to my role.

**Acceptance Criteria:**
- [ ] Dashboard has "Edit Layout" mode
- [ ] In edit mode, widgets can be dragged, resized, and removed
- [ ] Widget library shows available widgets with previews
- [ ] Layout is persisted per user
- [ ] At least 8 widget types available (see roadmap)
- [ ] "Reset to Default" option available
- [ ] Dashboard loads in < 2 seconds

---

## NON-FUNCTIONAL REQUIREMENTS

### Performance
- API endpoints must respond in < 500ms for 95th percentile
- Dashboard must load in < 2 seconds
- File uploads up to 50MB supported
- Search returns results in < 1 second

### Security
- All API endpoints require authentication
- Object-level permission checks on all CRUD operations
- SQL injection prevention via Django ORM (never raw SQL with user input)
- File upload validation (type, size, virus scan recommended)
- All secrets in environment variables, never in code

### Reliability
- Background jobs must have retry logic (max 3 attempts with exponential backoff)
- Webhook delivery must be retried on failure (up to `max_retries` on Webhook model)
- Database transactions for multi-step operations

### Accessibility
- All new UI components must have ARIA labels
- Keyboard navigation support for all interactive elements
- Color is never the only indicator of state (use icons/text)
- Minimum contrast ratio of 4.5:1 for text

### Mobile
- All new pages must be functional on 375px viewport
- Touch targets minimum 44×44px
- No horizontal scroll on mobile

---

*Requirements document should be updated as features are refined. Each US should have a corresponding GitHub Issue before development begins.*

