# 📚 Hilfe-Text (helpText) Regeln und Best Practices

> **⚠️ KRITISCH:** Diese Regeln MÜSSEN bei jeder Erstellung oder Änderung von `helpText`-Einträgen beachtet werden!

## 🚫 ABSOLUTE VERBOTE - NIEMALS DIESE FEHLER MACHEN

### 1. ❌ KEINE LÖSUNGSVORGABE

**NIEMALS** die richtige Antwort direkt nennen oder verraten:

- ❌ `"Die fehlende Zahl ist 31!"`
- ❌ `"Als Nächstes kommt 80!"`
- ❌ `"Das Ergebnis ist 5!"`
- ❌ `"Die Antwort ist C!"`
- ❌ `"Die Lösung ist 42!"`

**Warum?** Das Kind soll selbst denken und die Lösung finden. Die Hilfe soll nur den Denkweg zeigen, nicht das Ziel verraten.

### 2. ❌ KEINE MATHEMATISCHEN GLEICHUNGEN MIT LÖSUNGEN

**NIEMALS** Gleichungen zeigen, die die Lösung enthalten:

- ❌ `"15×2+1=31"` → Verrät die Lösung!
- ❌ `"40×2=80"` → Verrät die Lösung!
- ❌ `"also 73-7=66"` → Verrät die Lösung!

**Stattdessen:** Zeige den Denkweg ohne Ergebnis:
- ✅ `"Jede Zahl wird verdoppelt und dann noch 1 dazu addiert. Versuche das Muster zu erkennen!"`
- ✅ `"Schau dir an, wie die Zahlen sich ändern. Was passiert zwischen den Zahlen?"`

### 3. ❌ KEINE IDENTISCHEN TEXTE MIT `explanation`

**NIEMALS** den `helpText` identisch mit `explanation` machen:

- ❌ `helpText: 'Die Lösung ist 5!'` (identisch mit explanation)
- ❌ `helpText: explanation` (direkte Kopie)

**Warum?** `explanation` wird NACH dem Quiz angezeigt und darf die Lösung verraten. `helpText` wird VOR der Antwort angezeigt und darf es NICHT.

## ✅ RICHTIGE PRAXIS - SO SOLLTE ES SEIN

### 1. ✅ HILFREICH ABER NICHT VERRAEND

**Gut:**
- ✅ `"Schau mal, jede Zahl wird verdoppelt! Versuche herauszufinden, was als Nächstes kommt!"`
- ✅ `"Die fehlende Zahl findest du heraus, wenn du das Muster erkennst!"`
- ✅ `"Überlege dir, wie sich die Zahlen ändern. Was passiert zwischen 5 und 10?"`

### 2. ✅ LIEBEVOLL UND PÄDAGOGISCH

**Gut:**
- ✅ `"Hey, schau mal! Lass uns gemeinsam überlegen..."` (warmherzig)
- ✅ `"Das schaffst du! Versuche es einfach!"` (ermutigend)
- ✅ `"Super, dass du hier bist! Lass uns zusammen nachdenken..."` (freundlich)

### 3. ✅ FRAGE IN EIGENEN WORTEN ERKLÄREN

**Gut:**
- ✅ `"Schau mal, hier geht es um Zahlenreihen. Du sollst herausfinden, welche Zahl fehlt."`
- ✅ `"Diese Aufgabe möchte, dass du ein Muster erkennst. Schau dir an, wie die Zahlen sich ändern."`

### 4. ✅ LERNEFFEKTIV - WARUM ERKLÄREN

**Gut:**
- ✅ `"Jede Zahl wird verdoppelt - das bedeutet, du nimmst die Zahl mal 2. Versuche das Muster zu erkennen!"`
- ✅ `"Die Zahlen steigen immer um die gleiche Zahl. Schau dir an, wie viel dazukommt!"`

### 5. ✅ GELEGENTLICH PERSÖNLICH

**Gut:**
- ✅ `"Hey [Name], schau mal! Lass uns zusammen überlegen..."` (30% Chance)
- ✅ `"Hey du, das ist eine spannende Frage!"` (ohne Name, aber persönlich)

## 🔧 TECHNISCHE IMPLEMENTIERUNG

### Automatische Filterung

