# Omni-PMS Setup Guide

Complete setup instructions for the Omni-PMS Project Management & Ticketing System.

## Prerequisites

- **Python 3.12+** (tested with 3.14)
- **Node.js 20+** (tested with 24.13.0)
- **Git** for version control

## Quick Start (Windows PowerShell)

### 1. Clone the Repository
```powershell
git clone <your-repo-url>
cd Project-manage-and-ticketing-system
```

### 2. Backend Setup

```powershell
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
.\venv\Scripts\Activate.ps1

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Create superuser (optional)
python manage.py createsuperuser

# Go back to root
cd ..
```

### 3. Frontend Setup

```powershell
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Go back to root
cd ..
```

### 4. Start the Application

#### Option A: Using the Start Script (Recommended)
```powershell
.\start.ps1
```
This will open two terminal windows: one for backend, one for frontend.

#### Option B: Manual Start

**Terminal 1 - Backend:**
```powershell
cd backend
.\venv\Scripts\Activate.ps1
python manage.py runserver
```

**Terminal 2 - Frontend:**
```powershell
cd frontend
npm run dev
```

## Access URLs

- **Frontend:** http://localhost:5173
- **Backend API:** http://127.0.0.1:8000
- **Django Admin:** http://127.0.0.1:8000/admin
- **API Documentation:** http://127.0.0.1:8000/api/docs/ (if Swagger is enabled)

## Environment Configuration

### Backend (.env)

Copy `backend/.env.example` to `backend/.env` and configure:

```env
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

### Frontend

No additional configuration needed for development. API endpoint is configured in the code to use `http://127.0.0.1:8000`.

## Running Tests

### Backend Tests
```powershell
cd backend
.\venv\Scripts\Activate.ps1
python manage.py test
```

### Frontend Tests
```powershell
cd frontend
npm run test
```

## Building for Production

### Backend
```powershell
cd backend
.\venv\Scripts\Activate.ps1
python manage.py collectstatic --no-input
```

### Frontend
```powershell
cd frontend
npm run build
```
The build output will be in `frontend/dist/`

## Troubleshooting

### Backend Issues

**Module not found errors:**
```powershell
cd backend
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

**Database errors:**
```powershell
cd backend
.\venv\Scripts\Activate.ps1
python manage.py migrate
```

### Frontend Issues

**Dependencies errors:**
```powershell
cd frontend
rm -r node_modules
rm package-lock.json
npm install
```

**Port already in use:**
The frontend uses port 5173 by default. If it's in use, Vite will automatically try the next available port.

## CI/CD Pipeline

The project includes GitHub Actions workflow (`.github/workflows/ci.yml`) that:
- Runs backend tests and Django system checks
- Builds and lints the frontend
- Runs on push/PR to main/master branches

To test CI locally:
```powershell
# Backend checks
cd backend
.\venv\Scripts\Activate.ps1
python manage.py check
python manage.py test

# Frontend checks
cd frontend
npm run lint
npm run build
```

## Project Structure

```
Project-manage-and-ticketing-system/
├── backend/                 # Django REST API
│   ├── core_api/           # Main Django settings
│   ├── users/              # User management
│   ├── projects/           # Projects & tasks
│   ├── tickets/            # Ticketing system
│   ├── activity/           # Comments & audit logs
│   ├── notifications/      # Notification system
│   ├── reports/            # Analytics & reporting
│   ├── automation/         # Workflows & webhooks
│   ├── collaboration/      # Team features
│   ├── knowledge/          # Documents & wiki
│   ├── search/             # Search functionality
│   ├── timetracking/       # Time tracking
│   ├── audit/              # Audit trails
│   ├── ai_assistant/       # AI features
│   ├── manage.py           # Django CLI
│   └── requirements.txt    # Python dependencies
├── frontend/               # React + Vite
│   ├── src/               # Source code
│   ├── public/            # Static assets
│   ├── package.json       # Node dependencies
│   └── vite.config.js     # Vite configuration
├── .github/workflows/     # CI/CD configuration
├── start.ps1              # Quick start script
└── README.md              # Project overview
```

## Features

- 🔐 **Authentication:** JWT-based auth with 2FA support
- 📊 **Projects:** Create and manage projects with tasks, sprints, and boards
- 🎫 **Tickets:** Full ticketing system with priorities, assignments, and SLAs
- 💬 **Comments:** Threaded comments with reactions
- 📝 **Activity Logs:** Complete audit trail
- 🔔 **Notifications:** Real-time notifications
- 📈 **Reports:** Analytics and custom reports
- ⚡ **Automation:** Workflows, webhooks, and background jobs
- 🤝 **Collaboration:** Team chat and announcements
- 📚 **Knowledge Base:** Documents and wiki pages
- 🔍 **Search:** Full-text search across entities
- ⏱️ **Time Tracking:** Track time spent on tasks
- 🤖 **AI Assistant:** AI-powered features (requires OpenAI API key)

## Next Steps

1. Create a superuser: `python manage.py createsuperuser`
2. Log in to Django admin at http://127.0.0.1:8000/admin
3. Create some test data through the admin or API
4. Access the frontend at http://localhost:5173
5. Check the API documentation at http://127.0.0.1:8000/api/

## Support

For issues and questions:
- Check the full documentation in `docs/CONSOLIDATED.md`
- Review the CI/CD logs in GitHub Actions
- Check Django logs in `backend/error.log`

Happy coding! 🚀
