# SAP Team Setup Script for Windows PowerShell
# This script sets up the development environment

Write-Host "SAP Team Development Environment Setup" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Green
Write-Host ""

# Check if Python is installed
Write-Host "Checking Python installation..." -ForegroundColor Cyan
try {
    $pythonVersion = python --version 2>$null
    if ($pythonVersion) {
        Write-Host "✓ Python found: $pythonVersion" -ForegroundColor Green
    } else {
        throw "Python not found"
    }
} catch {
    Write-Host "✗ Python is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Python 3.8+ from https://python.org" -ForegroundColor Yellow
    exit 1
}

# Check if Node.js is installed
Write-Host "Checking Node.js installation..." -ForegroundColor Cyan
try {
    $nodeVersion = node --version 2>$null
    if ($nodeVersion) {
        Write-Host "✓ Node.js found: $nodeVersion" -ForegroundColor Green
    } else {
        throw "Node.js not found"
    }
} catch {
    Write-Host "✗ Node.js is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "Setting up Python virtual environment..." -ForegroundColor Cyan

# Navigate to chatbot directory
Set-Location "$PSScriptRoot\chatbot"

# Create virtual environment if it doesn't exist
if (-not (Test-Path ".\venv")) {
    Write-Host "Creating virtual environment..." -ForegroundColor Yellow
    python -m venv venv
    Write-Host "✓ Virtual environment created" -ForegroundColor Green
} else {
    Write-Host "✓ Virtual environment already exists" -ForegroundColor Green
}

# Activate virtual environment
Write-Host "Activating virtual environment..." -ForegroundColor Yellow
& ".\venv\Scripts\Activate.ps1"

# Install Python requirements
Write-Host "Installing Python packages..." -ForegroundColor Yellow
$requirements = @(
    "flask",
    "flask-cors", 
    "python-dotenv",
    "langchain",
    "langchain-community",
    "langchain-openai",
    "openai",
    "requests",
    "chromadb",
    "sentence-transformers",
    "langchain-huggingface"
)

foreach ($package in $requirements) {
    Write-Host "Installing $package..." -ForegroundColor Gray
    pip install $package --quiet
}

Write-Host "✓ Python packages installed" -ForegroundColor Green

# Navigate back to server directory
Set-Location ".."

# Install Node.js dependencies
Write-Host ""
Write-Host "Installing Node.js dependencies..." -ForegroundColor Cyan
npm install --silent

Write-Host "✓ Node.js dependencies installed" -ForegroundColor Green

Write-Host ""
Write-Host "Setup completed successfully! 🎉" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Configure your .env file with API keys" -ForegroundColor White
Write-Host "2. Run './start_all_backends.ps1' to start all backend services" -ForegroundColor White
Write-Host "3. Run 'npm run dev' in the main directory to start the React frontend" -ForegroundColor White
Write-Host ""