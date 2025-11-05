# Lern-Abenteuer-Quiz

Eine interaktive Lern-App für Grundschulkinder (Klassen 1-4) mit Quiz-Fragen, Punkten und Gamification-Elementen.

> **📚 Wichtige Dokumentation:**
> - [`ENTWICKLUNGSLEITFADEN.md`](./ENTWICKLUNGSLEITFADEN.md) - **Hauptleitfaden für alle Entwicklungen**
> - [`ENTWICKLUNGS_FAHRPLAN.md`](./ENTWICKLUNGS_FAHRPLAN.md) - Konkreter Fahrplan für nächste Schritte
> - [`PROJEKT_STATUS.md`](./PROJEKT_STATUS.md) - Aktueller Stand und Status
> - [`FIREBASE_SETUP.md`](./FIREBASE_SETUP.md) - Firebase-Einrichtung

## 📚 Dokumentation

- **[ENTWICKLUNGSLEITFADEN.md](./ENTWICKLUNGSLEITFADEN.md)** - Umfassender Leitfaden mit Design-Philosophie, Best Practices und Features
- **[ENTWICKLUNGS_FAHRPLAN.md](./ENTWICKLUNGS_FAHRPLAN.md)** - Konkreter Fahrplan für die nächsten Entwicklungsschritte
- **[PROJEKT_STATUS.md](./PROJEKT_STATUS.md)** - Aktueller Stand und Status des Projekts
- **[FIREBASE_SETUP.md](./FIREBASE_SETUP.md)** - Detaillierte Firebase-Einrichtungsanleitung
- **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** - Fehlerbehebung und häufige Probleme

## 🎯 Features

### Grundfunktionen
- ✅ Einfache Login/Register-Funktion
- ✅ Klassenauswahl (1-4)
- ✅ Fachauswahl (Mathematik, Deutsch, Naturwissenschaften, Kunst, Logik)
- ✅ Punkte-System
- ✅ Ergebnis-Anzeige mit detailliertem Feedback
- ✅ Fortschritts-Tracking
- ✅ Lernstreak-System
- ✅ Schwierige Aufgaben-Tracking

### Quiz-Features
- ✅ Multiple-Choice Quiz-Fragen
- ✅ Input-Fragen (direkte Eingabe)
- ✅ Drag & Drop Fragen
- ✅ Sofortiges visuelles Feedback (grün/rot beim Klick)
- ✅ Adaptive Schwierigkeit (passt sich automatisch an)
- ✅ Manuelle Navigation zwischen Fragen (Pfeile)
- ✅ Grüner Fortschrittsbalken

### Storytelling & Gamification
- ✅ Storytelling-Elemente mit Charakteren Max & Luna
- ✅ Verschiedene Welten pro Fach (Mathe-Land, Deutsch-Stadt, etc.)
- ✅ Badge-System (5 Badges implementiert)
- ✅ Konfetti-Animationen bei größeren Erfolgen (Milestones)
- ✅ Sterne-Animation bei perfektem Quiz (100%)

### Fragen-Anpassung
- ✅ Klasse 1-2: Direkte Fragen ohne Textaufgaben (kinderfreundlich)
- ✅ Klasse 3+: 50% mit StoryText, 50% ohne
- ✅ Mindestens 10 Fragen pro Klasse/Fach
- ✅ Alle Fragen mit Schwierigkeits-Level (leicht/mittel/schwer)

## 🚀 Schnellstart

### Voraussetzungen

- Node.js (Version 18 oder höher)
- npm (wird mit Node.js installiert)
- Firebase-Konto (kostenlos)

### Installation

1. Dependencies installieren:
```bash
npm install
```

