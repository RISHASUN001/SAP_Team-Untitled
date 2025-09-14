import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Types for our data structures
export interface CourseEnrollment {
  id: string;
  userId: string;
  courseId: string;
  enrolledAt: Date;
  status: 'active' | 'completed' | 'paused';
  progress: number;
  estimatedCompletionDate: Date;
  actualCompletionDate?: Date;
  timeline: TimelineEvent[];
  completionProofs: CompletionProof[];
}

export interface TimelineEvent {
  id: string;
  courseEnrollmentId: string;
  title: string;
  description: string;
  scheduledDate: Date;
  estimatedHours: number;
  type: 'study' | 'assignment' | 'exam' | 'project' | 'review';
  completed: boolean;
  completedAt?: Date;
  proofRequired: boolean;
  proofSubmitted?: CompletionProof;
}

export interface CompletionProof {
  id: string;
  timelineEventId: string;
  userId: string;
  submittedAt: Date;
  proofType: 'image' | 'document' | 'link' | 'text';
  content: string; // Base64 for images, URL for links, text content for text
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewedAt?: Date;
  reviewComments?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  type: 'meeting' | 'deadline' | 'course' | 'goal_milestone' | 'study_session';
  startTime: string;
  endTime: string;
  description?: string;
  location?: string;
  attendees?: string[];
  color: string;
  courseEnrollmentId?: string;
  timelineEventId?: string;
  proofRequired?: boolean;
  proofSubmitted?: boolean;
}

export interface LearningPlan {
  id: string;
  userId: string;
  courseId: string;
  originalPlan: TimelineEvent[];
  currentPlan: TimelineEvent[];
  revisions: PlanRevision[];
  createdAt: Date;
  lastModified: Date;
  status: 'draft' | 'active' | 'completed' | 'paused';
}

export interface PlanRevision {
  id: string;
  planId: string;
  reason: string;
  changes: string;
  revisedBy: 'ai' | 'user';
  createdAt: Date;
  previousPlan: TimelineEvent[];
  newPlan: TimelineEvent[];
}

interface DataContextType {
  // Calendar Events
  calendarEvents: CalendarEvent[];
  addCalendarEvent: (event: Omit<CalendarEvent, 'id'>) => void;
  updateCalendarEvent: (id: string, event: Partial<CalendarEvent>) => void;
  deleteCalendarEvent: (id: string) => void;
  
  // Course Enrollments
  courseEnrollments: CourseEnrollment[];
  enrollInCourse: (courseId: string, userId: string) => Promise<string>;
  updateEnrollmentProgress: (enrollmentId: string, progress: number) => void;
  
  // Learning Plans
  learningPlans: LearningPlan[];
  createLearningPlan: (courseId: string, userId: string) => Promise<string>;
  revisePlan: (planId: string, reason: string, revisedBy: 'ai' | 'user') => Promise<void>;
  approvePlan: (planId: string) => void;
  
  // Timeline Events
  timelineEvents: TimelineEvent[];
  updateTimelineEvent: (id: string, updates: Partial<TimelineEvent>) => void;
  
  // Completion Proofs
  completionProofs: CompletionProof[];
  submitProof: (eventId: string, userId: string, proof: Omit<CompletionProof, 'id' | 'submittedAt' | 'status'>) => void;
  reviewProof: (proofId: string, status: 'approved' | 'rejected', comments?: string, reviewerId?: string) => void;
  
