#!/bin/bash

# SAP Team Backend Stop Script
# This script stops all the backend services

echo "🛑 Stopping SAP Team Backend Services..."

echo "🧹 Stopping all Python backend processes..."
pkill -f "mentor_mode.py" 2>/dev/null && echo "   ✅ Stopped Mentor Mode" || echo "   ⚠️ Mentor Mode not running"
pkill -f "practice_mode.py" 2>/dev/null && echo "   ✅ Stopped Practice Mode" || echo "   ⚠️ Practice Mode not running"  
pkill -f "onboarding_mode.py" 2>/dev/null && echo "   ✅ Stopped Onboarding Mode" || echo "   ⚠️ Onboarding Mode not running"
pkill -f "ai_skill_gap.py" 2>/dev/null && echo "   ✅ Stopped AI Skill Gap" || echo "   ⚠️ AI Skill Gap not running"
pkill -f "course_search.py" 2>/dev/null && echo "   ✅ Stopped Course Search" || echo "   ⚠️ Course Search not running"


echo "🧹 Stopping Node.js server..."
pkill -f "node.*index.js" 2>/dev/null && echo "   ✅ Stopped Main Server" || echo "   ⚠️ Main Server not running"

echo ""
echo "✅ All services stopped!"
echo ""
echo "🚀 To start all services again, run: ./start_all_backends.sh"
