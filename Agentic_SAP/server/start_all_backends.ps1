# SAP Team Python Backend Startup Script for Windows PowerShell
# This script starts all Python backend services together

Write-Host "Starting SAP Team Python Backend Services..." -ForegroundColor Green

# Change to the chatbot directory
Set-Location "$PSScriptRoot\chatbot"

Write-Host "Current directory: $(Get-Location)" -ForegroundColor Cyan
Write-Host "Available Python files:" -ForegroundColor Cyan
Get-ChildItem *.py | Format-Table Name, Length -AutoSize

# Verify agentic AI components are present
Write-Host "Verifying Agentic AI Components:" -ForegroundColor Cyan
$agenticFiles = @("skills_analysis_agent.py", "goals_analysis_agent.py", "feedback_analysis_agent.py", "agent_orchestrator.py")
foreach ($file in $agenticFiles) {
    if (Test-Path $file) {
        Write-Host "   ✅ $file found" -ForegroundColor Green
    } else {
        Write-Host "   ❌ $file MISSING" -ForegroundColor Red
    }
}

# Run agentic health check
Write-Host ""
Write-Host "Running Agentic AI Health Check..." -ForegroundColor Cyan
try {
    & $pythonExe "agentic_health_check.py"
    Write-Host "✅ Agentic AI components verified!" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Agentic AI health check failed - continuing anyway..." -ForegroundColor Yellow
}

# Activate virtual environment
Write-Host "Activating virtual environment..." -ForegroundColor Cyan

# Check multiple possible venv locations
$venvPaths = @(
    ".\venv\Scripts\Activate.ps1",           # Server directory venv
    ".\chatbot\venv\Scripts\Activate.ps1",   # Chatbot directory venv
    ".\.venv\Scripts\Activate.ps1"           # Hidden .venv directory
)

$venvFound = $false
foreach ($venvPath in $venvPaths) {
    if (Test-Path $venvPath) {
        Write-Host "Found virtual environment at: $venvPath" -ForegroundColor Green
        & $venvPath
        Write-Host "Virtual environment activated!" -ForegroundColor Green
        $venvFound = $true
        break
    }
}

if (-not $venvFound) {
    Write-Host "Virtual environment not found in standard locations:" -ForegroundColor Yellow
    foreach ($path in $venvPaths) {
        Write-Host "   ❌ $path" -ForegroundColor Red
    }
    Write-Host "Attempting to use system Python..." -ForegroundColor Yellow
}

# Kill any existing Python processes (optional cleanup)
Write-Host "Cleaning up existing processes..." -ForegroundColor Yellow
Get-Process python* -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

Start-Sleep 2

# Get Python executable from virtual environment or system
$pythonExePaths = @(
    ".\venv\Scripts\python.exe",           # Server directory venv
    ".\chatbot\venv\Scripts\python.exe",   # Chatbot directory venv  
    ".\.venv\Scripts\python.exe",          # Hidden .venv directory
    "python"                               # System Python fallback
)

$pythonExe = $null
foreach ($pythonPath in $pythonExePaths) {
    if (Test-Path $pythonPath -ErrorAction SilentlyContinue) {
        $pythonExe = $pythonPath
        Write-Host "Using Python executable: $pythonExe" -ForegroundColor Green
        break
    } elseif ($pythonPath -eq "python") {
        # Test if system python is available
        try {
            & $pythonPath --version 2>$null
            $pythonExe = $pythonPath
            Write-Host "Using system Python: $pythonExe" -ForegroundColor Yellow
            break
        } catch {
            # Continue to next option
        }
    }
}

if (-not $pythonExe) {
    Write-Host "❌ No Python executable found!" -ForegroundColor Red
    exit 1
}

# Start all Python backends as background processes
Write-Host ""
Write-Host "Starting Mentor Mode (Port 5001)..." -ForegroundColor Magenta
$mentorProcess = Start-Process $pythonExe -ArgumentList "mentor_mode.py" -PassThru -WindowStyle Minimized

Write-Host "Starting Practice Mode (Port 5002)..." -ForegroundColor Magenta  
$practiceProcess = Start-Process $pythonExe -ArgumentList "practice_mode.py" -PassThru -WindowStyle Minimized

Write-Host "Starting Onboarding Mode (Port 5003)..." -ForegroundColor Magenta
$onboardingProcess = Start-Process $pythonExe -ArgumentList "onboarding_mode.py" -PassThru -WindowStyle Minimized

Write-Host "Starting AI Skill Gap (Port 5004) - AGENTIC AI ENABLED..." -ForegroundColor Magenta
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
Write-Host "   AI Skill Gap API: http://localhost:5004 (🤖 AGENTIC AI)" -ForegroundColor White
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
