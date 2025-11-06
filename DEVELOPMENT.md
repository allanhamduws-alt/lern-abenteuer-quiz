# Development - Lokales Netzwerk

## App auf dem Handy testen (Laptop + Handy im gleichen WLAN)

**Schritt 1:** Starte Dev-Server mit Netzwerk-Zugriff:
```bash
npm run dev:network
```

**Schritt 2:** Finde die IP-Adresse deines Laptops:
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

Oder in Systemeinstellungen → Netzwerk → WLAN → Details

**Schritt 3:** Öffne auf dem Handy im Browser:
```
http://[DEINE-LAPTOP-IP]:5173
```

**Beispiel:** Wenn deine IP `192.168.1.50` ist:
```
http://192.168.1.50:5173
```

✅ Hot Reload funktioniert automatisch - Änderungen werden sofort auf dem Handy sichtbar!
