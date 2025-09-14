import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Edit, 
  Check, 
  X, 
  Plus,
  Trash2,
  Sparkles,
  Save,
  RotateCcw
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';

interface TimelinePlannerProps {
  courseId: string;
  onPlanApproved: (planId: string) => void;
  onCancel: () => void;
}

const TimelinePlanner: React.FC<TimelinePlannerProps> = ({ 
  courseId, 
  onPlanApproved, 
  onCancel 
}) => {
  const { currentUser } = useAuth();
  const {
    createLearningPlan,
    learningPlans,
    revisePlan,
    approvePlan,
    timelineEvents,
    updateTimelineEvent,
    generateTimelineWithAI,
    courseEnrollments
  } = useData();

  const [currentPlanId, setCurrentPlanId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [revisionReason, setRevisionReason] = useState('');
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);

  const currentPlan = currentPlanId 
    ? learningPlans.find(p => p.id === currentPlanId)
    : null;

  const currentTimeline = currentPlan?.currentPlan || [];

  useEffect(() => {
    if (courseId && currentUser && !currentPlanId) {
      generateInitialPlan();
    }
  }, [courseId, currentUser]);

  const generateInitialPlan = async () => {
    if (!currentUser) return;
    
    setIsGenerating(true);
    try {
      const planId = await createLearningPlan(courseId, currentUser.id);
      setCurrentPlanId(planId);
    } catch (error) {
      console.error('Error generating plan:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReviseWithAI = async () => {
    if (!currentPlanId || !revisionReason.trim()) return;
    
    setIsGenerating(true);
    try {
      await revisePlan(currentPlanId, revisionReason, 'ai');
      setShowRevisionModal(false);
      setRevisionReason('');
    } catch (error) {
      console.error('Error revising plan:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleManualEdit = (event: any) => {
    setEditingEvent({ ...event });
  };

  const saveEventEdit = () => {
    if (!editingEvent) return;
    
    updateTimelineEvent(editingEvent.id, {
      title: editingEvent.title,
      description: editingEvent.description,
      scheduledDate: new Date(editingEvent.scheduledDate),
      estimatedHours: editingEvent.estimatedHours,
      type: editingEvent.type,
      proofRequired: editingEvent.proofRequired
    });
    
    setEditingEvent(null);
  };

  const addNewEvent = () => {
    const newEvent = {
      id: `timeline_${Date.now()}`,
      courseEnrollmentId: '',
      title: 'New Learning Activity',
      description: 'Add description here',
      scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      estimatedHours: 2,
      type: 'study',
      completed: false,
      proofRequired: false
    };
    
    setEditingEvent(newEvent);
  };

  const removeEvent = (eventId: string) => {
    if (!currentPlan) return;
    
    const updatedTimeline = currentPlan.currentPlan.filter(e => e.id !== eventId);
    // This would need to be handled through the context
    // For now, we'll update the timeline event to mark it as deleted
    updateTimelineEvent(eventId, { completed: true });
  };

  const handleApprovePlan = () => {
    if (!currentPlanId) return;
    
    approvePlan(currentPlanId);
    onPlanApproved(currentPlanId);
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'study': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'assignment': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'exam': return 'bg-red-100 text-red-800 border-red-200';
      case 'project': return 'bg-green-100 text-green-800 border-green-200';
      case 'review': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (isGenerating) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <Sparkles className="h-8 w-8 animate-spin mx-auto mb-4 text-primary-500" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Generating Your Learning Timeline
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            AI is creating a personalized learning plan based on your schedule and goals...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm">
        {/* Header */}
        <div className="p-6 border-b dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Learning Timeline
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Review and customize your personalized learning plan
              </p>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowRevisionModal(true)}
                className="flex items-center px-4 py-2 text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-lg font-medium transition-colors"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Revise with AI
              </button>
              
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="flex items-center px-4 py-2 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg font-medium transition-colors"
              >
                <Edit className="h-4 w-4 mr-2" />
                {isEditing ? 'Done Editing' : 'Manual Edit'}
              </button>
            </div>
          </div>

          {currentPlan && (
            <div className="flex items-center space-x-6 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center">
                <CalendarIcon className="h-4 w-4 mr-1" />
                Created {formatDate(currentPlan.createdAt)}
              </div>
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                {currentTimeline.reduce((acc, event) => acc + (event.estimatedHours || 0), 0)} total hours
              </div>
              <div className="flex items-center">
                <RotateCcw className="h-4 w-4 mr-1" />
                {currentPlan.revisions.length} revisions
              </div>
            </div>
          )}
        </div>

        {/* Timeline */}
        <div className="p-6">
          <div className="space-y-4">
            {currentTimeline.map((event, index) => (
              <TimelineEventCard
                key={event.id}
                event={event}
                index={index}
                isEditing={isEditing}
                onEdit={handleManualEdit}
                onRemove={removeEvent}
                editingEvent={editingEvent}
                onSaveEdit={saveEventEdit}
                onCancelEdit={() => setEditingEvent(null)}
                getTypeColor={getTypeColor}
                formatDate={formatDate}
              />
            ))}

            {isEditing && (
              <button
                onClick={addNewEvent}
                className="w-full flex items-center justify-center p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-primary-400 dark:hover:border-primary-500 transition-colors"
              >
                <Plus className="h-5 w-5 mr-2" />
                Add New Activity
              </button>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t dark:border-gray-700 flex justify-between">
          <button
            onClick={onCancel}
            className="px-6 py-2 text-gray-700 dark:text-gray-300 border dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          
          <button
            onClick={handleApprovePlan}
            className="flex items-center px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
          >
            <Check className="h-4 w-4 mr-2" />
            Approve & Add to Calendar
          </button>
        </div>
      </div>

      {/* AI Revision Modal */}
      {showRevisionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Revise Timeline with AI
            </h3>
            
            <textarea
              value={revisionReason}
              onChange={(e) => setRevisionReason(e.target.value)}
              placeholder="Describe what adjustments you need (e.g., 'I have less time on weekends', 'I enrolled in another course', 'Make it more intensive')"
              className="w-full h-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white resize-none"
            />
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleReviseWithAI}
                disabled={!revisionReason.trim() || isGenerating}
                className="flex-1 flex items-center justify-center px-4 py-2 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-300 text-white rounded-lg font-medium transition-colors"
              >
                {isGenerating ? (
                  <Sparkles className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Revise
                  </>
                )}
              </button>
              
              <button
                onClick={() => {
                  setShowRevisionModal(false);
                  setRevisionReason('');
                }}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 border dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Event Edit Modal */}
      {editingEvent && (
        <EventEditModal
          event={editingEvent}
          onSave={saveEventEdit}
          onCancel={() => setEditingEvent(null)}
          onChange={setEditingEvent}
        />
      )}
    </div>
  );
};

// Timeline Event Card Component
interface TimelineEventCardProps {
  event: any;
  index: number;
  isEditing: boolean;
  onEdit: (event: any) => void;
  onRemove: (eventId: string) => void;
  editingEvent: any;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  getTypeColor: (type: string) => string;
  formatDate: (date: Date | string) => string;
}

const TimelineEventCard: React.FC<TimelineEventCardProps> = ({
  event,
  index,
  isEditing,
  onEdit,
  onRemove,
  getTypeColor,
  formatDate
}) => {
  return (
    <div className="flex items-start space-x-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
      {/* Timeline indicator */}
      <div className="flex flex-col items-center">
        <div className="w-8 h-8 bg-primary-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
          {index + 1}
        </div>
        {index < 2 && <div className="w-0.5 h-8 bg-gray-300 dark:bg-gray-600 mt-2" />}
      </div>

      {/* Event content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900 dark:text-white">
              {event.title}
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {event.description}
            </p>
            
            <div className="flex items-center space-x-4 mt-3">
              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                <CalendarIcon className="h-4 w-4 mr-1" />
                {formatDate(event.scheduledDate)}
              </div>
              
              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                <Clock className="h-4 w-4 mr-1" />
                {event.estimatedHours}h
              </div>
              
              <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getTypeColor(event.type)}`}>
                {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
              </span>
              
              {event.proofRequired && (
                <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200 rounded-full">
                  Proof Required
                </span>
              )}
            </div>
          </div>

          {isEditing && (
            <div className="flex space-x-2">
              <button
                onClick={() => onEdit(event)}
                className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
              >
                <Edit className="h-4 w-4" />
              </button>
              <button
                onClick={() => onRemove(event.id)}
                className="p-1 text-gray-400 hover:text-red-600 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Event Edit Modal Component
interface EventEditModalProps {
  event: any;
  onSave: () => void;
  onCancel: () => void;
  onChange: (event: any) => void;
}

const EventEditModal: React.FC<EventEditModalProps> = ({ event, onSave, onCancel, onChange }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Edit Learning Activity
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Title
            </label>
            <input
              type="text"
              value={event.title}
              onChange={(e) => onChange({ ...event, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              value={event.description}
              onChange={(e) => onChange({ ...event, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Scheduled Date
            </label>
            <input
              type="date"
              value={event.scheduledDate}
              onChange={(e) => onChange({ ...event, scheduledDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Estimated Hours
            </label>
            <input
              type="number"
              value={event.estimatedHours}
              onChange={(e) => onChange({ ...event, estimatedHours: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
              min="1"
              max="24"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Type
            </label>
            <select
              value={event.type}
              onChange={(e) => onChange({ ...event, type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="study">Study</option>
              <option value="assignment">Assignment</option>
              <option value="exam">Exam</option>
              <option value="project">Project</option>
              <option value="review">Review</option>
            </select>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="proofRequired"
              checked={event.proofRequired}
              onChange={(e) => onChange({ ...event, proofRequired: e.target.checked })}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="proofRequired" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
              Proof of completion required
            </label>
          </div>
        </div>

        <div className="flex space-x-3 mt-6">
          <button
            onClick={onSave}
            className="flex-1 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors"
          >
            <Save className="h-4 w-4 mr-2 inline" />
            Save Changes
          </button>
          
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 border dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default TimelinePlanner;