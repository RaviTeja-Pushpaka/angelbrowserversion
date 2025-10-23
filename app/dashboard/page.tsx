'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Recorder from '@/components/Recorder';
import ScreenCapture from '@/components/ScreenCapture';
import ThinkingAnimation from '@/components/ThinkingAnimation';
import TranscribingAnimation from '@/components/TranscribingAnimation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import ChatInput from '@/components/common/ChatInput';
import ConfirmDeleteModal from '@/components/common/ConfirmDeleteModal';
import UpdatePromptModal from '@/components/common/UpdatePromptModal';
import useChatService from '@/hooks/useChartService';
import useMicPermission from '@/hooks/useMicPermission';
import { useMobileAudio } from '@/hooks/useMobileAudio';
import { useAuth } from '@/contexts/AuthContext';
import { auth } from '@/lib/firebase';
import CreditsExhaustedModal from '@/components/auth/CreditsExhaustedModal';


import { ChevronDown, Download, Settings, Trash2, MessageSquare, GripVertical, Target, Phone, Users, LogOut } from 'lucide-react';
import PreWithCopy from '@/components/PreWithCopy';
import { useIsMobile } from '@/hooks/useIsMobile';
// Using dynamic import for jsPDF later; no static import here


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

export default function AngelPanel() {
  const { requestMic } = useMicPermission();
  const isMobile = useIsMobile();
  const [captureStream, setCaptureStream] = useState<MediaStream | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const bottomRef = useRef<HTMLSpanElement | null>(null);
  const updatePromptModalRef = useRef<HTMLDialogElement>(null);
  const deleteHistoryModalRef = useRef<HTMLDialogElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Panel sizing state (vertical sizing removed; screen capture auto-fills, controls fit content)
  const [chatWidth, setChatWidth] = useState(50); // percentage - this controls right section width
  const [isDragging, setIsDragging] = useState<'horizontal' | null>(null);

  // Use case selection state
  const [selectedUseCase, setSelectedUseCase] = useState<'interview' | 'sales' | 'meeting' | 'custom' | null>(null);
  const [showUseCaseSelection, setShowUseCaseSelection] = useState(true);
  const [showSetupForm, setShowSetupForm] = useState(false);

  // Load saved profile data on component mount
  useEffect(() => {
    // For now, always show use case selection for new users
    // This ensures fast loading without complex checks
  }, []);

  // Setup form data
  const [inputData, setInputData] = useState<string>('');
  const [secondaryData, setSecondaryData] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingError, setProcessingError] = useState<string>('');

  // Authentication
  const { user, planName, isUnlimited, loading: authLoading, logout, credits, hasCredits } = useAuth();

  // Redirect unauthenticated users to homepage
  useEffect(() => {
    if (!authLoading && !user) {
      window.location.href = '/';
    }
  }, [user, authLoading]);

  // Do not early-return here; we always call hooks below to keep hook order consistent.

  const {
    chatHistory,
    isThinking,
    handleTranscript,
    clearChatHistory,
  } = useChatService();

  // Mobile audio handling (safe even if not authenticated)
  const {
    audioStream: mobileAudioStream,
    requestMicrophoneAccess
  } = useMobileAudio();

  const [shouldStopCapture, setShouldStopCapture] = useState(false);

  // Auto-request microphone access on mobile
  useEffect(() => {
    const isMobile = window.innerWidth < 1024;
    if (isMobile && !mobileAudioStream) {
      requestMicrophoneAccess();
    }
  }, [mobileAudioStream, requestMicrophoneAccess]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatScrollRef.current && chatHistory.length > 0) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatHistory]);

  // Track scroll position for better UX
  const [showScrollIndicator, setShowScrollIndicator] = useState(false);
  
  useEffect(() => {
    const chatElement = chatScrollRef.current;
    if (!chatElement) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = chatElement;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShowScrollIndicator(!isNearBottom);
    };

    chatElement.addEventListener('scroll', handleScroll);
    return () => chatElement.removeEventListener('scroll', handleScroll);
  }, []);





  // Drag handlers for resizing
  const handleHorizontalDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging('horizontal');
  }, []);

  // Enhanced mouse move handler with better constraints and smooth dragging
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;

    if (isDragging === 'horizontal') {
      const container = document.querySelector('.panel-container');
      if (!container) return;
      
      const rect = container.getBoundingClientRect();
      const newWidth = ((e.clientX - rect.left) / rect.width) * 100;
      
      // Fix direction: when dragging right, chat should get wider
      // So we need to invert the logic
      const invertedWidth = 100 - newWidth;
      
      // Constrain between 25% and 75% for better balance
      const constrainedWidth = Math.max(25, Math.min(75, invertedWidth));
      
      // Use requestAnimationFrame for smooth updates
      requestAnimationFrame(() => {
        setChatWidth(constrainedWidth); // This is correct
      });
      

    }
  }, [isDragging]);



  const handleMouseUp = useCallback(() => {
    setIsDragging(null);
  }, []);

  useEffect(() => {
    if (isDragging) {
      // Use passive: false for better performance
      document.addEventListener('mousemove', handleMouseMove, { passive: false });
      document.addEventListener('mouseup', handleMouseUp, { passive: false });
      document.body.style.cursor = 'ew-resize';
      document.body.style.userSelect = 'none';
      document.body.style.pointerEvents = 'none';
      
      // Prevent text selection during drag
      document.addEventListener('selectstart', (e) => e.preventDefault());
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.body.style.pointerEvents = '';
      
      // Re-enable text selection
      document.removeEventListener('selectstart', (e) => e.preventDefault());
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.body.style.pointerEvents = '';
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isThinking, isTranscribing]);

  useEffect(() => {
    requestMic();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleExternalStopHandled = useCallback(() => {
    setShouldStopCapture(false);
  }, []);

  const handleGoogleAPIDisconnect = useCallback(() => {
    setShouldStopCapture(true);
  }, []);

  useEffect(() => {
    const handleMeetDisconnect = () => {
      handleGoogleAPIDisconnect();
    };
    window.addEventListener('google-api-disconnect', handleMeetDisconnect);

    return () => {
      window.removeEventListener('google-api-disconnect', handleMeetDisconnect);
    };
  }, [handleGoogleAPIDisconnect]);

  // Credit-aware transcript handler (credits-only model)
  const handleTranscriptWithCredits = async (text: string, imageData?: string) => {
    if (!user) return;
    const creditCost = imageData ? 4 : 1; // Image = 4 credits, Text = 1 credit
    if (!hasCredits(creditCost)) return;
    await handleTranscript(text, imageData);
  };

  const handleScreenshot = async (dataUrl: string, fileName: string) => {
    if (dataUrl && dataUrl.startsWith('data:image/')) {
      // Valid image data - send to AI for analysis
      await handleTranscriptWithCredits(`Analyze this screenshot: ${fileName}`, dataUrl);
    } else {
      // No image data - just send text message
      await handleTranscriptWithCredits(`Screenshot taken: ${fileName}`, '');
    }
  };

  const handleExportChat = useCallback(() => {
    // Create CSV format for better readability
    const date = new Date();
    const formattedDate = date.toLocaleDateString('en-US');
    const formattedTime = date.toLocaleTimeString('en-US');

    // CSV Headers
    let csvContent = 'Timestamp,Speaker,Message,Has Image\n';

    // Add each message as a CSV row
    chatHistory.forEach((message) => {
      const speaker = message.role === 'user' ? 'You' : 'Angel AI';
      const timestamp = `${formattedDate} ${formattedTime}`;
      const hasImage = message.imageData ? 'Yes' : 'No';

      // Escape quotes and newlines in message content for CSV
      const cleanMessage = message.content
        .replace(/"/g, '""') // Escape quotes
        .replace(/\n/g, ' ') // Replace newlines with spaces
        .replace(/\r/g, ''); // Remove carriage returns

      csvContent += `"${timestamp}","${speaker}","${cleanMessage}","${hasImage}"\n`;
    });

    // Add summary at the end
    csvContent += `\n"Export Info","Total Messages","${chatHistory.length}",""\n`;
    csvContent += `"Export Info","Export Date","${formattedDate} ${formattedTime}",""\n`;

    const blob = new Blob([csvContent], {
      type: 'text/csv',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `angel-ai-chat-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setIsDropdownOpen(false);
  }, [chatHistory]);

  const handleSwitchToMobile = useCallback(async () => {
    try {
      await logout();
    } catch (e) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Logout failed during switch to mobile:', e);
      }
    }
    window.location.href = 'https://angelmobile.lazyjobseeker.com';
  }, [logout]);

  // const openUpdatePromptModal = () => {
  //   if (updatePromptModalRef.current) {
  //     updatePromptModalRef.current.showModal();
  //   }
  //   setIsDropdownOpen(false);
  // };

  const openDeleteHistoryModal = () => {
    if (deleteHistoryModalRef.current) {
      deleteHistoryModalRef.current.showModal();
    }
    setIsDropdownOpen(false);
  };

  const handleLogout = async () => {
    try {
      await logout();
      setIsDropdownOpen(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // const handleTestPrompt = async () => {
  //   try {
  //     // Get current system prompt from API
  //     const headers = await getAuthHeaders();
  //     const response = await fetch('/api/angel-ai', {
  //       method: 'GET',
  //       headers,
  //     });
  //
  //     if (response.ok) {
  //       const result = await response.json();
  //
  //       // Show alert with prompt info
  //       alert(`Angel AI System Prompt Test:\n\nLength: ${result.systemPrompt?.length} characters\nProvider: ${result.provider}\n\nPreview:\n${result.systemPrompt?.substring(0, 300)}...`);
  //     } else {
  //       const msg = response.status === 401 ? 'Unauthorized. Please re-login and try again.' : 'Failed to test system prompt';
  //       alert(msg);
  //     }
  //   } catch (error) {
  //     console.error('Test prompt error:', error);
  //     alert('Failed to test system prompt');
  //   }
  // };

  const handleSetupSubmit = async () => {
    if (!inputData.trim()) {
      setProcessingError('Resume/Profile is required');
      return;
    }



    setIsProcessing(true);
    setProcessingError('');

    try {
      // Prepare the data to send to API
      // const setupData = {
      //   useCase: selectedUseCase,
      //   primaryData: inputData.trim(),
      //   secondaryData: secondaryData.trim() || '',
      // };

      // Create the personalized prompt data
      const promptData = inputData.trim() + (secondaryData.trim() ? `\n\nAdditional Context:\n${secondaryData.trim()}` : '');
      
      // Call the API to update system prompt
      const headers = await getAuthHeaders();
      const response = await fetch('/api/angel-ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: JSON.stringify({
          type: 'setup',
          useCase: selectedUseCase,
          userData: promptData
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update system prompt');
      }

      await response.json();

      // Save to localStorage for persistence
      localStorage.setItem('userProfileData', JSON.stringify({
        useCase: selectedUseCase,
        primaryData: inputData.trim(),
        secondaryData: secondaryData.trim()
      }));

      // Save selected use case to localStorage
      localStorage.setItem('selectedUseCase', selectedUseCase);

      // Go directly to dashboard - no delay!
      setShowSetupForm(false);
      setShowUseCaseSelection(false);
      
    } catch (error) {
      setProcessingError('Failed to process your data. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };





  const menuItems = [
    {
      label: 'End Meeting',
      icon: Target,
      onClick: () => setShowUseCaseSelection(true),
      description: 'Switch between interview, sales, meeting, or custom',
      color: 'text-purple-600 hover:bg-purple-50',
    },
    // Note: Image generation prompts can be added here in the future
    // Currently, the system only handles screenshot analysis, not image generation
    {
      label: 'Export Chat',
      icon: Download,
      onClick: handleExportChat,
      description: 'Download conversation as CSV',
      color: 'text-green-600 hover:bg-green-50',
    },
    {
      label: 'Delete Chat',
      icon: Trash2,
      onClick: openDeleteHistoryModal,
      description: 'Clear all conversation history',
      color: 'text-red-600 hover:bg-red-50',
    },
    {
      label: 'Logout',
      icon: LogOut,
      onClick: handleLogout,
      description: 'Sign out of your account',
      color: 'text-gray-600 hover:bg-gray-50',
    },
  ];

  // Show loading screen while authentication is initializing
  if (authLoading) {
    return (
      <div className="h-screen w-screen bg-gradient-subtle flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-angel rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <MessageSquare className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-xl font-semibold text-neutral-800 mb-2">Loading Angel...</h2>
          <p className="text-neutral-600">Initializing your AI assistant</p>
        </div>
      </div>
    );
  }

  // Show use case selection if not selected yet
  if (showUseCaseSelection) {
    const useCases = [
      {
        id: 'interview' as const,
        title: 'Interview',
        description: 'Get personalized assistance during job interviews',
        icon: MessageSquare,
        color: 'from-purple-500 to-pink-500'
      },
      {
        id: 'sales' as const,
        title: 'Sales Call',
        description: 'Boost your sales performance with AI guidance',
        icon: Phone,
        color: 'from-blue-500 to-purple-500'
      },
      {
        id: 'meeting' as const,
        title: 'Business Meeting',
        description: 'Stay on track during important business discussions',
        icon: Users,
        color: 'from-green-500 to-blue-500'
      },
      {
        id: 'custom' as const,
        title: 'Custom',
        description: 'Create your own AI assistant with custom prompts',
        icon: Settings,
        color: 'from-orange-500 to-red-500'
      }
    ];

    return (
      <div className="h-screen w-screen bg-gradient-subtle flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 animate-fade-in-up relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-300/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-300/5 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-4xl w-full mx-auto relative z-10">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-gradient-angel rounded-xl flex items-center justify-center shadow-lg">
                <Target className="h-6 w-6 text-white" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-gradient mb-3">Choose Your Use Case</h2>
            <p className="text-lg text-neutral-600 max-w-2xl mx-auto leading-relaxed">
              Select how you&apos;d like Angel to assist you
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {useCases.map((useCase, index) => (
              <button
                key={useCase.id}
                onClick={() => {
                  setSelectedUseCase(useCase.id);
                  setShowUseCaseSelection(false);
                  setShowSetupForm(true);
                }}
                className="bg-white p-4 text-center hover:scale-105 hover:shadow-lg transition-all duration-300 animate-fade-in-scale group relative overflow-hidden rounded-xl border border-neutral-200 shadow-sm hover:shadow-md"
                style={{animationDelay: `${index * 0.1}s`}}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 to-pink-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative z-10">
                  <div className={`flex items-center justify-center w-12 h-12 bg-gradient-to-r ${useCase.color} rounded-xl mb-3 shadow-md group-hover:scale-110 transition-transform duration-300 mx-auto`}>
                    <useCase.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-neutral-800 mb-2 group-hover:text-purple-700 transition-colors">
                    {useCase.title}
                  </h3>
                  <p className="text-neutral-600 text-sm leading-relaxed">
                    {useCase.description}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Show setup form after use case selection
  if (showSetupForm && selectedUseCase) {
    return (
      <div className="h-screen w-screen bg-gradient-subtle flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 animate-fade-in-up relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-300/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-300/5 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-3xl w-full mx-auto relative z-10">
          <div className="text-center mb-6">
            <div className="flex items-center justify-center mb-3">
              <div className="w-12 h-12 bg-gradient-angel rounded-xl flex items-center justify-center shadow-lg">
                <Target className="h-6 w-6 text-white" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gradient mb-2">Setup Your {selectedUseCase === 'interview' ? 'Interview Profile' : selectedUseCase === 'sales' ? 'Sales Context' : selectedUseCase === 'meeting' ? 'Meeting Context' : 'Custom Assistant'}</h2>
            <p className="text-sm text-neutral-600 max-w-xl mx-auto">
              {selectedUseCase === 'interview'
                ? 'Provide your details for personalized assistance'
                : selectedUseCase === 'sales'
                ? 'Add your context for better support'
                : selectedUseCase === 'meeting'
                ? 'Set your context for productive discussions'
                : 'Customize your AI assistant'
              }
            </p>
          </div>

          <div className="bg-white p-6 max-w-xl mx-auto rounded-xl border border-neutral-200 shadow-md">
            {selectedUseCase === 'interview' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Resume/Profile <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    placeholder="Paste your resume content here or describe your background..."
                    className={`w-full h-24 p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none ${
                      processingError && !inputData.trim() ? 'border-red-300' : 'border-neutral-300'
                    }`}
                    value={inputData}
                    onChange={(e) => setInputData(e.target.value)}
                    required
                  />
                  {processingError && !inputData.trim() && (
                    <p className="text-red-500 text-sm mt-1">Resume/Profile is required</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Target Job/Role <span className="text-neutral-400 text-xs">(Optional)</span>
                  </label>
                  <textarea
                    placeholder="Describe the job you're interviewing for, key requirements, company details..."
                    className="w-full h-20 p-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                    value={secondaryData}
                    onChange={(e) => setSecondaryData(e.target.value)}
                  />
                </div>
              </div>
            )}

            {selectedUseCase === 'sales' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Sales Script/Context <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    placeholder="Paste your sales script, product details, target audience..."
                    className={`w-full h-24 p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none ${
                      processingError && !inputData.trim() ? 'border-red-300' : 'border-neutral-300'
                    }`}
                    value={inputData}
                    onChange={(e) => setInputData(e.target.value)}
                    required
                  />
                  {processingError && !inputData.trim() && (
                    <p className="text-red-500 text-sm mt-1">Sales Script/Context is required</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Additional Context <span className="text-neutral-400 text-xs">(Optional)</span>
                  </label>
                  <textarea
                    placeholder="Competitor info, pricing, objections, closing techniques..."
                    className="w-full h-24 p-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                    value={secondaryData}
                    onChange={(e) => setSecondaryData(e.target.value)}
                  />
                </div>
              </div>
            )}

            {selectedUseCase === 'meeting' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Meeting Agenda/Context <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    placeholder="Describe the meeting purpose, agenda, participants, goals..."
                    className={`w-full h-24 p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none ${
                      processingError && !inputData.trim() ? 'border-red-300' : 'border-neutral-300'
                    }`}
                    value={inputData}
                    onChange={(e) => setInputData(e.target.value)}
                    required
                  />
                  {processingError && !inputData.trim() && (
                    <p className="text-red-500 text-sm mt-1">Meeting Agenda/Context is required</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Additional Details <span className="text-neutral-400 text-xs">(Optional)</span>
                  </label>
                  <textarea
                    placeholder="Background context, key decisions needed, follow-up actions..."
                    className="w-full h-20 p-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                    value={secondaryData}
                    onChange={(e) => setSecondaryData(e.target.value)}
                  />
                </div>
              </div>
            )}

            {selectedUseCase === 'custom' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Custom Instructions <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    placeholder="Describe how you want your AI assistant to behave, what it should help you with..."
                    className={`w-full h-24 p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none ${
                      processingError && !inputData.trim() ? 'border-red-300' : 'border-neutral-300'
                    }`}
                    value={inputData}
                    onChange={(e) => setInputData(e.target.value)}
                    required
                  />
                  {processingError && !inputData.trim() && (
                    <p className="text-red-500 text-sm mt-1">Custom Instructions are required</p>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-between items-center mt-8 pt-6 border-t border-neutral-200">
              <button
                onClick={() => {
                  setShowSetupForm(false);
                  setShowUseCaseSelection(true);
                }}
                className="btn-professional btn-secondary"
                disabled={isProcessing}
              >
                ← Back to Use Cases
              </button>
              <button
                onClick={handleSetupSubmit}
                disabled={isProcessing || !inputData.trim()}
                className="btn-professional btn-primary flex items-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    Start with Angel →
                  </>
                )}
              </button>
            </div>



            {processingError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {processingError}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Render loading or redirect shims without breaking hook order
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // redirect happens in useEffect
  }

  // Mobile users get a simplified chat-only interface

  return (
    <div className="h-screen overflow-hidden w-screen bg-gradient-subtle">
      <UpdatePromptModal modalRef={updatePromptModalRef} />
      <ConfirmDeleteModal
        modalRef={deleteHistoryModalRef}
        handleClick={clearChatHistory}
      />

      {/* Authentication Modal - Removed */}

      {/* Credits Exhausted Modal */}
      <CreditsExhaustedModal
        isOpen={!hasCredits(1)}
        onClose={() => {}}
      />






      {/* Main Content */}
      <div className={`flex-1 flex ${isMobile ? 'flex-col' : 'flex-col lg:flex-row'} h-full overflow-hidden panel-container bg-gradient-to-br from-neutral-50 via-neutral-100 to-neutral-150`}>
           {/* Left Section: Video/Recording Controls - Hidden on Mobile */}
          {!isMobile && (
          <div
            className="hidden lg:flex flex-col h-full transition-all duration-200 panel-section"
            style={{
              '--panel-width': `${100 - chatWidth}%`,
              width: `${100 - chatWidth}%`,
              flex: 'none'
            } as React.CSSProperties & { '--panel-width': string }}
          >
            {/* Top: Screen Capture Panel (80%) */}
            <div
              className="card-professional panel-card overflow-hidden animate-fade-in-scale bg-white panel-section-fixed rounded-xl border border-neutral-200 shadow-lg"
              style={{ flex: '0 0 80%', height: '80%' }}
            >
              <div className="h-full flex items-center justify-center p-2">
                <ScreenCapture
                  handleScreenshot={handleScreenshot}
                  onStreamAvailable={setCaptureStream}
                  externalStop={shouldStopCapture}
                  onExternalStopHandled={handleExternalStopHandled}
                />
              </div>
            </div>

            {/* Middle: Voice Recorder Panel (15%) */}
            <div
              className="card-professional panel-card animate-fade-in-scale flex flex-col panel-section-scrollable rounded-xl border border-neutral-200 shadow-lg bg-white"
              style={{ flex: '0 0 15%', height: '15%' }}
            >
              <div className="p-4">
                <Recorder
                  audioStream={captureStream}
                  onAddUserTurn={(text) => handleTranscriptWithCredits(text)}
                  onTranscribingChange={setIsTranscribing}
                  handleScreenshot={handleScreenshot}
                  capturing={!!captureStream}
                />
              </div>
            </div>

            {/* Bottom: Branding (5%) */}
            <div
              className="card-professional panel-card animate-fade-in-scale flex items-center justify-center rounded-xl border border-neutral-200 shadow-lg bg-gradient-to-r from-purple-50 to-pink-50"
              style={{ flex: '0 0 5%', height: '5%' }}
            >
              <a
                href="https://lazyjobseeker.com/angel"
                target="_blank"
                rel="noreferrer"
                className="text-[10px] text-neutral-700 hover:text-neutral-900 font-medium px-3 py-1 rounded-full bg-white/60 border border-white/80 shadow-sm"
                title="Stay invisible in meetings — use Angel Desktop"
              >
                Stay invisible even after sharing full screen then use — Angel Desktop
              </a>
            </div>
          </div>
          )}

          {/* Horizontal Resize Handle - Desktop Only */}
          {!isMobile && (
          <div
            className="desktop-resize-handle hidden lg:flex flex-col items-center justify-center w-3 cursor-ew-resize hover:bg-neutral-200 transition-all duration-200 group resize-handle bg-gradient-to-b from-neutral-100 to-neutral-150 border border-neutral-200 hover:border-neutral-300"
            onMouseDown={handleHorizontalDragStart}
            title="Drag to resize chat and video sections"
            style={{ zIndex: 1000 }}
          >
            <GripVertical className="h-12 w-5 text-neutral-500 group-hover:text-neutral-600 transition-all duration-200 group-hover:scale-110" />
          </div>
          )}

          {/* Right Section: Chat Interface */}
          <div
            className={`flex flex-col h-full transition-all duration-200 min-w-0 panel-section ${!isMobile && isDragging ? 'opacity-80' : 'opacity-100'}`}
            style={{
              '--panel-width': isMobile ? '100%' : `${chatWidth}%`,
              width: isMobile ? '100%' : `${chatWidth}%`,
              flex: 'none'
            } as React.CSSProperties & { '--panel-width': string }}
          >
                          <div className="card-professional flex flex-col h-full animate-fade-in-scale relative panel-card rounded-xl border border-neutral-200 shadow-lg bg-white">
              {/* Mobile Controls - Only visible on mobile */}
              {isMobile && (
                <div className="mobile-controls border-b border-neutral-200 bg-gradient-to-r from-neutral-50 to-white px-4 py-3">
                  <div className="mobile-recorder-controls">
                    <Recorder
                      audioStream={mobileAudioStream}
                      onAddUserTurn={(text) => handleTranscriptWithCredits(text)}
                      onTranscribingChange={setIsTranscribing}
                      handleScreenshot={handleScreenshot}
                      capturing={true} // Mobile has camera access
                    />
                  </div>
                </div>
              )}

              {/* Header with User Info and Settings */}
              <div className="user-profile-header border-b border-neutral-200 bg-gradient-to-r from-neutral-50 to-white px-6 py-4">
                {/* User Profile Info - Left Side */}
                <div className="user-profile-info">
                  <div className="user-avatar">
                    <span>
                      {user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <div className="user-details">
                    <div className="user-name">
                      {user?.displayName || 'User'}
                    </div>
                    <div className="user-email">
                      {user?.email}
                    </div>
                  </div>
                  
                  {/* Plan Tag and Credits Display */}
                  <div className="flex items-center gap-3">
                    {/* Plan Tag */}
                    <div className={`plan-tag ${isUnlimited ? 'unlimited-plan' : 'free-plan'}`}>
                      <span className="plan-tag-text">
                        {isUnlimited ? '∞ Unlimited' : `${planName} Plan`}
                      </span>
                    </div>
                    
                    {/* Credits Display */}
                    {!isUnlimited && (
                      <div className="credits-display">
                        <div className="credits-indicator"></div>
                        <span className="credits-text">
                          {credits} credits left
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Settings Button - Right Side */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className={`flex items-center gap-1 px-3 py-2 rounded-lg bg-neutral-50 border border-neutral-200 text-neutral-600 hover:bg-neutral-100 shadow-sm transition-all text-xs
                      ${isDropdownOpen ? 'bg-neutral-100' : ''}
                    `}
                    aria-expanded={isDropdownOpen}
                    aria-haspopup="true"
                  >
                    <Settings className="w-3 w-3" />
                    <span className="hidden lg:inline font-medium">
                      Settings
                    </span>
                    <ChevronDown
                      className={`w-3 w-3 transition-transform duration-200 ${
                        isDropdownOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {isDropdownOpen && (
                    <div className={`absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-neutral-200 z-50 animate-fade-in-scale ${isMobile ? 'mobile-settings-dropdown' : ''}`} suppressHydrationWarning>
                      <div className="py-2">
                        {/* Subscription Info */}
                        {/* SubscriptionInfo component is no longer imported, so this block is removed */}
                        
                        <div className="px-4 py-3 border-b border-neutral-100">
                          <h3 className="text-sm font-semibold text-neutral-800">
                            Actions
                          </h3>
                          <p className="text-xs text-neutral-500 mt-0.5">
                            Manage your conversation
                          </p>
                        </div>

                        {menuItems.map((item, index) => (
                          <button
                            key={index}
                            onClick={item.onClick}
                            className={`cursor-pointer w-full px-4 py-3 text-left flex items-start gap-3 transition-all duration-150 hover:bg-neutral-50 active:bg-neutral-100 focus:outline-none focus:bg-neutral-50 group ${isMobile ? 'mobile-touch-target' : ''}`}
                          >
                            <item.icon
                              className={`w-4 h-4 mt-0.5 ${
                                item.color.split(' ')[0]
                              } group-hover:scale-110 transition-transform duration-150`}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-neutral-900 group-hover:text-neutral-800">
                                {item.label}
                              </div>
                              <div className="text-xs text-neutral-500 mt-0.5 leading-relaxed">
                                {item.description}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>

                      <div className="px-4 py-3 border-t border-neutral-100 bg-neutral-50 rounded-b-xl">
                        <p className="text-xs text-neutral-500 text-center">
                          {chatHistory.length} messages in current session
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>



              {/* Chat Messages */}
              <div
                ref={chatScrollRef}
                className="flex-1 overflow-y-auto p-6 pr-4 space-y-4 chat-scroll bg-gradient-to-b from-neutral-50/50 to-white"
                style={{
                  scrollBehavior: 'smooth',
                  height: isMobile ? 'calc(100vh - 320px)' : 'calc(100vh - 350px)', // Extra space for mobile controls
                  minHeight: '400px'
                }}
              >
                {chatHistory.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center py-8">
                    <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center mb-3">
                      <MessageSquare className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-sm font-semibold text-neutral-800 mb-2">Angel is ready to help</h3>
                    <p className="text-neutral-600 text-xs max-w-xs">
                      Start speaking or typing to begin your session with Angel.
                    </p>
                  </div>
                ) : (
                  chatHistory.map((t, i) => (
                    <div
                      key={i}
                      className={`flex ${
                        t.role === 'assistant' ? 'justify-start' : 'justify-end'
                      } animate-fade-in-up`}
                    >
                      <div
                        className={`max-w-[90%] rounded-xl px-3 py-2 ${
                          t.role === 'assistant'
                            ? 'bg-white border border-neutral-200 shadow-sm'
                            : 'bg-gradient-primary text-white shadow-md'
                        }`}
                      >
                        {/* Show image if this is a screenshot message */}
                        {t.role === 'user' && t.content.includes('screenshot') && t.imageData && (
                          <div className="mb-2">
                            <Image
                              src={t.imageData}
                              alt="Screenshot"
                              width={400}
                              height={200}
                              className="max-w-full h-auto rounded-lg border border-neutral-200 shadow-sm"
                              style={{ maxHeight: '200px', maxWidth: '400px' }}
                            />
                          </div>
                        )}
                        
                        {!(t.role === 'user' && t.content.toLowerCase().includes('screenshot') && t.imageData) && (
                          <div
                            className={`prose max-w-none prose-xs ${
                              t.role === 'assistant'
                                ? 'prose-neutral'
                                : 'prose-invert'
                            } prose-p:my-1 prose-li:my-0 prose-ul:my-1 prose-pre:my-1 text-xs`}
                          >
                            <ReactMarkdown
                              components={{ pre: PreWithCopy }}
                              remarkPlugins={[remarkGfm]}
                            >
                              {t.content}
                            </ReactMarkdown>
                            {t.role === 'assistant' &&
                              i === chatHistory.length - 1 && (
                                <span className="inline-block w-1.5 h-3 bg-primary-400 animate-pulse ml-1 rounded-sm" />
                              )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}

                {isTranscribing && (
                  <div className="flex justify-end">
                    <div className="bg-neutral-200 rounded-xl px-3 py-2 max-w-[90%]">
                      <TranscribingAnimation />
                    </div>
                  </div>
                )}

                {isThinking && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-neutral-200 rounded-xl px-3 py-2 max-w-[90%] shadow-sm">
                      <ThinkingAnimation />
                    </div>
                  </div>
                )}

                {/* Scroll to bottom button */}
                {showScrollIndicator && chatHistory.length > 3 && (
                  <button
                    onClick={() => {
                      chatScrollRef.current?.scrollTo({
                        top: chatScrollRef.current.scrollHeight,
                        behavior: 'smooth'
                      });
                    }}
                    className="fixed bottom-24 right-8 w-10 h-10 bg-primary-500 hover:bg-primary-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center z-10 animate-bounce"
                    title="Scroll to bottom"
                  >
                    <ChevronDown className="w-5 h-5" />
                  </button>
                )}

                <span ref={bottomRef} />
              </div>

              {/* Chat Input */}
              <div className="border-t border-neutral-200 bg-gradient-to-r from-white to-neutral-50 p-4 flex-shrink-0 panel-section-fixed sticky bottom-0">
                <ChatInput
                  onSend={handleTranscriptWithCredits}
                  isLoading={isThinking}
                  placeholder="Type your question here…"
                  disabled={isTranscribing}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    
  );
}
