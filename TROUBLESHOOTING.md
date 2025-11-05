# 🔧 Schnelle Hilfe: Login/Registrierung funktioniert nicht

## ✅ Checkliste - Bitte Schritt für Schritt durchgehen:

### 1. Firebase-Konfiguration prüfen
- [ ] Datei `.env.local` existiert (im Projekt-Root)
- [ ] Alle 4 Werte sind eingetragen:
  - `VITE_FIREBASE_API_KEY=...`
  - `VITE_FIREBASE_AUTH_DOMAIN=...`
  - `VITE_FIREBASE_PROJECT_ID=...`
  - `VITE_FIREBASE_APP_ID=...`
- [ ] **KEINE Anführungszeichen** um die Werte!
- [ ] Server neu gestartet nach Änderung? (`npm run dev`)

### 2. Firebase Authentication aktivieren
- [ ] In Firebase Console → Authentication → Sign-in method
- [ ] Email/Password ist **aktiviert** (erste Option)
- [ ] Auf "Speichern" geklickt

### 3. Firestore-Regeln setzen ⚠️ WICHTIG!
Gehen Sie zu: **Firebase Console → Firestore Database → Regeln**

Fügen Sie diese Regeln ein:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Benutzer können nur ihre eigenen Daten lesen/schreiben
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Progress-Daten können nur vom eigenen Benutzer gelesen/geschrieben werden
    match /progress/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

**WICHTIG**: Klicken Sie auf "Veröffentlichen" / "Publish"!

### 4. Neuen Account testen

**Für Registrierung:**
1. Öffnen Sie die App (`http://localhost:5173`)
2. Klicken Sie auf "Registrieren"
3. Füllen Sie alle Felder aus:
   - Name: z.B. "Max"
   - Alter: z.B. 8 (optional)
   - Avatar: Wählen Sie einen
   - Jahrgang: z.B. 2024
   - Klasse: z.B. Klasse 2
   - E-Mail: z.B. `test@example.com`
   - Passwort: Mindestens 6 Zeichen!
4. Klicken Sie auf "Registrieren"

**Prüfen Sie in Firebase Console:**
- Authentication → Users → Neuer Benutzer sollte erscheinen
- Firestore Database → Collection `users` → Dokument sollte erstellt sein

### 5. Fehlerbehebung

**Fehler: "E-Mail oder Passwort ist falsch"**
- Prüfen Sie, ob der Account existiert (in Firebase Console)
- Versuchen Sie sich zu registrieren statt einzuloggen
- Prüfen Sie Passwort (Groß-/Kleinschreibung!)

**Fehler: "Zugriff verweigert"**
- **Firestore-Regeln sind falsch oder nicht gesetzt!**
- Gehen Sie zu Schritt 3 und setzen Sie die Regeln

**Fehler: "Email already in use"**
- Der Account existiert bereits
- Versuchen Sie sich einzuloggen statt zu registrieren
- Oder löschen Sie den Account in Firebase Console → Authentication → Users

**Account existiert, aber Login funktioniert nicht:**
- Prüfen Sie, ob User-Daten in Firestore existieren (Collection `users`)
- Falls nicht: Account wurde nur in Auth erstellt, nicht in Firestore
- Lösung: Löschen Sie den Account in Auth und registrieren Sie sich erneut

### 6. Entwickler-Konsole prüfen

Öffnen Sie die Browser-Konsole (F12) und prüfen Sie auf Fehler:
- Rote Fehlermeldungen zeigen meist das Problem
- Suchen Sie nach "Firebase", "permission", "auth"

### 7. Neustart versuchen

Wenn nichts hilft:
1. Stoppen Sie den Server (Strg+C)
2. Löschen Sie Browser-Cache / Local Storage
3. Starten Sie Server neu: `npm run dev`
4. Versuchen Sie es erneut

## 📞 Wenn immer noch nichts funktioniert:

Prüfen Sie die Browser-Konsole (F12) und senden Sie mir:
- Die genaue Fehlermeldung
- Was Sie genau gemacht haben
- Screenshot der Firebase Console (Firestore-Regeln)

