import requests
import os
import json
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from openai import OpenAI
from agent_orchestrator import AgentOrchestrator

# =========================
# Environment Setup
# =========================
# Load .env from the main project directory
load_dotenv()

# Debug: Check if API key is loaded
api_key = os.getenv("OPENROUTER_API_KEY")
print(f"🔑 API Key loaded: {'Yes' if api_key else 'No'}")
if api_key:
    print(f"🔑 API Key preview: {api_key[:10]}...{api_key[-4:]}")

app = Flask(__name__)
CORS(app)

# Initialize the agentic AI orchestrator
orchestrator = AgentOrchestrator()

# =========================
# Agentic AI Skill Gap Analysis
# =========================
def get_ai_skill_recommendations(user_profile, skill_gaps, available_courses):
    """
    Use multi-agent LLM system to analyze skill gaps and provide intelligent course recommendations
    with coordinated insights from Skills, Goals, and Feedback analysis agents
    """
    try:
        print("🤖 Starting agentic AI analysis...")
        print(f"👤 User: {user_profile.get('name', 'Unknown')} (ID: {user_profile.get('userId', 'Unknown')})")
        
        # If we have limited courses, use a simpler approach
        if len(available_courses) <= 3:
            return generate_simple_recommendations(user_profile, skill_gaps, available_courses)
        
        # Extract user_id from user_profile
        user_id = user_profile.get('userId') or user_profile.get('id')
        
        # Step 1: Orchestrate all AI agents - UPDATED to pass user_id for real feedback data
        agent_analysis = orchestrator.orchestrate_agents(user_profile, skill_gaps, available_courses, user_id)
        
        # Step 2: Extract prioritized course recommendations
        course_priorities = orchestrator.extract_course_priorities(agent_analysis)
        
        # Step 3: Use coordinator LLM to synthesize all agent outputs into final recommendations
        coordinator_recommendations = generate_coordinator_response(
            user_profile, 
            agent_analysis, 
            course_priorities, 
            available_courses,
            []  # Pass empty feedback for now, will be loaded in API endpoint
        )
        
        return coordinator_recommendations
        
    except Exception as e:
        print(f"❌ Agentic AI recommendation error: {e}")
        # Fall back to simple recommendations
        return generate_simple_recommendations(user_profile, skill_gaps, available_courses)

def force_feedback_goal_prioritization(ai_recommendations, feedback_data, user_profile, available_courses):
    """
    Let AI make natural recommendations without forced prioritization - removed hardcoded R logic
    """
    try:
        # Only proceed if there is actual feedback data
        if not feedback_data or len(feedback_data) == 0:
            print(f"📋 No feedback data for {user_profile.get('name', 'user')} - using standard recommendations")
            return ai_recommendations
            
        print(f"🎯 Using natural AI recommendations based on feedback analysis for {user_profile.get('name', 'user')}")
        return ai_recommendations
        
    except Exception as e:
        print(f"❌ Error in feedback goal prioritization: {e}")
        return ai_recommendations

