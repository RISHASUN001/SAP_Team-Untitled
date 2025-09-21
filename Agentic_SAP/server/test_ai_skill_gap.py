"""
Test script to verify AI Skill Gap Analysis with course timeline recommendations
"""
import requests
import json

# Test data for Alex Rodriguez (has feedback)
alex_test_data = {
    "user_profile": {
        "userId": "tm001",
        "name": "Alex Rodriguez", 
        "role": "Junior Data Scientist",
        "experience": "2 years",
        "department": "Data Science",
        "skills": [
            {"name": "Python", "current_level": 2},
            {"name": "SQL", "current_level": 3},
            {"name": "Statistics", "current_level": 1}
        ],
        "currentGoals": ["Improve R skills", "Learn advanced statistics"]
    },
    "skill_gaps": [
        {"skill": "R", "current": 1, "target": 3, "gap": 2},
        {"skill": "Statistics", "current": 1, "target": 3, "gap": 2},
        {"skill": "Python", "current": 2, "target": 3, "gap": 1}
    ],
    "available_courses": [
        {
            "id": "course1",
            "title": "Statistical Analysis with R",
            "difficulty": "Intermediate",
            "duration": "6 weeks",
            "description": "Learn statistical analysis using R programming",
            "skills": [{"name": "R"}, {"name": "Statistics"}]
        },
        {
            "id": "course2", 
            "title": "Advanced Python for Data Science",
            "difficulty": "Advanced",
            "duration": "8 weeks",
            "description": "Master advanced Python techniques for data science",
            "skills": [{"name": "Python"}, {"name": "Data Science"}]
        },
        {
            "id": "course3",
            "title": "Machine Learning Fundamentals",
            "difficulty": "Intermediate", 
            "duration": "10 weeks",
            "description": "Introduction to machine learning concepts",
            "skills": [{"name": "Machine Learning"}, {"name": "Python"}]
        },
        {
            "id": "course4",
            "title": "Data Visualization with Tableau",
            "difficulty": "Beginner",
            "duration": "4 weeks", 
            "description": "Create effective data visualizations",
            "skills": [{"name": "Tableau"}, {"name": "Visualization"}]
        }
    ],
    "feedback_data": []  # Will be loaded by the service
}

def test_ai_skill_analysis():
    """Test the AI skill analysis endpoint"""
    url = "http://localhost:5004/api/ai-skill-analysis"
    
    print("🧪 Testing AI Skill Analysis for Alex Rodriguez...")
    print(f"📤 Making POST request to: {url}")
    
    try:
        response = requests.post(url, json=alex_test_data, timeout=30)
        
        print(f"📥 Response Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ SUCCESS! Got AI recommendations:")
            print(f"📊 User: {result.get('user_profile', {}).get('name', 'Unknown')}")
            
            ai_recommendations = result.get('ai_recommendations', {})
            print(f"🎯 Strategic Advice: {ai_recommendations.get('strategic_advice', 'None')}")
            print(f"⏱️ Timeline: {ai_recommendations.get('estimated_timeline', 'None')}")
            
            print("\n📚 RECOMMENDED COURSE SEQUENCE:")
            recommended_sequence = ai_recommendations.get('recommended_sequence', [])
            
            if recommended_sequence:
                for i, course in enumerate(recommended_sequence, 1):
                    print(f"\n{i}. {course.get('course_title', 'Unknown Course')}")
                    print(f"   Course ID: {course.get('course_id', 'Unknown')}")
                    print(f"   Reasoning: {course.get('reasoning', 'No reasoning provided')}")
                    print(f"   Timing: {course.get('timing_advice', 'No timing advice')}")
                    print(f"   Agent Influence: {course.get('agent_influence', 'Unknown')}")
            else:
                print("❌ No course recommendations found!")
                
            print(f"\n🤖 Agent Metadata:")
            metadata = ai_recommendations.get('agentic_metadata', {})
            print(f"   Agents Used: {metadata.get('agents_used', [])}")
            print(f"   Coordination Success: {metadata.get('coordination_success', False)}")
            
        else:
            print(f"❌ Error: {response.status_code}")
            print(f"Response: {response.text}")
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Request failed: {e}")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_ai_skill_analysis()