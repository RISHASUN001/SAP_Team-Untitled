import os
import sys
import random
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from openai import OpenAI

# Setup
load_dotenv()
app = Flask(__name__)
CORS(app)

# Store practice sessions
practice_sessions = {}

# OpenAI client
client = OpenAI(
    api_key=os.getenv("OPENROUTER_API_KEY"),
    base_url=os.getenv("OPENROUTER_API_BASE", "https://openrouter.ai/api/v1")
)

def load_scenarios():
    """Load practice scenarios from file"""
    scenarios_path = os.path.join(os.path.dirname(__file__), "documents", "practice_scenarios.txt")
    scenarios = []
    
    if os.path.exists(scenarios_path):
        with open(scenarios_path, 'r', encoding='utf-8') as file:
            content = file.read()
        
        # Parse scenarios
        blocks = content.split('Scenario ')[1:]
        for block in blocks:
            lines = block.strip().split('\n')
            if len(lines) > 1:
                title = lines[0].split(':', 1)[1].strip()
                description = '\n'.join(lines[1:]).strip()
                
                # Extract character name
                if "Your colleague " in description:
                    name_start = description.find("Your colleague ") + len("Your colleague ")
                elif "Your teammate " in description:
                    name_start = description.find("Your teammate ") + len("Your teammate ")
                else:
                    name_start = 0
                
                if name_start > 0:
                    name_end = description.find(",", name_start)
                    character_name = description[name_start:name_end].strip()
                else:
                    character_name = "Someone"
                
                scenarios.append({
                    'title': title,
                    'description': description,
                    'character_name': character_name
                })
    
    return scenarios

def get_ai_response(prompt):
    """Get AI response"""
    try:
        response = client.chat.completions.create(
            model="meta-llama/llama-3-8b-instruct",
            messages=[{"role": "system", "content": prompt}],
            max_tokens=250
        )
        return response.choices[0].message.content
    except Exception as e:
        return f"Error: {e}"

scenarios = load_scenarios()

@app.route('/api/practice-start', methods=['POST'])
def practice_start():
    """Start practice session"""
    data = request.json
    user_id = data.get('user_id', 'default_user')
    
    # Reset session
    practice_sessions[user_id] = {
        'state': 'selecting',
        'responses': [],
        'interactions': 0
    }
    
    # Pick scenario
    scenario = random.choice(scenarios)
    practice_sessions[user_id]['scenario'] = scenario
    
    response_data = {
        "response": f"""Practice Mode - Scenario Selection

**Scenario**: {scenario['title']}

**Situation**: {scenario['description']}

Would you like to practice with this scenario?""",
        "buttons": [
            {"text": "✅ Yes, Start", "action": "yes"},
            {"text": "🔄 Different Scenario", "action": "no"}, 
            {"text": "❌ Exit", "action": "exit"}
        ]
    }
    
    return jsonify(response_data)

@app.route('/api/practice-respond', methods=['POST'])
def practice_respond():
    """Handle practice responses"""
    data = request.json
    user_id = data.get('user_id', 'default_user')
    message = data.get('message', '').strip().lower()
    
    if user_id not in practice_sessions:
        return jsonify({"response": "Please start a practice session first."})
    
    session = practice_sessions[user_id]
    
    if session['state'] == 'selecting':
        return handle_selection(user_id, message)
    elif session['state'] == 'active':
        return handle_conversation(user_id, data.get('message', ''))
    
    return jsonify({"response": "Session error. Please restart."})

