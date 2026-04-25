import { initializeApp, getApps, type FirebaseApp } from "firebase/app";

// Firebase client SDK initializer.
// Web-side API keys are public identifiers (not secrets) — but we still read
// from NEXT_PUBLIC_* env vars so the config can change per-environment without
// a code change. The values below are the only fallback defaults used if no
// env vars are configured (keeps local dev working without a .env entry).

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDyZ8BYELItaHkZ50-BLSAirz2vVccmO_0",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "superbrain-tokens.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "superbrain-tokens",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "superbrain-tokens.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "513347173414",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:513347173414:web:9c3cc74e97ef3427ae7ae7",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-1RLXB08VPE",
};

let _app: FirebaseApp | null = null;

export function getFirebase(): FirebaseApp {
  if (_app) return _app;
  _app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  return _app;
}

export { firebaseConfig };
