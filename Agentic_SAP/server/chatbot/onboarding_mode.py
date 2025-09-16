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
    """Check if the user message is relevant to SAP/work topics"""
    user_lower = user_message.lower()
    
    # SAP-specific keywords (high priority)
    sap_keywords = [
        'sap', 's/4hana', 's4hana', 'erp', 'btp', 'business technology platform',
        'hana', 'fiori', 'ariba', 'concur', 'successfactors', 'fieldglass',
        'analytics cloud', 'data intelligence', 'integration suite', 'commerce cloud',
        'sales cloud', 'service cloud', 'marketing cloud', 'customer experience',
        'cx', 'crm', 'customer relationship management', 'leonardo', 'ai core',
        'launchpad', 'workflow', 'process orchestration', 'master data governance',
        'data warehouse cloud', 'datasphere', 'event mesh', 'api management'
    ]
    
    # Work-related keywords (medium priority)
    work_keywords = [
        'team', 'work', 'job', 'career', 'onboarding', 'training', 'project', 
        'technology', 'tool', 'platform', 'data science', 'machine learning', 'ai',
        'department', 'manager', 'colleague', 'meeting', 'process', 'policy',
        'skill', 'development', 'learning', 'certification', 'performance', 'review',
        'office', 'remote', 'schedule', 'deadline', 'goal', 'objective', 'mentor',
        'mentoring', 'feedback', 'collaboration', 'communication', 'leadership',
        'python', 'sql', 'analytics', 'cloud', 'database', 'software', 'programming',
        'code', 'development', 'engineering', 'research', 'innovation', 'product',
        'customer', 'business', 'strategy', 'planning', 'reporting', 'analysis',
        'enterprise', 'solution', 'implementation', 'integration', 'architecture'
    ]
    
    # Business and enterprise keywords
    business_keywords = [
        'supply chain', 'procurement', 'finance', 'accounting', 'hr', 'human resources',
        'sales', 'marketing', 'service', 'operations', 'manufacturing', 'retail',
        'logistics', 'warehouse', 'inventory', 'planning', 'forecasting', 'budgeting',
        'compliance', 'governance', 'security', 'privacy', 'gdpr', 'audit'
    ]
    
    # Non-work keywords that indicate personal/irrelevant topics
    irrelevant_keywords = [
        'personal life', 'family', 'relationship', 'dating', 'marriage', 'divorce',
        'religion', 'politics', 'weather', 'sports', 'entertainment', 'movie', 'music',
        'food', 'cooking', 'recipe', 'vacation', 'travel', 'hobby', 'gaming', 'tv show',
        'celebrity', 'gossip', 'health', 'medical', 'doctor', 'medicine', 'fitness',
        'diet', 'weight', 'appearance', 'fashion', 'shopping', 'personal finance',
        'investment', 'stock', 'cryptocurrency', 'bitcoin', 'lottery', 'gambling'
    ]
    
    # Check for irrelevant topics first (strong negative signal)
    if any(keyword in user_lower for keyword in irrelevant_keywords):
        return False
    
    # Check for SAP-specific topics (highest priority)
    if any(keyword in user_lower for keyword in sap_keywords):
        return True
    
    # Check for work-related topics (medium priority)
    if any(keyword in user_lower for keyword in work_keywords):
        return True
    
    # Check for business keywords (medium priority)
    if any(keyword in user_lower for keyword in business_keywords):
        return True
    
    # If it's a general question that could be work-related, allow it
    question_words = ['what', 'how', 'when', 'where', 'who', 'why', 'can', 'should', 'do', 'does', 'tell', 'explain', 'describe']
    if any(user_lower.startswith(qw) for qw in question_words) and len(user_message.split()) <= 25:
        return True
    
    # Default to allowing if uncertain (benefit of the doubt for work context)
    return True

