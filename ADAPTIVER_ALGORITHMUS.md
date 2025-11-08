# Adaptiver Lern-Algorithmus

> **Status:** ✅ Implementiert  
> **Datum:** 2024  
> **Version:** 1.0

## Übersicht

Die App verwendet jetzt einen **adaptiven Lern-Algorithmus**, der die Schwierigkeit der Quiz-Fragen automatisch an das individuelle Leistungsniveau jedes Schülers anpasst. Der Algorithmus basiert auf bewährten pädagogischen Prinzipien und sorgt dafür, dass Schüler weder über- noch unterfordert werden.

## Funktionsweise

### 1. Skill-Level Berechnung

Das Skill-Level wird für jedes Fach separat berechnet und liegt zwischen **0.0 (Anfänger)** und **1.0 (Experte)**.

**Berechnungsformel:**
```
Skill-Level = (averageScore × 0.5) + (experienceLevel × 0.3) + (consistency × 0.2)
```

**Faktoren:**
- **averageScore** (50% Gewichtung): Durchschnittliche Erfolgsrate des Schülers
- **experienceLevel** (30% Gewichtung): Level im Fach (1-10), skaliert auf 0.0-1.0
- **consistency** (20% Gewichtung): Anzahl der absolvierten Quizzes (nach 10 Quizzes = konsistent)

**Sicherheitsgrenzen:**
- Neue Schüler (< 3 Quizzes): Maximal 30% Skill-Level
- Skill-Level wird immer zwischen 0.0 und 1.0 gehalten

### 2. Schwierigkeits-Verteilung

Basierend auf dem Skill-Level wird die optimale Verteilung der Fragen-Schwierigkeit bestimmt:

| Skill-Level | Leichte Fragen | Mittlere Fragen | Schwere Fragen |
|-------------|----------------|-----------------|----------------|
| 0.0 - 0.2 (Anfänger) | 70% | 25% | 5% |
| 0.2 - 0.4 (Leicht fortgeschritten) | 50% | 40% | 10% |
| 0.4 - 0.6 (Fortgeschritten) | 30% | 50% | 20% |
| 0.6 - 0.8 (Sehr fortgeschritten) | 15% | 45% | 40% |
| 0.8 - 1.0 (Experte) | 10% | 30% | 60% |

**Sicherheitsgrenzen:**
- Mindestens 10% leichte Fragen pro Quiz
- Maximal 70% schwere Fragen pro Quiz
- Ziel: ~80% Erfolgsrate (Zone of Proximal Development)

### 3. Skill-Level Aktualisierung nach Quiz

Nach jedem Quiz wird das Skill-Level basierend auf der tatsächlichen Performance aktualisiert:

**Formel:**
```
Performance-Gap = Quiz-Performance - Erwartete Performance
Anpassung = Performance-Gap × 12% (langsame Anpassung)
Neues Skill-Level = Altes Skill-Level + Anpassung
```

**Sicherheitsmechanismen:**
- Maximal 20% Änderung pro Quiz (verhindert zu große Sprünge)
- Langsame Anpassung (12% pro Quiz) für Stabilität
- Skill-Level bleibt immer zwischen 0.0 und 1.0

**Erwartete Performance:**
- Leichte Fragen: 85% Erfolgsrate
- Mittlere Fragen: 70% Erfolgsrate
- Schwere Fragen: 55% Erfolgsrate

## Implementierung

### Dateien

**Neue Funktionen in `src/services/progress.ts`:**
- `calculateSkillLevel(subjectProgress)` - Berechnet Skill-Level
- `getOptimalDifficultyDistribution(skillLevel)` - Bestimmt optimale Verteilung
- `calculateExpectedPerformance(questions)` - Berechnet erwartete Performance
- `updateSkillLevelAfterQuiz(...)` - Aktualisiert Skill-Level nach Quiz

**Angepasste Funktionen:**
- `getAdaptiveQuestions()` in `src/data/questions.ts` - Verwendet jetzt Skill-Level
- `updateProgressAfterQuiz()` in `src/services/progress.ts` - Aktualisiert Skill-Level
- `QuizPage.tsx` - Lädt Progress und verwendet Skill-Level

### Datenstruktur

