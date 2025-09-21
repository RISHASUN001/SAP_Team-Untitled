"""
Goals Analysis Agent
Analyzes user goals and identifies key skills to learn
"""
import os
import json
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

class GoalsAnalysisAgent:
    def __init__(self):
        self.client = OpenAI(
            api_key=os.getenv("OPENROUTER_API_KEY"),
            base_url=os.getenv("OPENROUTER_API_BASE", "https://openrouter.ai/api/v1")
        )
    
    def analyze_goals(self, user_profile, available_courses):
        """
        Analyze user goals to identify key skills to learn
        
        Args:
            user_profile: User's profile information with goals
            available_courses: List of available courses for context
            
        Returns:
            dict: Key skills to learn based on goals with priority and reasoning
        """
        try:
            # Extract goals information
            current_goals = user_profile.get('currentGoals', [])
            role = user_profile.get('role', 'Unknown')
            experience = user_profile.get('experience', 'Unknown')
            
            # Handle case where user has no goals
            if not current_goals or len(current_goals) == 0:
                return self._handle_no_goals(role, experience, available_courses)
            
            # Limit data to prevent token overflow
            goals_summary = self._summarize_goals(current_goals)
            courses_summary = self._summarize_courses(available_courses)
            
            # Create concise prompt
            prompt = f"""Analyze career goals for {role} with {experience} experience.

Current Goals: {goals_summary}
Available Courses: {courses_summary}

Based on these goals, identify the TOP 3 KEY SKILLS this person should learn to achieve their objectives.

Consider:
1. Skills directly needed for goal achievement
2. Prerequisites for goal progression
3. Market demand for goal-related roles

Return JSON format:
{{
  "key_skills": [
    {{
      "skill_name": "skill name",
      "priority": "high|medium|low",
      "reasoning": "how this skill helps achieve goals",
      "goal_alignment": "which specific goal this supports"
    }}
  ],
  "analysis_summary": "brief overview of goals assessment",
  "career_progression": "next logical career step based on goals"
}}"""

            response = self.client.chat.completions.create(
                model=os.getenv("OPENROUTER_MODEL", "meta-llama/llama-3-8b-instruct"),
                messages=[
                    {"role": "system", "content": "You are a career goals analysis expert. Provide concise, actionable skill recommendations aligned with career objectives in valid JSON format."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=350,  # Limit tokens
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
                    return self._fallback_goals_analysis(current_goals, role)
                
                return {
                    "agent": "goals_analysis",
                    "confidence": "high",
                    "analysis": result,
                    "raw_data": {
                        "goals_count": len(current_goals),
                        "role": role,
                        "has_goals": True
                    }
                }
                
            except json.JSONDecodeError:
                print(f"⚠️ Goals agent JSON parse error: {ai_response}")
                return self._fallback_goals_analysis(current_goals, role)
                
        except Exception as e:
            print(f"❌ Goals analysis error: {e}")
            return self._fallback_goals_analysis(current_goals if 'current_goals' in locals() else [], role if 'role' in locals() else 'Unknown')
    
    def _handle_no_goals(self, role, experience, available_courses):
        """Handle users with no specified goals"""
        try:
            # Use role-based analysis instead
            courses_summary = self._summarize_courses(available_courses)
            
            prompt = f"""No specific goals provided for {role} with {experience} experience.

Available Courses: {courses_summary}

Based on typical career progression for this role, suggest TOP 3 KEY SKILLS to learn.

Consider:
1. Standard career advancement for {role}
2. Industry trends and demands
3. Foundational skills vs advanced skills based on experience

Return JSON format:
{{
  "key_skills": [
    {{
      "skill_name": "skill name",
      "priority": "high|medium|low", 
      "reasoning": "why this skill is important for role progression",
      "goal_alignment": "typical career advancement"
    }}
  ],
  "analysis_summary": "role-based skill recommendations due to no specific goals",
  "career_progression": "suggested next step for {role}"
}}"""

            response = self.client.chat.completions.create(
                model=os.getenv("OPENROUTER_MODEL", "meta-llama/llama-3-8b-instruct"),
                messages=[
                    {"role": "system", "content": "You are a career progression expert. Provide role-based skill recommendations in valid JSON format."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=300,
                temperature=0.2
            )
            
            ai_response = response.choices[0].message.content.strip()
            
            # Clean and parse JSON
            if ai_response.startswith("```json"):
                ai_response = ai_response.replace("```json", "").replace("```", "").strip()
            
            result = json.loads(ai_response)
            
            return {
                "agent": "goals_analysis",
                "confidence": "medium",
                "analysis": result,
                "raw_data": {
                    "goals_count": 0,
                    "role": role,
                    "has_goals": False,
                    "analysis_type": "role_based"
                }
            }
            
        except Exception as e:
            print(f"❌ No goals analysis error: {e}")
            return self._fallback_no_goals(role)
    
    def _summarize_goals(self, current_goals):
        """Summarize goals to prevent token overflow"""
        if not current_goals:
            return "No specific goals provided"
        
        # Take first 3 goals and limit length
        goal_summary = []
        for goal in current_goals[:3]:
            if isinstance(goal, str):
                goal_summary.append(goal[:50])  # Limit to 50 chars each
            elif isinstance(goal, dict):
                goal_summary.append(str(goal.get('description', str(goal)))[:50])
        
        return "; ".join(goal_summary)
    
    def _summarize_courses(self, available_courses):
        """Summarize available courses to prevent token overflow"""
        course_summary = []
        for course in available_courses[:6]:  # Limit to 6 courses
            title = course.get('title', 'Unknown')
            skills = [s.get('name', '') for s in course.get('skills', [])][:2]  # Top 2 skills
            course_summary.append(f"{title} ({', '.join(skills)})")
        
        return "; ".join(course_summary)
    
    def _fallback_goals_analysis(self, current_goals, role):
        """Fallback analysis when LLM fails but goals exist"""
        key_skills = []
        
        # Simple goal-to-skill mapping
        goal_text = " ".join([str(g) for g in current_goals]).lower()
        
        if "data science" in goal_text or "scientist" in goal_text:
            key_skills.extend([
                {"skill_name": "Python", "priority": "high", "reasoning": "Essential for data science", "goal_alignment": "data science transition"},
                {"skill_name": "Machine Learning", "priority": "high", "reasoning": "Core data science skill", "goal_alignment": "data science expertise"},
                {"skill_name": "Statistics", "priority": "medium", "reasoning": "Foundation for analysis", "goal_alignment": "analytical capabilities"}
            ])
        elif "python" in goal_text:
            key_skills.append({"skill_name": "Python", "priority": "high", "reasoning": "Directly mentioned in goals", "goal_alignment": "python proficiency"})
        elif "leadership" in goal_text or "manager" in goal_text:
            key_skills.extend([
                {"skill_name": "Leadership", "priority": "high", "reasoning": "Goal-focused skill", "goal_alignment": "leadership development"},
                {"skill_name": "Communication", "priority": "high", "reasoning": "Essential for management", "goal_alignment": "management capabilities"}
            ])
        else:
            # Generic role-based skills
            if "analyst" in role.lower():
                key_skills.extend([
                    {"skill_name": "Data Analysis", "priority": "medium", "reasoning": "Role enhancement", "goal_alignment": "career advancement"},
                    {"skill_name": "SQL", "priority": "medium", "reasoning": "Analyst foundation", "goal_alignment": "technical skills"}
                ])
        
        return {
            "agent": "goals_analysis",
            "confidence": "fallback",
            "analysis": {
                "key_skills": key_skills[:3],  # Limit to 3
                "analysis_summary": "Fallback analysis based on goal keywords and role",
                "career_progression": f"Advance in {role} role based on stated goals"
            },
            "raw_data": {
                "goals_count": len(current_goals),
                "role": role,
                "has_goals": True,
                "fallback_reason": "llm_unavailable"
            }
        }
    
    def _fallback_no_goals(self, role):
        """Fallback for users with no goals"""
        return {
            "agent": "goals_analysis",
            "confidence": "low",
            "analysis": {
                "key_skills": [
                    {"skill_name": "Professional Development", "priority": "medium", "reasoning": "General career growth", "goal_alignment": "career advancement"}
                ],
                "analysis_summary": "No goals provided - general recommendations based on role",
                "career_progression": f"Standard progression for {role}"
            },
            "raw_data": {
                "goals_count": 0,
                "role": role,
                "has_goals": False,
                "fallback_reason": "no_goals_and_llm_unavailable"
            }
        }

# Standalone function for easy import
def analyze_user_goals(user_profile, available_courses):
    """Standalone function to analyze user goals"""
    agent = GoalsAnalysisAgent()
    return agent.analyze_goals(user_profile, available_courses)

if __name__ == "__main__":
    # Test the goals analysis agent
    test_user_profile = {
        "name": "Test User",
        "role": "Data Analyst",
        "experience": "2 years", 
        "currentGoals": ["Transition to Data Science role", "Python proficiency"]
    }
    
    test_courses = [
        {"title": "Advanced Python for Data Science", "skills": [{"name": "Python"}]},
        {"title": "Machine Learning Fundamentals", "skills": [{"name": "Machine Learning"}]}
    ]
    
    result = analyze_user_goals(test_user_profile, test_courses)
    print("Goals Analysis Result:")
    print(json.dumps(result, indent=2))
    
    # Test with no goals
    test_user_no_goals = {
        "name": "Test User 2",
        "role": "Software Engineer",
        "experience": "3 years",
        "currentGoals": []
    }
    
    result_no_goals = analyze_user_goals(test_user_no_goals, test_courses)
    print("\nNo Goals Analysis Result:")
    print(json.dumps(result_no_goals, indent=2))