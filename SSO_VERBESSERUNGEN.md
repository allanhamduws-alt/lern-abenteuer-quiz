# SSO-Aufgabenextraktion - Verbesserungen

## Übersicht

Die SSO-Aufgabenextraktion wurde komplett überarbeitet, um:
1. PDFs direkt zu verarbeiten (ohne JPEG-Konvertierung)
2. Den Arbeitsblatt-Typ zu erkennen und passende Aufgaben im richtigen Format zu generieren
3. Automatische Qualitätsevaluierung durchzuführen

## Änderungen

### 1. PDF-Extraktion (`scripts/agents/utils/gemini.mjs`)

**Vorher:**
- PDFs wurden zu JPEG konvertiert
- GPT-4 Vision für OCR verwendet
- Qualitätsverlust durch Konvertierung

**Jetzt:**
- **Primär:** Gemini 2.5 Pro für direkte PDF-Verarbeitung
- **Fallback:** Gemini 2.0 Flash Exp, Gemini 1.5 Pro
- **Finaler Fallback:** GPT-5, GPT-4o (falls Gemini nicht verfügbar)
- Keine JPEG-Konvertierung mehr
- Bessere Text-Extraktion mit Strukturerhaltung

**Vorteile:**
- Kostenlos/kostengünstig mit Google (Gemini)
- Bessere PDF-Unterstützung
- Erhält Layout und Struktur

### 2. Task-Generierung (`scripts/agents/utils/openai.mjs`)

**Vorher:**
- Alle Aufgaben wurden als Multiple-Choice generiert
- Arbeitsblatt-Typ wurde nicht erkannt
- Aufgabenformat wurde nicht beibehalten

**Jetzt:**
- **Arbeitsblatt-Analyse:** Erkennt den Typ des Arbeitsblatts
- **Format-Erkennung:** Identifiziert Aufgabenformate (Multiple-Choice, Lückentext, Zuordnung, etc.)
- **Format-Treue:** Generiert Aufgaben im GLEICHEN Format wie das Original
- **Modell-Auswahl:** Versucht GPT-5, Fallback auf GPT-4o, GPT-4o-mini

**Neue Features:**
- Erkennt echte Lernaufgaben (nicht Meta-Fragen wie "Auf welcher Seite ist Aufgabe X?")
- Behält Aufgabenformate bei (nicht alles zu Multiple-Choice)
- Generiert passende Lösungsvorgaben

### 3. Evaluierung (`scripts/agents/utils/evaluation.mjs`)

**Neu implementiert:**
- Automatische Qualitätsprüfung jeder generierten Aufgabe
- Format-Validierung
- Relevanz-Prüfung zum Original-Material
- Altersgerechtheits-Prüfung
- Score-System (0-100)

**Evaluierungskriterien:**
- Vorhandensein und Qualität von stem, answers, explanation
- Format-Konsistenz (z.B. Multiple-Choice hat Optionen)
- Relevanz zum Original-Material
- Altersgerechtheit für Klasse 1-4

**Ergebnisse werden gespeichert:**
- `evaluationScore`: Gesamt-Score (0-100)
- `evaluationPassed`: Ob Evaluierung bestanden wurde
- `evaluationIssues`: Liste der gefundenen Probleme
- `worksheetType`: Erkannte Arbeitsblatt-Typ
- `taskFormats`: Erkannte Aufgabenformate

## Verwendung

### Backend-Agent (empfohlen)

```bash
# Watch-Modus (läuft kontinuierlich)
npm run agent:uploads:watch

# Einmalige Verarbeitung
node scripts/agents/processUploads.mjs once
```

### API-Keys

Stelle sicher, dass in `.env.agent` gesetzt sind:
- `GEMINI_API_KEY` (empfohlen, primär verwendet)
- `OPENAI_API_KEY` (Fallback)

### Modell-Priorität

**PDF-Extraktion:**
1. Gemini 2.5 Pro (kostenlos/kostengünstig)
2. Gemini 2.0 Flash Exp
3. Gemini 1.5 Pro
4. GPT-5 (OpenAI)
5. GPT-4o (OpenAI)

**Task-Generierung:**
1. GPT-5 (OpenAI)
2. GPT-4o (OpenAI)
3. GPT-4o-mini (OpenAI)

## Erwartete Verbesserungen

1. **Bessere Extraktion:** Direkte PDF-Verarbeitung ohne Qualitätsverlust
2. **Richtige Formate:** Aufgaben werden im Original-Format generiert
3. **Bessere Qualität:** Automatische Evaluierung filtert schlechte Aufgaben
4. **Kostenersparnis:** Gemini ist kostenlos/kostengünstiger als GPT-4 Vision

## Monitoring

Die Evaluierungsergebnisse werden in Firestore gespeichert:
- `evaluationScore`: Gesamt-Score
- `evaluationPassed`: Bestanden/Nicht bestanden
- `evaluationIssues`: Liste der Probleme
- `worksheetType`: Erkannte Arbeitsblatt-Typ
- `taskFormats`: Erkannte Aufgabenformate

Diese können im Admin-Dashboard angezeigt werden, um die Qualität zu überwachen.

## Nächste Schritte

1. Testen mit echten PDF-Uploads
2. Evaluierungsergebnisse im Frontend anzeigen
3. Feedback-Schleife implementieren (Eltern können Qualität bewerten)
4. Kontinuierliche Verbesserung der Prompts basierend auf Feedback

