# Local CI/CD Test Script
# This script simulates the GitHub Actions CI pipeline locally

Write-Host "🧪 Running Local CI/CD Tests..." -ForegroundColor Cyan
Write-Host ""

$ErrorCount = 0

# Backend Tests
Write-Host "=== BACKEND CI ===" -ForegroundColor Yellow
Write-Host ""

if (-Not (Test-Path "backend\venv")) {
    Write-Host "❌ Backend venv not found. Run setup first!" -ForegroundColor Red
    exit 1
}

Write-Host "📦 Activating virtual environment..." -ForegroundColor Cyan
cd backend
.\venv\Scripts\Activate.ps1

Write-Host "✅ Running Django System Check..." -ForegroundColor Green
python manage.py check
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Django system check failed!" -ForegroundColor Red
    $ErrorCount++
} else {
    Write-Host "✅ Django system check passed!" -ForegroundColor Green
}

Write-Host ""
Write-Host "✅ Checking migrations..." -ForegroundColor Green
python manage.py makemigrations --check --dry-run
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Unapplied migrations detected (this is okay for new changes)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "✅ Running Django Tests..." -ForegroundColor Green
python manage.py test --no-input
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Backend tests failed!" -ForegroundColor Red
    $ErrorCount++
} else {
    Write-Host "✅ Backend tests passed!" -ForegroundColor Green
}

cd ..

Write-Host ""
Write-Host "=== FRONTEND CI ===" -ForegroundColor Yellow
Write-Host ""

if (-Not (Test-Path "frontend\node_modules")) {
    Write-Host "❌ Frontend dependencies not found. Run npm install first!" -ForegroundColor Red
    exit 1
}

cd frontend

Write-Host "✅ Running Frontend Lint..." -ForegroundColor Green
npm run lint
$lintExit = $LASTEXITCODE
if ($lintExit -ne 0) {
    Write-Host "⚠️  Linting issues found (non-blocking in CI)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "✅ Building Frontend..." -ForegroundColor Green
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Frontend build failed!" -ForegroundColor Red
    $ErrorCount++
} else {
    Write-Host "✅ Frontend build passed!" -ForegroundColor Green
}

cd ..

Write-Host ""
Write-Host "=== CI SUMMARY ===" -ForegroundColor Yellow
Write-Host ""

if ($ErrorCount -eq 0) {
    Write-Host "✅ All CI checks passed! Ready to push. 🚀" -ForegroundColor Green
} else {
    Write-Host "❌ $ErrorCount CI check(s) failed. Please fix before pushing." -ForegroundColor Red
    exit 1
}