def _generate_suggestions(user_message: str, docs) -> List[str]:
    """Generate follow-up suggestions based on user message and context"""
    user_lower = user_message.lower()
    suggestions = []
    
    # SAP Product-specific suggestions
    if any(keyword in user_lower for keyword in ['btp', 'business technology platform']):
        suggestions = [
            "What services are available in SAP BTP?",
            "How do I develop applications on BTP?",
            "What is SAP HANA Cloud and how is it used?"
        ]
    elif any(keyword in user_lower for keyword in ['erp', 's/4hana', 's4hana']):
        suggestions = [
            "What modules are available in S/4HANA?",
            "How does real-time analytics work in S/4HANA?",
            "What's the difference between ERP and S/4HANA?"
        ]
    elif any(keyword in user_lower for keyword in ['cx', 'customer experience', 'sales cloud', 'service cloud']):
        suggestions = [
            "What is SAP Customer Experience suite?",
            "How do Sales Cloud and Service Cloud work together?",
            "What data science applications exist in CX?"
        ]
    elif any(keyword in user_lower for keyword in ['analytics', 'data science', 'machine learning']):
        suggestions = [
            "What analytics tools does SAP provide?",
            "How is machine learning integrated in SAP products?",
            "What is SAP Analytics Cloud used for?"
        ]
    elif any(keyword in user_lower for keyword in ['onboarding', 'new', 'first week']):
        suggestions = [
            "What SAP products should I learn first?",
            "What training is available for new employees?",
            "Who will be my mentor during onboarding?"
        ]
    elif any(keyword in user_lower for keyword in ['tool', 'technology', 'platform']):
        suggestions = [
            "What SAP development tools should I use?",
            "How do I access SAP systems and platforms?",
            "What's the architecture of SAP solutions?"
        ]
    elif any(keyword in user_lower for keyword in ['career', 'growth', 'development']):
        suggestions = [
            "What career paths exist in SAP data science?",
            "What SAP certifications should I pursue?",
            "How can I specialize in specific SAP products?"
        ]
    elif any(keyword in user_lower for keyword in ['integration', 'api', 'connectivity']):
        suggestions = [
            "How do SAP products integrate with each other?",
            "What integration technologies does SAP use?",
            "How do I connect external systems to SAP?"
        ]
    else:
        # General SAP-focused suggestions
        suggestions = [
            "What are the main SAP products I should know?",
            "How does SAP support digital transformation?",
            "What makes SAP's approach to enterprise software unique?",
            "How do I get started with SAP development?"
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
                'response': "This question doesn't seem to be related to SAP products, data science, or work. Please ask questions about SAP solutions like BTP (Business Technology Platform), ERP/S/4HANA, Customer Experience (CX), onboarding, or other SAP-related topics.",
                'suggestions': [
                    "What are the main SAP products I should know?",
                    "Tell me about SAP Business Technology Platform (BTP)",
                    "How does data science apply to SAP solutions?"
                ],
                'sources': [],
                'timestamp': datetime.now().isoformat()
            })
        
        # Get conversation history
        if user_id not in conversation_store:
            conversation_store[user_id] = []
        
        conversation_history = conversation_store[user_id]
        
        # Use vector search with cosine similarity to find most relevant chunks
        docs_with_scores = vector_index.similarity_search_with_score(user_message, k=5)
        
        # Filter documents based on similarity threshold (0.0 = identical, 2.0 = completely different for cosine)
        similarity_threshold = 1.5  # More lenient threshold
        relevant_docs = [(doc, score) for doc, score in docs_with_scores if score < similarity_threshold]
        
        if not relevant_docs:
            return jsonify({
                'response': "No relevant information found. Please contact HR for more information or ask questions specifically related to SAP products, the Data Science Department, or SAP's technology platform.",
                'suggestions': [
                    "What are the main SAP products I should learn?",
                    "Tell me about SAP's Business Technology Platform",
                    "How is data science used in SAP solutions?"
                ],
                'sources': [],
                'timestamp': datetime.now().isoformat()
            })
        
        # Build concise context from only the most relevant chunks
        context_parts = []
        total_chars = 0
        max_context_chars = 1500  # Strict limit
        
        for doc, score in relevant_docs:
            # Only include the most relevant part of each document
            content = doc.page_content
            
            # If the document is long, try to find the most relevant paragraph
            if len(content) > 300:
                # Split into sentences and find those most relevant to the query
                sentences = content.split('. ')
                query_keywords = set(user_message.lower().split())
                
                # Score sentences based on keyword overlap
                sentence_scores = []
                for sentence in sentences:
                    sentence_lower = sentence.lower()
                    overlap = len([word for word in query_keywords if word in sentence_lower])
                    sentence_scores.append((sentence, overlap))
                
                # Take top sentences up to 300 chars
                sentence_scores.sort(key=lambda x: x[1], reverse=True)
                selected_text = ""
                for sentence, _ in sentence_scores:
                    if len(selected_text + sentence) < 300:
                        selected_text += sentence + ". "
                    else:
                        break
                content = selected_text.strip()
            
            if total_chars + len(content) <= max_context_chars:
                context_parts.append(content)
                total_chars += len(content)
            else:
                # Add partial content to fit within limit
                remaining_chars = max_context_chars - total_chars
                if remaining_chars > 100:  # Only add if meaningful amount
                    context_parts.append(content[:remaining_chars] + "...")
                break
        
        context = "\n\n".join(context_parts)
        docs = [doc for doc, score in relevant_docs]  # For compatibility with rest of code
        
        # Create concise system prompt focused on SAP products
        system_prompt = f"""You are a SAP Data Science onboarding assistant. Focus on BTP, ERP/S/4HANA, CX solutions.

RULES:
1. Answer ONLY from context below
2. If no relevant info, say "No relevant information found"
3. Keep under 150 words
4. Emphasize SAP products and data science applications

Context: {context}

Be concise, helpful, and SAP-focused."""

        # Generate response using OpenRouter
        ai_response = None
        if client:
            try:
                response = client.chat.completions.create(
                    model=os.getenv("OPENROUTER_MODEL", "meta-llama/llama-3-8b-instruct"),
                    messages=[{"role": "system", "content": system_prompt}, {"role": "user", "content": user_message}],
                    max_tokens=150,
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
            ai_response = "No relevant information found. Please contact HR for more information or ask questions specifically related to SAP products, data science applications, or the SAP Data Science Department."
        
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
                "What are the main SAP products I should learn?",
                "Tell me about SAP's Business Technology Platform",
                "How is data science applied in SAP solutions?"
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
        
        # Use smart context selection for CLI too
        docs_with_scores = vector_index.similarity_search_with_score(query, k=5)
        print(f"DEBUG: Found {len(docs_with_scores)} documents with scores:")
        for i, (doc, score) in enumerate(docs_with_scores):
            print(f"  Doc {i+1}: Score {score:.3f}, Source: {doc.metadata.get('source', 'Unknown')}")
            print(f"    Preview: {doc.page_content[:100]}...")
        
        relevant_docs = [(doc, score) for doc, score in docs_with_scores if score < 1.5]
        print(f"DEBUG: After filtering, {len(relevant_docs)} documents meet threshold")
        
        if not relevant_docs:
            print("No relevant information found for your query (all documents above similarity threshold).")
            print("Trying with most similar document anyway...")
            relevant_docs = docs_with_scores[:1]  # Use best match anyway
        
        # Build very concise context for CLI
        context_parts = []
        for doc, score in relevant_docs[:1]:  # Use only the best match
            content = doc.page_content[:200]  # Very short for CLI
            context_parts.append(content)
        
        context = context_parts[0] if context_parts else "No relevant context"
        
        prompt = f"""SAP assistant. Context: {context}

Q: {query}
A:"""
        
        response = get_llm_response(prompt)
        print("SAP Onboarding Response:", response)
    else:
        print("No CLI argument provided. Starting Flask server...")
        logger.info("🤖 Starting SAP Data Science Onboarding Chatbot with SAP Products Focus...")
        logger.info(f"📚 SAP product documents loaded from: {doc_folder}")
        logger.info(f"📄 Vector database initialized with SAP knowledge base")
        logger.info("🎯 Focused on: BTP, ERP/S/4HANA, CX Solutions, Analytics Cloud, HANA")
        
        app.run(
            host='0.0.0.0',
            port=5003,  # Different port for onboarding mode
            debug=True
        )
