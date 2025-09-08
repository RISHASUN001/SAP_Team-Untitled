import requests
import os
import json
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain.schema import Document
from openai import OpenAI

# =========================
# Environment Setup
# =========================
# Load .env from the main project directory
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '..', '.env'))

# =========================
# Course Data Setup
# =========================
# Import course data from the frontend (we'll simulate it here)
COURSES_DATA = [
    {
        "id": "course1",
        "title": "Advanced Python for Data Science",
        "skills": [{"name": "Python", "level": 3}],
        "description": "Master advanced Python programming techniques specifically for data science applications.",
        "recommendedForRoles": ["Junior Data Scientist", "Data Analyst", "Data Science Team Lead"],
        "difficulty": "Advanced",
        "duration": "8 weeks",
        "estimatedHours": 40
    },
    {
        "id": "course2",
        "title": "Advanced Machine Learning",
        "skills": [{"name": "Machine Learning", "level": 3}],
        "description": "Master advanced machine learning techniques including ensemble methods, feature engineering, and model optimization.",
        "recommendedForRoles": ["Data Science Team Lead"],
        "difficulty": "Advanced",
        "duration": "8 weeks",
        "estimatedHours": 40
    },
    {
        "id": "course3",
        "title": "Deep Learning with TensorFlow",
        "skills": [{"name": "Deep Learning", "level": 3}, {"name": "TensorFlow", "level": 2}],
        "description": "Build and deploy deep learning models using TensorFlow framework.",
        "recommendedForRoles": ["Junior Data Scientist", "Data Science Team Lead"],
        "difficulty": "Advanced",
        "duration": "10 weeks",
        "estimatedHours": 50
    },
    {
        "id": "course4",
        "title": "SQL for Data Analysis",
        "skills": [{"name": "SQL", "level": 3}],
        "description": "Master advanced SQL queries for complex data analysis and reporting.",
        "recommendedForRoles": ["Data Analyst", "Junior Data Scientist"],
        "difficulty": "Intermediate",
        "duration": "4 weeks",
        "estimatedHours": 20
    },
    {
        "id": "course5",
        "title": "Data Visualization with Tableau",
        "skills": [{"name": "Tableau", "level": 3}],
        "description": "Create compelling data visualizations and interactive dashboards.",
        "recommendedForRoles": ["Data Analyst", "Junior Data Scientist"],
        "difficulty": "Beginner",
        "duration": "3 weeks",
        "estimatedHours": 15
    },
    {
        "id": "course6",
        "title": "Cloud Computing for Data Science",
        "skills": [{"name": "Cloud Computing", "level": 2}, {"name": "AWS", "level": 2}],
        "description": "Deploy data science solutions on cloud platforms like AWS.",
        "recommendedForRoles": ["Data Science Team Lead", "Junior Data Scientist"],
        "difficulty": "Intermediate",
        "duration": "6 weeks",
        "estimatedHours": 35
    },
    {
        "id": "course7",
        "title": "MLOps and Model Deployment",
        "skills": [{"name": "MLOps", "level": 3}, {"name": "Docker", "level": 2}],
        "description": "Learn to deploy and maintain machine learning models in production.",
        "recommendedForRoles": ["Data Science Team Lead", "Junior Data Scientist"],
        "difficulty": "Advanced",
        "duration": "8 weeks",
        "estimatedHours": 45
    },
    {
        "id": "course8",
        "title": "Statistical Analysis with R",
        "skills": [{"name": "R", "level": 3}, {"name": "Statistics", "level": 3}],
        "description": "Perform advanced statistical analysis using R programming language.",
        "recommendedForRoles": ["Data Analyst", "Junior Data Scientist"],
        "difficulty": "Beginner",
        "duration": "5 weeks",
        "estimatedHours": 25
    },
    {
        "id": "course9",
        "title": "Introduction to Data Science",
        "skills": [{"name": "Python", "level": 1}, {"name": "Statistics", "level": 1}],
        "description": "Get started with data science fundamentals and basic Python programming.",
        "recommendedForRoles": ["Data Analyst"],
        "difficulty": "Beginner",
        "duration": "2 weeks",
        "estimatedHours": 10
    },
    {
        "id": "course10",
        "title": "Advanced Data Engineering",
        "skills": [{"name": "Python", "level": 3}, {"name": "Apache Spark", "level": 3}, {"name": "SQL", "level": 3}],
        "description": "Build scalable data pipelines and engineering solutions for big data.",
        "recommendedForRoles": ["Data Science Team Lead"],
        "difficulty": "Advanced",
        "duration": "12 weeks",
        "estimatedHours": 60
    },
    {
        "id": "course11",
        "title": "Business Intelligence with Power BI",
        "skills": [{"name": "Power BI", "level": 3}, {"name": "DAX", "level": 2}],
        "description": "Create comprehensive business intelligence solutions using Microsoft Power BI.",
        "recommendedForRoles": ["Data Analyst"],
        "difficulty": "Intermediate",
        "duration": "4 weeks",
        "estimatedHours": 20
    },
    {
        "id": "course12",
        "title": "Machine Learning Operations (MLOps) Fundamentals",
        "skills": [{"name": "MLOps", "level": 2}, {"name": "Git", "level": 2}, {"name": "CI/CD", "level": 2}],
        "description": "Learn the fundamentals of MLOps including version control, continuous integration, and model deployment.",
        "recommendedForRoles": ["Junior Data Scientist", "Data Science Team Lead"],
        "difficulty": "Intermediate",
        "duration": "6 weeks",
        "estimatedHours": 30
    }
]

