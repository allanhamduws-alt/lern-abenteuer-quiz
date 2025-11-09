# 🤖 Agent Setup - Upload-Verarbeitung

## Problem
Der Agent benötigt Authentifizierung, um auf Firestore und Storage zugreifen zu können.

## ✅ Lösung: Authentifizierung einrichten

### Option 1: Application Default Credentials (Empfohlen, wenn Service-Account-Key nicht möglich)

Wenn die Erstellung von Service-Account-Schlüsseln durch Organisationsrichtlinien blockiert ist, verwenden Sie Application Default Credentials:

#### Schritt 1: Google Cloud CLI installieren
Falls noch nicht installiert:
- macOS: `brew install google-cloud-sdk`
- Oder: https://cloud.google.com/sdk/docs/install

#### Schritt 2: Authentifizierung einrichten
```bash
# Mit Google Cloud anmelden
gcloud auth login

# Application Default Credentials einrichten
gcloud auth application-default login

# Projekt setzen
gcloud config set project lern-abenteuer-quiz-cursor
```

#### Schritt 3: .env.agent konfigurieren
Die Application Default Credentials werden automatisch von `~/.config/gcloud/application_default_credentials.json` geladen.

**WICHTIG:** Lassen Sie `GOOGLE_APPLICATION_CREDENTIALS` in `.env.agent` leer oder setzen Sie es auf den Pfad der Application Default Credentials:

```bash
# Option A: Leer lassen (verwendet automatisch Application Default Credentials)
# GOOGLE_APPLICATION_CREDENTIALS=

# Option B: Explizit auf Application Default Credentials zeigen
GOOGLE_APPLICATION_CREDENTIALS=~/.config/gcloud/application_default_credentials.json
```

### Option 2: Service-Account-Key (Falls möglich)

#### Schritt 1: Firebase Console öffnen
1. Gehen Sie zu: https://console.firebase.google.com/
2. Wählen Sie Ihr Projekt: **lern-abenteuer-quiz-cursor**

#### Schritt 2: Service-Account erstellen
1. Klicken Sie auf das **Zahnrad-Symbol** (⚙️) neben "Project Overview"
2. Wählen Sie **"Project settings"**
3. Gehen Sie zum Tab **"Service accounts"**
4. Klicken Sie auf **"Generate new private key"**
5. Bestätigen Sie mit **"Generate key"**
6. Eine JSON-Datei wird heruntergeladen (z.B. `lern-abenteuer-quiz-cursor-firebase-adminsdk-xxxxx.json`)

**HINWEIS:** Falls die Option "Generate new private key" nicht verfügbar ist oder blockiert wird, verwenden Sie **Option 1** (Application Default Credentials).

#### Schritt 3: Service-Account-Datei speichern
1. Speichern Sie die heruntergeladene JSON-Datei im Projekt-Root (gleicher Ordner wie `package.json`)
2. Benennen Sie sie um zu: `service-account.json` (oder behalten Sie den Originalnamen)

#### Schritt 4: .env.agent aktualisieren
Fügen Sie den Pfad zur Service-Account-Datei in `.env.agent` hinzu:

```bash
GOOGLE_APPLICATION_CREDENTIALS=/Users/allanha/lern-abenteuer-quiz/service-account.json
```

**WICHTIG:** Verwenden Sie den **absoluten Pfad** zur Datei!

### Schritt 5: Agent starten
```bash
npm run agent:uploads:watch
```

Oder für einmalige Verarbeitung:
```bash
node scripts/agents/processUploads.mjs once
```

## Was der Agent macht:
1. ✅ Prüft alle 30 Sekunden nach neuen Uploads (Status: "pending")
2. ✅ Führt OCR durch (Text aus PDF/Bild extrahieren)
3. ✅ Generiert Aufgaben basierend auf dem Material
4. ✅ Erstellt Tasks für jedes Kind des Eltern-Kontos
5. ✅ Aktualisiert den Status auf "ready"

## Troubleshooting

**Fehler: "FAILED_PRECONDITION" oder "Could not load the default credentials"**
- Lösung: Führen Sie `gcloud auth application-default login` aus
- Oder: Stellen Sie sicher, dass `GOOGLE_APPLICATION_CREDENTIALS` auf eine gültige Datei zeigt

**Fehler: "Permission denied"**
- Lösung: Stellen Sie sicher, dass Ihr Google-Konto Zugriff auf das Firebase-Projekt hat
- Prüfen Sie die IAM-Berechtigungen in der Google Cloud Console

**Fehler: "Das Erstellen von Schlüsseln ist für dieses Dienstkonto nicht zulässig"**
- Lösung: Verwenden Sie Option 1 (Application Default Credentials) statt Service-Account-Key

**Agent läuft, aber Uploads werden nicht verarbeitet**
- Prüfen Sie die Konsolen-Ausgabe des Agents
- Prüfen Sie, ob die API-Keys (OpenAI, Gemini) in `.env.agent` korrekt gesetzt sind
- Prüfen Sie, ob Uploads mit Status "pending" in Firestore existieren

