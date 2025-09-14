# SAP Team Python Backend Startup Script for Windows PowerShell
# This script starts all Python backend services together

Write-Host "Starting SAP Team Python Backend Services..." -ForegroundColor Green

# Change to the chatbot directory
Set-Location "$PSScriptRoot\chatbot"

Write-Host "Current directory: $(Get-Location)" -ForegroundColor Cyan
Write-Host "Available Python files:" -ForegroundColor Cyan
Get-ChildItem *.py | Format-Table Name, Length -AutoSize

# Activate virtual environment
Write-Host "Activating virtual environment..." -ForegroundColor Cyan
if (Test-Path ".\venv\Scripts\Activate.ps1") {
    & ".\venv\Scripts\Activate.ps1"
    Write-Host "Virtual environment activated!" -ForegroundColor Green
} else {
    Write-Host "Virtual environment not found. Please run setup first." -ForegroundColor Red
    exit 1
}

# Kill any existing Python processes (optional cleanup)
Write-Host "Cleaning up existing processes..." -ForegroundColor Yellow
Get-Process python* -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

Start-Sleep 2

# Get Python executable from virtual environment
$pythonExe = ".\venv\Scripts\python.exe"

# Start all Python backends as background processes
Write-Host ""
Write-Host "Starting Mentor Mode (Port 5001)..." -ForegroundColor Magenta
$mentorProcess = Start-Process $pythonExe -ArgumentList "mentor_mode.py" -PassThru -WindowStyle Minimized

Write-Host "Starting Practice Mode (Port 5002)..." -ForegroundColor Magenta  
$practiceProcess = Start-Process $pythonExe -ArgumentList "practice_mode.py" -PassThru -WindowStyle Minimized

Write-Host "Starting Onboarding Mode (Port 5003)..." -ForegroundColor Magenta
$onboardingProcess = Start-Process $pythonExe -ArgumentList "onboarding_mode.py" -PassThru -WindowStyle Minimized

Write-Host "Starting AI Skill Gap (Port 5004)..." -ForegroundColor Magenta
$skillProcess = Start-Process $pythonExe -ArgumentList "ai_skill_gap.py" -PassThru -WindowStyle Minimized

Write-Host "Starting Course Search (Port 5005)..." -ForegroundColor Magenta
$courseProcess = Start-Process $pythonExe -ArgumentList "course_search.py" -PassThru -WindowStyle Minimized

# Change back to server directory for timeline API
Set-Location "$PSScriptRoot"

Write-Host "Starting Timeline API (Port 5002)..." -ForegroundColor Magenta
$timelineProcess = Start-Process "python" -ArgumentList "timeline_api.py" -PassThru -WindowStyle Minimized

# Wait a moment for services to start
Start-Sleep 5

# Start Node.js server
Write-Host ""
Write-Host "Starting Node.js API Server (Port 3001)..." -ForegroundColor Magenta
Set-Location "$PSScriptRoot"
$nodeProcess = Start-Process node -ArgumentList "index.js" -PassThru -WindowStyle Minimized

# Wait a moment for Node.js server to start
Start-Sleep 3

Write-Host ""
Write-Host "All backend services started successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Backend APIs:" -ForegroundColor Cyan
Write-Host "   Node.js API Server: http://localhost:3001" -ForegroundColor White
Write-Host "   Mentor Mode API: http://localhost:5001" -ForegroundColor White
Write-Host "   Practice Mode API: http://localhost:5002" -ForegroundColor White
Write-Host "   Onboarding Mode API: http://localhost:5003" -ForegroundColor White
Write-Host "   AI Skill Gap API: http://localhost:5004" -ForegroundColor White
Write-Host "   Course Search API: http://localhost:5005" -ForegroundColor White
Write-Host ""
Write-Host "Process IDs:" -ForegroundColor Cyan
Write-Host "   Node.js Server: $($nodeProcess.Id)" -ForegroundColor White
Write-Host "   Mentor Mode: $($mentorProcess.Id)" -ForegroundColor White
Write-Host "   Practice Mode: $($practiceProcess.Id)" -ForegroundColor White
Write-Host "   Onboarding Mode: $($onboardingProcess.Id)" -ForegroundColor White
Write-Host "   AI Skill Gap: $($skillProcess.Id)" -ForegroundColor White
Write-Host "   Course Search: $($courseProcess.Id)" -ForegroundColor White
Write-Host ""
Write-Host "To start the frontend:" -ForegroundColor Yellow
Write-Host "   1. Run 'npm run dev' in the main Agentic_SAP directory" -ForegroundColor White
Write-Host "   2. This will start the React frontend on port 5173" -ForegroundColor White
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
