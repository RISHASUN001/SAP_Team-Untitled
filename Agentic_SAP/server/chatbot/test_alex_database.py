#!/usr/bin/env python3
"""
Test AI skill extraction with Alex Rodriguez persona from the database
"""
import json
from feedback_analysis_agent import FeedbackAnalysisAgent

def test_alex_rodriguez_database():
    """Test the AI extraction system with Alex Rodriguez persona"""
    
    # Alex Rodriguez profile from the database
    alex_profile = {
        "userId": "tm001",
        "name": "Alex Rodriguez", 
        "role": "Junior Data Scientist"
    }
    
    # Realistic feedback scenarios for Alex Rodriguez (Junior Data Scientist)
    test_scenarios = [
        {
            "name": "Manager Feedback - Python & ML Focus",
            "feedback": [
                {
                    "date": "2024-09-15",
                    "technicalSkills": 2,
                    "communication": 4,
                    "teamwork": 4,
                    "problemSolving": 3,
                    "initiative": 4,
                    "qualitativeFeedback": "Alex shows great enthusiasm for learning and good collaboration skills. However, there are some technical gaps that need addressing.",
                    "areasForImprovement": "Python programming fundamentals, Machine Learning algorithms, and Statistical analysis",
                    "goals": "Master Python programming, learn TensorFlow for deep learning projects, and improve data visualization skills with Matplotlib"
                }
            ]
        },
        {
            "name": "Manager Feedback - Database & Cloud Skills",
            "feedback": [
                {
                    "date": "2024-08-15", 
                    "technicalSkills": 1,
                    "communication": 5,
                    "teamwork": 4,
                    "problemSolving": 2,
                    "initiative": 3,
                    "qualitativeFeedback": "Alex has excellent communication and works well with the team. Main challenge is building up technical foundation.",
                    "areasForImprovement": "SQL database management, AWS cloud computing, and Docker containerization",
                    "goals": "Learn advanced SQL queries, get AWS certification, and understand MLOps pipeline development"
                }
            ]
        },
        {
            "name": "Manager Feedback - Data Science Stack",
            "feedback": [
                {
                    "date": "2024-07-15",
                    "technicalSkills": 2,
                    "communication": 4,
                    "teamwork": 5,
                    "problemSolving": 3,
                    "initiative": 4,
                    "qualitativeFeedback": "Alex is a team player with strong initiative. Ready to take on more complex data science challenges with proper skill development.",
                    "areasForImprovement": "Pandas data manipulation, Scikit-learn model development, and Jupyter notebook best practices",
                    "goals": "Build end-to-end machine learning projects, master data preprocessing techniques, and learn feature engineering"
                }
            ]
        }
    ]
    
    # Initialize agent
    agent = FeedbackAnalysisAgent()
    
    # Available courses focused on Alex's skill gaps
    available_courses = [
        {
            "id": "py-001",
            "title": "Python Programming for Data Science",
            "difficulty": "beginner",
            "duration": "6 weeks",
            "skills": [{"name": "Python"}, {"name": "Programming"}, {"name": "Data Science"}],
            "description": "Comprehensive Python programming course tailored for data science applications"
        },
        {
            "id": "ml-001", 
            "title": "Machine Learning Fundamentals",
            "difficulty": "intermediate",
            "duration": "8 weeks",
            "skills": [{"name": "Machine Learning"}, {"name": "Scikit-learn"}, {"name": "Statistical Analysis"}],
            "description": "Introduction to machine learning algorithms and practical implementation"
        },
        {
            "id": "tf-001",
            "title": "Deep Learning with TensorFlow",
            "difficulty": "advanced",
            "duration": "10 weeks", 
            "skills": [{"name": "TensorFlow"}, {"name": "Deep Learning"}, {"name": "Neural Networks"}],
            "description": "Advanced deep learning course using TensorFlow framework"
        },
        {
            "id": "sql-001",
            "title": "SQL for Data Analysis",
            "difficulty": "intermediate", 
            "duration": "4 weeks",
            "skills": [{"name": "SQL"}, {"name": "Database"}, {"name": "Data Analysis"}],
            "description": "Master SQL queries for data analysis and database management"
        },
        {
            "id": "aws-001",
            "title": "AWS Cloud Computing Essentials",
            "difficulty": "intermediate",
            "duration": "6 weeks",
            "skills": [{"name": "AWS"}, {"name": "Cloud Computing"}, {"name": "MLOps"}],
            "description": "Learn AWS services for machine learning and data pipeline deployment"
        },
        {
            "id": "pd-001",
            "title": "Pandas Data Manipulation",
            "difficulty": "beginner",
            "duration": "3 weeks",
            "skills": [{"name": "Pandas"}, {"name": "Data Manipulation"}, {"name": "Python"}],
            "description": "Master data manipulation and analysis using Pandas library"
        }
    ]
    
    print("🧪 Testing Alex Rodriguez Database Persona")
    print("=" * 60)
    print(f"👤 Profile: {alex_profile['name']} ({alex_profile['role']})")
    print(f"📊 Database Skills: Python (1/5), SQL (1/5)")
    print(f"🎯 Skill Gaps: Machine Learning, Deep Learning, Statistics, TensorFlow")
    print("=" * 60)
    
    for scenario in test_scenarios:
        print(f"\n🔍 Testing Scenario: {scenario['name']}")
        print("-" * 50)
        
        try:
            # Process feedback with AI extraction
            result = agent.analyze_feedback(
                user_profile=alex_profile,
                feedback_data=scenario['feedback'],
                available_courses=available_courses
            )
            
            print(f"✅ Analysis completed successfully")
            
            if isinstance(result, dict) and 'analysis' in result:
                analysis = result['analysis']
                
                # Show AI-extracted skills
                improvement_areas = analysis.get('improvement_areas', [])
                print(f"🎯 AI-Extracted Skills: {improvement_areas}")
                
                # Show course recommendations
                course_preferences = analysis.get('course_preferences', [])
                if course_preferences:
                    print(f"📚 Top 3 Recommended Courses:")
                    for i, course in enumerate(course_preferences[:3], 1):
                        print(f"   {i}. {course['course_title']} (Score: {course.get('skill_match_score', 'N/A')})")
                        if 'matched_skills' in course:
                            print(f"      Matched Skills: {course['matched_skills']}")
                        print(f"      Priority: {course.get('feedback_priority', 'N/A')}")
                
                # Show learning insights
                learning_profile = analysis.get('learning_profile', {})
                if learning_profile:
                    print(f"🧠 Learning Style: {learning_profile.get('preferred_style', 'Unknown')}")
                    print(f"⚡ Optimal Pace: {learning_profile.get('optimal_pace', 'Unknown')}")
                
                # Show feedback-specific insights
                feedback_insights = analysis.get('feedback_specific_insights', {})
                if feedback_insights:
                    mentioned_skills = feedback_insights.get('mentioned_skills', [])
                    priority_courses = feedback_insights.get('priority_courses', [])
                    print(f"🚨 High-Priority Skills: {mentioned_skills}")
                    print(f"🎓 Priority Course IDs: {priority_courses}")
                
            else:
                print(f"⚠️ Unexpected result format: {type(result)}")
                
        except Exception as e:
            print(f"❌ Test failed: {e}")
            import traceback
            traceback.print_exc()
        
        print("-" * 50)
    
    print(f"\n🏁 Alex Rodriguez Database Testing Completed!")
    print("=" * 60)

if __name__ == "__main__":
    test_alex_rodriguez_database()