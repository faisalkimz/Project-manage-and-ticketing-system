# Project Management & Ticketing System - Startup Script
# Run this to start both backend and frontend

Write-Host "🚀 Starting Omni-PMS Backend & Frontend..." -ForegroundColor Cyan

# Start Backend in new window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\backend'; .\venv\Scripts\Activate.ps1; python manage.py runserver"

# Wait a bit for backend to start
Start-Sleep -Seconds 3

# Start Frontend in new window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\frontend'; npm run dev"

Write-Host "✅ Servers starting in separate windows..." -ForegroundColor Green
Write-Host "Backend: http://localhost:8000" -ForegroundColor Yellow
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Yellow
Write-Host "" 
Write-Host "Login credentials:" -ForegroundColor Magenta
Write-Host "  Admin: admin / admin123" -ForegroundColor White
Write-Host "  Demo: sarah.j / pass123" -ForegroundColor White
