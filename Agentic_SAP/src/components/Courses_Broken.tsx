import React, { useState, useMemo } from 'react';
import Layout from './Layout';
import { useAuth } from '../contexts/AuthContext';
import {
  BookOpen,
  Clock,
  Users,
  Star,
  Filter,
  Search,
  ChevronDown,
  ExternalLink,
  Play,
  CheckCircle,
  Target,
  TrendingUp
} from 'lucide-react';
import { getRecommendedCourses, getSkillGaps, completeCourse, getAIRecommendedCourses, AISkillAnalysis } from '../data/skillGapUtils';
import { userProfiles } from '../data/userProfiles';
import { courses } from '../data/courseData';
import CourseSearchAI from './CourseSearchAI';

interface CourseFilters {
  difficulty: string;
  duration: string;
  skill: string;
}

// Since our technical courses don't have difficulty/duration, we'll simplify filters
const Courses: React.FC = () => {
  const { currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<CourseFilters>({
    difficulty: '',
    duration: '',
    skill: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [enrolledCourses, setEnrolledCourses] = useState<string[]>(['course1']);
  const [completedCourses, setCompletedCourses] = useState<string[]>([]);
  const [aiFilteredCourses, setAiFilteredCourses] = useState<any[]>([]);
  const [isAiSearch, setIsAiSearch] = useState(false);
  const [aiSkillAnalysis, setAiSkillAnalysis] = useState<AISkillAnalysis | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);

  if (!currentUser) {
    return (
      <Layout>
        <div className="p-6">
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Please log in
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              You need to be logged in to view your recommended courses
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  const userProfile = userProfiles.find(u => u.name === currentUser.name);
  if (!userProfile) {
    return (
      <Layout>
        <div className="p-6">
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No course data found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Course data not available for this user
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  // Get skill gap based recommendations
  const recommendedCourses = getRecommendedCourses(userProfile.userId);
  const skillGaps = getSkillGaps(userProfile.userId);

  // Load AI recommendations when component mounts or user changes
  React.useEffect(() => {
    const loadAIRecommendations = async () => {
      if (skillGaps.length > 0 && !aiSkillAnalysis) {
        setLoadingAI(true);
        try {
          const aiRecs = await getAIRecommendedCourses(userProfile.userId);
          setAiSkillAnalysis(aiRecs);
        } catch (error) {
          console.error('Failed to load AI recommendations:', error);
        } finally {
          setLoadingAI(false);
        }
      }
    };

    loadAIRecommendations();
  }, [userProfile.userId, skillGaps.length, aiSkillAnalysis]);

  // Extract unique values for filters from our course database
  const difficulties = [...new Set(courses.map(c => c.difficulty))];
  const skills = [...new Set(courses.flatMap(c => c.skills.map(s => s.name)))];

  // Filter and search courses from our course database
  const filteredCourses = useMemo(() => {
    // If AI search is active, use AI results, otherwise use regular filtering
    if (isAiSearch && aiFilteredCourses.length > 0) {
      return aiFilteredCourses;
    }

    return courses.filter(course => {
      const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.skills.some(skill => skill.name.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesDifficulty = !filters.difficulty || course.difficulty === filters.difficulty;
      const matchesDuration = !filters.duration || course.duration.includes(filters.duration);
      const matchesSkill = !filters.skill || course.skills.some(skill => skill.name === filters.skill);

      return matchesSearch && matchesDifficulty && matchesDuration && matchesSkill;
    });
  }, [searchQuery, filters, isAiSearch, aiFilteredCourses]);

  const handleEnroll = (courseId: string) => {
    if (enrolledCourses.includes(courseId)) {
      setEnrolledCourses(prev => prev.filter(id => id !== courseId));
    } else {
      setEnrolledCourses(prev => [...prev, courseId]);
    }
  };

  const handleCompleteCourse = (courseId: string) => {
    if (userProfile && completeCourse(userProfile.userId, courseId)) {
      setCompletedCourses(prev => [...prev, courseId]);
      // Re-fetch recommendations since skills have been updated
      window.location.reload(); // Simple way to refresh the recommendations
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'beginner':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'advanced':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  // Handler for AI search results
  const handleAICoursesFound = (foundCourses: any[]) => {
    setAiFilteredCourses(foundCourses);
    setIsAiSearch(true);
    // Clear regular search when AI search is used
    setSearchQuery('');
    setFilters({ difficulty: '', duration: '', skill: '' });
  };

  // Handler to reset to regular search
  const resetToRegularSearch = () => {
    setIsAiSearch(false);
    setAiFilteredCourses([]);
  };

  return (
    <Layout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Learning Courses
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Discover courses tailored to your skill development goals
          </p>
        </div>

        {/* AI Course Search */}
        <CourseSearchAI onCoursesFound={handleAICoursesFound} />

        {/* AI Search Results Info */}
        {isAiSearch && (
          <div className="mb-6 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400 mr-2" />
                <span className="text-purple-800 dark:text-purple-200 font-medium">
                  Showing AI-recommended courses ({aiFilteredCourses.length} found)
                </span>
              </div>
              <button
                onClick={resetToRegularSearch}
                className="px-3 py-1 text-sm bg-purple-100 dark:bg-purple-800 text-purple-700 dark:text-purple-200 rounded-md hover:bg-purple-200 dark:hover:bg-purple-700 transition-colors"
              >
                Show All Courses
              </button>
            </div>
          </div>
        )}

        {/* Enhanced AI Recommendations Section */}
        {recommendedCourses.length > 0 && (
          <div className="mb-8 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl p-6 border border-purple-200 dark:border-purple-700">
            <div className="flex items-center mb-4">
              <div className="bg-purple-500 p-2 rounded-lg mr-3">
                <Target className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  AI-Recommended Learning Path
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Personalized for your skill gaps: {skillGaps.map(gap => gap.name).join(', ')}
                </p>
              </div>
              {loadingAI && (
                <div className="flex items-center text-purple-600 dark:text-purple-400">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600 mr-2"></div>
                  <span className="text-sm">AI analyzing...</span>
                </div>
              )}
            </div>

            {/* AI Strategic Advice */}
            {aiSkillAnalysis?.strategic_advice && (
              <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg p-4 border border-purple-200 dark:border-purple-600">
                <div className="flex items-start space-x-3">
                  <div className="bg-purple-100 dark:bg-purple-900/20 p-2 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                      AI Learning Strategy
                    </h4>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {aiSkillAnalysis.strategic_advice}
                    </p>
                    {aiSkillAnalysis.estimated_timeline && (
                      <p className="text-xs text-purple-600 dark:text-purple-400 mt-2">
                        📅 {aiSkillAnalysis.estimated_timeline}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* AI-Sequenced Course Recommendations */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(aiSkillAnalysis?.recommended_sequence || []).length > 0 ? (
                // Show AI-sequenced courses with reasoning
                aiSkillAnalysis!.recommended_sequence
                  .sort((a, b) => a.sequence_order - b.sequence_order)
                  .map((aiRec) => {
                    const course = courses.find(c => c.id === aiRec.course_id);
                    if (!course) return null;
                    
                    const isEnrolled = enrolledCourses.includes(course.id);
                    const isCompleted = completedCourses.includes(course.id) || (userProfile?.completedCourses.includes(course.id) ?? false);
                    
                    return (
                      <div
                        key={course.id}
                        className="bg-white dark:bg-gray-800 rounded-lg border-2 border-purple-200 dark:border-purple-600 overflow-hidden"
                      >
                        <div className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center">
                              <span className="bg-purple-500 text-white text-xs font-bold px-2 py-1 rounded-full mr-2">
                                {aiRec.sequence_order}
                              </span>
                              <h3 className="font-medium text-gray-900 dark:text-white text-sm">
                                {course.title}
                              </h3>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(course.difficulty)}`}>
                              {course.difficulty}
                            </span>
                          </div>
                          
                          {/* AI Reasoning */}
                          <div className="mb-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                            <p className="text-xs text-purple-800 dark:text-purple-200 font-medium mb-1">
                              🤖 AI Recommendation:
                            </p>
                            <p className="text-xs text-purple-700 dark:text-purple-300">
                              {aiRec.reasoning}
                            </p>
                            {aiRec.timing_advice && (
                              <p className="text-xs text-purple-600 dark:text-purple-400 mt-1 italic">
                                💡 {aiRec.timing_advice}
                              </p>
                            )}
                          </div>
                          
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                            Skills: {course.skills.map((s: any) => `${s.name} (Level ${s.level})`).join(', ')}
                          </p>
                          
                          <div className="flex items-center justify-between mb-3">
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300">
                              AI Optimized
                            </span>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {course.duration}
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex justify-center">
                            {isCompleted ? (
                              <div className="flex items-center px-3 py-2 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 rounded-lg text-sm font-medium">
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Completed
                              </div>
                            ) : isEnrolled ? (
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => handleCompleteCourse(course.id)}
                                  className="flex items-center px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium text-sm transition-colors"
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Complete
                                </button>
                                <button
                                  onClick={() => handleEnroll(course.id)}
                                  className="flex items-center px-3 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium text-sm transition-colors"
                                >
                                  Unenroll
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleEnroll(course.id)}
                                className="flex items-center px-3 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium text-sm transition-colors"
                              >
                                <Play className="h-4 w-4 mr-2" />
                                Start Step {aiRec.sequence_order}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
              ) : (
                // Fallback to traditional recommendations if AI is loading or failed
                recommendedCourses.map((course) => {
                  const isEnrolled = enrolledCourses.includes(course.id);
                  const isCompleted = completedCourses.includes(course.id) || (userProfile?.completedCourses.includes(course.id) ?? false);
                  
                  return (
                    <div
                      key={course.id}
                      className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 overflow-hidden"
                    >
                      <div className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            {course.title}
                          </h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(course.difficulty)}`}>
                            {course.difficulty}
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          Skills: {course.skills.map((s: any) => `${s.name} (Level ${s.level})`).join(', ')}
                        </p>
                        
                        <div className="flex items-center justify-between mb-3">
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300">
                            Recommended
                          </span>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {course.duration}
                          </div>
                        </div>

                      {/* Action Buttons */}
                      <div className="flex justify-center">
                        {isCompleted ? (
                          <div className="flex items-center px-3 py-2 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 rounded-lg text-sm font-medium">
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Completed
                          </div>
                        ) : isEnrolled ? (
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleCompleteCourse(course.id)}
                              className="flex items-center px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium text-sm transition-colors"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Complete
                            </button>
                            <button
                              onClick={() => handleEnroll(course.id)}
                              className="flex items-center px-3 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium text-sm transition-colors"
                            >
                              Unenroll
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleEnroll(course.id)}
                            className="flex items-center px-3 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium text-sm transition-colors"
                          >
                            <Play className="h-4 w-4 mr-2" />
                            Start Step {aiRec.sequence_order}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              // Fallback to traditional recommendations if AI is loading or failed
              recommendedCourses.map((course) => {
                const isEnrolled = enrolledCourses.includes(course.id);
                const isCompleted = completedCourses.includes(course.id) || (userProfile?.completedCourses.includes(course.id) ?? false);
                
                return (
                  <div
                    key={course.id}
                    className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 overflow-hidden"
                  >
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {course.title}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(course.difficulty)}`}>
                          {course.difficulty}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        Skills: {course.skills.map((s: any) => `${s.name} (Level ${s.level})`).join(', ')}
                      </p>
                      
                      <div className="flex items-center justify-between mb-3">
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300">
                          Recommended
                        </span>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {course.duration}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex justify-center">
                        {isCompleted ? (
                          <div className="flex items-center px-3 py-2 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 rounded-lg text-sm font-medium">
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Completed
                          </div>
                        ) : isEnrolled ? (
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleCompleteCourse(course.id)}
                              className="flex items-center px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium text-sm transition-colors"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Complete
                            </button>
                            <button
                              onClick={() => handleEnroll(course.id)}
                              className="flex items-center px-3 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium text-sm transition-colors"
                            >
                              Unenroll
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleEnroll(course.id)}
                            className="flex items-center px-3 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium text-sm transition-colors"
                          >
                            <Play className="h-4 w-4 mr-2" />
                            Enroll Now
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            </div>
          </div>
        )}

        {skillGaps.length === 0 && (
          <div className="mb-8 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6 border border-green-200 dark:border-green-700">
            <div className="flex items-center">
              <div className="bg-green-500 p-2 rounded-lg mr-3">
                <CheckCircle className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Great job!
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  You have no skill gaps for your role! Browse all courses below to continue learning.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 mb-6 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search courses, skills, or providers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
              <ChevronDown className={`h-4 w-4 ml-2 transform transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t dark:border-gray-700">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Difficulty
                  </label>
                  <select
                    value={filters.difficulty}
                    onChange={(e) => setFilters(prev => ({ ...prev, difficulty: e.target.value }))}
                    className="w-full p-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">All Levels</option>
                    {difficulties.map(difficulty => (
                      <option key={difficulty} value={difficulty}>{difficulty}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Duration
                  </label>
                  <select
                    value={filters.duration}
                    onChange={(e) => setFilters(prev => ({ ...prev, duration: e.target.value }))}
                    className="w-full p-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Any Duration</option>
                    <option value="3">Short (1-4 weeks)</option>
                    <option value="6">Medium (5-8 weeks)</option>
                    <option value="10">Long (9+ weeks)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Skill Focus
                  </label>
                  <select
                    value={filters.skill}
                    onChange={(e) => setFilters(prev => ({ ...prev, skill: e.target.value }))}
                    className="w-full p-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">All Skills</option>
                    {skills.map(skill => (
                      <option key={skill} value={skill}>{skill}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end mt-4">
                <button
                  onClick={() => setFilters({ difficulty: '', duration: '', skill: '' })}
                  className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Results Header */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-gray-600 dark:text-gray-300">
            Showing {filteredCourses.length} course{filteredCourses.length !== 1 ? 's' : ''}
          </p>
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-500 dark:text-gray-400">Sorted by relevance</span>
          </div>
        </div>

        {/* Course Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredCourses.map((course) => {
            const isEnrolled = enrolledCourses.includes(course.id);
            const isCompleted = completedCourses.includes(course.id) || (userProfile?.completedCourses.includes(course.id) ?? false);
            
            return (
              <div
                key={course.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow duration-200"
              >
                {/* Course Header */}
                <div className="p-6 border-b dark:border-gray-700">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                        {course.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Data Science Course
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(course.difficulty)}`}>
                      {course.difficulty}
                    </span>
                  </div>

                  <p className="text-gray-700 dark:text-gray-300 text-sm mb-4">
                    {course.description}
                  </p>

                  {/* Course Stats */}
                  <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      {course.duration} ({course.estimatedHours}h)
                    </div>
                    <div className="flex items-center">
                      <Target className="h-4 w-4 mr-1" />
                      {course.recommendedForRoles.length} roles
                    </div>
                    <div className="flex items-center">
                      <Star className="h-4 w-4 mr-1 text-yellow-400 fill-current" />
                      4.5
                    </div>
                  </div>
                </div>

                {/* Skills */}
                <div className="p-4 border-b dark:border-gray-700">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                    Skills You'll Gain:
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {course.skills.map((skill) => (
                      <span
                        key={skill.name}
                        className="px-2 py-1 bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 rounded text-xs"
                      >
                        {skill.name} (Level {skill.level})
                      </span>
                    ))}
                  </div>
                </div>

                {/* Recommended For */}
                <div className="p-4 border-b dark:border-gray-700">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                    Recommended For:
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {course.recommendedForRoles.map((role) => (
                      <span
                        key={role}
                        className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs"
                      >
                        {role}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {course.difficulty} • {course.duration}
                    </div>

                    <div className="flex items-center space-x-2">
                      {isCompleted ? (
                        <div className="flex items-center px-4 py-2 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 rounded-lg text-sm font-medium">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Completed
                        </div>
                      ) : isEnrolled ? (
                        <>
                          <button
                            onClick={() => handleCompleteCourse(course.id)}
                            className="flex items-center px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium text-sm transition-colors"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Mark Complete
                          </button>
                          <button
                            onClick={() => handleEnroll(course.id)}
                            className="flex items-center px-3 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium text-sm transition-colors"
                          >
                            Unenroll
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleEnroll(course.id)}
                          className="flex items-center px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium text-sm transition-colors"
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Enroll Now
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredCourses.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No courses found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Try adjusting your search terms or filters
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Courses;