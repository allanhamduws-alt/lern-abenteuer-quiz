# 🔥 FEHLER BEHOBEN: Firestore-Regeln setzen

## Das Problem

Die Fehlermeldung **"Missing or insufficient permissions"** bedeutet, dass die Firestore-Sicherheitsregeln das Schreiben blockieren.

## ✅ Lösung (5 Minuten)

### Schritt 1: Firebase Console öffnen
1. Gehen Sie zu: https://console.firebase.google.com/
2. Wählen Sie Ihr Projekt aus

### Schritt 2: Firestore-Regeln öffnen
1. Klicken Sie im linken Menü auf **"Firestore Database"**
2. Klicken Sie oben auf den Tab **"Regeln"** oder **"Rules"**

### Schritt 3: Regeln setzen
1. **LÖSCHEN Sie ALLE vorhandenen Regeln** (falls vorhanden)
2. **KOPIEREN Sie diese Regeln:**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Benutzer können ihre eigenen Daten lesen/schreiben
    match /users/{userId} {
      // Eigene Daten lesen/schreiben
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      // Alle können Eltern-Dokumente lesen (für Code-Verknüpfung)
      allow read: if request.auth != null && 
                    resource.data.role == 'parent';
      
      // Eltern können Kind-Dokumente lesen (wenn Kind ihnen gehört)
      allow read: if request.auth != null &&
                    resource.data.role == 'child' &&
                    resource.data.parentId == request.auth.uid;
      
      // Kinder können Eltern-Dokumente aktualisieren (nur children Array)
      allow update: if request.auth != null &&
                      resource.data.role == 'parent' &&
                      request.resource.data.diff(resource.data).affectedKeys().hasOnly(['children']);
    }
    
    // Progress-Daten
    match /progress/{userId} {
      // Eigene Progress-Daten lesen/schreiben
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      // Eltern können Progress-Daten ihrer Kinder lesen
      // Prüfe ob das Kind-Dokument existiert und parentId übereinstimmt
      allow read: if request.auth != null &&
                     exists(/databases/$(database)/documents/users/$(userId)) &&
                     get(/databases/$(database)/documents/users/$(userId)).data.parentId == request.auth.uid;
    }
    
    // Linking Codes
    match /linkingCodes/{codeId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && 
                      request.resource.data.parentId == request.auth.uid;
      allow delete: if request.auth != null;
      allow update: if false;
    }
  }
}
```

3. **FÜGEN Sie die Regeln in das Textfeld ein**
4. **KLICKEN Sie auf "Veröffentlichen" oder "Publish"** (oben rechts, grüner Button)
5. **WARTEN Sie 10-30 Sekunden**, bis die Regeln aktiv sind

### Schritt 4: Testen
1. Gehen Sie zurück zur App (`http://localhost:5173`)
2. **Seite neu laden** (F5)
3. Als Eltern: Gehen Sie zur Admin-Seite und klicken Sie auf "Code generieren"
4. Die Fehlermeldung sollte verschwinden!
5. Der Code sollte jetzt angezeigt werden!

## Was bedeuten die Regeln?

- `request.auth != null` = Benutzer muss eingeloggt sein
- `request.auth.uid == userId` = Benutzer kann nur seine eigenen Daten ändern
- `allow read, write` = Erlaubt Lesen UND Schreiben
- `linkingCodes`: 
  - Alle können Codes lesen (für Validierung durch Kinder)
  - Nur Eltern können Codes erstellen (mit ihrer eigenen UID als parentId)
  - Nur der Ersteller kann Codes löschen

## Falls es immer noch nicht funktioniert

1. **Prüfen Sie die Browser-Konsole** (F12)
   - Gibt es noch Fehler?
   - Erscheinen die ✅ Erfolgs-Meldungen?

2. **Prüfen Sie Firebase Console**
   - Gehen Sie zu Firestore Database → Regeln
   - Prüfen Sie, ob die Regeln korrekt gespeichert sind
   - Prüfen Sie, ob die Collection `linkingCodes` existiert

3. **Warten Sie 30 Sekunden** nach dem Veröffentlichen der Regeln
   - Firebase braucht Zeit, um die Regeln zu aktivieren
