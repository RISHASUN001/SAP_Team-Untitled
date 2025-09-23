"""
AI-powered timeline generation for course learning plans
"""
import json
import os
import requests
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
import traceback
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
            "break_days": ["Saturday", "Sunday"],
            "max_daily_study_hours": 3,  # Maximum study hours per day
            "calendar_api_base": "http://localhost:3001"  # Calendar API base URL
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

    def _fetch_user_calendar_events(self, user_id: str, start_date: datetime, end_date: datetime) -> List[Dict]:
        """Fetch user's existing calendar events from the calendar API"""
        try:
            api_base = self.default_preferences["calendar_api_base"]
            response = requests.get(
                f"{api_base}/api/calendar/events/{user_id}",
                timeout=10
            )
            
            if response.status_code == 200:
                all_events = response.json()
                
                # Filter events within the timeline period
                filtered_events = []
                for event in all_events:
                    # Parse datetime and make timezone-naive for comparison
                    event_start_str = event['startTime'].replace('Z', '+00:00')
                    event_end_str = event['endTime'].replace('Z', '+00:00')
                    
                    event_start = datetime.fromisoformat(event_start_str)
                    event_end = datetime.fromisoformat(event_end_str)
                    
                    # Convert to naive datetime for easier comparison
                    if event_start.tzinfo is not None:
                        event_start = event_start.replace(tzinfo=None)
                    if event_end.tzinfo is not None:
                        event_end = event_end.replace(tzinfo=None)
                    
                    # Check if event overlaps with our timeline period
                    if event_start.date() <= end_date.date() and event_end.date() >= start_date.date():
                        filtered_events.append({
                            'id': event['id'],
                            'title': event['title'],
                            'start': event_start,
                            'end': event_end,
                            'type': event.get('type', 'other')
                        })
                
                print(f"📅 Fetched {len(filtered_events)} calendar events for user {user_id}")
                return filtered_events
                
            else:
                print(f"⚠️ Failed to fetch calendar events: {response.status_code}")
                return []
                
        except Exception as e:
            print(f"❌ Error fetching calendar events: {e}")
            return []

    def _find_available_time_slots(self, target_date: datetime, existing_events: List[Dict], 
                                 session_duration: float, max_daily_hours: float, 
                                 preferred_times: List[str]) -> List[Tuple[datetime, datetime]]:
        """Find available time slots on a given day that don't conflict with existing events"""
        
        # Get events for this specific day and sort by start time
        day_events = []
        for event in existing_events:
            if event['start'].date() == target_date.date():
                day_events.append(event)
        day_events.sort(key=lambda x: x['start'])
        
        # Define full working day range (8 AM to 10 PM)
        day_start = target_date.replace(hour=8, minute=0, second=0, microsecond=0)
        day_end = target_date.replace(hour=22, minute=0, second=0, microsecond=0)
        
        # Create time preference weights (earlier preferred times get higher priority)
        time_preference_order = []
        if "Morning" in preferred_times:
            time_preference_order.extend([(h, 0) for h in range(8, 12)])  # 8 AM - 12 PM
        if "Afternoon" in preferred_times:
            time_preference_order.extend([(h, 0) for h in range(13, 17)])  # 1 PM - 5 PM
        if "Evening" in preferred_times:
            time_preference_order.extend([(h, 0) for h in range(18, 22)])  # 6 PM - 10 PM
        
        # If no preferences, use full day
        if not time_preference_order:
            time_preference_order = [(h, 0) for h in range(8, 22)]
        
        available_slots = []
        
        # Try to find slots in preference order, but also check gaps between events
        all_potential_slots = []
        
        # 1. Check all preferred time slots in 30-minute increments
        for hour, minute in time_preference_order:
            current_time = target_date.replace(hour=hour, minute=minute, second=0, microsecond=0)
            
            # Try every 30 minutes within this hour
            for offset in [0, 30]:
                slot_start = current_time + timedelta(minutes=offset)
                slot_end = slot_start + timedelta(hours=session_duration)
                
                # Make sure slot is within working hours
                if slot_end <= day_end:
                    all_potential_slots.append((slot_start, slot_end))
        
        # 2. Also check gaps between existing events
        if day_events:
            # Check before first event
            first_event_start = day_events[0]['start'].replace(tzinfo=None) if day_events[0]['start'].tzinfo else day_events[0]['start']
            if first_event_start > day_start:
                gap_start = day_start
                gap_end = first_event_start
                self._add_slots_in_gap(gap_start, gap_end, session_duration, all_potential_slots)
            
            # Check gaps between events
            for i in range(len(day_events) - 1):
                event_end = day_events[i]['end'].replace(tzinfo=None) if day_events[i]['end'].tzinfo else day_events[i]['end']
                next_event_start = day_events[i + 1]['start'].replace(tzinfo=None) if day_events[i + 1]['start'].tzinfo else day_events[i + 1]['start']
                gap_start = event_end
                gap_end = next_event_start
                self._add_slots_in_gap(gap_start, gap_end, session_duration, all_potential_slots)
            
            # Check after last event
            last_event_end = day_events[-1]['end'].replace(tzinfo=None) if day_events[-1]['end'].tzinfo else day_events[-1]['end']
            if last_event_end < day_end:
                gap_start = last_event_end
                gap_end = day_end
                self._add_slots_in_gap(gap_start, gap_end, session_duration, all_potential_slots)
        else:
            # No events, can use any time in the day
            current_time = day_start
            while current_time + timedelta(hours=session_duration) <= day_end:
                all_potential_slots.append((current_time, current_time + timedelta(hours=session_duration)))
                current_time += timedelta(minutes=30)
        
        # Remove duplicates and sort by start time
        unique_slots = list(set(all_potential_slots))
        unique_slots.sort(key=lambda x: x[0])
        
        # Filter out conflicting slots
        for slot_start, slot_end in unique_slots:
            conflict = False
            for event in day_events:
                # Ensure timezone-naive datetime comparison
                event_start = event['start'].replace(tzinfo=None) if event['start'].tzinfo else event['start']
                event_end = event['end'].replace(tzinfo=None) if event['end'].tzinfo else event['end']
                
                # Check for overlap (any overlap is a conflict)
                if (slot_start < event_end and slot_end > event_start):
                    conflict = True
                    break
            
            if not conflict:
                available_slots.append((slot_start, slot_end))
        
        # Limit total study hours per day and prioritize earlier slots
        total_hours_scheduled = 0
        final_slots = []
        
        for slot_start, slot_end in available_slots:
            slot_duration = (slot_end - slot_start).total_seconds() / 3600
            
            if total_hours_scheduled + slot_duration <= max_daily_hours:
                final_slots.append((slot_start, slot_end))
                total_hours_scheduled += slot_duration
            
            if total_hours_scheduled >= max_daily_hours:
                break
        
        return final_slots

    def _add_slots_in_gap(self, gap_start: datetime, gap_end: datetime, session_duration: float, slots_list: List[Tuple[datetime, datetime]]):
        """Add potential time slots within a gap between events"""
        current_time = gap_start
        
        # Round up to next 30-minute mark for cleaner scheduling
        if current_time.minute not in [0, 30]:
            if current_time.minute <= 30:
                current_time = current_time.replace(minute=30, second=0, microsecond=0)
            else:
                current_time = (current_time + timedelta(hours=1)).replace(minute=0, second=0, microsecond=0)
        
        while current_time + timedelta(hours=session_duration) <= gap_end:
            slot_end = current_time + timedelta(hours=session_duration)
            slots_list.append((current_time, slot_end))
            current_time += timedelta(minutes=30)

    def _check_and_resolve_conflicts(self, events: List[Dict], user_id: str) -> List[Dict]:
        """Check for conflicts with existing calendar and reschedule if necessary"""
        if not events or not user_id:
            return events
        
        # Get date range for timeline
        timeline_start = min(datetime.fromisoformat(event['startTime'].replace('Z', '+00:00')).replace(tzinfo=None) for event in events)
        timeline_end = max(datetime.fromisoformat(event['endTime'].replace('Z', '+00:00')).replace(tzinfo=None) for event in events)
        
        # Extend timeline range to allow for spillover days
        timeline_end = timeline_end + timedelta(days=14)  # Allow 2 weeks spillover
        
        # Fetch existing calendar events
        existing_events = self._fetch_user_calendar_events(user_id, timeline_start, timeline_end)
        
        if not existing_events:
            print("📅 No existing calendar events found, proceeding with original timeline")
            return events
        
        print(f"🔍 Checking for conflicts with {len(existing_events)} existing events...")
        
        resolved_events = []
        conflicts_found = 0
        spillover_days = 0
        
        max_daily_hours = self.default_preferences["max_daily_study_hours"]
        preferred_times = self.default_preferences["preferred_times"]
        max_session_length = self.default_preferences["max_session_length"]
        
        # Process events in chronological order
        events_sorted = sorted(events, key=lambda x: datetime.fromisoformat(x['startTime'].replace('Z', '+00:00')).replace(tzinfo=None))
        
        for event in events_sorted:
            original_start = datetime.fromisoformat(event['startTime'].replace('Z', '+00:00')).replace(tzinfo=None)
            original_date = original_start.date()
            
            event_duration = (
                datetime.fromisoformat(event['endTime'].replace('Z', '+00:00')).replace(tzinfo=None) - 
                original_start
            ).total_seconds() / 3600
            
            scheduled = False
            days_checked = 0
            current_date = original_date
            
            # Try to schedule on the original day first, then subsequent days
            while not scheduled and days_checked < 14:  # Max 2 weeks ahead
                target_date = datetime.combine(current_date, datetime.min.time())
                
                # Check if we've already scheduled too many hours for this day
                daily_hours_used = sum(
                    (datetime.fromisoformat(e['endTime'].replace('Z', '+00:00')).replace(tzinfo=None) - 
                     datetime.fromisoformat(e['startTime'].replace('Z', '+00:00')).replace(tzinfo=None)).total_seconds() / 3600
                    for e in resolved_events
                    if datetime.fromisoformat(e['startTime'].replace('Z', '+00:00')).replace(tzinfo=None).date() == current_date
                )
                
                if daily_hours_used + event_duration <= max_daily_hours:
                    # Convert resolved events to the same format as existing events for conflict checking
                    resolved_events_formatted = []
                    for re in resolved_events:
                        resolved_events_formatted.append({
                            'id': re['id'],
                            'title': re['title'],
                            'start': datetime.fromisoformat(re['startTime'].replace('Z', '+00:00')).replace(tzinfo=None),
                            'end': datetime.fromisoformat(re['endTime'].replace('Z', '+00:00')).replace(tzinfo=None),
                            'type': re.get('type', 'other')
                        })
                    
                    # Find available slots for this day
                    available_slots = self._find_available_time_slots(
                        target_date, existing_events + resolved_events_formatted,
                        event_duration, max_daily_hours - daily_hours_used, preferred_times
                    )
                    
                    if available_slots:
                        # Use the earliest available slot
                        slot_start, slot_end = available_slots[0]
                        
                        # Create the rescheduled event
                        new_event = event.copy()
                        new_event['startTime'] = slot_start.isoformat() + 'Z'
                        new_event['endTime'] = slot_end.isoformat() + 'Z'
                        
                        resolved_events.append(new_event)
                        scheduled = True
                        
                        # Log the rescheduling
                        if current_date != original_date:
                            spillover_days += 1
                            print(f"📅 Moved '{event['title']}' from {original_date} to {current_date} at {slot_start.strftime('%H:%M')}")
                        elif slot_start.time() != original_start.time():
                            conflicts_found += 1
                            print(f"🔄 Rescheduled '{event['title']}' on {current_date} from {original_start.strftime('%H:%M')} to {slot_start.strftime('%H:%M')}")
                        else:
                            # No conflict, kept original time
                            resolved_events.append(event)
                        
                        break
                
                # Move to next day
                current_date += timedelta(days=1)
                days_checked += 1
            
            if not scheduled:
                print(f"❌ Could not reschedule '{event['title']}' within 2 weeks, dropping event")
                conflicts_found += 1
        
        if conflicts_found > 0 or spillover_days > 0:
            print(f"✅ Resolved {conflicts_found} conflicts, moved {spillover_days} events to later days")
        else:
            print("✅ No calendar conflicts found")
        
        # Sort final events by start time
        resolved_events.sort(key=lambda x: datetime.fromisoformat(x['startTime'].replace('Z', '+00:00')))
        
        return resolved_events

    def generate_timeline(self, course_name: str, user_id: str = None, user_preferences: Optional[Dict] = None, custom_requirements: str = "") -> Dict:
        """Generate a personalized learning timeline for a course with calendar conflict checking"""
        
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
        
        # Check for calendar conflicts and reschedule if user_id is provided
        if user_id:
            print(f"🔍 Checking calendar conflicts for user: {user_id}")
            events = self._check_and_resolve_conflicts(events, user_id)
        else:
            print("⚠️ No user_id provided, skipping conflict checking")
        
        # Use course data as-is (LLM will modify via custom requirements)
        actual_weeks = course_data["total_weeks"]
        
        return {
            "timeline_id": f"timeline_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            "course_name": course_name,
            "user_id": user_id,
            "generated_at": datetime.now().isoformat(),
            "total_duration_weeks": actual_weeks,
            "total_hours": course_data["total_hours"],
            "events": events,
            "user_preferences": preferences,
            "custom_requirements": custom_requirements,
            "conflict_checked": user_id is not None
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

Analyze the user's request carefully and make proportional adjustments. Guidelines:
- For "faster" requests: Moderately increase study hours (10-15/week) and reduce weeks by 20-30%
- For "slower" requests: Decrease study hours (5-8/week) and increase weeks by 20-50%
- For specific time mentions: Only use EXACT timeframes if explicitly stated (e.g., "I need this done in exactly 2 days")
- For day preferences: Update preferred_days only if specific days are mentioned
- For session length: Adjust max_session_length only if explicitly requested
- For start date requests: Extract the date and convert to ISO format (YYYY-MM-DD)
- Default to reasonable, sustainable study schedules unless extreme urgency is clearly stated

IMPORTANT: If the user mentions a specific start date (like "start from 25th Sept" or "begin on October 1st"), 
include a "start_date" field in your response with the date in YYYY-MM-DD format.

Be conservative with changes unless the request is very specific about timeline requirements.

Respond with ONLY this JSON format:
{{
  "study_hours_per_week": <number>,
  "preferred_days": ["day1", "day2", "day3", "day4", "day5"],
  "max_session_length": <number>,
  "total_weeks": <number>,
  "start_date": "YYYY-MM-DD (only include if user specifies a start date)",
  "reasoning": "Brief explanation of the specific adjustments made"
}}"""

            # Call OpenRouter API
            headers = {
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
                "HTTP-Referer": "http://localhost:5002",  # Optional: for analytics
                "X-Title": "Timeline Revision System"  # Optional: for analytics
            }
            
            print(f"🔥 Sending LLM request with prompt: {user_prompt[:200]}...")
            
            response = requests.post(
                f"{api_base}/chat/completions",
                json={
                    "model": model,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    "temperature": 0.7,  # Higher temperature for more varied responses
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
                        
                        raw_prefs = json.loads(content)
                        # Only keep expected fields
                        expected_fields = [
                            "study_hours_per_week",
                            "preferred_days",
                            "max_session_length",
                            "total_weeks",
                            "reasoning",
                            "start_date"
                        ]
                        revised_prefs = {k: v for k, v in raw_prefs.items() if k in expected_fields}
                        print(f"✅ LLM successfully parsed revision (filtered): {revised_prefs}")
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

Analyze the requirement carefully and make proportional adjustments to the course structure:

- For general "faster" requests: Reduce weeks by 20-30% (e.g., 8 weeks → 5-6 weeks)
- For general "slower" requests: Increase weeks by 30-50% (e.g., 8 weeks → 10-12 weeks)
- For "intensive" requests: Keep same content but compress timeline (reduce weeks, keep all modules)
- For specific timeframes: Only use EXACT durations if clearly stated (e.g., "complete in exactly 2 days")
- For content changes: Only reduce modules if explicitly requested or for extreme time constraints

Be conservative and maintain educational value unless extreme urgency is clearly specified.

Respond with ONLY this JSON format:
{{
  "total_weeks": <number (use decimals only for very specific short requests)>,
  "total_hours": <number (usually keep original unless modules change)>,
  "modules_to_keep": <number (usually keep all unless extreme constraints)>,
  "reasoning": "Brief explanation of the specific changes made"
}}"""

            headers = {
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
                "HTTP-Referer": "http://localhost:5002",
                "X-Title": "Course Structure Modification"
            }
            
            print(f"🔥 Sending course structure LLM request: {requirements}")
            
            response = requests.post(
                f"{api_base}/chat/completions",
                json={
                    "model": model,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    "temperature": 0.7,  # Higher temperature for more varied responses
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
        # Use start_date from preferences if provided, else default to tomorrow
        custom_start_date = None
        if 'start_date' in preferences and preferences['start_date']:
            try:
                custom_start_date = datetime.strptime(preferences['start_date'], "%Y-%m-%d")
            except Exception as e:
                print(f"⚠️ Invalid start_date format: {preferences['start_date']} - {e}")
            
        # Use CURRENT date, not a fixed past date
        start_date = custom_start_date if custom_start_date else datetime.now()
        
        
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

    def revise_timeline(self, timeline_id: str, revision_request: str, user_id: str = None) -> Dict:
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
            user_id = user_id or existing_timeline.get("user_id")  # Use existing user_id if not provided
        else:
            modified_preferences = self.default_preferences.copy()
            course_name = "Advanced Python for Data Science"
            existing_custom_requirements = ""
        
        # Use LLM to intelligently revise the timeline
        print(f"🤖 Using AI to revise timeline based on: '{revision_request}'")
        print(f"📊 Current preferences: {modified_preferences}")
        
        timeline_context = existing_timeline or {
            "course_name": course_name,
            "user_id": user_id,
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
                if isinstance(llm_revisions["preferred_times"], list):
                    modified_preferences["preferred_times"] = llm_revisions["preferred_times"]
            # Actually set the start_date in preferences if provided
            if "start_date" in llm_revisions and llm_revisions["start_date"]:
                modified_preferences["start_date"] = llm_revisions["start_date"]
                print(f"📅 LLM specified start date: {llm_revisions['start_date']}")
                    
        else:
            print("⚠️ LLM unavailable - timeline revision will not work properly without AI")
            # No hardcoded fallback - we want to encourage LLM usage
        
        # Don't pass combined requirements to avoid double LLM processing
        # The LLM has already processed the revision request above
        
        # Manually apply course structure changes if LLM provided them
        course_data = self.course_templates.get(course_name, self._create_default_course(course_name)).copy()
        if llm_revisions and "total_weeks" in llm_revisions:
            course_data["total_weeks"] = llm_revisions["total_weeks"]
            print(f"📅 Manually adjusting course duration to {course_data['total_weeks']} weeks based on LLM")
        
        print(f"🎯 Final preferences for new timeline: {modified_preferences}")
        print(f"📚 Course data weeks: {course_data['total_weeks']}")
        
        # Generate timeline directly with pre-modified course data and preferences
        # Skip LLM processing in generate_timeline since we already processed the revision
        events = self._generate_events(course_data, modified_preferences)
        
        # Check for calendar conflicts and reschedule if user_id is provided
        if user_id:
            print(f"🔍 Checking calendar conflicts for user: {user_id}")
            events = self._check_and_resolve_conflicts(events, user_id)
        else:
            print("⚠️ No user_id provided, skipping conflict checking")
        
        # Build timeline manually to avoid double LLM calls
        new_timeline = {
            "timeline_id": f"timeline_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            "course_name": course_name,
            "user_id": user_id,
            "generated_at": datetime.now().isoformat(),
            "total_duration_weeks": course_data["total_weeks"],
            "total_hours": course_data["total_hours"],
            "events": events,
            "user_preferences": modified_preferences,
            "custom_requirements": f"{existing_custom_requirements} {revision_request}".strip(),
            "revision_request": revision_request,
            "llm_revisions_applied": llm_revisions,
            "conflict_checked": user_id is not None
        }
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
    
    # Generate a sample timeline with user ID for conflict checking
    timeline = generator.generate_timeline(
        "Advanced Python for Data Science",
        user_id="mgr001",  # Test with a user who has existing calendar events
        user_preferences={
            "study_hours_per_week": 10,
            "preferred_days": ["Monday", "Wednesday", "Friday"],
            "preferred_times": ["Morning", "Evening"]
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