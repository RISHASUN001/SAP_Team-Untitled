import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, Users, Sparkles, CheckCircle, ArrowRight, Edit, Loader2 } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';

interface CourseEnrollmentFlowProps {
  course: any;
  isOpen: boolean;
  onClose: () => void;
}

const CourseEnrollmentFlow = ({
  course,
  isOpen,
  onClose
}: CourseEnrollmentFlowProps) => {
  const { currentUser } = useAuth();
  const { enrollInCourse } = useData();
  const navigate = useNavigate();
  
  const [currentStep, setCurrentStep] = useState(1); // 1: Confirm, 2: Timeline, 3: Edit Timeline, 4: Success
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [isGeneratingTimeline, setIsGeneratingTimeline] = useState(false);
  const [generatedTimeline, setGeneratedTimeline] = useState<any>(null);
  const [editPrompt, setEditPrompt] = useState('');

  const generateTimeline = async () => {
    if (!currentUser) return;
    
    setIsGeneratingTimeline(true);
    try {
      const response = await fetch('http://localhost:5002/api/timeline/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          course_name: course.title,
          user_id: currentUser.id,
          user_preferences: {
            study_hours_per_week: 8,
            preferred_days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
            max_session_length: 2
          }
        }),
      });
      
      const data = await response.json();
      if (data.success) {
        setGeneratedTimeline(data.timeline);
        setCurrentStep(2);
      } else {
        console.error('Timeline generation failed:', data.error);
      }
    } catch (error) {
      console.error('Timeline generation error:', error);
    } finally {
      setIsGeneratingTimeline(false);
    }
  };

  const handleEnroll = async () => {
    if (!currentUser) return;
    
    setIsEnrolling(true);
    try {
      await enrollInCourse(course.id, currentUser.id);
      // Generate timeline after successful enrollment
      await generateTimeline();
      // Reset enrolling state after successful timeline generation
      setIsEnrolling(false);
    } catch (error) {
      console.error('Enrollment error:', error);
      setIsEnrolling(false);
    }
  };

  const handleEditTimeline = () => {
    setCurrentStep(3);
  };

  const handleReviseTimeline = async () => {
    if (!generatedTimeline || !editPrompt.trim()) return;
    
    setIsGeneratingTimeline(true);
    try {
      const response = await fetch('http://localhost:5002/api/timeline/revise', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          timeline_id: generatedTimeline.timeline_id,
          revision_request: editPrompt
        }),
      });
      
      const data = await response.json();
      if (data.success) {
        setGeneratedTimeline(data.timeline);
        setEditPrompt('');
        setCurrentStep(2);
      } else {
        console.error('Timeline revision failed:', data.error);
      }
    } catch (error) {
      console.error('Timeline revision error:', error);
    } finally {
      setIsGeneratingTimeline(false);
    }
  };

  const handleApproveTimeline = async () => {
    if (!generatedTimeline) return;
    
    try {
      const response = await fetch('http://localhost:5002/api/timeline/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          timeline_id: generatedTimeline.timeline_id
        }),
      });
      
      const data = await response.json();
      if (data.success) {
        // Add events to local calendar
        const existingEvents = JSON.parse(localStorage.getItem('calendarEvents') || '[]');
        const newEvents = data.events.map((event: any) => ({
          ...event,
          id: `timeline_${event.id}`
        }));
        localStorage.setItem('calendarEvents', JSON.stringify([...existingEvents, ...newEvents]));
        setCurrentStep(4);
      } else {
        console.error('Timeline approval failed:', data.error);
      }
    } catch (error) {
      console.error('Timeline approval error:', error);
    }
  };

  const handleClose = () => {
    setCurrentStep(1);
    setGeneratedTimeline(null);
    setEditPrompt('');
    onClose();
  };

  const handleGoToCalendar = () => {
    handleClose();
    navigate('/calendar');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        
        {/* Step 1: Course Confirmation */}
        {currentStep === 1 && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Enroll in Course
              </h2>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                ×
              </button>
            </div>

            {/* Course Details */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-6 mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {course.title}
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                {course.description}
              </p>

              <div className="grid grid-cols-3 gap-4">
                <div className="flex items-center">
                  <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {course.duration}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {course.estimatedHours}h total
                    </p>
                  </div>
                </div>

                <div className="flex items-center">
                  <Users className="h-5 w-5 text-green-600 dark:text-green-400 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {course.difficulty}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Difficulty level
                    </p>
                  </div>
                </div>

                <div className="flex items-center">
                  <Calendar className="h-5 w-5 text-purple-600 dark:text-purple-400 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Self-paced
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Learning mode
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Skills Gained */}
            {course.skills && (
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                  Skills you'll gain:
                </h4>
                <div className="flex flex-wrap gap-2">
                  {course.skills.map((skill: any, index: number) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-sm rounded-full"
                    >
                      {skill.name} (Level {skill.level})
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Next Steps Info */}
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
              <div className="flex">
                <Sparkles className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-yellow-800 dark:text-yellow-300 mb-1">
                    What happens next?
                  </h4>
                  <ul className="text-sm text-yellow-700 dark:text-yellow-400 space-y-1">
                    <li>• AI will generate a personalized learning timeline</li>
                    <li>• You can review and adjust the schedule</li>
                    <li>• Events will be added to your calendar automatically</li>
                    <li>• Track progress with proof submissions</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-4">
              <button
                onClick={handleEnroll}
                disabled={isEnrolling || isGeneratingTimeline}
                className="flex-1 flex items-center justify-center px-6 py-3 bg-primary-500 hover:bg-primary-600 disabled:bg-gray-300 text-white rounded-lg font-medium transition-colors"
              >
                {isEnrolling || isGeneratingTimeline ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    {isEnrolling ? 'Enrolling...' : 'Generating Timeline...'}
                  </>
                ) : (
                  <>
                    <Calendar className="h-5 w-5 mr-2" />
                    Enroll & Create Timeline
                  </>
                )}
              </button>

              <button
                onClick={handleClose}
                className="px-6 py-3 text-gray-700 dark:text-gray-300 border dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Generated Timeline Review */}
        {currentStep === 2 && generatedTimeline && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Recommended Learning Timeline
              </h2>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                ×
              </button>
            </div>

            {/* Timeline Summary */}
            <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-xl p-6 mb-6">
              <div className="flex items-center mb-4">
                <Sparkles className="h-6 w-6 text-green-600 dark:text-green-400 mr-3" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  AI-Generated Study Plan
                </h3>
              </div>
              
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {generatedTimeline.total_duration_weeks}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">weeks duration</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {generatedTimeline.total_hours}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">total hours</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {generatedTimeline.events.length}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">scheduled events</p>
                </div>
              </div>
              
              {generatedTimeline.custom_requirements && (
                <div className="bg-white/50 dark:bg-black/20 rounded-lg p-3">
                  <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                    Custom Requirements Applied:
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {generatedTimeline.custom_requirements}
                  </p>
                </div>
              )}
            </div>

            {/* Timeline Events Preview */}
            <div className="mb-6">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                Upcoming Events (First 5):
              </h4>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {generatedTimeline.events.slice(0, 5).map((event: any, index: number) => (
                  <div key={index} className="flex items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className={`w-3 h-3 rounded-full ${event.color} mr-3`}></div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white text-sm">
                        {event.title}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {new Date(event.startTime).toLocaleDateString()} at {new Date(event.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </p>
                      {event.requires_proof && (
                        <div className="flex items-center mt-1">
                          <CheckCircle className="h-3 w-3 text-blue-500 mr-1" />
                          <span className="text-xs text-blue-600 dark:text-blue-400">Proof required</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-4">
              <button
                onClick={handleApproveTimeline}
                className="flex-1 flex items-center justify-center px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
              >
                <CheckCircle className="h-5 w-5 mr-2" />
                Approve & Add to Calendar
              </button>
              
              <button
                onClick={handleEditTimeline}
                className="px-6 py-3 flex items-center text-gray-700 dark:text-gray-300 border dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Timeline
              </button>
              
              <button
                onClick={handleClose}
                className="px-6 py-3 text-gray-700 dark:text-gray-300 border dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Edit Timeline */}
        {currentStep === 3 && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Edit Timeline
              </h2>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                ×
              </button>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
              <div className="flex">
                <Edit className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-yellow-800 dark:text-yellow-300 mb-2">
                    Tell us how you'd like to adjust your timeline
                  </h4>
                  <p className="text-sm text-yellow-700 dark:text-yellow-400 mb-3">
                    Describe your preferences and our AI will regenerate the timeline accordingly.
                  </p>
                  <div className="text-xs text-yellow-600 dark:text-yellow-500 space-y-1">
                    <p>• "I need more time for each module"</p>
                    <p>• "I can only study on weekends"</p>
                    <p>• "Make it faster, I want to finish in 4 weeks"</p>
                    <p>• "Add more practice sessions"</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <label htmlFor="editPrompt" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Your timeline adjustment request:
              </label>
              <textarea
                id="editPrompt"
                value={editPrompt}
                onChange={(e) => setEditPrompt(e.target.value)}
                placeholder="Describe how you'd like to modify the timeline..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                rows={4}
              />
            </div>

            <div className="flex space-x-4">
              <button
                onClick={handleReviseTimeline}
                disabled={!editPrompt.trim() || isGeneratingTimeline}
                className="flex-1 flex items-center justify-center px-6 py-3 bg-primary-500 hover:bg-primary-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
              >
                {isGeneratingTimeline ? (
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                ) : (
                  <Sparkles className="h-5 w-5 mr-2" />
                )}
                {isGeneratingTimeline ? 'Regenerating...' : 'Regenerate Timeline'}
              </button>
              
              <button
                onClick={() => setCurrentStep(2)}
                className="px-6 py-3 text-gray-700 dark:text-gray-300 border dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Back to Timeline
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Success */}
        {currentStep === 4 && (
          <div className="p-6 text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Enrollment Successful! 🎉
            </h2>

            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
              You're all set! Your personalized learning timeline has been added to your calendar. 
              You'll receive reminders for upcoming activities and deadlines.
            </p>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">
                What's Next?
              </h3>
              <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <div className="flex items-center">
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Check your calendar for upcoming study sessions
                </div>
                <div className="flex items-center">
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Submit proof of completion for graded activities
                </div>
                <div className="flex items-center">
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Track your progress in the Skills section
                </div>
              </div>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={handleGoToCalendar}
                className="flex-1 px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors"
              >
                Go to Calendar
              </button>
              
              <button
                onClick={handleClose}
                className="px-6 py-3 text-gray-700 dark:text-gray-300 border dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Continue Browsing
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseEnrollmentFlow;