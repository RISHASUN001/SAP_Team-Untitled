import React, { useState } from 'react';
import Layout from './Layout';
import { useAuth } from '../contexts/AuthContext';
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
  Trash2
} from 'lucide-react';

interface Event {
  id: string;
  title: string;
  type: 'meeting' | 'deadline' | 'course' | 'goal_milestone';
  startTime: string;
  endTime: string;
  description?: string;
  location?: string;
  attendees?: string[];
  color: string;
}

const Calendar: React.FC = () => {
  const { currentUser } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  // Mock events
  const [events] = useState<Event[]>([
    {
      id: '1',
      title: 'Weekly Mentoring Session with Sarah Chen',
      type: 'meeting',
      startTime: '2025-01-25T10:00:00',
      endTime: '2025-01-25T11:00:00',
      description: 'Discuss progress on TensorFlow certification and upcoming projects',
      location: 'Microsoft Teams',
      attendees: ['Sarah Chen'],
      color: 'bg-blue-500'
    },
    {
      id: '2',
      title: 'ML Fundamentals Course - Module 3 Due',
      type: 'deadline',
      startTime: '2025-01-27T23:59:00',
      endTime: '2025-01-27T23:59:00',
      description: 'Complete Decision Trees and Random Forest assignments',
      color: 'bg-red-500'
    },
    {
      id: '3',
      title: 'Team Data Science Standup',
      type: 'meeting',
      startTime: '2025-01-28T09:00:00',
      endTime: '2025-01-28T09:30:00',
      location: 'Conference Room A',
      attendees: ['Sarah Chen', 'Alex Rodriguez', 'Jordan Kim'],
      color: 'bg-purple-500'
    },
    {
      id: '4',
      title: 'Python Proficiency Goal - Check-in',
      type: 'goal_milestone',
      startTime: '2025-01-30T15:00:00',
      endTime: '2025-01-30T16:00:00',
      description: 'Review progress on Python learning path',
      color: 'bg-green-500'
    },
    {
      id: '5',
      title: 'Machine Learning Project Presentation',
      type: 'meeting',
      startTime: '2025-02-03T14:00:00',
      endTime: '2025-02-03T15:30:00',
      location: 'Boardroom',
      attendees: ['Sarah Chen', 'Management Team'],
      color: 'bg-orange-500'
    }
  ]);

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
    const dateStr = date.toISOString().split('T')[0];
    return events.filter(event => 
      event.startTime.split('T')[0] === dateStr
    );
  };

  const formatTime = (timeStr: string) => {
    return new Date(timeStr).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'meeting':
        return Users;
      case 'deadline':
        return Clock;
      case 'course':
        return CalendarIcon;
      case 'goal_milestone':
        return Bell;
      default:
        return CalendarIcon;
    }
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
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
                onClick={() => navigateMonth('prev')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
              
              <button
                onClick={() => navigateMonth('next')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            <div className="flex space-x-2">
              {['month', 'week', 'day'].map((viewType) => (
                <button
                  key={viewType}
                  onClick={() => setView(viewType as typeof view)}
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    view === viewType
                      ? 'bg-primary-500 text-white'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {viewType.charAt(0).toUpperCase() + viewType.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Calendar Grid */}
          {view === 'month' && (
            <div className="grid grid-cols-7 gap-1">
              {/* Day Headers */}
              {dayNames.map(day => (
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
                        ? 'bg-white dark:bg-gray-800' 
                        : 'bg-gray-50 dark:bg-gray-900/50'
                    } ${isTodayDate ? 'ring-2 ring-primary-500' : ''}`}
                  >
                    <div className={`text-sm font-medium mb-2 ${
                      isTodayDate 
                        ? 'text-primary-600 dark:text-primary-400' 
                        : isCurrentMonthDay 
                        ? 'text-gray-900 dark:text-white' 
                        : 'text-gray-400 dark:text-gray-600'
                    }`}>
                      {date.getDate()}
                    </div>

                    <div className="space-y-1">
                      {dayEvents.slice(0, 3).map(event => (
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
                  .filter(event => new Date(event.startTime) > new Date())
                  .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
                  .slice(0, 5)
                  .map(event => {
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
                        
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {event.title}
                          </h4>
                          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {new Date(event.startTime).toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric'
                            })} at {formatTime(event.startTime)}
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
                  <span className="text-gray-600 dark:text-gray-400">Total Events</span>
                  <span className="font-bold text-gray-900 dark:text-white">8</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Meetings</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">5</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Deadlines</span>
                  <span className="font-bold text-red-600 dark:text-red-400">2</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Milestones</span>
                  <span className="font-bold text-green-600 dark:text-green-400">1</span>
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
                    className: "h-5 w-5 text-white"
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
                  {new Date(selectedEvent.startTime).toLocaleDateString()} at {formatTime(selectedEvent.startTime)}
                </div>

                {selectedEvent.location && (
                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <MapPin className="h-4 w-4 mr-2" />
                    {selectedEvent.location}
                  </div>
                )}

                {selectedEvent.attendees && selectedEvent.attendees.length > 0 && (
                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <Users className="h-4 w-4 mr-2" />
                    {selectedEvent.attendees.join(', ')}
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
                  onClick={() => setSelectedEvent(null)}
                  className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 border dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Calendar;