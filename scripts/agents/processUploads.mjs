/**
 * Eltern-Upload Worker
 * Verarbeitet neue Uploads: OCR (Gemini) → Normalisierung (OpenAI) → Tasks erstellen
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { ENV } from './utils/env.mjs';
import { performOCR, analyzeImage } from './utils/gemini.mjs';
import { generateTasks } from './utils/openai.mjs';
import fs from 'fs';
import os from 'os';

// Firebase Admin initialisieren
// Unterstützt sowohl Service-Account-Key als auch Application Default Credentials
let firebaseInitialized = false;

if (ENV.GOOGLE_APPLICATION_CREDENTIALS) {
  const credsPath = ENV.GOOGLE_APPLICATION_CREDENTIALS.replace(/^~/, os.homedir());
  
  if (fs.existsSync(credsPath)) {
    try {
      const credsContent = fs.readFileSync(credsPath, 'utf8');
      const credsData = JSON.parse(credsContent);
      
      // Prüfe ob es ein Service-Account-Key ist (hat 'type' und 'private_key')
      if (credsData.type === 'service_account' && credsData.private_key) {
        console.log('✅ Lade Service-Account-Key...');
        initializeApp({
          credential: cert(credsData),
          storageBucket: ENV.FIREBASE_STORAGE_BUCKET,
        });
        firebaseInitialized = true;
        console.log('✅ Firebase Admin mit Service-Account initialisiert');
      } else {
        // Application Default Credentials Format (hat 'type' und 'client_id')
        console.log('✅ Verwende Application Default Credentials...');
        initializeApp({
          storageBucket: ENV.FIREBASE_STORAGE_BUCKET,
        });
        firebaseInitialized = true;
        console.log('✅ Firebase Admin mit Application Default Credentials initialisiert');
      }
    } catch (error) {
      console.warn('⚠️ Fehler beim Laden der Credentials-Datei:', error.message);
      console.log('🔄 Versuche Application Default Credentials...');
    }
  } else {
    console.warn(`⚠️ Credentials-Datei nicht gefunden: ${credsPath}`);
    console.log('🔄 Versuche Application Default Credentials...');
  }
}

if (!firebaseInitialized) {
  console.log('ℹ️ Verwende Application Default Credentials (automatisch erkannt)...');
  try {
    initializeApp({
      storageBucket: ENV.FIREBASE_STORAGE_BUCKET,
    });
    console.log('✅ Firebase Admin mit Application Default Credentials initialisiert');
  } catch (error) {
    console.error('❌ Fehler bei Firebase-Initialisierung:', error.message);
    console.error('💡 Tipp: Führen Sie "gcloud auth application-default login" aus');
    process.exit(1);
  }
}

const db = getFirestore();
const storage = getStorage();

// OCR und Task-Generierung sind jetzt in utils/gemini.mjs und utils/openai.mjs implementiert

/**
 * Upload verarbeiten
 */
