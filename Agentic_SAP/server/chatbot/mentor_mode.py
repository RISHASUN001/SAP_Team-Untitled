import requests

# =========================
# Imports
# =========================
import os
import threading
import time
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.document_loaders import TextLoader
from langchain.text_splitter import CharacterTextSplitter
from openai import OpenAI

# =========================
# Environment Setup
# =========================
# Load .env from the main project directory
load_dotenv()

# =========================
# Flask App Setup
# =========================
app = Flask(__name__)
CORS(app)

# Store conversation context (in-memory for demo - use database in production)
conversation_store = {}

# =========================
# Helper Functions
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

# Load Chroma vector DB for context retrieval (smart incremental updates)
def load_chroma_vector_db(doc_folder):
    """Load ChromaDB and check for new documents to add incrementally"""
    embedding = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
    chroma_db_path = os.path.join(os.path.dirname(__file__), "chroma_db")
    metadata_file = os.path.join(chroma_db_path, "indexed_files.txt")
    
    # Get all current .txt files in documents folder
    current_files = set()
    for fname in os.listdir(doc_folder):
        if fname.endswith(".txt"):
            current_files.add(fname)
    
    if not current_files:
        print("❌ No .txt documents found in documents folder!")
        raise FileNotFoundError(f"No .txt files found in {doc_folder}")
    
    # Check if ChromaDB already exists
    if os.path.exists(chroma_db_path) and os.listdir(chroma_db_path):
        print("📂 Loading existing ChromaDB...")
        try:
            vectordb = Chroma(persist_directory=chroma_db_path, embedding_function=embedding)
            
            # Check what files were previously indexed
            indexed_files = set()
            if os.path.exists(metadata_file):
                with open(metadata_file, 'r') as f:
                    indexed_files = set(line.strip() for line in f.readlines())
            
            # Find new files that need to be added
            new_files = current_files - indexed_files
            
            if new_files:
                print(f"📄 Found {len(new_files)} new files to add: {list(new_files)}")
                
                # Load and add new documents
                new_docs = []
                for fname in new_files:
                    print(f"📖 Adding new document: {fname}")
                    loader = TextLoader(os.path.join(doc_folder, fname))
                    new_docs.extend(loader.load())
                
                # Split new documents into chunks
                splitter = CharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
                new_chunks = splitter.split_documents(new_docs)
                print(f"🔪 Created {len(new_chunks)} new chunks")
                
                # Add new chunks to existing ChromaDB
                vectordb.add_documents(new_chunks)
                print(f"➕ Added {len(new_chunks)} new chunks to existing ChromaDB")
                
                # Update the indexed files list
                with open(metadata_file, 'w') as f:
                    for fname in current_files:
                        f.write(f"{fname}\n")
                print("📝 Updated indexed files metadata")
            else:
                print("✅ No new files found - ChromaDB is up to date")
            
            # Test if it works
            test_docs = vectordb.similarity_search("test", k=1)
            print(f"✅ ChromaDB loaded successfully with {len(test_docs)} test results")
            return vectordb
            
        except Exception as e:
            print(f"⚠️ Error loading existing ChromaDB: {e}")
            print("🔄 Recreating ChromaDB from all documents...")
    
    # Create new ChromaDB from all documents
    print("📚 Creating ChromaDB from all documents...")
    docs = []
    for fname in current_files:
        print(f"📄 Loading document: {fname}")
        loader = TextLoader(os.path.join(doc_folder, fname))
        docs.extend(loader.load())
    
    print(f"📝 Splitting {len(docs)} documents into chunks...")
    splitter = CharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    chunks = splitter.split_documents(docs)
    print(f"🔪 Created {len(chunks)} chunks")
    
    # Create ChromaDB with persistence
    vectordb = Chroma.from_documents(chunks, embedding, persist_directory=chroma_db_path)
    print("💾 ChromaDB created and persisted successfully")
    
    # Save the list of indexed files
    os.makedirs(chroma_db_path, exist_ok=True)
    with open(metadata_file, 'w') as f:
        for fname in current_files:
            f.write(f"{fname}\n")
    print(f"📝 Saved metadata for {len(current_files)} indexed files")
    
    return vectordb

# =========================
# Vector DB & LLM Setup
# =========================
doc_folder = os.path.join(os.path.dirname(__file__), "documents")
vector_index = load_chroma_vector_db(doc_folder)

# LLM setup for OpenRouter/Ollama-compatible API
client = OpenAI(
    api_key=os.getenv("OPENROUTER_API_KEY"),
    base_url=os.getenv("OPENROUTER_API_BASE", "https://openrouter.ai/api/v1")
)

