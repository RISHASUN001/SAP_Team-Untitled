import { useState, useCallback } from 'react';

export interface OrchestratorInput {
  userId: string;
  goals?: string[];
  skillGaps?: string[];
  feedback?: {
    goals: string;
    areasForImprovement: string;
    qualitativeFeedback: string;
    technicalSkills: number;
    communication: number;
    teamwork: number;
    problemSolving: number;
    initiative: number;
  };
}

export interface OrchestratorSession {
  sessionId: string;
  userId: string;
  status: 'processing' | 'completed' | 'error';
  createdAt: string;
  completedAt?: string;
  input: {
    goals?: string[];
    skillGaps?: string[];
    feedback?: any;
  };
  results?: any;
  error?: string;
}

export const useOrchestrator = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<OrchestratorSession | null>(null);

  const startAnalysis = useCallback(async (input: OrchestratorInput) => {
    setLoading(true);
    setError(null);
    setSession(null);

    try {
      console.log('🚀 Starting orchestrator analysis:', input);
      
      const response = await fetch('/api/orchestrator/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        throw new Error(`Analysis request failed: ${response.status}`);
      }

      const { sessionId } = await response.json();
      console.log('📝 Analysis session created:', sessionId);

      // Start polling for results
      pollForResults(sessionId);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      setLoading(false);
      console.error('❌ Orchestrator analysis error:', err);
    }
  }, []);

  const pollForResults = useCallback(async (sessionId: string) => {
    const maxPolls = 60; // 5 minutes max
    let pollCount = 0;

    const poll = async () => {
      try {
        pollCount++;
        console.log(`🔄 Polling for results (${pollCount}/${maxPolls})...`);

        const response = await fetch(`/api/orchestrator/results/${sessionId}`);
        
        if (!response.ok) {
          throw new Error(`Failed to get results: ${response.status}`);
        }

        const sessionData: OrchestratorSession = await response.json();
        setSession(sessionData);

        if (sessionData.status === 'completed') {
          console.log('✅ Analysis completed:', sessionData.results);
          setLoading(false);
          return;
        }

        if (sessionData.status === 'error') {
          throw new Error(sessionData.error || 'Analysis failed');
        }

        // Continue polling if still processing
        if (pollCount < maxPolls && sessionData.status === 'processing') {
          setTimeout(poll, 5000); // Poll every 5 seconds
        } else {
          throw new Error('Analysis timeout');
        }

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        setLoading(false);
        console.error('❌ Polling error:', err);
      }
    };

    poll();
  }, []);

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setSession(null);
  }, []);

  return {
    loading,
    error,
    session,
    startAnalysis,
    reset,
    isCompleted: session?.status === 'completed',
    results: session?.results
  };
};