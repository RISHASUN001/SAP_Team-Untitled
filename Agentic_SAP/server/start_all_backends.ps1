# SAP Team Python Backend Startup Script for Windows PowerShell
# This script starts all Python backend services together

Write-Host "Starting SAP Team Python Backend Services..." -ForegroundColor Green

# Change to the chatbot directory
Set-Location "$PSScriptRoot\chatbot"

Write-Host "Current directory: $(Get-Location)" -ForegroundColor Cyan
Write-Host "Available Python files:" -ForegroundColor Cyan
Get-ChildItem *.py | Format-Table Name, Length -AutoSize

# Kill any existing Python processes (optional cleanup)
Write-Host "Cleaning up existing processes..." -ForegroundColor Yellow
Get-Process python* -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

Start-Sleep 2

# Start all Python backends as background processes
Write-Host ""
Write-Host "Starting Mentor Mode (Port 5001)..." -ForegroundColor Magenta
$mentorProcess = Start-Process python -ArgumentList "mentor_mode.py" -PassThru -WindowStyle Minimized

Write-Host "Starting Practice Mode (Port 5002)..." -ForegroundColor Magenta  
$practiceProcess = Start-Process python -ArgumentList "practice_mode.py" -PassThru -WindowStyle Minimized

Write-Host "Starting Onboarding Mode (Port 5003)..." -ForegroundColor Magenta
$onboardingProcess = Start-Process python -ArgumentList "onboarding_mode.py" -PassThru -WindowStyle Minimized

Write-Host "Starting AI Skill Gap (Port 5004)..." -ForegroundColor Magenta
$skillProcess = Start-Process python -ArgumentList "ai_skill_gap.py" -PassThru -WindowStyle Minimized

Write-Host "Starting Course Search (Port 5005)..." -ForegroundColor Magenta
$courseProcess = Start-Process python -ArgumentList "course_search.py" -PassThru -WindowStyle Minimized

# Wait a moment for services to start
Start-Sleep 5

Write-Host ""
Write-Host "Python backends started successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Backend APIs:" -ForegroundColor Cyan
Write-Host "   Mentor Mode API: http://localhost:5001" -ForegroundColor White
Write-Host "   Practice Mode API: http://localhost:5002" -ForegroundColor White
Write-Host "   Onboarding Mode API: http://localhost:5003" -ForegroundColor White
Write-Host "   AI Skill Gap API: http://localhost:5004" -ForegroundColor White
Write-Host "   Course Search API: http://localhost:5005" -ForegroundColor White
Write-Host ""
Write-Host "Process IDs:" -ForegroundColor Cyan
Write-Host "   Mentor Mode: $($mentorProcess.Id)" -ForegroundColor White
Write-Host "   Practice Mode: $($practiceProcess.Id)" -ForegroundColor White
Write-Host "   Onboarding Mode: $($onboardingProcess.Id)" -ForegroundColor White
Write-Host "   AI Skill Gap: $($skillProcess.Id)" -ForegroundColor White
Write-Host "   Course Search: $($courseProcess.Id)" -ForegroundColor White
Write-Host ""
Write-Host "To start the full application:" -ForegroundColor Yellow
Write-Host "   1. Run 'npm run dev' in the main Agentic_SAP directory" -ForegroundColor White
Write-Host "   2. This will start frontend on port 5173 and main backend on port 3001" -ForegroundColor White
Write-Host ""
Write-Host "To stop Python backends, run: .\stop_all_backends.ps1" -ForegroundColor Red
Write-Host ""
Write-Host "Press Ctrl+C to exit this script (backends will continue running)" -ForegroundColor Yellow

# Keep script running to show it's active
try {
    while ($true) {
        Start-Sleep 1
    }
} catch {
    Write-Host "Script terminated" -ForegroundColor Yellow
}
