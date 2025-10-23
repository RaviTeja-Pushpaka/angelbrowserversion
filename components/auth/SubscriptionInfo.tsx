import React from 'react';
import { Coins, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const SubscriptionInfo = () => {
  const { planId, planName, credits } = useAuth();

  if (!planId) return null;

  const getPlanIcon = () => <Coins className="w-4 h-4 text-yellow-600" />;

  const getPlanFeatures = () => [
    `Current balance: ${credits} credits`,
    'Text/chat: 1 credit each',
    'Image analysis: 4 credits each',
    'Transcription: 1 credit each',
  ];

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mb-4">
      <div className="flex items-center gap-3 mb-3">
        {getPlanIcon()}
        <div>
          <h3 className="text-sm font-semibold text-blue-900">
            {planName} Plan
          </h3>
          <p className="text-xs text-blue-600">Credit-based subscription</p>
        </div>
      </div>
      
      <div className="space-y-2">
        {getPlanFeatures().map((feature, index) => (
          <div key={index} className="flex items-center gap-2">
            <CheckCircle className="w-3 h-3 text-blue-500" />
            <span className="text-xs text-blue-700">{feature}</span>
          </div>
        ))}
      </div>
      
      <div className="mt-3 pt-3 border-t border-blue-200">
        <p className="text-xs text-blue-600 text-center">
          Need more credits? Visit the pricing page to top up.
        </p>
      </div>
    </div>
  );
};

export default SubscriptionInfo;
