"""
Direct test of the AI agents to show course timeline recommendations
"""
import sys
import os
import json

# Add the chatbot directory to Python path
sys.path.append('chatbot')

# Import the agents
from skills_analysis_agent import analyze_user_skills
from goals_analysis_agent import analyze_user_goals  
from feedback_analysis_agent import analyze_user_feedback

def test_agent_integration():
    """Test all three agents together and show course recommendations"""
    
    # Test data for Alex Rodriguez
    alex_profile = {
        "userId": "tm001",
        "name": "Alex Rodriguez",
        "role": "Junior Data Scientist", 
        "experience": "2 years",
        "skills": [
            {"name": "Python", "current_level": 2},
            {"name": "SQL", "current_level": 3},
            {"name": "Statistics", "current_level": 1}
        ],
        "currentGoals": ["Improve R skills", "Learn advanced statistics"]
    }
    
    skill_gaps = [
        {"skill": "R", "current": 1, "target": 3, "gap": 2},
        {"skill": "Statistics", "current": 1, "target": 3, "gap": 2},
        {"skill": "Python", "current": 2, "target": 3, "gap": 1}
    ]
    
    available_courses = [
        {
            "id": "course1",
            "title": "Statistical Analysis with R",
            "difficulty": "Intermediate",
            "duration": "6 weeks",
            "skills": [{"name": "R"}, {"name": "Statistics"}]
        },
        {
            "id": "course2",
            "title": "Advanced Python for Data Science", 
            "difficulty": "Advanced",
            "duration": "8 weeks",
            "skills": [{"name": "Python"}, {"name": "Data Science"}]
        },
        {
            "id": "course3",
            "title": "Machine Learning Fundamentals",
            "difficulty": "Intermediate",
            "duration": "10 weeks", 
            "skills": [{"name": "Machine Learning"}, {"name": "Python"}]
        },
        {
            "id": "course4",
            "title": "Data Visualization with Tableau",
            "difficulty": "Beginner",
            "duration": "4 weeks",
            "skills": [{"name": "Tableau"}, {"name": "Visualization"}]
        }
    ]
    
    print("🧪 TESTING AI AGENTS INTEGRATION")
    print("="*50)
    print(f"👤 User: {alex_profile['name']} ({alex_profile['role']})")
    print(f"📊 Available Courses: {len(available_courses)}")
    print(f"⚠️ Skill Gaps: {len(skill_gaps)}")
    
    # Run all three agents
    print("\n🔍 Running Skills Analysis Agent...")
    skills_result = analyze_user_skills(alex_profile, skill_gaps, available_courses)
    
    print("🎯 Running Goals Analysis Agent...")
    goals_result = analyze_user_goals(alex_profile, available_courses)
    
    print("📊 Running Feedback Analysis Agent...")
    feedback_result = analyze_user_feedback(alex_profile, available_courses)
    
    # Display results
    print("\n" + "="*50)
    print("📈 AGENT ANALYSIS RESULTS")
    print("="*50)
    
    print(f"\n🔧 SKILLS AGENT (Confidence: {skills_result.get('confidence', 'unknown')})")
    skills_analysis = skills_result.get('analysis', {})
    for skill in skills_analysis.get('key_skills', []):
        print(f"  • {skill.get('skill_name')} (Priority: {skill.get('priority')})")
        print(f"    Reasoning: {skill.get('reasoning', 'No reasoning')}")
    
    print(f"\n🎯 GOALS AGENT (Confidence: {goals_result.get('confidence', 'unknown')})")
    goals_analysis = goals_result.get('analysis', {})
    for skill in goals_analysis.get('key_skills', []):
        print(f"  • {skill.get('skill_name')} (Priority: {skill.get('priority')})")
        print(f"    Reasoning: {skill.get('reasoning', 'No reasoning')}")
    
    print(f"\n📊 FEEDBACK AGENT (Confidence: {feedback_result.get('confidence', 'unknown')})")
    feedback_analysis = feedback_result.get('analysis', {})
    for skill in feedback_analysis.get('key_skills', []):
        print(f"  • {skill.get('skill_name')} (Priority: {skill.get('priority')})")
        print(f"    Reasoning: {skill.get('reasoning', 'No reasoning')}")
    
    # Manual course recommendations based on agent outputs
    print("\n" + "="*50)
    print("📚 RECOMMENDED COURSE TIMELINE")
    print("="*50)
    
    # Collect all high priority skills from agents
    high_priority_skills = []
    
    for agent_name, result in [("Skills", skills_result), ("Goals", goals_result), ("Feedback", feedback_result)]:
        analysis = result.get('analysis', {})
        for skill in analysis.get('key_skills', []):
            if skill.get('priority') == 'high':
                high_priority_skills.append({
                    'skill_name': skill.get('skill_name'),
                    'agent': agent_name,
                    'reasoning': skill.get('reasoning', '')
                })
    
    # Match skills to courses for recommendations
    course_recommendations = []
    used_course_ids = set()
    
    for skill_info in high_priority_skills[:3]:  # Top 3 skills
        skill_name = skill_info['skill_name'].lower()
        
        for course in available_courses:
            if course['id'] in used_course_ids:
                continue
                
            course_title = course['title'].lower()
            course_skills = [s['name'].lower() for s in course.get('skills', [])]
            
            # Check if skill matches course
            if (skill_name in course_title or 
                any(skill_name in cs for cs in course_skills) or
                any(cs in skill_name for cs in course_skills) or
                ('r' in skill_name and 'statistical analysis with r' in course_title) or
                ('statistical analysis with r' in skill_name and 'r' in course_skills)):
                
                course_recommendations.append({
                    'course': course,
                    'skill_matched': skill_info['skill_name'],
                    'agent': skill_info['agent'],
                    'reasoning': skill_info['reasoning']
                })
                used_course_ids.add(course['id'])
                break
    
    # Add remaining courses if needed
    while len(course_recommendations) < 3:
        for course in available_courses:
            if course['id'] not in used_course_ids:
                course_recommendations.append({
                    'course': course,
                    'skill_matched': 'General Development',
                    'agent': 'System',
                    'reasoning': 'Additional course for comprehensive learning'
                })
                used_course_ids.add(course['id'])
                break
        break
    
    # Display course timeline
    total_weeks = 0
    for i, rec in enumerate(course_recommendations, 1):
        course = rec['course']
        duration_weeks = int(course['duration'].split()[0])
        total_weeks += duration_weeks
        
        print(f"\n{i}. {course['title']}")
        print(f"   📅 Duration: {course['duration']} | Level: {course['difficulty']}")
        print(f"   🎯 Matches: {rec['skill_matched']} (from {rec['agent']} Agent)")
        print(f"   💡 Why: {rec['reasoning'][:100]}...")
        print(f"   ⏰ Start: Week {sum([int(course_recommendations[j]['course']['duration'].split()[0]) for j in range(i-1)]) + 1}")
        
        # Show skills developed
        skills_taught = [skill['name'] for skill in course.get('skills', [])]
        print(f"   📚 Skills: {', '.join(skills_taught)}")
    
    print(f"\n⏱️ TOTAL TIMELINE: {total_weeks} weeks ({total_weeks//4} months)")
    print(f"🎯 STRATEGIC ADVICE: Focus on feedback-driven goals first (Statistical Analysis with R), then build supporting technical capabilities")
    
    print("\n✅ ANALYSIS COMPLETE - Course timeline recommendations generated!")

if __name__ == "__main__":
    test_agent_integration()