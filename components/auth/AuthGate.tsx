'use client';

import React from 'react';
import { Sparkles, ArrowRight, Shield } from 'lucide-react';

interface AuthGateProps {
  onSignIn: () => void;
  onSignUp: () => void;
}

export default function AuthGate({ onSignIn, onSignUp }: AuthGateProps) {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="max-w-md w-full text-center">
        {/* Angel Logo */}
        <div className="flex items-center justify-center mb-6">
          <div className="w-16 h-16 bg-gradient-angel rounded-2xl flex items-center justify-center shadow-lg">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
        </div>

        {/* Welcome Message */}
        <h2 className="text-2xl font-bold text-neutral-800 mb-3">
          Welcome to Angel
        </h2>
        <p className="text-neutral-600 mb-6 leading-relaxed">
          Your AI-powered assistant for interviews, sales calls, meetings, and more. 
          Sign in to start your conversation with Angel.
        </p>

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

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={onSignUp}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
          >
            <Sparkles className="h-4 w-4" />
            Get Started Free
            <ArrowRight className="h-4 w-4" />
          </button>
          
          <button
            onClick={onSignIn}
            className="w-full border border-neutral-300 text-neutral-700 font-medium py-3 px-6 rounded-lg hover:bg-neutral-50 transition-colors"
          >
            Sign In to Existing Account
          </button>
        </div>

        {/* Security Note */}
        <div className="flex items-center justify-center gap-2 mt-6 text-xs text-neutral-500">
          <Shield className="h-3 w-3" />
          <span>Secure authentication with Firebase</span>
        </div>
      </div>
    </div>
  );
}
