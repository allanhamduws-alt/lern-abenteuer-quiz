# CORS-Fehler beheben - Schritt-für-Schritt Anleitung

## Problem
Die CORS-Fehler verhindern, dass PDFs aus Firebase Storage geladen werden können. Die Fehlermeldung zeigt:
```
Access to XMLHttpRequest at 'https://firebasestorage.googleapis.com/...' 
from origin 'http://localhost:5173' has been blocked by CORS policy
```

## Lösung: CORS-Regeln setzen

### Option 1: Über Google Cloud Console (Empfohlen)

1. **Google Cloud Console öffnen**
   - Gehe zu: https://console.cloud.google.com/
   - Stelle sicher, dass das Projekt `lern-abenteuer-quiz-cursor` ausgewählt ist

2. **Cloud Shell öffnen**
   - Klicke oben rechts auf das Terminal-Symbol (Cloud Shell)
   - Warte bis die Shell geladen ist

3. **CORS-Datei hochladen oder erstellen**
   - In der Cloud Shell, navigiere zu einem temporären Verzeichnis:
     ```bash
     cd /tmp
     ```
   - Erstelle die `cors.json` Datei:
     ```bash
     cat > cors.json << 'EOF'
     [
       {
         "origin": ["http://localhost:5173", "http://localhost:*", "https://*.web.app", "https://*.firebaseapp.com"],
         "method": ["GET", "HEAD", "OPTIONS"],
         "responseHeader": ["Content-Type", "Content-Length", "Content-Range", "Accept-Ranges"],
         "maxAgeSeconds": 3600
       }
     ]
     EOF
     ```

4. **CORS-Regeln setzen**
   ```bash
   gsutil cors set cors.json gs://lern-abenteuer-quiz-cursor.appspot.com
   ```

5. **Prüfen ob es funktioniert hat**
   ```bash
   gsutil cors get gs://lern-abenteuer-quiz-cursor.appspot.com
   ```
   
   Du solltest die CORS-Regeln sehen, die du gerade gesetzt hast.

### Option 2: Über lokales Terminal (falls gcloud auth funktioniert)

1. **Terminal öffnen** und ins Projektverzeichnis wechseln:
   ```bash
   cd /Users/allanha/lern-abenteuer-quiz
   ```

2. **Authentifizierung erneuern** (falls nötig):
   ```bash
   gcloud auth login
   ```
   - Öffnet einen Browser für die Anmeldung
   - Folge den Anweisungen

3. **Projekt setzen**:
   ```bash
   gcloud config set project lern-abenteuer-quiz-cursor
   ```

4. **CORS-Regeln setzen**:
   ```bash
   gsutil cors set cors.json gs://lern-abenteuer-quiz-cursor.appspot.com
   ```

5. **Prüfen**:
   ```bash
   gsutil cors get gs://lern-abenteuer-quiz-cursor.appspot.com
   ```

### Option 3: Über Firebase Console (falls verfügbar)

1. Gehe zu: https://console.firebase.google.com/
2. Wähle Projekt: `lern-abenteuer-quiz-cursor`
3. Gehe zu: **Storage** → **Files**
4. Klicke auf **Settings** oder das Zahnrad-Symbol
5. Suche nach **CORS** oder **Cross-Origin** Einstellungen
6. Füge die CORS-Regeln manuell hinzu (falls diese Option verfügbar ist)

## Nach dem Setzen der CORS-Regeln

1. **Warte 1-2 Minuten** - CORS-Änderungen können kurz dauern

2. **Browser-Cache leeren**:
   - Chrome/Edge: `Cmd+Shift+R` (Mac) oder `Ctrl+Shift+R` (Windows)
   - Oder: Entwicklertools öffnen → Rechtsklick auf Reload-Button → "Empty Cache and Hard Reload"

3. **Teste erneut**:
   - Lade ein PDF hoch
   - Versuche die manuelle Verarbeitung zu starten
   - Prüfe die Browser-Konsole - CORS-Fehler sollten verschwunden sein

## Prüfen ob CORS funktioniert

Nach dem Setzen der CORS-Regeln solltest du in der Browser-Konsole sehen:
- ✅ Keine CORS-Fehler mehr
- ✅ `📥 Lade PDF über Firebase Storage SDK (umgeht CORS)... Pfad: ...` wird erfolgreich ausgeführt
- ✅ `✅ PDF geladen: X Bytes` erscheint

## Falls CORS weiterhin nicht funktioniert

### Alternative: Backend-Agent verwenden

Wenn CORS-Setzen nicht möglich ist (z.B. wegen Organisationsrichtlinien), kannst du die Verarbeitung komplett über den Backend-Agent laufen lassen:

1. **Backend-Agent starten** (siehe `AGENT_SETUP.md`):
   ```bash
   node scripts/agents/processUploads.mjs once
   ```

2. **Uploads werden automatisch verarbeitet** - keine manuelle Verarbeitung im Frontend nötig

3. **Frontend zeigt nur Ergebnisse** - keine API-Keys im Browser nötig

## Troubleshooting

**Fehler: "Bucket not found"**
- Prüfe den Bucket-Namen in Firebase Console → Storage → Settings
- Der Bucket-Name könnte `lern-abenteuer-quiz-cursor.firebasestorage.app` sein statt `.appspot.com`
- Versuche beide:
  ```bash
  gsutil cors set cors.json gs://lern-abenteuer-quiz-cursor.appspot.com
  gsutil cors set cors.json gs://lern-abenteuer-quiz-cursor.firebasestorage.app
  ```

**Fehler: "Permission denied"**
- Stelle sicher, dass dein Google-Konto die Rolle "Storage Admin" oder "Owner" hat
- Prüfe IAM-Berechtigungen in Google Cloud Console

**CORS funktioniert immer noch nicht nach 5 Minuten**
- Prüfe, ob die Regeln korrekt gesetzt wurden: `gsutil cors get gs://...`
- Stelle sicher, dass `http://localhost:5173` in der `origin` Liste ist
- Prüfe Browser-Cache (Hard Refresh)
- Versuche einen anderen Browser