def handle_selection(user_id, response):
    """Handle scenario selection"""
    session = practice_sessions[user_id]
    scenario = session['scenario']
    
    if response in ['yes', 'y']:
        session['state'] = 'active'
        session['interactions'] = 0
        
        # Start roleplay
        character_name = scenario['character_name']
        scenario_description = scenario['description']
        
        # Generate natural opening based on the scenario
        opening_prompt = f"""You are {character_name}. Based on this scenario: {scenario_description}

You are approaching a colleague for help. Start the conversation naturally as {character_name} would - panicked, stressed, or worried about your situation. Don't repeat the scenario description. Just speak naturally as someone who needs help.

Generate ONLY the opening dialogue (under 50 words):"""
        
        opening_dialogue = get_ai_response(opening_prompt)
        
        initial_message = f"""Practice Simulation Started

{opening_dialogue}
"""
        
        return jsonify({"response": initial_message})
    
    elif response in ['no', 'n']:
        # Different scenario
        new_scenario = random.choice([s for s in scenarios if s['title'] != session['scenario']['title']])
        session['scenario'] = new_scenario
        
        response_data = {
            "response": f"""New Scenario Selected

**Scenario**: {new_scenario['title']}

**Situation**: {new_scenario['description']}

Would you like to practice with this scenario?""",
            "buttons": [
                {"text": "✅ Yes, Start", "action": "yes"},
                {"text": "🔄 Different Scenario", "action": "no"}, 
                {"text": "❌ Exit", "action": "exit"}
            ]
        }
        return jsonify(response_data)
    
    elif response in ['exit', 'quit']:
        del practice_sessions[user_id]
        return jsonify({"response": "Practice mode ended."})
    
    return jsonify({"response": "Please choose: yes, no, or exit."})

def handle_conversation(user_id, user_message):
    """Handle practice conversation"""
    session = practice_sessions[user_id]
    scenario = session['scenario']
    session['responses'].append(user_message)
    session['interactions'] += 1
    
    # End after 4 interactions
    if session['interactions'] >= 4:
        return end_simulation(user_id)
    
    # Continue roleplay
    character_name = scenario['character_name']
    
    roleplay_prompt = f"""You are {character_name}, a distressed employee in this situation: {scenario['description']}

The user (your mentor/colleague) just said: "{user_message}"

CRITICAL: Respond SPECIFICALLY to what they just said. Don't repeat your problem description.

ROLEPLAY INSTRUCTIONS:
- You ARE {character_name}, the person with the problem
- DIRECTLY answer their question or respond to their comment
- If they ask about details, give specific details
- If they offer help, react to that help
- If they suggest meeting, respond about timing/availability
- Show progression in the conversation - don't loop back to describing your problem
- Keep under 100 words
- Make it feel like a real back-and-forth conversation

Respond as {character_name}:"""
    
    ai_response = get_ai_response(roleplay_prompt)
    
    formatted_response = f"""{ai_response}"""

    return jsonify({"response": formatted_response})

def end_simulation(user_id):
    """End simulation with evaluation"""
    session = practice_sessions[user_id]
    scenario = session['scenario']
    responses = session['responses']
    
    evaluation_prompt = f"""Evaluate this mentoring practice session based ONLY on what the USER said, not what the AI character said.

SCENARIO: {scenario['description']}

WHAT THE USER (MENTOR) ACTUALLY SAID:
{chr(10).join([f"{i+1}. \"{r}\"" for i, r in enumerate(responses)])}

IMPORTANT: 
- Evaluate ONLY the user's responses listed above
- Do NOT consider what the AI character said
- Focus on whether the user's words showed empathy, support, and good mentoring
- Be honest about what the user actually demonstrated

EVALUATION GUIDELINES:
- Be fair and constructive
- Acknowledge any genuine effort in the user's words
- Point out missed opportunities for better mentoring
- Keep under 200 words

EVALUATE THE USER'S MENTORING RESPONSES:

**What you did well:** [Based only on user's actual words]

**Areas for growth:** [What the user could improve based on their responses]

**Consider trying:** [2-3 specific suggestions for better responses]

**Scores:** Empathy: X/5 | Communication: X/5 | Problem-solving: X/5 | Overall: X/5"""
    
    evaluation = get_ai_response(evaluation_prompt)
    
    final_response = f"""Practice Simulation Complete!

**Scenario**: {scenario['title']}
**Your Responses**: {len(responses)}

{evaluation}

Want to practice another scenario? Click refresh and start again!"""
    
    session['state'] = 'completed'
    return jsonify({"response": final_response})

@app.route('/api/practice-reset', methods=['POST'])
def practice_reset():
    """Reset practice session"""
    data = request.json
    user_id = data.get('user_id', 'default_user')
    
    if user_id in practice_sessions:
        del practice_sessions[user_id]
    
    return jsonify({"status": "reset_complete"})

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "OK"})

if __name__ == "__main__":
    print(f"Loaded {len(scenarios)} scenarios")
    app.run(port=5002, debug=True)
