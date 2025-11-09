/**
 * Code-Verknüpfung Service
 * Verwaltet die Verknüpfung von Eltern und Kindern über Codes
 */

import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  query, 
  where, 
  getDocs, 
  deleteDoc,
  updateDoc,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';
import type { User } from '../types';

/**
 * Generiert einen zufälligen 6-stelligen Code
 * Format: 3 Buchstaben + 3 Zahlen (z.B. "ABC123")
 */
function generateRandomCode(): string {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // Ohne I und O (verwirrend)
  const numbers = '0123456789';
  
  let code = '';
  
  // 3 Buchstaben
  for (let i = 0; i < 3; i++) {
    code += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  
  // 3 Zahlen
  for (let i = 0; i < 3; i++) {
    code += numbers.charAt(Math.floor(Math.random() * numbers.length));
  }
  
  return code;
}

/**
 * Generiert einen Verknüpfungscode für ein Eltern-Konto
 * Speichert den Code in Firestore mit Ablaufzeit (1 Stunde)
 * 
 * @param parentId - UID des Eltern-Kontos
 * @returns Der generierte Code (z.B. "ABC123")
 */
export async function generateLinkingCode(parentId: string): Promise<string> {
  try {
    // Prüfe ob bereits ein Code existiert und lösche ihn
    const existingCodesQuery = query(
      collection(db, 'linkingCodes'),
      where('parentId', '==', parentId)
    );
    const existingCodes = await getDocs(existingCodesQuery);
    
    // Lösche alle existierenden Codes für diesen Eltern
    const deletePromises = existingCodes.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
    
    // Generiere neuen Code
    let code: string = '';
    let codeExists = true;
    
    // Stelle sicher, dass der Code eindeutig ist
    while (codeExists) {
      code = generateRandomCode();
      
      // Prüfe ob Code bereits existiert
      const codeQuery = query(
        collection(db, 'linkingCodes'),
        where('code', '==', code)
      );
      const codeDocs = await getDocs(codeQuery);
      
      if (codeDocs.empty) {
        codeExists = false;
      }
    }
    
    // Erstelle Code-Dokument mit Ablaufzeit (1 Stunde)
    const createdAt = Timestamp.now();
    const expiresAt = Timestamp.fromMillis(createdAt.toMillis() + 60 * 60 * 1000); // +1 Stunde
    
    await setDoc(doc(db, 'linkingCodes', code), {
      code: code,
      parentId: parentId,
      createdAt: createdAt,
      expiresAt: expiresAt,
    });
    
    console.log('✅ Verknüpfungscode generiert:', code);
    return code;
  } catch (error: any) {
    console.error('❌ Fehler beim Generieren des Verknüpfungscodes:', error);
    throw new Error('Fehler beim Generieren des Codes. Bitte versuchen Sie es erneut.');
  }
}

/**
 * Validiert einen Verknüpfungscode und verknüpft das Kind mit dem Eltern-Konto
 * 
 * @param code - Der 6-stellige Verknüpfungscode
 * @param childId - UID des Kind-Kontos
 * @returns true wenn erfolgreich verknüpft
 */
export async function validateAndLinkCode(code: string, childId: string): Promise<boolean> {
  try {
    // Normalisiere Code (Großbuchstaben, keine Leerzeichen)
    const normalizedCode = code.trim().toUpperCase().replace(/\s/g, '');
    
    if (normalizedCode.length !== 6) {
      throw new Error('Der Code muss genau 6 Zeichen lang sein.');
    }
    
    // Lade Code-Dokument
    const codeDoc = await getDoc(doc(db, 'linkingCodes', normalizedCode));
    
    if (!codeDoc.exists()) {
      throw new Error('Ungültiger Code. Bitte überprüfen Sie die Eingabe.');
    }
    
    const codeData = codeDoc.data();
    
    // Prüfe Ablaufzeit
    const expiresAt = codeData.expiresAt as Timestamp;
    const now = Timestamp.now();
    
    if (now.toMillis() > expiresAt.toMillis()) {
      // Code ist abgelaufen - lösche ihn
      await deleteDoc(doc(db, 'linkingCodes', normalizedCode));
      throw new Error('Der Code ist abgelaufen. Bitte lassen Sie einen neuen Code generieren.');
    }
    
    const parentId = codeData.parentId as string;
    
    // Prüfe ob Kind bereits verknüpft ist
    const childDoc = await getDoc(doc(db, 'users', childId));
    if (!childDoc.exists()) {
      throw new Error('Kind-Konto nicht gefunden.');
    }
    
    const childData = childDoc.data() as User;
    if (childData.parentId) {
      throw new Error('Dieses Kind ist bereits mit einem Eltern-Konto verknüpft.');
    }
    
    // Prüfe ob Eltern-Konto existiert
    const parentDoc = await getDoc(doc(db, 'users', parentId));
    if (!parentDoc.exists()) {
      throw new Error('Eltern-Konto nicht gefunden.');
    }
    
    const parentData = parentDoc.data() as User;
    if (parentData.role !== 'parent') {
      throw new Error('Ungültiges Eltern-Konto.');
    }
    
    // Prüfe ob Kind bereits in children Array ist
    if (parentData.children?.includes(childId)) {
      throw new Error('Dieses Kind ist bereits verknüpft.');
    }
    
    // Verknüpfe Kind mit Eltern
    const updatedChildren = [...(parentData.children || []), childId];
    await updateDoc(doc(db, 'users', parentId), {
      children: updatedChildren,
    });
    
    // Verknüpfe Eltern mit Kind
    await updateDoc(doc(db, 'users', childId), {
      parentId: parentId,
    });
    
    // Lösche Code nach erfolgreicher Verknüpfung
    await deleteDoc(doc(db, 'linkingCodes', normalizedCode));
    
    console.log('✅ Kind erfolgreich mit Eltern verknüpft:', { childId, parentId });
    return true;
  } catch (error: any) {
    console.error('❌ Fehler beim Validieren/Verknüpfen des Codes:', error);
    throw error;
  }
}

/**
 * Lädt den aktuellen Verknüpfungscode für ein Eltern-Konto
 * 
 * @param parentId - UID des Eltern-Kontos
 * @returns Der Code oder null wenn kein Code existiert/abgelaufen ist
 */
export async function getCurrentLinkingCode(parentId: string): Promise<{
  code: string;
  expiresAt: Date;
  createdAt: Date;
} | null> {
  try {
    const codesQuery = query(
      collection(db, 'linkingCodes'),
      where('parentId', '==', parentId)
    );
    const codesSnapshot = await getDocs(codesQuery);
    
    if (codesSnapshot.empty) {
      return null;
    }
    
    // Nimm den ersten Code (sollte nur einer sein)
    const codeDoc = codesSnapshot.docs[0];
    const codeData = codeDoc.data();
    
    const expiresAt = (codeData.expiresAt as Timestamp).toDate();
    const createdAt = (codeData.createdAt as Timestamp).toDate();
    
    // Prüfe ob Code abgelaufen ist
    if (new Date() > expiresAt) {
      // Lösche abgelaufenen Code
      await deleteDoc(codeDoc.ref);
      return null;
    }
    
    return {
      code: codeData.code as string,
      expiresAt,
      createdAt,
    };
  } catch (error: any) {
    console.error('❌ Fehler beim Laden des Verknüpfungscodes:', error);
    return null;
  }
}

/**
 * Typ für Eltern-Einladungen per E-Mail
 */
export interface ParentInvite {
  id: string;
  parentId: string;
  parentName: string;
  parentEmail?: string;
  childId: string;
  childName: string;
  childEmail: string;
  status: 'pending' | 'accepted' | 'declined' | 'cancelled';
  createdAt: Date;
  respondedAt?: Date;
}

function buildInviteId(parentId: string, childId: string): string {
  return `${parentId}_${childId}`;
}

/**
 * Erstellt eine Eltern-Einladung für ein Kind
 */
export async function createParentInvite(parent: User, child: User): Promise<void> {
  if (!parent.uid) {
    throw new Error('Ungültiges Eltern-Konto.');
  }

  if (!child.uid) {
    throw new Error('Ungültiges Kinder-Konto.');
  }

  if (child.parentId) {
    throw new Error('Dieses Kind ist bereits mit einem Eltern-Konto verknüpft.');
  }

  const inviteId = buildInviteId(parent.uid, child.uid);
  const inviteRef = doc(db, 'parentInvites', inviteId);
  
  // Prüfe ob bereits eine Einladung existiert
  // Verwende try-catch, falls getDoc fehlschlägt (z.B. wegen Permissions)
  let existingInvite = null;
  try {
    existingInvite = await getDoc(inviteRef);
  } catch (error) {
    // Wenn getDoc fehlschlägt, versuchen wir trotzdem zu erstellen
    // Die Security Rules werden beim setDoc prüfen
    console.warn('Konnte bestehende Einladung nicht prüfen:', error);
  }

  const inviteData = {
    parentId: parent.uid,
    parentName: parent.name,
    parentEmail: parent.email,
    childId: child.uid,
    childName: child.name,
    childEmail: child.email,
    status: 'pending' as ParentInvite['status'],
    createdAt: Timestamp.now(),
    respondedAt: null,
  };

  if (existingInvite?.exists()) {
    const currentStatus = existingInvite.data()?.status;
    // Überschreibe nur wenn Einladung nicht mehr pending ist
    if (currentStatus === 'pending') {
      throw new Error('Es existiert bereits eine offene Einladung für dieses Kind.');
    }
  }

  await setDoc(inviteRef, inviteData);
}

/**
 * Lädt alle Einladungen für ein Eltern-Konto
 */
export async function fetchInvitesForParent(parentId: string): Promise<ParentInvite[]> {
  try {
    const invitesQuery = query(
      collection(db, 'parentInvites'),
      where('parentId', '==', parentId)
    );
    const snapshot = await getDocs(invitesQuery);

    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        parentId: data.parentId,
        parentName: data.parentName,
        parentEmail: data.parentEmail,
        childId: data.childId,
        childName: data.childName,
        childEmail: data.childEmail,
        status: data.status,
        createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
        respondedAt: data.respondedAt ? (data.respondedAt as Timestamp).toDate() : undefined,
      } satisfies ParentInvite;
    }).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } catch (error) {
    console.error('Fehler beim Laden der Einladungen für Eltern:', error);
    return [];
  }
}

