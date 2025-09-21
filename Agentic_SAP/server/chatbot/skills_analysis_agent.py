"""
Skills Analysis Agent
Analyzes user skill data and identifies key skills to learn
"""
import os
import json
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

class SkillsAnalysisAgent:
    def __init__(self):
        self.client = OpenAI(
            api_key=os.getenv("OPENROUTER_API_KEY"),
            base_url=os.getenv("OPENROUTER_API_BASE", "https://openrouter.ai/api/v1")
        )
    
    def analyze_skills(self, user_profile, skill_gaps, available_courses):
        """
        Analyze user skills and skill gaps to identify key skills to learn
        
        Args:
            user_profile: User's profile information with current skills
            skill_gaps: List of skills that need improvement
            available_courses: List of available courses for context
            
        Returns:
            dict: Key skills to learn with priority and reasoning
        """
        try:
            # Extract skill information
            current_skills = user_profile.get('skills', [])
            role = user_profile.get('role', 'Unknown')
            experience = user_profile.get('experience', 'Unknown')
            
            # Limit skill data to prevent token overflow
            skills_summary = self._summarize_skills(current_skills, skill_gaps)
            courses_summary = self._summarize_courses(available_courses)
            
            # Create concise prompt
            prompt = f"""Analyze skills for {role} with {experience} experience.

Current Skills: {skills_summary}
Skill Gaps: {json.dumps(skill_gaps[:5])}  # Limit to 5 gaps
Available Courses: {courses_summary}

Identify the TOP 3 KEY SKILLS this person should learn based on:
1. Their current role requirements
2. Skill gaps that need urgent attention  
3. Career progression opportunities

Return JSON format:
{{
  "key_skills": [
    {{
      "skill_name": "skill name",
      "priority": "high|medium|low", 
      "reasoning": "why this skill is important"
    }}
  ],
  "analysis_summary": "brief overview of skill assessment"
}}"""

            response = self.client.chat.completions.create(
                model=os.getenv("OPENROUTER_MODEL", "meta-llama/llama-3-8b-instruct"),
                messages=[
                    {"role": "system", "content": "You are a skills analysis expert. Provide concise, actionable skill recommendations in valid JSON format."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=300,  # Limit tokens
                temperature=0.2
            )
            
            ai_response = response.choices[0].message.content.strip()
            
            # Clean and parse JSON
            if ai_response.startswith("```json"):
                ai_response = ai_response.replace("```json", "").replace("```", "").strip()
            
            try:
                result = json.loads(ai_response)
                
                # Validate structure
                if not isinstance(result, dict) or 'key_skills' not in result:
                    return self._fallback_skills_analysis(current_skills, skill_gaps)
                
                return {
                    "agent": "skills_analysis",
                    "confidence": "high",
                    "analysis": result,
                    "raw_data": {
                        "current_skills_count": len(current_skills),
                        "skill_gaps_count": len(skill_gaps),
                        "role": role
                    }
                }
                
            except json.JSONDecodeError:
                print(f"⚠️ Skills agent JSON parse error: {ai_response}")
                return self._fallback_skills_analysis(current_skills, skill_gaps)
                
        except Exception as e:
            print(f"❌ Skills analysis error: {e}")
            return self._fallback_skills_analysis(current_skills, skill_gaps)
    
    def _summarize_skills(self, current_skills, skill_gaps):
        """Summarize skills to prevent token overflow"""
        # Extract skill names and levels
        skill_summary = []
        for skill in current_skills[:8]:  # Limit to 8 skills
            name = skill.get('name', 'Unknown')
            level = skill.get('current_level', 0)
            skill_summary.append(f"{name}({level}/3)")
        
        return ", ".join(skill_summary)
    
    def _summarize_courses(self, available_courses):
        """Summarize available courses to prevent token overflow"""
        course_summary = []
        for course in available_courses[:6]:  # Limit to 6 courses
            title = course.get('title', 'Unknown')
            skills = [s.get('name', '') for s in course.get('skills', [])][:3]  # Top 3 skills
            course_summary.append(f"{title} (teaches: {', '.join(skills)})")
        
        return "; ".join(course_summary)
    
    def _fallback_skills_analysis(self, current_skills, skill_gaps):
        """Fallback analysis when LLM fails"""
        key_skills = []
        
        # Prioritize skill gaps
        for gap in skill_gaps[:3]:
            key_skills.append({
                "skill_name": gap.get('skill', 'Unknown Skill'),
                "priority": "high" if gap.get('gap', 0) >= 2 else "medium",
                "reasoning": f"Current level {gap.get('current', 0)}, target level {gap.get('target', 3)}"
            })
        
        return {
            "agent": "skills_analysis",
            "confidence": "fallback",
            "analysis": {
                "key_skills": key_skills,
                "analysis_summary": "Fallback analysis: Focus on largest skill gaps first"
            },
            "raw_data": {
                "current_skills_count": len(current_skills),
                "skill_gaps_count": len(skill_gaps),
                "fallback_reason": "llm_unavailable"
            }
        }

# Standalone function for easy import
def analyze_user_skills(user_profile, skill_gaps, available_courses):
    """Standalone function to analyze user skills"""
    agent = SkillsAnalysisAgent()
    return agent.analyze_skills(user_profile, skill_gaps, available_courses)

if __name__ == "__main__":
    # Test the skills analysis agent
    test_user_profile = {
        "name": "Test User",
        "role": "Data Analyst", 
        "experience": "2 years",
        "skills": [
            {"name": "Python", "current_level": 1},
            {"name": "SQL", "current_level": 3}
        ]
    }
    
    test_skill_gaps = [
        {"skill": "Python", "current": 1, "target": 3, "gap": 2},
        {"skill": "Machine Learning", "current": 0, "target": 2, "gap": 2}
    ]
    
    test_courses = [
        {"title": "Advanced Python for Data Science", "skills": [{"name": "Python"}]},
        {"title": "Machine Learning Fundamentals", "skills": [{"name": "Machine Learning"}]}
    ]
    
    result = analyze_user_skills(test_user_profile, test_skill_gaps, test_courses)
    print("Skills Analysis Result:")
    print(json.dumps(result, indent=2))