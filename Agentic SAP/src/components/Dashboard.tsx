import React from 'react';
import Layout from './Layout';
import { useAuth } from '../contexts/AuthContext';
import {
  BookOpen,
  Target,
  MessageCircle,
  Calendar,
  TrendingUp,
  Users,
  Award,
  Clock,
  ChevronRight,
  Brain,
  Zap
} from 'lucide-react';
import { mockGoals, mockCourses } from '../data/mockData';
import { Link } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const { currentUser } = useAuth();

  // Get user-specific goals
  const userGoals = mockGoals.filter(goal => goal.userId === currentUser?.id);
  const completedGoals = userGoals.filter(goal => goal.status === 'completed').length;
  const inProgressGoals = userGoals.filter(goal => goal.status === 'in_progress').length;

  // Recent activity data
  const recentActivities = [
    {
      id: 1,
      type: 'course_started',
      title: 'Started Machine Learning Fundamentals',
      time: '2 hours ago',
      icon: BookOpen,
      color: 'text-blue-500'
    },
    {
      id: 2,
      type: 'goal_progress',
      title: 'Python proficiency goal: 60% complete',
      time: '1 day ago',
      icon: Target,
      color: 'text-green-500'
    },
    {
      id: 3,
      type: 'chat_session',
      title: 'AI Mentor session completed',
      time: '2 days ago',
      icon: MessageCircle,
      color: 'text-purple-500'
    },
    {
      id: 4,
      type: 'meeting_scheduled',
      title: 'Meeting with Sarah Chen scheduled',
      time: '3 days ago',
      icon: Calendar,
      color: 'text-orange-500'
    }
  ];

  const statsCards = [
    {
      title: 'Active Goals',
      value: inProgressGoals.toString(),
      icon: Target,
      color: 'bg-blue-500',
      change: '+2 this month'
    },
    {
      title: 'Courses Enrolled',
      value: '3',
      icon: BookOpen,
      color: 'bg-green-500',
      change: '1 completed'
    },
    {
      title: 'Mentor Sessions',
      value: '12',
      icon: Users,
      color: 'bg-purple-500',
      change: '4 this week'
    },
    {
      title: 'Skill Progress',
      value: '78%',
      icon: TrendingUp,
      color: 'bg-orange-500',
      change: '+15% this month'
    }
  ];

  return (
    <Layout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Welcome back, {currentUser?.name.split(' ')[0]}! 👋
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Here's your learning progress and mentoring activities
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statsCards.map((card, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {card.title}
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                    {card.value}
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                    {card.change}
                  </p>
                </div>
                <div className={`${card.color} p-3 rounded-lg`}>
                  <card.icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* AI Mentor Quick Actions */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                AI Mentor Assistant
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link
                  to="/chat"
                  className="group p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg border border-purple-200 dark:border-purple-700 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-center space-x-3">
                    <div className="bg-purple-500 p-2 rounded-lg">
                      <Brain className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        Get Mentoring Tips
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        AI-powered suggestions
                      </p>
                    </div>
                  </div>
                </Link>

                <Link
                  to="/chat?mode=practice"
                  className="group p-4 bg-gradient-to-r from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 rounded-lg border border-green-200 dark:border-green-700 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-center space-x-3">
                    <div className="bg-green-500 p-2 rounded-lg">
                      <Zap className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        Practice Mode
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Simulate mentee interactions
                      </p>
                    </div>
                  </div>
                </Link>
              </div>
            </div>

            {/* Progress Overview */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Current Goals Progress
                </h2>
                <Link
                  to="/goals"
                  className="text-primary-600 hover:text-primary-700 font-medium text-sm flex items-center"
                >
                  View All <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              </div>

              <div className="space-y-4">
                {userGoals.slice(0, 3).map((goal) => (
                  <div key={goal.id} className="border dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {goal.title}
                      </h3>
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        {goal.progress}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-primary-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${goal.progress}%` }}
                      />
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                      Due: {new Date(goal.deadline).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Recent Activity
              </h2>
              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className={`${activity.color} p-1.5 rounded-full bg-opacity-10`}>
                      <activity.icon className={`h-4 w-4 ${activity.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 dark:text-white">
                        {activity.title}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center mt-1">
                        <Clock className="h-3 w-3 mr-1" />
                        {activity.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Course Access */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Recommended Courses
                </h2>
                <Link
                  to="/courses"
                  className="text-primary-600 hover:text-primary-700 font-medium text-sm flex items-center"
                >
                  View All <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              </div>
              <div className="space-y-3">
                {mockCourses.slice(0, 3).map((course) => (
                  <div
                    key={course.id}
                    className="p-3 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
                  >
                    <h3 className="font-medium text-gray-900 dark:text-white text-sm">
                      {course.name}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {course.provider} • {course.duration}
                    </p>
                    <div className="flex items-center mt-2">
                      <div className="flex text-yellow-400">
                        {'★'.repeat(Math.floor(course.rating))}
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                        {course.rating} ({course.enrolled} enrolled)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;