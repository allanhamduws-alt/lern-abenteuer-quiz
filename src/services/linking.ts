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
    let code: string;
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
    
    await setDoc(doc(db, 'linkingCodes', code!), {
      code: code!,
      parentId: parentId,
      createdAt: createdAt,
      expiresAt: expiresAt,
    });
    
    console.log('✅ Verknüpfungscode generiert:', code);
    return code!;
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

