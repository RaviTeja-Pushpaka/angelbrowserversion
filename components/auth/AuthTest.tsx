'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';

export default function AuthTest() {
  const { user, planId, planName, isUnlimited, loading } = useAuth();

  const setPlan = (newPlanId: string, newPlanName: string) => {
    if (user) {
      localStorage.setItem(`plan_${user.uid}`, newPlanId);
      localStorage.setItem(`planName_${user.uid}`, newPlanName);
      // Reload the page to see the changes
      window.location.reload();
    }
  };

  if (loading) {
    return (
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="text-blue-800">🔄 Loading authentication...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="text-yellow-800">⚠️ No user signed in</div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-green-50 border border-green-200 rounded-lg space-y-3">
      <div className="text-green-800 font-semibold">✅ User Authenticated</div>
      
      <div className="space-y-2 text-sm">
        <div><strong>UID:</strong> {user.uid}</div>
        <div><strong>Email:</strong> {user.email}</div>
        <div><strong>Display Name:</strong> {user.displayName || 'Not set'}</div>
        <div><strong>Photo URL:</strong> {user.photoURL || 'Not set'}</div>
        <div><strong>Email Verified:</strong> {user.emailVerified ? 'Yes' : 'No'}</div>
        <div><strong>Created At:</strong> {user.metadata.creationTime}</div>
        <div><strong>Last Sign In:</strong> {user.metadata.lastSignInTime}</div>
      </div>

      <div className="border-t border-green-200 pt-3">
        <div className="text-green-800 font-semibold">📋 Plan Information</div>
        <div className="space-y-1 text-sm">
          <div><strong>Plan ID:</strong> {planId}</div>
          <div><strong>Plan Name:</strong> {planName}</div>
          <div><strong>Unlimited Access:</strong> {isUnlimited ? 'Yes' : 'No'}</div>
        </div>
      </div>

      <div className="border-t border-green-200 pt-3">
        <div className="text-green-800 font-semibold">💾 Local Storage</div>
        <div className="space-y-1 text-sm">
          <div><strong>Plan Key:</strong> plan_{user.uid}</div>
          <div><strong>Plan Name Key:</strong> planName_{user.uid}</div>
          <div><strong>Stored Plan ID:</strong> {localStorage.getItem(`plan_${user.uid}`) || 'Not found'}</div>
          <div><strong>Stored Plan Name:</strong> {localStorage.getItem(`planName_${user.uid}`) || 'Not found'}</div>
        </div>
      </div>

      <div className="border-t border-green-200 pt-3">
        <div className="text-green-800 font-semibold">🧪 Test Plan Changes</div>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setPlan('free', 'Free')}
            className="px-3 py-1 bg-blue-100 text-blue-800 rounded text-xs hover:bg-blue-200"
          >
            Set Free (10 credits)
          </button>
          <button
            onClick={() => setPlan('pro', 'Pro')}
            className="px-3 py-1 bg-purple-100 text-purple-800 rounded text-xs hover:bg-purple-200"
          >
            Set Pro (20 credits)
          </button>
          <button
            onClick={() => setPlan('ultimate', 'Ultimate')}
            className="px-3 py-1 bg-green-100 text-green-800 rounded text-xs hover:bg-green-200"
          >
            Set Ultimate (Unlimited)
          </button>
          <button
            onClick={() => setPlan('magic', 'Magic')}
            className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded text-xs hover:bg-yellow-200"
          >
            Set Magic (Unlimited)
          </button>
        </div>
      </div>
    </div>
  );
}
