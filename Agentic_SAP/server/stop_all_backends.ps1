# SAP Team Backend Stop Script for Windows PowerShell
# This script stops all backend services (Python and Node.js)

Write-Host "🛑 Stopping SAP Team Backend Services..." -ForegroundColor Red

# Stop Node.js server first
Write-Host "🧹 Stopping Node.js server..." -ForegroundColor Yellow
Get-Process node -ErrorAction SilentlyContinue | Where-Object { 
    $_.CommandLine -like "*index.js*" 
} | ForEach-Object {
    Write-Host "   • Stopping Node.js server (PID: $($_.Id))" -ForegroundColor White
    Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
}

# Stop all Python processes related to our backends
Write-Host "🧹 Stopping Python backend processes..." -ForegroundColor Yellow

$processNames = @("mentor_mode", "practice_mode", "onboarding_mode", "ai_skill_gap", "course_search")

foreach ($processName in $processNames) {
    $processes = Get-Process python* -ErrorAction SilentlyContinue | Where-Object { 
        $_.CommandLine -like "*$processName.py*" 
    }
    
    if ($processes) {
        foreach ($process in $processes) {
            Write-Host "   • Stopping $processName (PID: $($process.Id))" -ForegroundColor White
            Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
        }
    } else {
        Write-Host "   • No $processName process found" -ForegroundColor Gray
    }
}

# Alternative: Kill all python processes (more aggressive)
Write-Host ""
Write-Host "🔄 Alternative: Stopping ALL Python processes..." -ForegroundColor Yellow
Get-Process python* -ErrorAction SilentlyContinue | ForEach-Object {
    Write-Host "   • Stopping Python process (PID: $($_.Id))" -ForegroundColor White
    Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
}

Start-Sleep 2

Write-Host ""
Write-Host "✅ All Python backends stopped!" -ForegroundColor Green
