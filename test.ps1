#!/usr/bin/env pwsh
# Omni-PMS Local CI/CD Verification Script

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "     Running Omni-PMS Local CI/CD Verification  " -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Backend Django Check
Write-Host "[1/3] Running Django System Check..." -ForegroundColor Yellow
$backendCheck = & .\backend\venv\Scripts\python.exe backend\manage.py check
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Django Check Failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Django Check Passed" -ForegroundColor Green

# 2. Backend Unit Tests
Write-Host "[2/3] Running Django Test Suite..." -ForegroundColor Yellow
$backendTests = & .\backend\venv\Scripts\python.exe backend\manage.py test
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Django Tests Failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Django Tests Passed" -ForegroundColor Green

# 3. Frontend Build & Typecheck
Write-Host "[3/3] Running Frontend Production Build (Vite)..." -ForegroundColor Yellow
$frontendBuild = & npm.cmd --prefix frontend run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Frontend Build Failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Frontend Build Passed" -ForegroundColor Green

Write-Host ""
Write-Host "================================================" -ForegroundColor Green
Write-Host "🎉 All Local CI/CD Checks Passed Successfully!  " -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green

