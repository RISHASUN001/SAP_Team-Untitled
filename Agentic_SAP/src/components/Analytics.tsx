import React, { useState } from 'react';
import Layout from './Layout';
import { useAuth } from '../contexts/AuthContext';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from 'recharts';
import {
  TrendingUp,
  Users,
  Target,
  BookOpen,
  Calendar,
  Award,
  MessageCircle,
  Clock,
  Filter,
  Download
} from 'lucide-react';

const Analytics: React.FC = () => {
  const { currentUser } = useAuth();
  const [timeRange, setTimeRange] = useState('3m'); // 1w, 1m, 3m, 6m, 1y
  const [activeTab, setActiveTab] = useState('overview');

  // Mock data for charts
  const progressData = [
    { month: 'Oct', progress: 45, goals: 2, courses: 1 },
    { month: 'Nov', progress: 62, goals: 3, courses: 2 },
    { month: 'Dec', progress: 75, goals: 4, courses: 2 },
    { month: 'Jan', progress: 85, goals: 5, courses: 3 }
  ];

  const skillsData = [
    { name: 'Python', current: 85, target: 90, gap: 5 },
    { name: 'Machine Learning', current: 70, target: 85, gap: 15 },
    { name: 'Data Visualization', current: 80, target: 85, gap: 5 },
    { name: 'Deep Learning', current: 40, target: 80, gap: 40 },
    { name: 'MLOps', current: 25, target: 70, gap: 45 },
    { name: 'Cloud Computing', current: 30, target: 75, gap: 45 }
  ];

  const mentoringData = [
    { week: 'Week 1', sessions: 2, feedback: 4.5 },
    { week: 'Week 2', sessions: 3, feedback: 4.2 },
    { week: 'Week 3', sessions: 1, feedback: 4.8 },
    { week: 'Week 4', sessions: 4, feedback: 4.6 }
  ];

  const goalStatusData = [
    { name: 'Completed', value: 35, color: '#10b981' },
    { name: 'In Progress', value: 45, color: '#3b82f6' },
    { name: 'Not Started', value: 20, color: '#6b7280' }
  ];

  const coursesCompletionData = [
    { name: 'ML Fundamentals', completed: 75, total: 100 },
    { name: 'Python for DS', completed: 90, total: 100 },
    { name: 'Deep Learning', completed: 25, total: 100 },
    { name: 'Data Visualization', completed: 60, total: 100 }
  ];

  const feedbackTrendsData = [
    { month: 'Oct', technical: 4.2, communication: 3.8, leadership: 3.5 },
    { month: 'Nov', technical: 4.4, communication: 4.0, leadership: 3.7 },
    { month: 'Dec', technical: 4.6, communication: 4.2, leadership: 4.0 },
    { month: 'Jan', technical: 4.7, communication: 4.4, leadership: 4.2 }
  ];

  const stats = [
    {
      title: 'Learning Progress',
      value: '78%',
      change: '+12% this month',
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/20'
    },
    {
      title: 'Goals Completed',
      value: '8/12',
      change: '2 completed this week',
      icon: Target,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20'
    },
    {
      title: 'Mentoring Sessions',
      value: '24',
      change: '4 this month',
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/20'
    },
    {
      title: 'Course Completion',
      value: '87%',
      change: '3 courses active',
      icon: BookOpen,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100 dark:bg-orange-900/20'
    }
  ];

  const tabs = [
    { id: 'overview', name: 'Overview', icon: BarChart },
    { id: 'skills', name: 'Skills', icon: Target },
    { id: 'mentoring', name: 'Mentoring', icon: Users },
    { id: 'feedback', name: 'Feedback', icon: MessageCircle }
  ];

  return (
    <Layout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Analytics Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Track your learning progress and mentoring effectiveness
            </p>
          </div>

          <div className="flex items-center space-x-4">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="1w">Last Week</option>
              <option value="1m">Last Month</option>
              <option value="3m">Last 3 Months</option>
              <option value="6m">Last 6 Months</option>
              <option value="1y">Last Year</option>
            </select>

            <button className="flex items-center px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors">
              <Download className="h-4 w-4 mr-2" />
              Export
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border dark:border-gray-700"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {stat.value}
                  </p>
                  <p className={`text-sm mt-2 ${stat.color}`}>
                    {stat.change}
                  </p>
                </div>
                <div className={`${stat.bgColor} p-3 rounded-lg`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm mb-6">
          <div className="border-b dark:border-gray-700">
            <div className="flex space-x-8 px-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  <tab.icon className="h-4 w-4 mr-2" />
                  {tab.name}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                    Learning Progress Over Time
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={progressData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="month" stroke="#6b7280" />
                      <YAxis stroke="#6b7280" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1f2937', 
                          border: 'none', 
                          borderRadius: '8px',
                          color: '#ffffff'
                        }} 
                      />
                      <Area
                        type="monotone"
                        dataKey="progress"
                        stroke="#3b82f6"
                        fill="#3b82f6"
                        fillOpacity={0.2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                    Goals Distribution
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={goalStatusData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {goalStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="lg:col-span-2">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                    Course Completion Status
                  </h3>
                  <div className="space-y-4">
                    {coursesCompletionData.map((course, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {course.name}
                            </span>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {course.completed}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-primary-500 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${course.completed}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Skills Tab */}
            {activeTab === 'skills' && (
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                  Skills Gap Analysis
                </h3>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={skillsData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="name" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1f2937', 
                        border: 'none', 
                        borderRadius: '8px',
                        color: '#ffffff'
                      }} 
                    />
                    <Bar dataKey="current" fill="#3b82f6" name="Current Level" />
                    <Bar dataKey="target" fill="#10b981" name="Target Level" />
                  </BarChart>
                </ResponsiveContainer>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  {skillsData.slice(0, 3).map((skill, index) => (
                    <div key={index} className="p-4 border dark:border-gray-700 rounded-lg">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                        {skill.name}
                      </h4>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        <p>Current: {skill.current}%</p>
                        <p>Target: {skill.target}%</p>
                        <p className="text-red-500">Gap: {skill.gap} points</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Mentoring Tab */}
            {activeTab === 'mentoring' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                    Mentoring Session Activity
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={mentoringData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="week" stroke="#6b7280" />
                      <YAxis yAxisId="left" stroke="#6b7280" />
                      <YAxis yAxisId="right" orientation="right" stroke="#6b7280" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1f2937', 
                          border: 'none', 
                          borderRadius: '8px',
                          color: '#ffffff'
                        }} 
                      />
                      <Bar yAxisId="left" dataKey="sessions" fill="#3b82f6" name="Sessions" />
                      <Line 
                        yAxisId="right" 
                        type="monotone" 
                        dataKey="feedback" 
                        stroke="#10b981" 
                        strokeWidth={3}
                        name="Avg Rating"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 border dark:border-gray-700 rounded-lg">
                    <h4 className="font-bold text-gray-900 dark:text-white mb-3">
                      Mentoring Impact
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Total Sessions</span>
                        <span className="font-medium text-gray-900 dark:text-white">24</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Avg Rating</span>
                        <span className="font-medium text-gray-900 dark:text-white">4.6/5</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Mentees Helped</span>
                        <span className="font-medium text-gray-900 dark:text-white">6</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Success Rate</span>
                        <span className="font-medium text-green-600">92%</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border dark:border-gray-700 rounded-lg">
                    <h4 className="font-bold text-gray-900 dark:text-white mb-3">
                      Recent Feedback
                    </h4>
                    <div className="space-y-3">
                      <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <p className="text-sm text-green-800 dark:text-green-300">
                          "Excellent guidance on ML concepts. Very patient and clear."
                        </p>
                        <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                          - Alex R. (Jan 20)
                        </p>
                      </div>
                      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <p className="text-sm text-blue-800 dark:text-blue-300">
                          "Helped me overcome Python challenges quickly."
                        </p>
                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                          - Jordan K. (Jan 18)
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Feedback Tab */}
            {activeTab === 'feedback' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                    Feedback Trends by Category
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={feedbackTrendsData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="month" stroke="#6b7280" />
                      <YAxis domain={[3, 5]} stroke="#6b7280" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1f2937', 
                          border: 'none', 
                          borderRadius: '8px',
                          color: '#ffffff'
                        }} 
                      />
                      <Line type="monotone" dataKey="technical" stroke="#3b82f6" strokeWidth={2} name="Technical Skills" />
                      <Line type="monotone" dataKey="communication" stroke="#10b981" strokeWidth={2} name="Communication" />
                      <Line type="monotone" dataKey="leadership" stroke="#f59e0b" strokeWidth={2} name="Leadership" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-4 border dark:border-gray-700 rounded-lg">
                    <h4 className="font-bold text-gray-900 dark:text-white mb-3">
                      Strengths
                    </h4>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">Technical Problem Solving</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">Learning Agility</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">Code Quality</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border dark:border-gray-700 rounded-lg">
                    <h4 className="font-bold text-gray-900 dark:text-white mb-3">
                      Areas for Improvement
                    </h4>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">Presentation Skills</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">Documentation</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">Team Collaboration</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border dark:border-gray-700 rounded-lg">
                    <h4 className="font-bold text-gray-900 dark:text-white mb-3">
                      AI Recommendations
                    </h4>
                    <div className="space-y-2">
                      <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded text-sm">
                        Focus on presentation practice sessions
                      </div>
                      <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded text-sm">
                        Join public speaking groups
                      </div>
                      <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded text-sm">
                        Take technical writing course
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Analytics;