# =========================
# Flask Routes
# =========================
@app.route('/api/mentor-suggest', methods=['POST'])
def mentor_suggest():
    import time
    print("[mentor_mode.py] --- Mentor Suggest API called ---")
    start_time = time.time()
    data = request.json
    print(f"[mentor_mode.py] Raw POST data: {data}")
    message = data.get('message', '')
    user_id = data.get('user_id', 'default_user')  # Use session ID in production
    print(f"[mentor_mode.py] Extracted message: {message}")
    
    # Get or create conversation history for this user
    if user_id not in conversation_store:
        conversation_store[user_id] = {'messages': [], 'clarification_count': 0}
    
    # Add current message to conversation history (keep last 5)
    conversation_store[user_id]['messages'].append(message)
    if len(conversation_store[user_id]['messages']) > 5:
        conversation_store[user_id]['messages'] = conversation_store[user_id]['messages'][-5:]
    
    # Combine all previous inputs to understand full context
    full_context = " | ".join(conversation_store[user_id]['messages'])
    print(f"[mentor_mode.py] Full conversation context: {full_context}")
    print(f"[mentor_mode.py] Clarification count: {conversation_store[user_id]['clarification_count']}")
    
    print(f"[mentor_mode.py] Running vector search...")
    docs = vector_index.similarity_search(full_context, k=3)
    print(f"[mentor_mode.py] Vector search returned {len(docs)} docs.")
    context = "\n".join([doc.page_content for doc in docs])
    print(f"[mentor_mode.py] Context for prompt: {context}")
    
    # Enhanced prompt with clarification limit and sample analysis
    clarification_limit = 3
    clarifications_used = conversation_store[user_id]['clarification_count']
    
    # Check if user shared a sample/draft to review
    sample_indicators = ["here's what i plan to", "here's my draft", "here's the message", "this is what i wrote", "sample:", "draft:", "what do you think of", "how can i improve", "feedback on", "review this"]
    has_sample = any(indicator in full_context.lower() for indicator in sample_indicators)
    
    if clarifications_used >= clarification_limit:
        if has_sample:
            # Force giving sample critique after 3 clarifications
            prompt = (
                "You are a professional mentoring assistant and communication critic.\n"
                "Analyze the sample message/draft and provide specific, gentle feedback.\n\n"
                "Use the following knowledge base if relevant:\n"
                f"{context}\n\n"
                f"Full conversation: {full_context}\n\n"
                "Provide feedback in this format:\n"
                "**What works well:** [positive aspects]\n"
                "**Suggestions for improvement:** [gentle, specific suggestions]\n"
                "**Overall:** [supportive assessment]\n\n"
                "Be constructive, kind, and focus on tone, clarity, and empathy.\n"
                "Keep response under 300 words to avoid cutoffs."
            )
        else:
            # Force giving general suggestions after 3 clarifications
            prompt = (
                "You are a professional mentoring assistant.\n"
                "Provide 3 gentle, actionable suggestions based on our conversation.\n\n"
                "Use the following knowledge base if relevant:\n"
                f"{context}\n\n"
                f"Full conversation: {full_context}\n\n"
                "Format as:\n"
                "**1. [Suggestion title]:** [gentle, practical advice]\n"
                "**2. [Suggestion title]:** [gentle, practical advice]\n"
                "**3. [Suggestion title]:** [gentle, practical advice]\n\n"
                "Be supportive and encouraging. Keep under 300 words."
            )
    else:
        if has_sample:
            # Sample analysis mode with potential clarification
            prompt = (
                "You are a professional mentoring assistant and communication critic.\n"
                "The user shared a sample message for feedback.\n\n"
                "INSTRUCTIONS:\n"
                "- If you need important context (recipient relationship, situation details), ask 1-2 specific questions.\n"
                "- If you have enough context, provide gentle feedback on the sample.\n"
                "- Be conversational and supportive, avoid repetitive phrases.\n"
                "- Keep responses concise and under 300 words.\n\n"
                "Use the following knowledge base if relevant:\n"
                f"{context}\n\n"
                f"Conversation history: {full_context}\n"
                f"Latest message: {message}\n\n"
                "Either ask clarifying questions OR provide sample feedback - not both."
            )
        else:
            # General mentoring mode
            prompt = (
                "You are a professional mentoring assistant.\n"
                "Help users communicate more effectively with their team.\n\n"
                "INSTRUCTIONS:\n"
                "- FIRST analyze if you have enough context to give good advice.\n"
                "- If the situation is vague or you need important details, ask 1-2 specific clarifying questions.\n"
                "- Only provide suggestions when you have sufficient context.\n"
                "- Be conversational and supportive.\n"
                "- Keep all responses under 300 words.\n\n"
                "Use the following knowledge base if relevant:\n"
                f"{context}\n\n"
                f"Conversation history: {full_context}\n"
                f"Latest message: {message}\n\n"
                "ANALYZE: Do you need to understand more about the mistake, the relationship with Mary, or the workplace context before giving advice?\n"
                "- If YES: Ask specific, helpful questions.\n"
                "- If NO: Provide 3 gentle, actionable suggestions.\n"
            )
    print(f"[mentor_mode.py] Prompt sent to LLM:\n{prompt}")
    print(f"[mentor_mode.py] Waiting for LLM response...")
    llm_start = time.time()
    response = client.chat.completions.create(
        model=os.getenv("OPENROUTER_MODEL", "meta-llama/llama-3-8b-instruct"),
        messages=[{"role": "system", "content": prompt}],
        max_tokens=300  # Reduced to prevent cutoffs
    )
    llm_end = time.time()
    suggestions = response.choices[0].message.content
    
    # Check if this was a clarifying question (increment counter)
    if clarifications_used < clarification_limit and ("?" in suggestions or "clarify" in suggestions.lower() or "tell me" in suggestions.lower()):
        conversation_store[user_id]['clarification_count'] += 1
        print(f"[mentor_mode.py] Clarification question asked. Count: {conversation_store[user_id]['clarification_count']}")
    
    print(f"[mentor_mode.py] LLM response: {suggestions}")
    print(f"[mentor_mode.py] LLM response time: {llm_end - llm_start:.2f}s")
    print(f"[mentor_mode.py] --- Mentor Suggest API finished in {time.time() - start_time:.2f}s ---\n")
    return jsonify({"suggestions": suggestions})

