'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, FileText, Briefcase, ArrowLeft, ArrowRight, CheckCircle, Phone, Users, Settings, MessageSquare, Target, Monitor, Apple, Terminal, Download, Sparkles, Copy, ShieldAlert } from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';

type UseCase = 'interview' | 'sales' | 'meeting' | 'custom';

export default function LandingPage() {
  const router = useRouter();
  const { user, loading: authLoading, signInWithGoogle } = useAuth();
  const [selectedUseCase, setSelectedUseCase] = useState<UseCase | null>(null);
  const [inputData, setInputData] = useState<string>('');
  const [secondaryData, setSecondaryData] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<'welcome' | 'usecase' | 'setup'>('welcome');
  const [fileName, setFileName] = useState<string>('');
  const [showWindowsModal, setShowWindowsModal] = useState(false);
  const [showMacModal, setShowMacModal] = useState(false);
  const [showLinuxModal, setShowLinuxModal] = useState(false);

  // Bottom, glassy desktop download bar
  const DownloadBar = () => (
    <div className="fixed left-1/2 -translate-x-1/2 bottom-6 z-40 w-full max-w-5xl px-4">
      <div className="backdrop-blur-xl bg-white/60 border border-white/80 shadow-xl rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-center sm:text-left text-[12px] sm:text-sm text-neutral-700">
          <div>You are using the browser version. Want Angel to stay hidden even when you share your entire screen?</div>
          <div className="font-medium">Download the desktop app instead. it is much more faster than Browser version</div>
        </div>
        <div className="flex items-center gap-3 flex-wrap justify-center">
          <button
            onClick={() => setShowWindowsModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-white bg-[#2563eb] hover:bg-[#1d4ed8] shadow-md text-xs sm:text-sm"
            title="Download for Windows"
          >
            <Monitor className="w-4 h-4" />
            <span className="font-semibold">Windows</span>
          </button>
          <button
            onClick={() => setShowMacModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-white bg-[#111827] hover:bg-black shadow-md text-xs sm:text-sm"
            title="Download for macOS"
          >
            <Apple className="w-4 h-4" />
            <span className="font-semibold">macOS</span>
          </button>
          <button
            onClick={() => setShowLinuxModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-white bg-[#ea580c] hover:bg-[#c2410c] shadow-md text-xs sm:text-sm"
            title="Download for Linux"
          >
            <Terminal className="w-4 h-4" />
            <span className="font-semibold">Linux</span>
          </button>
        </div>
        <div className="text-[10px] text-neutral-500 text-center sm:text-right">
          Not downloading? <a className="underline hover:text-neutral-700" href={process.env.NEXT_PUBLIC_FALLBACK_DOWNLOAD_URL} target="_blank" rel="noreferrer">Click here</a>
        </div>
      </div>
    </div>
  );

  // Show loading screen while authentication is initializing
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-angel rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-xl font-semibold text-neutral-800 mb-2">Loading Angel...</h2>
          <p className="text-neutral-600">Initializing your AI assistant</p>
        </div>
      </div>
    );
  }

  // If user is already authenticated, show a different message
  if (user) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-6xl sm:text-8xl font-extrabold text-gradient mb-2 tracking-tight">Angel AI</h1>
          <p className="text-sm sm:text-base text-neutral-500 mb-4">Invisible guardian angel</p>
          <h2 className="text-2xl font-bold text-neutral-800 mb-3">
            Welcome back!
          </h2>
          <p className="text-neutral-600 mb-6">
            You&apos;re already signed in. Go to your dashboard to continue.
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 mx-auto"
          >
            <MessageSquare className="h-4 w-4" />
            Go to Dashboard
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
        <DownloadBar />

        {/* Modals for desktop downloads */}
        {showWindowsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50" onClick={() => setShowWindowsModal(false)}></div>
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6">
              <div className="flex items-center gap-3 mb-2">
                <Monitor className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-neutral-800">Download for Windows</h3>
              </div>
              <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 text-blue-800 border border-blue-100">
                <ShieldAlert className="w-4 h-4 mt-0.5" />
                <div className="text-xs leading-relaxed">
                  <div className="font-semibold mb-1">Windows Security Warning</div>
                  Windows might show a security warning when downloading. This is normal for new applications. If you see a warning:<br/>
                  1) Click &quot;More info&quot; or &quot;View more options&quot;<br/>
                  2) Click &quot;Run anyway&quot; or &quot;Install anyway&quot;<br/>
                  The app will install normally.
                </div>
              </div>
              <div className="mt-4">
                <a
                  href={process.env.NEXT_PUBLIC_WINDOWS_DOWNLOAD_URL || process.env.NEXT_PUBLIC_FALLBACK_DOWNLOAD_URL}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md"
                >
                  <Download className="w-4 h-4" /> Download Angel for Windows
                </a>
                <div className="text-[10px] text-neutral-500 mt-2 text-center">Safe and secure download from our official servers</div>
              </div>
              <button className="absolute top-3 right-3 text-neutral-400 hover:text-neutral-600" onClick={() => setShowWindowsModal(false)}>✕</button>
            </div>
          </div>
        )}

        {showMacModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50" onClick={() => setShowMacModal(false)}></div>
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
              <div className="flex items-center gap-3 mb-4">
                <Apple className="w-5 h-5 text-neutral-900" />
                <h3 className="text-lg font-semibold text-neutral-800">Download for macOS</h3>
              </div>
              <div className="text-sm text-neutral-600 mb-4">Universal build for all Mac models:</div>
              <div className="mt-4">
                <a
                  href={process.env.NEXT_PUBLIC_MAC_DOWNLOAD_URL || process.env.NEXT_PUBLIC_FALLBACK_DOWNLOAD_URL}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-neutral-900 hover:bg-black text-white font-semibold shadow-md"
                >
                  <Download className="w-4 h-4" /> Download Angel for macOS
                </a>
                <div className="text-[10px] text-neutral-500 mt-2 text-center">Compatible with both Intel and Apple Silicon Macs</div>
              </div>
              <div className="text-[10px] text-neutral-500 mt-3 text-center">Not downloading? <a className="underline hover:text-neutral-700" href={process.env.NEXT_PUBLIC_FALLBACK_DOWNLOAD_URL} target="_blank" rel="noreferrer">Click here</a></div>
              <button className="absolute top-3 right-3 text-neutral-400 hover:text-neutral-600" onClick={() => setShowMacModal(false)}>✕</button>
            </div>
          </div>
        )}

        {showLinuxModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50" onClick={() => setShowLinuxModal(false)}></div>
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6">
              <div className="flex items-center gap-3 mb-4">
                <Terminal className="w-5 h-5 text-orange-600" />
                <h3 className="text-lg font-semibold text-neutral-800">Download for Linux</h3>
              </div>
              <div className="text-sm text-neutral-600 mb-4">Choose your processor architecture:</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="rounded-xl border border-neutral-200 p-4">
                  <div className="font-semibold text-neutral-800 mb-1">AppImage (x64)</div>
                  <div className="text-xs text-neutral-500 mb-3">For Intel/AMD processors</div>
                  <a
                    href={process.env.NEXT_PUBLIC_LINUX_APPIMAGE_DOWNLOAD_URL || process.env.NEXT_PUBLIC_FALLBACK_DOWNLOAD_URL}
                    className="inline-flex items-center gap-2 text-white bg-orange-600 hover:bg-orange-700 px-3 py-2 rounded-lg text-xs font-semibold mb-3"
                  >
                    <Download className="w-3 h-3"/> Download x64 AppImage
                  </a>
                  <div className="text-xs text-neutral-600 mb-1">Run this command in terminal:</div>
                  <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-2 text-[11px] text-neutral-800 flex items-center justify-between">
                    <code>chmod +x angel-x64.AppImage && ./angel-x64.AppImage</code>
                    <button
                      className="ml-2 text-neutral-500 hover:text-neutral-700"
                      onClick={() => navigator.clipboard.writeText('chmod +x angel-x64.AppImage && ./angel-x64.AppImage')}
                      title="Copy"
                    >
                      <Copy className="w-3 h-3"/>
                    </button>
                  </div>
                </div>

                <div className="rounded-xl border border-neutral-200 p-4">
                  <div className="font-semibold text-neutral-800 mb-1">AppImage (ARM64)</div>
                  <div className="text-xs text-neutral-500 mb-3">For ARM-based processors</div>
                  <a
                    href={process.env.NEXT_PUBLIC_LINUX_APPIMAGE_AR64_DOWNLOAD_URL || process.env.NEXT_PUBLIC_FALLBACK_DOWNLOAD_URL}
                    className="inline-flex items-center gap-2 text-white bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded-lg text-xs font-semibold mb-3"
                  >
                    <Download className="w-3 h-3"/> Download ARM64 AppImage
                  </a>
                  <div className="text-xs text-neutral-600 mb-1">Run this command in terminal:</div>
                  <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-2 text-[11px] text-neutral-800 flex items-center justify-between">
                    <code>chmod +x angel-arm64.AppImage && ./angel-arm64.AppImage</code>
                    <button
                      className="ml-2 text-neutral-500 hover:text-neutral-700"
                      onClick={() => navigator.clipboard.writeText('chmod +x angel-arm64.AppImage && ./angel-arm64.AppImage')}
                      title="Copy"
                    >
                      <Copy className="w-3 h-3"/>
                    </button>
                  </div>
                  <div className="text-[10px] text-neutral-500 mt-2">Note: Most modern ARM laptops and Raspberry Pi devices use ARM64.</div>
                </div>
              </div>
              <div className="text-[10px] text-neutral-500 mt-3 text-center">Not downloading? <a className="underline hover:text-neutral-700" href={process.env.NEXT_PUBLIC_FALLBACK_DOWNLOAD_URL} target="_blank" rel="noreferrer">Click here</a></div>
              <button className="absolute top-3 right-3 text-neutral-400 hover:text-neutral-600" onClick={() => setShowLinuxModal(false)}>✕</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setInputData(text);
      };

      // Handle different file types
      if (file.type === 'application/pdf') {
        // For PDF files, show a message that text extraction is limited
        setInputData(`[PDF File: ${file.name}]\n\nPlease copy and paste your content in the text area below for better AI assistance.`);
      } else {
        reader.readAsText(file);
      }
    }
  };



  const handleGetStarted = async () => {
    if (!selectedUseCase) {
      alert('Please select a use case first');
      return;
    }

    if (!inputData.trim() && selectedUseCase !== 'custom') {
      alert('Please provide the required information');
      return;
    }

    setIsProcessing(true);

    try {
      // Call the new API to update the system prompt
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'update_profile',
          useCase: selectedUseCase,
          customData: inputData.trim() + (secondaryData.trim() ? `\n\nAdditional Context:\n${secondaryData.trim()}` : '')
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      // Navigate to main panel (authentication will be handled there)
      router.push('/dashboard');
    } catch (error) {
      console.error('Error processing information:', error);
      alert('Something went wrong. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      // After successful sign-in, the user will be redirected to panel
    } catch (error) {
      console.error('Google sign in error:', error);
      alert('Failed to sign in with Google. Please try again.');
    }
  };

  if (step === 'welcome') {
    return (
      <div className="min-h-screen bg-gradient-subtle flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 animate-fade-in-up relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-300/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-300/10 rounded-full blur-3xl"></div>
        </div>

        {/* Hero Section */}
        <div className="max-w-6xl w-full mx-auto text-center relative z-10">
          {/* Brand wordmark */}
          <h1 className="text-7xl sm:text-8xl lg:text-9xl font-extrabold text-gradient mb-3 sm:mb-4 tracking-tight drop-shadow-[0_2px_8px_rgba(168,85,247,0.25)]">
            Angel AI
          </h1>
          <p className="text-base sm:text-xl text-neutral-500 max-w-2xl mx-auto mb-14">Invisible guardian angel</p>

          {/* CTA Buttons */}
          <div className="flex flex-col items-center gap-6">
            <button
              onClick={handleGoogleSignIn}
              className="btn-professional btn-primary text-xl px-16 py-6 group animate-fade-in-scale shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 flex items-center gap-3"
              style={{animationDelay: '0.3s'}}
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Get Started with Angel Browser Version
              <ArrowRight className="h-6 w-6 group-hover:translate-x-1 transition-transform" />
            </button>

            <div className="flex items-center gap-8 text-sm text-neutral-400">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>Free to Test</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span>10 free credits</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                <span>Privacy focused</span>
              </div>
            </div>
          </div>

          <DownloadBar />

          {/* Windows Modal */}
          {showWindowsModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/50" onClick={() => setShowWindowsModal(false)}></div>
              <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Monitor className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-neutral-800">Download for Windows</h3>
                </div>
                <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 text-blue-800 border border-blue-100">
                  <ShieldAlert className="w-4 h-4 mt-0.5" />
                  <div className="text-xs leading-relaxed">
                    <div className="font-semibold mb-1">Windows Security Warning</div>
                    Windows might show a security warning when downloading. This is normal for new applications. If you see a warning:<br/>
                    1) Click &quot;More info&quot; or &quot;View more options&quot;<br/>
                    2) Click &quot;Run anyway&quot; or &quot;Install anyway&quot;<br/>
                    The app will install normally.
                  </div>
                </div>
                <div className="mt-4">
                  <a
                    href={process.env.NEXT_PUBLIC_WINDOWS_DOWNLOAD_URL || process.env.NEXT_PUBLIC_FALLBACK_DOWNLOAD_URL}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md"
                  >
                    <Download className="w-4 h-4" /> Download Angel for Windows
                  </a>
                  <div className="text-[10px] text-neutral-500 mt-2 text-center">Safe and secure download from our official servers</div>
                </div>
                <button className="absolute top-3 right-3 text-neutral-400 hover:text-neutral-600" onClick={() => setShowWindowsModal(false)}>✕</button>
              </div>
            </div>
          )}

          {/* Mac Modal */}
          {showMacModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/50" onClick={() => setShowMacModal(false)}></div>
              <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Apple className="w-5 h-5 text-neutral-900" />
                  <h3 className="text-lg font-semibold text-neutral-800">Download for macOS</h3>
                </div>
                <div className="text-sm text-neutral-600 mb-4">Universal build for all Mac models:</div>
                <div className="mt-4">
                  <a
                    href={process.env.NEXT_PUBLIC_MAC_DOWNLOAD_URL || process.env.NEXT_PUBLIC_FALLBACK_DOWNLOAD_URL}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-neutral-900 hover:bg-black text-white font-semibold shadow-md"
                  >
                    <Download className="w-4 h-4" /> Download Angel for macOS
                  </a>
                  <div className="text-[10px] text-neutral-500 mt-2 text-center">Compatible with both Intel and Apple Silicon Macs</div>
                </div>
                <div className="text-[10px] text-neutral-500 mt-3 text-center">Not downloading? <a className="underline hover:text-neutral-700" href={process.env.NEXT_PUBLIC_FALLBACK_DOWNLOAD_URL} target="_blank" rel="noreferrer">Click here</a></div>
                <button className="absolute top-3 right-3 text-neutral-400 hover:text-neutral-600" onClick={() => setShowMacModal(false)}>✕</button>
              </div>
            </div>
          )}

          {/* Linux Modal */}
          {showLinuxModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/50" onClick={() => setShowLinuxModal(false)}></div>
              <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Terminal className="w-5 h-5 text-orange-600" />
                  <h3 className="text-lg font-semibold text-neutral-800">Download for Linux</h3>
                </div>
                <div className="text-sm text-neutral-600 mb-4">Choose your processor architecture:</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="rounded-xl border border-neutral-200 p-4">
                    <div className="font-semibold text-neutral-800 mb-1">AppImage (x64)</div>
                    <div className="text-xs text-neutral-500 mb-3">For Intel/AMD processors</div>
                    <a
                      href={process.env.NEXT_PUBLIC_LINUX_APPIMAGE_DOWNLOAD_URL || process.env.NEXT_PUBLIC_FALLBACK_DOWNLOAD_URL}
                      className="inline-flex items-center gap-2 text-white bg-orange-600 hover:bg-orange-700 px-3 py-2 rounded-lg text-xs font-semibold mb-3"
                    >
                      <Download className="w-3 h-3"/> Download x64 AppImage
                    </a>
                    <div className="text-xs text-neutral-600 mb-1">Run this command in terminal:</div>
                    <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-2 text-[11px] text-neutral-800 flex items-center justify-between">
                      <code>chmod +x angel-x64.AppImage && ./angel-x64.AppImage</code>
                      <button
                        className="ml-2 text-neutral-500 hover:text-neutral-700"
                        onClick={() => navigator.clipboard.writeText('chmod +x angel-x64.AppImage && ./angel-x64.AppImage')}
                        title="Copy"
                      >
                        <Copy className="w-3 h-3"/>
                      </button>
                    </div>
                  </div>

                  <div className="rounded-xl border border-neutral-200 p-4">
                    <div className="font-semibold text-neutral-800 mb-1">AppImage (ARM64)</div>
                    <div className="text-xs text-neutral-500 mb-3">For ARM-based processors</div>
                    <a
                      href={process.env.NEXT_PUBLIC_LINUX_APPIMAGE_AR64_DOWNLOAD_URL || process.env.NEXT_PUBLIC_FALLBACK_DOWNLOAD_URL}
                      className="inline-flex items-center gap-2 text-white bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded-lg text-xs font-semibold mb-3"
                    >
                      <Download className="w-3 h-3"/> Download ARM64 AppImage
                    </a>
                    <div className="text-xs text-neutral-600 mb-1">Run this command in terminal:</div>
                    <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-2 text-[11px] text-neutral-800 flex items-center justify-between">
                      <code>chmod +x angel-arm64.AppImage && ./angel-arm64.AppImage</code>
                      <button
                        className="ml-2 text-neutral-500 hover:text-neutral-700"
                        onClick={() => navigator.clipboard.writeText('chmod +x angel-arm64.AppImage && ./angel-arm64.AppImage')}
                        title="Copy"
                      >
                        <Copy className="w-3 h-3"/>
                      </button>
                    </div>
                    <div className="text-[10px] text-neutral-500 mt-2">Note: Most modern ARM laptops and Raspberry Pi devices use ARM64.</div>
                  </div>
                </div>
                <div className="text-[10px] text-neutral-500 mt-3 text-center">Not downloading? <a className="underline hover:text-neutral-700" href={process.env.NEXT_PUBLIC_FALLBACK_DOWNLOAD_URL} target="_blank" rel="noreferrer">Click here</a></div>
                <button className="absolute top-3 right-3 text-neutral-400 hover:text-neutral-600" onClick={() => setShowLinuxModal(false)}>✕</button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (step === 'usecase') {
    const useCases = [
      {
        id: 'interview' as UseCase,
        title: 'Interview',
        description: 'Get personalized assistance during job interviews',
        icon: MessageSquare,
        color: 'from-purple-500 to-pink-500'
      },
      {
        id: 'sales' as UseCase,
        title: 'Sales Call',
        description: 'Boost your sales performance with AI guidance',
        icon: Phone,
        color: 'from-blue-500 to-purple-500'
      },
      {
        id: 'meeting' as UseCase,
        title: 'Business Meeting',
        description: 'Stay on track during important business discussions',
        icon: Users,
        color: 'from-green-500 to-blue-500'
      },
      {
        id: 'custom' as UseCase,
        title: 'Custom',
        description: 'Create your own AI assistant with custom prompts',
        icon: Settings,
        color: 'from-orange-500 to-red-500'
      }
    ];

    return (
      <div className="min-h-screen bg-gradient-subtle flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 animate-fade-in-up relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-300/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-300/5 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-5xl w-full mx-auto relative z-10">
          <div className="text-center mb-16">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-gradient-angel rounded-2xl flex items-center justify-center shadow-lg">
                <Target className="h-8 w-8 text-white" />
              </div>
            </div>
            <h2 className="text-5xl font-bold text-gradient mb-6">Choose Your Use Case</h2>
            <p className="text-xl text-neutral-600 max-w-3xl mx-auto leading-relaxed">
              Select how you&apos;d like Angel to assist you in your professional scenarios
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            {useCases.map((useCase, index) => (
              <button
                key={useCase.id}
                onClick={() => {
                  setSelectedUseCase(useCase.id);
                  setStep('setup');
                }}
                className="card-professional p-8 text-left hover:scale-105 hover:shadow-2xl transition-all duration-300 animate-fade-in-scale group relative overflow-hidden"
                style={{animationDelay: `${index * 0.1}s`}}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 to-pink-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative z-10">
                  <div className={`flex items-center justify-center w-20 h-20 bg-gradient-to-r ${useCase.color} rounded-2xl mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <useCase.icon className="h-10 w-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-semibold text-neutral-800 mb-4 group-hover:text-purple-700 transition-colors">
                    {useCase.title}
                  </h3>
                  <p className="text-neutral-600 text-lg leading-relaxed">
                    {useCase.description}
                  </p>
                </div>
              </button>
            ))}
          </div>

          <div className="text-center">
            <button
              onClick={() => setStep('welcome')}
              className="btn-professional btn-secondary flex items-center gap-2 mx-auto"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Welcome
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Setup screen for selected use case
  const getSetupConfig = () => {
    switch (selectedUseCase) {
      case 'interview':
        return {
          title: 'Setup Your Interview Profile',
          subtitle: 'Upload your resume and job details to get personalized assistance',
          primaryLabel: 'Resume / CV',
          primaryPlaceholder: 'Paste your resume content here...',
          secondaryLabel: 'Job Description',
          secondaryPlaceholder: 'Paste the job description here to get more targeted assistance...',
          icon: FileText,
          required: true
        };
      case 'sales':
        return {
          title: 'Setup Your Sales Assistant',
          subtitle: 'Provide your sales script and context for better guidance',
          primaryLabel: 'Sales Script / Pitch',
          primaryPlaceholder: 'Paste your sales script, pitch deck, or talking points here...',
          secondaryLabel: 'Additional Context',
          secondaryPlaceholder: 'Product details, target audience, common objections, etc...',
          icon: Phone,
          required: true
        };
      case 'meeting':
        return {
          title: 'Setup Your Meeting Assistant',
          subtitle: 'Provide meeting context and agenda for better support',
          primaryLabel: 'Meeting Context',
          primaryPlaceholder: 'Describe the meeting purpose, agenda, key topics, participants...',
          secondaryLabel: 'Additional Details',
          secondaryPlaceholder: 'Background information, goals, expected outcomes...',
          icon: Users,
          required: true
        };
      case 'custom':
        return {
          title: 'Create Custom Assistant',
          subtitle: 'Define your own AI assistant with a custom system prompt',
          primaryLabel: 'System Prompt',
          primaryPlaceholder: 'You are a helpful AI assistant that...',
          secondaryLabel: 'Additional Instructions',
          secondaryPlaceholder: 'Any additional context or instructions...',
          icon: Settings,
          required: false
        };
      default:
        return {
          title: 'Setup Assistant',
          subtitle: 'Configure your AI assistant',
          primaryLabel: 'Input',
          primaryPlaceholder: 'Enter your information...',
          secondaryLabel: 'Additional Info',
          secondaryPlaceholder: 'Optional additional information...',
          icon: Settings,
          required: true
        };
    }
  };

  const config = getSetupConfig();

  return (
    <div className="min-h-screen bg-gradient-subtle flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 animate-fade-in-up relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-purple-300/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-pink-300/5 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-5xl w-full mx-auto relative z-10">
        <div className="card-professional overflow-hidden animate-fade-in-scale shadow-2xl">
          {/* Header */}
          <div className="bg-gradient-angel px-8 py-12 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-pink-600/20"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-center w-20 h-20 bg-white/20 rounded-3xl mx-auto mb-6 backdrop-blur-sm shadow-lg">
                <config.icon className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-4xl font-bold text-white mb-4">
                {config.title}
              </h2>
              <p className="text-purple-100 text-xl max-w-2xl mx-auto leading-relaxed">
                {config.subtitle}
              </p>
            </div>
          </div>

          <div className="p-8 lg:p-16 space-y-10">
            {/* Primary Input Section */}
            <div>
              <label className="flex items-center text-2xl font-semibold text-neutral-800 mb-6">
                <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl mr-4 shadow-sm">
                  <config.icon className="h-6 w-6 text-purple-600" />
                </div>
                {config.primaryLabel}
                {config.required && <span className="text-red-500 ml-2">*</span>}
              </label>

              <div className="space-y-4">
                {selectedUseCase === 'interview' && (
                  <>
                    {/* File Upload Area for Resume */}
                    <div className="relative">
                      <input
                        type="file"
                        accept=".txt,.pdf,.doc,.docx"
                        onChange={handleFileUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        id="file-upload"
                      />
                      <label
                        htmlFor="file-upload"
                        className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-neutral-300 rounded-xl hover:border-primary-400 transition-colors cursor-pointer bg-neutral-50 hover:bg-primary-50"
                      >
                        <Upload className="h-8 w-8 text-neutral-400 mb-2" />
                        <span className="text-sm font-medium text-neutral-600">
                          {fileName ? fileName : 'Click to upload resume'}
                        </span>
                        <span className="text-xs text-neutral-500 mt-1">
                          Supports .txt, .pdf, .doc, .docx files
                        </span>
                      </label>
                    </div>

                    <div className="text-center text-neutral-500 text-sm">or</div>
                  </>
                )}

                <textarea
                  value={inputData}
                  onChange={(e) => setInputData(e.target.value)}
                  placeholder={config.primaryPlaceholder}
                  className="input-professional min-h-[200px] scrollbar-professional text-neutral-900 placeholder-neutral-900 opacity-100"
                  style={{ color: '#111827', WebkitTextFillColor: '#111827', backgroundColor: '#ffffff', opacity: 1, fontWeight: 600 } as React.CSSProperties}
                />

                {inputData && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-success-600 text-sm">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Content loaded ({inputData.length} characters)
                    </div>
                    {fileName && (
                      <div className="text-xs text-neutral-500">
                        File: {fileName}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Secondary Input Section */}
            <div>
              <label className="flex items-center text-xl font-semibold text-neutral-800 mb-4">
                <div className="flex items-center justify-center w-10 h-10 bg-primary-100 rounded-xl mr-3">
                  <Briefcase className="h-5 w-5 text-primary-600" />
                </div>
                {config.secondaryLabel}
                <span className="text-neutral-400 ml-2 text-sm font-normal">(Optional)</span>
              </label>

              <textarea
                value={secondaryData}
                onChange={(e) => setSecondaryData(e.target.value)}
                placeholder={config.secondaryPlaceholder}
                className="input-professional min-h-[150px] scrollbar-professional text-neutral-900 placeholder-neutral-900 opacity-100"
                style={{ color: '#111827', WebkitTextFillColor: '#111827', backgroundColor: '#ffffff', opacity: 1, fontWeight: 600 } as React.CSSProperties}
              />
            </div>

            {/* Custom Prompt Examples */}
            {selectedUseCase === 'custom' && (
              <div className="bg-neutral-50 rounded-xl p-6">
                <h4 className="text-lg font-semibold text-neutral-800 mb-4">Example Prompts:</h4>
                <div className="space-y-3 text-sm">
                  <div className="bg-white p-4 rounded-lg border">
                    <strong>Coding Assistant:</strong> &ldquo;You are a senior software engineer helping with code reviews and debugging. Provide clear, concise solutions and best practices.&rdquo;
                  </div>
                  <div className="bg-white p-4 rounded-lg border">
                    <strong>Writing Coach:</strong> &ldquo;You are a professional writing coach. Help improve clarity, grammar, and style while maintaining the author&apos;s voice.&rdquo;
                  </div>
                  <div className="bg-white p-4 rounded-lg border">
                    <strong>Study Buddy:</strong> &ldquo;You are a patient tutor helping students understand complex topics. Break down concepts into simple, digestible explanations.&rdquo;
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-6 justify-between items-center pt-8 border-t border-neutral-200 mt-8">
              <button
                onClick={() => setStep('usecase')}
                className="btn-professional btn-secondary order-2 sm:order-1"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </button>

              <button
                onClick={handleGetStarted}
                disabled={(config.required && !inputData.trim()) || isProcessing}
                className={`btn-professional group text-lg px-8 py-4 order-1 sm:order-2 w-full sm:w-auto shadow-xl ${
                  (config.required && !inputData.trim())
                    ? 'bg-neutral-300 text-neutral-500 cursor-not-allowed shadow-none'
                    : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white hover:shadow-2xl hover:shadow-purple-500/25 transform hover:scale-105 transition-all duration-300'
                }`}
              >
                {isProcessing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                    Setting up Angel...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5 mr-3" />
                    Start with Angel
                    <ArrowRight className="h-5 w-5 ml-3 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
