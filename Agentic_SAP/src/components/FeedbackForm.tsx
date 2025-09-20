import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { getToneSuggestions } from "../utils/feedbackTone";
import { Sparkles, Loader, MessageSquare } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface FeedbackFormProps {
  teamMemberId: string;
  initialData: any;
  onSubmit: (feedback: any) => void;
  onCancel: () => void;
}

const FeedbackForm: React.FC<FeedbackFormProps> = ({
  teamMemberId,
  initialData,
  onSubmit,
  onCancel,
}) => {
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState(initialData);
  const [toneSuggestions, setToneSuggestions] = useState("");
  const [isAnalyzingTone, setIsAnalyzingTone] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Create a consistent ID based on teamMemberId and current quarter/year
    const now = new Date();
    const quarter = Math.floor(now.getMonth() / 3) + 1;
    const year = now.getFullYear();
    const feedbackId = `fb-${teamMemberId}-q${quarter}-${year}`;

    const feedback = {
      ...formData,
      id: feedbackId,
      teamMemberId,
      managerId: currentUser?.id || "",
      managerName: currentUser?.name || "",
      date: now.toISOString(),
      summary: "",
    };

    console.log("Submitting feedback from form:", feedback);
    onSubmit(feedback);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({
      ...prev,
      [name]:
        name.includes("Skills") ||
        name.includes("communication") ||
        name.includes("teamwork") ||
        name.includes("problemSolving") ||
        name.includes("initiative")
          ? parseInt(value)
          : value,
    }));
  };

  const extractAllAlternatives = (text: string): string[] => {
    const alternatives: string[] = [];

    // Method 1: Look for numbered alternatives with quotes
    const numberedRegex = /\d+\.\s*"([^"]+)"/g;
    let match;
    while ((match = numberedRegex.exec(text)) !== null) {
      alternatives.push(match[1]);
    }

    // Method 2: Look for bullet points with quotes
    const bulletRegex = /[-•]\s*"([^"]+)"/g;
    while ((match = bulletRegex.exec(text)) !== null) {
      alternatives.push(match[1]);
    }

    // Method 3: Look for example phrases in the alternatives section
    if (alternatives.length === 0) {
      const alternativesSection = text.split("ALTERNATIVE PHRASINGS:")[1];
      if (alternativesSection) {
        const lines = alternativesSection.split("\n");
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed && !trimmed.match(/^\d+\./) && !trimmed.match(/^[-•]/)) {
            // Remove quotes if present and take substantial sentences
            const cleanLine = trimmed.replace(/^["']|["']$/g, "").trim();
            if (cleanLine.length > 20 && !cleanLine.includes(":")) {
              alternatives.push(cleanLine);
            }
          }
        }
      }
    }

    return alternatives.slice(0, 3); // Return max 3 alternatives
  };

  const analyzeTone = async () => {
    if (!formData.qualitativeFeedback.trim()) {
      alert("Please enter some feedback text first.");
      return;
    }

    setIsAnalyzingTone(true);
    try {
      const suggestions = await getToneSuggestions(
        formData.qualitativeFeedback
      );
      setToneSuggestions(suggestions);
      setShowSuggestions(true);
    } catch (error) {
      console.error("Error analyzing tone:", error);
      alert("Failed to analyze tone. Please try again.");
    } finally {
      setIsAnalyzingTone(false);
    }
  };

  const applySuggestion = (suggestion: string) => {
    setFormData((prev: any) => ({
      ...prev,
      qualitativeFeedback: suggestion,
    }));
    setShowSuggestions(false);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
        Provide Quarterly Feedback
      </h3>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Quantitative Feedback */}
        <div>
          <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">
            Quantitative Assessment (1-5)
          </h4>

          <div className="space-y-4">
            {[
              {
                id: "technicalSkills",
                label: "Technical Skills",
                description: "Proficiency in required technologies and tools",
              },
              {
                id: "communication",
                label: "Communication",
                description: "Effectiveness in conveying ideas and information",
              },
              {
                id: "teamwork",
                label: "Teamwork",
                description: "Collaboration and support for team members",
              },
              {
                id: "problemSolving",
                label: "Problem Solving",
                description: "Ability to analyze and resolve challenges",
              },
              {
                id: "initiative",
                label: "Initiative",
                description: "Proactive approach to tasks and responsibilities",
              },
            ].map((item) => (
              <div key={item.id} className="flex items-center justify-between">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {item.label}
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {item.description}
                  </p>
                </div>
                <div className="ml-4">
                  <input
                    type="range"
                    id={item.id}
                    name={item.id}
                    min="1"
                    max="5"
                    value={formData[item.id as keyof typeof formData] as number}
                    onChange={handleChange}
                    className="w-24"
                  />
                  <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    {formData[item.id as keyof typeof formData]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Qualitative Feedback with Tone Analysis */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label
              htmlFor="qualitativeFeedback"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Qualitative Feedback
            </label>
            <button
              type="button"
              onClick={analyzeTone}
              disabled={isAnalyzingTone || !formData.qualitativeFeedback.trim()}
              className="flex items-center px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 rounded-md hover:bg-blue-200 dark:hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAnalyzingTone ? (
                <Loader className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <Sparkles className="h-4 w-4 mr-1" />
              )}
              Analyze Tone
            </button>
          </div>

          <textarea
            id="qualitativeFeedback"
            name="qualitativeFeedback"
            rows={4}
            value={formData.qualitativeFeedback}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder="Provide detailed feedback on performance, achievements, and behaviors..."
            required
          />
        </div>

        {/* Tone Suggestions */}
        {showSuggestions && toneSuggestions && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-center mb-3">
              <MessageSquare className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" />
              <h4 className="font-semibold text-blue-800 dark:text-blue-200">
                Tone Suggestions
              </h4>
              <button
                onClick={() => setShowSuggestions(false)}
                className="ml-auto text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
              >
                ×
              </button>
            </div>

            <div className="prose prose-sm max-w-none text-blue-800 dark:text-blue-200 mb-4">
              <ReactMarkdown
                components={{
                  strong: ({ node, ...props }) => (
                    <strong
                      className="font-semibold text-blue-900 dark:text-blue-100"
                      {...props}
                    />
                  ),
                  p: ({ node, ...props }) => <p className="mb-2" {...props} />,
                }}
              >
                {toneSuggestions}
              </ReactMarkdown>
            </div>

            {/* Extract and show ready-to-use alternatives */}
            {extractAllAlternatives(toneSuggestions).length > 0 && (
              <div className="mb-4">
                <h5 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                  Ready-to-use alternatives:
                </h5>
                <div className="space-y-2">
                  {extractAllAlternatives(toneSuggestions).map(
                    (alternative, index) => (
                      <div key={index} className="flex items-start">
                        <button
                          type="button"
                          onClick={() => {
                            setFormData((prev: any) => ({
                              ...prev,
                              qualitativeFeedback: alternative,
                            }));
                            setShowSuggestions(false);
                          }}
                          className="text-left text-sm bg-white dark:bg-gray-700 border border-blue-200 dark:border-blue-700 rounded-md p-2 hover:bg-blue-50 dark:hover:bg-blue-900/30 flex-1"
                        >
                          <span className="text-blue-600 dark:text-blue-400 font-medium mr-2">
                            {index + 1}.
                          </span>
                          {alternative}
                        </button>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => setShowSuggestions(false)}
                className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Goals */}
        <div>
          <label
            htmlFor="goals"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Goals for Next Quarter
          </label>
          <textarea
            id="goals"
            name="goals"
            rows={2}
            value={formData.goals}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder="Set clear, achievable goals for the next quarter..."
          />
        </div>

        {/* Areas for Improvement */}
        <div>
          <label
            htmlFor="areasForImprovement"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Areas for Improvement
          </label>
          <textarea
            id="areasForImprovement"
            name="areasForImprovement"
            rows={2}
            value={formData.areasForImprovement}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder="Identify specific areas where improvement is needed..."
          />
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md"
          >
            Submit Feedback
          </button>
        </div>
      </form>
    </div>
  );
};

export default FeedbackForm;
