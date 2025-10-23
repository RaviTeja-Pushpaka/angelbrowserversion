import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
// Note: Do NOT statically import analytics on the server. We'll load it dynamically in the browser.

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyBbkWQtKbFH7k_c_d6QuJM_FuPtODftfno",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "lazy-job-seeker-4b29b.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "lazy-job-seeker-4b29b",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "lazy-job-seeker-4b29b.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "275448735352",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:275448735352:web:342f6eeb6012f35b81af8d",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-PCYRPW12BW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Initialize Analytics only in the browser via dynamic import to prevent SSR bundling issues
export let analytics: any = null;
if (typeof window !== 'undefined') {
  (async () => {
    try {
      const { getAnalytics } = await import('firebase/analytics');
      analytics = getAnalytics(app);
    } catch (e) {
      // Non-fatal: analytics not critical for app functionality
      if (process.env.NODE_ENV === 'development') {
        console.warn('Firebase Analytics init skipped:', e);
      }
    }
  })();
}

export default app;
