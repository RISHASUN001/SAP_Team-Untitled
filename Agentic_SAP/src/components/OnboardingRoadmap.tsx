import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  Circle, 
  Clock, 
  Calendar, 
  ExternalLink, 
  Play, 
  Book, 
  FileText, 
  Laptop, 
  Shield, 
  Code, 
  Users, 
  Database, 
  BarChart3, 
  Github, 
  Target, 
  GraduationCap,
  Award,
  DollarSign,
  Clipboard,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { 
  OnboardingJourney, 
  OnboardingStep,
  getOnboardingJourneyByUserId,
  updateStepCompletion,
  getNextIncompleteStep,
  getCompletedStepsCount,
  saveOnboardingJourney
} from '../data/onboardingData';
import { 
  generatePersonalizedOnboardingJourney,
  regenerateOnboardingJourney
} from '../data/onboardingGenerator';

interface OnboardingRoadmapProps {
  userId: string;
  userProfile?: {
    id: string;
    name: string;
    role: string;
    department: string;
    skills: string[];
    experience: string;
    skillGaps?: string[];
    mentoringNeeds?: string[];
  };
}

const OnboardingRoadmap: React.FC<OnboardingRoadmapProps> = ({ userId, userProfile }) => {
  const [journey, setJourney] = useState<OnboardingJourney | null>(null);
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const userJourney = getOnboardingJourneyByUserId(userId);
    if (userJourney) {
      setJourney(userJourney);
      // Auto-expand the next incomplete step
      const nextStep = getNextIncompleteStep(userJourney);
      if (nextStep) {
        setExpandedSteps(new Set([nextStep.id]));
      }
    }
  }, [userId]);

  const handleGeneratePersonalizedJourney = async () => {
    if (!userProfile) return;
    
    setIsGenerating(true);
    try {
      const newJourney = await generatePersonalizedOnboardingJourney(userProfile);
      saveOnboardingJourney(newJourney);
      setJourney(newJourney);
      
      // Auto-expand the first incomplete step
      const nextStep = getNextIncompleteStep(newJourney);
      if (nextStep) {
        setExpandedSteps(new Set([nextStep.id]));
      }
    } catch (error) {
      console.error('Error generating personalized journey:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerateJourney = async () => {
    if (!userProfile || !journey) return;
    
    setIsGenerating(true);
    try {
      const newJourney = await regenerateOnboardingJourney(
        userProfile, 
        journey, 
        { focusAreas: userProfile.skillGaps }
      );
      saveOnboardingJourney(newJourney);
      setJourney(newJourney);
    } catch (error) {
      console.error('Error regenerating journey:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleStepCompletion = (stepId: string, isCompleted: boolean) => {
    const updatedJourney = updateStepCompletion(userId, stepId, isCompleted);
    if (updatedJourney) {
      setJourney({ ...updatedJourney });
      
      // If step is completed, auto-expand the next incomplete step
      if (isCompleted) {
        const nextStep = getNextIncompleteStep(updatedJourney);
        if (nextStep) {
          setExpandedSteps(new Set([nextStep.id]));
        }
      }
    }
  };

  const toggleStepExpansion = (stepId: string) => {
    const newExpanded = new Set(expandedSteps);
    if (newExpanded.has(stepId)) {
      newExpanded.delete(stepId);
    } else {
      newExpanded.add(stepId);
    }
    setExpandedSteps(newExpanded);
  };

  const getIconForResourceType = (type: string) => {
    const iconMap = {
      video: Play,
      document: Book,
      link: ExternalLink,
      form: FileText,
      system: Shield,
      meeting: Users,
      laptop: Laptop,
      code: Code,
      database: Database,
      chart: BarChart3,
      github: Github,
      target: Target,
      'graduation-cap': GraduationCap,
      award: Award,
      'dollar-sign': DollarSign,
      clipboard: Clipboard,
      users: Users,
      file: FileText,
      book: Book,
      timeline: Clock,
      play: Play,
      shield: Shield
    };
    return iconMap[type as keyof typeof iconMap] || ExternalLink;
  };

  const getStepTypeIcon = (type: string) => {
    const typeIcons = {
      orientation: Users,
      system_access: Shield,
      training: GraduationCap,
      task: Target,
      meeting: Calendar,
      documentation: Book
    };
    return typeIcons[type as keyof typeof typeIcons] || Circle;
  };

  const getStepTypeColor = (type: string, isCompleted: boolean) => {
    if (isCompleted) return 'text-green-500 bg-green-100 dark:bg-green-900/20';
    
    const typeColors = {
      orientation: 'text-blue-500 bg-blue-100 dark:bg-blue-900/20',
      system_access: 'text-purple-500 bg-purple-100 dark:bg-purple-900/20',
      training: 'text-orange-500 bg-orange-100 dark:bg-orange-900/20',
      task: 'text-red-500 bg-red-100 dark:bg-red-900/20',
      meeting: 'text-teal-500 bg-teal-100 dark:bg-teal-900/20',
      documentation: 'text-indigo-500 bg-indigo-100 dark:bg-indigo-900/20'
    };
    return typeColors[type as keyof typeof typeColors] || 'text-gray-500 bg-gray-100 dark:bg-gray-900/20';
  };

  const isStepAvailable = (step: OnboardingStep) => {
    if (!journey || !step.dependencies) return true;
    return step.dependencies.every(depId => 
      journey.steps.find(s => s.id === depId)?.isCompleted
    );
  };

  const getDaysUntilDue = (dueDate?: string) => {
    if (!dueDate) return null;
    const due = new Date(dueDate);
    const now = new Date();
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (!journey) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Your Onboarding Journey
        </h2>
        {userProfile ? (
          <div className="text-center py-8">
            <Sparkles className="h-12 w-12 text-blue-500 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Let AI create a personalized onboarding journey based on your role and skills!
            </p>
            <button
              onClick={handleGeneratePersonalizedJourney}
              disabled={isGenerating}
              className="inline-flex items-center px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-medium rounded-lg transition-colors"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate My Journey
                </>
              )}
            </button>
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400">
            No onboarding journey found for your role. Please contact HR for assistance.
          </p>
        )}
      </div>
    );
  }

  const completedSteps = getCompletedStepsCount(journey);
  const totalSteps = journey.steps.length;
  const nextStep = getNextIncompleteStep(journey);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Your Onboarding Journey
          </h2>
          <div className="flex items-center space-x-2">
            {userProfile && (
              <button
                onClick={handleRegenerateJourney}
                disabled={isGenerating}
                className="inline-flex items-center px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg transition-colors"
                title="Regenerate journey with AI personalization"
              >
                {isGenerating ? (
                  <RefreshCw className="h-3 w-3 animate-spin" />
                ) : (
                  <>
                    <Sparkles className="h-3 w-3 mr-1" />
                    Personalize
                  </>
                )}
              </button>
            )}
            <div className="text-right">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {completedSteps} of {totalSteps} steps completed
              </div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {journey.currentProgress}%
              </div>
            </div>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-4">
          <div
            className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-500"
            style={{ width: `${journey.currentProgress}%` }}
          />
        </div>

        {/* Journey Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="text-gray-600 dark:text-gray-300">
            <span className="font-medium">Role:</span> {journey.role}
          </div>
          <div className="text-gray-600 dark:text-gray-300">
            <span className="font-medium">Started:</span> {new Date(journey.startDate).toLocaleDateString()}
          </div>
          <div className="text-gray-600 dark:text-gray-300">
            <span className="font-medium">Target Completion:</span> {new Date(journey.estimatedCompletionDate).toLocaleDateString()}
          </div>
        </div>

        {/* Next Step Highlight */}
        {nextStep && (
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Next: {nextStep.title}
              </span>
              {nextStep.dueDate && (
                <span className="text-xs text-blue-600 dark:text-blue-300">
                  Due {getDaysUntilDue(nextStep.dueDate)} days
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Roadmap Steps */}
      <div className="space-y-4">
        {journey.steps.map((step, index) => {
          const isExpanded = expandedSteps.has(step.id);
          const isAvailable = isStepAvailable(step);
          const StepIcon = getStepTypeIcon(step.type);
          const daysUntilDue = getDaysUntilDue(step.dueDate);
          
          return (
            <div
              key={step.id}
              className={`border rounded-lg transition-all duration-200 ${
                step.isCompleted 
                  ? 'border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-900/10' 
                  : isAvailable
                    ? 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                    : 'border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50'
              }`}
            >
              {/* Step Header */}
              <div
                className="p-4 cursor-pointer"
                onClick={() => toggleStepExpansion(step.id)}
              >
                <div className="flex items-center space-x-4">
                  {/* Step Number & Status */}
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      {step.isCompleted ? (
                        <CheckCircle className="h-6 w-6 text-green-500" />
                      ) : isAvailable ? (
                        <Circle className="h-6 w-6 text-gray-400" />
                      ) : (
                        <Circle className="h-6 w-6 text-gray-300" />
                      )}
                      <div className="absolute -top-1 -left-1 text-xs font-bold text-gray-600 dark:text-gray-400">
                        {index + 1}
                      </div>
                    </div>
                    
                    {/* Connecting Line */}
                    {index < journey.steps.length - 1 && (
                      <div className="absolute left-7 mt-6 w-0.5 h-8 bg-gray-200 dark:bg-gray-700" />
                    )}
                  </div>

                  {/* Step Type Icon */}
                  <div className={`p-2 rounded-lg ${getStepTypeColor(step.type, step.isCompleted)}`}>
                    <StepIcon className="h-4 w-4" />
                  </div>

                  {/* Step Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className={`font-medium ${
                        isAvailable ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {step.title}
                      </h3>
                      <div className="flex items-center space-x-2">
                        {step.priority === 'high' && (
                          <span className="px-2 py-1 text-xs font-medium bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded">
                            High Priority
                          </span>
                        )}
                        {daysUntilDue !== null && (
                          <span className={`px-2 py-1 text-xs font-medium rounded ${
                            daysUntilDue < 0 
                              ? 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                              : daysUntilDue <= 3
                                ? 'bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300'
                                : 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                          }`}>
                            {daysUntilDue < 0 ? `${Math.abs(daysUntilDue)}d overdue` : `${daysUntilDue}d left`}
                          </span>
                        )}
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {step.estimatedDuration}
                        </span>
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-gray-400" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-gray-400" />
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      {step.description}
                    </p>
                    <div className="flex items-center space-x-4 mt-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                        {step.category}
                      </span>
                      {!isAvailable && (
                        <span className="text-xs text-orange-600 dark:text-orange-400">
                          Waiting for dependencies
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Completion Checkbox */}
                  {isAvailable && (
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={step.isCompleted}
                        onChange={(e) => handleStepCompletion(step.id, e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        disabled={!isAvailable}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Expanded Content */}
              {isExpanded && step.resources && step.resources.length > 0 && (
                <div className="px-4 pb-4 border-t border-gray-100 dark:border-gray-700">
                  <div className="pt-4">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                      Resources & Next Steps
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {step.resources.map((resource, resourceIndex) => {
                        const ResourceIcon = getIconForResourceType(resource.icon || resource.type);
                        return (
                          <a
                            key={resourceIndex}
                            href={resource.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-start space-x-3 p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                          >
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded">
                              <ResourceIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h5 className="text-sm font-medium text-gray-900 dark:text-white">
                                {resource.title}
                              </h5>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {resource.description}
                              </p>
                              <div className="flex items-center mt-2 text-xs text-blue-600 dark:text-blue-400">
                                <ExternalLink className="h-3 w-3 mr-1" />
                                Open {resource.type}
                              </div>
                            </div>
                          </a>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Journey Completion */}
      {journey.currentProgress === 100 && (
        <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <span className="font-medium text-green-900 dark:text-green-100">
              Congratulations! You've completed your onboarding journey! 🎉
            </span>
          </div>
          <p className="text-sm text-green-700 dark:text-green-300 mt-2">
            Welcome to the team! Continue your growth with our ongoing learning and development programs.
          </p>
        </div>
      )}
    </div>
  );
};

export default OnboardingRoadmap;