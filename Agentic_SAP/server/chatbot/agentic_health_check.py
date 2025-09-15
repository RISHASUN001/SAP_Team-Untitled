#!/usr/bin/env python3
"""
Agentic AI System Health Check
Verifies all agent components can be imported and initialized
"""

import sys
import os

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def test_agentic_imports():
    """Test if all agentic components can be imported"""
    
    print("🔍 Testing Agentic AI Component Imports...")
    print("=" * 50)
    
    components = [
        ("Skills Analysis Agent", "skills_analysis_agent", "SkillsAnalysisAgent"),
        ("Goals Analysis Agent", "goals_analysis_agent", "GoalsAnalysisAgent"), 
        ("Feedback Analysis Agent", "feedback_analysis_agent", "FeedbackAnalysisAgent"),
        ("Agent Orchestrator", "agent_orchestrator", "AgentOrchestrator")
    ]
    
    success_count = 0
    
    for name, module_name, class_name in components:
        try:
            module = __import__(module_name)
            agent_class = getattr(module, class_name)
            
            # Try to instantiate
            agent = agent_class()
            print(f"✅ {name}: Import and instantiation successful")
            success_count += 1
            
        except ImportError as e:
            print(f"❌ {name}: Import failed - {e}")
        except AttributeError as e:
            print(f"❌ {name}: Class not found - {e}")
        except Exception as e:
            print(f"⚠️ {name}: Instantiation failed - {e}")
    
    print("=" * 50)
    print(f"📊 Results: {success_count}/{len(components)} components working")
    
    if success_count == len(components):
        print("🎉 All agentic AI components are ready!")
        return True
    else:
        print("⚠️ Some agentic components have issues")
        return False

def test_environment_variables():
    """Test if required environment variables are set"""
    
    print("\n🔍 Testing Environment Variables...")
    print("=" * 50)
    
    required_vars = [
        "OPENROUTER_API_KEY",
        "OPENROUTER_API_BASE", 
        "OPENROUTER_MODEL"
    ]
    
    env_success = True
    
    for var in required_vars:
        value = os.getenv(var)
        if value:
            print(f"✅ {var}: Set (length: {len(value)} chars)")
        else:
            print(f"❌ {var}: Not set")
            env_success = False
    
    print("=" * 50)
    if env_success:
        print("🎉 All environment variables are configured!")
    else:
        print("⚠️ Missing environment variables - check .env file")
    
    return env_success

if __name__ == "__main__":
    print("🤖 SAP Agentic AI System Health Check")
    print("=" * 60)
    
    # Test imports
    import_success = test_agentic_imports()
    
    # Test environment
    env_success = test_environment_variables()
    
    print("\n" + "=" * 60)
    if import_success and env_success:
        print("🚀 AGENTIC AI SYSTEM READY!")
        sys.exit(0)
    else:
        print("❌ AGENTIC AI SYSTEM HAS ISSUES")
        sys.exit(1)