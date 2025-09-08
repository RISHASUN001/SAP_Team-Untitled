import React, { useState, useMemo } from "react";
import Layout from "./Layout";
import { useAuth } from "../contexts/AuthContext";
import {
  BookOpen,
  Clock,
  Filter,
  Search,
  ChevronDown,
  Play,
  CheckCircle,
  Target,
  TrendingUp,
  UserCheck,
} from "lucide-react";
import { mockCourses } from "../data/mockData";
  TrendingUp
} from 'lucide-react';
import { getRecommendedCourses, getSkillGaps, completeCourse, getAIRecommendedCourses, AISkillAnalysis } from '../data/skillGapUtils';
import { userProfiles } from '../data/userProfiles';
import { courses } from '../data/courseData';
import CourseSearchAI from './CourseSearchAI';

// Extract unique values for filters from our course database
const durations = [...new Set(courses.map(c => c.duration))].sort((a, b) => {
  // Sort durations by numeric value (3 weeks, 4 weeks, 5 weeks, etc.)
  const aNum = parseInt(a.split(' ')[0]);
  const bNum = parseInt(b.split(' ')[0]);
  return aNum - bNum;
});

interface CourseFilters {
  difficulty: string;
  duration: string;
  skill: string;
}

// Add onboarding courses to the mock data
const onboardingCourses = {
  // Common onboarding courses for all roles
  common: [
    {
      id: "onb001",
      name: "Company Culture & Values",
      provider: "HR Department",
      link: "#",
      description: "Learn about our company's mission, values, and culture",
      duration: "1 week",
      difficulty: "Beginner",
      prerequisites: [],
      skills_gained: [
        "Company Culture",
        "Corporate Values",
        "Team Integration",
      ],
      timeline_breakdown: {
        week1: "Introduction to company values and culture",
      },
      estimated_hours: 2,
      target_roles: ["All Roles"],
      rating: 4.7,
      enrolled: 1200,
    },
    {
      id: "onb002",
      name: "Data Security & Compliance",
      provider: "Security Team",
      link: "#",
      description: "Essential training on data handling and security protocols",
      duration: "1 week",
      difficulty: "Beginner",
      prerequisites: [],
      skills_gained: ["Data Security", "Compliance", "GDPR"],
      timeline_breakdown: {
        week1: "Data security protocols and compliance requirements",
      },
      estimated_hours: 3,
      target_roles: ["All Roles"],
      rating: 4.5,
      enrolled: 980,
    },
  ],
  // Data Science Team Lead specific onboarding
  team_lead: [
    {
      id: "onb003",
      name: "Leadership Fundamentals",
      provider: "Leadership Academy",
      link: "#",
      description: "Essential skills for leading technical teams effectively",
      duration: "2 weeks",
      difficulty: "Intermediate",
      prerequisites: [],
      skills_gained: [
        "Team Management",
        "Project Leadership",
        "Stakeholder Communication",
      ],
      timeline_breakdown: {
        week1: "Leadership principles and team dynamics",
        week2: "Project management and stakeholder communication",
      },
      estimated_hours: 6,
      target_roles: ["Team Lead", "Manager"],
      rating: 4.8,
      enrolled: 450,
    },
    {
      id: "onb004",
      name: "Strategic Planning for Tech Leaders",
      provider: "Strategy Institute",
      link: "#",
      description: "Learn to develop and execute technical strategy",
      duration: "3 weeks",
      difficulty: "Intermediate",
      prerequisites: [],
      skills_gained: [
        "Strategic Planning",
        "Resource Allocation",
        "Technical Roadmapping",
      ],
      timeline_breakdown: {
        week1: "Strategic thinking fundamentals",
        week2: "Developing technical roadmaps",
        week3: "Resource allocation and budgeting",
      },
      estimated_hours: 10,
      target_roles: ["Team Lead", "Manager"],
      rating: 4.6,
      enrolled: 320,
    },
  ],
  // Data Scientist specific onboarding
  data_scientist: [
    {
      id: "onb005",
      name: "Advanced ML Pipeline Setup",
      provider: "Data Science Guild",
      link: "#",
      description: "Setting up efficient ML workflows and pipelines",
      duration: "2 weeks",
      difficulty: "Intermediate",
      prerequisites: ["Python", "Machine Learning"],
      skills_gained: [
        "ML Pipelines",
        "Workflow Automation",
        "Model Deployment",
      ],
      timeline_breakdown: {
        week1: "Introduction to ML pipelines",
        week2: "Building automated workflows",
      },
      estimated_hours: 8,
      target_roles: ["Data Scientist", "ML Engineer"],
      rating: 4.7,
      enrolled: 670,
    },
    {
      id: "onb006",
      name: "Experimental Design for Data Science",
      provider: "Research Methods Institute",
      link: "#",
      description: "Design robust experiments and A/B tests",
      duration: "2 weeks",
      difficulty: "Intermediate",
      prerequisites: ["Statistics"],
      skills_gained: [
        "Experimental Design",
        "A/B Testing",
        "Statistical Significance",
      ],
      timeline_breakdown: {
        week1: "Principles of experimental design",
        week2: "Implementing and analyzing A/B tests",
      },
      estimated_hours: 7,
      target_roles: ["Data Scientist", "Data Analyst"],
      rating: 4.5,
      enrolled: 540,
    },
  ],
  // Data Analyst specific onboarding
  data_analyst: [
    {
      id: "onb007",
      name: "Business Intelligence Tools",
      provider: "Analytics Academy",
      link: "#",
      description: "Mastering BI tools and dashboard creation",
      duration: "2 weeks",
      difficulty: "Beginner",
      prerequisites: [],
      skills_gained: ["Dashboard Design", "Data Visualization", "BI Tools"],
      timeline_breakdown: {
        week1: "Introduction to BI tools",
        week2: "Creating effective dashboards",
      },
      estimated_hours: 6,
      target_roles: ["Data Analyst", "Business Analyst"],
      rating: 4.4,
      enrolled: 890,
    },
    {
      id: "onb008",
      name: "SQL for Advanced Analytics",
      provider: "DataQuery Pro",
      link: "#",
      description: "Advanced SQL techniques for complex data analysis",
      duration: "3 weeks",
      difficulty: "Intermediate",
      prerequisites: ["SQL Basics"],
      skills_gained: [
        "Advanced SQL",
        "Query Optimization",
        "Analytical Functions",
      ],
      timeline_breakdown: {
        week1: "Complex joins and subqueries",
        week2: "Window functions and CTEs",
        week3: "Query optimization techniques",
      },
      estimated_hours: 9,
      target_roles: ["Data Analyst", "Data Engineer"],
      rating: 4.7,
      enrolled: 720,
    },
  ],
};

