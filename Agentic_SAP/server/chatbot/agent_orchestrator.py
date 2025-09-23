"""
Agent Orchestrator - Agentic AI Coordination Layer
Manages the flow between multiple AI agents for comprehensive course recommendations
"""

import os
import json
import asyncio
from concurrent.futures import ThreadPoolExecutor
from skills_analysis_agent import SkillsAnalysisAgent
from goals_analysis_agent import GoalsAnalysisAgent  
from feedback_analysis_agent import FeedbackAnalysisAgent

class AgentOrchestrator:
    def __init__(self):
        self.skills_agent = SkillsAnalysisAgent()
        self.goals_agent = GoalsAnalysisAgent()
        self.feedback_agent = FeedbackAnalysisAgent()
        
    def get_user_feedback_data(self, user_id):
        """
        Retrieve user feedback data (integrate with existing feedback system)
        """
        # This would integrate with the FeedbackContext system
        # For now, return empty list - to be integrated with actual feedback API
        try:
            # TODO: Integrate with actual feedback API endpoint
            # feedback_response = requests.get(f'http://localhost:3001/api/feedback/{user_id}')
            # return feedback_response.json()
            return []
        except:
            return []
    
    def orchestrate_agents(self, user_profile, skill_gaps, available_courses):
        """
        Coordinate all AI agents to provide comprehensive analysis
        """
        try:
            print("🚀 Starting agentic AI analysis...")
            
            # Get user feedback data
            user_feedback = self.get_user_feedback_data(user_profile.get('userId', ''))
            
            # Run all agents in parallel for efficiency
            with ThreadPoolExecutor(max_workers=3) as executor:
                # Submit all agent tasks
                skills_future = executor.submit(
                    self.skills_agent.analyze_skills, 
                    user_profile, 
                    available_courses
                )
                
                goals_future = executor.submit(
                    self.goals_agent.analyze_goals,
                    user_profile,
                    user_feedback,
                    available_courses
                )
                
                feedback_future = executor.submit(
                    self.feedback_agent.analyze_feedback,
                    user_profile,
                    user_feedback,
                    available_courses
                )
                
                # Collect results
                skills_analysis = skills_future.result()
                goals_analysis = goals_future.result()
                feedback_analysis = feedback_future.result()
            
            print("✅ All agents completed analysis")
            
            # Combine agent outputs
            combined_analysis = {
                "agent_outputs": {
                    "skills_analysis": skills_analysis,
                    "goals_analysis": goals_analysis,
                    "feedback_analysis": feedback_analysis
                },
                "coordination_metadata": {
                    "total_agents": 3,
                    "successful_agents": sum([
                        1 for analysis in [skills_analysis, goals_analysis, feedback_analysis]
                        if analysis.get("confidence") != "low"
                    ]),
                    "analysis_timestamp": self._get_timestamp()
                }
            }
            
            return combined_analysis
            
        except Exception as e:
            print(f"❌ Agent orchestration error: {e}")
            return {
                "agent_outputs": {
                    "skills_analysis": {"agent": "skills_analysis", "analysis": {}, "confidence": "low", "error": str(e)},
                    "goals_analysis": {"agent": "goals_analysis", "analysis": {}, "confidence": "low", "error": str(e)},
                    "feedback_analysis": {"agent": "feedback_analysis", "analysis": {}, "confidence": "low", "error": str(e)}
                },
                "coordination_metadata": {
                    "total_agents": 3,
                    "successful_agents": 0,
                    "analysis_timestamp": self._get_timestamp(),
                    "error": str(e)
                }
            }
    
    def _get_timestamp(self):
        """Get current timestamp for metadata"""
        from datetime import datetime
        return datetime.now().isoformat()
    
    def extract_course_priorities(self, combined_analysis):
        """
        Extract prioritized course recommendations from all agent outputs
        """
        try:
            # Initialize priority scores for each course
            course_scores = {}
            
            # Extract skills-based priorities
            skills_analysis = combined_analysis["agent_outputs"]["skills_analysis"]["analysis"]
            if "skill_priorities" in skills_analysis:
                for priority in skills_analysis["skill_priorities"]:
                    skill_name = priority.get("skill_name", "")
                    priority_rank = priority.get("priority_rank", 5)
                    # Find courses that teach this skill
                    # This would be enhanced with course-skill mapping
                    
            # Extract goals-based priorities  
            goals_analysis = combined_analysis["agent_outputs"]["goals_analysis"]["analysis"]
            if "goal_course_alignment" in goals_analysis:
                for alignment in goals_analysis["goal_course_alignment"]:
                    course_id = alignment.get("course_id", "")
                    alignment_score = alignment.get("alignment_score", 5)
                    if course_id not in course_scores:
                        course_scores[course_id] = {"total_score": 0, "factors": []}
                    course_scores[course_id]["total_score"] += alignment_score
                    course_scores[course_id]["factors"].append("goals_alignment")
            
            # Extract feedback-based preferences
            feedback_analysis = combined_analysis["agent_outputs"]["feedback_analysis"]["analysis"]
            if "course_preferences" in feedback_analysis:
                for preference in feedback_analysis["course_preferences"]:
                    course_id = preference.get("course_id", "")
                    suitability_score = preference.get("suitability_score", 5)
                    if course_id not in course_scores:
                        course_scores[course_id] = {"total_score": 0, "factors": []}
                    course_scores[course_id]["total_score"] += suitability_score
                    course_scores[course_id]["factors"].append("learning_style_match")
            
            # Sort courses by combined score
            sorted_courses = sorted(
                course_scores.items(),
                key=lambda x: x[1]["total_score"],
                reverse=True
            )
            
            return {
                "prioritized_courses": sorted_courses,
                "scoring_factors": ["skills_priority", "goals_alignment", "learning_style_match"]
            }
            
        except Exception as e:
            print(f"❌ Course priority extraction error: {e}")
            return {
                "prioritized_courses": [],
                "scoring_factors": [],
                "error": str(e)
            }

# Test function for orchestrator
def test_orchestrator():
    """Test the Agent Orchestrator"""
    orchestrator = AgentOrchestrator()
    
    # Sample test data
    test_profile = {
        "userId": "mgr001",
        "name": "Sarah Chen",
        "role": "Data Science Team Lead",
        "skills": [
            {"name": "Python", "rating": 3},
            {"name": "Machine Learning", "rating": 2}
        ]
    }
    
    test_gaps = [
        {"name": "Deep Learning", "level": 3},
        {"name": "MLOps", "level": 2}
    ]
    
    test_courses = [
        {
            "id": "course2",
            "title": "Machine Learning Fundamentals",
            "difficulty": "Intermediate",
            "duration": "6 weeks",
            "skills": [{"name": "Machine Learning", "level": 3}],
            "description": "Core ML concepts"
        }
    ]
    
    # Test orchestration
    result = orchestrator.orchestrate_agents(test_profile, test_gaps, test_courses)
    print("🔄 Orchestration Result:")
    print(json.dumps(result, indent=2))
    
    # Test course prioritization
    priorities = orchestrator.extract_course_priorities(result)
    print("\n📊 Course Priorities:")
    print(json.dumps(priorities, indent=2))

if __name__ == "__main__":
    test_orchestrator()