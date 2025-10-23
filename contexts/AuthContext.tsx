'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  planId: string;
  planName: string;
  isUnlimited: boolean; // kept for compatibility, always false in new model
  credits: number;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  deductCredits: (amount: number) => Promise<void>;
  hasCredits: (amount: number) => boolean;
  refreshPlanFromUrl: () => void;
  refreshSubscription: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [planId, setPlanId] = useState<string>('free');
  const [planName, setPlanName] = useState<string>('Free');
  const [isUnlimited, setIsUnlimited] = useState(false);
  const [credits, setCredits] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const applyPlanFromUrl = (uid: string) => {
    try {
      const params = new URLSearchParams(window.location.search);
      const urlPlan = params.get('plan');
      if (!urlPlan) return { updated: false };
      const normalized = urlPlan.toLowerCase();
      const derivedName = normalized.startsWith('magic')
        ? 'Magic'
        : normalized.startsWith('ultimate')
        ? 'Ultimate'
        : 'Free';
      localStorage.setItem(`plan_${uid}`, normalized);
      localStorage.setItem(`planName_${uid}`, derivedName);
      if (window.history && window.history.replaceState) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
      return { updated: true, planId: normalized, planName: derivedName };
    } catch (e) {
      console.warn('URL plan sync skipped:', e);
      return { updated: false };
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('🔥 Firebase Auth State Changed:', user);
      
      if (user) {
        console.log('👤 User Details:', {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          emailVerified: user.emailVerified,
          metadata: user.metadata
        });
        
        setUser(user);
        
        // Apply plan from URL if present
        const urlApplied = applyPlanFromUrl(user.uid);
        // Try Firestore first (authoritative), then URL override, then localStorage, else free
        let storedPlanId = 'free';
        let storedPlanName = 'Free';
        let subscriptionData: any | null = null;
        let subscriptionSource: 'root' | 'subdoc' | null = null;
        try {
          // A) Preferred: subscription map on user doc (users/{uid})
          const userDocRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userDocRef);
          if (userSnap.exists()) {
            const base = userSnap.data() as any;
            if (base?.subscription) {
              subscriptionData = base.subscription;
              subscriptionSource = 'root';
            }
          }
          // B) Legacy subcollection fallback (users/{uid}/subscriptions/current)
          if (!subscriptionData) {
            const currentRef = doc(db, 'users', user.uid, 'subscriptions', 'current');
            const currentSnap = await getDoc(currentRef);
            if (currentSnap.exists()) {
              subscriptionData = currentSnap.data();
              subscriptionSource = 'subdoc';
            }
          }
          // C) Email-keyed fallback
          if (!subscriptionData && user.email) {
            const emailDocRef = doc(db, 'users', user.email);
            const emailSnap = await getDoc(emailDocRef);
            if (emailSnap.exists()) {
              const base = emailSnap.data() as any;
              if (base?.subscription) {
                subscriptionData = base.subscription;
                subscriptionSource = 'root';
              }
            }
          }

          if (subscriptionData) {
            const rawPlanId = (
              subscriptionData.planId || subscriptionData.plan_id || subscriptionData.plan || subscriptionData.tier || ''
            ).toString();
            const rawPlanName = (
              subscriptionData.planName || subscriptionData.plan_name || subscriptionData.name || ''
            ).toString();
            const status = (subscriptionData.status || '').toString().toLowerCase();
            if (rawPlanId) storedPlanId = rawPlanId.toLowerCase();
            if (rawPlanName) storedPlanName = rawPlanName || storedPlanName;
            // Persist plan for UX (non-authoritative)
            if (!status || ['active', 'paid', 'trialing'].includes(status)) {
              localStorage.setItem(`plan_${user.uid}`, storedPlanId);
              localStorage.setItem(`planName_${user.uid}`, storedPlanName);
            }
          }
        } catch (e) {
          console.warn('Firestore plan fetch failed:', e);
        }

        if (urlApplied.updated) {
          storedPlanId = (urlApplied.planId as string).toLowerCase();
          storedPlanName = urlApplied.planName as string;
        } else {
          storedPlanId = localStorage.getItem(`plan_${user.uid}`) || storedPlanId;
          storedPlanName = localStorage.getItem(`planName_${user.uid}`) || storedPlanName;
        }
        
        console.log('📋 Stored Plan Info:', { storedPlanId, storedPlanName });
        
        setPlanId(storedPlanId);
        setPlanName(storedPlanName);
        setIsUnlimited(false); // new model: everything is credits-based

        // Determine credits from Firestore subscription; initialize if missing
        try {
          let currentCredits: number | undefined = undefined;
          if (subscriptionData && typeof subscriptionData.credits === 'number') {
            currentCredits = subscriptionData.credits;
          }

          if (currentCredits === undefined || currentCredits === null) {
            // Initialize defaults based on plan
            const plan = storedPlanId;
            let defaultCredits = 10; // fallback for free/others
            if (plan.startsWith('pro')) defaultCredits = 600;
            else if (plan === 'ultimate' || plan.startsWith('ultimate-')) defaultCredits = 1500;
            else if (plan === 'magic' || plan.startsWith('magic-')) defaultCredits = 4000;

            setCredits(defaultCredits);

            // Write back to users/{uid}.subscription (authoritative container)
            const userDocRef = doc(db, 'users', user.uid);
            const existingRoot = await getDoc(userDocRef);
            const base = existingRoot.exists() ? (existingRoot.data() as any) : {};
            const newSubscription = {
              ...(base.subscription || {}),
              ...(subscriptionData || {}),
              planId: storedPlanId,
              planName: storedPlanName,
              credits: defaultCredits,
            };
            await setDoc(userDocRef, { ...base, subscription: newSubscription }, { merge: true });
          } else {
            setCredits(currentCredits);
          }
        } catch (e) {
          console.warn('Failed to initialize/load credits from Firestore:', e);
        }

        console.log('✅ Final Plan Status:', {
          planId: storedPlanId,
          planName: storedPlanName,
          isUnlimited: false,
          // credits will be in state
        });
      } else {
        console.log('🚪 User signed out, resetting state');
        setUser(null);
        setPlanId('free');
        setPlanName('Free');
        setIsUnlimited(false);
        setCredits(0);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      console.log('🔐 Attempting sign in for:', email);
      const result = await signInWithEmailAndPassword(auth, email, password);
      console.log('✅ Sign in successful:', result.user.uid);
    } catch (error) {
      console.error('❌ Sign in error:', error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, displayName: string) => {
    try {
      console.log('📝 Attempting sign up for:', email, 'with name:', displayName);
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update user profile with display name
      await updateProfile(result.user, {
        displayName: displayName
      });
      
      console.log('✅ Sign up successful:', result.user.uid);
      
      // Set default free plan for new users
      localStorage.setItem(`plan_${result.user.uid}`, 'free');
      localStorage.setItem(`planName_${result.user.uid}`, 'Free');
      
      setPlanId('free');
      setPlanName('Free');
      setIsUnlimited(false);
    } catch (error) {
      console.error('❌ Sign up error:', error);
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      console.log('🔐 Attempting Google sign in');
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      console.log('✅ Google sign in successful:', result.user.uid);
      
      // Set default free plan for new Google users
      if (!localStorage.getItem(`plan_${result.user.uid}`)) {
        localStorage.setItem(`plan_${result.user.uid}`, 'free');
        localStorage.setItem(`planName_${result.user.uid}`, 'Free');
      }
    } catch (error) {
      console.error('❌ Google sign in error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      console.log('🚪 Logging out user');
      await signOut(auth);
      setPlanId('free');
      setPlanName('Free');
      setIsUnlimited(false);
      setCredits(0);
    } catch (error) {
      console.error('❌ Logout error:', error);
      throw error;
    }
  };

  // Credit management functions (authoritative in Firestore)
  const deductCredits = async (amount: number) => {
    if (!user) return;
    const current = credits ?? 0;
    const newCredits = Math.max(0, current - amount);
    setCredits(newCredits); // optimistic update

    try {
      const userDocRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userDocRef);
      const base = userSnap.exists() ? (userSnap.data() as any) : {};
      const subscription = {
        ...(base.subscription || {}),
        planId,
        planName,
        credits: newCredits,
      };
      await setDoc(userDocRef, { ...base, subscription }, { merge: true });
    } catch (e) {
      console.warn('Failed to persist credits to Firestore (will retry on next change):', e);
    }
  };

  const hasCredits = (amount: number) => {
    return (credits ?? 0) >= amount;
  };

  const value: AuthContextType = {
    user,
    planId,
    planName,
    isUnlimited,
    credits,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    logout,
    deductCredits,
    hasCredits,
    refreshPlanFromUrl: () => {
      if (!user) return;
      const applied = applyPlanFromUrl(user.uid);
      if (applied.updated) {
        setPlanId(applied.planId as string);
        setPlanName(applied.planName as string);
        setIsUnlimited(false);
      }
    },
    refreshSubscription: async () => {
      if (!user) return;
      try {
        const userDocRef = doc(db, 'users', user.uid);
        const snap = await getDoc(userDocRef);
        if (snap.exists()) {
          const data = snap.data() as any;
          const sub = data?.subscription || {};
          if (typeof sub.credits === 'number') {
            setCredits(sub.credits);
          }
          if (sub.planId || sub.plan_id || sub.plan || sub.tier) {
            const p = (sub.planId || sub.plan_id || sub.plan || sub.tier || '').toString().toLowerCase();
            setPlanId(p || planId);
          }
          if (sub.planName || sub.plan_name || sub.name) {
            const pn = (sub.planName || sub.plan_name || sub.name || '').toString();
            setPlanName(pn || planName);
          }
        }
      } catch (e) {
        console.warn('Failed to refresh subscription:', e);
      }
    }
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
