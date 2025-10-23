import { useEffect, useRef, useState } from 'react';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';

type Role = 'user' | 'assistant';
interface Turn {
  role: Role;
  content: string;
  imageData?: string; // Optional image data for screenshots
}

export default function useChatService() {
  const { refreshSubscription } = useAuth();
  const chatHistoryRef = useRef<Turn[]>([]);
  const [chatHistory, setChatHistory] = useState<Turn[]>([]);
  const [transcript, setTranscript] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const promptSyncedRef = useRef(false);

  // Helper: wait for an ID token up to a timeout to avoid race after login
  const getAuthHeaders = async (timeoutMs = 4000): Promise<Record<string, string>> => {
    const start = Date.now();
    let token = await auth.currentUser?.getIdToken();
    while (!token && Date.now() - start < timeoutMs) {
      await new Promise((r) => setTimeout(r, 150));
      token = await auth.currentUser?.getIdToken();
    }
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  useEffect(() => {
    const savedHistory = localStorage.getItem('chat-history');
    if (savedHistory) {
      try {
        const parsed: Turn[] = JSON.parse(savedHistory);
        setChatHistory(parsed);
        chatHistoryRef.current = parsed;
      } catch (e) {
        console.error('Failed to parse saved turns from localStorage');
      }
    }
  }, []);

  useEffect(() => {
    if (chatHistory.length > 0) {
      localStorage.setItem('chat-history', JSON.stringify(chatHistory));
    }
  }, [chatHistory]);

  const handleTranscript = async (question: string, imageDataUrl?: string) => {
    if (!question.trim()) return;



    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    addMessageToHistory('user', question, imageDataUrl);

    setIsThinking(true);

    try {
      abortControllerRef.current = new AbortController();
      // Get conversation history (last 20 messages)
      const history = chatHistoryRef.current.map(msg => ({
        role: msg.role,
        content: msg.content
      })).slice(-20);
      
      // Prepare auth header
      const authHeaders = await getAuthHeaders();

      // One-time sync of system prompt with user profile
      if (!promptSyncedRef.current) {
        try {
          const storedProfile = localStorage.getItem('userProfileData');
          const storedUseCase = localStorage.getItem('selectedUseCase');
          if (storedProfile && storedUseCase) {
            const parsed = JSON.parse(storedProfile);
            const primary: string = parsed?.primaryData || '';
            const secondary: string = parsed?.secondaryData || '';
            const combined = secondary ? `${primary}\n\nAdditional Context:\n${secondary}` : primary;
            await fetch('/api/angel-ai', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', ...authHeaders },
              body: JSON.stringify({ type: 'setup', useCase: storedUseCase, userData: combined }),
              signal: abortControllerRef.current.signal,
            });
          }
        } catch (e) {
          // Non-fatal
        } finally {
          promptSyncedRef.current = true;
        }
      }

      // Start streaming request
      const response = await fetch('/api/angel-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({
          type: 'chat',
          message: question,
          conversationHistory: history,
          imageData: imageDataUrl,
          stream: true,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok || !response.body) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Optimistically add empty assistant message to update live
      addMessageToHistory('assistant', '');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';
      let sawFirstChunk = false;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        fullText += chunk;
        if (!sawFirstChunk) {
          // Hide thinking animation as soon as streaming starts
          setIsThinking(false);
          sawFirstChunk = true;
        }
        updateLastMessageInHistory(fullText);
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        addMessageToHistory(
          'assistant',
          'Sorry, I encountered an error. Please try again.',
          undefined
        );
      }
    } finally {
      setIsThinking(false);
      abortControllerRef.current = null;
      // Refresh credits after the request completes
      try { await refreshSubscription(); } catch {}
    }
  };

  const addMessageToHistory = (role: Turn['role'], content: string, imageData?: string) => {
    const updated = [...chatHistoryRef.current, { role, content, imageData }];
    chatHistoryRef.current = updated;
    setChatHistory(updated);
  }

  const clearChatHistory = () => {
    chatHistoryRef.current = [];
    setChatHistory([]);
    localStorage.removeItem('chat-history');
  };

  const updateLastMessageInHistory = (content: string) => {
    setChatHistory((prevHistory) => {
      const newMessages = [...prevHistory];
      if (
        newMessages.length > 0 &&
        newMessages[newMessages.length - 1].role === 'assistant'
      ) {
        newMessages[newMessages.length - 1].content = content;
      }

      chatHistoryRef.current = newMessages;

      return newMessages;
    });
  };

  const analyzeSession = async (): Promise<string> => {
    // Build plain history
    const history = chatHistoryRef.current.map((t) => ({ role: t.role, content: t.content })).slice(-200);
    const token = await auth.currentUser?.getIdToken();
    const headers: any = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch('/api/angel-ai', {
      method: 'POST',
      headers,
      body: JSON.stringify({ type: 'analyze_session', history }),
    });
    if (!res.ok) throw new Error('Analysis failed');
    const data = await res.json();
    if (data.success && data.report) return data.report as string;
    throw new Error('Analysis failed');
  };

  return {
    chatHistory,
    isThinking,
    transcript,
    handleTranscript,
    setTranscript,
    clearChatHistory,
    analyzeSession,
  };
}
