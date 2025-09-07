import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
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

interface Button {
  text: string;
  action: string;
}

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  suggestions?: string[];
  mode?: 'mentor' | 'practice' | 'general';
  buttons?: Button[];
  messageType?: string;
}

const Chat: React.FC = () => {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mentorMode, setMentorMode] = useState(false);
  const [practiceMode, setPracticeMode] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize with welcome message
    if (messages.length === 0) {
      setMessages([{
        id: '1',
        type: 'ai',
        content: `Hello **${currentUser?.name}**! I'm your AI mentoring assistant. I can help you in several ways:

---
**1. Mentor Mode**  
Get suggestions on how to respond to your mentees or have your responses reviewed.  
👉 Click the **Mentor Mode** button to start.

**2. Practice Mode**  
Practice your mentoring skills through simulated scenarios.  
👉 Click the **Practice Mode** button to begin.

**3. Onboarding Assistant**  
Get comprehensive information about the SAP Data Science department, team structure, processes, tools, and career development.  
👉 If you ever want to revisit this, just click the **Refresh** button.

---

**How would you like to get started today?**`,
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

    
    // UPDATED: Handle practice mode with real API calls
    if (mode === 'practice') {
      // Call backend API for practice mode
      try {
        const res = await fetch('/api/chat/practice-respond', {
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
          content: data.response || 'No practice response received.',
          timestamp: new Date(),
          mode: 'practice',
          buttons: data.buttons || undefined,
          messageType: data.type || undefined
        };
      } catch (error) {
        return {
          id: Date.now().toString(),
          type: 'ai',
          content: 'Error: Unable to get practice response from AI server.',
          timestamp: new Date(),
          mode: 'practice'
        };
      }
    }

    // General chat mode with AI-powered onboarding assistance
    try {
      const res = await fetch('/api/chat/general-chat', {
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
        content: data.response || 'No response received.',
        timestamp: new Date(),
        suggestions: data.suggestions || undefined,
        mode: 'general'
      };
    } catch (error) {
      console.error('Error getting general chat response:', error);
      // Fallback to basic response if API fails
      const fallbackResponses = [
        `I'd be happy to help you with information about the SAP Data Science Department! I can provide details about:

• Team structure and leadership
• Onboarding process and timeline
• Technology stack and tools
• Current projects and initiatives
• Career development opportunities
• Learning resources and training

What specific topic would you like to explore?`,
        `Welcome to SAP Data Science! Here are some key things you should know:

• **Our Mission**: Democratizing data science across SAP through intelligent solutions
• **Technology Stack**: Python, SAP AI Core, HANA Cloud, and modern ML frameworks
• **Team Structure**: Specialized teams for AI Platform, Customer Intelligence, and more
• **Learning**: Comprehensive onboarding and continuous development opportunities

How can I help you get started?`,
        `As part of your onboarding journey, you'll have access to:

• **Technical Training**: Hands-on workshops with SAP platforms
• **Mentorship Program**: Pairing with experienced data scientists
• **Project Assignments**: Real-world challenges from day one
• **Career Development**: Clear progression paths and learning opportunities

What aspect would you like to know more about?`
      ];
      
      const response = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
      return {
        id: Date.now().toString(),
        type: 'ai',
        content: response,
        timestamp: new Date(),
        suggestions: [
          "Tell me about the team structure",
          "What should I know for my first week?",
          "What tools and technologies do we use?"
        ],
        mode: 'general'
      };
    }
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

  // NEW FUNCTION: Handle button clicks (Yes/No for scenarios, etc.)
  const handleButtonClick = async (action: string) => {
    if (isLoading) return;

    // Create a user message showing what button was clicked
    const buttonMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: action === 'yes' ? '✅ Yes, Start Scenario' : 
               action === 'no' ? '🔄 Different Scenario' :
               action === 'exit' ? '❌ Exit Practice' : action,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, buttonMessage]);
    setIsLoading(true);

    try {
      const currentMode = practiceMode ? 'practice' : 'general';
      const aiResponse = await generateAIResponse(action, currentMode);
      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      console.error('Error handling button click:', error);
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

  // NEW FUNCTION: Start practice session when practice mode is activated
  const startPracticeSession = async () => {
    try {
      const res = await fetch('/api/chat/practice-start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          user_id: currentUser?.id || 'default_user'
        })
      });
      const data = await res.json();
      
      // Add the practice start message to chat
      const practiceStartMessage: Message = {
        id: Date.now().toString(),
        type: 'ai',
        content: data.response || 'Practice session started!',
        timestamp: new Date(),
        mode: 'practice',
        buttons: data.buttons || undefined,
        messageType: data.type || undefined
      };
      
      setMessages(prev => [...prev, practiceStartMessage]);
    } catch (error) {
      console.error('Failed to start practice session:', error);
      const errorMessage: Message = {
        id: Date.now().toString(),
        type: 'ai',
        content: 'Error: Unable to start practice session. Please try again.',
        timestamp: new Date(),
        mode: 'practice'
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  // UPDATED FUNCTION: Now clears both frontend AND backend conversation history
  // UPDATED FUNCTION: Now clears both frontend AND backend conversation history
  // This ensures a complete reset when user clicks the refresh button
  const resetConversation = async () => {
    // Step 1: Clear frontend messages (UI reset)
    setMessages([{
      id: '1',
      type: 'ai',
      content: `**Conversation Reset!** 🔄

I'm ready to help you with mentoring guidance. Here's what I can assist with:

**1. Mentor Mode**  
Get suggestions on how to respond to your mentees or have your responses reviewed.  
👉 Click the **Mentor Mode** button to start.

**2. Practice Mode**  
Practice your mentoring skills through simulated scenarios.  
👉 Click the **Practice Mode** button to begin.

**3. Onboarding Assistant**  
Get comprehensive information about the SAP Data Science department, team structure, processes, tools, and career development.  
👉 If you ever want to revisit this, just click the **Refresh** button.


**What would you like to discuss?**`,
      timestamp: new Date()
    }]);
    setMentorMode(false);
    setPracticeMode(false);
    
    // Step 2: NEW - Clear backend conversation history for ALL modes
    const user_id = currentUser?.id || 'default_user';
    
    try {
      // Clear mentor mode history
      await fetch('/api/chat/mentor-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id })
      });
      
      // Clear practice mode history
      await fetch('/api/chat/practice-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id })
      });
      
      // NEW: Clear general chat history
      await fetch('/api/chat/general-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id })
      });
      
      console.log('All conversation histories cleared successfully');
    } catch (error) {
      console.error('Failed to reset backend conversations:', error);
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
                    Work Buddy
                  </h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {mentorMode ? 'Mentor Mode Active' : practiceMode ? 'Practice Mode Active' : 'Onboarding Assistant Active'}
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
                    const wasAlreadyActive = practiceMode;
                    setPracticeMode(!practiceMode);
                    setMentorMode(false);
                    
                    // NEW: Auto-start practice session when activating practice mode
                    if (!wasAlreadyActive && !practiceMode) {
                      startPracticeSession();
                    }
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
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <ReactMarkdown
                        components={{
                          // Custom styling for different markdown elements
                          p: ({ children }) => (
                            <p className="mb-2 last:mb-0">{children}</p>
                          ),
                          strong: ({ children }) => (
                            <strong className="font-semibold text-gray-900 dark:text-white">{children}</strong>
                          ),
                          ul: ({ children }) => (
                            <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>
                          ),
                          li: ({ children }) => (
                            <li className="text-gray-800 dark:text-gray-200">{children}</li>
                          ),
                          h3: ({ children }) => (
                            <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-2 mt-4 first:mt-0">{children}</h3>
                          ),
                          h4: ({ children }) => (
                            <h4 className="font-medium text-gray-900 dark:text-white mb-2 mt-3 first:mt-0">{children}</h4>
                          ),
                          code: ({ children }) => (
                            <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-sm font-mono">{children}</code>
                          ),
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>
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
                    {message.buttons && (
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                        <div className="flex flex-wrap gap-2">
                          {message.buttons.map((button, index) => (
                            <button
                              key={index}
                              onClick={() => handleButtonClick(button.action)}
                              disabled={isLoading}
                              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                button.action === 'yes'
                                  ? 'bg-green-500 hover:bg-green-600 text-white'
                                  : button.action === 'no'
                                  ? 'bg-blue-500 hover:bg-blue-600 text-white'
                                  : button.action === 'exit'
                                  ? 'bg-gray-500 hover:bg-gray-600 text-white'
                                  : 'bg-primary-500 hover:bg-primary-600 text-white'
                              } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                              {button.text}
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
                      : "Ask me about the SAP Data Science department, onboarding, tools, or any work-related questions..."
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
                💬 Onboarding Assistant
              </h3>
              <p className="text-sm text-purple-700 dark:text-purple-400">
                Get help with onboarding questions about the SAP Data Science department, team structure, processes, tools, and resources. Powered by AI with comprehensive knowledge base.
              </p>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t dark:border-gray-700">
            <h3 className="font-medium text-gray-900 dark:text-white mb-3">
              Quick Topics
            </h3>
            <div className="space-y-2">
              {(() => {
                let topics = [];
                if (mentorMode) {
                  topics = [
                    "How to give constructive feedback?",
                    "Dealing with unmotivated mentees",
                    "Setting mentoring goals",
                    "Building trust with mentees",
                    "Technical skill development"
                  ];
                } else if (practiceMode) {
                  topics = [
                    "Start a practice scenario",
                    "Practice difficult conversations",
                    "Role-play technical mentoring",
                    "Practice giving feedback",
                    "Exit practice mode"
                  ];
                } else {
                  // onboarding topics
                  topics = [
                    "Tell me about the SAP Data Science team structure",
                    "What should I prepare for my first week?",
                    "What tools and technologies do we use?",
                    "How does the onboarding process work?",
                    "What are the current projects and initiatives?"
                  ];
                }
                return topics;
              })().map((topic, index) => (
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