**Erweitert: `SubjectProgress` Interface:**
```typescript
interface SubjectProgress {
  // ... bestehende Felder
  skillLevel?: number; // 0.0-1.0 für adaptive Fragen-Auswahl
}
```

## Ablauf

### Beim Quiz-Start:

1. Progress des Schülers wird geladen
2. Skill-Level für das Fach wird berechnet (oder aus Progress geladen)
3. Optimale Schwierigkeits-Verteilung wird bestimmt
4. Fragen werden entsprechend ausgewählt
5. Antwort-Optionen werden zufällig gemischt

### Nach Quiz-Abschluss:

1. Quiz-Performance wird berechnet (richtige Antworten / Gesamt)
2. Erwartete Performance wird basierend auf Fragen-Schwierigkeit berechnet
3. Skill-Level wird langsam angepasst (max. 20% Änderung)
4. Aktualisiertes Skill-Level wird im Progress gespeichert

## Vorteile

✅ **Personalisierung**: Jeder Schüler erhält Fragen auf seinem Niveau  
✅ **Motivation**: Keine Über- oder Unterforderung  
✅ **Effektives Lernen**: Zone of Proximal Development (~80% Erfolgsrate)  
✅ **Stabilität**: Langsame Anpassung verhindert Frustration  
✅ **Sicherheit**: Mehrere Sicherheitsgrenzen für Anfänger  

## Fallback-Mechanismus

Falls kein Skill-Level verfügbar ist (z.B. beim ersten Quiz), verwendet die App die alte Logik:
- Erfolgsrate aus `recentResults` (aktuelle Quiz-Ergebnisse)
- Standard-Verteilung: 30% leicht, 50% mittel, 20% schwer

## Technische Details

### Skill-Level Initialisierung

- Neue Schüler starten mit `skillLevel: 0.0`
- Beim Laden des Progress wird Skill-Level initialisiert, falls nicht vorhanden
- Skill-Level wird automatisch berechnet beim ersten Quiz

### Performance-Berechnung

Die erwartete Performance wird basierend auf der Schwierigkeit der gestellten Fragen berechnet:
- Leichte Fragen: 85% Erfolgsrate erwartet
- Mittlere Fragen: 70% Erfolgsrate erwartet
- Schwere Fragen: 55% Erfolgsrate erwartet

### Anpassungsrate

- **12% pro Quiz**: Langsame Anpassung für Stabilität
- **Max. 20% Änderung**: Verhindert zu große Sprünge
- **Performance-Gap**: Differenz zwischen tatsächlicher und erwarteter Performance

## Beispiel

**Schüler A (Anfänger):**
- Skill-Level: 0.15
- Verteilung: 70% leicht, 25% mittel, 5% schwer
- Quiz: 7/8 richtig (87.5%)
- Erwartet: ~82% (viele leichte Fragen)
- Anpassung: +0.66% (leicht besser als erwartet)
- Neues Skill-Level: 0.1566

**Schüler B (Fortgeschritten):**
- Skill-Level: 0.65
- Verteilung: 15% leicht, 45% mittel, 40% schwer
- Quiz: 6/8 richtig (75%)
- Erwartet: ~68% (viele schwere Fragen)
- Anpassung: +0.84% (besser als erwartet)
- Neues Skill-Level: 0.6584

## Wichtige Hinweise

⚠️ **Skill-Level wird pro Fach gespeichert** - Jedes Fach hat sein eigenes Skill-Level  
⚠️ **Langsame Anpassung** - Es dauert mehrere Quizzes, bis sich das Skill-Level deutlich ändert  
⚠️ **Sicherheitsgrenzen** - Anfänger werden immer mit leichten Fragen gestartet  
⚠️ **Rückwärtskompatibel** - Alte Progress-Daten funktionieren weiterhin  

## Nächste Schritte

Mögliche Verbesserungen:
- Berücksichtigung von Themen-Mastery (manche Themen sind schwieriger)
- Berücksichtigung von Zeit (schnellere Antworten = höheres Skill-Level)
- Berücksichtigung von Konsistenz über mehrere Sessions
- A/B-Testing verschiedener Anpassungsraten

## Referenzen

- Zone of Proximal Development (ZPD) - Vygotsky
- Adaptive Testing - Item Response Theory (IRT)
- ALEKS Learning System - Knowledge Spaces Theory

