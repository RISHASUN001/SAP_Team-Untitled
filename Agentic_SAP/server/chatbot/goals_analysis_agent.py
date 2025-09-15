"""
Goals Analysis Agent - Agentic AI Component
Specialized LLM agent for analyzing user goals and course alignment
"""

import os
import json
from openai import OpenAI
from dotenv import load_dotenv

# Load environment
load_dotenv()

class GoalsAnalysisAgent:
    def __init__(self):
        self.client = OpenAI(
            api_key=os.getenv("OPENROUTER_API_KEY"),
            base_url=os.getenv("OPENROUTER_API_BASE", "https://openrouter.ai/api/v1")
        )
        self.model = os.getenv("OPENROUTER_MODEL", "meta-llama/llama-3-8b-instruct")
    
    def analyze_goals(self, user_profile, user_feedback_data, available_courses):
        """
        Analyze user goals and map them to optimal course selections
        """
        try:
            # Extract goals from feedback data
            goals_text = ""
            if user_feedback_data:
                for feedback in user_feedback_data:
                    if 'goals' in feedback and feedback['goals']:
                        goals_text += f"Goal: {feedback['goals']} "
                        
            # If no explicit goals, infer from role
            if not goals_text:
                goals_text = f"Advance in {user_profile['role']} position"
            
            # Prepare course context with career relevance
            courses_context = ""
            for course in available_courses:
                courses_context += f"""
Course: {course['title']} (ID: {course['id']})
- Difficulty: {course['difficulty']}
- Duration: {course['duration']} 
- Skills: {', '.join([skill['name'] for skill in course['skills']])}
- Description: {course['description']}
"""

            prompt = f"""Analyze goals and recommend courses.

User: {user_profile['name']} ({user_profile['role']})
Goals: {goals_text}

Courses:
{courses_context}

Return JSON:
{{
  "goal_course_alignment": [
    {{
      "course_id": "course2",
      "course_title": "Machine Learning Fundamentals",
      "alignment_score": 9,
      "goal_relevance": "Essential for data science leadership role advancement",
      "career_impact": "high"
    }}
  ],
  "strategic_timeline": {{
    "short_term_priority": ["course2", "course3"],
    "medium_term_goals": ["advanced_courses"],
    "long_term_vision": "Technical leadership in ML/AI teams"
  }},
  "career_progression": {{
    "current_level": "team_lead",
    "target_level": "senior_technical_leader", 
    "key_skills_needed": ["MLOps", "Cloud Architecture"],
    "timeline_months": 12
  }}
}}"""

            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are an expert Goals Analysis AI agent. Provide strategic career-focused analysis in valid JSON format."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=100,  # Reduced for cost optimization
                temperature=0.2
            )
            
            # Parse and clean response
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
                return {
                    "agent": "goals_analysis",
                    "analysis": parsed_response,
                    "confidence": "high"
                }
            except json.JSONDecodeError:
                return {
                    "agent": "goals_analysis", 
                    "analysis": {
                        "goal_course_alignment": [],
                        "strategic_timeline": {
                            "short_term_priority": [],
                            "medium_term_goals": [],
                            "long_term_vision": "Career advancement in current role"
                        },
                        "career_progression": {
                            "current_level": user_profile['role'],
                            "target_level": "Senior " + user_profile['role'],
                            "key_skills_needed": [],
                            "timeline_months": 12
                        },
                        "roi_recommendations": []
                    },
                    "confidence": "low",
                    "error": "JSON parsing failed"
                }
                
        except Exception as e:
            print(f"Goals Analysis Agent error: {e}")
            return {
                "agent": "goals_analysis",
                "analysis": {
                    "goal_course_alignment": [],
                    "strategic_timeline": {
                        "short_term_priority": [],
                        "medium_term_goals": [],
                        "long_term_vision": "Unable to analyze goals"
                    },
                    "career_progression": {
                        "current_level": user_profile['role'],
                        "target_level": "Advanced role",
                        "key_skills_needed": [],
                        "timeline_months": 12
                    },
                    "roi_recommendations": []
                },
                "confidence": "low",
                "error": str(e)
            }

# Test function for standalone usage
def test_goals_agent():
    """Test the Goals Analysis Agent"""
    agent = GoalsAnalysisAgent()
    
    # Sample user profile
    test_profile = {
        "name": "Sarah Chen", 
        "role": "Data Science Team Lead"
    }
    
    # Sample feedback with goals
    test_feedback = [
        {"goals": "Become a senior technical leader in ML/AI"}
    ]
    
    # Sample courses
    test_courses = [
        {
            "id": "course2",
            "title": "Machine Learning Fundamentals",
            "difficulty": "Intermediate",
            "duration": "6 weeks",
            "skills": [{"name": "Machine Learning"}],
            "description": "Core ML concepts and applications"
        }
    ]
    
    result = agent.analyze_goals(test_profile, test_feedback, test_courses)
    print("Goals Analysis Result:")
    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    test_goals_agent()