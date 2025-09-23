#!/bin/bash

# SAP Team Python Backend Startup Script
# This script starts only the Python backend services
# Use 'npm run dev' separately to start frontend + main backend

echo "🚀 Starting SAP Team Python Backend Services..."

# Kill any existing processes first
echo "🧹 Cleaning up existing processes..."
pkill -f "mentor_mode.py" 2>/dev/null || true
pkill -f "practice_mode.py" 2>/dev/null || true  
pkill -f "onboarding_mode.py" 2>/dev/null || true
pkill -f "ai_skill_gap.py" 2>/dev/null || true
pkill -f "course_search.py" 2>/dev/null || true
pkill -f "timeline_api.py" 2>/dev/null || true
pkill -f "node.*index.js" 2>/dev/null || true

sleep 2

# Change to the chatbot directory
cd "$(dirname "$0")/chatbot"

echo "📂 Current directory: $(pwd)"
echo "📁 Available files:"
ls -la *.py

# Verify agentic AI components are present
echo ""
echo "🤖 Verifying Agentic AI Components:"
agentic_files=("skills_analysis_agent.py" "goals_analysis_agent.py" "feedback_analysis_agent.py" "agent_orchestrator.py")
for file in "${agentic_files[@]}"; do
    if [ -f "$file" ]; then
        echo "   ✅ $file found"
    else
        echo "   ❌ $file MISSING"
    fi
done

# Run agentic health check
echo ""
echo "🔍 Running Agentic AI Health Check..."
if python3 agentic_health_check.py; then
    echo "✅ Agentic AI components verified!"
else
    echo "⚠️ Agentic AI health check failed - continuing anyway..."
fi

# Step 1: Start mentor_mode.py first (initializes ChromaDB)
echo ""
echo "1️⃣ Starting Mentor Mode (Port 5001) - Initializes ChromaDB..."
python3 mentor_mode.py &
MENTOR_PID=$!
echo "🎯 Mentor Mode started with PID: $MENTOR_PID"

# Wait a bit for mentor mode to initialize ChromaDB
sleep 5

# Step 2: Start practice_mode.py (uses existing ChromaDB)
echo ""
echo "2️⃣ Starting Practice Mode (Port 5002)..."
python3 practice_mode.py &
PRACTICE_PID=$!
echo "🎮 Practice Mode started with PID: $PRACTICE_PID"

# Step 3: Start onboarding_mode.py (uses existing ChromaDB)
echo ""
echo "3️⃣ Starting Onboarding Mode (Port 5003)..."
python3 onboarding_mode.py &
ONBOARDING_PID=$!
echo "📚 Onboarding Mode started with PID: $ONBOARDING_PID"

# Step 4: Start ai_skill_gap.py (AGENTIC AI enabled)
echo ""
echo "4️⃣ Starting AI Skill Gap (Port 5004) - 🤖 AGENTIC AI ENABLED..."
python3 ai_skill_gap.py &
SKILL_PID=$!
echo "🤖 AI Skill Gap started with PID: $SKILL_PID"

# Step 5: Start course_search.py (new backend service)
echo ""
echo "5️⃣ Starting Course Search (Port 5005)..."
python3 course_search.py &
COURSE_PID=$!
echo "🔍 Course Search started with PID: $COURSE_PID"

# Step 6: Start calendar_api.py (new backend service)
echo ""
echo "6️⃣ Starting Timeline API (Port 5006)..."
 python3 ../timeline_api.py &
CALENDAR_PID=$!
echo "📅 Timeline API started with PID: $CALENDAR_PID"

# Step 7: Start Node.js Calendar Server (Port 3001)
echo ""
echo "7️⃣ Starting Node.js Calendar Server (Port 3001)..."
cd ..
node index.js &
NODE_CALENDAR_PID=$!
echo "📅 Node.js Calendar Server started with PID: $NODE_CALENDAR_PID"
cd chatbot

# Wait a bit for Python backends to fully start
sleep 3

echo ""
echo "✅ All backend services started successfully!"
echo ""
echo "🔗 Backend APIs:"
echo "   • Mentor Mode API: http://localhost:5001"
echo "   • Practice Mode API: http://localhost:5002" 
echo "   • Onboarding Mode API: http://localhost:5003"
echo "   • AI Skill Gap API: http://localhost:5004 (🤖 AGENTIC AI)"
echo "   • Course Search API: http://localhost:5005"
echo "   • Timeline API: http://localhost:5006"
echo "   • Calendar Server API: http://localhost:3001 (📅 PERSISTENT STORAGE)"
echo ""
echo "📊 Process IDs:"
echo "   • Mentor Mode: $MENTOR_PID"
echo "   • Practice Mode: $PRACTICE_PID"
echo "   • Onboarding Mode: $ONBOARDING_PID"
echo "   • AI Skill Gap: $SKILL_PID"
echo "   • Course Search: $COURSE_PID"
echo "   • Timeline API: $CALENDAR_PID"
echo "   • Calendar Server: $NODE_CALENDAR_PID"
echo ""
echo "💡 To start the frontend:"
echo "   Run 'npm run dev' in the main Agentic_SAP directory"
echo "   This will start frontend on port 5173"
echo ""
echo "🛑 To stop all backends, run: ./stop_all_backends.sh"
echo ""

# Keep the script running and show logs
echo "📝 Showing Python backend logs (Ctrl+C to stop)..."
echo "======================================"

# Wait for all background processes
wait
