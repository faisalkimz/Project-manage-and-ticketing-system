# Omni-PMS Project Startup Script
Write-Host "🚀 Starting Omni-PMS Project..." -ForegroundColor Cyan
Write-Host ""

# Check if backend venv exists
if (-Not (Test-Path "backend\venv")) {
    Write-Host "❌ Backend virtual environment not found!" -ForegroundColor Red
    Write-Host "   Please run: cd backend && python -m venv venv && .\venv\Scripts\Activate.ps1 && pip install -r requirements.txt" -ForegroundColor Yellow
    exit 1
}

# Check if node_modules exists
if (-Not (Test-Path "frontend\node_modules")) {
    Write-Host "❌ Frontend dependencies not found!" -ForegroundColor Red
    Write-Host "   Please run: cd frontend && npm install" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ All dependencies found" -ForegroundColor Green
Write-Host ""

# Start Backend in new window
Write-Host "🔧 Starting Django Backend on http://127.0.0.1:8000" -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\backend'; .\venv\Scripts\Activate.ps1; python manage.py runserver"

# Wait a bit before starting frontend
Start-Sleep -Seconds 2

# Start Frontend in new window
Write-Host "⚛️  Starting React Frontend on http://localhost:5173" -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\frontend'; npm run dev"

Write-Host ""
Write-Host "✨ Both servers are starting!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 URLs:" -ForegroundColor Yellow
Write-Host "   Backend:  http://127.0.0.1:8000" -ForegroundColor White
Write-Host "   Frontend: http://localhost:5173" -ForegroundColor White
Write-Host "   Admin:    http://127.0.0.1:8000/admin" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  Close the new terminal windows to stop the servers" -ForegroundColor Yellow
