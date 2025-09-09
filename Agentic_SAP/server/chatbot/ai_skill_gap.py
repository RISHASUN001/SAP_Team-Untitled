import requests
import os
import json
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from openai import OpenAI

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

# =========================
# AI Skill Gap Analysis
# =========================
def get_ai_skill_recommendations(user_profile, skill_gaps, available_courses):
    """
    Use LLM to analyze skill gaps and provide intelligent course recommendations
    with learning path optimization and reasoning
    """
    try:
        api_key = os.getenv("OPENROUTER_API_KEY")
        base_url = os.getenv("OPENROUTER_API_BASE", "https://openrouter.ai/api/v1")
        
        print(f"🔍 Debug - API Key: {'Present' if api_key else 'Missing'}")
        print(f"🔍 Debug - Base URL: {base_url}")
        
        client = OpenAI(
            api_key=api_key,
            base_url=base_url
        )
        
        # Prepare user context
        user_skills_text = ", ".join([f"{skill['name']} (Level {skill['rating']})" for skill in user_profile['skills']])
        gaps_text = ", ".join([f"{gap['name']} (Need Level {gap['level']})" for gap in skill_gaps])
        
        # Prepare course context
        courses_context = ""
        for course in available_courses:
            skills_taught = ", ".join([f"{skill['name']} (Level {skill['level']})" for skill in course['skills']])
            courses_context += f"""
Course: {course['title']} (ID: {course['id']})
- Difficulty: {course['difficulty']}
- Duration: {course['duration']}
- Skills Taught: {skills_taught}
- Description: {course['description']}
"""

        # Create AI prompt for intelligent analysis
        prompt = f"""You are an AI learning advisor specializing in data science career development. 

USER PROFILE:
Name: {user_profile['name']}
Role: {user_profile['role']}
Current Skills: {user_skills_text}
Skill Gaps: {gaps_text}

AVAILABLE COURSES:
{courses_context}

TASK: Analyze this user's learning needs and provide:

1. LEARNING PATH OPTIMIZATION: Recommend the optimal sequence of courses considering:
   - Skill dependencies (e.g., ML fundamentals before Deep Learning)
   - Difficulty progression (beginner → intermediate → advanced)
   - Role-specific priorities for {user_profile['role']}

2. CONTEXTUAL REASONING: For each recommended course, explain:
   - Why this course fits their role and gaps
   - When to take it in the sequence
   - How it builds toward their career goals

3. PERSONALIZED GUIDANCE: Provide 1-2 sentences of strategic advice for their learning journey.

RESPONSE FORMAT (JSON):
{{
  "recommended_sequence": [
    {{
      "course_id": "course2",
      "course_title": "Machine Learning Fundamentals", 
      "sequence_order": 1,
      "reasoning": "Start here because you need ML Level 3, and this builds from your current Level 2 foundation",
      "timing_advice": "Complete this first - it's prerequisite for advanced courses"
    }}
  ],
  "strategic_advice": "As a {user_profile['role']}, focus on MLOps after mastering ML fundamentals to lead technical teams effectively.",
  "estimated_timeline": "3-4 months for complete learning path"
}}

Be concise but insightful. Focus on practical career advancement for a {user_profile['role']}."""

        response = client.chat.completions.create(
            model=os.getenv("OPENROUTER_MODEL", "meta-llama/llama-3-8b-instruct"),
            messages=[
                {"role": "system", "content": "You are an expert AI learning advisor. Provide strategic, career-focused learning recommendations in valid JSON format."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=800,
            temperature=0.3
        )
        
        # Parse JSON response
        ai_response = response.choices[0].message.content.strip()
        
        # Clean up the response to ensure valid JSON
        if ai_response.startswith("```json"):
            ai_response = ai_response.replace("```json", "").replace("```", "").strip()
        
        # Extract JSON if it's embedded in text
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
                    "strategic_advice": parsed_response.get("strategic_advice", "AI recommendations available"),
                    "estimated_timeline": parsed_response.get("estimated_timeline", "Timeline to be determined")
                }
            else:
                raise json.JSONDecodeError("Invalid response format", ai_response, 0)
        except json.JSONDecodeError:
            # Fallback if JSON parsing fails
            return {
                "recommended_sequence": [],
                "strategic_advice": "AI recommendations generated but could not be parsed properly. Please try again.",
                "estimated_timeline": "Contact advisor for personalized timeline"
            }
            
    except Exception as e:
        print(f"AI recommendation error: {e}")
        return {
            "recommended_sequence": [],
            "strategic_advice": "Unable to generate AI recommendations at this time. Please try the standard recommendations.",
            "estimated_timeline": "Timeline unavailable"
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