const Courses: React.FC = () => {
  const { currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<CourseFilters>({
    difficulty: "",
    duration: "",
    skill: "",
  });
  const [showFilters, setShowFilters] = useState(false);
  const [enrolledCourses, setEnrolledCourses] = useState<string[]>([]);
  const difficulties = [...new Set(courses.map((c) => c.difficulty))];
  const skills = [...new Set(courses.flatMap((c) => c.skills.map((s: any) => s.name)))];

  // Get role-specific onboarding courses
  const getOnboardingCourses = () => {
    if (!currentUser) return [];

    const commonCourses = onboardingCourses.common;
    let roleCourses: {
      id: string;
      name: string;
      provider: string;
      // ...existing code for logic and handlers...

      return (
        <Layout>
          <div className="p-6 max-w-7xl mx-auto">
            {/* Main UI goes here. */}
          </div>
        </Layout>
      );
    }

    export default Courses;
                                key={skill.name}
                                className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-full text-xs"
                              >
                                {skill.name} (L{skill.level})
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="flex justify-center">
                          {isCompleted ? (
                            <div className="flex items-center px-4 py-2 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 rounded-lg font-medium">
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Completed
                            </div>
                          ) : isEnrolled ? (
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleCompleteCourse(course.id)}
                                className="flex items-center px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Complete
                              </button>
                              <button
                                onClick={() => handleEnroll(course.id)}
                                className="flex items-center px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
                              >
                                Unenroll
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleEnroll(course.id)}
                              className="flex items-center px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors"
                            >
                              <Play className="h-4 w-4 mr-2" />
                              Enroll Now
                            </button>
                          )}
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
                    Try adjusting your search criteria or filters
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* AI Recommendations Section */}
        {/* Recommendation Tab Content */}
        {activeTab === 'recommendation' && (
          <div>
        {recommendedCourses.length > 0 && (
          <div className="mb-8 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl p-6 border border-purple-200 dark:border-purple-700">
            <div className="flex items-center mb-4">
              <div className="bg-purple-500 p-2 rounded-lg mr-3">
                <Target className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  AI-Enhanced Learning Path
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Based on your skill gaps: {currentUser?.skillGaps?.join(", ")}
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recommendedCourses.map((course) => (
                <div
                  key={course.id}
                  className="bg-white dark:bg-gray-800 rounded-lg p-4 border dark:border-gray-700"
                >
                  <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                    {course.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {course.provider} • {course.duration}
                  </p>
                  <div className="flex items-center justify-between">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(
                        course.difficulty
                      )}`}
                    >
                      {course.difficulty}
                    </span>
                    <div className="flex text-yellow-400 text-sm">
                      <Star className="h-4 w-4 fill-current" />
                      <span className="ml-1 text-gray-600 dark:text-gray-400">
                        {course.rating}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Rest of the component remains the same */}
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
              <ChevronDown
                className={`h-4 w-4 ml-2 transform transition-transform ${
                  showFilters ? "rotate-180" : ""
                }`}
              />
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
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        difficulty: e.target.value,
                      }))
                    }
                    className="w-full p-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">All Levels</option>
                    {difficulties.map((difficulty) => (
                      <option key={difficulty} value={difficulty}>
                        {difficulty}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Duration
                  </label>
                  <select
                    value={filters.duration}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        duration: e.target.value,
                      }))
                    }
                    className="w-full p-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Any Duration</option>
                    <option value="week">Short (1-4 weeks)</option>
                    <option value="8">Medium (5-8 weeks)</option>
                    <option value="12">Long (9+ weeks)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Skill Focus
                  </label>
                  <select
                    value={filters.skill}
                    onChange={(e) =>
                      setFilters((prev) => ({ ...prev, skill: e.target.value }))
                    }
                    className="w-full p-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">All Skills</option>
                    {skills.slice(0, 10).map((skill) => (
                      <option key={skill} value={skill}>
                        {skill}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end mt-4">
                <button
                  onClick={() =>
                    setFilters({ difficulty: "", duration: "", skill: "" })
                  }
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
            Showing {filteredCourses.length} course
            {filteredCourses.length !== 1 ? "s" : ""}
          </p>
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Sorted by relevance
            </span>
          </div>
        </div>

        {/* Course Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredCourses.map((course) => {
            const isEnrolled = enrolledCourses.includes(course.id);

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
                        {course.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {course.provider}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(
                        course.difficulty
                      )}`}
                    >
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
                      {course.duration} ({course.estimated_hours}h)
                    </div>
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      {course.enrolled} enrolled
                    </div>
                    <div className="flex items-center">
                      <Star className="h-4 w-4 mr-1 text-yellow-400 fill-current" />
                      {course.rating}
                    </div>
                  </div>
                </div>

                {/* Skills */}
                <div className="p-4 border-b dark:border-gray-700">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                    Skills You'll Gain:
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {course.skills_gained.map((skill) => (
                      <span
                        key={skill}
                        className="px-2 py-1 bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 rounded text-xs"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Prerequisites */}
                {course.prerequisites.length > 0 && (
                  <div className="p-4 border-b dark:border-gray-700">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                      Prerequisites:
            {/* AI Learning Strategy - Enhanced Display */}
            {aiSkillAnalysis?.strategic_advice && (
              <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg p-6 border border-purple-200 dark:border-purple-600">
                <div className="flex items-start space-x-3 mb-4">
                  <div className="bg-purple-100 dark:bg-purple-900/20 p-2 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                      🤖 AI Learning Strategy
                    </h4>
                    {aiSkillAnalysis.estimated_timeline && (
                      <p className="text-sm text-purple-600 dark:text-purple-400 mb-3">
                        📅 {aiSkillAnalysis.estimated_timeline}
                      </p>
                    )}
                  </div>
                </div>

                {/* Recommended Learning Path */}
                {aiSkillAnalysis.recommended_sequence && aiSkillAnalysis.recommended_sequence.length > 0 && (
                  <div className="mb-4">
                    <h5 className="font-medium text-gray-900 dark:text-white mb-3">
                      Recommended Learning Path:
                    </h5>
                    <div className="space-y-3">
                      {aiSkillAnalysis.recommended_sequence.map((rec) => (
                        <div key={rec.course_id} className="flex items-start space-x-3 p-3 bg-purple-50 dark:bg-purple-900/10 rounded-lg">
                          <div className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold flex-shrink-0">
                            {rec.sequence_order}
                          </div>
                          <div className="flex-1">
                            <h6 className="font-medium text-gray-900 dark:text-white">
                              {rec.course_title}
                            </h6>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                              {rec.reasoning}
                            </p>
                            {rec.timing_advice && (
                              <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                                {rec.timing_advice}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Strategic Advice */}
                <div className="border-t border-purple-200 dark:border-purple-600 pt-4">
                  <h5 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center">
                    <span className="mr-2">🎯</span>
                    Strategic Advice:
                  </h5>
                  <p className="text-sm text-gray-700 dark:text-gray-300 italic">
                    {aiSkillAnalysis.strategic_advice}
                  </p>
                </div>
              </div>
            )}

                    <button
                      onClick={() => handleEnroll(course.id)}
                      className={`flex items-center px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                        isEnrolled
                          ? "bg-green-500 hover:bg-green-600 text-white"
                          : "bg-primary-500 hover:bg-primary-600 text-white"
                      }`}
                    >
                      {isEnrolled ? (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Enrolled
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          Enroll Now
                        </>
            {/* Course Recommendations */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recommendedCourses.map((course) => {
                const isEnrolled = enrolledCourses.includes(course.id);
                const isCompleted = completedCourses.includes(course.id) || (userProfile?.completedCourses.includes(course.id) ?? false);
                
                // Find AI recommendation for this course if available
                const aiRec = aiSkillAnalysis?.recommended_sequence?.find(rec => rec.course_id === course.id);
                
                return (
                  <div
                    key={course.id}
                    className={`bg-white dark:bg-gray-800 rounded-lg border ${aiRec ? 'border-2 border-purple-200 dark:border-purple-600' : 'border-gray-200 dark:border-gray-700'} overflow-hidden`}
                  >
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center">
                          {aiRec && (
                            <span className="bg-purple-500 text-white text-xs font-bold px-2 py-1 rounded-full mr-2">
                              {aiRec.sequence_order}
                            </span>
                          )}
                          <h3 className="font-medium text-gray-900 dark:text-white text-sm">
                            {course.title}
                          </h3>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(course.difficulty)}`}>
                          {course.difficulty}
                        </span>
                      </div>
                      
                      {/* AI Reasoning - Show the sentences you wanted */}
                      {aiRec && (
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
                      )}
                      
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        Skills: {course.skills.map((s: any) => `${s.name} (Level ${s.level})`).join(', ')}
                      </p>
                      
                      <div className="flex items-center justify-between mb-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${aiRec ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300' : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300'}`}>
                          {aiRec ? 'AI Optimized' : 'Recommended'}
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
                            {aiRec ? `Start Step ${aiRec.sequence_order}` : 'Enroll Now'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
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
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Courses;
