'use client';

import React from 'react';
import { Coins, Image, MessageSquare } from 'lucide-react';
import { CREDIT_COSTS } from '@/lib/creditService';
import { useAuth } from '@/contexts/AuthContext';

interface CreditCostIndicatorProps {
  isImageRequest?: boolean;
  className?: string;
}

export default function CreditCostIndicator({ isImageRequest = false, className = '' }: CreditCostIndicatorProps) {
  const { user, credits, hasCredits } = useAuth();
  
  if (!user) return null;

  const cost = isImageRequest ? CREDIT_COSTS.image : CREDIT_COSTS.text;
  const canAfford = hasCredits(cost);

  return (
    <div className={`flex items-center gap-2 text-xs ${className}`}>
      <div className="flex items-center gap-1">
        {isImageRequest ? (
          // eslint-disable-next-line jsx-a11y/alt-text
          <Image className="h-3 w-3 text-purple-500" />
        ) : (
          <MessageSquare className="h-3 w-3 text-purple-500" />
        )}
        <span className="text-neutral-600">
          {isImageRequest ? 'Image analysis' : 'Text response'}
        </span>
      </div>
      
      <div className={`flex items-center gap-1 px-2 py-1 rounded-md ${
        canAfford 
          ? 'bg-green-50 text-green-700 border border-green-200' 
          : 'bg-red-50 text-red-700 border border-red-200'
      }`}>
        <Coins className="h-3 w-3" />
        <span className="font-medium">{cost} credit{cost > 1 ? 's' : ''}</span>
      </div>

      <div className="text-neutral-500">
        Balance: {credits}
      </div>
    </div>
  );
}
