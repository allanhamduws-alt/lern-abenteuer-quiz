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

3. **FÜGEN Sie die Regeln in das Textfeld ein**
4. **KLICKEN Sie auf "Veröffentlichen" oder "Publish"** (oben rechts, grüner Button)
5. **WARTEN Sie 10-30 Sekunden**, bis die Regeln aktiv sind

### Schritt 4: Testen
1. Gehen Sie zurück zur App (`http://localhost:5173`)
2. **Seite neu laden** (F5)
3. Spielen Sie ein Quiz
4. Die Fehlermeldung sollte verschwinden!
5. Die Fortschritte sollten jetzt gespeichert werden!

## Was bedeuten die Regeln?

- `request.auth != null` = Benutzer muss eingeloggt sein
- `request.auth.uid == userId` = Benutzer kann nur seine eigenen Daten ändern
- `allow read, write` = Erlaubt Lesen UND Schreiben

## Falls es immer noch nicht funktioniert

1. **Prüfen Sie die Browser-Konsole** (F12)
   - Gibt es noch Fehler?
   - Erscheinen die ✅ Erfolgs-Meldungen?

2. **Prüfen Sie Firebase Console**
   - Gehen Sie zu Firestore Database → Regeln
   - Stehen die Regeln noch da?
   - Wurden sie veröffentlicht? (Sollte grün markiert sein)

3. **Prüfen Sie, ob Sie eingeloggt sind**
   - In der App sollte Ihr Name oben rechts stehen
   - Falls nicht: Neu einloggen

4. **Löschen Sie Browser-Cache**
   - Strg+Shift+Delete (Windows) oder Cmd+Shift+Delete (Mac)
   - Cache leeren
   - Seite neu laden

## Nach dem Fix

Nachdem die Regeln gesetzt sind, sollten Sie sehen:
- ✅ "Fortschritt und Punkte gespeichert!" auf der ResultsPage
- ✅ Fortschritte im Dashboard auf der HomePage
- ✅ Keine Fehlermeldungen mehr in der Konsole

