"""
Feedback Analysis Agent - Agentic AI Component
Specialized LLM agent for analyzing user feedback and learning preferences
"""

import os
import json
from openai import OpenAI
from dotenv import load_dotenv

# Load environment
load_dotenv()

class FeedbackAnalysisAgent:
    def __init__(self):
        self.client = OpenAI(
            api_key=os.getenv("OPENROUTER_API_KEY"),
            base_url=os.getenv("OPENROUTER_API_BASE", "https://openrouter.ai/api/v1")
        )
        self.model = os.getenv("OPENROUTER_MODEL", "meta-llama/llama-3-8b-instruct")
    
    def analyze_feedback(self, user_profile, feedback_data, available_courses):
        """
        Analyze user feedback to determine learning preferences and course fit
        """
        try:
            # Process feedback data
            feedback_summary = ""
            if feedback_data and len(feedback_data) > 0:
                for feedback in feedback_data:
                    feedback_summary += f"""
Feedback Date: {feedback.get('date', 'Unknown')}
Technical Skills: {feedback.get('technicalSkills', 0)}/5
Communication: {feedback.get('communication', 0)}/5  
Teamwork: {feedback.get('teamwork', 0)}/5
Problem Solving: {feedback.get('problemSolving', 0)}/5
Initiative: {feedback.get('initiative', 0)}/5
Qualitative Feedback: {feedback.get('qualitativeFeedback', 'None')}
Areas for Improvement: {feedback.get('areasForImprovement', 'None')}
Goals: {feedback.get('goals', 'None')}
"""
            else:
                feedback_summary = "No feedback data available - will use general recommendations"
            
            # Course context for preference matching
            courses_info = ""
            for course in available_courses:
                courses_info += f"""
Course: {course['title']} (ID: {course['id']})
- Type: {course['difficulty']} level
- Duration: {course['duration']}
- Format: Online learning
- Skills Focus: {', '.join([skill['name'] for skill in course['skills']])}
"""

            prompt = f"""You are a Feedback Analysis AI agent specialized in learning style assessment and course preference matching.

USER PROFILE:
Name: {user_profile['name']}
Role: {user_profile['role']}

FEEDBACK HISTORY:
{feedback_summary}

AVAILABLE COURSES:
{courses_info}

TASK: Analyze feedback patterns to determine optimal learning approach and course preferences:

1. LEARNING STYLE ASSESSMENT:
   - Preferred learning methods (hands-on, theoretical, collaborative)
   - Strengths and weakness patterns
   - Optimal pace and difficulty progression

2. PERFORMANCE INSIGHTS:
   - Areas needing improvement from feedback
   - Consistent strengths to leverage
   - Learning challenges to address

3. COURSE PREFERENCE MATCHING:
   - Which courses match their learning style
   - Recommended delivery format
   - Suggested support mechanisms

Return JSON format:
{{
  "learning_profile": {{
    "preferred_style": "hands-on|theoretical|collaborative|mixed",
    "optimal_pace": "fast|moderate|slow",
    "strength_areas": ["problem_solving", "technical_skills"],
    "improvement_areas": ["communication", "teamwork"],
    "learning_confidence": "high|medium|low"
  }},
  "course_preferences": [
    {{
      "course_id": "course2",
      "suitability_score": 8,
      "learning_style_match": "high",
      "recommended_approach": "Start with foundational concepts, then hands-on projects",
      "support_needed": "minimal|moderate|high"
    }}
  ],
  "personalized_recommendations": {{
    "study_schedule": "intensive|regular|flexible",
    "collaboration_level": "solo|paired|group",
    "assessment_preference": "project|quiz|peer_review",
    "motivation_factors": ["career_advancement", "skill_building"]
  }},
  "risk_factors": [
    {{
      "factor": "time_management",
      "mitigation": "Structured timeline with milestones"
    }}
  ]
}}

Focus on actionable learning insights for {user_profile['role']}."""

            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are an expert Feedback Analysis AI agent. Provide personalized learning insights in valid JSON format."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=300,  # Reduced for cost optimization
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
                    "agent": "feedback_analysis",
                    "analysis": parsed_response,
                    "confidence": "high" if feedback_data else "medium"
                }
            except json.JSONDecodeError:
                return {
                    "agent": "feedback_analysis",
                    "analysis": {
                        "learning_profile": {
                            "preferred_style": "mixed",
                            "optimal_pace": "moderate", 
                            "strength_areas": ["technical_skills"],
                            "improvement_areas": ["communication"],
                            "learning_confidence": "medium"
                        },
                        "course_preferences": [],
                        "personalized_recommendations": {
                            "study_schedule": "regular",
                            "collaboration_level": "paired",
                            "assessment_preference": "project",
                            "motivation_factors": ["career_advancement"]
                        },
                        "risk_factors": []
                    },
                    "confidence": "low",
                    "error": "JSON parsing failed"
                }
                
        except Exception as e:
            print(f"Feedback Analysis Agent error: {e}")
            return {
                "agent": "feedback_analysis",
                "analysis": {
                    "learning_profile": {
                        "preferred_style": "mixed",
                        "optimal_pace": "moderate",
                        "strength_areas": [],
                        "improvement_areas": [],
                        "learning_confidence": "medium"
                    },
                    "course_preferences": [],
                    "personalized_recommendations": {
                        "study_schedule": "flexible",
                        "collaboration_level": "solo",
                        "assessment_preference": "quiz",
                        "motivation_factors": ["skill_building"]
                    },
                    "risk_factors": [
                        {"factor": "analysis_unavailable", "mitigation": "Use standard learning approach"}
                    ]
                },
                "confidence": "low",
                "error": str(e)
            }

# Test function for standalone usage  
def test_feedback_agent():
    """Test the Feedback Analysis Agent"""
    agent = FeedbackAnalysisAgent()
    
    # Sample user profile
    test_profile = {
        "name": "Sarah Chen",
        "role": "Data Science Team Lead"
    }
    
    # Sample feedback data
    test_feedback = [
        {
            "date": "2025-09-10",
            "technicalSkills": 4,
            "communication": 3,
            "teamwork": 4,
            "problemSolving": 5,
            "initiative": 4,
            "qualitativeFeedback": "Strong technical leader, needs to improve presentation skills",
            "areasForImprovement": "Public speaking and stakeholder communication",
            "goals": "Become senior technical architect"
        }
    ]
    
    # Sample courses
    test_courses = [
        {
            "id": "course2",
            "title": "Machine Learning Fundamentals",
            "difficulty": "Intermediate",
            "duration": "6 weeks",
            "skills": [{"name": "Machine Learning"}]
        }
    ]
    
    result = agent.analyze_feedback(test_profile, test_feedback, test_courses)
    print("Feedback Analysis Result:")
    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    test_feedback_agent()