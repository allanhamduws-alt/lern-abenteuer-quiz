# Firebase Setup-Anleitung

Diese Anleitung hilft Ihnen dabei, Firebase für die Lern-Abenteuer-Quiz App einzurichten.

## Schritt 1: Firebase-Projekt erstellen

1. Gehen Sie zu [Firebase Console](https://console.firebase.google.com/)
2. Klicken Sie auf "Projekt hinzufügen" oder "Add project"
3. Geben Sie einen Projektnamen ein (z.B. "lern-abenteuer-quiz")
4. Folgen Sie den Anweisungen:
   - Google Analytics ist optional (können Sie aktivieren oder deaktivieren)
   - Klicken Sie auf "Projekt erstellen"

## Schritt 2: Authentication aktivieren

1. In der Firebase-Konsole, klicken Sie auf "Authentication" im linken Menü
2. Klicken Sie auf "Get started" oder "Loslegen"
3. Gehen Sie zum Tab "Sign-in method"
4. Klicken Sie auf "Email/Password"
5. Aktivieren Sie "Email/Password" (erste Option)
6. Klicken Sie auf "Speichern"

## Schritt 3: Firestore-Datenbank einrichten

1. In der Firebase-Konsole, klicken Sie auf "Firestore Database" im linken Menü
2. Klicken Sie auf "Erstellen Sie eine Datenbank" oder "Create database"
3. Wählen Sie "Testmodus starten" (für Entwicklung) oder "Produktionsmodus"
   - **Wichtig**: Für Produktion müssen Sie später Sicherheitsregeln einrichten
4. Wählen Sie einen Standort (z.B. "europe-west")
5. Klicken Sie auf "Aktivieren"

## Schritt 4: Firebase-Konfiguration abrufen

1. In der Firebase-Konsole, klicken Sie auf das Zahnrad-Symbol neben "Projektübersicht"
2. Wählen Sie "Projekteinstellungen" oder "Project settings"
3. Scrollen Sie nach unten zu "Ihre Apps" oder "Your apps"
4. Klicken Sie auf das Web-Symbol (`</>`)
5. Geben Sie einen App-Namen ein (z.B. "Lern-Abenteuer-Quiz")
6. Optional: Fügen Sie Firebase Hosting hinzu (können Sie später machen)
7. Klicken Sie auf "App registrieren"
8. Sie sehen jetzt die Firebase-Konfiguration, die so aussieht:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "ihr-projekt.firebaseapp.com",
  projectId: "ihr-projekt-id",
  appId: "1:123456789:web:abcdef"
};
```

## Schritt 5: Konfiguration in die App einfügen

1. Kopieren Sie die Datei `.env.example` zu `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Öffnen Sie `.env.local` und fügen Sie Ihre Firebase-Werte ein:
   ```
   VITE_FIREBASE_API_KEY=AIzaSy... (Ihr apiKey)
   VITE_FIREBASE_AUTH_DOMAIN=ihr-projekt.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=ihr-projekt-id
   VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
   ```

3. Speichern Sie die Datei

## Schritt 6: Firestore-Sicherheitsregeln (Wichtig für Produktion)

Für die Entwicklung können Sie diese Regeln verwenden (unsicher für Produktion!):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Benutzer können nur ihre eigenen Daten lesen/schreiben
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

**So setzen Sie die Regeln:**
1. Gehen Sie zu Firestore Database
2. Klicken Sie auf den Tab "Regeln" oder "Rules"
3. Fügen Sie die Regeln oben ein
4. Klicken Sie auf "Veröffentlichen" oder "Publish"

## Schritt 7: Testen

1. Starten Sie die App:
   ```bash
   npm run dev
   ```

2. Gehen Sie zu `http://localhost:5173`
3. Versuchen Sie sich zu registrieren mit einer E-Mail-Adresse
4. Prüfen Sie in der Firebase-Konsole unter "Authentication" > "Users", ob der Benutzer erstellt wurde
5. Prüfen Sie in "Firestore Database", ob die Benutzer-Daten gespeichert wurden

## Häufige Probleme

**Problem**: "Firebase: Error (auth/invalid-api-key)"
- Lösung: Prüfen Sie, ob die Werte in `.env.local` korrekt sind (keine Anführungszeichen!)

**Problem**: "Firebase: Missing or insufficient permissions"
- Lösung: Prüfen Sie die Firestore-Regeln. Für Entwicklung können Sie temporär alle Lese-/Schreibrechte erlauben (nur für Tests!)

**Problem**: "Firebase: Email/Password is not enabled"
- Lösung: Gehen Sie zu Authentication > Sign-in method und aktivieren Sie Email/Password

## Nächste Schritte

Nachdem Firebase eingerichtet ist, können Sie:
- Die App lokal testen
- Weitere Fragen hinzufügen
- Die App deployen (siehe README.md)