Die App hat eine **mehrschichtige Sicherheit**:

1. **KI-Prompt:** Der Prompt verbietet explizit Lösungsvorgabe
2. **Script-Prüfung:** `fixHelpTexts.ts` erkennt problematische Einträge
3. **Runtime-Filterung:** `HelpButton.tsx` entfernt Lösungen vor Sprachausgabe

### Mathematische Symbole

**Wichtig:** Mathematische Symbole werden automatisch ersetzt:
- `×` → `"mal"`
- `÷` → `"geteilt durch"`
- `=` → `"ist gleich"`
- `+` → `"plus"`
- `-` → `"minus"`

**Aber:** Die KI sollte beim Generieren schon Wörter verwenden, nicht Symbole!

## 📝 CHECKLISTE FÜR NEUE HELPTEXTS

Vor dem Speichern eines neuen `helpText` prüfen:

- [ ] Enthält der Text die richtige Antwort? → **ENTFERNEN!**
- [ ] Enthält der Text mathematische Gleichungen mit Lösungen? → **ENTFERNEN!**
- [ ] Ist der Text identisch mit `explanation`? → **NEU FORMULIEREN!**
- [ ] Ist der Text liebevoll und pädagogisch? → **JA? GUT!**
- [ ] Erklärt der Text die Frage in eigenen Worten? → **JA? GUT!**
- [ ] Ist der Text lerneffektiv (erklärt WARUM)? → **JA? GUT!**
- [ ] Klingt der Text natürlich und nicht aufgesetzt? → **JA? GUT!**

## 🛠️ SCRIPTS ZUM ÜBERPRÜFEN UND KORRIGIEREN

### Problematische Einträge finden:

```bash
npx tsx scripts/fixHelpTexts.ts
```

Das Script:
- Findet alle problematischen `helpText`-Einträge
- Generiert neue Erklärungen mit dem verbesserten Prompt
- Erstellt automatisch ein Backup
- Aktualisiert die `questions.ts` Datei

### Neue Erklärungen generieren:

```bash
npx tsx scripts/generateExplanations.ts
```

Für Fragen ohne `helpText` oder mit problematischen Einträgen.

## 📊 BEISPIELE: VORHER vs. NACHHER

### ❌ Vorher (SCHLECHT):
```
helpText: 'Die fehlende Zahl ist 31!'
helpText: 'Als Nächstes kommt 40×2=80!'
helpText: 'Das Ergebnis ist 5.'
```

### ✅ Nachher (GUT):
```
helpText: 'Hey, schau mal! Lass uns gemeinsam überlegen, welche Zahl hier fehlt. Schau dir an, wie sich die Zahlen ändern - erkennst du ein Muster?'
helpText: 'Hey du! Jede Zahl wird verdoppelt - das bedeutet, du nimmst die Zahl mal 2. Versuche herauszufinden, was als Nächstes kommt!'
helpText: 'Schau mal, bei dieser Aufgabe kannst du zählen: Starte bei der ersten Zahl und zähle weiter. Versuche es einfach!'
```

## 🎯 ZUSAMMENFASSUNG

**Die wichtigste Regel:**
> **HILFREICH ABER NICHT VERRAEND!**

Die Hilfe soll dem Kind zeigen, WIE es denken kann, nicht WAS die Antwort ist.

**Merksatz:**
- ❌ "Die Antwort ist X" → SCHLECHT
- ✅ "Versuche herauszufinden, welche Zahl hier passt!" → GUT
- ✅ "Schau dir das Muster an!" → GUT
- ✅ "Überlege dir, wie sich die Zahlen ändern!" → GUT

## 📚 WEITERE RESSOURCEN

- [`PROJEKT_STATUS.md`](./PROJEKT_STATUS.md) - Aktueller Projekt-Status
- [`ADAPTIVER_ALGORITHMUS.md`](./ADAPTIVER_ALGORITHMUS.md) - Dokumentation des adaptiven Lern-Algorithmus
- [`ENTWICKLUNGSLEITFADEN.md`](./ENTWICKLUNGSLEITFADEN.md) - Entwicklungs-Richtlinien

---

**Letzte Aktualisierung:** 2024-01-XX  
**Status:** ✅ Alle 23 problematischen Einträge wurden korrigiert

