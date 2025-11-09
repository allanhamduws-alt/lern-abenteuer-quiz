# 🔥 Firestore Rules für Uploads fixen

## Problem
Der Fehler "Missing or insufficient permissions" beim Hochladen von Materialien bedeutet, dass die Firestore-Regeln nicht korrekt konfiguriert sind.

## ✅ Lösung: Regeln in Firebase Console aktualisieren

### Schritt 1: Firebase Console öffnen
1. Gehen Sie zu: https://console.firebase.google.com/
2. Wählen Sie Ihr Projekt **lern-abenteuer-quiz-cursor** aus

### Schritt 2: Firestore Rules öffnen
1. Klicken Sie im linken Menü auf **"Firestore Database"**
2. Klicken Sie oben auf den Tab **"Regeln"** oder **"Rules"**

### Schritt 3: Regeln aktualisieren
1. **KOPIEREN Sie den kompletten Inhalt** aus der Datei `firestore.rules` (im Projekt-Root)
2. **FÜGEN Sie die Regeln in die Firebase Console ein** (ersetzen Sie alle vorhandenen Regeln)
3. **WICHTIG:** Klicken Sie auf **"Veröffentlichen"** oder **"Publish"** (oben rechts)
4. Warten Sie ca. 10-30 Sekunden, bis die Regeln aktiv sind

### Schritt 4: Testen
1. Gehen Sie zurück zur App (`localhost:5173/settings`)
2. Versuchen Sie erneut, eine Datei hochzuladen
3. Der Fehler sollte jetzt verschwunden sein! ✅

## Was wurde geändert?

Die Regel für Uploads wurde expliziter gemacht:
- `allow create` wurde explizit hinzugefügt (für neue Dokumente)
- `allow read` für das Lesen der Uploads
- `allow update, delete` für das Aktualisieren/Löschen

Die Regel prüft, dass nur der Eigentümer (`userId`) Dateien in seinem eigenen Upload-Ordner erstellen/lesen kann.

## Alternative: Mit Firebase CLI deployen

Falls Sie Firebase CLI verwenden möchten:

```bash
# 1. Einloggen (falls noch nicht geschehen)
firebase login

# 2. Projekt auswählen
firebase use lern-abenteuer-quiz-cursor

# 3. Firestore Rules deployen
firebase deploy --only firestore:rules
```

## Wichtig
- Die Regeln müssen **in Firebase Console veröffentlicht** werden, damit sie aktiv werden
- Nach dem Veröffentlichen kann es 10-30 Sekunden dauern, bis die Regeln aktiv sind
- Starten Sie die App nicht neu - die Regeln werden serverseitig aktualisiert

