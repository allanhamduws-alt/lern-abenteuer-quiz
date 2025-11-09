/**
 * Firebase-Konfiguration und Initialisierung
 * Diese Datei verbindet die App mit Firebase
 */

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import type { FirebaseConfig } from '../types';

// Firebase-Konfiguration aus Umgebungsvariablen
// Diese Werte werden aus .env.local geladen
const firebaseConfig: FirebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || undefined,
};

// Firebase-App initialisieren
const app = initializeApp(firebaseConfig);

// Firebase-Dienste exportieren
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;

