# 🔧 Firebase Storage CORS-Konfiguration

## Problem
Firebase Storage blockiert Anfragen von `localhost:5173` wegen fehlender CORS-Header.

**WICHTIG:** Falls du CORS-Fehler siehst, folge der detaillierten Anleitung in `CORS_FIX_ANLEITUNG.md`

## ✅ Lösung: CORS-Regeln setzen

### Option 1: Über Terminal (Empfohlen)

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

5. **Prüfen** (optional):
   ```bash
   gsutil cors get gs://lern-abenteuer-quiz-cursor.appspot.com
   ```

### Option 2: Über Google Cloud Console

1. **Google Cloud Console öffnen**:
   - https://console.cloud.google.com/
   - Projekt `lern-abenteuer-quiz-cursor` auswählen

2. **Cloud Shell öffnen**:
   - Klicke oben rechts auf das Terminal-Symbol (Cloud Shell)

3. **In Cloud Shell ausführen**:
   ```bash
   # CORS-Datei erstellen
   cat > cors.json << 'EOF'
   [
     {
       "origin": ["http://localhost:5173", "http://localhost:*"],
       "method": ["GET", "HEAD"],
       "responseHeader": ["Content-Type", "Content-Length"],
       "maxAgeSeconds": 3600
     }
   ]
   EOF

   # CORS-Regeln setzen
   gsutil cors set cors.json gs://lern-abenteuer-quiz-cursor.appspot.com

   # Prüfen
   gsutil cors get gs://lern-abenteuer-quiz-cursor.appspot.com
   ```

### Option 3: Über Firebase Console (falls verfügbar)

1. **Firebase Console öffnen**:
   - https://console.firebase.google.com/
   - Projekt `lern-abenteuer-quiz-cursor` auswählen

2. **Storage öffnen**:
   - Klicke auf "Storage" im linken Menü
   - Gehe zu "Settings" oder "Regeln"

3. **CORS-Regeln hinzufügen**:
   - Falls eine CORS-Sektion vorhanden ist, füge die Regeln aus `cors.json` hinzu

## Nach der Konfiguration

1. **Seite neu laden** im Browser
2. **PDF erneut hochladen** und verarbeiten
3. **CORS-Fehler sollte verschwinden** ✅

## Troubleshooting

**Fehler: "Reauthentication required"**
- Führe `gcloud auth login` aus
- Oder verwende Option 2 (Cloud Shell)

**Fehler: "Bucket not found"**
- Prüfe den Bucket-Namen in Firebase Console → Storage → Settings
- Verwende den korrekten Bucket-Namen statt `lern-abenteuer-quiz-cursor.appspot.com`

**CORS funktioniert immer noch nicht**
- Warte 1-2 Minuten nach dem Setzen der Regeln
- Prüfe Browser-Cache (Hard Refresh: Cmd+Shift+R)
- Prüfe, ob die Regeln korrekt gesetzt wurden: `gsutil cors get gs://...`

