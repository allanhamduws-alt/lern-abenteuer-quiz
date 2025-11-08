/**
 * Mock für Firebase-Umgebungsvariablen
 * Wird verwendet um questions.ts ohne Firebase zu laden
 */

// Erstelle Mock für import.meta.env
// Da import.meta.env read-only ist, müssen wir es anders machen
// Wir verwenden einen Proxy oder setzen es vor dem Import

// Für tsx müssen wir die Umgebungsvariablen setzen
process.env.VITE_FIREBASE_API_KEY = 'dummy';
process.env.VITE_FIREBASE_AUTH_DOMAIN = 'dummy';
process.env.VITE_FIREBASE_PROJECT_ID = 'dummy';
process.env.VITE_FIREBASE_APP_ID = 'dummy';

