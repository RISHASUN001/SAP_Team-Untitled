import React, { useState, useEffect } from "react";
import Layout from "./Layout";
import { useAuth } from "../contexts/AuthContext";
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
} from "lucide-react";
import DatePicker from "react-datepicker";
import { useForm, Controller } from "react-hook-form";
import "react-datepicker/dist/react-datepicker.css";

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

const Calendar: React.FC = () => {
  const { currentUser } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<"month" | "week" | "day">("month");
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

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
  useEffect(() => {
    localStorage.setItem("calendarEvents", JSON.stringify(events));
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

  const onSubmitEvent = (data: EventFormData) => {
    // Convert attendees string to array
    const attendeesArray = data.attendees
      ? data.attendees
          .split(",")
          .map((attendee) => attendee.trim())
          .filter((attendee) => attendee)
      : undefined;

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

    // Close modal and reset form
    setShowEventModal(false);
    reset();
  };

  const validateDates = (data: EventFormData) => {
    if (data.endTime <= data.startTime) {
      return "End time must be after start time";
    }
    return true;
  };

  const deleteEvent = (id: string) => {
    setEvents(events.filter((event) => event.id !== id));
    setSelectedEvent(null); // Close the modal after deletion
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
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
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Smart Calendar
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Manage deadlines, meetings, and milestones
            </p>
          </div>

          <button
            onClick={() => setShowEventModal(true)}
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
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
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
                  <div
                    key={index}
                    className={`min-h-[120px] p-2 border border-gray-200 dark:border-gray-700 ${
                      isCurrentMonthDay
                        ? "bg-white dark:bg-gray-800"
                        : "bg-gray-50 dark:bg-gray-900/50"
                    } ${isTodayDate ? "ring-2 ring-primary-500" : ""}`}
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
                        <div
                          key={event.id}
                          onClick={() => setSelectedEvent(event)}
                          className={`${event.color} text-white text-xs p-1 rounded cursor-pointer hover:opacity-80 transition-opacity`}
                        >
                          <div className="font-medium truncate">
                            {event.title}
                          </div>
                          <div className="opacity-90">
                            {formatTime(event.startTime)}
                          </div>
                        </div>
                      ))}
                      {dayEvents.length > 3 && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 pl-1">
                          +{dayEvents.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
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
                          <button className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                            <Edit className="h-4 w-4" />
                          </button>
                          <button className="p-1 text-gray-400 hover:text-red-600">
                            <Trash2 className="h-4 w-4" />
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
                  {React.createElement(getEventTypeIcon(selectedEvent.type), {
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
              </div>

              <div className="flex space-x-3 mt-6">
                <button className="flex-1 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors">
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
                  Create New Event
                </h2>
                <button
                  onClick={() => {
                    setShowEventModal(false);
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
                      validate: validateDates,
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

                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors"
                  >
                    Create Event
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowEventModal(false);
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
    </Layout>
  );
};

export default Calendar;
