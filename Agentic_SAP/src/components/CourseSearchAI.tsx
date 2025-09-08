import React, { useState } from 'react';
import { Search, MessageCircle, Sparkles, Loader, X } from 'lucide-react';

interface CourseSearchAIProps {
  onCoursesFound: (courses: any[]) => void;
}

interface AISearchResult {
  query: string;
  ai_recommendation: string;
  relevant_courses: any[];
  total_found: number;
}

const CourseSearchAI: React.FC<CourseSearchAIProps> = ({ 
  onCoursesFound
}) => {
  const [query, setQuery] = useState('');
  const [aiResponse, setAiResponse] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [foundCourses, setFoundCourses] = useState<any[]>([]);

  const handleAISearch = async () => {
    if (!query.trim()) return;

    setIsLoading(true);
    setShowAIPanel(true);

    try {
      const response = await fetch('http://localhost:5002/api/course-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: query.trim() }),
      });

      if (response.ok) {
        const result: AISearchResult = await response.json();
        setAiResponse(result.ai_recommendation);
        setFoundCourses(result.relevant_courses);
        onCoursesFound(result.relevant_courses);
        console.log('AI Course Search Result:', result);
      } else {
        setAiResponse('Sorry, I encountered an error while searching for courses. Please try again.');
      }
    } catch (error) {
      console.error('Course search error:', error);
      setAiResponse('Unable to connect to the course search service. Please check if the server is running.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      handleAISearch();
    }
  };

  const handleClear = () => {
    setQuery('');
    setAiResponse('');
    setFoundCourses([]);
    setShowAIPanel(false);
  };

  // Function to parse markdown bold text (**text**) and convert to JSX
  const parseMarkdownBold = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        // Remove the ** and make it bold
        const boldText = part.slice(2, -2);
        return <strong key={index} className="font-semibold text-gray-900 dark:text-white">{boldText}</strong>;
      }
      return part;
    });
  };

  const exampleQueries = [
    "I want to learn Python for beginners",
    "Show me machine learning related courses",
    "I need help with data visualization",
    "What should a data analyst learn first?"
  ];

  return (
    <div className="mb-6">
      {/* Main AI Course Search Container */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl p-6 border border-purple-200 dark:border-purple-700">
        
        {/* Header */}
        <div className="flex items-center mb-4">
          <div className="bg-purple-500 p-2 rounded-lg mr-3">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              AI Course Search
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Ask me anything about courses in natural language
            </p>
          </div>
        </div>

        {/* Search Input */}
        <div className="flex space-x-3 mb-4">
          <div className="flex-1 relative">
            <MessageCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="e.g., 'I want to learn machine learning for beginners' or 'Show me advanced Python courses'"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full pl-10 pr-12 py-3 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              disabled={isLoading}
            />
            {query && (
              <button
                onClick={handleClear}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                disabled={isLoading}
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
          <button
            onClick={handleAISearch}
            disabled={isLoading || !query.trim()}
            className="flex items-center px-6 py-3 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
          >
            {isLoading ? (
              <Loader className="h-5 w-5 animate-spin" />
            ) : (
              <Search className="h-5 w-5" />
            )}
            <span className="ml-2">{isLoading ? 'Searching...' : 'Ask AI'}</span>
          </button>
        </div>

        {/* Example Queries */}
        <div className="mb-6">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Try these examples:</p>
          <div className="flex flex-wrap gap-2">
            {exampleQueries.map((example, index) => (
              <button
                key={index}
                onClick={() => setQuery(example)}
                className="px-3 py-1 text-xs bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                disabled={isLoading}
              >
                {example}
              </button>
            ))}
          </div>
        </div>

        {/* AI Response Sub-box */}
        {showAIPanel && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-purple-200 dark:border-purple-600 shadow-sm">
            <div className="flex items-start space-x-3">
              <div className="bg-purple-100 dark:bg-purple-900/20 p-2 rounded-lg flex-shrink-0">
                <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                  AI Recommendation
                </h4>
                {isLoading ? (
                  <div className="flex items-center text-gray-500 dark:text-gray-400">
                    <Loader className="h-4 w-4 animate-spin mr-2" />
                    Analyzing your request and finding the best courses...
                  </div>
                ) : (
                  <div className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {parseMarkdownBold(aiResponse)}
                  </div>
                )}
              </div>
            </div>
            {foundCourses.length > 0 && !isLoading && (
              <div className="mt-4 pt-4 border-t border-purple-200 dark:border-purple-600">
                <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">
                  ✨ Found {foundCourses.length} relevant courses - check them out below!
                </p>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default CourseSearchAI;
