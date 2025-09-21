"""
Skills Analysis Agent - Agentic AI Component
Specialized LLM agent for deep skills analysis and gap identification
"""

import os
import json
import requests
from openai import OpenAI
from dotenv import load_dotenv

# Load environment
load_dotenv()

class SkillsAnalysisAgent:
    def __init__(self):
        self.client = OpenAI(
            api_key=os.getenv("OPENROUTER_API_KEY"),
            base_url=os.getenv("OPENROUTER_API_BASE", "https://openrouter.ai/api/v1")
        )
        self.model = os.getenv("OPENROUTER_MODEL", "meta-llama/llama-3-8b-instruct")
        self.node_server_url = "http://localhost:3001"
    
    def get_real_feedback_data(self, user_id):
        """
        Retrieve real feedback data from Node.js server (localStorage sync)
        """
        try:
            print(f"🔍 Fetching real feedback data for user: {user_id}")
            response = requests.get(f"{self.node_server_url}/api/feedback/user/{user_id}")
            
            if response.status_code == 200:
                feedback_data = response.json()
                print(f"✅ Retrieved {len(feedback_data)} feedback records for {user_id}")
                return feedback_data
            else:
                print(f"❌ Failed to get feedback data: {response.status_code}")
                return []
        except Exception as e:
            print(f"❌ Error fetching feedback data: {e}")
            return []
    
    def extract_skills_from_feedback(self, feedback_data):
        """
        Extract skill levels and insights from real feedback data
        """
        if not feedback_data:
            return {
                "current_skills": [],
                "feedback_insights": "No feedback data available",
                "areas_for_improvement": []
            }
        
        # Get the latest feedback record
        latest_feedback = feedback_data[-1] if feedback_data else None
        
        if not latest_feedback:
            return {
                "current_skills": [],
                "feedback_insights": "No feedback data available", 
                "areas_for_improvement": []
            }
        
        # Extract skills from feedback
        skills = [
            {"name": "Technical Skills", "rating": latest_feedback.get("technicalSkills", 3)},
            {"name": "Communication", "rating": latest_feedback.get("communication", 3)},
            {"name": "Teamwork", "rating": latest_feedback.get("teamwork", 3)},
            {"name": "Problem Solving", "rating": latest_feedback.get("problemSolving", 3)},
            {"name": "Initiative", "rating": latest_feedback.get("initiative", 3)}
        ]
        
        return {
            "current_skills": skills,
            "feedback_insights": latest_feedback.get("qualitativeFeedback", ""),
            "areas_for_improvement": latest_feedback.get("areasForImprovement", ""),
            "goals": latest_feedback.get("goals", ""),
            "manager_name": latest_feedback.get("managerName", "Manager"),
            "feedback_date": latest_feedback.get("date", "Recent")
        }
    
    def analyze_skills(self, user_profile, available_courses, user_id=None):
        """
        Analyze user skills using REAL feedback data and provide deep insights on learning needs
        """
        try:
            # Get real feedback data if user_id is provided
            real_feedback = {}
            if user_id:
                feedback_data = self.get_real_feedback_data(user_id)
                real_feedback = self.extract_skills_from_feedback(feedback_data)
                
                # Update user_profile with real feedback data
                if real_feedback["current_skills"]:
                    user_profile["skills"] = real_feedback["current_skills"]
                    print(f"🔄 Updated user profile with real feedback skills")
            
            # Prepare user skills context
            current_skills = ", ".join([f"{skill['name']} (Level {skill['rating']})" 
                                      for skill in user_profile.get('skills', [])])
            
            # Prepare course skills context  
            course_skills = {}
            for course in available_courses:
                course_skills[course['id']] = {
                    'title': course['title'],
                    'skills': [f"{skill['name']} (Level {skill['level']})" 
                              for skill in course.get('skills', [])]
                }
            
            # Include real feedback insights in the prompt
            feedback_context = ""
            if real_feedback.get("feedback_insights"):
                feedback_context = f"""
REAL FEEDBACK FROM {real_feedback.get('manager_name', 'Manager')} ({real_feedback.get('feedback_date', 'Recent')}):
Qualitative Feedback: {real_feedback['feedback_insights']}
Areas for Improvement: {real_feedback.get('areas_for_improvement', 'None specified')}
Goals: {real_feedback.get('goals', 'None specified')}
"""
            
            prompt = f"""Analyze skills for learning path optimization using REAL performance feedback.

User: {user_profile.get('name', 'User')} ({user_profile.get('role', 'Team Member')})
Current Skills: {current_skills}
{feedback_context}
Available Courses: {json.dumps(course_skills, indent=1)}

Based on the REAL feedback data above, analyze skill gaps and provide recommendations.

Return JSON:
{{
  "critical_gaps": [
    {{
      "skill_name": "Communication",
      "current_level": 3,
      "required_level": 4,
      "impact": "high",
      "feedback_based": true
    }}
  ],
  "learning_readiness": [
    {{
      "skill_name": "Technical Skills", 
      "ready_now": true,
      "prerequisites_needed": []
    }}
  ],
  "feedback_alignment": "Based on manager feedback about areas for improvement",
  "estimated_readiness": "4-6 weeks"
}}"""

            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are an expert Skills Analysis AI agent using REAL performance feedback data. Provide precise, actionable skills analysis based on actual manager feedback in valid JSON format."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=150,  # Increased for better analysis
                temperature=0.1  # Lower for consistent JSON
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
                result = {
                    "agent": "skills_analysis",
                    "analysis": parsed_response,
                    "confidence": "high",
                    "data_source": "real_feedback" if real_feedback.get("current_skills") else "user_profile",
                    "feedback_summary": real_feedback if real_feedback.get("current_skills") else None
                }
                print(f"✅ Skills analysis completed using {result['data_source']}")
                return result
            except json.JSONDecodeError:
                return {
                    "agent": "skills_analysis",
                    "analysis": {
                        "critical_gaps": [],
                        "learning_readiness": [],
                        "skill_priorities": [],
                        "learning_approach": "Standard progressive learning approach",
                        "estimated_readiness": "8-12 weeks"
                    },
                    "confidence": "low",
                    "data_source": "fallback",
                    "error": "JSON parsing failed"
                }
                
        except Exception as e:
            print(f"❌ Skills Analysis Agent error: {e}")
            return {
                "agent": "skills_analysis",
                "analysis": {
                    "critical_gaps": [],
                    "learning_readiness": [],
                    "skill_priorities": [],
                    "learning_approach": "Unable to analyze - using default approach",
                    "estimated_readiness": "Timeline unavailable"
                },
                "confidence": "low",
                "data_source": "error",
                "error": str(e)
            }
