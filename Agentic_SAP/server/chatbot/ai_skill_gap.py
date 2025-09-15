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
        
        # If we have limited courses, use a simpler approach
        if len(available_courses) <= 3:
            return generate_simple_recommendations(user_profile, skill_gaps, available_courses)
        
        # Step 1: Orchestrate all AI agents
        agent_analysis = orchestrator.orchestrate_agents(user_profile, skill_gaps, available_courses)
        
        # Step 2: Extract prioritized course recommendations
        course_priorities = orchestrator.extract_course_priorities(agent_analysis)
        
        # Step 3: Use coordinator LLM to synthesize all agent outputs into final recommendations
        coordinator_recommendations = generate_coordinator_response(
            user_profile, 
            agent_analysis, 
            course_priorities, 
            available_courses
        )
        
        return coordinator_recommendations
        
    except Exception as e:
        print(f"❌ Agentic AI recommendation error: {e}")
        # Fall back to simple recommendations
        return generate_simple_recommendations(user_profile, skill_gaps, available_courses)

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

def generate_coordinator_response(user_profile, agent_analysis, course_priorities, available_courses):
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
        for i, course in enumerate(available_courses[:5]):  # Limit to top 5 courses
            course_info = f"Course {course['id']}: {course['title']} ({course['difficulty']}, {course['duration']})"
            courses_context += course_info + "\n"
            course_list.append(f"{course['id']} = {course['title']}")

        # Coordinator prompt (simplified for reliable JSON output)
        prompt = f"""Recommend courses for user learning path.

User: {user_profile['name']} ({user_profile['role']})

Skills Analysis: {json.dumps(skills_insights.get('critical_gaps', [])[:3])}
Goals Analysis: {json.dumps(goals_insights.get('career_progression', {}))}
Learning Style: {feedback_insights.get('learning_profile', {}).get('preferred_style', 'mixed')}

Available Courses:
{courses_context}

Pick 2-3 actual courses from the list above and return JSON:
{{
  "recommended_sequence": [
    {{
      "course_id": "{available_courses[0]['id'] if available_courses else 'course1'}",
      "course_title": "{available_courses[0]['title'] if available_courses else 'Foundation Course'}",
      "sequence_order": 1,
      "reasoning": "Specific reason for this course selection",
      "agent_consensus": "high"
    }},
    {{
      "course_id": "{available_courses[1]['id'] if len(available_courses) > 1 else 'course2'}",
      "course_title": "{available_courses[1]['title'] if len(available_courses) > 1 else 'Advanced Course'}",
      "sequence_order": 2,
      "reasoning": "Builds on previous course knowledge",
      "agent_consensus": "medium"
    }}
  ],
  "strategic_advice": "Practical learning advice for {user_profile['role']}",
  "estimated_timeline": "8-12 weeks"
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
                return {
                    "recommended_sequence": parsed_response.get("recommended_sequence", []),
                    "strategic_advice": parsed_response.get("strategic_advice", "Multi-agent recommendations synthesized"),
                    "estimated_timeline": parsed_response.get("estimated_timeline", "Timeline to be determined"),
                    "agent_insights": parsed_response.get("agent_insights", {
                        "primary_focus": "comprehensive_analysis",
                        "confidence_level": "high"
                    }),
                    "agentic_metadata": {
                        "agents_used": ["skills_analysis", "goals_analysis", "feedback_analysis"],
                        "coordination_success": True
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
        
        # Get AI-powered recommendations
        ai_recommendations = get_ai_skill_recommendations(user_profile, skill_gaps, available_courses)
        
        return jsonify({
            "success": True,
            "ai_recommendations": ai_recommendations,
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
    print("🤖 Starting AI Skill Gap Analysis Service...")
    print("🔗 Available at: http://localhost:5004")
    print("📋 Endpoints:")
    print("   POST /api/ai-skill-analysis - Get AI-powered learning recommendations")
    print("   GET  /health - Service health check")
    app.run(debug=True, port=5004)
