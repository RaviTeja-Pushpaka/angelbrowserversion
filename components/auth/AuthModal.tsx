'use client';

import React, { useState } from 'react';
import { X, Mail, Lock, User, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'signup' | 'upgrade';
}

export default function AuthModal({ isOpen, onClose, initialMode = 'signin' }: AuthModalProps) {
  const [mode, setMode] = useState<'signin' | 'signup' | 'upgrade'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { signIn, signUp, signInWithGoogle } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (mode === 'signin') {
        await signIn(email, password);
      } else {
        await signUp(email, password, displayName);
      }
      onClose();
    } catch (error: any) {
      setError(error.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');

    try {
      await signInWithGoogle();
      onClose();
    } catch (error: any) {
      setError(error.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fade-in-scale">
        {/* Header */}
        <div className="bg-gradient-angel p-6 rounded-t-2xl relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
          
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-white text-center mb-2">
            {mode === 'signin' ? 'Welcome Back' : mode === 'signup' ? 'Join Angel' : 'Upgrade Your Plan'}
          </h2>
          <p className="text-purple-100 text-center">
            {mode === 'signin' 
              ? 'Sign in to continue with your AI assistant' 
              : mode === 'signup'
              ? 'Create your account and get 10 free credits'
              : 'Get unlimited access to all features'
            }
          </p>
        </div>

        {/* Features */}
        <div className="space-y-3 mb-8">
          <div className="flex items-center gap-3 text-sm text-neutral-600">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span>10 free credits to get started</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-neutral-600">
            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
            <span>Voice recording and transcription</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-neutral-600">
            <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
            <span>AI-powered responses and analysis</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-neutral-600">
            <div className="w-2 h-2 bg-pink-400 rounded-full"></div>
            <span>Screenshot analysis and feedback</span>
          </div>
        </div>

        {/* Form */}
        <div className="p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" style={{ display: mode === 'upgrade' ? 'none' : 'block' }}>
            {mode === 'signup' && (
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-400" />
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Enter your full name"
                    required
                  />
                </div>
              </div>
            )}

            {mode === 'upgrade' && (
              <div className="text-center space-y-4">
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-purple-800 mb-2">Upgrade to Magic or Ultimate Plan</h3>
                  <p className="text-purple-700 text-sm mb-4">
                    Get unlimited access to all features including unlimited chat, screenshots, and voice recording.
                  </p>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <span>Unlimited AI responses</span>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                      <span>Unlimited screenshot analysis</span>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                      <span>Unlimited voice transcription</span>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => window.open('https://your-upgrade-url.com', '_blank')}
                  className="w-full bg-gradient-to-r from-green-500 to-blue-500 text-white py-3 rounded-lg font-medium hover:from-green-600 hover:to-blue-600 transition-all duration-200"
                >
                  Upgrade Now
                </button>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter your password"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  {mode === 'signin' ? 'Signing In...' : 'Creating Account...'}
                </div>
              ) : (
                mode === 'signin' ? 'Sign In' : 'Create Account'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center my-6">
            <div className="flex-1 border-t border-neutral-300"></div>
            <span className="px-4 text-sm text-neutral-500">or</span>
            <div className="flex-1 border-t border-neutral-300"></div>
          </div>

          {/* Google Sign In */}
          {mode !== 'upgrade' && (
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full border border-neutral-300 text-neutral-700 py-3 rounded-lg font-medium hover:bg-neutral-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>
          )}

          {/* Mode Toggle */}
          {mode !== 'upgrade' && (
            <div className="text-center mt-6">
              <span className="text-neutral-600">
                {mode === 'signin' ? "Don't have an account? " : "Already have an account? "}
              </span>
              <button
                onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
                className="text-purple-600 hover:text-purple-700 font-medium"
              >
                {mode === 'signin' ? 'Sign Up' : 'Sign In'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