# Test function for standalone usage
def test_skills_agent():
    """Test the Skills Analysis Agent with real feedback data"""
    agent = SkillsAnalysisAgent()
    
    # Test with Alex's user ID (assuming Alex has feedback from Sarah)
    test_profile = {
        "name": "Alex Thompson",
        "role": "Junior Developer", 
        "skills": [
            {"name": "Python", "rating": 3},
            {"name": "Machine Learning", "rating": 2},
            {"name": "SQL", "rating": 2}
        ]
    }
    
    # Sample courses
    test_courses = [
        {
            "id": "course2",
            "title": "Machine Learning Fundamentals",
            "skills": [{"name": "Machine Learning", "level": 3}]
        }
    ]
    
    # Test with real feedback data (Alex's ID)
    alex_user_id = "tm002"  # Assuming Alex's user ID
    result = agent.analyze_skills(test_profile, test_courses, alex_user_id)
    print("Skills Analysis Result (with real feedback):")
    print(json.dumps(result, indent=2))
    
    # Also test feedback data retrieval directly
    feedback_data = agent.get_real_feedback_data(alex_user_id)
    print(f"\nDirect feedback data for {alex_user_id}:")
    print(json.dumps(feedback_data, indent=2))

if __name__ == "__main__":
    test_skills_agent()