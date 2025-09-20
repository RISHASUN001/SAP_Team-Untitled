"""
Flask API endpoints for timeline generation and management
"""
from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import json
from datetime import datetime
from timeline_generator import TimelineGenerator, save_timeline_to_file, load_timeline_from_file

app = Flask(__name__)
CORS(app)

# Initialize the timeline generator
timeline_gen = TimelineGenerator()

# Create data directories
DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
TIMELINE_DIR = os.path.join(DATA_DIR, "timelines")
PROOF_DIR = os.path.join(DATA_DIR, "proofs")
os.makedirs(TIMELINE_DIR, exist_ok=True)
os.makedirs(PROOF_DIR, exist_ok=True)

@app.route('/api/timeline/generate', methods=['POST'])
def generate_timeline():
    """Generate a new learning timeline for a course"""
    try:
        data = request.json
        course_name = data.get('course_name')
        user_preferences = data.get('user_preferences', {})
        custom_requirements = data.get('custom_requirements', '')
        user_id = data.get('user_id', 'default_user')
        
        if not course_name:
            return jsonify({'error': 'Course name is required'}), 400
        
        # Generate timeline
        timeline = timeline_gen.generate_timeline(
            course_name=course_name,
            user_preferences=user_preferences,
            custom_requirements=custom_requirements
        )
        
        # Add user context
        timeline['user_id'] = user_id
        timeline['status'] = 'draft'
        
        # Save to file
        timeline_file = os.path.join(TIMELINE_DIR, f"{timeline['timeline_id']}.json")
        with open(timeline_file, 'w') as f:
            json.dump(timeline, f, indent=2)
        
        return jsonify({
            'success': True,
            'timeline': timeline
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/timeline/revise', methods=['POST'])
def revise_timeline():
    """Revise an existing timeline based on user feedback"""
    try:
        data = request.json
        timeline_id = data.get('timeline_id')
        revision_request = data.get('revision_request', '')
        
        if not timeline_id:
            return jsonify({'error': 'Timeline ID is required'}), 400
        
        # Load existing timeline
        timeline_file = os.path.join(TIMELINE_DIR, f"{timeline_id}.json")
        if not os.path.exists(timeline_file):
            return jsonify({'error': 'Timeline not found'}), 404
        
        with open(timeline_file, 'r') as f:
            existing_timeline = json.load(f)
        
        # Generate revised timeline
        revised_timeline = timeline_gen.revise_timeline(timeline_id, revision_request)
        
        # Preserve user context and update metadata
        revised_timeline['user_id'] = existing_timeline.get('user_id', 'default_user')
        revised_timeline['status'] = 'draft'
        revised_timeline['previous_version'] = timeline_id
        revised_timeline['revision_request'] = revision_request
        
        # Save revised timeline
        revised_timeline_file = os.path.join(TIMELINE_DIR, f"{revised_timeline['timeline_id']}.json")
        with open(revised_timeline_file, 'w') as f:
            json.dump(revised_timeline, f, indent=2)
        
        return jsonify({
            'success': True,
            'timeline': revised_timeline
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
@app.route('/api/timeline/approve', methods=['POST'])
def approve_timeline():
    """Approve a timeline and add events to calendar"""
    try:
        data = request.json
        timeline_id = data.get('timeline_id')
        
        if not timeline_id:
            return jsonify({'error': 'Timeline ID is required'}), 400
        
        # Load timeline
        timeline_file = os.path.join(TIMELINE_DIR, f"{timeline_id}.json")
        if not os.path.exists(timeline_file):
            return jsonify({'error': 'Timeline not found'}), 404
        
        with open(timeline_file, 'r') as f:
            timeline = json.load(f)
        
        # Update status to approved
        timeline['status'] = 'approved'
        timeline['approved_at'] = datetime.now().isoformat()
        
        # Ensure events have unique IDs and current dates
        current_date = datetime.now()
        for i, event in enumerate(timeline.get('events', [])):
            # Fix duplicate IDs by making them unique
            event['id'] = f"{timeline_id}_{i}_{int(current_date.timestamp())}"
            
            # Fix dates to be current instead of 2023
            if '2023-' in event.get('startTime', ''):
                # Parse the original date but update the year
                original_date = datetime.fromisoformat(event['startTime'].replace('Z', ''))
                # Keep the month/day but use current year
                updated_date = original_date.replace(year=current_date.year)
                event['startTime'] = updated_date.isoformat()
                
                # Also update endTime if it exists
                if 'endTime' in event and '2023-' in event['endTime']:
                    end_date = datetime.fromisoformat(event['endTime'].replace('Z', ''))
                    event['endTime'] = end_date.replace(year=current_date.year).isoformat()
        
        # Save updated timeline
        with open(timeline_file, 'w') as f:
            json.dump(timeline, f, indent=2)
        
        # Return calendar events to be added
        return jsonify({
            'success': True,
            'timeline_id': timeline_id,
            'events': timeline['events'],
            'message': 'Timeline approved and events ready for calendar'
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/timeline/<timeline_id>', methods=['GET'])
def get_timeline(timeline_id):
    """Get a specific timeline"""
    try:
        timeline_file = os.path.join(TIMELINE_DIR, f"{timeline_id}.json")
        if not os.path.exists(timeline_file):
            return jsonify({'error': 'Timeline not found'}), 404
        
        with open(timeline_file, 'r') as f:
            timeline = json.load(f)
        
        return jsonify(timeline)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/timeline/user/<user_id>', methods=['GET'])
def get_user_timelines(user_id):
    """Get all timelines for a user"""
    try:
        timelines = []
        
        # Scan timeline directory for user's timelines
        for filename in os.listdir(TIMELINE_DIR):
            if filename.endswith('.json'):
                filepath = os.path.join(TIMELINE_DIR, filename)
                with open(filepath, 'r') as f:
                    timeline = json.load(f)
                    if timeline.get('user_id') == user_id:
                        timelines.append(timeline)
        
        # Sort by creation date
        timelines.sort(key=lambda x: x.get('generated_at', ''), reverse=True)
        
        return jsonify(timelines)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/proof/submit', methods=['POST'])
def submit_proof():
    """Submit proof of completion for an event"""
    try:
        data = request.json
        event_id = data.get('event_id')
        user_id = data.get('user_id')
        proof_type = data.get('proof_type', 'text')
        proof_content = data.get('proof_content', '')
        proof_url = data.get('proof_url', '')  # For file uploads
        
        if not event_id or not user_id:
            return jsonify({'error': 'Event ID and User ID are required'}), 400
        
        # Create proof record
        proof_record = {
            'proof_id': f"proof_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{event_id}",
            'event_id': event_id,
            'user_id': user_id,
            'proof_type': proof_type,
            'proof_content': proof_content,
            'proof_url': proof_url,
            'submitted_at': datetime.now().isoformat(),
            'status': 'pending_review'
        }
        
        # Save proof record
        proof_file = os.path.join(PROOF_DIR, f"{proof_record['proof_id']}.json")
        with open(proof_file, 'w') as f:
            json.dump(proof_record, f, indent=2)
        
        return jsonify({
            'success': True,
            'proof_id': proof_record['proof_id'],
            'message': 'Proof submitted successfully'
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/proof/event/<event_id>', methods=['GET'])
def get_proof_for_event(event_id):
    """Get proof submissions for a specific event"""
    try:
        proofs = []
        
        # Scan proof directory
        for filename in os.listdir(PROOF_DIR):
            if filename.endswith('.json') and event_id in filename:
                filepath = os.path.join(PROOF_DIR, filename)
                with open(filepath, 'r') as f:
                    proof = json.load(f)
                    if proof.get('event_id') == event_id:
                        proofs.append(proof)
        
        return jsonify(proofs)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/proof/user/<user_id>', methods=['GET'])
def get_user_proofs(user_id):
    """Get all proof submissions for a user"""
    try:
        proofs = []
        
        # Scan proof directory
        for filename in os.listdir(PROOF_DIR):
            if filename.endswith('.json'):
                filepath = os.path.join(PROOF_DIR, filename)
                with open(filepath, 'r') as f:
                    proof = json.load(f)
                    if proof.get('user_id') == user_id:
                        proofs.append(proof)
        
        # Sort by submission date
        proofs.sort(key=lambda x: x.get('submitted_at', ''), reverse=True)
        
        return jsonify(proofs)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/proof/review', methods=['POST'])
def review_proof():
    """Manager review of submitted proof"""
    try:
        data = request.json
        proof_id = data.get('proof_id')
        reviewer_id = data.get('reviewer_id')
        status = data.get('status')  # 'approved' or 'rejected'
        review_comments = data.get('review_comments', '')
        
        if not proof_id or not reviewer_id or not status:
            return jsonify({'error': 'Proof ID, Reviewer ID, and Status are required'}), 400
        
        # Load proof record
        proof_file = os.path.join(PROOF_DIR, f"{proof_id}.json")
        if not os.path.exists(proof_file):
            return jsonify({'error': 'Proof record not found'}), 404
        
        with open(proof_file, 'r') as f:
            proof = json.load(f)
        
        # Update proof with review
        proof['status'] = status
        proof['reviewer_id'] = reviewer_id
        proof['review_comments'] = review_comments
        proof['reviewed_at'] = datetime.now().isoformat()
        
        # Save updated proof
        with open(proof_file, 'w') as f:
            json.dump(proof, f, indent=2)
        
        return jsonify({
            'success': True,
            'proof_id': proof_id,
            'status': status,
            'message': f'Proof {status} successfully'
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'service': 'timeline-api'})

if __name__ == '__main__':
    app.run(debug=True, port=5006)