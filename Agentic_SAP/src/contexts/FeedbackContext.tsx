import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

export interface Feedback {
  id: string;
  teamMemberId: string;
  managerId: string;
  managerName: string;
  date: string;
  technicalSkills: number;
  communication: number;
  teamwork: number;
  problemSolving: number;
  initiative: number;
  qualitativeFeedback: string;
  goals: string;
  areasForImprovement: string;
  summary?: string;
}

interface FeedbackContextType {
  feedbacks: Feedback[];
  addFeedback: (feedback: Feedback) => void;
  getFeedbacksForUser: (userId: string) => Feedback[];
  getFeedbacksByManager: (managerId: string) => Feedback[];
  syncStorage: () => void;
}

const FeedbackContext = createContext<FeedbackContextType | undefined>(
  undefined
);

export const useFeedback = () => {
  const context = useContext(FeedbackContext);
  if (!context) {
    throw new Error("useFeedback must be used within a FeedbackProvider");
  }
  return context;
};

interface FeedbackProviderProps {
  children: ReactNode;
}

export const FeedbackProvider: React.FC<FeedbackProviderProps> = ({
  children,
}) => {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load feedback from localStorage on initial render
  useEffect(() => {
    const savedFeedback = localStorage.getItem("teamFeedback");
    console.log("Loading from localStorage:", savedFeedback);
    if (savedFeedback) {
      try {
        const parsedFeedback = JSON.parse(savedFeedback);
        console.log("Parsed feedback:", parsedFeedback);
        setFeedbacks(Array.isArray(parsedFeedback) ? parsedFeedback : []);
      } catch (error) {
        console.error("Error parsing saved feedback:", error);
        setFeedbacks([]);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save feedback to localStorage whenever it changes AND after initial load
  useEffect(() => {
    if (isLoaded) {
      console.log("Saving to localStorage:", feedbacks);
      localStorage.setItem("teamFeedback", JSON.stringify(feedbacks));
    }
  }, [feedbacks, isLoaded]);

  const addFeedback = (feedback: Feedback) => {
    console.log("Adding feedback:", feedback);
    setFeedbacks((prev) => {
      // Check if feedback with this ID already exists
      const existingIndex = prev.findIndex((f) => f.id === feedback.id);

      if (existingIndex >= 0) {
        // Update existing feedback
        const updated = [...prev];
        updated[existingIndex] = feedback;
        console.log("Updated existing feedback. Total:", updated.length);
        return updated;
      } else {
        // Add new feedback
        const newFeedbacks = [...prev, feedback];
        console.log("Added new feedback. Total:", newFeedbacks.length);
        return newFeedbacks;
      }
    });
  };

  const getFeedbacksForUser = (userId: string): Feedback[] => {
    return feedbacks.filter((fb) => fb.teamMemberId === userId);
  };

  const getFeedbacksByManager = (managerId: string): Feedback[] => {
    return feedbacks.filter((fb) => fb.managerId === managerId);
  };

  const syncStorage = () => {
    const savedFeedback = localStorage.getItem("teamFeedback");
    if (savedFeedback) {
      try {
        const parsedFeedback = JSON.parse(savedFeedback);
        setFeedbacks(Array.isArray(parsedFeedback) ? parsedFeedback : []);
        console.log("Storage synced successfully");
      } catch (error) {
        console.error("Error syncing storage:", error);
      }
    }
  };

  return (
    <FeedbackContext.Provider
      value={{
        feedbacks,
        addFeedback,
        getFeedbacksForUser,
        getFeedbacksByManager,
        syncStorage,
      }}
    >
      {children}
    </FeedbackContext.Provider>
  );
};
