"""
Feedback Analysis Agent
Analyzes user feedback data and identifies key skills to learn
"""
import os
import json
import requests
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

class FeedbackAnalysisAgent:
    def __init__(self):
        self.client = OpenAI(
            api_key=os.getenv("OPENROUTER_API_KEY"),
            base_url=os.getenv("OPENROUTER_API_BASE", "https://openrouter.ai/api/v1")
        )
    
    def analyze_feedback(self, user_profile, available_courses):
        """
        Analyze user feedback data to identify key skills to learn
        
        Args:
            user_profile: User's profile information
            available_courses: List of available courses for context
            
        Returns:
            dict: Key skills to learn based on feedback with priority and reasoning
        """
        try:
            user_id = user_profile.get('userId') or user_profile.get('id')
            role = user_profile.get('role', 'Unknown')
            
            # Load local feedback data
            feedback_data = self._load_local_feedback_data(user_id)
            
            # Handle case where user has no feedback
            if not feedback_data or len(feedback_data) == 0:
                return self._handle_no_feedback(role, available_courses)
            
            # Limit data to prevent token overflow
            feedback_summary = self._summarize_feedback(feedback_data)
            courses_summary = self._summarize_courses(available_courses)
            
            # Create concise prompt
            prompt = f"""Analyze feedback data for {role}.

Feedback Summary: {feedback_summary}
Available Courses: {courses_summary}

Based on the feedback, identify the TOP 3 KEY SKILLS this person should learn to improve performance.

Consider:
1. Areas marked as needing improvement in feedback
2. Skills mentioned specifically in feedback goals
3. Performance gaps highlighted by managers/peers

Return JSON format:
{{
  "key_skills": [
    {{
      "skill_name": "skill name",
      "priority": "high|medium|low",
      "reasoning": "what feedback indicates about this skill need",
      "feedback_source": "manager|peer|self feedback"
    }}
  ],
  "analysis_summary": "brief overview of feedback assessment",
  "improvement_areas": "main areas needing development based on feedback"
}}"""

            response = self.client.chat.completions.create(
                model=os.getenv("OPENROUTER_MODEL", "meta-llama/llama-3-8b-instruct"),
                messages=[
                    {"role": "system", "content": "You are a feedback analysis expert. Provide concise, actionable skill recommendations based on performance feedback in valid JSON format."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=350,  # Limit tokens
                temperature=0.2
            )
            
            ai_response = response.choices[0].message.content.strip()
            
            # Clean and parse JSON
            if ai_response.startswith("```json"):
                ai_response = ai_response.replace("```json", "").replace("```", "").strip()
            
            # Additional cleaning for common LLM response patterns
            ai_response = ai_response.strip()
            if ai_response.startswith("Here is the analysis in JSON format:"):
                ai_response = ai_response.split(":", 1)[1].strip()
            
            # Find JSON content between curly braces
            import re
            json_match = re.search(r'\{.*\}', ai_response, re.DOTALL)
            if json_match:
                ai_response = json_match.group()
            
            try:
                result = json.loads(ai_response)
                
                # Validate structure
                if not isinstance(result, dict) or 'key_skills' not in result:
                    return self._fallback_feedback_analysis(feedback_data, role)
                
                return {
                    "agent": "feedback_analysis",
                    "confidence": "high",
                    "analysis": result,
                    "raw_data": {
                        "feedback_count": len(feedback_data),
                        "role": role,
                        "has_feedback": True,
                        "latest_feedback_date": feedback_data[0].get('date') if feedback_data else None
                    }
                }
                
            except json.JSONDecodeError:
                print(f"⚠️ Feedback agent JSON parse error: {ai_response}")
                return self._fallback_feedback_analysis(feedback_data, role)
                
        except Exception as e:
            print(f"❌ Feedback analysis error: {e}")
            return self._handle_no_feedback(role if 'role' in locals() else 'Unknown', available_courses)
    
    def _load_local_feedback_data(self, user_id):
        """Load feedback data from local sources"""
        feedback_data = []
        
        try:
            # Try API first
            api_url = f"http://localhost:3001/api/feedback/user/{user_id}"
            print(f"🔍 Loading feedback from API: {api_url}")
            
            response = requests.get(api_url, timeout=5)
            if response.status_code == 200:
                feedback_data = response.json()
                print(f"📊 Retrieved {len(feedback_data)} feedback records from API")
                return feedback_data
            else:
                print(f"⚠️ API request failed with status: {response.status_code}")
        except Exception as e:
            print(f"⚠️ Error fetching feedback data from API: {e}")
        
        # Fallback to local file
        try:
            feedback_file_path = os.path.join(os.path.dirname(__file__), 'live_feedback_data.json')
            print(f"📁 Falling back to local file: {feedback_file_path}")
            
            with open(feedback_file_path, 'r') as f:
                all_feedback = json.load(f)
                feedback_data = [fb for fb in all_feedback if fb.get('userId') == user_id]
                print(f"📊 Found {len(feedback_data)} feedback records in local file")
                return feedback_data
        except Exception as e:
            print(f"⚠️ Local file fallback also failed: {e}")
        
        return []
    
    def _handle_no_feedback(self, role, available_courses):
        """Handle users with no feedback data"""
        try:
            # Use role-based analysis instead
            courses_summary = self._summarize_courses(available_courses)
            
            prompt = f"""No feedback data available for {role}.

Available Courses: {courses_summary}

Based on common improvement areas for this role, suggest TOP 3 KEY SKILLS to develop.

Consider:
1. Typical performance improvement areas for {role}
2. Professional development standards
3. Skills commonly requested by managers for this role

Return JSON format:
{{
  "key_skills": [
    {{
      "skill_name": "skill name",
      "priority": "medium",
      "reasoning": "common improvement area for {role}",
      "feedback_source": "role-based analysis"
    }}
  ],
  "analysis_summary": "role-based recommendations due to no feedback data",
  "improvement_areas": "general professional development for {role}"
}}"""

            response = self.client.chat.completions.create(
                model=os.getenv("OPENROUTER_MODEL", "meta-llama/llama-3-8b-instruct"),
                messages=[
                    {"role": "system", "content": "You are a professional development expert. Provide role-based skill recommendations in valid JSON format."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=300,
                temperature=0.2
            )
            
            ai_response = response.choices[0].message.content.strip()
            
            # Clean and parse JSON
            if ai_response.startswith("```json"):
                ai_response = ai_response.replace("```json", "").replace("```", "").strip()
            
            # Additional cleaning for common LLM response patterns
            ai_response = ai_response.strip()
            if ai_response.startswith("Here is the analysis in JSON format:"):
                ai_response = ai_response.split(":", 1)[1].strip()
            
            # Find JSON content between curly braces
            import re
            json_match = re.search(r'\{.*\}', ai_response, re.DOTALL)
            if json_match:
                ai_response = json_match.group()
            
            result = json.loads(ai_response)
            
            return {
                "agent": "feedback_analysis",
                "confidence": "low",
                "analysis": result,
                "raw_data": {
                    "feedback_count": 0,
                    "role": role,
                    "has_feedback": False,
                    "analysis_type": "role_based"
                }
            }
            
        except Exception as e:
            print(f"❌ No feedback analysis error: {e}")
            return self._fallback_no_feedback(role)
    
    def _summarize_feedback(self, feedback_data):
        """Summarize feedback to prevent token overflow"""
        if not feedback_data:
            return "No feedback available"
        
        # Take latest feedback record
        latest = feedback_data[0] if feedback_data else {}
        
        summary_parts = []
        
        # Include numeric ratings if available
        if 'technicalSkills' in latest:
            summary_parts.append(f"Technical: {latest['technicalSkills']}/5")
        if 'communication' in latest:
            summary_parts.append(f"Communication: {latest['communication']}/5")
        if 'teamwork' in latest:
            summary_parts.append(f"Teamwork: {latest['teamwork']}/5")
        if 'problemSolving' in latest:
            summary_parts.append(f"Problem Solving: {latest['problemSolving']}/5")
        if 'initiative' in latest:
            summary_parts.append(f"Initiative: {latest['initiative']}/5")
        
        # Include goals if mentioned
        if 'goals' in latest and latest['goals']:
            summary_parts.append(f"Goals: {latest['goals'][:100]}")  # Limit to 100 chars
        
        # Include comments if available
        if 'comments' in latest and latest['comments']:
            summary_parts.append(f"Comments: {latest['comments'][:100]}")
        
        return "; ".join(summary_parts)
    
    def _summarize_courses(self, available_courses):
        """Summarize available courses to prevent token overflow"""
        course_summary = []
        for course in available_courses[:6]:  # Limit to 6 courses
            title = course.get('title', 'Unknown')
            skills = [s.get('name', '') for s in course.get('skills', [])][:2]  # Top 2 skills
            course_summary.append(f"{title} ({', '.join(skills)})")
        
        return "; ".join(course_summary)
    
    def _fallback_feedback_analysis(self, feedback_data, role):
        """Fallback analysis when LLM fails but feedback exists"""
        key_skills = []
        
        if feedback_data:
            latest = feedback_data[0]
            
            # Analyze numeric ratings to find low scores
            ratings = {
                'Technical Skills': latest.get('technicalSkills', 3),
                'Communication': latest.get('communication', 3),
                'Teamwork': latest.get('teamwork', 3),
                'Problem Solving': latest.get('problemSolving', 3),
                'Initiative': latest.get('initiative', 3)
            }
            
            # Find lowest rated skills
            low_skills = [(skill, score) for skill, score in ratings.items() if score < 3]
            low_skills.sort(key=lambda x: x[1])  # Sort by score
            
            for skill, score in low_skills[:3]:  # Top 3 lowest
                priority = "high" if score <= 2 else "medium"
                key_skills.append({
                    "skill_name": skill,
                    "priority": priority,
                    "reasoning": f"Rated {score}/5 in recent feedback",
                    "feedback_source": "manager feedback"
                })
            
            # Check for specific goals in feedback
            goals_text = latest.get('goals', '').lower()
            if 'statistical analysis with r' in goals_text or 'r' in goals_text:
                key_skills.append({
                    "skill_name": "Statistical Analysis with R",
                    "priority": "high",
                    "reasoning": "Specifically mentioned in feedback goals",
                    "feedback_source": "manager goals"
                })
            elif 'python' in goals_text and not any('python' in skill['skill_name'].lower() for skill in key_skills):
                key_skills.append({
                    "skill_name": "Python",
                    "priority": "high",
                    "reasoning": "Specifically mentioned in feedback goals",
                    "feedback_source": "manager goals"
                })
        
        return {
            "agent": "feedback_analysis",
            "confidence": "fallback",
            "analysis": {
                "key_skills": key_skills[:3],  # Limit to 3
                "analysis_summary": "Fallback analysis based on feedback ratings and goals",
                "improvement_areas": "Areas with ratings below 3/5"
            },
            "raw_data": {
                "feedback_count": len(feedback_data),
                "role": role,
                "has_feedback": True,
                "fallback_reason": "llm_unavailable"
            }
        }
    
    def _fallback_no_feedback(self, role):
        """Fallback for users with no feedback"""
        # Common professional development skills by role
        role_skills = {
            'data analyst': ['Data Visualization', 'SQL', 'Communication'],
            'junior data scientist': ['Machine Learning', 'Statistics', 'Python'],
            'data scientist': ['Machine Learning', 'Statistics', 'Python'],
            'data science team lead': ['Leadership', 'Technical Leadership', 'Strategic Thinking'],
            'team lead': ['Leadership', 'Technical Leadership', 'Strategic Thinking'],
            'lead': ['Mentoring', 'Technical Leadership', 'Project Management']
        }
        
        role_lower = role.lower()
        suggested_skills = []
        
        for role_key, skills in role_skills.items():
            if role_key in role_lower:
                for skill in skills:
                    suggested_skills.append({
                        "skill_name": skill,
                        "priority": "medium",
                        "reasoning": f"Common development area for {role}",
                        "feedback_source": "role-based analysis"
                    })
                break
        
        if not suggested_skills:
            suggested_skills = [
                {"skill_name": "Communication", "priority": "medium", "reasoning": "Universal professional skill", "feedback_source": "general"},
                {"skill_name": "Leadership", "priority": "medium", "reasoning": "Career advancement skill", "feedback_source": "general"}
            ]
        
        return {
            "agent": "feedback_analysis",
            "confidence": "low",
            "analysis": {
                "key_skills": suggested_skills[:3],
                "analysis_summary": "No feedback available - general recommendations based on role",
                "improvement_areas": f"Professional development for {role}"
            },
            "raw_data": {
                "feedback_count": 0,
                "role": role,
                "has_feedback": False,
                "fallback_reason": "no_feedback_and_llm_unavailable"
            }
        }

# Standalone function for easy import
def analyze_user_feedback(user_profile, available_courses):
    """Standalone function to analyze user feedback"""
    agent = FeedbackAnalysisAgent()
    return agent.analyze_feedback(user_profile, available_courses)

if __name__ == "__main__":
    # Test the feedback analysis agent with Alex Rodriguez (has feedback)
    alex_profile = {
        "userId": "tm001", 
        "name": "Alex Rodriguez",
        "role": "Junior Data Scientist"
    }
    
    test_courses = [
        {"title": "Statistical Analysis with R", "skills": [{"name": "R"}, {"name": "Statistics"}]},
        {"title": "Advanced Python for Data Science", "skills": [{"name": "Python"}]},
        {"title": "Machine Learning Fundamentals", "skills": [{"name": "Machine Learning"}]}
    ]
    
    print("🧪 Testing Feedback Analysis Agent with Alex Rodriguez (tm001)")
    print("Expected: Should find feedback with goals 'learn Statistical Analysis with R'")
    result = analyze_user_feedback(alex_profile, test_courses)
    print("Alex's Feedback Analysis Result:")
    print(json.dumps(result, indent=2))
    
    # Test with Jordan Kim (no feedback data)
    jordan_profile = {
        "userId": "tm003",
        "name": "Jordan Kim", 
        "role": "Data Analyst"
    }
    
    print("\n🧪 Testing with Jordan Kim (no feedback)")
    result_no_feedback = analyze_user_feedback(jordan_profile, test_courses)
    print("Jordan's No Feedback Analysis Result:")
    print(json.dumps(result_no_feedback, indent=2))
    
    # Test with Sarah Chen (Team Lead)
    sarah_profile = {
        "userId": "tm002",
        "name": "Sarah Chen",
        "role": "Data Science Team Lead"
    }
    
    print("\n🧪 Testing with Sarah Chen (Team Lead)")
    result_sarah = analyze_user_feedback(sarah_profile, test_courses)
    print("Sarah's Feedback Analysis Result:")
    print(json.dumps(result_sarah, indent=2))