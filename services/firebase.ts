
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

/**
 * Firebase Configuration for ProdFlow
 * Values are injected at build time via vite.config.ts from environment variables.
 */
export const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || 'AIzaSyCFrPSYnFn1T5zgsuIB_4TxMB59D3-0qMg',
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || 'prodflow-731b1.firebaseapp.com',
  projectId: process.env.FIREBASE_PROJECT_ID || 'prodflow-731b1',
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'prodflow-731b1.firebasestorage.app',
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '874150900796',
  appId: process.env.FIREBASE_APP_ID || '1:874150900796:web:98fdc6227455bcbc87ff39',
  measurementId: process.env.FIREBASE_MEASUREMENT_ID || 'G-2J0T0KM5YE'
};

// Guard against missing API key which causes Firebase initialization to fail
if (!firebaseConfig.apiKey) {
  console.error("CRITICAL: Firebase API Key is missing. Please check your environment variables. Ensure the key name is FIREBASE_API_KEY.");
}

// Initialize Firebase only if it hasn't been initialized already
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Export auth and database services
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
