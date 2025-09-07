export const summarizeFeedback = async (feedback: string): Promise<string> => {
  try {
    const API_BASE =
      import.meta.env.OPENROUTER_API_BASE || "https://openrouter.ai/api/v1";
    const API_KEY = import.meta.env.OPENROUTER_API_KEY;
    // import.meta.env.OPENROUTER_API_KEY ||
    // "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";
    const MODEL =
      import.meta.env.OPENROUTER_MODEL || "meta-llama/llama-3-8b-instruct";

    if (!API_KEY) {
      console.error("OpenRouter API key is not configured");
      return "Feedback summary service is not configured properly.";
    }

    const response = await fetch(`${API_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": window.location.origin, // Required by OpenRouter
        "X-Title": "AI Mentor Platform", // Required by OpenRouter
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: "system",
            content:
              "You are a helpful assistant that summarizes performance feedback in a constructive, professional manner. Focus on the key points and provide actionable insights. Keep it concise and professional (around 150-200 words).",
          },
          {
            role: "user",
            content: `Summarize this performance feedback in a constructive way:\n\n${feedback}`,
          },
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("API Error:", response.status, errorData);
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();

    // Handle different possible response structures
    const summary =
      data.choices?.[0]?.message?.content ||
      data.result?.choices?.[0]?.message?.content ||
      data.message?.content ||
      "Unable to generate summary at this time.";

    return summary;
  } catch (error) {
    console.error("Error summarizing feedback:", error);
    return "Unable to generate summary at this time. Please check your API configuration.";
  }
};
