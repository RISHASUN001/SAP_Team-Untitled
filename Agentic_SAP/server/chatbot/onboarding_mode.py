"""
Onboarding Mode Chatbot for SAP Data Science Department
Handles general questions about the department, processes, and onboarding information
Uses LangChain Chroma for vector search and retrieval-augmented generation (RAG)
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import logging
from datetime import datetime
import requests
from typing import List, Dict, Any
from dotenv import load_dotenv
from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.document_loaders import TextLoader
from langchain.text_splitter import CharacterTextSplitter
from openai import OpenAI

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Conversation storage for context management
conversation_store = {}

# =========================
# Helper Functions (same as mentor_mode.py)
# =========================

# Get LLM response from OpenRouter
def get_llm_response(prompt):
    api_url = "https://openrouter.ai/api/v1/chat/completions"
    api_key = os.getenv("OPENROUTER_API_KEY")
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    data = {
        "model": "meta-llama/llama-3-8b-instruct",
        "messages": [
            {"role": "user", "content": prompt}
        ]
    }
    response = requests.post(api_url, headers=headers, json=data)
    if response.status_code == 200:
        result = response.json()
        return result["choices"][0]["message"]["content"]
    else:
        return f"Error: {response.status_code} {response.text}"

# Load existing Chroma vector DB (onboarding mode just connects to existing DB)
def load_chroma_vector_db(doc_folder):
    """Load existing ChromaDB created by mentor_mode.py"""
    embedding = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
    chroma_db_path = os.path.join(os.path.dirname(__file__), "chroma_db")
    
    # Check if ChromaDB exists (should be created by mentor_mode.py)
    if os.path.exists(chroma_db_path) and os.listdir(chroma_db_path):
        logger.info("📂 Loading existing ChromaDB created by mentor_mode...")
        try:
            vectordb = Chroma(persist_directory=chroma_db_path, embedding_function=embedding)
            # Test if it works
            test_docs = vectordb.similarity_search("test", k=1)
            logger.info(f"✅ ChromaDB loaded successfully with {len(test_docs)} test results")
            return vectordb
        except Exception as e:
            logger.error(f"⚠️ Error loading ChromaDB: {e}")
            logger.error("💡 Make sure mentor_mode.py has been run first to create the ChromaDB")
            raise Exception("ChromaDB not found. Please run mentor_mode.py first to initialize the vector database.")
    else:
        logger.error("❌ ChromaDB not found!")
        logger.error("💡 Please run mentor_mode.py first to create the vector database")
        raise FileNotFoundError("ChromaDB not found. Please run mentor_mode.py first to initialize the vector database.")

def _is_work_relevant(user_message: str) -> bool:
    """Check if the user message is relevant to work/SAP topics"""
    user_lower = user_message.lower()
    
    # Work-related keywords
    work_keywords = [
        'sap', 'team', 'work', 'job', 'career', 'onboarding', 'training', 'project', 
        'technology', 'tool', 'platform', 'data science', 'machine learning', 'ai',
        'department', 'manager', 'colleague', 'meeting', 'process', 'policy',
        'skill', 'development', 'learning', 'certification', 'performance', 'review',
        'office', 'remote', 'schedule', 'deadline', 'goal', 'objective', 'mentor',
        'mentoring', 'feedback', 'collaboration', 'communication', 'leadership',
        'python', 'sql', 'analytics', 'cloud', 'database', 'software', 'programming',
        'code', 'development', 'engineering', 'research', 'innovation', 'product',
        'customer', 'business', 'strategy', 'planning', 'reporting', 'analysis'
    ]
    
    # Non-work keywords that indicate personal/irrelevant topics
    irrelevant_keywords = [
        'personal life', 'family', 'relationship', 'dating', 'marriage', 'divorce',
        'religion', 'politics', 'weather', 'sports', 'entertainment', 'movie', 'music',
        'food', 'cooking', 'recipe', 'vacation', 'travel', 'hobby', 'gaming', 'tv show',
        'celebrity', 'gossip', 'health', 'medical', 'doctor', 'medicine', 'fitness',
        'diet', 'weight', 'appearance', 'fashion', 'shopping', 'money', 'finance',
        'investment', 'stock', 'cryptocurrency', 'bitcoin'
    ]
    
    # Check for irrelevant topics first
    if any(keyword in user_lower for keyword in irrelevant_keywords):
        return False
    
    # Check for work-related topics
    if any(keyword in user_lower for keyword in work_keywords):
        return True
    
    # If it's a general question that could be work-related, allow it
    question_words = ['what', 'how', 'when', 'where', 'who', 'why', 'can', 'should', 'do', 'does']
    if any(user_lower.startswith(qw) for qw in question_words) and len(user_message.split()) <= 20:
        return True
    
    # Default to allowing if uncertain (benefit of the doubt)
    return True

def _generate_suggestions(user_message: str, docs) -> List[str]:
    """Generate follow-up suggestions based on user message and context"""
    user_lower = user_message.lower()
    suggestions = []
    
    # Topic-based suggestions
    if any(keyword in user_lower for keyword in ['onboarding', 'new']):
        suggestions = [
            "What should I prepare for my first week?",
            "Who will be my mentor during onboarding?",
            "What training materials should I review?"
        ]
    elif any(keyword in user_lower for keyword in ['tool', 'technology']):
        suggestions = [
            "Are there training resources for these tools?",
            "What development environment should I set up?"
        ]
    elif any(keyword in user_lower for keyword in ['career', 'growth']):
        suggestions = [
            "What are the career progression paths?",
            "How does the performance review process work?",
            "What learning opportunities are available?"
        ]
    else:
        # General suggestions
        suggestions = [
            "Tell me about the team structure",
            "What should I know for my first week?",
            "What tools and technologies do we use?",
            "What career development opportunities exist?"
        ]
    
    return suggestions[:3]  # Return top 3 suggestions

# =========================
# Vector DB & LLM Setup
# =========================
doc_folder = os.path.join(os.path.dirname(__file__), "documents")
vector_index = load_chroma_vector_db(doc_folder)

# LLM setup for OpenRouter
client = OpenAI(
    api_key=os.getenv("OPENROUTER_API_KEY"),
    base_url=os.getenv("OPENROUTER_API_BASE", "https://openrouter.ai/api/v1")
)

# =========================
# Flask Routes
# =========================

@app.route('/api/onboarding-chat', methods=['POST'])
def onboarding_chat():
    """Handle general chat/onboarding questions"""
    try:
        data = request.get_json()
        user_message = data.get('message', '').strip()
        user_id = data.get('user_id', 'default_user')
        
        if not user_message:
            return jsonify({'error': 'Message is required'}), 400
        
        logger.info(f"Onboarding chat request from {user_id}: {user_message}")
        
        # Check if the question is relevant to SAP or work
        if not _is_work_relevant(user_message):
            return jsonify({
                'response': "This question doesn't seem to be related to SAP Data Science Department or work. Please ask questions about onboarding, team structure, processes, tools, or other work-related topics.",
                'suggestions': [
                    "Tell me about the team structure",
                    "What should I know for my first week?",
                    "What tools and technologies do we use?"
                ],
                'sources': [],
                'timestamp': datetime.now().isoformat()
            })
        
        # Get conversation history
        if user_id not in conversation_store:
            conversation_store[user_id] = []
        
        conversation_history = conversation_store[user_id]
        
        # Search for relevant documents using vector similarity
        docs = vector_index.similarity_search(user_message, k=3)
        
        # If no relevant documents found (low similarity), return specific message
        if not docs:
            return jsonify({
                'response': "No relevant information found. Please contact HR for more information or ask questions specifically related to the SAP Data Science Department.",
                'suggestions': [
                    "Tell me about the team structure",
                    "What should I know for my first week?",
                    "What tools and technologies do we use?"
                ],
                'sources': [],
                'timestamp': datetime.now().isoformat()
            })
        
        # Build context from retrieved documents
        context = "\n\n".join([doc.page_content for doc in docs])
        
        # Create system prompt with strict instructions
        system_prompt = f"""You are an AI assistant helping new employees with onboarding at SAP's Data Science Department. 

