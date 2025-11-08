# Richtlinien für Quiz-Fragen

## 🎯 Ziel

Erstelle Fragen, die Kinder zum Nachdenken anregen, ohne die Lösung vorzusagen.

## ✅ DO's - Was du tun solltest

### 1. Hilfe geben ohne Antwort zu nennen
- ✅ **Gut:** "Denke an Tiere, die nachts jagen und große Augen haben."
- ✅ **Gut:** "Welches Tier könnte im Wald leben? Denke an scheue Tiere mit Geweihen."
- ✅ **Gut:** "Überlege, welche Zahl zwischen 5 und 10 liegt."

### 2. Hinweise geben statt Lösungen
- ✅ **Gut:** "Diese Zahl ist größer als 5 aber kleiner als 10."
- ✅ **Gut:** "Denke an Wörter, die mit einem großen Buchstaben beginnen."
- ✅ **Gut:** "Welche Farbe entsteht, wenn du Rot und Gelb mischst?"

### 3. Fragen stellen statt Aussagen zu treffen
- ✅ **Gut:** "Welches Tier könnte das sein?"
- ✅ **Gut:** "Was könnte passieren, wenn..."
- ✅ **Gut:** "Überlege, welche Zahl..."

### 4. Altersgerechte Sprache verwenden
- ✅ **Gut:** "Hey, mein kleiner Lernfreund! Lass uns mal gemeinsam an dieser Aufgabe arbeiten."
- ✅ **Gut:** "Stell dir vor, du hast 5 Äpfel..."
- ✅ **Gut:** "Das ist wie ein kleines Zählspiel!"

## ❌ DON'Ts - Was du NICHT tun solltest

### 1. Nie die Antwort direkt nennen
- ❌ **Schlecht:** "Rehe leben im Wald!" → Antwort ist "Reh"
- ❌ **Schlecht:** "Eulen sind nachtaktiv!" → Antwort ist "Eule"
- ❌ **Schlecht:** "Die Antwort ist 7!" → Antwort ist "7"

### 2. Nie "Die Antwort ist X" schreiben
- ❌ **Schlecht:** "Die richtige Antwort ist Reh."
- ❌ **Schlecht:** "Das Ergebnis ist 5."
- ❌ **Schlecht:** "Die Lösung ist Eule."

### 3. Nie die Antwort im Fragetext verwenden
- ❌ **Schlecht:** "Welches Tier ist ein Reh?" → Antwort ist "Reh"
- ❌ **Schlecht:** "Wie viel ist 5 + 2? (Die Antwort ist 7)" → Antwort ist "7"

### 4. Nie die Antwort im helpText verwenden
- ❌ **Schlecht:** helpText: "Rehe leben im Wald!" → Antwort ist "Reh"
- ❌ **Schlecht:** helpText: "Eulen sind nachtaktiv!" → Antwort ist "Eule"
- ❌ **Schlecht:** helpText: "Die Lösung ist 7." → Antwort ist "7"

## 📝 Beispiele für gute Fragen

### Beispiel 1: Naturwissenschaften
**Frage:** "Welches Tier lebt im Wald?"

**Optionen:** ['Hai', 'Pinguin', 'Reh', 'Delfin']

**❌ Schlechter helpText:**
```
"Rehe leben im Wald! Sie sind scheue Tiere und essen Gras und Blätter."
```

**✅ Guter helpText:**
```
"Welches Tier könnte im Wald leben? Denke an scheue Tiere mit Geweihen, die Gras und Blätter essen. Sie sind sehr vorsichtig und laufen schnell weg, wenn sie Gefahr spüren."
```

### Beispiel 2: Mathematik
**Frage:** "Wie viel ist 5 + 2?"

**Optionen:** ['6', '7', '8', '9']

**❌ Schlechter helpText:**
```
"Bei 5 + 2 startest du bei 5 und zählst 2 weiter: 5... 6, 7! Das Ergebnis ist 7."
```

**✅ Guter helpText:**
```
"Stell dir vor, du hast schon 5 Äpfel in deinem Korb. Jetzt bekommst du noch 2 weitere Äpfel dazu! Fang einfach bei 5 an und zähle dann alle Äpfel bis du am Ende bist. Wie viele Äpfel sind das insgesamt? Probier es mal aus!"
```

### Beispiel 3: Deutsch
**Frage:** "Welches Wort ist ein Nomen (Namenwort)?"

**Optionen:** ['laufen', 'schön', 'Haus', 'schnell']

**❌ Schlechter helpText:**
```
"Haus ist ein Nomen, weil es ein Namenwort ist."
```

**✅ Guter helpText:**
```
"Ein Nomen ist ein Namenwort, das du anfassen oder sehen kannst. Überlege, welches Wort ein Ding oder eine Sache beschreibt, die du berühren könntest!"
```

## 🔍 Validierung

### Automatische Prüfung
Führe vor dem Commit aus:
```bash
npm run validate-questions
```

Das Script prüft automatisch:
- ✅ Ob die Antwort im `question` Text vorkommt
- ✅ Ob die Antwort im `helpText` vorkommt
- ✅ Ob die Antwort in der `explanation` vorkommt
- ✅ Erkennt Plural/Singular Varianten (Reh/Rehe, Eule/Eulen)

### Manuelle Prüfung
Vor dem Hinzufügen einer neuen Frage:
1. ✅ Lies die Frage laut vor
2. ✅ Prüfe ob die Antwort irgendwo im Text steht
3. ✅ Stelle sicher, dass nur Hinweise gegeben werden
4. ✅ Teste die Frage selbst, ohne die Antwort zu kennen

## 🎓 Best Practices

### 1. Struktur einer guten Frage
```
question: "Klare, verständliche Frage ohne Antwort"
options: ["Falsche Antwort 1", "Richtige Antwort", "Falsche Antwort 2", "Falsche Antwort 3"]
helpText: "Hilfreiche Hinweise ohne die Antwort zu nennen"
explanation: "Erklärung warum die Antwort richtig ist (nur bei falschen Antworten sichtbar)"
```

### 2. helpText sollte:
- ✅ Zum Nachdenken anregen
- ✅ Hinweise geben ohne Lösung zu verraten
- ✅ Altersgerecht formuliert sein
- ✅ Motivierend und freundlich sein

### 3. explanation sollte:
- ✅ Erklären warum die Antwort richtig ist
- ✅ Bei falschen Antworten helfen zu verstehen
- ✅ Nicht die Antwort für andere Fragen verraten

## 🚨 Häufige Fehler

1. **Copy-Paste von Erklärungen**
   - Problem: Antwort wird mit kopiert
   - Lösung: Immer neu formulieren

2. **KI-generierte Texte ohne Prüfung**
   - Problem: KI nennt manchmal die Antwort
   - Lösung: Immer manuell prüfen

3. **Unbewusstes Nennen der Antwort**
   - Problem: "Rehe leben im Wald!" statt "Welches Tier..."
   - Lösung: Immer als Frage formulieren

4. **Plural/Singular Varianten**
   - Problem: "Reh" wird nicht erkannt wenn "Rehe" im Text steht
   - Lösung: Validierung prüft beide Varianten

## 📚 Weitere Ressourcen

- Siehe `src/utils/questionValidator.ts` für Validierungs-Logik
- Siehe `scripts/validateQuestions.mjs` für Prüf-Script
- Bei Fragen: Prüfe bestehende Fragen als Beispiele

