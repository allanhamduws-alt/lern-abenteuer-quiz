# Scripts

## generateExplanations.mjs

Generiert einmalig kindgerechte Erklärungen für alle Quiz-Fragen und speichert sie in `helpText`.

### Voraussetzungen

1. OpenAI API Key muss gesetzt sein:
   ```bash
   export VITE_OPENAI_API_KEY="dein-api-key-hier"
   ```

2. Oder in `.env` Datei:
   ```
   VITE_OPENAI_API_KEY=dein-api-key-hier
   ```

### Verwendung

```bash
node scripts/generateExplanations.mjs
```

### Was passiert?

1. Liest alle Fragen aus `src/data/questions.ts`
2. Für jede Frage ohne `helpText`:
   - Generiert eine kindgerechte Erklärung mit OpenAI GPT-4o-mini
   - Speichert sie in `helpText`
3. Erstellt ein Backup der originalen Datei (`questions.ts.backup`)
4. Schreibt die aktualisierten Fragen zurück

### Statistiken

Das Script zeigt am Ende:
- Anzahl verarbeiteter Fragen
- Anzahl übersprungener Fragen (bereits helpText vorhanden)
- Anzahl Fehler (mit Fallback)

### Kosten

- ~328 Fragen × ~$0.001 pro Request = **~$0.33 einmalig**
- Danach keine weiteren API-Calls mehr nötig!

### Nach der Generierung

Die HelpButton-Komponente verwendet automatisch die gespeicherten Erklärungen:
- ✅ Sofortige Antwort (keine 10 Sekunden Wartezeit mehr!)
- ✅ Optional: Namen wird hinzugefügt (30% Chance)
- ✅ Keine laufenden API-Kosten