/**
 * Lädt alle offenen Einladungen für ein Kind
 */
export async function fetchInvitesForChild(childId: string): Promise<ParentInvite[]> {
  try {
    const invitesQuery = query(
      collection(db, 'parentInvites'),
      where('childId', '==', childId)
    );
    const snapshot = await getDocs(invitesQuery);

    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        parentId: data.parentId,
        parentName: data.parentName,
        parentEmail: data.parentEmail,
        childId: data.childId,
        childName: data.childName,
        childEmail: data.childEmail,
        status: data.status,
        createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
        respondedAt: data.respondedAt ? (data.respondedAt as Timestamp).toDate() : undefined,
      } satisfies ParentInvite;
    }).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } catch (error) {
    console.error('Fehler beim Laden der Einladungen für Kind:', error);
    return [];
  }
}

/**
 * Eltern ziehen eine Einladung zurück
 */
export async function cancelParentInvite(parentId: string, childId: string): Promise<void> {
  const inviteId = buildInviteId(parentId, childId);
  const inviteRef = doc(db, 'parentInvites', inviteId);
  const inviteSnap = await getDoc(inviteRef);

  if (!inviteSnap.exists()) {
    throw new Error('Einladung wurde nicht gefunden.');
  }

  await updateDoc(inviteRef, {
    status: 'cancelled',
    respondedAt: Timestamp.now(),
  });
}

