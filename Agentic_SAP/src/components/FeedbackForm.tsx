import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";

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

        {/* Qualitative Feedback */}
        <div>
          <label
            htmlFor="qualitativeFeedback"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Qualitative Feedback
          </label>
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
