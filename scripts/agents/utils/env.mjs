/**
 * Environment-Variablen für Agent-Skripte
 * Lädt .env.agent Datei
 */

import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { config } from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '../../..');
const envFilePath = join(projectRoot, '.env.agent');

// Lade .env.agent
const envFileExists = existsSync(envFilePath);
if (envFileExists) {
  config({ path: envFilePath });
} else {
  console.warn('⚠️ .env.agent Datei nicht gefunden. Erstelle sie im Projekt-Root.');
}

export const ENV = {
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID || '',
  FIREBASE_STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET || '',
  GOOGLE_APPLICATION_CREDENTIALS: process.env.GOOGLE_APPLICATION_CREDENTIALS || '',
  DAILY_COST_LIMIT: parseFloat(process.env.DAILY_COST_LIMIT || '5.00'),
  MAX_PARALLEL_JOBS: parseInt(process.env.MAX_PARALLEL_JOBS || '2', 10),
};

// Validierung - nur warnen wenn wirklich nicht gesetzt UND Datei existiert
if (envFileExists) {
  if (!ENV.OPENAI_API_KEY) {
    console.warn('⚠️ OPENAI_API_KEY nicht in .env.agent gesetzt');
  }
  if (!ENV.GEMINI_API_KEY) {
    console.warn('⚠️ GEMINI_API_KEY nicht in .env.agent gesetzt');
  }
  if (!ENV.FIREBASE_PROJECT_ID) {
    console.warn('⚠️ FIREBASE_PROJECT_ID nicht in .env.agent gesetzt');
  }
}