@app.route('/api/mentor-reset', methods=['POST'])
def mentor_reset():
    """Reset conversation history for a specific user"""
    data = request.json
    user_id = data.get('user_id', 'default_user')
    
    # Clear conversation history for this user
    if user_id in conversation_store:
        conversation_store[user_id] = {'messages': [], 'clarification_count': 0}
        print(f"[mentor_mode.py] Conversation reset for user: {user_id}")
    
    return jsonify({"status": "reset_complete", "user_id": user_id})

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "OK"})
@app.route('/api/summarize-feedback', methods=['POST'])
def summarize_feedback():
    """
    NEW ENDPOINT: Summarize performance feedback using OpenRouter
    
    This endpoint securely handles feedback summarization on the server-side
    to avoid exposing API keys in client-side code.
    """
    print("[mentor_mode.py] --- Summarize Feedback API called ---")
    start_time = time.time()
    
    try:
        data = request.json
        feedback = data.get('feedback', '')
        
        if not feedback:
            return jsonify({"error": "No feedback provided"}), 400
        
        print(f"[mentor_mode.py] Feedback length: {len(feedback)} characters")
        
        # Construct the prompt for summarization
        prompt = (
            "You are a helpful assistant that summarizes performance feedback in a constructive, professional manner. "
            "Focus on the key points and provide actionable insights. Keep it concise and professional (around 150-200 words).\n\n"
            f"Summarize this performance feedback in a constructive way:\n\n{feedback}"
        )
        
        print(f"[mentor_mode.py] Sending summarization request to OpenRouter...")
        llm_start = time.time()
        
        # Use the existing OpenAI client setup
        response = client.chat.completions.create(
            model=os.getenv("OPENROUTER_MODEL", "meta-llama/llama-3-8b-instruct"),
            messages=[
                {
                    "role": "system",
                    "content": "You are a helpful assistant that summarizes performance feedback in a constructive, professional manner. Focus on the key points and provide actionable insights. Keep it concise and professional (around 150-200 words)."
                },
                {
                    "role": "user",
                    "content": f"Summarize this performance feedback in a constructive way:\n\n{feedback}"
                }
            ],
            max_tokens=500,
            temperature=0.7
        )
        
        llm_end = time.time()
        summary = response.choices[0].message.content
        
        print(f"[mentor_mode.py] Summary generated successfully")
        print(f"[mentor_mode.py] LLM response time: {llm_end - llm_start:.2f}s")
        print(f"[mentor_mode.py] --- Summarize Feedback API finished in {time.time() - start_time:.2f}s ---\n")
        
        return jsonify({"summary": summary})
        
    except Exception as e:
        print(f"[mentor_mode.py] Error in summarize_feedback: {str(e)}")
        return jsonify({"error": "Unable to generate summary at this time"}), 500
# =========================
# CLI Entry Point (when wanna test with this can just do python3 mentor_mode.py "your query here")
# =========================
if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1:
        query = sys.argv[1]
        context_docs = vector_index.similarity_search(query, k=3)
        context = "\n".join([doc.page_content for doc in context_docs])
        prompt = f"You are a helpful mentor. Use the following context to answer the user's query.\nContext:\n{context}\n\nQuery: {query}\n\nMentor Suggestion:"
        response = get_llm_response(prompt)
        print("Mentor Suggestion:", response)
    else:
        print("No CLI argument provided. Starting Flask server...")
        app.run(port=5001, debug=True)