IMPORTANT INSTRUCTIONS:
1. ONLY answer based on the provided context information below
2. If the context doesn't contain relevant information to answer the question, respond with EXACTLY: "No relevant information found"
3. Keep responses under 250 tokens
4. Be helpful and encouraging when you have relevant information
5. Include specific details from the context when available

Context Information:
{context}

Guidelines:
- Answer ONLY from the provided context
- If context doesn't have the answer, say "No relevant information found"
- Be concise but helpful
- Include specific team names, tools, or processes when mentioned in context
- Maintain a professional, supportive tone
"""

        # Generate response using OpenRouter
        ai_response = None
        if client:
            try:
                response = client.chat.completions.create(
                    model=os.getenv("OPENROUTER_MODEL", "meta-llama/llama-3-8b-instruct"),
                    messages=[{"role": "system", "content": system_prompt}, {"role": "user", "content": user_message}],
                    max_tokens=250,
                    temperature=0.3
                )
                ai_response = response.choices[0].message.content.strip()
            except Exception as e:
                logger.error(f"Error calling LLM: {str(e)}")
        
        # Fallback to get_llm_response if client fails
        if not ai_response:
            prompt = f"{system_prompt}\n\nUser Question: {user_message}"
            ai_response = get_llm_response(prompt)
        
        # If still no response, use basic fallback
        if not ai_response or "No relevant information found" in ai_response:
            ai_response = "No relevant information found. Please contact HR for more information or ask questions specifically related to the SAP Data Science Department."
        
        # Update conversation history
        conversation_history.extend([
            {"role": "user", "content": user_message},
            {"role": "assistant", "content": ai_response}
        ])
        # Keep only last 6 messages
        if len(conversation_history) > 6:
            conversation_history = conversation_history[-6:]
        conversation_store[user_id] = conversation_history
        
        # Generate suggestions only if we provided useful information
        suggestions = []
        if "No relevant information found" not in ai_response:
            suggestions = _generate_suggestions(user_message, docs)
        else:
            suggestions = [
                "Tell me about the team structure",
                "What should I know for my first week?",
                "What tools and technologies do we use?"
            ]
        
        return jsonify({
            'response': ai_response,
            'suggestions': suggestions,
            'sources': [f"Document: {doc.metadata.get('source', 'SAP Onboarding Guide')}" for doc in docs] if docs else [],
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error in onboarding chat: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/onboarding-reset', methods=['POST'])
def reset_onboarding_conversation():
    """Reset conversation history"""
    try:
        data = request.get_json()
        user_id = data.get('user_id', 'default_user')
        
        if user_id in conversation_store:
            del conversation_store[user_id]
        logger.info(f"Reset conversation for user: {user_id}")
        
        return jsonify({'message': 'Conversation reset successfully'})
            
    except Exception as e:
        logger.error(f"Error resetting conversation: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/search-docs', methods=['POST'])
def search_documents():
    """Search onboarding documents directly"""
    try:
        data = request.get_json()
        query = data.get('query', '').strip()
        top_k = data.get('top_k', 3)
        
        if not query:
            return jsonify({'error': 'Query is required'}), 400
        
        logger.info(f"Document search request: {query}")
        
        # Search documents
        docs = vector_index.similarity_search(query, k=top_k)
        
        results = []
        for doc in docs:
            results.append({
                'content': doc.page_content[:300] + "...",  # Truncate for preview
                'metadata': doc.metadata,
                'source': doc.metadata.get('source', 'Unknown')
            })
        
        return jsonify({
            'query': query,
            'results': results,
            'count': len(results)
        })
        
    except Exception as e:
        logger.error(f"Error searching documents: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'onboarding_mode',
        'timestamp': datetime.now().isoformat(),
        'vector_db_loaded': vector_index is not None
    })

# =========================
# CLI Entry Point (when you wanna test with this can just do python3 onboarding_mode.py "your query here")
# =========================
if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1:
        query = sys.argv[1]
        context_docs = vector_index.similarity_search(query, k=3)
        context = "\n".join([doc.page_content for doc in context_docs])
        prompt = f"You are a helpful onboarding assistant for SAP Data Science Department. Use the following context to answer the user's query.\nContext:\n{context}\n\nQuery: {query}\n\nOnboarding Response:"
        response = get_llm_response(prompt)
        print("Onboarding Response:", response)
    else:
        print("No CLI argument provided. Starting Flask server...")
        logger.info("🤖 Starting SAP Data Science Onboarding Chatbot...")
        logger.info(f"📚 Documents loaded from: {doc_folder}")
        logger.info(f"📄 Vector database initialized with ChromaDB")
        
        app.run(
            host='0.0.0.0',
            port=5003,  # Different port for onboarding mode
            debug=True
        )
