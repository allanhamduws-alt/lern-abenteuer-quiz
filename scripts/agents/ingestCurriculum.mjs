/**
 * Curriculum-Ingestion Agent
 * Lädt NDS-Curriculum-PDFs von NiBiS, lädt sie in Firebase Storage hoch,
 * erstellt Index und optional Seed-Tasks
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import { getFirestore } from 'firebase-admin/firestore';
import { ENV } from './utils/env.mjs';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Firebase Admin initialisieren
if (ENV.GOOGLE_APPLICATION_CREDENTIALS) {
  const serviceAccount = JSON.parse(
    fs.readFileSync(ENV.GOOGLE_APPLICATION_CREDENTIALS, 'utf8')
  );
  initializeApp({
    credential: cert(serviceAccount),
    storageBucket: ENV.FIREBASE_STORAGE_BUCKET,
  });
} else {
  // Nutze Application Default Credentials (gcloud auth application-default login)
  initializeApp({
    storageBucket: ENV.FIREBASE_STORAGE_BUCKET,
  });
}

const storage = getStorage();
const db = getFirestore();

const CURRICULUM_URL = 'https://cuvo.nibis.de/cuvo.php?k=&k0_0=Schulbereich&p=search&v0_0=Primarbereich';
const SUBJECTS = ['deutsch', 'mathematik', 'sachunterricht', 'englisch', 'musik'];
const GRADES = [1, 2, 3, 4];

/**
 * PDF von URL herunterladen
 */
function downloadPDF(url, filePath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filePath);
    https.get(url, (response) => {
      if (response.statusCode === 200) {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve(filePath);
        });
      } else {
        reject(new Error(`HTTP ${response.statusCode}`));
      }
    }).on('error', reject);
  });
}

/**
 * PDF in Firebase Storage hochladen
 */
async function uploadToStorage(localPath, storagePath) {
  const bucket = storage.bucket();
  await bucket.upload(localPath, {
    destination: storagePath,
    metadata: {
      contentType: 'application/pdf',
    },
  });
  console.log(`✅ Hochgeladen: ${storagePath}`);
}

/**
 * Index-Eintrag erstellen
 */
async function createIndexEntry(entry) {
  const indexRef = db.collection('globalDocs').doc();
  await indexRef.set({
    ...entry,
    createdAt: new Date().toISOString(),
  });
  console.log(`✅ Index erstellt: ${entry.subject}/${entry.year}`);
}

/**
 * Hauptfunktion
 */
async function main() {
  console.log('🚀 Starte Curriculum-Ingestion...');
  console.log(`📁 Projekt: ${ENV.FIREBASE_PROJECT_ID}`);
  console.log(`📦 Bucket: ${ENV.FIREBASE_STORAGE_BUCKET}`);
  
  // TODO: Implementiere Scraping der NiBiS-Seite
  // Für jetzt: Manuelle Liste der PDF-URLs
  const curriculumFiles = [
    // Beispiel-Struktur (muss mit echten URLs gefüllt werden)
    // { subject: 'deutsch', year: 2025, url: '...', title: 'KC Deutsch Grundschule 2025' },
  ];
  
  if (curriculumFiles.length === 0) {
    console.log('⚠️ Keine Curriculum-Dateien konfiguriert.');
    console.log('📝 Bitte füge PDF-URLs zur curriculumFiles-Liste hinzu.');
    console.log('🔗 Quelle: https://cuvo.nibis.de/cuvo.php?k=&k0_0=Schulbereich&p=search&v0_0=Primarbereich');
    return;
  }
  
  const tempDir = path.join(__dirname, '../../temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  
  for (const file of curriculumFiles) {
    try {
      console.log(`\n📥 Lade ${file.subject}/${file.title}...`);
      
      // Herunterladen
      const localPath = path.join(tempDir, `${file.subject}_${file.year}.pdf`);
      await downloadPDF(file.url, localPath);
      
      // Hochladen
      const storagePath = `global/curriculum/nds/${file.subject}/${file.year}_${file.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      await uploadToStorage(localPath, storagePath);
      
      // Index erstellen
      await createIndexEntry({
        subject: file.subject,
        year: file.year,
        docType: 'Kerncurriculum',
        validFrom: `${file.year}-08-01`,
        sourceUrl: file.url,
        storagePath,
        title: file.title,
      });
      
      // Lokale Datei löschen
      fs.unlinkSync(localPath);
    } catch (error) {
      console.error(`❌ Fehler bei ${file.subject}:`, error.message);
    }
  }
  
  // Temp-Verzeichnis aufräumen
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true });
  }
  
  console.log('\n✅ Curriculum-Ingestion abgeschlossen!');
}

main().catch(console.error);

