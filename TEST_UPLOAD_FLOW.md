# Test-Dokumentation: Eltern-Upload-Flow

## Übersicht
Diese Dokumentation beschreibt, wie der Eltern-Upload-Flow getestet werden sollte, um sicherzustellen, dass alle Komponenten korrekt funktionieren.

## Voraussetzungen

### 1. CORS-Konfiguration
- CORS-Regeln für Firebase Storage müssen gesetzt sein
- Führen Sie aus: `gsutil cors set cors.json gs://lern-abenteuer-quiz-cursor.appspot.com`
- Prüfen Sie mit: `gsutil cors get gs://lern-abenteuer-quiz-cursor.appspot.com`

### 2. Backend-Agent Setup
- Application Default Credentials eingerichtet: `gcloud auth application-default login`
- Oder Service-Account-Key in `.env.agent` konfiguriert
- API-Keys in `.env.agent` gesetzt:
  - `OPENAI_API_KEY`
  - `GEMINI_API_KEY`
  - `FIREBASE_PROJECT_ID`
  - `FIREBASE_STORAGE_BUCKET`

### 3. Frontend Setup
- `.env.local` mit `VITE_OPENAI_API_KEY` (optional, für manuelle Verarbeitung)
- Firebase-Konfiguration in `.env.local`

## Test-Szenarien

### Szenario 1: Upload über Frontend mit manueller Verarbeitung

**Schritte:**
1. Als Eltern-Konto einloggen
2. Zu "Einstellungen" → "Material hochladen" navigieren
3. Test-PDF hochladen (z.B. ein einfaches Arbeitsblatt)
4. Fach und Klassenstufe auswählen
5. Upload starten
6. In "Upload-Review" den Upload öffnen
7. Auf "🤖 Mit KI verarbeiten (GPT-4 Vision)" klicken
8. Warten bis Verarbeitung abgeschlossen ist

**Erwartetes Ergebnis:**
- Upload wird erfolgreich hochgeladen
- `storagePath` wird in Firestore gespeichert
- PDF wird erfolgreich zu Bild konvertiert (keine CORS-Fehler)
- OCR extrahiert Text aus dem PDF
- Aufgaben werden generiert
- Tasks werden für alle verknüpften Kinder erstellt
- Status wird auf "ready" gesetzt

**Zu prüfen:**
- Browser-Konsole auf Fehler prüfen
- Firestore: Upload-Dokument hat `status: 'ready'` und `tasksGenerated > 0`
- Firestore: Tasks existieren unter `users/{parentId}/kids/{kidId}/tasks`
- Tasks haben korrekte Struktur (stem, options, answers, explanation)

### Szenario 2: Backend-Agent Verarbeitung

**Schritte:**
1. Als Eltern-Konto einloggen
2. Test-PDF hochladen (Status sollte "pending" sein)
3. Backend-Agent starten:
   ```bash
   node scripts/agents/processUploads.mjs once
   ```
4. Agent-Logs prüfen
5. In Frontend prüfen, ob Upload-Status auf "ready" geändert wurde

**Erwartetes Ergebnis:**
- Agent findet pending Uploads
- Agent führt OCR durch (über OpenAI GPT-4 Vision)
- Agent generiert Aufgaben (über OpenAI GPT-4o-mini)
- Agent erstellt Tasks für alle Kinder
- Upload-Status wird auf "ready" aktualisiert
- Keine Authentifizierungsfehler

**Zu prüfen:**
- Agent-Logs zeigen erfolgreiche Verarbeitung
- Keine "FAILED_PRECONDITION" oder "Permission denied" Fehler
- Firestore: Upload hat `status: 'ready'`
- Tasks wurden erstellt

### Szenario 3: CORS-Fallback-Test

**Schritte:**
1. CORS-Regeln temporär entfernen (für Test)
2. PDF hochladen
3. Manuelle Verarbeitung starten
4. Prüfen, ob Fallback auf Firebase Storage SDK funktioniert

**Erwartetes Ergebnis:**
- Wenn `storagePath` vorhanden ist, wird Firebase Storage SDK verwendet
- Fallback auf URL-Download funktioniert bei Fehlern
- Fehlerbehandlung zeigt hilfreiche Meldungen

### Szenario 4: Fehlerbehandlung

**Schritte:**
1. Upload ohne API-Key versuchen (`.env.local` ohne `VITE_OPENAI_API_KEY`)
2. Upload mit ungültigem API-Key versuchen
3. Upload mit Rate-Limit-Fehler simulieren

**Erwartetes Ergebnis:**
- Klare Fehlermeldungen werden angezeigt
- Hinweise auf Backend-Agent werden gegeben
- Status wird auf "error" gesetzt
- Fehlerdetails werden in Firestore gespeichert

## Häufige Probleme und Lösungen

### Problem: CORS-Fehler beim Laden von PDFs
**Lösung:**
- CORS-Regeln erneut setzen: `gsutil cors set cors.json gs://lern-abenteuer-quiz-cursor.appspot.com`
- Prüfen, ob `storagePath` korrekt gesetzt ist
- Browser-Cache leeren (Hard Refresh: Cmd+Shift+R)

### Problem: Agent kann nicht authentifizieren
**Lösung:**
- `gcloud auth application-default login` ausführen
- Prüfen, ob Projekt korrekt gesetzt ist: `gcloud config set project lern-abenteuer-quiz-cursor`
- Prüfen, ob `.env.agent` korrekt konfiguriert ist

### Problem: Keine Tasks werden generiert
**Lösung:**
- Prüfen, ob API-Keys korrekt sind
- Prüfen, ob OCR Text extrahiert hat (sollte > 50 Zeichen sein)
- Prüfen Agent-Logs auf Fehler
- Prüfen, ob Kinder mit Eltern-Konto verknüpft sind

### Problem: PDF-Konvertierung schlägt fehl
**Lösung:**
- Prüfen, ob `pdfjs-dist` korrekt installiert ist
- Prüfen Browser-Konsole auf Worker-Fehler
- Prüfen, ob `storagePath` vorhanden ist und Firebase Storage SDK verwendet wird

## Monitoring

### Firestore-Queries zum Prüfen
```javascript
// Alle pending Uploads
db.collectionGroup('uploads').where('status', '==', 'pending').get()

// Alle Uploads eines Eltern-Kontos
db.collection('users/{parentId}/uploads').get()

// Alle Tasks eines Kindes
db.collection('users/{parentId}/kids/{kidId}/tasks').get()
```

### Logs prüfen
- Browser-Konsole: Frontend-Fehler und API-Aufrufe
- Agent-Logs: Backend-Verarbeitung und OCR/Task-Generierung
- Firebase Console: Storage-Zugriffe und Firestore-Operationen

## Nächste Schritte nach erfolgreichem Test

1. ✅ CORS-Konfiguration dokumentiert und gesetzt
2. ✅ Agent-Authentifizierung funktioniert
3. ✅ Frontend-Fehlerbehandlung verbessert
4. ✅ Upload-Flow getestet und dokumentiert

## Verbesserungen für Produktion

- [ ] Backend-Agent als Cloud Function oder Cloud Run deployen
- [ ] API-Keys komplett aus Frontend entfernen
- [ ] Rate Limiting für API-Aufrufe implementieren
- [ ] Monitoring und Alerting für Agent-Fehler
- [ ] Retry-Logik für fehlgeschlagene Verarbeitungen
- [ ] Batch-Verarbeitung für mehrere PDF-Seiten

