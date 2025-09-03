import React, { useState } from 'react';
import Layout from './Layout';
import { useAuth } from '../contexts/AuthContext';
import {
  Target,
  Plus,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  Edit,
  Trash2,
  Flag
} from 'lucide-react';
import { mockGoals } from '../data/mockData';

interface Goal {
  id: string;
  userId: string;
  title: string;
  description: string;
  deadline: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'overdue';
  progress: number;
  category: string;
  milestones: Milestone[];
}

interface Milestone {
  id: string;
  title: string;
  completed: boolean;
  date?: string;
  dueDate?: string;
}

const Goals: React.FC = () => {
  const { currentUser } = useAuth();
  const [goals, setGoals] = useState<Goal[]>(mockGoals);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    deadline: '',
    category: 'skill_development'
  });

  const userGoals = goals.filter(goal => goal.userId === currentUser?.id);

  const filteredGoals = userGoals.filter(goal => {
    if (selectedFilter === 'all') return true;
    return goal.status === selectedFilter;
  });

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoal.title || !newGoal.deadline) return;

    const goal: Goal = {
      id: `goal_${Date.now()}`,
      userId: currentUser?.id || '',
      title: newGoal.title,
      description: newGoal.description,
      deadline: newGoal.deadline,
      status: 'not_started',
      progress: 0,
      category: newGoal.category,
      milestones: []
    };

    setGoals(prev => [...prev, goal]);
    setNewGoal({ title: '', description: '', deadline: '', category: 'skill_development' });
    setShowCreateModal(false);
  };

  const handleUpdateProgress = (goalId: string, progress: number) => {
    setGoals(prev => prev.map(goal => 
      goal.id === goalId 
        ? { 
            ...goal, 
            progress,
            status: progress === 100 ? 'completed' : progress > 0 ? 'in_progress' : 'not_started'
          }
        : goal
    ));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
      case 'overdue':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return CheckCircle;
      case 'in_progress':
        return Clock;
      case 'overdue':
        return AlertCircle;
      default:
        return Target;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'certification':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300';
      case 'skill_development':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
      case 'project':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300';
      case 'career':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  const stats = {
    total: userGoals.length,
    completed: userGoals.filter(g => g.status === 'completed').length,
    inProgress: userGoals.filter(g => g.status === 'in_progress').length,
    overdue: userGoals.filter(g => g.status === 'overdue').length
  };

  return (
    <Layout>
      <div className="p-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Goals & Objectives
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Track your learning progress and professional development
            </p>
          </div>
          
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors"
          >
            <Plus className="h-5 w-5 mr-2" />
            New Goal
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
            <div className="flex items-center">
              <Target className="h-8 w-8 text-primary-500" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.total}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Goals</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.completed}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Completed</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.inProgress}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">In Progress</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-orange-500" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Success Rate</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-6 shadow-sm">
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'all', label: 'All Goals', count: stats.total },
              { key: 'in_progress', label: 'In Progress', count: stats.inProgress },
              { key: 'completed', label: 'Completed', count: stats.completed },
              { key: 'not_started', label: 'Not Started', count: userGoals.filter(g => g.status === 'not_started').length }
            ].map(filter => (
              <button
                key={filter.key}
                onClick={() => setSelectedFilter(filter.key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedFilter === filter.key
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {filter.label} ({filter.count})
              </button>
            ))}
          </div>
        </div>

        {/* Goals List */}
        <div className="space-y-6">
          {filteredGoals.map(goal => {
            const StatusIcon = getStatusIcon(goal.status);
            const daysUntilDeadline = Math.ceil((new Date(goal.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
            
            return (
              <div
                key={goal.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                          {goal.title}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(goal.status)}`}>
                          <StatusIcon className="h-3 w-3 inline mr-1" />
                          {goal.status.replace('_', ' ')}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(goal.category)}`}>
                          {goal.category.replace('_', ' ')}
                        </span>
                      </div>
                      
                      <p className="text-gray-600 dark:text-gray-300 mb-4">
                        {goal.description}
                      </p>

                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 space-x-4">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          Due: {new Date(goal.deadline).toLocaleDateString()}
                        </div>
                        <div className="flex items-center">
                          <Flag className="h-4 w-4 mr-1" />
                          {daysUntilDeadline > 0 ? `${daysUntilDeadline} days left` : 
                           daysUntilDeadline === 0 ? 'Due today' : 
                           `${Math.abs(daysUntilDeadline)} days overdue`}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Progress
                      </span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {goal.progress}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${
                          goal.progress === 100 ? 'bg-green-500' : 'bg-primary-500'
                        }`}
                        style={{ width: `${goal.progress}%` }}
                      />
                    </div>
                    
                    {/* Progress Controls */}
                    <div className="flex items-center space-x-2 mt-3">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={goal.progress}
                        onChange={(e) => handleUpdateProgress(goal.id, parseInt(e.target.value))}
                        className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <span className="text-sm text-gray-500 dark:text-gray-400 min-w-[60px]">
                        {goal.progress}%
                      </span>
                    </div>
                  </div>

                  {/* Milestones */}
                  {goal.milestones && goal.milestones.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                        Milestones ({goal.milestones.filter(m => m.completed).length}/{goal.milestones.length} completed)
                      </h4>
                      <div className="space-y-2">
                        {goal.milestones.map(milestone => (
                          <div
                            key={milestone.id}
                            className={`flex items-center p-3 rounded-lg border ${
                              milestone.completed
                                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700'
                                : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600'
                            }`}
                          >
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mr-3 ${
                              milestone.completed
                                ? 'bg-green-500 border-green-500'
                                : 'border-gray-300 dark:border-gray-600'
                            }`}>
                              {milestone.completed && <CheckCircle className="h-3 w-3 text-white" />}
                            </div>
                            <div className="flex-1">
                              <p className={`text-sm font-medium ${
                                milestone.completed
                                  ? 'text-green-800 dark:text-green-300 line-through'
                                  : 'text-gray-900 dark:text-white'
                              }`}>
                                {milestone.title}
                              </p>
                              {milestone.date && (
                                <p className="text-xs text-green-600 dark:text-green-400">
                                  Completed: {new Date(milestone.date).toLocaleDateString()}
                                </p>
                              )}
                              {milestone.dueDate && !milestone.completed && (
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  Due: {new Date(milestone.dueDate).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {filteredGoals.length === 0 && (
          <div className="text-center py-12">
            <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No goals found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Create your first goal to start tracking your progress
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors"
            >
              Create Goal
            </button>
          </div>
        )}

        {/* Create Goal Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Create New Goal
              </h2>
              
              <form onSubmit={handleCreateGoal} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Goal Title *
                  </label>
                  <input
                    type="text"
                    value={newGoal.title}
                    onChange={(e) => setNewGoal(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full p-3 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="e.g., Complete Python Certification"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={newGoal.description}
                    onChange={(e) => setNewGoal(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full p-3 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    rows={3}
                    placeholder="Describe your goal and what success looks like..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Category
                  </label>
                  <select
                    value={newGoal.category}
                    onChange={(e) => setNewGoal(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full p-3 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="skill_development">Skill Development</option>
                    <option value="certification">Certification</option>
                    <option value="project">Project</option>
                    <option value="career">Career</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Deadline *
                  </label>
                  <input
                    type="date"
                    value={newGoal.deadline}
                    onChange={(e) => setNewGoal(prev => ({ ...prev, deadline: e.target.value }))}
                    className="w-full p-3 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 border dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors"
                  >
                    Create Goal
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

export default Goals;