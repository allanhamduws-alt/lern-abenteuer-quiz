/**
 * Exportiert Fragen als JSON ohne Dependencies
 * Wird von validateQuestions.mjs verwendet
 * Mockt Firebase-Umgebungsvariablen für Node.js
 */

// Mock import.meta.env für Node.js (wird von Vite verwendet)
global.import = global.import || {};
global.import.meta = global.import.meta || {};
global.import.meta.env = {
  VITE_FIREBASE_API_KEY: 'dummy',
  VITE_FIREBASE_AUTH_DOMAIN: 'dummy',
  VITE_FIREBASE_PROJECT_ID: 'dummy',
  VITE_FIREBASE_APP_ID: 'dummy',
  VITE_FIREBASE_STORAGE_BUCKET: 'dummy',
  VITE_FIREBASE_MESSAGING_SENDER_ID: 'dummy',
  VITE_FIREBASE_MEASUREMENT_ID: 'dummy',
};

// Setze auch process.env für den Fall
process.env.VITE_FIREBASE_API_KEY = 'dummy';
process.env.VITE_FIREBASE_AUTH_DOMAIN = 'dummy';
process.env.VITE_FIREBASE_PROJECT_ID = 'dummy';
process.env.VITE_FIREBASE_APP_ID = 'dummy';

try {
  const { questions } = await import('../src/data/questions.ts');
  const { writeFileSync } = await import('fs');
  
  // Exportiere Fragen als JSON
  writeFileSync('temp-questions.json', JSON.stringify(questions, null, 2));
  console.log(`Exported ${questions.length} questions`);
} catch (error) {
  console.error('Fehler beim Exportieren:', error.message);
  console.error(error.stack);
  process.exit(1);
}