# =========================
# Helper Functions
# =========================
def create_course_vector_db():
    """Create a vector database from course data for semantic search"""
    documents = []
    for course in COURSES_DATA:
        # Create searchable content from course data
        skills_text = ", ".join([skill["name"] for skill in course["skills"]])
        roles_text = ", ".join(course["recommendedForRoles"])
        
        content = f"""
        Title: {course["title"]}
        Description: {course["description"]}
        Skills: {skills_text}
        Difficulty: {course["difficulty"]}
        Duration: {course["duration"]}
        Recommended for: {roles_text}
        """
        
        doc = Document(
            page_content=content.strip(),
            metadata={
                "course_id": course["id"],
                "title": course["title"],
                "difficulty": course["difficulty"],
                "duration": course["duration"]
            }
        )
        documents.append(doc)
    
    # Use same embedding model as mentor_mode.py for consistency
    embedding = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
    vectordb = Chroma.from_documents(documents, embedding, persist_directory="course_chroma_db")
    return vectordb

# Get LLM response using same pattern as mentor_mode.py
def get_course_recommendations(query, relevant_courses):
    """Get AI-powered course recommendations based on natural language query"""
    client = OpenAI(
        api_key=os.getenv("OPENROUTER_API_KEY"),
        base_url=os.getenv("OPENROUTER_API_BASE", "https://openrouter.ai/api/v1")
    )
    
    # Create context from relevant courses
    courses_context = ""
    for course in relevant_courses:
        skills_text = ", ".join([skill["name"] for skill in course["skills"]])
        courses_context += f"""
        Course: {course["title"]}
        Skills: {skills_text}
        Difficulty: {course["difficulty"]}
        Duration: {course["duration"]}
        Description: {course["description"]}
        ---
        """
    
    # Enhanced prompt for learning goals conversation
    prompt = f"""You are an AI career and learning advisor specializing in data science.

Available courses in our database:
{courses_context}

User query: "{query}"

IMPORTANT RULES:
- ONLY recommend courses that are listed above in the "Available courses" section
- Use the EXACT course titles as shown above
- Do NOT invent or suggest courses that are not in the list
- If a user asks for something we don't have, suggest the closest alternatives from our available courses

ANALYZE the user's intent and respond accordingly:

1. If asking about SPECIFIC COURSES/SKILLS (e.g., "Python for beginners", "machine learning"):
   - Recommend 2-4 most relevant courses from the available list
   - Use exact course titles from above
   - Explain why they match their needs
   - Suggest a learning sequence if multiple courses are relevant

2. If asking about CAREER GOALS (e.g., "I want to get promoted", "become a data scientist"):
   - Provide strategic learning roadmap using only available courses
   - Recommend multiple courses that align with career progression
   - Include timeline suggestions

3. If asking about LEARNING PATH (e.g., "where should I start", "what's next"):
   - Suggest optimal learning sequence using available courses only
   - Explain dependencies between skills/courses
   - Recommend 2-3 complementary courses when possible

IMPORTANT: When multiple relevant courses are available, recommend several (2-4) to give users good options. Always use numbered lists for multiple recommendations.

Keep response under 250 words, conversational, and actionable. Focus on practical career advancement using ONLY the courses listed above."""

    try:
        response = client.chat.completions.create(
            model=os.getenv("OPENROUTER_MODEL", "meta-llama/llama-3-8b-instruct"),
            messages=[
                {"role": "system", "content": "You are an expert AI learning advisor. Provide strategic, career-focused course recommendations."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=250,  # Slightly increased for career advice
            temperature=0.3
        )
        return response.choices[0].message.content
    except Exception as e:
        return f"Error getting AI recommendation: {str(e)}"

# =========================
# Flask App Setup
# =========================
app = Flask(__name__)
CORS(app)

# Initialize vector database
course_vector_db = create_course_vector_db()

# =========================
# Flask Routes
# =========================
@app.route('/api/course-search', methods=['POST'])
def course_search():
    """Natural language course search endpoint"""
    print("[course_search.py] --- Course Search API called ---")
    
    data = request.json
    query = data.get('query', '').strip()
    
    if not query:
        return jsonify({"error": "Query is required"}), 400
    
    print(f"[course_search.py] Search query: {query}")
    
    # Vector search for relevant courses (similar to mentor_mode.py)
    docs = course_vector_db.similarity_search(query, k=6)  # Increased from 4 to 6
    print(f"[course_search.py] Found {len(docs)} relevant courses")
    
    # Extract course IDs from search results
    relevant_course_ids = [doc.metadata["course_id"] for doc in docs]
    relevant_courses = [course for course in COURSES_DATA if course["id"] in relevant_course_ids]
    
    # Sort by relevance and take top courses
    # For advanced ML queries, also include related advanced courses
    if any(keyword in query.lower() for keyword in ["advanced", "machine learning", "ml", "deep learning", "modeling"]):
        # Add more advanced courses that might be relevant
        additional_courses = []
        for course in COURSES_DATA:
            if course["id"] not in relevant_course_ids:
                # Check if it's an advanced course related to ML/data science
                if (course["difficulty"].lower() == "advanced" and 
                    any(skill["name"].lower() in ["machine learning", "deep learning", "mlops", "tensorflow", "python"] 
                        for skill in course["skills"])):
                    additional_courses.append(course)
        
        # Add up to 2 additional relevant advanced courses
        relevant_courses.extend(additional_courses[:2])
    
    print(f"[course_search.py] Total relevant courses after enhancement: {len(relevant_courses)}")
    
    # Get AI-powered recommendation
    ai_recommendation = get_course_recommendations(query, relevant_courses)
    
    response_data = {
        "query": query,
        "ai_recommendation": ai_recommendation,
        "relevant_courses": relevant_courses[:4],  # Increased limit from 3 to 4
        "total_found": len(relevant_courses)
    }
    
    print(f"[course_search.py] Returning {len(relevant_courses)} courses")
    return jsonify(response_data)

@app.route('/api/course-search/health', methods=['GET'])
def health():
    return jsonify({"status": "Course Search API OK"})

# =========================
# CLI Entry Point
# =========================
if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1:
        query = sys.argv[1]
        docs = course_vector_db.similarity_search(query, k=3)
        relevant_course_ids = [doc.metadata["course_id"] for doc in docs]
        relevant_courses = [course for course in COURSES_DATA if course["id"] in relevant_course_ids]
        
        print(f"Query: {query}")
        print(f"Found {len(relevant_courses)} relevant courses:")
        for course in relevant_courses:
            print(f"- {course['title']} ({course['difficulty']})")
        
        ai_rec = get_course_recommendations(query, relevant_courses)
        print(f"\nAI Recommendation:\n{ai_rec}")
    else:
        print("Starting Course Search API server...")
        app.run(port=5002, debug=True)
