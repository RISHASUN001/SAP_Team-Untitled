import React, { useState } from "react";
import Layout from "./Layout";
import { useAuth } from "../contexts/AuthContext";
import { getSkillGaps, getRecommendedCourses } from "../data/skillGapUtils";
import { userProfiles } from "../data/userProfiles";
import { 
  Target, 
  TrendingUp, 
  Award, 
  AlertCircle, 
  CheckCircle, 
  BookOpen,
  Star,
  ChevronRight,
  Brain,
  Zap,
  User
} from "lucide-react";

const Skills: React.FC = () => {
  const { currentUser } = useAuth();
  const [expandedSkill, setExpandedSkill] = useState<string | null>(null);

  if (!currentUser) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-6">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm text-center">
              <User className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Authentication Required
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Please log in to view your skills and skill gaps analysis.
              </p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const userProfile = userProfiles.find(u => u.name === currentUser.name);
  
  if (!userProfile) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-6">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm text-center">
              <AlertCircle className="h-16 w-16 text-orange-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Profile Not Found
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                No skill data found for this user. Please contact your administrator.
              </p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const skillGaps = getSkillGaps(userProfile.userId);
  const recommendedCourses = getRecommendedCourses(userProfile.userId);

  const getSkillRatingColor = (rating: number) => {
    if (rating >= 3) return "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800";
    if (rating >= 2) return "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800";
    return "bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800";
  };

  const getSkillRatingText = (rating: number) => {
    if (rating >= 3) return "Expert";
    if (rating >= 2) return "Intermediate";
    return "Beginner";
  };

  const getSkillRatingStars = (rating: number) => {
    return Array.from({ length: 3 }, (_, i) => (
      <Star 
        key={i} 
        className={`h-4 w-4 ${i < rating ? 'text-yellow-500 fill-current' : 'text-gray-300 dark:text-gray-600'}`} 
      />
    ));
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          
          {/* Header Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm">
            <div className="flex items-center space-x-4 mb-6">
              <div className="p-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg">
                <Brain className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {userProfile.name}'s Skills Profile
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  {userProfile.role} • Skill Assessment & Development Plan
                </p>
              </div>
            </div>

            {/* Skills Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-6 border border-green-200 dark:border-green-800">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                  <div>
                    <h3 className="text-2xl font-bold text-green-700 dark:text-green-300">
                      {userProfile.skills.length}
                    </h3>
                    <p className="text-green-600 dark:text-green-400 text-sm font-medium">
                      Current Skills
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-lg p-6 border border-orange-200 dark:border-orange-800">
                <div className="flex items-center space-x-3">
                  <Target className="h-8 w-8 text-orange-600 dark:text-orange-400" />
                  <div>
                    <h3 className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                      {skillGaps.length}
                    </h3>
                    <p className="text-orange-600 dark:text-orange-400 text-sm font-medium">
                      Skill Gaps
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
                <div className="flex items-center space-x-3">
                  <BookOpen className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                  <div>
                    <h3 className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                      {recommendedCourses.length}
                    </h3>
                    <p className="text-blue-600 dark:text-blue-400 text-sm font-medium">
                      Recommended Courses
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Current Skills Section */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <div className="flex items-center space-x-3 mb-6">
                <Award className="h-6 w-6 text-green-600 dark:text-green-400" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Current Skills
                </h2>
              </div>
              
              <div className="space-y-4">
                {userProfile.skills.map((skill) => (
                  <div
                    key={skill.name}
                    className={`p-4 rounded-lg border-2 ${getSkillRatingColor(skill.rating)} cursor-pointer transition-all hover:shadow-md`}
                    onClick={() => setExpandedSkill(expandedSkill === skill.name ? null : skill.name)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <h3 className="font-semibold text-lg">
                          {skill.name}
                        </h3>
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-white/50 dark:bg-gray-800/50">
                          {getSkillRatingText(skill.rating)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="flex space-x-1">
                          {getSkillRatingStars(skill.rating)}
                        </div>
                        <ChevronRight 
                          className={`h-5 w-5 transition-transform ${
                            expandedSkill === skill.name ? 'rotate-90' : ''
                          }`} 
                        />
                      </div>
                    </div>
                    
                    {expandedSkill === skill.name && (
                      <div className="mt-3 pt-3 border-t border-current border-opacity-20">
                        <p className="text-sm opacity-80">
                          Skill Level: {skill.rating}/3 • 
                          {skill.rating >= 3 && " You have mastered this skill and can mentor others."}
                          {skill.rating === 2 && " You have good proficiency and can work independently."}
                          {skill.rating === 1 && " You have basic knowledge and may need guidance."}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Skill Gaps Section */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <div className="flex items-center space-x-3 mb-6">
                <TrendingUp className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Development Areas
                </h2>
              </div>
              
              {skillGaps.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    All Skills Acquired!
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    You meet all the skill requirements for your current role.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {skillGaps.map((gap) => (
                    <div
                      key={gap.name}
                      className="p-4 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-lg border border-orange-200 dark:border-orange-800"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {gap.name}
                            </h3>
                            <p className="text-sm text-orange-600 dark:text-orange-400">
                              Required Level: {gap.level}/3
                            </p>
                          </div>
                        </div>
                        <Zap className="h-5 w-5 text-orange-500" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recommended Learning Path */}
          {recommendedCourses.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <div className="flex items-center space-x-3 mb-6">
                <BookOpen className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Recommended Learning Path
                </h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recommendedCourses.slice(0, 6).map((course) => (
                  <div
                    key={course.id}
                    className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200 dark:border-blue-800 hover:shadow-md transition-all cursor-pointer"
                  >
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                      {course.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {course.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
                        {course.difficulty}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {course.duration}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Skills;
