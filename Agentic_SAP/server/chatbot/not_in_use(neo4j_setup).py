
import os
import hashlib
from langchain_community.graphs import Neo4jGraph
from langchain_community.vectorstores import Neo4jVector
from langchain_community.document_loaders import TextLoader
from langchain.text_splitter import CharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
from dotenv import load_dotenv

load_dotenv()

NEO4J_URI = os.getenv("NEO4J_URI")
NEO4J_USERNAME = os.getenv("NEO4J_USERNAME")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD")
STATE_FILE = ".neo4j_docs_state"

def get_docs_state(doc_folder):
    """Return a hash representing the state of all .txt files in the folder (names + mtimes)."""
    state = []
    for fname in sorted(os.listdir(doc_folder)):
        if fname.endswith(".txt"):
            path = os.path.join(doc_folder, fname)
            mtime = os.path.getmtime(path)
            state.append(f"{fname}:{mtime}")
    state_str = "|".join(state)
    return hashlib.sha256(state_str.encode()).hexdigest()

def load_and_split_documents(doc_folder):
    docs = []
    for fname in os.listdir(doc_folder):
        if fname.endswith(".txt"):
            loader = TextLoader(os.path.join(doc_folder, fname))
            docs.extend(loader.load())
    splitter = CharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    chunks = splitter.split_documents(docs)
    return chunks

    primary_graph = Neo4jGraph(url=NEO4J_URI, username=NEO4J_USERNAME, password=NEO4J_PASSWORD)
    text_embedding = OpenAIEmbeddings(
        openai_api_base=os.getenv("OPENROUTER_API_BASE", "https://openrouter.ai/api/v1"),
        openai_api_key=os.getenv("OPENROUTER_API_KEY"),
        model="text-embedding-ada-002"
    )
    chunks = load_and_split_documents(doc_folder)
    vector_index = Neo4jVector.from_documents(
        chunks,
        text_embedding,
        url=NEO4J_URI,
        username=NEO4J_USERNAME,
        password=NEO4J_PASSWORD,
        search_type="hybrid",
        node_label="Document",
        text_node_properties=["text"],
        embedding_node_property="embedding"
    )
    print("✅ Neo4j graph and vector index built successfully.")
    return primary_graph, vector_index

def should_rebuild(doc_folder, state_file=STATE_FILE):
    """Check if the document state has changed since last build."""
    new_state = get_docs_state(doc_folder)
    if os.path.exists(state_file):
        with open(state_file, "r") as f:
            old_state = f.read().strip()
        if old_state == new_state:
            print("No changes in documents. Skipping rebuild.")
            return False
    with open(state_file, "w") as f:
        f.write(new_state)
    return True

if __name__ == "__main__":
    doc_folder = os.path.join(os.path.dirname(__file__), "documents")
    if should_rebuild(doc_folder):
        build_neo4j_graph_and_vector(doc_folder)
    else:
        print("Neo4j vector index is up to date.")