  // AI Integration
  generateTimelineWithAI: (courseId: string, userId: string, constraints?: any) => Promise<TimelineEvent[]>;
  adjustTimelineForConflicts: (planId: string, newEnrollments: string[]) => Promise<TimelineEvent[]>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

interface DataProviderProps {
  children: ReactNode;
}

export const DataProvider = ({ children }: DataProviderProps) => {
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [courseEnrollments, setCourseEnrollments] = useState<CourseEnrollment[]>([]);
  const [learningPlans, setLearningPlans] = useState<LearningPlan[]>([]);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [completionProofs, setCompletionProofs] = useState<CompletionProof[]>([]);

  // Load data from localStorage on initial render
  useEffect(() => {
    const loadData = () => {
      try {
        const savedCalendarEvents = localStorage.getItem('calendarEvents');
        const savedEnrollments = localStorage.getItem('courseEnrollments');
        const savedPlans = localStorage.getItem('learningPlans');
        const savedTimeline = localStorage.getItem('timelineEvents');
        const savedProofs = localStorage.getItem('completionProofs');

        if (savedCalendarEvents) {
          setCalendarEvents(JSON.parse(savedCalendarEvents));
        }
        if (savedEnrollments) {
          setCourseEnrollments(JSON.parse(savedEnrollments));
        }
        if (savedPlans) {
          setLearningPlans(JSON.parse(savedPlans));
        }
        if (savedTimeline) {
          setTimelineEvents(JSON.parse(savedTimeline));
        }
        if (savedProofs) {
          setCompletionProofs(JSON.parse(savedProofs));
        }
      } catch (error) {
        console.error('Error loading data from localStorage:', error);
      }
    };

    loadData();
  }, []);

  // Save data to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem('calendarEvents', JSON.stringify(calendarEvents));
  }, [calendarEvents]);

  useEffect(() => {
    localStorage.setItem('courseEnrollments', JSON.stringify(courseEnrollments));
  }, [courseEnrollments]);

  useEffect(() => {
    localStorage.setItem('learningPlans', JSON.stringify(learningPlans));
  }, [learningPlans]);

  useEffect(() => {
    localStorage.setItem('timelineEvents', JSON.stringify(timelineEvents));
  }, [timelineEvents]);

  useEffect(() => {
    localStorage.setItem('completionProofs', JSON.stringify(completionProofs));
  }, [completionProofs]);

  // Calendar Events Functions
  const addCalendarEvent = (event: Omit<CalendarEvent, 'id'>) => {
    const newEvent: CalendarEvent = {
      ...event,
      id: Date.now().toString(),
    };
    setCalendarEvents((prev: CalendarEvent[]) => [...prev, newEvent]);
  };

  const updateCalendarEvent = (id: string, updates: Partial<CalendarEvent>) => {
    setCalendarEvents((prev: CalendarEvent[]) => 
      prev.map((event: CalendarEvent) => event.id === id ? { ...event, ...updates } : event)
    );
  };

  const deleteCalendarEvent = (id: string) => {
    setCalendarEvents((prev: CalendarEvent[]) => prev.filter((event: CalendarEvent) => event.id !== id));
  };

  // Course Enrollment Functions
  const enrollInCourse = async (courseId: string, userId: string): Promise<string> => {
    const enrollmentId = Date.now().toString();
    const enrollment: CourseEnrollment = {
      id: enrollmentId,
      userId,
      courseId,
      enrolledAt: new Date(),
      status: 'active',
      progress: 0,
      estimatedCompletionDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      timeline: [],
      completionProofs: []
    };

    setCourseEnrollments((prev: CourseEnrollment[]) => [...prev, enrollment]);
    return enrollmentId;
  };

  const updateEnrollmentProgress = (enrollmentId: string, progress: number) => {
    setCourseEnrollments((prev: CourseEnrollment[]) =>
      prev.map((enrollment: CourseEnrollment) =>
        enrollment.id === enrollmentId ? { ...enrollment, progress } : enrollment
      )
    );
  };

  // Learning Plan Functions
  const createLearningPlan = async (courseId: string, userId: string): Promise<string> => {
    // Generate AI timeline
    const aiTimeline = await generateTimelineWithAI(courseId, userId);
    
    const planId = Date.now().toString();
    const plan: LearningPlan = {
      id: planId,
      userId,
      courseId,
      originalPlan: aiTimeline,
      currentPlan: aiTimeline,
      revisions: [],
      createdAt: new Date(),
      lastModified: new Date(),
      status: 'draft'
    };

    setLearningPlans((prev: LearningPlan[]) => [...prev, plan]);
    setTimelineEvents((prev: TimelineEvent[]) => [...prev, ...aiTimeline]);
    
    return planId;
  };

  const revisePlan = async (planId: string, reason: string, revisedBy: 'ai' | 'user') => {
    const plan = learningPlans.find((p: LearningPlan) => p.id === planId);
    if (!plan) return;

    let newTimeline: TimelineEvent[];
    
    if (revisedBy === 'ai') {
      // Use AI to adjust the timeline
      const allEnrollments = courseEnrollments.filter((e: CourseEnrollment) => e.userId === plan.userId);
      newTimeline = await adjustTimelineForConflicts(planId, allEnrollments.map((e: CourseEnrollment) => e.id));
    } else {
      // For user revisions, we'll handle this through the UI
      newTimeline = plan.currentPlan;
    }

    const revision: PlanRevision = {
      id: Date.now().toString(),
      planId,
      reason,
      changes: 'Timeline adjusted based on workload and conflicts',
      revisedBy,
      createdAt: new Date(),
      previousPlan: plan.currentPlan,
      newPlan: newTimeline
    };

    setLearningPlans((prev: LearningPlan[]) =>
      prev.map((p: LearningPlan) =>
        p.id === planId
          ? {
              ...p,
              currentPlan: newTimeline,
              revisions: [...p.revisions, revision],
              lastModified: new Date()
            }
          : p
      )
    );

    // Update timeline events
    setTimelineEvents((prev: TimelineEvent[]) => {
      const filtered = prev.filter((te: TimelineEvent) => !plan.currentPlan.find((tp: TimelineEvent) => tp.id === te.id));
      return [...filtered, ...newTimeline];
    });
  };

  const approvePlan = (planId: string) => {
    const plan = learningPlans.find((p: LearningPlan) => p.id === planId);
    if (!plan) return;

    setLearningPlans((prev: LearningPlan[]) =>
      prev.map((p: LearningPlan) =>
        p.id === planId ? { ...p, status: 'active' as const } : p
      )
    );

    // Convert timeline events to calendar events
    plan.currentPlan.forEach((event: TimelineEvent) => {
      const calendarEvent: CalendarEvent = {
        id: `calendar_${event.id}`,
        title: event.title,
        type: 'study_session',
        startTime: event.scheduledDate.toISOString(),
        endTime: new Date(event.scheduledDate.getTime() + event.estimatedHours * 60 * 60 * 1000).toISOString(),
        description: event.description,
        color: 'bg-purple-500',
        timelineEventId: event.id,
        proofRequired: event.proofRequired,
        proofSubmitted: false
      };
      
      addCalendarEvent(calendarEvent);
    });
  };

  // Timeline Events Functions
  const updateTimelineEvent = (id: string, updates: Partial<TimelineEvent>) => {
    setTimelineEvents((prev: TimelineEvent[]) =>
      prev.map((event: TimelineEvent) => event.id === id ? { ...event, ...updates } : event)
    );

    // Also update corresponding calendar event if it exists
    const calendarEvent = calendarEvents.find((ce: CalendarEvent) => ce.timelineEventId === id);
    if (calendarEvent && updates.scheduledDate) {
      updateCalendarEvent(calendarEvent.id, {
        startTime: updates.scheduledDate.toISOString(),
        endTime: new Date(updates.scheduledDate.getTime() + (updates.estimatedHours || 2) * 60 * 60 * 1000).toISOString()
      });
    }
  };

  // Completion Proof Functions
  const submitProof = (eventId: string, _userId: string, proof: Omit<CompletionProof, 'id' | 'submittedAt' | 'status'>) => {
    const newProof: CompletionProof = {
      ...proof,
      id: Date.now().toString(),
      submittedAt: new Date(),
      status: 'pending'
    };

    setCompletionProofs((prev: CompletionProof[]) => [...prev, newProof]);

    // Update timeline event
    updateTimelineEvent(eventId, { 
      completed: true, 
      completedAt: new Date(),
      proofSubmitted: newProof
    });

    // Update calendar event
    const calendarEvent = calendarEvents.find((ce: CalendarEvent) => ce.timelineEventId === eventId);
    if (calendarEvent) {
      updateCalendarEvent(calendarEvent.id, { proofSubmitted: true });
    }
  };

  const reviewProof = (proofId: string, status: 'approved' | 'rejected', comments?: string, reviewerId?: string) => {
    setCompletionProofs((prev: CompletionProof[]) =>
      prev.map((proof: CompletionProof) =>
        proof.id === proofId
          ? {
              ...proof,
              status,
              reviewComments: comments,
              reviewedBy: reviewerId,
              reviewedAt: new Date()
            }
          : proof
      )
    );
  };

  // AI Integration Functions
  const generateTimelineWithAI = async (courseId: string, userId: string, constraints?: any): Promise<TimelineEvent[]> => {
    try {
      // This would call your LLama API via OpenRouter
      const response = await fetch('http://localhost:5005/api/generate-timeline', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseId,
          userId,
          constraints,
          existingEnrollments: courseEnrollments.filter(e => e.userId === userId)
        }),
      });

      if (response.ok) {
        const result = await response.json();
        return result.timeline.map((event: any, index: number): TimelineEvent => ({
          id: `timeline_${Date.now()}_${index}`,
          courseEnrollmentId: '', // Will be set when enrollment is created
          title: event.title,
          description: event.description,
          scheduledDate: new Date(event.scheduledDate),
          estimatedHours: event.estimatedHours,
          type: event.type,
          completed: false,
          proofRequired: event.proofRequired || false
        }));
      }
    } catch (error) {
      console.error('Error generating AI timeline:', error);
    }

    // Fallback: Generate a basic timeline
    return generateBasicTimeline(courseId);
  };

  const adjustTimelineForConflicts = async (planId: string, newEnrollments: string[]): Promise<TimelineEvent[]> => {
    const plan = learningPlans.find(p => p.id === planId);
    if (!plan) return [];

    try {
      const response = await fetch('http://localhost:5005/api/adjust-timeline', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPlan: plan.currentPlan,
          allEnrollments: courseEnrollments.filter(e => newEnrollments.includes(e.id)),
          userId: plan.userId
        }),
      });

      if (response.ok) {
        const result = await response.json();
        return result.adjustedTimeline;
      }
    } catch (error) {
      console.error('Error adjusting timeline with AI:', error);
    }

    return plan.currentPlan;
  };

  // Helper function to generate basic timeline when AI is not available
  const generateBasicTimeline = (_courseId: string): TimelineEvent[] => {
    const baseDate = new Date();
    return [
      {
        id: `timeline_${Date.now()}_0`,
        courseEnrollmentId: '',
        title: 'Course Introduction & Setup',
        description: 'Complete course registration and setup learning environment',
        scheduledDate: new Date(baseDate.getTime() + 1 * 24 * 60 * 60 * 1000),
        estimatedHours: 2,
        type: 'study',
        completed: false,
        proofRequired: true
      },
      {
        id: `timeline_${Date.now()}_1`,
        courseEnrollmentId: '',
        title: 'Module 1 - Fundamentals',
        description: 'Complete first module assignments and readings',
        scheduledDate: new Date(baseDate.getTime() + 7 * 24 * 60 * 60 * 1000),
        estimatedHours: 8,
        type: 'assignment',
        completed: false,
        proofRequired: true
      },
      {
        id: `timeline_${Date.now()}_2`,
        courseEnrollmentId: '',
        title: 'Module 1 Assessment',
        description: 'Take module 1 quiz and submit project',
        scheduledDate: new Date(baseDate.getTime() + 14 * 24 * 60 * 60 * 1000),
        estimatedHours: 3,
        type: 'exam',
        completed: false,
        proofRequired: true
      }
    ];
  };

  const value: DataContextType = {
    calendarEvents,
    addCalendarEvent,
    updateCalendarEvent,
    deleteCalendarEvent,
    courseEnrollments,
    enrollInCourse,
    updateEnrollmentProgress,
    learningPlans,
    createLearningPlan,
    revisePlan,
    approvePlan,
    timelineEvents,
    updateTimelineEvent,
    completionProofs,
    submitProof,
    reviewProof,
    generateTimelineWithAI,
    adjustTimelineForConflicts
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};