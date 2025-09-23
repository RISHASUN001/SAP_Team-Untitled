import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

// Types for our data structures
export interface CourseEnrollment {
  id: string;
  userId: string;
  courseId: string;
  enrolledAt: Date;
  status: "active" | "completed" | "paused";
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
  type: "study" | "assignment" | "exam" | "project" | "review";
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
  proofType: "image" | "document" | "link" | "text";
  content: string; // Base64 for images, URL for links, text content for text
  status: "pending" | "approved" | "rejected";
  reviewedBy?: string;
  reviewedAt?: Date;
  reviewComments?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  type: "meeting" | "deadline" | "course" | "goal_milestone" | "study_session";
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
  status: "draft" | "active" | "completed" | "paused";
}

export interface PlanRevision {
  id: string;
  planId: string;
  reason: string;
  changes: string;
  revisedBy: "ai" | "user";
  createdAt: Date;
  previousPlan: TimelineEvent[];
  newPlan: TimelineEvent[];
}

interface DataContextType {
  // Calendar Events
  calendarEvents: CalendarEvent[];
  addCalendarEvent: (event: Omit<CalendarEvent, "id">, userId: string) => Promise<void>;
  updateCalendarEvent: (id: string, event: Partial<CalendarEvent>, userId: string) => Promise<void>;
  deleteCalendarEvent: (id: string, userId: string) => Promise<void>;
  loadCalendarEvents: (userId: string) => Promise<void>;

  // Course Enrollments
  courseEnrollments: CourseEnrollment[];
  enrollInCourse: (courseId: string, userId: string) => Promise<string>;
  updateEnrollmentProgress: (enrollmentId: string, progress: number) => void;

  // Learning Plans
  learningPlans: LearningPlan[];
  createLearningPlan: (courseId: string, userId: string) => Promise<string>;
  revisePlan: (
    planId: string,
    reason: string,
    revisedBy: "ai" | "user"
  ) => Promise<void>;
  approvePlan: (planId: string) => void;

  // Timeline Events
  timelineEvents: TimelineEvent[];
  updateTimelineEvent: (id: string, updates: Partial<TimelineEvent>) => void;

  // Completion Proofs
  completionProofs: CompletionProof[];
  submitProof: (
    eventId: string,
    userId: string,
    proof: Omit<CompletionProof, "id" | "submittedAt" | "status">
  ) => void;
  reviewProof: (
    proofId: string,
    status: "approved" | "rejected",
    comments?: string,
    reviewerId?: string
  ) => void;

  // AI Integration
  generateTimelineWithAI: (
    courseId: string,
    userId: string,
    constraints?: any
  ) => Promise<TimelineEvent[]>;
  adjustTimelineForConflicts: (
    planId: string,
    newEnrollments: string[]
  ) => Promise<TimelineEvent[]>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
};

interface DataProviderProps {
  children: ReactNode;
}

