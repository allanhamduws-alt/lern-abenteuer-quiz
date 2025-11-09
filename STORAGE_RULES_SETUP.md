# 🔥 Firebase Storage Rules einrichten

## Problem
Der Fehler "User does not have permission to access" bedeutet, dass die Firebase Storage Security Rules fehlen oder nicht korrekt konfiguriert sind.

## ✅ Lösung: Storage Rules in Firebase Console setzen

### Schritt 1: Firebase Console öffnen
1. Gehen Sie zu: https://console.firebase.google.com/
2. Wählen Sie Ihr Projekt **lern-abenteuer-quiz-cursor** aus

### Schritt 2: Storage Rules öffnen
1. Klicken Sie im linken Menü auf **"Storage"** (oder "Speicher")
2. Falls Storage noch nicht aktiviert ist:
   - Klicken Sie auf **"Los geht's"** oder **"Get started"**
   - Wählen Sie **"Production mode"** aus
   - Wählen Sie einen Standort (z.B. `europe-west1`)
   - Klicken Sie auf **"Fertig"** oder **"Done"**
3. Klicken Sie auf den Tab **"Regeln"** oder **"Rules"** (oben)

### Schritt 3: Regeln einfügen
1. **LÖSCHEN Sie ALLE vorhandenen Regeln** (falls vorhanden)
2. **KOPIEREN Sie diese Regeln:**

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Helper-Funktion: Prüft ob Benutzer eingeloggt ist
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Helper-Funktion: Prüft ob Benutzer der Eigentümer des Pfads ist
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    // Benutzer können nur Dateien in ihrem eigenen Upload-Ordner hochladen/lesen
    match /users/{userId}/uploads/{allPaths=**} {
      allow read, write: if isOwner(userId);
    }
    
    // Alle anderen Pfade sind standardmäßig blockiert
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

3. **WICHTIG:** Klicken Sie auf **"Veröffentlichen"** oder **"Publish"** (oben rechts)
4. Warten Sie ca. 10-30 Sekunden, bis die Regeln aktiv sind

### Schritt 4: Testen
1. Gehen Sie zurück zur App (`localhost:5173/settings`)
2. Versuchen Sie erneut, eine Datei hochzuladen
3. Der Fehler sollte jetzt verschwunden sein! ✅

## Alternative: Mit Firebase CLI deployen

Falls Sie Firebase CLI verwenden möchten:

```bash
# 1. Einloggen
firebase login

# 2. Projekt auswählen
firebase use lern-abenteuer-quiz-cursor

# 3. Storage Rules deployen
firebase deploy --only storage
```

## Was die Regeln tun:
- ✅ Authentifizierte Benutzer können Dateien in `users/{ihreUserId}/uploads/` hochladen
- ✅ Benutzer können nur ihre eigenen Dateien lesen/schreiben
- ✅ Alle anderen Pfade sind blockiert (Sicherheit)

