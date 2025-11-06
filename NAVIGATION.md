/**
 * Navigation-Struktur Dokumentation
 * 
 * Diese Datei dokumentiert die Seitenstruktur und Navigation der App
 */

/**
 * HAUPT-NAVIGATION (für Kinder)
 * ──────────────────────────────────────────────
 * 
 * /home (Startseite)
 *   ├─ Fachauswahl
 *   ├─ Fortschritts-Übersicht
 *   ├─ Badge-Galerie
 *   └─ Mini-Spiele
 * 
 * /quiz (Quiz spielen)
 *   └─ Leitet weiter zu /results
 * 
 * /results (Quiz-Ergebnisse)
 *   └─ Zurück zu /home
 * 
 * /progress (Detaillierter Fortschritt)
 *   └─ Zurück zu /home
 * 
 * /practice (Schwierige Aufgaben üben)
 *   └─ Zurück zu /home
 * 
 * /game (Mini-Spiele)
 *   └─ Zurück zu /home
 */

/**
 * ELTERN-NAVIGATION
 * ──────────────────────────────────────────────
 * 
 * /parent-dashboard (Eltern-Dashboard)
 *   ├─ Kinder-Auswahl
 *   ├─ Fortschritts-Übersicht pro Kind
 *   └─ Export-Funktionen
 * 
 * /admin (Verwaltung)
 *   ├─ Kinder verknüpfen/entfernen
 *   └─ Einstellungen (zukünftig)
 */

/**
 * NAVIGATIONS-FLOW
 * ──────────────────────────────────────────────
 * 
 * KINDER:
 * Login → Home → Quiz → Results → Home
 * Home → Progress (Details)
 * Home → Practice (Übung)
 * Home → Game (Mini-Spiele)
 * 
 * ELTERN:
 * Login → Parent-Dashboard → Admin (Verwaltung)
 * Parent-Dashboard → Export
 */

/**
 * HEADER-NAVIGATION
 * ──────────────────────────────────────────────
 * 
 * Logo/Titel: Klickbar → führt zur Startseite
 *   - Kinder: /home
 *   - Eltern: /parent-dashboard
 * 
 * Buttons (rechts):
 *   - Eltern: "Eltern-Dashboard" Button
 *   - Alle: "Abmelden" Button
 */

/**
 * WEITERE NAVIGATION
 * ──────────────────────────────────────────────
 * 
 * Zurück-Buttons auf jeder Seite führen zur vorherigen Seite
 * Oder explizit zu /home bzw. /parent-dashboard
 */