export const DataProvider = ({ children }: DataProviderProps) => {
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [courseEnrollments, setCourseEnrollments] = useState<
    CourseEnrollment[]
  >([]);
  const [learningPlans, setLearningPlans] = useState<LearningPlan[]>([]);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [completionProofs, setCompletionProofs] = useState<CompletionProof[]>(
    []
  );

  // Load data from localStorage on initial render
  useEffect(() => {
    const loadData = () => {
      try {
        const savedCalendarEvents = localStorage.getItem("calendarEvents");
        const savedEnrollments = localStorage.getItem("courseEnrollments");
        const savedPlans = localStorage.getItem("learningPlans");
        const savedTimeline = localStorage.getItem("timelineEvents");
        const savedProofs = localStorage.getItem("completionProofs");

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
        console.error("Error loading data from localStorage:", error);
      }
    };

    loadData();
  }, []);

  // Save data to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem("calendarEvents", JSON.stringify(calendarEvents));
  }, [calendarEvents]);

  useEffect(() => {
    localStorage.setItem(
      "courseEnrollments",
      JSON.stringify(courseEnrollments)
    );
  }, [courseEnrollments]);

  useEffect(() => {
    localStorage.setItem("learningPlans", JSON.stringify(learningPlans));
  }, [learningPlans]);

  useEffect(() => {
    localStorage.setItem("timelineEvents", JSON.stringify(timelineEvents));
  }, [timelineEvents]);

  useEffect(() => {
    localStorage.setItem("completionProofs", JSON.stringify(completionProofs));
  }, [completionProofs]);

  // Calendar Events Functions
  const loadCalendarEvents = async (userId: string) => {
    try {
      const response = await fetch(`http://localhost:3001/api/calendar/events/${userId}`);
      if (response.ok) {
        const events = await response.json();
        setCalendarEvents(events);
        console.log(`Loaded ${events.length} calendar events for user ${userId} from backend`);
      } else {
        console.error('Failed to load calendar events:', response.statusText);
        // Fallback to localStorage if backend fails
        const savedEvents = localStorage.getItem(`calendarEvents_${userId}`);
        if (savedEvents) {
          const events = JSON.parse(savedEvents);
          setCalendarEvents(events);
          console.log(`Fallback: Loaded ${events.length} events from localStorage`);
        }
      }
    } catch (error) {
      console.error('Error loading calendar events from backend:', error);
      // Fallback to localStorage if backend fails
      try {
        const savedEvents = localStorage.getItem(`calendarEvents_${userId}`);
        if (savedEvents) {
          const events = JSON.parse(savedEvents);
          setCalendarEvents(events);
          console.log(`Fallback: Loaded ${events.length} events from localStorage`);
        }
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
        setCalendarEvents([]);
      }
    }
  };

  const addCalendarEvent = async (
    event: Omit<CalendarEvent, "id">,
    userId: string
  ) => {
    try {
      const response = await fetch('http://localhost:3001/api/calendar/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...event,
          userId
        }),
      });

      if (response.ok) {
        const newEvent = await response.json();
        setCalendarEvents((prev: CalendarEvent[]) => [...prev, newEvent]);
        console.log(`Added calendar event "${newEvent.title}" for user ${userId} to backend`);
        
        // Also save to localStorage as backup
        const updatedEvents = [...calendarEvents, newEvent];
        localStorage.setItem(`calendarEvents_${userId}`, JSON.stringify(updatedEvents));
      } else {
        console.error('Failed to create calendar event:', response.statusText);
        // Fallback to localStorage only
        const newEvent: CalendarEvent = {
          ...event,
          id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        };
        const updatedEvents = [...calendarEvents, newEvent];
        setCalendarEvents(updatedEvents);
        localStorage.setItem(`calendarEvents_${userId}`, JSON.stringify(updatedEvents));
        console.log(`Fallback: Added event to localStorage only`);
      }
    } catch (error) {
      console.error('Error creating calendar event:', error);
      // Fallback to localStorage only
      const newEvent: CalendarEvent = {
        ...event,
        id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      };
      const updatedEvents = [...calendarEvents, newEvent];
      setCalendarEvents(updatedEvents);
      localStorage.setItem(`calendarEvents_${userId}`, JSON.stringify(updatedEvents));
      console.log(`Fallback: Added event to localStorage only`);
    }
  };

  const updateCalendarEvent = async (
    id: string, 
    updates: Partial<CalendarEvent>, 
    userId: string
  ) => {
    try {
      const response = await fetch(`http://localhost:3001/api/calendar/events/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...updates,
          userId
        }),
      });

      if (response.ok) {
        const updatedEvent = await response.json();
        setCalendarEvents((prev: CalendarEvent[]) =>
          prev.map((event: CalendarEvent) =>
            event.id === id ? updatedEvent : event
          )
        );
        console.log(`Updated calendar event ${id} for user ${userId} in backend`);
        
        // Also update localStorage as backup
        const updatedEvents = calendarEvents.map((event: CalendarEvent) =>
          event.id === id ? updatedEvent : event
        );
        localStorage.setItem(`calendarEvents_${userId}`, JSON.stringify(updatedEvents));
      } else {
        console.error('Failed to update calendar event:', response.statusText);
        // Fallback to localStorage only
        const updatedEvents = calendarEvents.map((event: CalendarEvent) =>
          event.id === id ? { ...event, ...updates } : event
        );
        setCalendarEvents(updatedEvents);
        localStorage.setItem(`calendarEvents_${userId}`, JSON.stringify(updatedEvents));
        console.log(`Fallback: Updated event in localStorage only`);
      }
    } catch (error) {
      console.error('Error updating calendar event:', error);
      // Fallback to localStorage only
      const updatedEvents = calendarEvents.map((event: CalendarEvent) =>
        event.id === id ? { ...event, ...updates } : event
      );
      setCalendarEvents(updatedEvents);
      localStorage.setItem(`calendarEvents_${userId}`, JSON.stringify(updatedEvents));
      console.log(`Fallback: Updated event in localStorage only`);
    }
  };

  const deleteCalendarEvent = async (id: string, userId: string) => {
    try {
      const response = await fetch(`http://localhost:3001/api/calendar/events/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        setCalendarEvents((prev: CalendarEvent[]) =>
          prev.filter((event: CalendarEvent) => event.id !== id)
        );
        console.log(`Deleted calendar event ${id} for user ${userId} from backend`);
        
        // Also update localStorage as backup
        const updatedEvents = calendarEvents.filter((event: CalendarEvent) => event.id !== id);
        localStorage.setItem(`calendarEvents_${userId}`, JSON.stringify(updatedEvents));
      } else {
        console.error('Failed to delete calendar event:', response.statusText);
        const errorMessage = `Failed to delete calendar event: ${response.statusText}`;
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Error deleting calendar event:', error);
      
      // Only use fallback if it's a network error, not a server rejection
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.log('Network error detected, using localStorage fallback');
        const updatedEvents = calendarEvents.filter((event: CalendarEvent) => event.id !== id);
        setCalendarEvents(updatedEvents);
        localStorage.setItem(`calendarEvents_${userId}`, JSON.stringify(updatedEvents));
      } else {
        // Re-throw the error so the Calendar component can handle it
        throw error;
      }
    }
  };

  // Course Enrollment Functions
  const enrollInCourse = async (
    courseId: string,
    userId: string
  ): Promise<string> => {
    const enrollmentId = Date.now().toString();
    const enrollment: CourseEnrollment = {
      id: enrollmentId,
      userId,
      courseId,
      enrolledAt: new Date(),
      status: "active",
      progress: 0,
      estimatedCompletionDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      timeline: [],
      completionProofs: [],
    };

    setCourseEnrollments((prev: CourseEnrollment[]) => [...prev, enrollment]);
    return enrollmentId;
  };

  const updateEnrollmentProgress = (enrollmentId: string, progress: number) => {
    setCourseEnrollments((prev: CourseEnrollment[]) =>
      prev.map((enrollment: CourseEnrollment) =>
        enrollment.id === enrollmentId
          ? { ...enrollment, progress }
          : enrollment
      )
    );
  };

  // Learning Plan Functions
  const createLearningPlan = async (
    courseId: string,
    userId: string
  ): Promise<string> => {
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
      status: "draft",
    };

    setLearningPlans((prev: LearningPlan[]) => [...prev, plan]);
    setTimelineEvents((prev: TimelineEvent[]) => [...prev, ...aiTimeline]);

    return planId;
  };

  const revisePlan = async (
    planId: string,
    reason: string,
    revisedBy: "ai" | "user"
  ) => {
    const plan = learningPlans.find((p: LearningPlan) => p.id === planId);
    if (!plan) return;

    let newTimeline: TimelineEvent[];

    if (revisedBy === "ai") {
      // Use AI to adjust the timeline
      const allEnrollments = courseEnrollments.filter(
        (e: CourseEnrollment) => e.userId === plan.userId
      );
      newTimeline = await adjustTimelineForConflicts(
        planId,
        allEnrollments.map((e: CourseEnrollment) => e.id)
      );
    } else {
      // For user revisions, we'll handle this through the UI
      newTimeline = plan.currentPlan;
    }

    const revision: PlanRevision = {
      id: Date.now().toString(),
      planId,
      reason,
      changes: "Timeline adjusted based on workload and conflicts",
      revisedBy,
      createdAt: new Date(),
      previousPlan: plan.currentPlan,
      newPlan: newTimeline,
    };

    setLearningPlans((prev: LearningPlan[]) =>
      prev.map((p: LearningPlan) =>
        p.id === planId
          ? {
              ...p,
              currentPlan: newTimeline,
              revisions: [...p.revisions, revision],
              lastModified: new Date(),
            }
          : p
      )
    );

    // Update timeline events
    setTimelineEvents((prev: TimelineEvent[]) => {
      const filtered = prev.filter(
        (te: TimelineEvent) =>
          !plan.currentPlan.find((tp: TimelineEvent) => tp.id === te.id)
      );
      return [...filtered, ...newTimeline];
    });
  };

  const approvePlan = (planId: string) => {
    const plan = learningPlans.find((p: LearningPlan) => p.id === planId);
    if (!plan) return;

    // Convert timeline events to calendar events
    const newCalendarEvents: CalendarEvent[] = [];

    plan.currentPlan.forEach((event: TimelineEvent) => {
      // Check if calendar event already exists for this timeline event
      const existingCalendarEvent = calendarEvents.find(
        (ce: CalendarEvent) => ce.timelineEventId === event.id
      );

      if (!existingCalendarEvent) {
        const calendarEvent: CalendarEvent = {
          id: `calendar_${event.id}`,
          title: event.title,
          type: "study_session" as const,
          startTime: event.scheduledDate.toISOString(),
          endTime: new Date(
            event.scheduledDate.getTime() +
              event.estimatedHours * 60 * 60 * 1000
          ).toISOString(),
          description: event.description,
          color: "bg-purple-500",
          timelineEventId: event.id,
          courseEnrollmentId: event.courseEnrollmentId,
          proofRequired: event.proofRequired,
          proofSubmitted: false,
        };

        newCalendarEvents.push(calendarEvent);
      }
    });

    // Add ALL new events to the calendar at once
    setCalendarEvents((prev: CalendarEvent[]) => [
      ...prev,
      ...newCalendarEvents,
    ]);

    // Update the plan status
    setLearningPlans((prev: LearningPlan[]) =>
      prev.map((p: LearningPlan) =>
        p.id === planId ? { ...p, status: "active" as const } : p
      )
    );

    console.log(
      `Added ${newCalendarEvents.length} events to calendar from timeline`
    );
  };
  // Timeline Events Functions
  const updateTimelineEvent = (id: string, updates: Partial<TimelineEvent>) => {
    setTimelineEvents((prev: TimelineEvent[]) =>
      prev.map((event: TimelineEvent) =>
        event.id === id ? { ...event, ...updates } : event
      )
    );

    // Also update corresponding calendar event if it exists
    const calendarEvent = calendarEvents.find(
      (ce: CalendarEvent) => ce.timelineEventId === id
    );
    if (calendarEvent && updates.scheduledDate) {
      // TODO: Need to pass userId to updateCalendarEvent - for now skip this update
      // updateCalendarEvent(calendarEvent.id, {
      //   startTime: updates.scheduledDate.toISOString(),
      //   endTime: new Date(
      //     updates.scheduledDate.getTime() +
      //       (updates.estimatedHours || 2) * 60 * 60 * 1000
      //   ).toISOString(),
      // });
    }
  };

  // Completion Proof Functions
  const submitProof = (
    eventId: string,
    _userId: string,
    proof: Omit<CompletionProof, "id" | "submittedAt" | "status">
  ) => {
    const newProof: CompletionProof = {
      ...proof,
      id: Date.now().toString(),
      submittedAt: new Date(),
      status: "pending",
    };

    setCompletionProofs((prev: CompletionProof[]) => [...prev, newProof]);

    // Update timeline event
    updateTimelineEvent(eventId, {
      completed: true,
      completedAt: new Date(),
      proofSubmitted: newProof,
    });

    // Update calendar event
    const calendarEvent = calendarEvents.find(
      (ce: CalendarEvent) => ce.timelineEventId === eventId
    );
    if (calendarEvent) {
      // TODO: Need to pass userId to updateCalendarEvent - for now skip this update
      // updateCalendarEvent(calendarEvent.id, { proofSubmitted: true });
    }
  };

  const reviewProof = (
    proofId: string,
    status: "approved" | "rejected",
    comments?: string,
    reviewerId?: string
  ) => {
    setCompletionProofs((prev: CompletionProof[]) =>
      prev.map((proof: CompletionProof) =>
        proof.id === proofId
          ? {
              ...proof,
              status,
              reviewComments: comments,
              reviewedBy: reviewerId,
              reviewedAt: new Date(),
            }
          : proof
      )
    );
  };

  // AI Integration Functions
  const generateTimelineWithAI = async (
    courseId: string,
    userId: string,
    constraints?: any
  ): Promise<TimelineEvent[]> => {
    try {
      // For now, just use the fallback basic timeline
      // This can be connected to AI later if needed
      console.log(`Generating basic timeline for course ${courseId} and user ${userId}`);
      return generateBasicTimeline(courseId);
    } catch (error) {
      console.error("Error generating AI timeline:", error);
      // Fallback: Generate a basic timeline
      return generateBasicTimeline(courseId);
    }
  };

  const adjustTimelineForConflicts = async (
    planId: string,
    _newEnrollments: string[]
  ): Promise<TimelineEvent[]> => {
    const plan = learningPlans.find((p) => p.id === planId);
    if (!plan) return [];

    try {
      // For now, just return the current plan without adjustments
      // This can be connected to AI later if needed
      console.log(`No timeline adjustments made for plan ${planId}`);
      return plan.currentPlan;
    } catch (error) {
      console.error("Error adjusting timeline:", error);
      return plan.currentPlan;
    }
  };

  // Helper function to generate basic timeline when AI is not available
  const generateBasicTimeline = (_courseId: string): TimelineEvent[] => {
    const baseDate = new Date();
    return [
      {
        id: `timeline_${Date.now()}_0`,
        courseEnrollmentId: "",
        title: "Course Introduction & Setup",
        description:
          "Complete course registration and setup learning environment",
        scheduledDate: new Date(baseDate.getTime() + 1 * 24 * 60 * 60 * 1000),
        estimatedHours: 2,
        type: "study",
        completed: false,
        proofRequired: true,
      },
      {
        id: `timeline_${Date.now()}_1`,
        courseEnrollmentId: "",
        title: "Module 1 - Fundamentals",
        description: "Complete first module assignments and readings",
        scheduledDate: new Date(baseDate.getTime() + 7 * 24 * 60 * 60 * 1000),
        estimatedHours: 8,
        type: "assignment",
        completed: false,
        proofRequired: true,
      },
      {
        id: `timeline_${Date.now()}_2`,
        courseEnrollmentId: "",
        title: "Module 1 Assessment",
        description: "Take module 1 quiz and submit project",
        scheduledDate: new Date(baseDate.getTime() + 14 * 24 * 60 * 60 * 1000),
        estimatedHours: 3,
        type: "exam",
        completed: false,
        proofRequired: true,
      },
    ];
  };

  const value: DataContextType = {
    calendarEvents,
    addCalendarEvent,
    updateCalendarEvent,
    deleteCalendarEvent,
    loadCalendarEvents,
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
    adjustTimelineForConflicts,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};
