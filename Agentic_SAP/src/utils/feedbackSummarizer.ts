export const summarizeFeedback = async (feedback: string): Promise<string> => {
  try {
    const response = await fetch(
      "http://localhost:5001/api/summarize-feedback",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ feedback }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("API Error:", response.status, errorData);

      if (response.status === 400) {
        return "Please provide feedback to summarize.";
      }

      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    return data.summary || "Unable to generate summary at this time.";
  } catch (error) {
    console.error("Error summarizing feedback:", error);
    return "Unable to generate summary at this time. Please try again later.";
  }
};
