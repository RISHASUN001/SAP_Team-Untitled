#!/bin/bash

# SAP Team Backend Stop Script
# This script stops all the backend services

echo "🛑 Stopping SAP Team Backend Services..."

echo "🧹 Stopping all Python backend processes..."
pkill -f "mentor_mode.py" 2>/dev/null && echo "   ✅ Stopped Mentor Mode" || echo "   ⚠️ Mentor Mode not running"
pkill -f "practice_mode.py" 2>/dev/null && echo "   ✅ Stopped Practice Mode" || echo "   ⚠️ Practice Mode not running"  
pkill -f "onboarding_mode.py" 2>/dev/null && echo "   ✅ Stopped Onboarding Mode" || echo "   ⚠️ Onboarding Mode not running"
pkill -f "agent_orchestrator.py" 2>/dev/null && echo "   ✅ Stopped Agent Orchestrator" || echo "   ⚠️ Agent Orchestrator not running"
pkill -f "course_search.py" 2>/dev/null && echo "   ✅ Stopped Course Search" || echo "   ⚠️ Course Search not running"
pkill -f "timeline_api.py" 2>/dev/null && echo "   ✅ Stopped Timeline API" || echo "   ⚠️ Timeline API not running"

echo "🧹 Stopping Node.js servers..."
pkill -f "node.*index.js" 2>/dev/null && echo "   ✅ Stopped Calendar Server" || echo "   ⚠️ Calendar Server not running"

echo ""
echo "✅ All services stopped!"
echo ""
echo "🚀 To start all services again, run: ./start_all_backends.sh"
