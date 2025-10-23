'use client';

import React from 'react';
import { X, ExternalLink, Sparkles, Crown, Zap, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface CreditsExhaustedModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreditsExhaustedModal({ isOpen, onClose }: CreditsExhaustedModalProps) {
  const { logout } = useAuth();

  const handleUpgrade = () => {
    window.open('https://lazyjobseeker.com/pricing', '_blank');
    onClose();
  };

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      window.location.href = '/';
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 credits-exhausted-modal" 
      style={{ 
        zIndex: 999999,
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'auto'
      }}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-fade-in-scale relative modal-content"
        style={{ 
          zIndex: 1000000,
          position: 'relative',
          maxHeight: '90vh',
          overflow: 'auto'
        }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-6 rounded-t-2xl relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
          >
            <X className="h-6 w-6" />
          </button>

          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-white text-center mb-2">
            Credits Exhausted
          </h2>
          <p className="text-purple-100 text-center">
            You&apos;ve used all your free credits. Upgrade to continue using Angel!
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="bg-neutral-50 rounded-xl p-4 mb-6">
              <h3 className="text-lg font-semibold text-neutral-800 mb-3">
                Choose Your Plan
              </h3>
              
              {/* Plan Options */}
              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between py-2 px-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium text-blue-700">Free Plan</span>
                  </div>
                  <span className="text-xs text-blue-600">10 credits</span>
                </div>
                
                <div className="flex items-center justify-between py-2 px-3 bg-yellow-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Crown className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm font-medium text-yellow-700">Magic Plan</span>
                  </div>
                  <span className="text-xs text-yellow-600">Unlimited</span>
                </div>
                
                <div className="flex items-center justify-between py-2 px-3 bg-purple-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Crown className="h-4 w-4 text-purple-500" />
                    <span className="text-sm font-medium text-purple-700">Ultimate Plan</span>
                  </div>
                  <span className="text-xs text-purple-600">Unlimited</span>
                </div>
              </div>
            </div>

            <div className="space-y-3 text-sm text-neutral-600 mb-6">
              <div className="flex items-center justify-between py-2 border-b border-neutral-100">
                <span>Text responses</span>
                <span className="font-medium">1 credit each</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-neutral-100">
                <span>Image analysis</span>
                <span className="font-medium">4 credits each</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span>Voice transcription</span>
                <span className="font-medium">1 credit each</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleUpgrade}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 transition-all duration-200 flex items-center justify-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Upgrade Now
            </button>

            <button
              onClick={handleLogout}
              className="w-full border border-neutral-300 text-neutral-700 py-3 rounded-lg font-medium hover:bg-neutral-50 transition-colors flex items-center justify-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Log Out
            </button>
          </div>

          <div className="mt-4 text-center">
            <p className="text-xs text-neutral-500">
              You&apos;ll be redirected to our pricing page to choose a plan that works for you.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