/**
 * Kind nimmt eine Einladung an
 */
export async function acceptParentInvite(inviteId: string): Promise<void> {
  try {
    console.log('📬 Annehme Einladung:', inviteId);
    
    const inviteRef = doc(db, 'parentInvites', inviteId);
    const inviteSnap = await getDoc(inviteRef);

    if (!inviteSnap.exists()) {
      throw new Error('Einladung wurde nicht gefunden.');
    }

    const inviteData = inviteSnap.data();
    const parentId = inviteData.parentId as string;
    const childId = inviteData.childId as string;
    const status = inviteData.status as ParentInvite['status'];

    console.log('📋 Einladungsdaten:', { parentId, childId, status });

    if (status !== 'pending') {
      throw new Error('Diese Einladung wurde bereits bearbeitet.');
    }

    // Lade Parent und Child
    const parentRef = doc(db, 'users', parentId);
    const parentSnap = await getDoc(parentRef);
    if (!parentSnap.exists()) {
      throw new Error('Eltern-Konto nicht gefunden.');
    }
    const parentData = parentSnap.data() as User;

    const childRef = doc(db, 'users', childId);
    const childSnap = await getDoc(childRef);
    if (!childSnap.exists()) {
      throw new Error('Kind-Konto nicht gefunden.');
    }
    const childData = childSnap.data() as User;

    if (childData.parentId && childData.parentId !== parentId) {
      throw new Error('Dieses Kind ist bereits mit einem anderen Eltern-Konto verknüpft.');
    }

    // Aktualisiere Parent children
    const updatedChildren = parentData.children ? [...parentData.children] : [];
    if (!updatedChildren.includes(childId)) {
      updatedChildren.push(childId);
      console.log('🔄 Aktualisiere Eltern-Dokument:', { parentId, updatedChildren });
      await updateDoc(parentRef, {
        children: updatedChildren,
      });
      console.log('✅ Eltern-Dokument aktualisiert');
    }

    // Aktualisiere Child parentId
    console.log('🔄 Aktualisiere Kind-Dokument:', { childId, parentId });
    await updateDoc(childRef, {
      parentId: parentId,
    });
    console.log('✅ Kind-Dokument aktualisiert');

    // Aktualisiere Einladungsstatus
    console.log('🔄 Aktualisiere Einladungsstatus');
    await updateDoc(inviteRef, {
      status: 'accepted',
      respondedAt: Timestamp.now(),
    });
    console.log('✅ Einladung erfolgreich angenommen!');
  } catch (error: any) {
    console.error('❌ Fehler beim Annehmen der Einladung:', error);
    console.error('❌ Fehlerdetails:', {
      code: error.code,
      message: error.message,
      stack: error.stack,
    });
    throw error;
  }
}

/**
 * Kind lehnt eine Einladung ab
 */
export async function declineParentInvite(inviteId: string): Promise<void> {
  const inviteRef = doc(db, 'parentInvites', inviteId);
  const inviteSnap = await getDoc(inviteRef);

  if (!inviteSnap.exists()) {
    throw new Error('Einladung wurde nicht gefunden.');
  }

  const inviteData = inviteSnap.data();
  const status = inviteData.status as ParentInvite['status'];

  if (status !== 'pending') {
    throw new Error('Diese Einladung wurde bereits bearbeitet.');
  }

  await updateDoc(inviteRef, {
    status: 'declined',
    respondedAt: Timestamp.now(),
  });
}

