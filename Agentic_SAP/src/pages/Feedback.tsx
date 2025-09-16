import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useFeedback } from "../contexts/FeedbackContext";
import { mockUsers } from "../data/mockData";
import FeedbackForm from "../components/FeedbackForm";
import { summarizeFeedback } from "../utils/feedbackSummarizer";
import ReactMarkdown from "react-markdown";
import {
  Star,
  Calendar,
  User,
  TrendingUp,
  TrendingDown,
  Plus,
  X,
  Sparkles,
} from "lucide-react";

const DebugInfo: React.FC = () => {
  const { feedbacks, syncStorage } = useFeedback();

  return (
    <div className="bg-yellow-100 dark:bg-yellow-900 p-4 rounded-lg mb-4">
      <h3 className="font-bold">Debug Info:</h3>
      <p>Total feedbacks in context: {feedbacks.length}</p>
      <p>
        LocalStorage has data:{" "}
        {localStorage.getItem("teamFeedback") ? "Yes" : "No"}
      </p>
      <div className="flex space-x-2 mt-2">
        <button
          onClick={() => {
            console.log("All feedbacks:", feedbacks);
            console.log("LocalStorage:", localStorage.getItem("teamFeedback"));
          }}
          className="bg-blue-500 text-white px-2 py-1 rounded text-sm"
        >
          Log to Console
        </button>
        <button
          onClick={() => {
            syncStorage();
          }}
          className="bg-green-500 text-white px-2 py-1 rounded text-sm"
        >
          Sync Storage
        </button>
        <button
          onClick={() => {
            localStorage.removeItem("teamFeedback");
            window.location.reload();
          }}
          className="bg-red-500 text-white px-2 py-1 rounded text-sm"
        >
          Clear Storage
        </button>
      </div>
    </div>
  );
};

const Feedback: React.FC = () => {
  const { currentUser } = useAuth();
  const { feedbacks, addFeedback, getFeedbacksForUser, getFeedbacksByManager } =
    useFeedback();
  const [showForm, setShowForm] = useState(false);
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});
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

      alert("Feedback submitted successfully!");
    } catch (error) {
      console.error("Error submitting feedback:", error);
      alert("Failed to submit feedback. Please try again.");
    } finally {
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
      <div className="p-6 max-w-6xl mx-auto">
        {/* <DebugInfo /> */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Team Feedback
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Provide quarterly feedback to your team members
          </p>
        </div>

        {/* Team Members List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {teamMembers.map((member) => {
            const memberFeedbacks = getFeedbacksByManager(
              currentUser.id
            ).filter((fb) => fb.teamMemberId === member.id);

            return (
              <div
                key={member.id}
                className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md border dark:border-gray-700 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center mb-4">
                  <div className="bg-primary-500 p-3 rounded-full mr-4">
                    <User className="h-6 w-6 text-white" />
                  </div>
                  <div>
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
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        {memberFeedbacks.length > 0
                          ? "Edit Feedback"
                          : "Provide Feedback"}
                      </>
                    )}
                  </button>

                  {memberFeedbacks.length > 0 && (
                    <div className="text-center">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {memberFeedbacks.length} feedback session(s)
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Feedback Form */}
        {showForm && selectedMember && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
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

        {/* Previous Feedback */}
        {userFeedbacks.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Previous Feedback
            </h2>
            <div className="space-y-6">
              {userFeedbacks.map((feedback) => {
                const member = mockUsers.find(
                  (u) => u.id === feedback.teamMemberId
                );
                return (
                  <div
                    key={feedback.id}
                    className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md border dark:border-gray-700"
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
                      <div className="flex items-center">
                        <span
                          className={`text-lg font-bold ${getScoreColor(
                            getAverageScore(feedback)
                          )}`}
                        >
                          {getAverageScore(feedback).toFixed(1)}
                        </span>
                        <Star className="h-5 w-5 text-yellow-400 fill-current ml-1" />
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
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {item.label}
                          </p>
                          <p
                            className={`text-lg font-semibold ${getScoreColor(
                              item.value
                            )}`}
                          >
                            {item.value}
                          </p>
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
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Team Member View (Read-only)
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          My Feedback
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Your quarterly performance feedback
        </p>
      </div>

      {userFeedbacks.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-md">
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
            const manager = mockUsers.find((u) => u.id === feedback.managerId);
            return (
              <div
                key={feedback.id}
                className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md border dark:border-gray-700"
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
                  <div className="flex items-center">
                    <span
                      className={`text-lg font-bold ${getScoreColor(
                        getAverageScore(feedback)
                      )}`}
                    >
                      {getAverageScore(feedback).toFixed(1)}
                    </span>
                    <Star className="h-5 w-5 text-yellow-400 fill-current ml-1" />
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                  {[
                    { label: "Technical", value: feedback.technicalSkills },
                    { label: "Communication", value: feedback.communication },
                    { label: "Teamwork", value: feedback.teamwork },
                    {
                      label: "Problem Solving",
                      value: feedback.problemSolving,
                    },
                    { label: "Initiative", value: feedback.initiative },
                  ].map((item, index) => (
                    <div key={index} className="text-center">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {item.label}
                      </p>
                      <p
                        className={`text-lg font-semibold ${getScoreColor(
                          item.value
                        )}`}
                      >
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>

                {feedback.summary && <AISummary summary={feedback.summary} />}

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
                        Goals for Next Quarter
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
  );
};

export default Feedback;
