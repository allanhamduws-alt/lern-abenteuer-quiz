# 🔍 Debug-Checkliste: Fortschritte werden nicht gespeichert

## ⚠️ GEFUNDEN: "Missing or insufficient permissions"

**Das Problem:** Die Firestore-Sicherheitsregeln blockieren das Schreiben!

## ✅ SOFORT-LÖSUNG:

### Schritt 1: Firebase Console öffnen
1. Gehen Sie zu [Firebase Console](https://console.firebase.google.com/)
2. Wählen Sie Ihr Projekt aus

### Schritt 2: Firestore-Regeln prüfen und setzen
1. Klicken Sie auf **Firestore Database** im linken Menü
2. Klicken Sie auf den Tab **"Regeln"** oder **"Rules"** (oben)
3. **LÖSCHEN Sie ALLE vorhandenen Regeln**
4. **FÜGEN Sie diese Regeln ein:**

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

5. **WICHTIG:** Klicken Sie auf **"Veröffentlichen"** oder **"Publish"** (oben rechts)
6. Warten Sie ca. 10 Sekunden, bis die Regeln aktiv sind

### Schritt 3: Testen
1. Gehen Sie zurück zur App
2. Spielen Sie ein Quiz
3. Die Fehlermeldung sollte verschwinden!
4. Die Fortschritte sollten jetzt gespeichert werden!

---

## Schritt 1: Browser-Konsole prüfen

1. Öffnen Sie die Browser-Konsole (F12)
2. Gehen Sie zum Tab "Console"
3. Spielen Sie ein Quiz
4. Prüfen Sie die Konsolen-Ausgaben:

**Erwartete Ausgaben:**
- `📝 Speichere Progress in Firebase: ...`
- `✅ Progress erfolgreich gespeichert und verifiziert!`
- `✅ Fortschritt erfolgreich gespeichert!`

**Wenn Fehler erscheinen:**
- `❌ Fehler beim Speichern des Fortschritts: ...`
- Kopieren Sie die Fehlermeldung!

## Schritt 2: Firebase Console prüfen

1. Gehen Sie zu [Firebase Console](https://console.firebase.google.com/)
2. Wählen Sie Ihr Projekt aus
3. Gehen Sie zu **Firestore Database**
4. Prüfen Sie die Collection `progress`
5. Suchen Sie nach einem Dokument mit Ihrer User-ID

**Was sollte vorhanden sein:**
- Collection: `progress`
- Dokument-ID: Ihre User-ID (z.B. `abc123...`)
- Felder: `totalQuizzesCompleted`, `totalPoints`, `subjects`, etc.

## Schritt 3: Firestore-Regeln prüfen

1. In Firebase Console → **Firestore Database** → **Regeln**
2. Prüfen Sie, ob diese Regeln vorhanden sind:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /progress/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

**WICHTIG:** Die Regeln müssen auf "Veröffentlichen" / "Publish" geklickt haben!

## Schritt 4: Häufige Fehler

### Fehler: "Missing or insufficient permissions"
**Ursache:** Firestore-Regeln blockieren das Schreiben
**Lösung:** Prüfen Sie Schritt 3 - Regeln müssen korrekt sein

### Fehler: "Permission denied"
**Ursache:** Benutzer ist nicht eingeloggt oder User-ID stimmt nicht
**Lösung:** 
- Prüfen Sie, ob Sie eingeloggt sind
- Melden Sie sich neu an

### Keine Fehler, aber Daten werden nicht gespeichert
**Ursache:** Firebase-Konfiguration fehlt oder ist falsch
**Lösung:**
- Prüfen Sie `.env.local` Datei
- Prüfen Sie, ob alle Werte korrekt sind
- Starten Sie den Dev-Server neu: `npm run dev`

## Schritt 5: Manueller Test

1. Öffnen Sie die Browser-Konsole (F12)
2. Gehen Sie zum Tab "Console"
3. Geben Sie ein:

```javascript
// Prüfen Sie Ihre User-ID
import { auth } from './src/services/firebase';
console.log('User:', auth.currentUser?.uid);

// Prüfen Sie Firebase-Verbindung
import { db } from './src/services/firebase';
console.log('Database:', db);
```

## Schritt 6: Ergebnisse melden

Wenn nichts funktioniert, kopieren Sie:
1. Die Konsolen-Fehlermeldungen
2. Screenshot der Firestore-Regeln
3. Screenshot der Firestore-Datenbank (progress Collection)

1. Öffnen Sie die Browser-Konsole (F12)
2. Gehen Sie zum Tab "Console"
3. Spielen Sie ein Quiz
4. Prüfen Sie die Konsolen-Ausgaben:

**Erwartete Ausgaben:**
- `📝 Speichere Progress in Firebase: ...`
- `✅ Progress erfolgreich gespeichert und verifiziert!`
- `✅ Fortschritt erfolgreich gespeichert!`

**Wenn Fehler erscheinen:**
- `❌ Fehler beim Speichern des Fortschritts: ...`
- Kopieren Sie die Fehlermeldung!

## Schritt 2: Firebase Console prüfen

1. Gehen Sie zu [Firebase Console](https://console.firebase.google.com/)
2. Wählen Sie Ihr Projekt aus
3. Gehen Sie zu **Firestore Database**
4. Prüfen Sie die Collection `progress`
5. Suchen Sie nach einem Dokument mit Ihrer User-ID

**Was sollte vorhanden sein:**
- Collection: `progress`
- Dokument-ID: Ihre User-ID (z.B. `abc123...`)
- Felder: `totalQuizzesCompleted`, `totalPoints`, `subjects`, etc.

## Schritt 3: Firestore-Regeln prüfen

1. In Firebase Console → **Firestore Database** → **Regeln**
2. Prüfen Sie, ob diese Regeln vorhanden sind:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /progress/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

**WICHTIG:** Die Regeln müssen auf "Veröffentlichen" / "Publish" geklickt haben!

## Schritt 4: Häufige Fehler

### Fehler: "Missing or insufficient permissions"
**Ursache:** Firestore-Regeln blockieren das Schreiben
**Lösung:** Prüfen Sie Schritt 3 - Regeln müssen korrekt sein

### Fehler: "Permission denied"
**Ursache:** Benutzer ist nicht eingeloggt oder User-ID stimmt nicht
**Lösung:** 
- Prüfen Sie, ob Sie eingeloggt sind
- Melden Sie sich neu an

### Keine Fehler, aber Daten werden nicht gespeichert
**Ursache:** Firebase-Konfiguration fehlt oder ist falsch
**Lösung:**
- Prüfen Sie `.env.local` Datei
- Prüfen Sie, ob alle Werte korrekt sind
- Starten Sie den Dev-Server neu: `npm run dev`

## Schritt 5: Manueller Test

1. Öffnen Sie die Browser-Konsole (F12)
2. Gehen Sie zum Tab "Console"
3. Geben Sie ein:

```javascript
// Prüfen Sie Ihre User-ID
import { auth } from './src/services/firebase';
console.log('User:', auth.currentUser?.uid);

// Prüfen Sie Firebase-Verbindung
import { db } from './src/services/firebase';
console.log('Database:', db);
```

## Schritt 6: Ergebnisse melden

Wenn nichts funktioniert, kopieren Sie:
1. Die Konsolen-Fehlermeldungen
2. Screenshot der Firestore-Regeln
3. Screenshot der Firestore-Datenbank (progress Collection)

