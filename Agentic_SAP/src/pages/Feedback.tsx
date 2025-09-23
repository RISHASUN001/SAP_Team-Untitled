import React, { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { useAuth } from "../contexts/AuthContext";
import { useFeedback } from "../contexts/FeedbackContext";
import { mockUsers } from "../data/mockData";
import { requiredSkillsByRole } from "../data/courseData";
import FeedbackForm from "../components/FeedbackForm";
import { summarizeFeedback } from "../utils/feedbackSummarizer";
import ReactMarkdown from "react-markdown";
import {
  Calendar,
  User,
  TrendingUp,
  TrendingDown,
  Plus,
  X,
  Sparkles,
  MessageSquare,
  Target,
  AlertCircle,
  CheckCircle,
  Loader,
  ChevronRight,
  Filter,
  Search,
  Settings,
  Save,
} from "lucide-react";

const Feedback: React.FC = () => {
  const { currentUser } = useAuth();
  const { feedbacks, addFeedback, getFeedbacksForUser, getFeedbacksByManager } =
    useFeedback();
  const [showForm, setShowForm] = useState(false);
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [showSkillsModal, setShowSkillsModal] = useState(false);
  const [skillsEditingMember, setSkillsEditingMember] = useState<string | null>(null);
  const [customRequiredSkills, setCustomRequiredSkills] = useState<{[userId: string]: {name: string, level: number}[]}>({});
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillLevel, setNewSkillLevel] = useState(1);
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    technicalSkills: 3,
    communication: 3,
    teamwork: 3,
    problemSolving: 3,
    initiative: 3,
    qualitativeFeedback: "",
    goals: "",
    areasForImprovement: "",
  });

  // Load custom required skills from localStorage on component mount
  useEffect(() => {
    const stored = localStorage.getItem('customRequiredSkills');
    if (stored) {
      setCustomRequiredSkills(JSON.parse(stored));
    }
  }, []);

  // Save custom required skills to localStorage
  const saveCustomRequiredSkills = (skills: {[userId: string]: {name: string, level: number}[]}) => {
    localStorage.setItem('customRequiredSkills', JSON.stringify(skills));
    setCustomRequiredSkills(skills);
  };

  // Get required skills for a user (custom or default)
  const getRequiredSkillsForUser = (userId: string) => {
    const user = mockUsers.find(u => u.id === userId);
    if (!user) return [];
    
    // Return custom skills if available, otherwise default from role
    return customRequiredSkills[userId] || requiredSkillsByRole[user.role] || [];
  };

  // Handle editing required skills
  const handleEditRequiredSkills = (userId: string, newSkills: {name: string, level: number}[]) => {
    const updatedSkills = {
      ...customRequiredSkills,
      [userId]: newSkills
    };
    saveCustomRequiredSkills(updatedSkills);
  };

  // Modal handler functions
  const handleSaveCustomSkills = () => {
    if (selectedMember) {
      // Save to localStorage
      const currentCustomSkills = JSON.parse(localStorage.getItem('customRequiredSkills') || '{}');
      currentCustomSkills[selectedMember] = customRequiredSkills[selectedMember] || [];
      localStorage.setItem('customRequiredSkills', JSON.stringify(currentCustomSkills));
      
      // Update state
      setCustomRequiredSkills(currentCustomSkills);
      setShowSkillsModal(false);
      setNewSkillName('');
      setNewSkillLevel(1);
    }
  };

  const handleSkillLevelChange = (skillName: string, newLevel: number) => {
    if (selectedMember) {
      setCustomRequiredSkills(prev => {
        // Get current skills for the member - either custom or default
        const currentSkills = prev[selectedMember] && prev[selectedMember].length > 0 
          ? prev[selectedMember] 
          : Object.entries(getRequiredSkillsForMember(mockUsers.find(u => u.id === selectedMember)?.name || ""))
              .map(([name, level]) => ({ name, level: level as number }));
        
        // Update the specific skill level
        const updatedSkills = currentSkills.map((skill: any) => 
          skill.name === skillName ? { ...skill, level: newLevel } : skill
        );
        
        // If skill doesn't exist in current skills, add it
        if (!currentSkills.find((skill: any) => skill.name === skillName)) {
          updatedSkills.push({ name: skillName, level: newLevel });
        }
        
        return {
          ...prev,
          [selectedMember]: updatedSkills
        };
      });
    }
  };

  const handleRemoveSkill = (skillName: string) => {
    if (selectedMember) {
      setCustomRequiredSkills(prev => {
        // Get current skills for the member - either custom or default
        const currentSkills = prev[selectedMember] && prev[selectedMember].length > 0 
          ? prev[selectedMember] 
          : Object.entries(getRequiredSkillsForMember(mockUsers.find(u => u.id === selectedMember)?.name || ""))
              .map(([name, level]) => ({ name, level: level as number }));
        
        // Remove the specific skill
        const updatedSkills = currentSkills.filter((skill: any) => skill.name !== skillName);
        
        return {
          ...prev,
          [selectedMember]: updatedSkills
        };
      });
    }
  };

  const handleAddSkill = () => {
    if (selectedMember && newSkillName.trim()) {
      setCustomRequiredSkills(prev => ({
        ...prev,
        [selectedMember]: [
          ...(prev[selectedMember] || []),
          { name: newSkillName.trim(), level: newSkillLevel }
        ]
      }));
      setNewSkillName('');
      setNewSkillLevel(1);
    }
  };

  const getRequiredSkillsForMember = (memberName: string) => {
    // Convert the data structure to match what the modal expects
    const userProfile = mockUsers.find((user: any) => user.name === memberName);
    if (!userProfile) return {};
    
    const requiredSkills = requiredSkillsByRole[userProfile.role] || [];
    const skillsObj: Record<string, number> = {};
    requiredSkills.forEach((skill: any) => {
      skillsObj[skill.name] = skill.level;
    });
    return skillsObj;
  };

  const teamMembers = mockUsers.filter(
    (user) =>
      user.id !== currentUser?.id &&
      (currentUser?.role.toLowerCase().includes("lead") ||
        currentUser?.role.toLowerCase().includes("manager"))
  );

  // Get feedbacks based on user role
  const userFeedbacks =
    currentUser?.role.toLowerCase().includes("lead") ||
    currentUser?.role.toLowerCase().includes("manager")
      ? getFeedbacksByManager(currentUser.id)
      : getFeedbacksForUser(currentUser?.id || "");

  // Filter feedbacks based on selected filter and search term
  const filteredFeedbacks = userFeedbacks.filter((feedback) => {
    const member = mockUsers.find((u) => u.id === feedback.teamMemberId);
    const matchesFilter =
      filter === "all" ||
      (filter === "recent" &&
        new Date(feedback.date).getTime() >
          Date.now() - 90 * 24 * 60 * 60 * 1000) ||
      (filter === "high" && getAverageScore(feedback) >= 4) ||
      (filter === "low" && getAverageScore(feedback) < 3);

    const matchesSearch =
      member?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      feedback.qualitativeFeedback
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const handleEditFeedback = (memberId: string) => {
    setSelectedMember(memberId);

    // Check if there's existing feedback for this member from current manager
    const existingFeedback = getFeedbacksByManager(currentUser?.id || "").find(
      (fb) => fb.teamMemberId === memberId
    );

    if (existingFeedback) {
      // Pre-populate the form with existing data
      setFormData({
        technicalSkills: existingFeedback.technicalSkills,
        communication: existingFeedback.communication,
        teamwork: existingFeedback.teamwork,
        problemSolving: existingFeedback.problemSolving,
        initiative: existingFeedback.initiative,
        qualitativeFeedback: existingFeedback.qualitativeFeedback,
        goals: existingFeedback.goals || "",
        areasForImprovement: existingFeedback.areasForImprovement || "",
      });
    } else {
      // Reset form for new feedback
      setFormData({
        technicalSkills: 3,
        communication: 3,
        teamwork: 3,
        problemSolving: 3,
        initiative: 3,
        qualitativeFeedback: "",
        goals: "",
        areasForImprovement: "",
      });
    }

    setShowForm(true);
  };

  const handleSubmitFeedback = async (feedbackData: any) => {
    setIsSubmitting(true);
    setSubmitting(true);
    setLoading((prev) => ({ ...prev, [feedbackData.teamMemberId]: true }));

    try {
      const summary = await summarizeFeedback(
        `Quantitative Scores: Technical Skills: ${feedbackData.technicalSkills}/5, Communication: ${feedbackData.communication}/5, Teamwork: ${feedbackData.teamwork}/5, Problem Solving: ${feedbackData.problemSolving}/5, Initiative: ${feedbackData.initiative}/5. 
      Qualitative Feedback: ${feedbackData.qualitativeFeedback}
      Goals: ${feedbackData.goals}
      Areas for Improvement: ${feedbackData.areasForImprovement}`
      );

      // Create a consistent ID based on teamMemberId and current quarter/year
      const now = new Date();
      const quarter = Math.floor(now.getMonth() / 3) + 1;
      const year = now.getFullYear();
      const feedbackId = `fb-${feedbackData.teamMemberId}-q${quarter}-${year}`;

      const feedbackWithSummary = {
        ...feedbackData,
        id: feedbackId,
        summary,
        managerId: currentUser?.id || "",
        managerName: currentUser?.name || "",
        date: now.toISOString(),
      };

      addFeedback(feedbackWithSummary);
      setShowForm(false);
      setSelectedMember(null);
    } catch (error) {
      console.error("Error submitting feedback:", error);
      alert("Failed to submit feedback. Please try again.");
    } finally {
      setIsSubmitting(false);
      setSubmitting(false);
      setLoading((prev) => ({ ...prev, [feedbackData.teamMemberId]: false }));
    }
  };

  const getAverageScore = (feedback: any) => {
    const scores = [
      feedback.technicalSkills,
      feedback.communication,
      feedback.teamwork,
      feedback.problemSolving,
      feedback.initiative,
    ];
    return scores.reduce((a, b) => a + b, 0) / scores.length;
  };

  const getScoreColor = (score: number) => {
    if (score >= 4) return "text-green-600 dark:text-green-400";
    if (score >= 3) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getScoreIcon = (score: number) => {
    if (score >= 4) return <TrendingUp className="h-4 w-4" />;
    if (score >= 3) return <span>→</span>;
    return <TrendingDown className="h-4 w-4" />;
  };

  // Component to render AI Summary with proper formatting
  const AISummary = ({ summary }: { summary: string }) => (
    <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-100 dark:border-blue-800/30">
      <div className="flex items-center mb-3">
        <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" />
        <h4 className="font-semibold text-blue-800 dark:text-blue-200">
          AI Summary
        </h4>
      </div>
      <div className="prose prose-sm max-w-none text-blue-800 dark:text-blue-200">
        <ReactMarkdown>{summary}</ReactMarkdown>
      </div>
    </div>
  );

  if (
    currentUser?.role.toLowerCase().includes("lead") ||
    currentUser?.role.toLowerCase().includes("manager")
  ) {
    // Manager View
    return (
      <Layout>
        {(isSubmitting || submitting) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 flex flex-col items-center">
              <Loader className="h-8 w-8 animate-spin text-primary-600 mb-4" />
              <p className="text-gray-800 dark:text-gray-200 font-medium">
                Submitting feedback...
              </p>
            </div>
          </div>
        )}

        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-6">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Header Section */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm">
              <div className="flex items-center space-x-4 mb-6">
                <div className="p-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg">
                  <MessageSquare className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Team Feedback
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Provide quarterly feedback to your team members
                  </p>
                </div>
              </div>

              {/* Stats Overview */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-6 border border-green-200 dark:border-green-800">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                    <div>
                      <h3 className="text-2xl font-bold text-green-700 dark:text-green-300">
                        {teamMembers.length}
                      </h3>
                      <p className="text-green-600 dark:text-green-400 text-sm font-medium">
                        Team Members
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center space-x-3">
                    <Target className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                    <div>
                      <h3 className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                        {userFeedbacks.length}
                      </h3>
                      <p className="text-blue-600 dark:text-blue-400 text-sm font-medium">
                        Feedback Sessions
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-6 border border-purple-200 dark:border-purple-800">
                  <div className="flex items-center space-x-3">
                    <TrendingUp className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                    <div>
                      <h3 className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                        {
                          userFeedbacks.filter((fb) => getAverageScore(fb) >= 4)
                            .length
                        }
                      </h3>
                      <p className="text-purple-600 dark:text-purple-400 text-sm font-medium">
                        High Performers
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-lg p-6 border border-orange-200 dark:border-orange-800">
                  <div className="flex items-center space-x-3">
                    <AlertCircle className="h-8 w-8 text-orange-600 dark:text-orange-400" />
                    <div>
                      <h3 className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                        {
                          userFeedbacks.filter((fb) => getAverageScore(fb) < 3)
                            .length
                        }
                      </h3>
                      <p className="text-orange-600 dark:text-orange-400 text-sm font-medium">
                        Needs Improvement
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Team Members List */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Team Members
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {teamMembers.map((member) => {
                  const memberFeedbacks = getFeedbacksByManager(
                    currentUser.id
                  ).filter((fb) => fb.teamMemberId === member.id);
                  const latestFeedback =
                    memberFeedbacks[memberFeedbacks.length - 1];

                  return (
                    <div
                      key={member.id}
                      className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-700 dark:to-gray-800 rounded-lg p-6 shadow-md border dark:border-gray-700 hover:shadow-lg transition-all duration-300"
                    >
                      <div className="flex items-center mb-4">
                        <div className="bg-primary-500 p-3 rounded-full mr-4">
                          <User className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            {member.name}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {member.role}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <button
                          onClick={() => handleEditFeedback(member.id)}
                          disabled={loading[member.id]}
                          className="w-full flex items-center justify-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md disabled:opacity-50 transition-colors"
                        >
                          {loading[member.id] ? (
                            <Loader className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <>
                              <Plus className="h-4 w-4 mr-2" />
                              {memberFeedbacks.length > 0
                                ? "Update Feedback"
                                : "Provide Feedback"}
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => {
                            setSelectedMember(member.id);
                            setSkillsEditingMember(member.id);
                            setShowSkillsModal(true);
                          }}
                          className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                        >
                          <Settings className="h-4 w-4 mr-2" />
                          Edit Required Skills
                        </button>

                        {memberFeedbacks.length > 0 && (
                          <div className="text-center">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Last feedback:{" "}
                              {new Date(
                                latestFeedback.date
                              ).toLocaleDateString()}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Previous Feedback Section */}
            {userFeedbacks.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 md:mb-0">
                    Feedback History
                  </h2>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search feedback..."
                        className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>

                    <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                      <div className="pl-3 pr-2 py-2 bg-gray-100 dark:bg-gray-700">
                        <Filter className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                      </div>
                      <select
                        className="pr-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                      >
                        <option value="all">All Feedback</option>
                        <option value="recent">Recent (Last 90 days)</option>
                        <option value="high">High Scores (4+ stars)</option>
                        <option value="low">
                          Needs Improvement (&lt;3 stars)
                        </option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  {filteredFeedbacks.length === 0 ? (
                    <div className="text-center py-8">
                      <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        No feedback matches your search
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        Try adjusting your filters or search term
                      </p>
                    </div>
                  ) : (
                    filteredFeedbacks.map((feedback) => {
                      const member = mockUsers.find(
                        (u) => u.id === feedback.teamMemberId
                      );

                      return (
                        <div
                          key={feedback.id}
                          className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-700 dark:to-gray-800 rounded-lg p-6 shadow-md border dark:border-gray-700"
                        >
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="font-medium text-gray-900 dark:text-white">
                                {member?.name}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {new Date(feedback.date).toLocaleDateString()}
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                            {[
                              {
                                label: "Technical",
                                value: feedback.technicalSkills,
                              },
                              {
                                label: "Communication",
                                value: feedback.communication,
                              },
                              { label: "Teamwork", value: feedback.teamwork },
                              {
                                label: "Problem Solving",
                                value: feedback.problemSolving,
                              },
                              {
                                label: "Initiative",
                                value: feedback.initiative,
                              },
                            ].map((item, index) => (
                              <div key={index} className="text-center">
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                                  {item.label}
                                </p>
                                <div className="flex items-center justify-center">
                                  <span
                                    className={`text-lg font-semibold ${getScoreColor(
                                      item.value
                                    )}`}
                                  >
                                    {item.value}
                                  </span>
                                  {getScoreIcon(item.value)}
                                </div>
                              </div>
                            ))}
                          </div>

                          {feedback.summary && (
                            <AISummary summary={feedback.summary} />
                          )}

                          <div className="space-y-3">
                            <div>
                              <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                                Qualitative Feedback
                              </h4>
                              <p className="text-gray-700 dark:text-gray-300 text-sm">
                                {feedback.qualitativeFeedback}
                              </p>
                            </div>

                            {feedback.goals && (
                              <div>
                                <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                                  Goals
                                </h4>
                                <p className="text-gray-700 dark:text-gray-300 text-sm">
                                  {feedback.goals}
                                </p>
                              </div>
                            )}

                            {feedback.areasForImprovement && (
                              <div>
                                <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                                  Areas for Improvement
                                </h4>
                                <p className="text-gray-700 dark:text-gray-300 text-sm">
                                  {feedback.areasForImprovement}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
            {/* Feedback Form Modal */}
            {showForm && selectedMember && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-center p-6 border-b dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      Feedback for{" "}
                      {teamMembers.find((m) => m.id === selectedMember)?.name}
                    </h2>
                    <button
                      onClick={() => {
                        setShowForm(false);
                        setSelectedMember(null);
                      }}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>
                  <FeedbackForm
                    teamMemberId={selectedMember}
                    initialData={formData}
                    onSubmit={handleSubmitFeedback}
                    onCancel={() => {
                      setShowForm(false);
                      setSelectedMember(null);
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Required Skills Modal */}
        {showSkillsModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Edit Required Skills - {mockUsers.find(u => u.id === selectedMember)?.name || selectedMember}
                </h2>
                <button
                  onClick={() => setShowSkillsModal(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                {/* Current Required Skills */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Required Skills
                  </h3>
                  
                  {selectedMember && (
                    <div className="space-y-4">
                      {Object.entries(
                        customRequiredSkills[selectedMember] && customRequiredSkills[selectedMember].length > 0
                          ? customRequiredSkills[selectedMember].reduce((acc: Record<string, number>, skill: any) => {
                              acc[skill.name] = skill.level;
                              return acc;
                            }, {})
                          : getRequiredSkillsForMember(mockUsers.find(u => u.id === selectedMember)?.name || "")
                      ).map(([skill, level]) => (
                        <div key={skill} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <div className="flex-1">
                            <span className="font-medium text-gray-900 dark:text-white">{skill}</span>
                          </div>
                          <div className="flex items-center space-x-3">
                            <span className="text-sm text-gray-600 dark:text-gray-300 w-12">
                              Level {level}
                            </span>
                            <input
                              type="range"
                              min="1"
                              max="3"
                              value={level}
                              onChange={(e) => handleSkillLevelChange(skill, parseInt(e.target.value))}
                              className="w-24 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-600"
                            />
                            <button
                              onClick={() => handleRemoveSkill(skill)}
                              className="text-red-500 hover:text-red-700 ml-2"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Add New Skill */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Add New Skill
                  </h3>
                  <div className="flex items-center space-x-3">
                    <input
                      type="text"
                      placeholder="Enter skill name"
                      value={newSkillName}
                      onChange={(e) => setNewSkillName(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                    <select
                      value={newSkillLevel}
                      onChange={(e) => setNewSkillLevel(parseInt(e.target.value))}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                      <option value={1}>Level 1</option>
                      <option value={2}>Level 2</option>
                      <option value={3}>Level 3</option>
                    </select>
                    <button
                      onClick={handleAddSkill}
                      disabled={!newSkillName.trim()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 pt-6 border-t">
                  <button
                    onClick={() => setShowSkillsModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveCustomSkills}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center space-x-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Changes</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </Layout>
    );
  }

  // Team Member View (Read-only)
  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm mb-6">
            <div className="flex items-center space-x-4 mb-6">
              <div className="p-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg">
                <MessageSquare className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  My Feedback
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Your quarterly performance feedback
                </p>
              </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-6 border border-green-200 dark:border-green-800">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                  <div>
                    <h3 className="text-2xl font-bold text-green-700 dark:text-green-300">
                      {userFeedbacks.length}
                    </h3>
                    <p className="text-green-600 dark:text-green-400 text-sm font-medium">
                      Total Feedback Sessions
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
                <div className="flex items-center space-x-3">
                  <TrendingUp className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                  <div>
                    <h3 className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                      {userFeedbacks.length}
                    </h3>
                    <p className="text-blue-600 dark:text-blue-400 text-sm font-medium">
                      Total Feedback Sessions
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-6 border border-purple-200 dark:border-purple-800">
                <div className="flex items-center space-x-3">
                  <Calendar className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                  <div>
                    <h3 className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                      {userFeedbacks.length > 0
                        ? new Date(
                            userFeedbacks[userFeedbacks.length - 1].date
                          ).toLocaleDateString()
                        : "N/A"}
                    </h3>
                    <p className="text-purple-600 dark:text-purple-400 text-sm font-medium">
                      Last Feedback Date
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {userFeedbacks.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-md">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No feedback yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Your manager hasn't provided any quarterly feedback yet.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md transition-colors"
              >
                Refresh
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {userFeedbacks.map((feedback) => {
                const manager = mockUsers.find(
                  (u) => u.id === feedback.managerId
                );

                return (
                  <div
                    key={feedback.id}
                    className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border dark:border-gray-700"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          Feedback from {manager?.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {new Date(feedback.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                      {[
                        { label: "Technical", value: feedback.technicalSkills },
                        {
                          label: "Communication",
                          value: feedback.communication,
                        },
                        { label: "Teamwork", value: feedback.teamwork },
                        {
                          label: "Problem Solving",
                          value: feedback.problemSolving,
                        },
                        { label: "Initiative", value: feedback.initiative },
                      ].map((item, index) => (
                        <div key={index} className="text-center">
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                            {item.label}
                          </p>
                          <div className="flex items-center justify-center">
                            <span
                              className={`text-lg font-semibold ${getScoreColor(
                                item.value
                              )}`}
                            >
                              {item.value}
                            </span>
                            {getScoreIcon(item.value)}
                          </div>
                        </div>
                      ))}
                    </div>

                    {feedback.summary && (
                      <AISummary summary={feedback.summary} />
                    )}

                    <div className="space-y-3">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                          Feedback
                        </h4>
                        <p className="text-gray-700 dark:text-gray-300 text-sm">
                          {feedback.qualitativeFeedback}
                        </p>
                      </div>

                      {feedback.goals && (
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                            Course Recommendations
                          </h4>
                          <p className="text-gray-700 dark:text-gray-300 text-sm">
                            {feedback.goals}
                          </p>
                        </div>
                      )}

                      {feedback.areasForImprovement && (
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                            Areas for Improvement
                          </h4>
                          <p className="text-gray-700 dark:text-gray-300 text-sm">
                            {feedback.areasForImprovement}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Feedback;
