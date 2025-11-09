# Validierungsregeln für Quiz-Fragen

## Ziel
Verhindern, dass die richtige Antwort versehentlich in `question`, `helpText` oder `explanation` verraten wird.

## Grundregel
**Nur Kernantwort-Wörter sind problematisch, nicht grammatische Wörter.**

### ✅ Echte Spoiler (Problem):
- **Substantive**: "Eis", "Elefant", "Herz", "Fisch", "Pinguin", "Strauß"
- **Adjektive**: "gelb", "grün", "rund", "viereckig", "warm", "kalt"
- **Zahlen**: "100", "250", "350", "4", "8"
- **Eigennamen**: "Frühling", "Herbst", "Sommer", "Winter"
- **Fachbegriffe**: "Fotosynthese", "Subjekt", "Prädikat", "Perfekt"

### ❌ Keine Spoiler (OK):
- **Grammatische Wörter**: "wird", "es", "zu", "die", "der", "ein", "und"
- **Hilfsverben**: "ist", "sind", "hat", "haben", "kann", "muss"
- **Präpositionen**: "mit", "von", "durch", "für", "auf", "in"
- **Konjunktionen**: "und", "oder", "aber", "dass", "wenn", "weil"

## Stoppwort-Liste (werden ignoriert)

### Artikel
- der, die, das, den, dem, des
- ein, eine, einer, einem, eines

### Pronomen
- es, sie, er, ihr, ihm, ihn, ihnen, uns, euch

### Verben (Hilfsverben & Modalverben)
- ist, sind, war, waren
- wird, werden, wurde, wurden
- hat, haben, hatte, hatten
- kann, können, muss, müssen
- soll, sollen, will, wollen

### Präpositionen
- mit, von, zu, für, auf, in, an, bei, über, unter, durch

### Konjunktionen
- und, oder, aber, dass, wenn, weil, obwohl, damit

### Adverbien & Partikel
- nicht, kein, keine, keinen, keinem
- auch, noch, schon, immer, nie, manchmal
- sehr, viel, wenig, mehr, meist, oft

### Fragewörter
- wie, was, wo, wann, warum, wer

## Filter-Regeln

1. **Mindestlänge**: Wörter mit ≤ 2 Zeichen werden ignoriert
2. **Stoppwörter**: Alle Wörter aus der Liste werden ignoriert
3. **Plural-Erkennung**: "Fisch" findet auch "Fische", "Elefant" findet auch "Elefanten"
4. **Wortgrenzen**: Nur ganze Wörter werden gefunden (nicht Teilstrings)

## Beispiele

### Beispiel 1: "Es wird zu Eis"
- ❌ "wird" → IGNORIEREN (grammatisches Wort)
- ✅ "Eis" → PROBLEM (Kernantwort)

### Beispiel 2: "Die Sonne ist gelb"
- ❌ "Die", "ist" → IGNORIEREN (grammatische Wörter)
- ✅ "gelb" → PROBLEM (Kernantwort)

### Beispiel 3: "Elefanten haben einen Rüssel"
- ❌ "haben", "einen" → IGNORIEREN (grammatische Wörter)
- ✅ "Elefanten" → PROBLEM (Kernantwort, auch wenn Plural)

### Beispiel 4: "Wenn Wasser kalt wird, wird es zu Eis"
- ❌ "wird", "es", "zu" → IGNORIEREN (grammatische Wörter)
- ✅ "Eis" → PROBLEM (Kernantwort)

## Anwendung
Diese Regeln werden automatisch von `validateQuestions.mjs` angewendet.

## Anpassung der Regeln
Um neue Stoppwörter hinzuzufügen, aktualisiere:
1. `src/utils/questionValidator.ts` - STOP_WORDS Set
2. `scripts/validateQuestions.mjs` - STOP_WORDS Set

Beide müssen identisch sein!