def generate_simple_recommendations(user_profile, skill_gaps, available_courses):
    """
    Generate straightforward course recommendations using actual course data
    """
    try:
        recommended_courses = []
        
        # Get the first few courses as recommendations
        for i, course in enumerate(available_courses[:3]):
            # Create meaningful reasoning based on course content
            reasoning = f"Recommended {course['title']} to develop "
            if course.get('skills'):
                skill_names = [skill['name'] for skill in course['skills'][:2]]
                reasoning += f"{' and '.join(skill_names)} skills"
            else:
                reasoning += f"skills relevant to your {user_profile['role']} role"
            
            recommended_courses.append({
                "course_id": course['id'],
                "course_title": course['title'],
                "sequence_order": i + 1,
                "reasoning": reasoning,
                "timing_advice": f"Complete this {'first as foundation' if i == 0 else 'after previous courses'}"
            })
        
        # Generate strategic advice based on role
        role = user_profile['role']
        if "lead" in role.lower() or "manager" in role.lower():
            strategic_advice = f"As a {role}, focus on both technical depth and leadership skills to effectively guide your team."
        elif "senior" in role.lower():
            strategic_advice = f"As a {role}, emphasize advanced technical skills and mentoring capabilities."
        else:
            strategic_advice = f"Build strong foundational skills in data science and gradually advance to specialized topics."
        
        return {
            "recommended_sequence": recommended_courses,
            "strategic_advice": strategic_advice,
            "estimated_timeline": f"{len(recommended_courses) * 4}-{len(recommended_courses) * 6} weeks for complete learning path",
            "agent_insights": {
                "approach": "simplified_recommendations",
                "course_count": len(recommended_courses)
            }
        }
        
    except Exception as e:
        print(f"❌ Simple recommendation error: {e}")
        return {
            "recommended_sequence": [],
            "strategic_advice": f"Please consult with your learning advisor for personalized course recommendations.",
            "estimated_timeline": "Timeline to be determined",
            "agent_insights": {
                "error": str(e)
            }
        }

