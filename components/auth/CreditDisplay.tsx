'use client';

import React from 'react';
import { Coins } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface CreditDisplayProps {
  className?: string;
}

export default function CreditDisplay({ className = '' }: CreditDisplayProps) {
  const { credits, user } = useAuth();

  if (!user) return null;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex items-center gap-1.5 bg-gradient-to-r from-purple-100 to-pink-100 px-3 py-1.5 rounded-lg border border-purple-200">
        <Coins className="h-4 w-4 text-purple-600" />
        <span className="text-sm font-medium text-purple-700">
          {credits} credits
        </span>
      </div>
    </div>
  );
}
