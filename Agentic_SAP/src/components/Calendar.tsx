import { useState, useEffect, createElement, useRef } from "react";
import Layout from "./Layout";
import {
  Calendar as CalendarIcon,
  Plus,
  Clock,
  Users,
  Video,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Bell,
  Edit,
  Trash2,
  X,
  FileCheck,
  AlertCircle,
  CheckCircle,
  Upload,
  Move,
} from "lucide-react";
import DatePicker from "react-datepicker";
import { useForm, Controller } from "react-hook-form";
import "react-datepicker/dist/react-datepicker.css";
import ProofSubmissionNew from "./ProofSubmissionNew";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { useData } from "../contexts/DataContext";

// Type definitions for drag and drop
type ItemTypes = {
  EVENT: "event";
};

const ItemTypes: ItemTypes = {
  EVENT: "event",
};

interface Event {
  id: string;
  title: string;
  type: "meeting" | "deadline" | "course" | "goal_milestone";
  startTime: string;
  endTime: string;
  description?: string;
  location?: string;
  attendees?: string[];
  color: string;
  requires_proof?: boolean;
  proof_type?: string;
  module_name?: string;
}

interface EventFormData {
  title: string;
  type: "meeting" | "deadline" | "course" | "goal_milestone";
  startTime: Date;
  endTime: Date;
  description: string;
  location: string;
  attendees: string;
}

interface DraggableEventProps {
  event: Event;
  onClick: () => void;
}

interface DroppableDayProps {
  date: Date;
  children: React.ReactNode;
  isCurrentMonth: boolean;
  isToday: boolean;
  onDrop: (item: { eventId: string }, date: Date) => void;
}

// DraggableEvent component for the day cells
const DraggableEvent: React.FC<DraggableEventProps> = ({ event, onClick }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.EVENT,
    item: { eventId: event.id },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  const formatTime = (timeStr: string) => {
    return new Date(timeStr).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <div
      ref={drag}
      onClick={onClick}
      className={`${
        event.color
      } text-white text-xs p-1 rounded cursor-move hover:opacity-80 transition-opacity ${
        isDragging ? "opacity-50" : ""
      }`}
      style={{ opacity: isDragging ? 0.5 : 1 }}
    >
      <div className="font-medium truncate flex items-center">
        <Move className="h-3 w-3 mr-1 inline" />
        {event.title}
      </div>
      <div className="opacity-90">{formatTime(event.startTime)}</div>
    </div>
  );
};

