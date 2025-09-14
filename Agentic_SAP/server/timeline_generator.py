"""
AI-powered timeline generation for course learning plans
"""
import json
import requests
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class TimelineGenerator:
    def __init__(self):
        # Default study preferences - could be loaded from user profile later
        self.default_preferences = {
            "study_hours_per_week": 8,
            "preferred_days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
            "preferred_times": ["Morning", "Evening"],
            "max_session_length": 2,  # hours
            "break_days": ["Saturday", "Sunday"]
        }
        
        # Course metadata for timeline calculation
        self.course_templates = {
            "Advanced Python for Data Science": {
                "total_weeks": 8,
                "total_hours": 40,
                "modules": [
                    {"name": "Advanced Data Structures", "hours": 6, "has_assignment": True},
                    {"name": "NumPy & Pandas Mastery", "hours": 8, "has_assignment": True},
                    {"name": "Data Visualization", "hours": 6, "has_assignment": True},
                    {"name": "Statistical Analysis", "hours": 8, "has_assignment": True},
                    {"name": "Machine Learning Integration", "hours": 8, "has_assignment": True},
                    {"name": "Final Project", "hours": 4, "has_assignment": True, "is_project": True}
                ]
            },
            "Advanced Machine Learning": {
                "total_weeks": 8,
                "total_hours": 40,
                "modules": [
                    {"name": "Ensemble Methods", "hours": 6, "has_assignment": True},
                    {"name": "Feature Engineering", "hours": 6, "has_assignment": True},
                    {"name": "Model Optimization", "hours": 8, "has_assignment": True},
                    {"name": "Deep Learning Basics", "hours": 8, "has_assignment": True},
                    {"name": "Neural Networks", "hours": 8, "has_assignment": True},
                    {"name": "Capstone Project", "hours": 4, "has_assignment": True, "is_project": True}
                ]
            },
            "Deep Learning with TensorFlow": {
                "total_weeks": 10,
                "total_hours": 50,
                "modules": [
                    {"name": "TensorFlow Fundamentals", "hours": 8, "has_assignment": True},
                    {"name": "Neural Network Architecture", "hours": 8, "has_assignment": True},
                    {"name": "CNN for Computer Vision", "hours": 8, "has_assignment": True},
                    {"name": "RNN for Sequence Data", "hours": 8, "has_assignment": True},
                    {"name": "Advanced Architectures", "hours": 8, "has_assignment": True},
                    {"name": "Model Deployment", "hours": 6, "has_assignment": True},
                    {"name": "Final Project", "hours": 4, "has_assignment": True, "is_project": True}
                ]
            }
        }

    def generate_timeline(self, course_name: str, user_preferences: Optional[Dict] = None, custom_requirements: str = "") -> Dict:
        """Generate a personalized learning timeline for a course"""
        
        # Merge user preferences with defaults
        preferences = {**self.default_preferences}
        if user_preferences:
            preferences.update(user_preferences)
            
        # Get course template or create default
        course_data = self.course_templates.get(course_name, self._create_default_course(course_name)).copy()
        
        # Let LLM handle ALL course structure modifications via custom requirements
        # No hardcoded logic here anymore!
        
        # Apply custom requirements using AI-like logic
        if custom_requirements:
            course_data = self._apply_custom_requirements(course_data, custom_requirements)
        
        # Generate timeline events
        events = self._generate_events(course_data, preferences)
        
        # Use course data as-is (LLM will modify via custom requirements)
        actual_weeks = course_data["total_weeks"]
        
        return {
            "timeline_id": f"timeline_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            "course_name": course_name,
            "generated_at": datetime.now().isoformat(),
            "total_duration_weeks": actual_weeks,
            "total_hours": course_data["total_hours"],
            "events": events,
            "user_preferences": preferences,
            "custom_requirements": custom_requirements
        }

    def _create_default_course(self, course_name: str) -> Dict:
        """Create default course structure for unknown courses"""
        return {
            "total_weeks": 6,
            "total_hours": 30,
            "modules": [
                {"name": f"{course_name} - Module 1", "hours": 6, "has_assignment": True},
                {"name": f"{course_name} - Module 2", "hours": 6, "has_assignment": True},
                {"name": f"{course_name} - Module 3", "hours": 6, "has_assignment": True},
                {"name": f"{course_name} - Module 4", "hours": 6, "has_assignment": True},
                {"name": f"{course_name} - Final Project", "hours": 6, "has_assignment": True, "is_project": True}
            ]
        }

    def _apply_custom_requirements(self, course_data: Dict, requirements: str) -> Dict:
        """Apply custom requirements to modify course structure using LLM intelligence"""
        if not requirements.strip():
            return course_data
            
        print(f"🤖 Using LLM to modify course structure based on: '{requirements}'")
        
        try:
            # Get LLM to modify course structure
            llm_modifications = self._call_llm_for_course_structure(course_data, requirements)
            
            if llm_modifications:
                modified_data = course_data.copy()
                
                # Apply LLM suggested changes to course structure
                if "total_weeks" in llm_modifications:
                    modified_data["total_weeks"] = llm_modifications["total_weeks"]
                    print(f"📅 LLM adjusted course duration to {modified_data['total_weeks']} weeks")
                
                if "total_hours" in llm_modifications:
                    modified_data["total_hours"] = llm_modifications["total_hours"]
                    print(f"⏱️ LLM adjusted total hours to {modified_data['total_hours']}")
                
                if "modules_to_keep" in llm_modifications:
                    # Keep only specified number of modules
                    num_modules = min(llm_modifications["modules_to_keep"], len(modified_data["modules"]))
                    modified_data["modules"] = modified_data["modules"][:num_modules]
                    modified_data["total_hours"] = sum(m["hours"] for m in modified_data["modules"])
                    print(f"📚 LLM reduced to {num_modules} essential modules")
                
                return modified_data
            else:
                print("⚠️ LLM course structure modification failed, using original")
                return course_data
                
        except Exception as e:
            print(f"❌ Error in LLM course modification: {e}")
            return course_data

    def _call_llm_for_revision(self, existing_timeline: Dict, revision_request: str) -> Dict:
        """Use LLM to intelligently revise timeline based on user request"""
        print(f"🔥 LLM revision called with request: '{revision_request}'")
        try:
            # Get OpenRouter API configuration from environment
            api_key = os.getenv("OPENROUTER_API_KEY")
            api_base = os.getenv("OPENROUTER_API_BASE", "https://openrouter.ai/api/v1")
            model = os.getenv("OPENROUTER_MODEL", "meta-llama/llama-3-8b-instruct")
            
            print(f"🔑 API Key: {'Found' if api_key else 'Not found'}")
            print(f"🌐 API Base: {api_base}")
            print(f"🤖 Model: {model}")
            
            if not api_key:
                print("❌ OpenRouter API key not found in environment")
                return {}
            
            # Prepare context for the LLM
            timeline_summary = {
                "course_name": existing_timeline.get("course_name", "Unknown Course"),
                "current_weeks": existing_timeline.get("total_duration_weeks", 0),
                "current_hours": existing_timeline.get("total_hours", 0),
                "current_preferences": existing_timeline.get("user_preferences", {}),
                "current_events_count": len(existing_timeline.get("events", []))
            }
            
            system_prompt = """You are an AI assistant helping to revise a learning timeline. You must respond with ONLY a valid JSON object, no additional text."""
            
            user_prompt = f"""Current Timeline:
- Course: {timeline_summary['course_name']}
- Duration: {timeline_summary['current_weeks']} weeks
- Total Hours: {timeline_summary['current_hours']} hours
- Current study hours per week: {timeline_summary['current_preferences'].get('study_hours_per_week', 8)}
- Current preferred days: {timeline_summary['current_preferences'].get('preferred_days', [])}
- Current max session length: {timeline_summary['current_preferences'].get('max_session_length', 2)} hours

User Request: "{revision_request}"

Based on this request, provide a JSON response with revised preferences. Consider:
1. If user wants to finish faster (like "2 days"), increase study hours per week dramatically and adjust preferred days
2. If user mentions specific days (weekends, weekdays), update preferred_days accordingly  
3. If user wants longer/shorter sessions, adjust max_session_length
4. Be realistic about time constraints - finishing a course in 2 days might require 15-20 hours per day

Respond with ONLY this JSON format:
{{
  "study_hours_per_week": <number>,
  "preferred_days": ["day1", "day2"],
  "max_session_length": <number>,
  "total_weeks": <number>,
  "reasoning": "Brief explanation"
}}"""

            # Call OpenRouter API
            headers = {
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
                "HTTP-Referer": "http://localhost:5002",  # Optional: for analytics
                "X-Title": "Timeline Revision System"  # Optional: for analytics
            }
            
            response = requests.post(
                f"{api_base}/chat/completions",
                json={
                    "model": model,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    "temperature": 0.3,  # Lower temperature for more consistent JSON
                    "max_tokens": 500
                },
                headers=headers,
                timeout=30
            )
            
            if response.status_code == 200:
                llm_response = response.json()
                
                # Extract the response content
                if "choices" in llm_response and len(llm_response["choices"]) > 0:
                    content = llm_response["choices"][0]["message"]["content"]
                    
                    # Try to parse the JSON response
                    try:
                        # Clean the response in case there's extra text
                        content = content.strip()
                        if content.startswith("```json"):
                            content = content.replace("```json", "").replace("```", "").strip()
                        
                        revised_prefs = json.loads(content)
                        print(f"✅ LLM successfully parsed revision: {revised_prefs}")
                        return revised_prefs
                        
                    except json.JSONDecodeError as e:
                        print(f"❌ Failed to parse LLM response as JSON: {content}")
                        print(f"JSON Error: {e}")
                        return {}
                else:
                    print(f"❌ Unexpected LLM response format: {llm_response}")
                    return {}
            else:
                print(f"❌ OpenRouter API error: {response.status_code} - {response.text}")
                return {}
                
        except requests.RequestException as e:
            print(f"❌ Failed to call OpenRouter API: {e}")
            return {}
        except Exception as e:
            print(f"❌ Error in LLM revision: {e}")
            return {}

    def _call_llm_for_course_structure(self, course_data: Dict, requirements: str) -> Dict:
        """Use LLM to modify course structure based on requirements"""
        try:
            # Get OpenRouter API configuration from environment
            api_key = os.getenv("OPENROUTER_API_KEY")
            api_base = os.getenv("OPENROUTER_API_BASE", "https://openrouter.ai/api/v1")
            model = os.getenv("OPENROUTER_MODEL", "meta-llama/llama-3-8b-instruct")
            
            if not api_key:
                print("❌ OpenRouter API key not found for course structure modification")
                return {}
            
            system_prompt = """You are an AI assistant that modifies course structures based on user requirements. You must respond with ONLY a valid JSON object."""
            
            user_prompt = f"""Current Course Structure:
- Course: {course_data.get('name', 'Unknown Course')}
- Current weeks: {course_data.get('total_weeks', 0)}
- Current hours: {course_data.get('total_hours', 0)}
- Number of modules: {len(course_data.get('modules', []))}

User Requirement: "{requirements}"

Modify the course structure to meet this requirement. Consider:
1. If user wants "2 days" completion, set total_weeks to 0.3 (2/7 days) and reduce modules drastically
2. If "faster" or "accelerated", reduce total_weeks and possibly modules
3. If "slower" or "extended", increase total_weeks
4. If "intensive", reduce total_weeks but keep more hours per week

Respond with ONLY this JSON format:
{{
  "total_weeks": <number (can be decimal like 0.3 for 2 days)>,
  "total_hours": <number>,
  "modules_to_keep": <number of modules to keep>,
  "reasoning": "Brief explanation"
}}"""

            headers = {
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
                "HTTP-Referer": "http://localhost:5002",
                "X-Title": "Course Structure Modification"
            }
            
            response = requests.post(
                f"{api_base}/chat/completions",
                json={
                    "model": model,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    "temperature": 0.3,
                    "max_tokens": 300
                },
                headers=headers,
                timeout=30
            )
            
            if response.status_code == 200:
                llm_response = response.json()
                
                if "choices" in llm_response and len(llm_response["choices"]) > 0:
                    content = llm_response["choices"][0]["message"]["content"]
                    
                    try:
                        content = content.strip()
                        if content.startswith("```json"):
                            content = content.replace("```json", "").replace("```", "").strip()
                        
                        modifications = json.loads(content)
                        print(f"✅ LLM course structure modifications: {modifications}")
                        return modifications
                        
                    except json.JSONDecodeError as e:
                        print(f"❌ Failed to parse LLM course structure response: {content}")
                        return {}
                else:
                    print(f"❌ Unexpected LLM course structure response: {llm_response}")
                    return {}
            else:
                print(f"❌ OpenRouter API error for course structure: {response.status_code}")
                return {}
                
        except Exception as e:
            print(f"❌ Error in LLM course structure modification: {e}")
            return {}

    def _generate_events(self, course_data: Dict, preferences: Dict) -> List[Dict]:
        """Generate calendar events based on course structure and user preferences"""
        events = []
        start_date = datetime.now() + timedelta(days=1)  # Start tomorrow
        
        # Calculate weekly schedule
        study_hours_per_week = preferences["study_hours_per_week"]
        preferred_days = preferences["preferred_days"]
        max_session_length = preferences["max_session_length"]
        preferred_times = preferences.get("preferred_times", ["Morning", "Evening"])
        
        # Adjust sessions based on available days and time constraints
        if len(preferred_days) <= 2:  # Weekend-only or very limited days
            sessions_per_week = len(preferred_days)
            hours_per_session = min(study_hours_per_week / sessions_per_week, max_session_length)
        else:
            sessions_per_week = min(len(preferred_days), max(1, study_hours_per_week // max_session_length))
            hours_per_session = study_hours_per_week / sessions_per_week
        
        # Map day names to numbers for easier calculation
        day_name_to_num = {
            "Monday": 0, "Tuesday": 1, "Wednesday": 2, "Thursday": 3,
            "Friday": 4, "Saturday": 5, "Sunday": 6
        }
        
        # Get preferred day numbers
        preferred_day_nums = [day_name_to_num[day] for day in preferred_days if day in day_name_to_num]
        
        current_date = start_date
        current_module_index = 0
        current_module_hours_remaining = course_data["modules"][0]["hours"] if course_data["modules"] else 0
        
        week_start_date = start_date
        
        # Handle fractional weeks (like 0.3 for 2 days)
        total_weeks = course_data["total_weeks"]
        if total_weeks < 1:
            # For fractional weeks, we need at least 1 iteration but limit the days
            num_weeks_to_iterate = 1
            days_in_course = int(total_weeks * 7)  # Convert to days
            print(f"📅 Fractional course: {total_weeks} weeks = {days_in_course} days")
        else:
            num_weeks_to_iterate = int(total_weeks)
            days_in_course = 7 * num_weeks_to_iterate
        
        total_days_processed = 0
        
        for week in range(num_weeks_to_iterate):
            sessions_this_week = 0
            
            # For each day of the week, check if it's a preferred day
            days_to_check = 7 if total_weeks >= 1 else days_in_course
            for day_offset in range(min(7, days_to_check - total_days_processed)):
                current_date = week_start_date + timedelta(days=day_offset)
                day_num = current_date.weekday()
                
                # Check if this day is in our preferred days and we haven't exceeded sessions per week
                if day_num in preferred_day_nums and sessions_this_week < sessions_per_week:
                    if current_module_index >= len(course_data["modules"]):
                        break
                    
                    module = course_data["modules"][current_module_index]
                    session_hours = min(hours_per_session, current_module_hours_remaining, max_session_length)
                    
                    # Determine time based on preferences
                    if "Morning" in preferred_times:
                        start_hour, start_minute = 9, 0
                    elif "Afternoon" in preferred_times:
                        start_hour, start_minute = 14, 0
                    elif "Evening" in preferred_times:
                        start_hour, start_minute = 18, 0
                    else:
                        start_hour, start_minute = 10, 0
                    
                    # Create study session event
                    event = {
                        "id": f"study_{len(events) + 1}",
                        "title": f"Study: {module['name']}",
                        "type": "course",
                        "startTime": current_date.replace(hour=start_hour, minute=start_minute).isoformat(),
                        "endTime": (current_date.replace(hour=start_hour, minute=start_minute) + timedelta(hours=session_hours)).isoformat(),
                        "description": f"Study session for {module['name']} ({session_hours:.1f} hours)",
                        "color": "bg-purple-500",
                        "module_name": module['name'],
                        "requires_proof": True,
                        "proof_type": "study_session"
                    }
                    events.append(event)
                    
                    current_module_hours_remaining -= session_hours
                    sessions_this_week += 1
                    
                    # If module is complete, add assignment deadline if needed
                    if current_module_hours_remaining <= 0:
                        if module.get("has_assignment"):
                            # Set deadline for next available day (or in 3 days, whichever is sooner)
                            deadline_date = current_date + timedelta(days=3)
                            assignment_event = {
                                "id": f"assignment_{len(events) + 1}",
                                "title": f"Assignment Due: {module['name']}",
                                "type": "deadline",
                                "startTime": deadline_date.replace(hour=23, minute=59).isoformat(),
                                "endTime": deadline_date.replace(hour=23, minute=59).isoformat(),
                                "description": f"Submit assignment for {module['name']}",
                                "color": "bg-red-500",
                                "module_name": module['name'],
                                "requires_proof": True,
                                "proof_type": "assignment_submission"
                            }
                            events.append(assignment_event)
                        
                        # Move to next module
                        current_module_index += 1
                        if current_module_index < len(course_data["modules"]):
                            current_module_hours_remaining = course_data["modules"][current_module_index]["hours"]
                
                total_days_processed += 1
                
                # Break early if we've processed all days for fractional weeks
                if total_weeks < 1 and total_days_processed >= days_in_course:
                    break
            
            # Break if we've completed the fractional week
            if total_weeks < 1 and total_days_processed >= days_in_course:
                break
            
            # Move to next week
            week_start_date += timedelta(weeks=1)
            
            # Add weekly review session on the last preferred day of the week
            if preferred_day_nums:
                last_preferred_day = max(preferred_day_nums)
                review_date = week_start_date - timedelta(days=1) + timedelta(days=(last_preferred_day - week_start_date.weekday() + 6) % 7)
                review_event = {
                    "id": f"review_{week + 1}",
                    "title": f"Week {week + 1} Review",
                    "type": "goal_milestone",
                    "startTime": review_date.replace(hour=16, minute=0).isoformat(),
                    "endTime": (review_date.replace(hour=16, minute=0) + timedelta(hours=1)).isoformat(),
                    "description": f"Review progress and plan for next week",
                    "color": "bg-green-500",
                    "requires_proof": False,
                    "proof_type": "reflection"
                }
                events.append(review_event)
        
        return events

    def revise_timeline(self, timeline_id: str, revision_request: str) -> Dict:
        """Revise an existing timeline based on user feedback using LLM intelligence"""
        # Load the existing timeline
        timeline_file = os.path.join(os.path.dirname(__file__), "data", "timelines", f"{timeline_id}.json")
        existing_timeline = None
        
        try:
            with open(timeline_file, 'r') as f:
                existing_timeline = json.load(f)
        except FileNotFoundError:
            print(f"Timeline {timeline_id} not found, creating new one")
        
        # Get existing preferences or use defaults
        if existing_timeline:
            modified_preferences = existing_timeline.get("user_preferences", self.default_preferences).copy()
            course_name = existing_timeline.get("course_name", "Advanced Python for Data Science")
            existing_custom_requirements = existing_timeline.get("custom_requirements", "")
        else:
            modified_preferences = self.default_preferences.copy()
            course_name = "Advanced Python for Data Science"
            existing_custom_requirements = ""
        
        # Use LLM to intelligently revise the timeline
        print(f"🤖 Using AI to revise timeline based on: '{revision_request}'")
        print(f"📊 Current preferences: {modified_preferences}")
        
        timeline_context = existing_timeline or {
            "course_name": course_name,
            "total_duration_weeks": 8,
            "total_hours": 40,
            "user_preferences": modified_preferences,
            "events": []
        }
        
        llm_revisions = self._call_llm_for_revision(timeline_context, revision_request)
        
        # Apply LLM suggestions if we got valid response
        if llm_revisions:
            print(f"🧠 LLM suggested changes: {llm_revisions}")
            
            if "study_hours_per_week" in llm_revisions:
                modified_preferences["study_hours_per_week"] = llm_revisions["study_hours_per_week"]
            if "preferred_days" in llm_revisions:
                modified_preferences["preferred_days"] = llm_revisions["preferred_days"]
            if "max_session_length" in llm_revisions:
                modified_preferences["max_session_length"] = llm_revisions["max_session_length"]
            if "preferred_times" in llm_revisions and "preferred_times" in modified_preferences:
                # Only update if the LLM provided time preferences
                if isinstance(llm_revisions["preferred_times"], list):
                    modified_preferences["preferred_times"] = llm_revisions["preferred_times"]
                    
        else:
            print("⚠️ LLM unavailable - timeline revision will not work properly without AI")
            # No hardcoded fallback - we want to encourage LLM usage
        
        # Combine existing custom requirements with new revision request
        combined_requirements = f"{existing_custom_requirements} {revision_request}".strip()
        
        # Also update course structure if needed for extreme time constraints
        course_data = self.course_templates.get(course_name, self._create_default_course(course_name)).copy()
        if llm_revisions and "total_weeks" in llm_revisions:
            course_data["total_weeks"] = llm_revisions["total_weeks"]
            print(f"📅 Adjusting course duration to {course_data['total_weeks']} weeks")
        
        print(f"🎯 Final preferences for new timeline: {modified_preferences}")
        print(f"📚 Course data weeks: {course_data['total_weeks']}")
        
        # Generate new timeline with AI-modified preferences  
        new_timeline = self.generate_timeline(course_name, modified_preferences, combined_requirements)
        print(f"✨ Generated new timeline: {new_timeline['total_duration_weeks']} weeks, {new_timeline['total_hours']} hours, {len(new_timeline['events'])} events")
        return new_timeline

def save_timeline_to_file(timeline: Dict, file_path: str = None):
    """Save timeline to local JSON file"""
    if not file_path:
        # Create data directory if it doesn't exist
        data_dir = os.path.join(os.path.dirname(__file__), "..", "data")
        os.makedirs(data_dir, exist_ok=True)
        file_path = os.path.join(data_dir, f"timeline_{timeline['timeline_id']}.json")
    
    with open(file_path, 'w') as f:
        json.dump(timeline, f, indent=2)
    
    return file_path

def load_timeline_from_file(timeline_id: str) -> Optional[Dict]:
    """Load timeline from local JSON file"""
    data_dir = os.path.join(os.path.dirname(__file__), "..", "data")
    file_path = os.path.join(data_dir, f"timeline_{timeline_id}.json")
    
    try:
        with open(file_path, 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        return None

if __name__ == "__main__":
    # Test the timeline generator
    generator = TimelineGenerator()
    
    # Generate a sample timeline
    timeline = generator.generate_timeline(
        "Advanced Python for Data Science",
        user_preferences={
            "study_hours_per_week": 10,
            "preferred_days": ["Monday", "Wednesday", "Friday"]
        },
        custom_requirements="I need more practice time and prefer morning sessions"
    )
    
    # Save to file
    file_path = save_timeline_to_file(timeline)
    print(f"Timeline saved to: {file_path}")
    
    # Print timeline summary
    print(f"\nGenerated timeline for: {timeline['course_name']}")
    print(f"Duration: {timeline['total_duration_weeks']} weeks")
    print(f"Total hours: {timeline['total_hours']}")
    print(f"Total events: {len(timeline['events'])}")
    
    for event in timeline['events'][:5]:  # Show first 5 events
        print(f"- {event['title']} on {event['startTime'][:10]}")