2. Firebase-Konfiguration einrichten:
   - Kopieren Sie `.env.example` zu `.env.local`
   - Erstellen Sie ein Firebase-Projekt in der [Firebase-Konsole](https://console.firebase.google.com/)
   - Aktivieren Sie Authentication (Email/Password) und Firestore
   - Kopieren Sie die Firebase-Konfigurationswerte in `.env.local`

3. Entwicklungsserver starten:
```bash
npm run dev
```

Die App läuft dann unter `http://localhost:5173`

## 📁 Projektstruktur

```
src/
├── components/        # Wiederverwendbare UI-Komponenten
│   ├── ui/           # Button, Card, Header, Badge, Confetti, Stars, LoadingSpinner
│   ├── quiz/         # Fragetyp-Komponenten
│   │   ├── InputQuestion.tsx
│   │   └── DragDropQuestion.tsx
│   └── story/        # Storytelling-Komponenten
│       └── StoryCard.tsx
├── pages/            # Seiten-Komponenten
│   ├── LoginPage.tsx
│   ├── HomePage.tsx
│   ├── QuizPage.tsx
│   ├── ResultsPage.tsx
│   ├── ProgressPage.tsx
│   └── PracticePage.tsx
├── services/         # Firebase-Services
│   ├── firebase.ts   # Firebase-Konfiguration
│   ├── auth.ts       # Authentifizierung
│   └── progress.ts   # Fortschritts-Tracking
├── data/             # Quiz-Fragen & Badges
│   ├── questions.ts  # Alle Quiz-Fragen
│   └── badges.ts     # Badge-Definitionen
├── types/            # TypeScript-Typen
│   └── index.ts
└── router.tsx        # Routing-Konfiguration
```

## 🎨 Technologien

- **React 18** - UI-Framework
- **TypeScript** - Typsicherheit
- **Vite** - Build-Tool
- **Tailwind CSS** - Styling
- **Firebase** - Backend (Authentication + Firestore)
- **React Router** - Navigation

## 📝 Quiz-Fragen hinzufügen

Fragen können in `src/data/questions.ts` hinzugefügt werden. Das Format ist einfach:

```typescript
{
  id: "unique-id",
  class: 1,                    // Klasse 1-4
  subject: "mathematik",       // Fach
  type: "multiple-choice",     // Fragetyp: multiple-choice | input | drag-drop
  question: "Wie viel ist 2 + 3?",
  options: ["4", "5", "6", "7"], // Nur für multiple-choice
  correctAnswer: 1,            // Index (multiple-choice) oder String (input)
  points: 10,                  // Punkte
  difficulty: "leicht",        // leicht | mittel | schwer
  explanation: "Erklärung...", // Erklärung bei falscher Antwort
  // Storytelling (nur Klasse 3+)
  character: "max",            // max | luna
  storyText: "Max hat...",     // Geschichte vor der Frage
  world: "mathe-land"          // Welt pro Fach
}
```

**Wichtig:** 
- Klasse 1-2: Keine StoryText (Kinder können noch nicht lesen)
- Klasse 3+: 50% mit StoryText, 50% ohne
- Mindestens 10 Fragen pro Klasse/Fach empfohlen

## 🚀 Deployment

### Firebase Hosting

1. Firebase CLI installieren:
```bash
npm install -g firebase-tools
```

2. Firebase einloggen:
```bash
firebase login
```

3. Projekt initialisieren:
```bash
firebase init hosting
```

4. Build erstellen:
```bash
npm run build
```

5. Deployen:
```bash
firebase deploy
```

## 📚 Weitere Entwicklung

**Aktuelle Prioritäten:** Siehe [`ENTWICKLUNGS_FAHRPLAN.md`](./ENTWICKLUNGS_FAHRPLAN.md)

**Phase 1 (Quick Wins):** ✅ ABGESCHLOSSEN
- ✅ Sofortiges Feedback im Quiz
- ✅ Erfolgs-Animationen
- ✅ Badge-System
- ✅ Bessere Fehlererklärungen
- ✅ Visuelle Verbesserungen

**Phase 2 (Mittelfristig):** ✅ ABGESCHLOSSEN
- ✅ Storytelling-Elemente (Max & Luna Charaktere)
- ✅ Adaptive Schwierigkeit
- ✅ Verschiedene Fragetypen (Input, Drag & Drop)
- ✅ UI-Verbesserungen (Navigation, Feedback, Fortschrittsbalken)
- ⏳ Level-System (geplant)

**Phase 3 (Langfristig):** 🚧 IN PLANUNG
- Soziale Features
- Eltern-Dashboard
- Erweiterte Gamification
- Mini-Spiele

Für Details siehe [`ENTWICKLUNGSLEITFADEN.md`](./ENTWICKLUNGSLEITFADEN.md).

## 🐛 Fehlerbehebung

**Problem**: Firebase-Fehler beim Login
- Lösung: Prüfen Sie, ob Authentication in Firebase aktiviert ist
- Prüfen Sie die `.env.local` Datei auf korrekte Werte

**Problem**: Tailwind CSS funktioniert nicht
- Lösung: Prüfen Sie, ob `tailwind.config.cjs` korrekt konfiguriert ist
- Stellen Sie sicher, dass `@import "tailwindcss"` in `src/index.css` steht

## 📄 Lizenz

Dieses Projekt ist für Bildungszwecke erstellt.
