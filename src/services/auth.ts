/**
 * Authentifizierungs-Service
 * Verwaltet Login, Register und Logout
 */

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import type { User as FirebaseUser } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import type { User } from '../types';

/**
 * Neuen Benutzer registrieren
 */
export async function registerUser(
  email: string,
  password: string,
  name: string,
  classLevel: 1 | 2 | 3 | 4
): Promise<User> {
  try {
    // Benutzer in Firebase Authentication erstellen
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const firebaseUser = userCredential.user;

    // Benutzer-Daten in Firestore speichern
    const userData: Omit<User, 'uid'> & { uid: string } = {
      uid: firebaseUser.uid,
      email,
      name,
      class: classLevel,
      totalPoints: 0,
      quizzesCompleted: 0,
    };

    await setDoc(doc(db, 'users', firebaseUser.uid), userData);

    return {
      uid: firebaseUser.uid,
      email,
      name,
      class: classLevel,
      totalPoints: 0,
      quizzesCompleted: 0,
    };
  } catch (error) {
    console.error('Fehler bei der Registrierung:', error);
    throw error;
  }
}

/**
 * Benutzer einloggen
 */
export async function loginUser(
  email: string,
  password: string
): Promise<User> {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    const firebaseUser = userCredential.user;

    // Benutzer-Daten aus Firestore laden
    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
    if (userDoc.exists()) {
      return userDoc.data() as User;
    }

    throw new Error('Benutzer-Daten nicht gefunden');
  } catch (error) {
    console.error('Fehler beim Login:', error);
    throw error;
  }
}

/**
 * Benutzer ausloggen
 */
export async function logoutUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Fehler beim Logout:', error);
    throw error;
  }
}

/**
 * Auth-State Observer
 * Wird aufgerufen, wenn sich der Login-Status ändert
 */
export function onAuthChange(
  callback: (user: FirebaseUser | null) => void
): () => void {
  return onAuthStateChanged(auth, callback);
}

/**
 * Aktuellen Benutzer aus Firestore laden
 */
export async function getCurrentUser(): Promise<User | null> {
  const firebaseUser = auth.currentUser;
  if (!firebaseUser) return null;

  try {
    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
    if (userDoc.exists()) {
      return userDoc.data() as User;
    }
    return null;
  } catch (error) {
    console.error('Fehler beim Laden des Benutzers:', error);
    return null;
  }
}

