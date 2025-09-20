export const getToneSuggestions = async (feedback: string): Promise<string> => {
  try {
    const response = await fetch(
      "http://localhost:5001/api/feedback-tone-suggest",
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
      console.error("Tone API Error:", response.status, errorData);

      if (response.status === 400) {
        return "Please provide feedback to analyze.";
      }

      throw new Error(`Tone API request failed with status ${response.status}`);
    }

    const data = await response.json();
    return (
      data.suggestions || "Unable to generate tone suggestions at this time."
    );
  } catch (error) {
    console.error("Error getting tone suggestions:", error);
    return "Unable to generate tone suggestions at this time. Please try again later.";
  }
};