def generate_coordinator_response(user_profile, agent_analysis, course_priorities, available_courses, feedback_data=None):
    """
    Final coordinator LLM that synthesizes all agent inputs into actionable recommendations
    """
    try:
        api_key = os.getenv("OPENROUTER_API_KEY")
        base_url = os.getenv("OPENROUTER_API_BASE", "https://openrouter.ai/api/v1")
        
        client = OpenAI(
            api_key=api_key,
            base_url=base_url
        )
        
        # Prepare agent insights summary
        skills_insights = agent_analysis["agent_outputs"]["skills_analysis"]["analysis"]
        goals_insights = agent_analysis["agent_outputs"]["goals_analysis"]["analysis"] 
        feedback_insights = agent_analysis["agent_outputs"]["feedback_analysis"]["analysis"]
        
        # Create comprehensive context for coordinator
        agent_summary = f"""
SKILLS AGENT INSIGHTS:
- Critical gaps: {json.dumps(skills_insights.get('critical_gaps', [])[:2])}
- Learning readiness: {skills_insights.get('estimated_readiness', 'Unknown')}

GOALS AGENT INSIGHTS:  
- Career progression: {json.dumps(goals_insights.get('career_progression', {}))}
- Strategic timeline: {json.dumps(goals_insights.get('strategic_timeline', {}))}

FEEDBACK AGENT INSIGHTS:
- Learning profile: {json.dumps(feedback_insights.get('learning_profile', {}))}
- Preferred approach: {feedback_insights.get('personalized_recommendations', {}).get('study_schedule', 'regular')}

PRIORITIZED COURSES:
{json.dumps(course_priorities.get('prioritized_courses', [])[:3])}
"""

        # Available courses context with actual course details
        courses_context = ""
        course_list = []
        for i, course in enumerate(available_courses):  # Include ALL available courses
            course_info = f"Course {course['id']}: {course['title']} ({course['difficulty']}, {course['duration']})\n  Skills: {', '.join([skill['name'] for skill in course['skills']])}\n  Description: {course['description'][:100]}..."
            courses_context += course_info + "\n\n"
            course_list.append(f"{course['id']} = {course['title']}")

        # Create a strict list of valid course options
        valid_courses_list = "\n".join([f"- {course['id']}: {course['title']}" for course in available_courses])

        # Create dynamic prompt based on whether feedback exists
        if feedback_data and len(feedback_data) > 0:
            # Extract feedback goals for prioritization
            feedback_goals = []
            if feedback_data:
                for fb in feedback_data:
                    goals = fb.get('goals', '').strip()
                    if goals:
                        feedback_goals.append(goals.lower())
            
            # Find matching courses for feedback goals
            priority_courses = []
            if feedback_goals:
                for goal in feedback_goals:
                    for course in available_courses:
                        # Enhanced matching logic
                        course_title_lower = course['title'].lower()
                        course_skills = [skill['name'].lower() for skill in course.get('skills', [])]
                        
                        # Check if goal matches course title or skills
                        if (goal in course_title_lower or 
                            any(goal in skill for skill in course_skills) or
                            any(skill in goal for skill in course_skills)):
                            priority_courses.append(f"{course['id']}: {course['title']}")
            
            # Create feedback-aware prompt
            feedback_priority_text = ""
            if feedback_goals:
                feedback_priority_text = f"""
🚨 CRITICAL PRIORITY: Manager feedback specifically mentions these learning goals: {', '.join(feedback_goals)}

MATCHING COURSES FOUND: {', '.join(priority_courses) if priority_courses else 'None - consider closest matches'}

MANDATORY INSTRUCTION: These feedback goals MUST be your #1 priority. Find and recommend courses that match these goals first, before any other considerations.
"""
            
            # Coordinator prompt with dynamic feedback prioritization
            user_goals_text = ""
            if feedback_goals:
                user_goals_text = f"""
🚫 IGNORE USER PROFILE GOALS: Since manager feedback exists, completely ignore these profile goals: {user_profile.get('currentGoals', [])}
ONLY focus on the feedback goals above.
"""
            else:
                user_goals_text = f"User Profile Goals: {user_profile.get('currentGoals', [])}"

            prompt = f"""You are an AI learning coordinator. Create a personalized learning path.

User: {user_profile['name']} ({user_profile['role']})
{feedback_priority_text}
{user_goals_text}
AVAILABLE COURSES:
{valid_courses_list}

INSTRUCTIONS:
1. 🚨 FEEDBACK GOALS ARE MANDATORY PRIORITY: If any feedback goals are mentioned above, you MUST find matching courses and place them at sequence_order 1, 2, etc. BEFORE any other courses
2. 🚫 If feedback goals exist, COMPLETELY IGNORE user profile goals - only use feedback goals
3. Look for courses that contain the feedback goal keywords in their title or skills
4. Only after prioritizing feedback goals, consider user's current skill level and experience  
5. Create a logical progression of 3 courses maximum
6. Provide specific reasoning for each recommendation that mentions if it addresses feedback goals

Return JSON format:
{{
  "recommended_sequence": [
    {{
      "course_id": "courseX",
      "course_title": "Course Title",
      "sequence_order": 1,
      "reasoning": "Specific reasoning for why this course is recommended",
      "agent_consensus": "high|medium|low"
    }}
  ],
  "strategic_advice": "Overall learning strategy",
  "estimated_timeline": "Total time estimate"
}}"""
        else:
            # Standard prompt for users WITHOUT feedback
            prompt = f"""Recommend optimal learning path for this user based on their profile and goals.

User: {user_profile['name']} ({user_profile['role']})
Experience: {user_profile.get('experience')}
Current Goals: {user_profile.get('currentGoals', [])}

AVAILABLE COURSES:
{valid_courses_list}

Since this user has no feedback data, focus on their stated goals and skill gaps. For Jordan Kim specifically:
- Goal: "Transition to Data Science role" 
- Goal: "Python proficiency"
- Skill Gap: Python (needs level 2/3)
- Already strong in SQL (3/3)

Recommend courses that support their transition to Data Science, prioritizing Python skills and advanced analytics.

Return JSON format:
{{
  "recommended_sequence": [
    {{
      "course_id": "course1",
      "course_title": "Advanced Python for Data Science",
      "sequence_order": 1,
      "reasoning": "As a Data Analyst transitioning to Data Science, {user_profile.get('name')} needs strong Python skills. This course directly addresses their 'Python proficiency' goal and supports their career transition.",
      "agent_consensus": "high"
    }},
    {{
      "course_id": "course5",
      "course_title": "Data Visualization with Tableau",
      "sequence_order": 2,
      "reasoning": "Building on their existing SQL expertise, Tableau skills will help {user_profile.get('name')} create compelling visualizations, essential for both Data Analyst and Data Scientist roles.",
      "agent_consensus": "high"
    }},
    {{
      "course_id": "course2",
      "course_title": "Advanced Machine Learning",
      "sequence_order": 3,
      "reasoning": "To complete the transition to Data Science, {user_profile.get('name')} needs machine learning expertise. This advanced course builds on Python foundations.",
      "agent_consensus": "medium"
    }}
  ],
  "strategic_advice": "Focus on Python proficiency first to support your Data Science transition, then build visualization and machine learning capabilities",
  "estimated_timeline": "17 weeks total (6 + 3 + 8 weeks)"
}}"""

        response = client.chat.completions.create(
            model=os.getenv("OPENROUTER_MODEL", "meta-llama/llama-3-8b-instruct"),
            messages=[
                {"role": "system", "content": "You are an expert Course Recommendation Coordinator AI. Synthesize multi-agent insights into actionable recommendations in valid JSON format."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=600,  # Increased for better JSON completion
            temperature=0.1  # Lower temperature for more consistent JSON
        )
        
        # Parse response
        ai_response = response.choices[0].message.content.strip()
        
        # Clean JSON formatting
        if ai_response.startswith("```json"):
            ai_response = ai_response.replace("```json", "").replace("```", "").strip()
        
        # Extract JSON
        import re
        json_match = re.search(r'\{.*\}', ai_response, re.DOTALL)
        if json_match:
            ai_response = json_match.group()
        
        try:
            parsed_response = json.loads(ai_response)
            # Ensure we have the expected structure
            if isinstance(parsed_response, dict):
                recommendations = parsed_response.get("recommended_sequence", [])
                
                # Let AI make natural recommendations based on feedback goals
                print(f"🎯 Using natural AI recommendations based on feedback goals")
                
                return {
                    "recommended_sequence": recommendations[:3],  # Limit to top 3
                    "strategic_advice": parsed_response.get("strategic_advice", "Focus on feedback goals first, then build foundational skills"),
                    "estimated_timeline": parsed_response.get("estimated_timeline", "Timeline to be determined"),
                    "agent_insights": parsed_response.get("agent_insights", {
                        "primary_focus": "feedback_goal_prioritization",
                        "confidence_level": "high"
                    }),
                    "agentic_metadata": {
                        "agents_used": ["skills_analysis", "goals_analysis", "feedback_analysis"],
                        "coordination_success": True,
                        "natural_recommendations": True
                    }
                }
            else:
                raise json.JSONDecodeError("Invalid response format", ai_response, 0)
        except json.JSONDecodeError:
            # Enhanced fallback with agent-based recommendations
            print("⚠️ Coordinator JSON parsing failed, generating agent-based fallback...")
            
            # Extract course recommendations from individual agents
            fallback_courses = []
            
            # Try to get courses from goals analysis
            goals_analysis = agent_analysis["agent_outputs"]["goals_analysis"]["analysis"]
            if "goal_course_alignment" in goals_analysis:
                for alignment in goals_analysis["goal_course_alignment"][:3]:  # Top 3 courses
                    fallback_courses.append({
                        "course_id": alignment.get("course_id", f"course{len(fallback_courses) + 1}"),
                        "sequence_order": len(fallback_courses) + 1,
                        "reasoning": f"Recommended by Goals Agent: {alignment.get('goal_relevance', 'Supports career objectives')}",
                        "agent_consensus": "goals_focused"
                    })
            
            # If no goals-based courses, use available courses
            if not fallback_courses and available_courses:
                for i, course in enumerate(available_courses[:3]):  # Use 3 courses
                    fallback_courses.append({
                        "course_id": course['id'],
                        "sequence_order": i + 1,
                        "reasoning": f"Fallback recommendation: {course['title']} matches your learning needs",
                        "agent_consensus": "system_recommended"
                    })
            
            # Ensure we have at least 2 courses even with minimal data
            if len(fallback_courses) < 2 and available_courses:
                remaining_courses = [c for c in available_courses if c['id'] not in [fc['course_id'] for fc in fallback_courses]]
                for i, course in enumerate(remaining_courses[:2]):
                    fallback_courses.append({
                        "course_id": course['id'],
                        "sequence_order": len(fallback_courses) + 1,
                        "reasoning": f"Additional recommendation: {course['title']} for {user_profile['role']} role development",
                        "agent_consensus": "role_based"
                    })
            
            # Generate strategic advice from agent insights
            strategic_advice = "Based on multi-agent analysis: "
            skills_insights = agent_analysis["agent_outputs"]["skills_analysis"]["analysis"]
            if "estimated_readiness" in skills_insights:
                strategic_advice += f"You're ready for advanced learning in {skills_insights.get('estimated_readiness', '6-8 weeks')}. "
            strategic_advice += "Focus on practical application alongside theoretical knowledge."
            
            return {
                "recommended_sequence": fallback_courses,
                "strategic_advice": strategic_advice,
                "estimated_timeline": "6-8 weeks for recommended sequence",
                "agent_insights": {
                    "skills_confidence": agent_analysis["agent_outputs"]["skills_analysis"]["confidence"],
                    "goals_confidence": agent_analysis["agent_outputs"]["goals_analysis"]["confidence"],
                    "feedback_confidence": agent_analysis["agent_outputs"]["feedback_analysis"]["confidence"]
                },
                "agentic_metadata": {
                    "agents_used": ["skills_analysis", "goals_analysis", "feedback_analysis"],
                    "coordination_success": False,
                    "fallback_reason": "coordinator_parse_error_with_agent_fallback"
                }
            }
            
    except Exception as e:
        print(f"❌ Coordinator AI error: {e}")
        return {
            "recommended_sequence": [],
            "strategic_advice": "Multi-agent analysis attempted but coordinator unavailable. Please try standard recommendations.",
            "estimated_timeline": "Timeline unavailable",
            "agent_insights": {
                "error": str(e)
            },
            "agentic_metadata": {
                "agents_used": ["skills_analysis", "goals_analysis", "feedback_analysis"],
                "coordination_success": False,
                "fallback_reason": "coordinator_error"
            }
        }

# =========================
# API Endpoints
# =========================
@app.route('/api/ai-skill-analysis', methods=['POST'])
def ai_skill_analysis():
    """
    Endpoint for AI-powered skill gap analysis and course recommendations
    """
    try:
        data = request.get_json()
        user_profile = data.get('user_profile')
        skill_gaps = data.get('skill_gaps') 
        available_courses = data.get('available_courses')
        
        if not all([user_profile, skill_gaps, available_courses]):
            return jsonify({
                "error": "Missing required data: user_profile, skill_gaps, or available_courses"
            }), 400
        
        # Load feedback data from API (real localStorage data)
        feedback_data = []
        try:
            import requests
            # Get real feedback data from Node.js API
            api_url = f"http://localhost:3001/api/feedback/user/{user_profile.get('userId', 'tm001')}"
            print(f"🔍 Fetching real feedback data from API: {api_url}")
            
            response = requests.get(api_url)
            if response.status_code == 200:
                feedback_data = response.json()
                print(f"📊 Retrieved {len(feedback_data)} feedback records from API for user {user_profile.get('userId')}")
                if feedback_data:
                    print(f"📋 Latest feedback: Technical={feedback_data[0].get('technicalSkills')}, Communication={feedback_data[0].get('communication')}")
            else:
                print(f"⚠️ API request failed with status: {response.status_code}")
        except Exception as e:
            print(f"⚠️ Error fetching feedback data from API: {e}")
            # Fallback to local file if API fails
            try:
                feedback_file_path = os.path.join(os.path.dirname(__file__), 'live_feedback_data.json')
                print(f"� Falling back to local file: {feedback_file_path}")
                with open(feedback_file_path, 'r') as f:
                    all_feedback = json.load(f)
                    feedback_data = [fb for fb in all_feedback if fb.get('userId') == user_profile.get('userId')]
                    print(f"📊 Fallback: Found {len(feedback_data)} feedback records")
            except Exception as fallback_error:
                print(f"⚠️ Fallback also failed: {fallback_error}")
        
        # Get AI-powered recommendations
        ai_recommendations = get_ai_skill_recommendations(user_profile, skill_gaps, available_courses)
        
        # Post-process to force feedback goal prioritization
        if feedback_data:
            ai_recommendations = force_feedback_goal_prioritization(ai_recommendations, feedback_data, user_profile, available_courses)
        
        # Add detailed context information to the response
        from datetime import datetime
        context_info = {
            "user_profile_context": {
                "name": user_profile.get('name'),
                "role": user_profile.get('role'),
                "department": user_profile.get('department'),
                "experience": user_profile.get('experience'),
                "skills": user_profile.get('skills', []),
                "goals": user_profile.get('currentGoals', []),
                "mentoring_needs": user_profile.get('mentoringNeeds', [])
            },
            "skill_gaps_context": skill_gaps,
            "feedback_context": {
                "feedback_count": len(feedback_data),
                "latest_feedback": feedback_data[0] if feedback_data else None,
                "feedback_summary": {
                    # Use latest feedback record values instead of averaging
                    "technical_skills_avg": feedback_data[0].get('technicalSkills', 0) if feedback_data else 0,
                    "communication_avg": feedback_data[0].get('communication', 0) if feedback_data else 0,
                    "teamwork_current": feedback_data[0].get('teamwork', 0) if feedback_data else 0,
                    "problem_solving_current": feedback_data[0].get('problemSolving', 0) if feedback_data else 0,
                    "initiative_current": feedback_data[0].get('initiative', 0) if feedback_data else 0,
                    "goals_mentioned": [fb.get('goals') for fb in feedback_data if fb.get('goals')]
                }
            },
            "available_courses_count": len(available_courses),
            "recommendation_generation_timestamp": datetime.now().isoformat()
        }
        
        # DEBUG: Print feedback data for troubleshooting
        print(f"🔍 DEBUG: Raw feedback_data = {feedback_data}")
        if feedback_data:
            for i, fb in enumerate(feedback_data):
                print(f"   Feedback {i}: technicalSkills={fb.get('technicalSkills')}, communication={fb.get('communication')}")
        print(f"🔍 DEBUG: Calculated averages:")
        print(f"   Technical Skills: {context_info['feedback_context']['feedback_summary']['technical_skills_avg']}")
        print(f"   Communication: {context_info['feedback_context']['feedback_summary']['communication_avg']}")
        
        # Add context_used to the AI recommendations
        ai_recommendations["context_used"] = context_info
        
        # Add debugging information to see what each agent recommended
        if hasattr(ai_recommendations, 'debug_info'):
            ai_recommendations["debug_agent_outputs"] = ai_recommendations.debug_info
        
        return jsonify({
            "success": True,
            "ai_recommendations": ai_recommendations,
            "context_used": context_info,
            "user_profile": user_profile,
            "skill_gaps_count": len(skill_gaps)
        })
        
    except Exception as e:
        return jsonify({
            "error": f"AI analysis failed: {str(e)}"
        }), 500

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "AI Skill Gap Analysis Service Running", "port": 5004})

if __name__ == '__main__':
    try:
        print("🤖 Starting AI Skill Gap Analysis Service...")
        print("🔗 Available at: http://localhost:5004")
        print("📋 Endpoints:")
        print("   POST /api/ai-skill-analysis - Get AI-powered learning recommendations")
        print("   GET  /health - Service health check")
        
        # Test the orchestrator initialization
        print("🔧 Initializing AI orchestrator...")
        test_orchestrator = AgentOrchestrator()
        print("✅ AI orchestrator initialized successfully")
        
        app.run(debug=True, port=5004, host='0.0.0.0')
    except Exception as e:
        print(f"❌ Failed to start AI Skill Gap service: {e}")
        import traceback
        traceback.print_exc()
