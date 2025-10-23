import { initializeApp, getApps, applicationDefault, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin SDK. Use individual env vars to avoid 4KB limit, fallback to JSON, then ADC.
const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;

if (!getApps().length) {
  // Try individual environment variables first (more efficient for Netlify)
  if (projectId && privateKey && clientEmail) {
    try {
      const creds = {
        projectId,
        privateKey: privateKey.replace(/\\n/g, '\n'), // Handle escaped newlines
        clientEmail,
      };
      initializeApp({ credential: cert(creds) });
    } catch (e) {
      console.warn('Failed to initialize with individual env vars, trying JSON fallback:', e);
      // Fallback to JSON method
      if (serviceAccountJson) {
        try {
          const creds = JSON.parse(serviceAccountJson);
          initializeApp({ credential: cert(creds) });
        } catch (e2) {
          // Final fallback to application default
          initializeApp({ credential: applicationDefault() });
        }
      } else {
        initializeApp({ credential: applicationDefault() });
      }
    }
  } else if (serviceAccountJson) {
    try {
      const creds = JSON.parse(serviceAccountJson);
      initializeApp({ credential: cert(creds) });
    } catch (e) {
      // Fallback to application default
      initializeApp({ credential: applicationDefault() });
    }
  } else {
    initializeApp({ credential: applicationDefault() });
  }
}

export const adminAuth = getAuth();
export const adminDb = getFirestore();
