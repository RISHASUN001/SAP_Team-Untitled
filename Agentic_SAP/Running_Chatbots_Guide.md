# SAP Team Application Setup Guide

## How to Run the Full Application

### Method 1: Recommended Approach

1. **Start Python Backends First**:
   ```bash
   cd Agentic_SAP/server
   ./start_all_backends.sh
   ```
   This starts:
   - Mentor Mode API (port 5001)
   - Practice Mode API (port 5002)  
   - Onboarding Mode API (port 5003)

2. **Start Frontend + Main Backend**:
   ```bash
   cd Agentic_SAP
   npm run dev
   ```
   This starts:
   - Frontend (Vite) on port 5173
   - Main Backend (Express) on port 3001

3. **Access the Application**:
   - Open http://localhost:5173 in your browser
   - The frontend will communicate with the main backend (port 3001)
   - The main backend will proxy requests to Python backends (ports 5001-5003)

### Method 2: Alternative (Manual)

1. **Terminal 1 - Mentor Mode**:
   ```bash
   cd Agentic_SAP/server/chatbot
   python3 mentor_mode.py
   ```

2. **Terminal 2 - Practice Mode**:
   ```bash
   cd Agentic_SAP/server/chatbot
   python3 practice_mode.py
   ```

3. **Terminal 3 - Onboarding Mode**:
   ```bash
   cd Agentic_SAP/server/chatbot
   python3 onboarding_mode.py
   ```

4. **Terminal 4 - Frontend + Main Backend**:
   ```bash
   cd Agentic_SAP
   npm run dev
   ```

## Service Architecture

```
Frontend (React) → http://localhost:5173
        ↓
Main Backend (Express) → http://localhost:3001
        ↓ (API Routes)
        ├── /api/chat/mentor-* → Python Mentor Mode (port 5001)
        ├── /api/chat/practice-* → Python Practice Mode (port 5002)
        └── /api/chat/general-* → Python Onboarding Mode (port 5003)
```

## Stop Services

- **Stop Python backends**: `./stop_all_backends.sh`
- **Stop npm dev**: Ctrl+C in the npm terminal

## Prerequisites

Make sure you have installed:
```bash
pip3 install chromadb langchain langchain-community sentence-transformers flask flask-cors openai python-dotenv requests
```

## Environment Variables

Create a `.env` file in the `Agentic_SAP` directory with:
```
OPENROUTER_API_KEY=your_openrouter_api_key_here
OPENROUTER_MODEL=meta-llama/llama-3-8b-instruct
```
