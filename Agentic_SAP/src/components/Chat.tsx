import React, { useState, useRef, useEffect } from 'react';
import Layout from './Layout';
import { useAuth } from '../contexts/AuthContext';
import {
  Send,
  Brain,
  User,
  Settings,
  Lightbulb,
  MessageSquare,
  Zap,
  RotateCcw
} from 'lucide-react';

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  suggestions?: string[];
  mode?: 'mentor' | 'practice';
}

const Chat: React.FC = () => {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mentorMode, setMentorMode] = useState(false);
  const [practiceMode, setPracticeMode] = useState(false);
  const [practiceScenario, setPracticeScenario] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize with welcome message
    if (messages.length === 0) {
      setMessages([{
        id: '1',
        type: 'ai',
        content: `Hello ${currentUser?.name}! I'm your AI mentoring assistant. I can help you in several ways:

• **Mentor Mode**: Get suggestions on how to respond to your mentees
• **Practice Mode**: Practice your mentoring skills with simulated scenarios
• **General Chat**: Ask questions about mentoring, career development, or technical topics

How would you like to get started today?`,
        timestamp: new Date()
      }]);
    }
  }, [currentUser, messages.length]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const generateAIResponse = async (userMessage: string, mode: string): Promise<Message> => {
    if (mode === 'mentor') {
      // Call backend API for mentor mode
      try {
        const res = await fetch('/api/chat/mentor-suggest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            message: userMessage,
            user_id: currentUser?.id || 'default_user'
          })
        });
        const data = await res.json();
        return {
          id: Date.now().toString(),
          type: 'ai',
          content: data.suggestions || 'No suggestion received.',
          timestamp: new Date(),
          mode: 'mentor'
        };
      } catch (error) {
        return {
          id: Date.now().toString(),
          type: 'ai',
          content: 'Error: Unable to get mentor suggestion from AI server.',
          timestamp: new Date(),
          mode: 'mentor'
        };
      }
    }

    
    // ...existing code for practice and general modes...
    let response = '';
    let suggestions: string[] = [];
    if (mode === 'practice') {
      const scenarios = [
        "I'm struggling with imposter syndrome. Everyone seems to know so much more than me.",
        "I've been working on this ML project for weeks but keep getting stuck on the same problem.",
        "How do I know if I'm ready to apply for a senior role?",
        "I want to transition from data analysis to data science, but I don't know where to start."
      ];
      response = scenarios[Math.floor(Math.random() * scenarios.length)];
    } else {
      const responses = [
        `That's a great question! As a mentor, it's important to remember that your role is to guide and support, not to solve every problem for your mentee. Here are some key principles:
• **Active Listening**: Really hear what they're saying beyond just the words
• **Ask Good Questions**: Help them discover solutions rather than giving direct answers
• **Share Experiences**: Your journey can provide valuable insights
• **Set Clear Expectations**: Both for yourself and your mentee`,
        `Effective mentoring is about creating a safe space for growth. Consider these approaches:
• **Regular Check-ins**: Consistency builds trust and momentum
• **Goal Setting**: Help them define clear, achievable objectives
• **Feedback Loops**: Provide both positive reinforcement and constructive criticism
• **Resource Sharing**: Point them toward valuable learning materials and opportunities`,
        `Remember that mentoring is a two-way relationship. You'll likely learn as much from your mentees as they learn from you. Focus on:
• **Empathy**: Everyone's learning journey is different
• **Patience**: Growth takes time and happens at different paces
• **Adaptability**: Adjust your style to match their needs
• **Encouragement**: Celebrate small wins along the way`
      ];
      response = responses[Math.floor(Math.random() * responses.length)];
    }
    return {
      id: Date.now().toString(),
      type: 'ai',
      content: response,
      timestamp: new Date(),
      suggestions: suggestions.length > 0 ? suggestions : undefined,
      mode: mode as 'mentor' | 'practice'
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const currentMode = mentorMode ? 'mentor' : practiceMode ? 'practice' : 'general';
      const aiResponse = await generateAIResponse(input.trim(), currentMode);
      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      console.error('Error generating AI response:', error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        type: 'ai',
        content: 'I apologize, but I encountered an error. Please try again.',
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
  };

  // UPDATED FUNCTION: Now clears both frontend AND backend conversation history
  // This ensures a complete reset when user clicks the refresh button
  const resetConversation = async () => {
    // Step 1: Clear frontend messages (UI reset)
    setMessages([{
      id: '1',
      type: 'ai',
      content: `Conversation reset! I'm ready to help you with mentoring guidance. What would you like to discuss?`,
      timestamp: new Date()
    }]);
    setMentorMode(false);
    setPracticeMode(false);
    
    // Step 2: NEW - Clear backend conversation history stored in mentor_mode.py
    // This ensures the AI doesn't remember previous conversation context
    try {
      await fetch('/api/chat/mentor-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          user_id: currentUser?.id || 'default_user' // Send user ID to clear specific conversation
        })
      });
      console.log('Backend conversation history cleared successfully');
    } catch (error) {
      console.error('Failed to reset backend conversation:', error);
      // Note: Frontend still resets even if backend reset fails
    }
  };

  return (
    <Layout>
      <div className="flex h-[calc(100vh-4rem)] bg-gray-50 dark:bg-gray-900">
        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-primary-500 p-2 rounded-full">
                  <Brain className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                    AI Mentor Assistant
                  </h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {mentorMode ? 'Mentor Mode Active' : practiceMode ? 'Practice Mode Active' : 'General Chat'}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    setMentorMode(!mentorMode);
                    setPracticeMode(false);
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    mentorMode
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <Lightbulb className="h-4 w-4 mr-2 inline" />
                  Mentor Mode
                </button>
                
                <button
                  onClick={() => {
                    setPracticeMode(!practiceMode);
                    setMentorMode(false);
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    practiceMode
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <Zap className="h-4 w-4 mr-2 inline" />
                  Practice Mode
                </button>

                <button
                  onClick={resetConversation}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                  title="Reset Conversation"
                >
                  <RotateCcw className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex max-w-3xl ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`flex-shrink-0 ${message.type === 'user' ? 'ml-3' : 'mr-3'}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      message.type === 'user'
                        ? 'bg-primary-500'
                        : message.mode === 'practice'
                        ? 'bg-green-500'
                        : 'bg-purple-500'
                    }`}>
                      {message.type === 'user' ? (
                        <User className="h-5 w-5 text-white" />
                      ) : (
                        <Brain className="h-5 w-5 text-white" />
                      )}
                    </div>
                  </div>
                  <div
                    className={`px-4 py-3 rounded-lg ${
                      message.type === 'user'
                        ? 'bg-primary-500 text-white'
                        : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border dark:border-gray-700'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{message.content}</div>
                    {message.suggestions && (
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
                          Quick Actions:
                        </p>
                        <div className="space-y-2">
                          {message.suggestions.map((suggestion, index) => (
                            <button
                              key={index}
                              onClick={() => handleSuggestionClick(suggestion)}
                              className="block w-full text-left text-sm p-2 rounded bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="text-xs mt-2 opacity-70">
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex mr-3">
                  <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center">
                    <Brain className="h-5 w-5 text-white" />
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-800 px-4 py-3 rounded-lg border dark:border-gray-700">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="bg-white dark:bg-gray-800 border-t dark:border-gray-700 p-6">
            <form onSubmit={handleSubmit} className="flex space-x-4">
              <div className="flex-1">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={
                    mentorMode
                      ? "Describe a mentoring situation you need help with..."
                      : practiceMode
                      ? "Type your response to practice mentoring..."
                      : "Ask me about mentoring, career advice, or technical guidance..."
                  }
                  className="w-full px-4 py-3 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                  rows={3}
                  disabled={isLoading}
                />
              </div>
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  input.trim() && !isLoading
                    ? 'bg-primary-500 hover:bg-primary-600 text-white'
                    : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                }`}
              >
                <Send className="h-5 w-5" />
              </button>
            </form>
          </div>
        </div>

        {/* Side Panel */}
        <div className="w-80 bg-white dark:bg-gray-800 border-l dark:border-gray-700 p-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            Chat Settings
          </h2>

          <div className="space-y-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
              <h3 className="font-medium text-blue-900 dark:text-blue-300 mb-2">
                💡 Mentor Mode
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-400">
                Get AI-powered suggestions for mentoring conversations. Share a mentoring situation and receive tone, content, and approach recommendations.
              </p>
            </div>

            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700">
              <h3 className="font-medium text-green-900 dark:text-green-300 mb-2">
                ⚡ Practice Mode
              </h3>
              <p className="text-sm text-green-700 dark:text-green-400">
                Practice your mentoring skills! The AI will act as a mentee with realistic questions and challenges for you to respond to.
              </p>
            </div>

            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-700">
              <h3 className="font-medium text-purple-900 dark:text-purple-300 mb-2">
                💬 General Chat
              </h3>
              <p className="text-sm text-purple-700 dark:text-purple-400">
                Ask questions about mentoring best practices, career development, technical topics, or general guidance.
              </p>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t dark:border-gray-700">
            <h3 className="font-medium text-gray-900 dark:text-white mb-3">
              Quick Topics
            </h3>
            <div className="space-y-2">
              {[
                "How to give constructive feedback?",
                "Dealing with unmotivated mentees",
                "Setting mentoring goals",
                "Building trust with mentees",
                "Technical skill development"
              ].map((topic, index) => (
                <button
                  key={index}
                  onClick={() => setInput(topic)}
                  className="w-full text-left p-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  {topic}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Chat;