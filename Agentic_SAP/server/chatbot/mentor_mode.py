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
load_dotenv()

# =========================
# Flask App Setup
# =========================
app = Flask(__name__)
CORS(app)

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

# Load Chroma vector DB for context retrieval
def load_chroma_vector_db(doc_folder):
    docs = []
    for fname in os.listdir(doc_folder):
        if fname.endswith(".txt"):
            loader = TextLoader(os.path.join(doc_folder, fname))
            docs.extend(loader.load())
    splitter = CharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    chunks = splitter.split_documents(docs)
    # Use HuggingFaceEmbeddings for vector search
    embedding = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
    vectordb = Chroma.from_documents(chunks, embedding, persist_directory="chroma_db")
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
    print(f"[mentor_mode.py] Extracted message: {message}")
    print(f"[mentor_mode.py] Running vector search...")
    docs = vector_index.similarity_search(message, k=3)
    print(f"[mentor_mode.py] Vector search returned {len(docs)} docs.")
    context = "\n".join([doc.page_content for doc in docs])
    print(f"[mentor_mode.py] Context for prompt: {context}")
    prompt = (
        "You are a professional mentoring assistant.\n"
        "Your job is to help users communicate more effectively and empathetically with their team.\n"
        "If you need more information, ask 1-2 clarifying questions.\n"
        "Use the following context from the knowledge base if relevant:\n"
        f"{context}\n"
        f"User message: {message}\n"
        "Analyze the user's intent and provide 3 actionable, soft-skill-focused suggestions for mentoring.\n"
        "Be concise, practical, and use a friendly, supportive tone."
    )
    print(f"[mentor_mode.py] Prompt sent to LLM:\n{prompt}")
    print(f"[mentor_mode.py] Waiting for LLM response...")
    llm_start = time.time()
    response = client.chat.completions.create(
        model=os.getenv("OPENROUTER_MODEL", "meta-llama/llama-3-8b-instruct"),
        messages=[{"role": "system", "content": prompt}],
        max_tokens=350
    )
    llm_end = time.time()
    suggestions = response.choices[0].message.content
    print(f"[mentor_mode.py] LLM response: {suggestions}")
    print(f"[mentor_mode.py] LLM response time: {llm_end - llm_start:.2f}s")
    print(f"[mentor_mode.py] --- Mentor Suggest API finished in {time.time() - start_time:.2f}s ---\n")
    return jsonify({"suggestions": suggestions})

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "OK"})

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