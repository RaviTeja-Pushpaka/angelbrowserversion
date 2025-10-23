'use client';

import React from 'react';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { User, LogOut, Sparkles } from 'lucide-react';

export default function UserProfile() {
  const { user, planName, credits, logout } = useAuth();

  if (!user) return null;

  const remainingCredits = credits ?? 0;

  return (
    <div className="flex items-center gap-3">
      {/* User Info */}
      <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2">
        <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
          {user.photoURL ? (
            <Image
              src={user.photoURL}
              alt={user.displayName || 'User'}
              width={32}
              height={32}
              className="w-8 h-8 rounded-full"
            />
          ) : (
            <User className="h-4 w-4 text-white" />
          )}
        </div>
        
        <div className="text-left">
          <div className="text-sm font-medium text-white">
            {user.displayName || user.email}
          </div>
          <div className="flex items-center gap-2 text-xs text-white/80">
            <Sparkles className="h-3 w-3 text-blue-400" />
            <span>{planName} - {remainingCredits} credits left</span>
          </div>
        </div>
      </div>

      {/* Logout Button */}
      <button
        onClick={logout}
        className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
        title="Sign Out"
      >
        <LogOut className="h-4 w-4" />
      </button>
    </div>
  );
}