// DroppableDay component for accepting dropped events
const DroppableDay: React.FC<DroppableDayProps> = ({
  date,
  children,
  isCurrentMonth,
  isToday,
  onDrop,
}) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: ItemTypes.EVENT,
    drop: (item: { eventId: string }) => onDrop(item, date),
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }));

  return (
    <div
      ref={drop}
      className={`min-h-[120px] p-2 border ${
        isOver
          ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
          : "border-gray-200 dark:border-gray-700"
      } ${
        isCurrentMonth
          ? "bg-white dark:bg-gray-800"
          : "bg-gray-50 dark:bg-gray-900/50"
      } ${isToday ? "ring-2 ring-primary-500" : ""}`}
    >
      {children}
    </div>
  );
};

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<"month" | "week" | "day">("month");
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [showProofSubmission, setShowProofSubmission] = useState(false);
  const [proofEvent, setProofEvent] = useState<Event | null>(null);
  const [userProofs, setUserProofs] = useState<
    {
      event_id: string;
      status: string;
      submitted_at: string;
    }[]
  >([]);
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  // Reference to track drag operations
  const dragOperationRef = useRef<boolean>(false);

  // Access DataContext for centralized state management
  const { calendarEvents, updateCalendarEvent, deleteCalendarEvent } =
    useData();

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors },
  } = useForm<EventFormData>({
    defaultValues: {
      title: "",
      type: "meeting",
      description: "",
      location: "",
      attendees: "",
      startTime: new Date(),
      endTime: new Date(Date.now() + 60 * 60 * 1000), // 1 hour later
    },
  });

  // Load events from localStorage on initial render
  const [events, setEvents] = useState<Event[]>(() => {
    const savedEvents = localStorage.getItem("calendarEvents");
    // If we have events in localStorage, use those as the initial state
    if (savedEvents) {
      return JSON.parse(savedEvents);
    } else {
      // Default events if none exist in localStorage
      return [
        {
          id: "1",
          title: "Weekly Mentoring Session with Sarah Chen",
          type: "meeting",
          startTime: "2025-01-25T10:00:00",
          endTime: "2025-01-25T11:00:00",
          description:
            "Discuss progress on TensorFlow certification and upcoming projects",
          location: "Microsoft Teams",
          attendees: ["Sarah Chen"],
          color: "bg-blue-500",
        },
        {
          id: "2",
          title: "ML Fundamentals Course - Module 3 Due",
          type: "deadline",
          startTime: "2025-01-27T23:59:00",
          endTime: "2025-01-27T23:59:00",
          description: "Complete Decision Trees and Random Forest assignments",
          color: "bg-red-500",
        },
        {
          id: "3",
          title: "Team Data Science Standup",
          type: "meeting",
          startTime: "2025-01-28T09:00:00",
          endTime: "2025-01-28T09:30:00",
          location: "Conference Room A",
          attendees: ["Sarah Chen", "Alex Rodriguez", "Jordan Kim"],
          color: "bg-purple-500",
        },
        {
          id: "4",
          title: "Python Proficiency Goal - Check-in",
          type: "goal_milestone",
          startTime: "2025-01-30T15:00:00",
          endTime: "2025-01-30T16:00:00",
          description: "Review progress on Python learning path",
          color: "bg-green-500",
        },
        {
          id: "5",
          title: "Machine Learning Project Presentation",
          type: "meeting",
          startTime: "2025-02-03T14:00:00",
          endTime: "2025-02-03T15:30:00",
          location: "Boardroom",
          attendees: ["Sarah Chen", "Management Team"],
          color: "bg-orange-500",
        },
      ];
    }
  });

  // Save events to localStorage whenever events change
  // Use a debounced save to prevent localStorage thrashing during multiple drags
  useEffect(() => {
    const saveTimeout = setTimeout(() => {
      localStorage.setItem("calendarEvents", JSON.stringify(events));
      console.log(
        "Calendar events saved to localStorage:",
        events.length,
        "events"
      );
    }, 300); // Delay saving to batch rapid updates

    return () => clearTimeout(saveTimeout); // Clean up timeout on unmount or when events change again
  }, [events]);

  // Sync with DataContext calendar events when they change
  useEffect(() => {
    // This useEffect adds any new events from DataContext that might not be in our local state
    if (calendarEvents && calendarEvents.length > 0) {
      setEvents((prevEvents) => {
        // Get all existing event IDs for quick lookup
        const existingIds = new Set(prevEvents.map((e) => e.id));

        // Find new events from DataContext that aren't in our local state
        const newEventsFromContext = calendarEvents.filter(
          (e) => !existingIds.has(e.id)
        );

        // Convert CalendarEvent type to Event type for our component
        const newEvents: Event[] = newEventsFromContext.map((e) => ({
          id: e.id,
          title: e.title,
          type:
            e.type === "study_session"
              ? "course"
              : (e.type as
                  | "meeting"
                  | "deadline"
                  | "course"
                  | "goal_milestone"),
          startTime: e.startTime,
          endTime: e.endTime,
          description: e.description,
          location: e.location,
          attendees: e.attendees,
          color: e.color,
          requires_proof: e.proofRequired,
          proof_type: e.proofSubmitted ? "submitted" : undefined,
          module_name: e.timelineEventId, // Store the timelineEventId in module_name for reference
        }));

        // If we have new events, add them to our local state
        if (newEvents.length > 0) {
          console.log(`Adding ${newEvents.length} new events from DataContext`);
          return [...prevEvents, ...newEvents];
        }

        // Otherwise return the current state unchanged
        return prevEvents;
      });
    }
  }, [calendarEvents]);

  useEffect(() => {
    console.log("Current calendar events:", events);
    console.log(
      "Events requiring proof:",
      events.filter((e) => e.requires_proof)
    );
  }, [events]);

  const getEventColor = (type: string) => {
    switch (type) {
      case "meeting":
        return "bg-blue-500";
      case "deadline":
        return "bg-red-500";
      case "course":
        return "bg-purple-500";
      case "goal_milestone":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  // Function to check if an event clashes with existing events
  const checkEventClash = (
    startTime: Date,
    endTime: Date,
    excludeEventId?: string
  ) => {
    return events.some((event) => {
      // Skip comparing with the event being edited
      if (excludeEventId && event.id === excludeEventId) return false;

      const eventStart = new Date(event.startTime);
      const eventEnd = new Date(event.endTime);

      // Check if the new event overlaps with an existing event
      return startTime < eventEnd && endTime > eventStart;
    });
  };

  // Function to suggest alternative time slots
  const suggestAlternativeSlots = (
    startTime: Date,
    duration: number
  ): Date[] => {
    const suggestions: Date[] = [];
    const incrementMins = 30;
    let currentSlot = new Date(startTime);

    // Try to find 5 free time slots
    while (suggestions.length < 5) {
      // Move to the next time slot
      currentSlot = new Date(currentSlot.getTime() + incrementMins * 60000);

      // Create an end time based on the original event duration
      const potentialEndTime = new Date(currentSlot.getTime() + duration);

      // Check if this slot is free
      if (!checkEventClash(currentSlot, potentialEndTime)) {
        suggestions.push(new Date(currentSlot));
      }

      // Safety check to prevent infinite loop - stop after checking 48 hours worth of slots
      if (
        suggestions.length === 0 &&
        currentSlot > new Date(startTime.getTime() + 48 * 60 * 60000)
      ) {
        break;
      }
    }

    return suggestions;
  };

  const [clashDetected, setClashDetected] = useState(false);
  const [alternativeSlots, setAlternativeSlots] = useState<Date[]>([]);

  const onSubmitEvent = (data: EventFormData) => {
    // Convert attendees string to array
    const attendeesArray = data.attendees
      ? data.attendees
          .split(",")
          .map((attendee) => attendee.trim())
          .filter((attendee) => attendee)
      : undefined;

    // Check for clashes with existing events
    const isClashing = checkEventClash(
      data.startTime,
      data.endTime,
      isEditMode ? editingEvent?.id : undefined
    );

    if (isClashing) {
      // Calculate event duration in milliseconds
      const duration = data.endTime.getTime() - data.startTime.getTime();

      // Get alternative time slots
      const suggestions = suggestAlternativeSlots(data.startTime, duration);
      setAlternativeSlots(suggestions);
      setClashDetected(true);
      return; // Stop here and don't save the event
    }

    if (isEditMode) {
      // Update existing event
      const updatedEvent: Event = {
        id: editingEvent?.id || Date.now().toString(),
        title: data.title,
        type: data.type,
        startTime: data.startTime.toISOString(),
        endTime: data.endTime.toISOString(),
        description: data.description || undefined,
        location: data.location || undefined,
        attendees: attendeesArray,
        color: getEventColor(data.type),
        // Preserve existing properties that might be related to course enrollment
        ...(editingEvent && {
          requires_proof: editingEvent.requires_proof,
          proof_type: editingEvent.proof_type,
          module_name: editingEvent.module_name,
        }),
      };

      // Update events list
      setEvents(
        events.map((event) =>
          event.id === updatedEvent.id ? updatedEvent : event
        )
      );
    } else {
      // Create new event
      const newEvent: Event = {
        id: Date.now().toString(), // Simple ID generation
        title: data.title,
        type: data.type,
        startTime: data.startTime.toISOString(),
        endTime: data.endTime.toISOString(),
        description: data.description || undefined,
        location: data.location || undefined,
        attendees: attendeesArray,
        color: getEventColor(data.type),
      };

      // Add to events list
      setEvents([...events, newEvent]);
    }

    // Close modal and reset form
    setShowEventModal(false);
    setIsEditMode(false);
    setEditingEvent(null);
    setClashDetected(false);
    setAlternativeSlots([]);
    reset();
  };

  const validateEndTime = (endTime: Date) => {
    const formData = watch();
    if (endTime <= formData.startTime) {
      return "End time must be after start time";
    }
    return true;
  };

  const deleteEvent = (id: string) => {
    // Update local state
    setEvents(events.filter((event) => event.id !== id));
    // Also delete from DataContext to keep everything in sync
    deleteCalendarEvent(id);
    setSelectedEvent(null); // Close the modal after deletion
  };

  const handleEditEvent = (event: Event) => {
    setIsEditMode(true);
    setEditingEvent(event);
    // Pre-populate form with event data
    const startTime = new Date(event.startTime);
    const endTime = new Date(event.endTime);

    reset({
      title: event.title,
      type: event.type,
      description: event.description || "",
      location: event.location || "",
      attendees: event.attendees?.join(", ") || "",
      startTime,
      endTime,
    });

    // Reset clash detection state
    setClashDetected(false);
    setAlternativeSlots([]);

    setSelectedEvent(null);
    setShowEventModal(true);
  };

  const handleSubmitProof = (event: Event) => {
    setProofEvent(event);
    setShowProofSubmission(true);
  };

  const handleProofSubmitted = async () => {
    // Refresh proof status for this event
    if (proofEvent) {
      await loadProofStatus(proofEvent.id);
    }
    setShowProofSubmission(false);
    setProofEvent(null);
  };

  // Handle dropping an event on a new date
  const handleEventDrop = (item: { eventId: string }, dropDate: Date) => {
    const eventId = item.eventId;
    // Find the event using the current state to ensure we have the most recent version
    const eventToUpdate = events.find((e) => e.id === eventId);

    if (!eventToUpdate) return;

    // Check if we're already in the middle of a drag operation
    if (dragOperationRef.current) {
      console.log("Drag operation already in progress, deferring update");
      // Queue this update to happen after the current one completes
      setTimeout(() => handleEventDrop(item, dropDate), 50);
      return;
    }

    // Set flag to prevent concurrent drag operations
    dragOperationRef.current = true;

    try {
      // Check if dropped on the same date - no change needed
      const originalDate = new Date(eventToUpdate.startTime);
      const originalDay = new Date(
        originalDate.getFullYear(),
        originalDate.getMonth(),
        originalDate.getDate()
      );
      const dropDay = new Date(
        dropDate.getFullYear(),
        dropDate.getMonth(),
        dropDate.getDate()
      );

      if (originalDay.getTime() === dropDay.getTime()) {
        dragOperationRef.current = false;
        return; // No change if dropped on same day
      }

      // Calculate time difference between original date and drop date
      const timeDiff = dropDate.getTime() - originalDay.getTime();

      // Create new start and end times preserving the original time portion
      const newStartTime = new Date(originalDate.getTime() + timeDiff);
      const newEndTime = new Date(
        new Date(eventToUpdate.endTime).getTime() + timeDiff
      );

      // Create a copy of the updated event to avoid reference issues
      const updatedEvent = {
        ...eventToUpdate,
        startTime: newStartTime.toISOString(),
        endTime: newEndTime.toISOString(),
      };

      // Update events array with a fresh copy to ensure React detects the change
      setEvents((prevEvents) =>
        prevEvents.map((event) =>
          event.id === eventId ? { ...updatedEvent } : event
        )
      );

      // Also update the event in DataContext to ensure sync across components
      updateCalendarEvent(eventId, {
        startTime: newStartTime.toISOString(),
        endTime: newEndTime.toISOString(),
      });

      // Show feedback notification
      setNotification({
        message: `Moved "${
          updatedEvent.title
        }" to ${dropDate.toLocaleDateString()}`,
        type: "success",
      });

      // Clear notification after 3 seconds
      setTimeout(() => {
        setNotification(null);
      }, 3000);
    } finally {
      // Make sure we always reset the flag, even if there's an error
      setTimeout(() => {
        dragOperationRef.current = false;
      }, 100);
    }
  };

  const loadProofStatus = async (eventId: string) => {
    try {
      const response = await fetch(
        `http://localhost:5006/api/proof/event/${eventId}`
      );
      const proofs = await response.json();
      if (Array.isArray(proofs)) {
        setUserProofs((prev) => {
          const filtered = prev.filter((p) => p.event_id !== eventId);
          return [...filtered, ...proofs];
        });
      }
    } catch (error) {
      console.error("Error loading proof status:", error);
    }
  };

  const getProofStatus = (eventId: string) => {
    const eventProofs = userProofs.filter(
      (proof) => proof.event_id === eventId
    );
    if (eventProofs.length === 0) return "none";

    const latestProof = eventProofs.sort(
      (a, b) =>
        new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()
    )[0];

    return latestProof.status;
  };

  // Load proof statuses when events change
  useEffect(() => {
    const loadAllProofStatuses = async () => {
      for (const event of events) {
        if (event.requires_proof) {
          await loadProofStatus(event.id);
        }
      }
    };

    if (events.length > 0) {
      loadAllProofStatuses();
    }
  }, [events]);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    const currentDate = new Date(startDate);

    for (let i = 0; i < 42; i++) {
      days.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return days;
  };

  const getEventsForDate = (date: Date) => {
    // Create date string in YYYY-MM-DD format in local timezone
    const dateStr = date.toLocaleDateString("en-CA"); // This gives YYYY-MM-DD format

    return events.filter((event) => {
      const eventDate = new Date(event.startTime);
      const eventDateStr = eventDate.toLocaleDateString("en-CA");
      return eventDateStr === dateStr;
    });
  };

  const formatTime = (timeStr: string) => {
    return new Date(timeStr).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case "meeting":
        return Users;
      case "deadline":
        return Clock;
      case "course":
        return CalendarIcon;
      case "goal_milestone":
        return Bell;
      default:
        return CalendarIcon;
    }
  };

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      if (direction === "prev") {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth();
  };

  return (
    <Layout>
      <DndProvider backend={HTML5Backend}>
        <div className="p-6 max-w-7xl mx-auto relative">
          {/* Notification */}
          {notification && (
            <div
              className={`fixed top-6 right-6 z-50 px-4 py-3 rounded-lg shadow-md transition-all transform animate-fade-in ${
                notification.type === "success"
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              <div className="flex items-center space-x-2">
                {notification.type === "success" ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <AlertCircle className="h-5 w-5" />
                )}
                <span>{notification.message}</span>
              </div>
            </div>
          )}

          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Smart Calendar
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Manage deadlines, meetings, and milestones
              </p>
              <div className="flex items-center mt-2 text-sm text-primary-600 dark:text-primary-400">
                <Move className="h-4 w-4 mr-1" />
                <span>Drag and drop events to reschedule</span>
              </div>
            </div>

            <button
              onClick={() => {
                setIsEditMode(false);
                setShowEventModal(true);
              }}
              className="flex items-center px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors"
            >
              <Plus className="h-5 w-5 mr-2" />
              New Event
            </button>
          </div>

          {/* Calendar Controls */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 mb-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => navigateMonth("prev")}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>

                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {monthNames[currentDate.getMonth()]}{" "}
                  {currentDate.getFullYear()}
                </h2>

                <button
                  onClick={() => navigateMonth("next")}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>

              <div className="flex space-x-2">
                {["month", "week", "day"].map((viewType) => (
                  <button
                    key={viewType}
                    onClick={() => setView(viewType as typeof view)}
                    className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      view === viewType
                        ? "bg-primary-500 text-white"
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                  >
                    {viewType.charAt(0).toUpperCase() + viewType.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Calendar Grid */}
            {view === "month" && (
              <div className="grid grid-cols-7 gap-1">
                {/* Day Headers */}
                {dayNames.map((day) => (
                  <div
                    key={day}
                    className="p-3 text-center text-sm font-medium text-gray-500 dark:text-gray-400"
                  >
                    {day}
                  </div>
                ))}

                {/* Calendar Days */}
                {getDaysInMonth(currentDate).map((date, index) => {
                  const dayEvents = getEventsForDate(date);
                  const isCurrentMonthDay = isCurrentMonth(date);
                  const isTodayDate = isToday(date);

                  return (
                    <DroppableDay
                      key={index}
                      date={date}
                      isCurrentMonth={isCurrentMonthDay}
                      isToday={isTodayDate}
                      onDrop={handleEventDrop}
                    >
                      <div
                        className={`text-sm font-medium mb-2 ${
                          isTodayDate
                            ? "text-primary-600 dark:text-primary-400"
                            : isCurrentMonthDay
                            ? "text-gray-900 dark:text-white"
                            : "text-gray-400 dark:text-gray-600"
                        }`}
                      >
                        {date.getDate()}
                      </div>

                      <div className="space-y-1">
                        {dayEvents.slice(0, 3).map((event) => (
                          <DraggableEvent
                            key={`event-${date.toISOString()}-${event.id}`}
                            event={event}
                            onClick={() => setSelectedEvent(event)}
                          />
                        ))}
                        {dayEvents.length > 3 && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 pl-1">
                            +{dayEvents.length - 3} more
                          </div>
                        )}
                      </div>
                    </DroppableDay>
                  );
                })}
              </div>
            )}
          </div>

          {/* Upcoming Events */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                  Upcoming Events
                </h3>

                <div className="space-y-4">
                  {events
                    .filter((event) => {
                      const eventDate = new Date(event.startTime);
                      // Compare dates without time components
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      eventDate.setHours(0, 0, 0, 0);
                      return eventDate >= today;
                    })
                    .sort(
                      (a, b) =>
                        new Date(a.startTime).getTime() -
                        new Date(b.startTime).getTime()
                    )
                    .slice(0, 5)
                    .map((event) => {
                      const EventIcon = getEventTypeIcon(event.type);

                      return (
                        <div
                          key={event.id}
                          className="flex items-start space-x-4 p-4 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                          onClick={() => setSelectedEvent(event)}
                        >
                          <div className={`${event.color} p-2 rounded-lg`}>
                            <EventIcon className="h-4 w-4 text-white" />
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent triggering the parent click
                              deleteEvent(event.id);
                            }}
                            className="p-1 text-gray-400 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>

                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-900 dark:text-white">
                              {event.title}
                            </h4>
                            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                              {new Date(event.startTime).toLocaleDateString(
                                "en-US",
                                {
                                  weekday: "short",
                                  month: "short",
                                  day: "numeric",
                                }
                              )}{" "}
                              at {formatTime(event.startTime)}
                            </div>
                            {event.location && (
                              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mt-1">
                                <MapPin className="h-3 w-3 mr-1" />
                                {event.location}
                              </div>
                            )}
                          </div>

                          <div className="flex space-x-1">
                            <button
                              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditEvent(event);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              className="p-1 text-gray-400 hover:text-red-600"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteEvent(event.id);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                            <button
                              className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Move className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>

            {/* Quick Actions & Stats */}
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                  Quick Actions
                </h3>

                <div className="space-y-3">
                  <button className="w-full flex items-center p-3 text-left bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors">
                    <Users className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-3" />
                    <div>
                      <div className="font-medium text-blue-900 dark:text-blue-300">
                        Schedule Mentoring
                      </div>
                      <div className="text-sm text-blue-700 dark:text-blue-400">
                        Book time with your mentor
                      </div>
                    </div>
                  </button>

                  <button className="w-full flex items-center p-3 text-left bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-colors">
                    <Clock className="h-5 w-5 text-green-600 dark:text-green-400 mr-3" />
                    <div>
                      <div className="font-medium text-green-900 dark:text-green-300">
                        Set Goal Deadline
                      </div>
                      <div className="text-sm text-green-700 dark:text-green-400">
                        Add milestone reminders
                      </div>
                    </div>
                  </button>

                  <button className="w-full flex items-center p-3 text-left bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-lg transition-colors">
                    <Video className="h-5 w-5 text-purple-600 dark:text-purple-400 mr-3" />
                    <div>
                      <div className="font-medium text-purple-900 dark:text-purple-300">
                        Teams Integration
                      </div>
                      <div className="text-sm text-purple-700 dark:text-purple-400">
                        Sync with Microsoft Teams
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                  This Week
                </h3>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Total Events
                    </span>
                    <span className="font-bold text-gray-900 dark:text-white">
                      {events.length}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Meetings
                    </span>
                    <span className="font-bold text-blue-600 dark:text-blue-400">
                      {events.filter((e) => e.type === "meeting").length}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Deadlines
                    </span>
                    <span className="font-bold text-red-600 dark:text-red-400">
                      {events.filter((e) => e.type === "deadline").length}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Milestones
                    </span>
                    <span className="font-bold text-green-600 dark:text-green-400">
                      {events.filter((e) => e.type === "goal_milestone").length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Event Details Modal */}
          {selectedEvent && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
                <div className="flex items-start justify-between mb-4">
                  <div className={`${selectedEvent.color} p-2 rounded-lg`}>
                    {createElement(getEventTypeIcon(selectedEvent.type), {
                      className: "h-5 w-5 text-white",
                    })}
                  </div>
                  <button
                    onClick={() => setSelectedEvent(null)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    ×
                  </button>
                </div>

                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  {selectedEvent.title}
                </h2>

                <div className="space-y-3 text-sm">
                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <Clock className="h-4 w-4 mr-2" />
                    {new Date(
                      selectedEvent.startTime
                    ).toLocaleDateString()} at{" "}
                    {formatTime(selectedEvent.startTime)}
                  </div>

                  {selectedEvent.location && (
                    <div className="flex items-center text-gray-600 dark:text-gray-400">
                      <MapPin className="h-4 w-4 mr-2" />
                      {selectedEvent.location}
                    </div>
                  )}

                  {selectedEvent.attendees &&
                    selectedEvent.attendees.length > 0 && (
                      <div className="flex items-center text-gray-600 dark:text-gray-400">
                        <Users className="h-4 w-4 mr-2" />
                        {selectedEvent.attendees.join(", ")}
                      </div>
                    )}

                  {selectedEvent.description && (
                    <div className="pt-2 border-t dark:border-gray-700">
                      <p className="text-gray-700 dark:text-gray-300">
                        {selectedEvent.description}
                      </p>
                    </div>
                  )}

                  {/* Proof Submission Section */}
                  {selectedEvent.requires_proof && (
                    <div className="pt-4 border-t dark:border-gray-700 mt-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-gray-900 dark:text-white flex items-center">
                          <FileCheck className="h-4 w-4 mr-2" />
                          Proof of Completion
                        </h4>
                        {(() => {
                          const status = getProofStatus(selectedEvent.id);
                          if (status === "approved") {
                            return (
                              <div className="flex items-center text-green-600 dark:text-green-400">
                                <CheckCircle className="h-4 w-4 mr-1" />
                                <span className="text-sm font-medium">
                                  Approved
                                </span>
                              </div>
                            );
                          } else if (status === "pending_review") {
                            return (
                              <div className="flex items-center text-yellow-600 dark:text-yellow-400">
                                <AlertCircle className="h-4 w-4 mr-1" />
                                <span className="text-sm font-medium">
                                  Pending Review
                                </span>
                              </div>
                            );
                          } else if (status === "rejected") {
                            return (
                              <div className="flex items-center text-red-600 dark:text-red-400">
                                <AlertCircle className="h-4 w-4 mr-1" />
                                <span className="text-sm font-medium">
                                  Resubmission Required
                                </span>
                              </div>
                            );
                          } else {
                            return (
                              <div className="flex items-center text-gray-500 dark:text-gray-400">
                                <Upload className="h-4 w-4 mr-1" />
                                <span className="text-sm font-medium">
                                  Not Submitted
                                </span>
                              </div>
                            );
                          }
                        })()}
                      </div>

                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        Submit proof of completion to track your learning
                        progress.
                      </p>

                      <button
                        onClick={() => handleSubmitProof(selectedEvent)}
                        className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {getProofStatus(selectedEvent.id) === "none"
                          ? "Submit Proof"
                          : "Update Proof"}
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex space-x-3 mt-6">
                  <button
                    onClick={() => handleEditEvent(selectedEvent)}
                    className="flex-1 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors"
                  >
                    Edit Event
                  </button>
                  <button
                    onClick={() => deleteEvent(selectedEvent.id)}
                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
                  >
                    {" "}
                    <Trash2 className="h-4 w-4" />
                  </button>

                  <button
                    onClick={() => setSelectedEvent(null)}
                    className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 border dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* New Event Modal */}
          {showEventModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {isEditMode ? "Edit Event" : "Create New Event"}
                  </h2>
                  <button
                    onClick={() => {
                      setShowEventModal(false);
                      setIsEditMode(false);
                      setEditingEvent(null);
                      setClashDetected(false);
                      setAlternativeSlots([]);
                      reset();
                    }}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <form
                  onSubmit={handleSubmit(onSubmitEvent)}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Event Title *
                    </label>
                    <input
                      type="text"
                      {...register("title", { required: "Title is required" })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Enter event title"
                    />
                    {errors.title && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.title.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Event Type *
                    </label>
                    <select
                      {...register("type", { required: "Type is required" })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="meeting">Meeting</option>
                      <option value="deadline">Deadline</option>
                      <option value="course">Course</option>
                      <option value="goal_milestone">Goal Milestone</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Description
                    </label>
                    <textarea
                      rows={3}
                      {...register("description")}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Enter event description"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Location
                    </label>
                    <input
                      type="text"
                      {...register("location")}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Enter location"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Attendees
                    </label>
                    <input
                      type="text"
                      {...register("attendees")}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Enter attendees (comma separated)"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Start Time *
                    </label>
                    <Controller
                      control={control}
                      name="startTime"
                      rules={{ required: "Start time is required" }}
                      render={({ field }) => (
                        <DatePicker
                          selected={field.value}
                          onChange={field.onChange}
                          showTimeSelect
                          timeFormat="HH:mm"
                          timeIntervals={15}
                          dateFormat="MMMM d, yyyy h:mm aa"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                        />
                      )}
                    />
                    {errors.startTime && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.startTime.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      End Time *
                    </label>
                    <Controller
                      control={control}
                      name="endTime"
                      rules={{
                        required: "End time is required",
                        validate: validateEndTime,
                      }}
                      render={({ field }) => (
                        <DatePicker
                          selected={field.value}
                          onChange={field.onChange}
                          showTimeSelect
                          timeFormat="HH:mm"
                          timeIntervals={15}
                          dateFormat="MMMM d, yyyy h:mm aa"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                        />
                      )}
                    />
                    {errors.endTime && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.endTime.message}
                      </p>
                    )}
                  </div>

                  {/* Time Conflict Warning */}
                  {clashDetected && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800 rounded-lg">
                      <div className="flex items-center mb-2">
                        <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mr-2" />
                        <h4 className="font-medium text-red-600 dark:text-red-400">
                          Time Conflict Detected
                        </h4>
                      </div>
                      <p className="text-sm text-red-600 dark:text-red-400 mb-3">
                        This event conflicts with an existing event on your
                        calendar.
                      </p>

                      {alternativeSlots.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Available time slots:
                          </p>
                          <div className="space-y-2 max-h-48 overflow-y-auto">
                            {alternativeSlots.map((slot, index) => (
                              <button
                                key={index}
                                type="button"
                                onClick={() => {
                                  const endTime = new Date(
                                    slot.getTime() +
                                      (watch().endTime.getTime() -
                                        watch().startTime.getTime())
                                  );
                                  reset({
                                    ...watch(),
                                    startTime: slot,
                                    endTime: endTime,
                                  });
                                  setClashDetected(false);
                                }}
                                className="w-full text-left px-3 py-2 text-sm bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded flex justify-between items-center"
                              >
                                <span>
                                  {slot.toLocaleDateString()},{" "}
                                  {slot.toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                                <ChevronRight className="h-4 w-4" />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {alternativeSlots.length === 0 && (
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          No alternative time slots found in the next 48 hours.
                          Consider scheduling on a different day.
                        </p>
                      )}

                      <button
                        type="button"
                        onClick={() => setClashDetected(false)}
                        className="mt-3 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Ignore and create anyway
                      </button>
                    </div>
                  )}

                  <div className="flex space-x-3 pt-4">
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors"
                    >
                      {isEditMode ? "Update Event" : "Create Event"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowEventModal(false);
                        setClashDetected(false);
                        setAlternativeSlots([]);
                        reset();
                      }}
                      className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 border dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>

        {/* Proof Submission Modal */}
        {showProofSubmission && proofEvent && (
          <ProofSubmissionNew
            event={{
              id: proofEvent.id,
              title: proofEvent.title,
              proof_type: proofEvent.proof_type || "any",
              description: proofEvent.description,
            }}
            isOpen={showProofSubmission}
            onClose={() => {
              setShowProofSubmission(false);
              setProofEvent(null);
            }}
            onSubmitted={handleProofSubmitted}
          />
        )}
      </DndProvider>
    </Layout>
  );
};

export default Calendar;
