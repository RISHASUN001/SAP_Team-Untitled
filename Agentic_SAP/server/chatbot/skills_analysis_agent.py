"""
Skills Analysis Agent - Agentic AI Component
Specialized LLM agent for deep skills analysis and gap identification
"""

import os
import json
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
    
    def analyze_skills(self, user_profile, available_courses):
        """
        Analyze user skills and provide deep insights on learning needs
        """
        try:
            # Prepare user skills context
            current_skills = ", ".join([f"{skill['name']} (Level {skill['rating']})" 
                                      for skill in user_profile['skills']])
            
            # Prepare course skills context  
            course_skills = {}
            for course in available_courses:
                course_skills[course['id']] = {
                    'title': course['title'],
                    'skills': [f"{skill['name']} (Level {skill['level']})" 
                              for skill in course['skills']]
                }
            
            prompt = f"""Analyze skills for learning path optimization.

User: {user_profile['name']} ({user_profile['role']})
Skills: {current_skills}
Courses: {json.dumps(course_skills, indent=1)}

Return JSON:
{{
  "critical_gaps": [
    {{
      "skill_name": "Machine Learning",
      "current_level": 2,
      "required_level": 4,
      "impact": "high"
    }}
  ],
  "learning_readiness": [
    {{
      "skill_name": "Deep Learning", 
      "ready_now": true,
      "prerequisites_needed": ["ML Level 3"]
    }}
  ],
  "estimated_readiness": "6-8 weeks"
}}"""

            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are an expert Skills Analysis AI agent. Provide precise, actionable skills analysis in valid JSON format."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=80,  # Reduced for cost optimization
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
                return {
                    "agent": "skills_analysis",
                    "analysis": parsed_response,
                    "confidence": "high"
                }
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
                    "error": "JSON parsing failed"
                }
                
        except Exception as e:
            print(f"Skills Analysis Agent error: {e}")
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
                "error": str(e)
            }

# Test function for standalone usage
def test_skills_agent():
    """Test the Skills Analysis Agent"""
    agent = SkillsAnalysisAgent()
    
    # Sample user profile
    test_profile = {
        "name": "Sarah Chen",
        "role": "Data Science Team Lead", 
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
    
    result = agent.analyze_skills(test_profile, test_courses)
    print("Skills Analysis Result:")
    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    test_skills_agent()