async function processUpload(uploadDoc) {
  const { id, data } = uploadDoc;
  console.log(`\n📄 Verarbeite Upload: ${id}`);
  
  try {
    // Status auf 'processing' setzen
    await uploadDoc.ref.update({ status: 'processing' });
    
    // OCR durchführen
    console.log(`📄 Starte OCR für Upload ${id}...`);
    const ocrResult = await performOCR(data.downloadURL);
    console.log(`✅ OCR abgeschlossen: ${ocrResult.text.length} Zeichen extrahiert`);
    
    // Optional: Bild analysieren falls es ein Bild ist
    let imageAnalysis = null;
    if (data.sourceType === 'file' && data.downloadURL.match(/\.(jpg|jpeg|png|gif)$/i)) {
      try {
        imageAnalysis = await analyzeImage(data.downloadURL);
        console.log(`✅ Bild-Analyse abgeschlossen`);
      } catch (imageError) {
        console.warn(`⚠️ Bild-Analyse fehlgeschlagen: ${imageError.message}`);
      }
    }
    
    // Tasks generieren
    console.log(`🤖 Generiere Tasks...`);
    const tasks = await generateTasks(
      ocrResult.text, 
      data.subject, 
      data.grade,
      { ...ocrResult, imageAnalysis }
    );
    console.log(`✅ ${tasks.length} Tasks generiert`);
    
    // Tasks für jedes Kind des Eltern-Kontos erstellen
    const parentDoc = await db.collection('users').doc(data.parentId).get();
    const parentData = parentDoc.data();
    const kids = parentData?.children || [];
    
    for (const kidId of kids) {
      for (const task of tasks) {
        // Konvertiere difficulty von 'leicht/mittel/schwer' zu 'easy/medium/hard'
        const difficultyMap = {
          'leicht': 'easy',
          'mittel': 'medium',
          'schwer': 'hard',
        };
        
        const mappedDifficulty = difficultyMap[task.difficulty] || task.difficulty || 'medium';
        
        await db
          .collection('users')
          .doc(data.parentId)
          .collection('kids')
          .doc(kidId)
          .collection('tasks')
          .add({
            stem: task.stem,
            options: task.options || [],
            answers: task.answers,
            difficulty: mappedDifficulty,
            type: task.type || 'multiple-choice',
            explanation: task.explanation,
            imageUrl: task.imageUrl || null,
            imagePrompt: task.imagePrompt || null,
            uploadId: id,
            subject: data.subject,
            grade: data.grade,
            status: 'pending', // Eltern müssen freigeben
            createdAt: new Date().toISOString(),
          });
      }
    }
    
    // Upload-Status aktualisieren
    await uploadDoc.ref.update({
      status: 'ready',
      confidence: ocrResult.confidence,
      pages: ocrResult.pages,
      tasksGenerated: tasks.length,
    });
    
    console.log(`✅ Upload ${id} verarbeitet: ${tasks.length} Tasks erstellt`);
  } catch (error) {
    console.error(`❌ Fehler bei Upload ${id}:`, error);
    await uploadDoc.ref.update({
      status: 'error',
      errors: [error.message],
    });
  }
}

/**
 * Hauptfunktion - Watch-Modus
 */
async function watchUploads() {
  console.log('👀 Starte Upload-Watcher...');
  console.log(`📁 Projekt: ${ENV.FIREBASE_PROJECT_ID}`);
  
  // Polling-Loop (alle 30 Sekunden)
  setInterval(async () => {
    try {
      // Alle pending Uploads finden
      const pendingQuery = await db
        .collectionGroup('uploads')
        .where('status', '==', 'pending')
        .limit(ENV.MAX_PARALLEL_JOBS)
        .get();
      
      if (pendingQuery.empty) {
        return; // Keine neuen Uploads
      }
      
      console.log(`\n📦 ${pendingQuery.size} neue Upload(s) gefunden`);
      
      // Parallel verarbeiten (limit durch MAX_PARALLEL_JOBS)
      const promises = pendingQuery.docs.map((doc) => processUpload(doc));
      await Promise.all(promises);
    } catch (error) {
      console.error('❌ Fehler im Watch-Loop:', error);
    }
  }, 30000); // 30 Sekunden
  
  console.log('✅ Watcher läuft (alle 30s)...');
}

/**
 * Einmalige Verarbeitung aller pending Uploads
 */
async function processAllPending() {
  console.log('🚀 Verarbeite alle pending Uploads...');
  
  const pendingQuery = await db
    .collectionGroup('uploads')
    .where('status', '==', 'pending')
    .get();
  
  if (pendingQuery.empty) {
    console.log('✅ Keine pending Uploads gefunden');
    return;
  }
  
  console.log(`📦 ${pendingQuery.size} Upload(s) gefunden`);
  
  for (const doc of pendingQuery.docs) {
    await processUpload(doc);
  }
  
  console.log('✅ Alle Uploads verarbeitet');
}

// Hauptlogik
const mode = process.argv[2] || 'watch';

if (mode === 'once') {
  processAllPending().then(() => process.exit(0));
} else {
  watchUploads();
}

