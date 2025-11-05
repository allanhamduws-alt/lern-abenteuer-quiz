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
import { createEmptyProgress } from './progress';
import type { User } from '../types';

/**
 * Übersetzt Firebase-Fehlercodes in benutzerfreundliche deutsche Nachrichten
 */
function getErrorMessage(error: any): string {
  const code = error?.code || '';
  
  // Firebase Auth Fehler
  if (code === 'auth/invalid-credential') {
    return 'E-Mail oder Passwort ist falsch. Bitte überprüfen Sie Ihre Eingaben.';
  }
  if (code === 'auth/user-not-found') {
    return 'Dieser Benutzer existiert nicht. Bitte registrieren Sie sich zuerst.';
  }
  if (code === 'auth/wrong-password') {
    return 'Das Passwort ist falsch. Bitte versuchen Sie es erneut.';
  }
  if (code === 'auth/email-already-in-use') {
    return 'Diese E-Mail-Adresse wird bereits verwendet. Bitte verwenden Sie eine andere E-Mail oder melden Sie sich an.';
  }
  if (code === 'auth/weak-password') {
    return 'Das Passwort ist zu schwach. Bitte verwenden Sie mindestens 6 Zeichen.';
  }
  if (code === 'auth/invalid-email') {
    return 'Die E-Mail-Adresse ist ungültig. Bitte überprüfen Sie Ihre Eingabe.';
  }
  if (code === 'auth/missing-or-insufficient-permissions') {
    return 'Fehlende Berechtigungen. Bitte prüfen Sie die Firestore-Regeln in der Firebase-Konsole.';
  }
  
  // Firestore Fehler
  if (code?.includes('permission-denied')) {
    return 'Zugriff verweigert. Bitte prüfen Sie die Firestore-Regeln in der Firebase-Konsole. Sie müssen sowohl `/users` als auch `/progress` erlauben.';
  }
  
  // Standard-Fehler
  return error?.message || 'Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es erneut.';
}

/**
 * Neuen Benutzer registrieren
 */
export async function registerUser(
  email: string,
  password: string,
  name: string,
  classLevel: 1 | 2 | 3 | 4,
  age?: number,
  avatar?: string,
  year?: number
): Promise<User> {
  try {
    // Benutzer in Firebase Authentication erstellen
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const firebaseUser = userCredential.user;
    const now = new Date().toISOString();

    // Benutzer-Daten in Firestore speichern (separater Try-Catch)
    const userData: Omit<User, 'uid'> & { uid: string } = {
      uid: firebaseUser.uid,
      email,
      name,
      class: classLevel,
      age,
      avatar,
      year,
      totalPoints: 0,
      quizzesCompleted: 0,
      createdAt: now,
      lastLogin: now,
    };

    try {
      await setDoc(doc(db, 'users', firebaseUser.uid), userData);
    } catch (userError) {
      console.error('Warnung: User-Daten konnten nicht gespeichert werden:', userError);
      // Weiter machen, Auth war erfolgreich - User kann später nochmal speichern
    }

    // Progress initialisieren (separater Try-Catch, damit Auth trotzdem funktioniert)
    try {
      const initialProgress = createEmptyProgress();
      await setDoc(doc(db, 'progress', firebaseUser.uid), initialProgress);
    } catch (progressError) {
      console.error('Warnung: Progress konnte nicht initialisiert werden:', progressError);
      // Weiter machen, Auth war erfolgreich
    }

    return {
      uid: firebaseUser.uid,
      email,
      name,
      class: classLevel,
      age,
      avatar,
      year,
      totalPoints: 0,
      quizzesCompleted: 0,
      createdAt: now,
      lastLogin: now,
    };
  } catch (error) {
    console.error('Fehler bei der Registrierung:', error);
    const friendlyError = new Error(getErrorMessage(error));
    throw friendlyError;
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
      const userData = userDoc.data() as User;
      
      // LastLogin aktualisieren
      await setDoc(
        doc(db, 'users', firebaseUser.uid),
        { lastLogin: new Date().toISOString() },
        { merge: true }
      );

      return {
        ...userData,
        lastLogin: new Date().toISOString(),
      };
    }

    throw new Error('Benutzer-Daten nicht gefunden');
  } catch (error) {
    console.error('Fehler beim Login:', error);
    const friendlyError = new Error(getErrorMessage(error));
    throw friendlyError;
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

