import React, { useState, useMemo } from "react";
import Layout from "./Layout";
import { useAuth } from "../contexts/AuthContext";
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
  TrendingUp,
  UserCheck,
} from "lucide-react";
import { mockCourses } from "../data/mockData";

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
  const [enrolledCourses, setEnrolledCourses] = useState<string[]>(["ds001"]);

  // Extract unique values for filters
  const difficulties = [...new Set(mockCourses.map((c) => c.difficulty))];
  const skills = [...new Set(mockCourses.flatMap((c) => c.skills_gained))];

  // Get role-specific onboarding courses
  const getOnboardingCourses = () => {
    if (!currentUser) return [];

    const commonCourses = onboardingCourses.common;
    let roleCourses: {
      id: string;
      name: string;
      provider: string;
      link: string;
      description: string;
      duration: string;
      difficulty: string;
      prerequisites: string[];
      skills_gained: string[];
      timeline_breakdown: { week1: string; week2: string };
      estimated_hours: number;
      target_roles: string[];
      rating: number;
      enrolled: number;
    }[] = [];

    if (currentUser.role.toLowerCase().includes("lead")) {
      roleCourses = onboardingCourses.team_lead;
    } else if (currentUser.role.toLowerCase().includes("scientist")) {
      roleCourses = onboardingCourses.data_scientist;
    } else if (currentUser.role.toLowerCase().includes("analyst")) {
      roleCourses = onboardingCourses.data_analyst;
    }

    return [...commonCourses, ...roleCourses];
  };

  const onboardingCoursesList = getOnboardingCourses();

  // Filter and search courses
  const filteredCourses = useMemo(() => {
    return mockCourses.filter((course) => {
      const matchesSearch =
        course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.skills_gained.some((skill) =>
          skill.toLowerCase().includes(searchQuery.toLowerCase())
        );

      const matchesDifficulty =
        !filters.difficulty || course.difficulty === filters.difficulty;
      const matchesDuration =
        !filters.duration || course.duration.includes(filters.duration);
      const matchesSkill =
        !filters.skill || course.skills_gained.includes(filters.skill);

      return (
        matchesSearch && matchesDifficulty && matchesDuration && matchesSkill
      );
    });
  }, [searchQuery, filters]);

  // Get personalized recommendations based on user's skill gaps
  const recommendedCourses = useMemo(() => {
    if (!currentUser?.skillGaps) return [];

    return mockCourses
      .filter((course) =>
        course.skills_gained.some((skill) =>
          currentUser.skillGaps?.some(
            (gap) =>
              gap.toLowerCase().includes(skill.toLowerCase()) ||
              skill.toLowerCase().includes(gap.toLowerCase())
          )
        )
      )
      .slice(0, 3);
  }, [currentUser]);

  const handleEnroll = (courseId: string) => {
    if (enrolledCourses.includes(courseId)) {
      setEnrolledCourses((prev) => prev.filter((id) => id !== courseId));
    } else {
      setEnrolledCourses((prev) => [...prev, courseId]);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case "beginner":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300";
      case "intermediate":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300";
      case "advanced":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300";
    }
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

        {/* Onboarding Courses Section */}
        {onboardingCoursesList.length > 0 && (
          <div className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-700">
            <div className="flex items-center mb-4">
              <div className="bg-blue-500 p-2 rounded-lg mr-3">
                <UserCheck className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Onboarding Courses for {currentUser?.role}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Essential training to get you started in your role
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {onboardingCoursesList.map((course) => {
                const isEnrolled = enrolledCourses.includes(course.id);

                return (
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
                    <div className="flex items-center justify-between mb-3">
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
                    <button
                      onClick={() => handleEnroll(course.id)}
                      className={`w-full flex items-center justify-center px-3 py-2 rounded-lg font-medium text-sm transition-colors ${
                        isEnrolled
                          ? "bg-green-500 hover:bg-green-600 text-white"
                          : "bg-blue-500 hover:bg-blue-600 text-white"
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
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* AI Recommendations Section */}
        {recommendedCourses.length > 0 && (
          <div className="mb-8 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl p-6 border border-purple-200 dark:border-purple-700">
            <div className="flex items-center mb-4">
              <div className="bg-purple-500 p-2 rounded-lg mr-3">
                <Target className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  AI-Recommended for You
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Based on your skill gaps: {currentUser?.skillGaps?.join(", ")}
                </p>
              </div>
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
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {course.prerequisites.map((prereq) => (
                        <span
                          key={prereq}
                          className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs"
                        >
                          {prereq}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <a
                      href={course.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      View Details
                    </a>

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
                      )}
                    </button>
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
