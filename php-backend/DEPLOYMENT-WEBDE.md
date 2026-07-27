# Deployment auf web.de-Webspace (oder ähnlichem Shared-Hosting)

Diese Anleitung beschreibt, wie du die Imkerei-Verwaltung auf einem klassischen
PHP/MySQL-Webspace installierst – z.B. bei web.de, aber genauso bei GMX, IONOS,
Strato & Co., solange PHP (8.0+) und eine MySQL/MariaDB-Datenbank zur Verfügung
stehen.

Diese Variante nutzt **`php-backend/`** statt des Node.js-Backends in `backend/`.
Das Frontend (`frontend/`) bleibt identisch.

Die Anleitung ist konkret auf das Ziel **`luisenthaler-bienenstich.de/imkerei`**
zugeschnitten – die App kommt in einen neuen Unterordner `imkerei/`, deine
bestehende Webseite bleibt davon unberührt. Das Repository ist bereits für
genau dieses Ziel vorkonfiguriert (`.htaccess` mit `RewriteBase /imkerei/`).

## 1. Voraussetzungen im web.de-Kundencenter prüfen

1. Logge dich im web.de-Kundencenter ein und öffne die Verwaltung deines
   Webspace-Pakets.
2. Prüfe/stelle die **PHP-Version auf 8.0 oder höher** (idealerweise aktuell,
   z.B. 8.2/8.3).
3. Lege eine **MySQL-Datenbank** an (falls noch nicht vorhanden) und notiere dir:
   - Datenbank-Host (oft `localhost` oder ein spezieller DB-Hostname)
   - Datenbankname
   - Benutzername
   - Passwort
4. Merke dir den Zugang zu **phpMyAdmin** (meist über das Kundencenter erreichbar).

## 2. Frontend lokal bauen

Auf deinem eigenen Rechner (mit Node.js installiert):

```bash
cd frontend
npm install
VITE_BASE_PATH=/imkerei/ npm run build
```

Das `VITE_BASE_PATH=/imkerei/` ist wichtig, damit alle Links, Skripte und
API-Aufrufe im Build den richtigen Unterordner-Pfad verwenden. Das Ergebnis
liegt danach in `frontend/dist/` (inklusive der enthaltenen `.htaccess`).

## 3. Dateien per FTP hochladen

Verbinde dich mit einem FTP-Programm (z.B. FileZilla) mit deinem web.de-Webspace
und lade hoch:

- **Alles aus `frontend/dist/`** → in einen **neuen Ordner `imkerei/`** im
  Wurzelverzeichnis deines Webspace (dort, wo deine bestehende Seite liegt,
  z.B. neben deren `index.html`).
- **Alles aus `php-backend/`** → in einen Unterordner `api/` **innerhalb**
  von `imkerei/`, also `imkerei/api/`.

Danach sollte die Struktur auf dem Webspace ungefähr so aussehen:

```
/ (Webspace-Wurzel – deine bestehende Seite bleibt hier unverändert)
├── index.html               (deine bestehende Startseite, unangetastet)
├── ...                       (restliche bestehende Dateien)
└── imkerei/
    ├── .htaccess              (bereits auf /imkerei/ vorkonfiguriert)
    ├── index.html
    ├── assets/...
    ├── favicon.svg
    └── api/
        ├── .htaccess
        ├── index.php
        ├── config.php          (siehe Schritt 5 – erst hier erstellen!)
        ├── config.php.example
        ├── schema.sql
        ├── lib/...
        ├── handlers/...
        └── backups/
            └── .htaccess
```

**Wichtig:** Lade `api/config.php` (falls du sie schon lokal angelegt hast)
NICHT mit hoch, solange sie noch Platzhalter-Werte enthält – siehe Schritt 5.

## 4. Datenbank-Schema importieren

1. Öffne phpMyAdmin über das web.de-Kundencenter.
2. Wähle deine neu angelegte Datenbank aus.
3. Öffne den Reiter „Importieren“ und wähle die Datei `php-backend/schema.sql`
   von deinem Rechner aus.
4. Import starten. Danach sollten 7 Tabellen existieren: `users`, `standorte`,
   `voelker`, `durchsichten`, `arzneimittel`, `behandlungen`, `ernten`.

## 5. Konfigurationsdatei anlegen

Auf dem Webspace (per FTP-Editor oder: lokal bearbeiten und hochladen als
`imkerei/api/config.php`):

1. Kopiere `api/config.php.example` zu `api/config.php`.
2. Trage die echten Datenbank-Zugangsdaten aus Schritt 1 ein.
3. Erzeuge einen zufälligen `JWT_SECRET`-Wert, z.B. lokal mit:
   ```bash
   php -r "echo bin2hex(random_bytes(32));"
   ```
   und trage ihn ein.

```php
<?php
define('DB_HOST', 'localhost');
define('DB_NAME', 'deine_datenbank');
define('DB_USER', 'dein_db_benutzer');
define('DB_PASS', 'dein_db_passwort');
define('JWT_SECRET', 'der-zufaellige-wert-von-oben');
```

## 6. Testen

1. Rufe `https://luisenthaler-bienenstich.de/imkerei/api/health` auf – die
   Antwort sollte `{"status":"ok"}` sein. Falls stattdessen ein Serverfehler
   oder eine leere Seite erscheint, siehe Abschnitt „Fehlerbehebung“ unten.
2. Rufe `https://luisenthaler-bienenstich.de/imkerei/` auf – die App sollte
   laden und dich zur Einrichtung des ersten Benutzers auffordern.
3. Lege den ersten Benutzer an (das ist gleichzeitig die „Benutzeranmeldung“,
   hinter der die ganze App liegt – ohne Login sieht niemand die Daten) und
   teste kurz eine Standort-/Volk-Anlage.
4. Prüfe, dass deine bestehende Seite unter `https://luisenthaler-bienenstich.de/`
   weiterhin normal funktioniert.

## Fehlerbehebung

**`/imkerei/api/health` liefert einen 500-Fehler oder eine leere Seite**
→ Meist ein Datenbank-Zugangsdaten-Fehler in `config.php`, oder PHP-Version zu
alt. Prüfe im Kundencenter das PHP-Fehlerprotokoll (oft unter „Logs“ oder
„Protokolle“ erreichbar).

**`/imkerei/api/health` liefert 404**
→ `.htaccess` in `imkerei/api/` wird nicht angewendet. Prüfe, ob dein
Hosting-Paket `.htaccess`/`mod_rewrite` erlaubt (bei web.de standardmäßig der
Fall). Prüfe auch, ob die `.htaccess`-Datei tatsächlich mit hochgeladen wurde
(manche FTP-Programme blenden Dateien mit führendem Punkt standardmäßig aus –
in FileZilla z.B. unter Server → „Versteckte Dateien anzeigen“ aktivieren).

**Login funktioniert nicht, aber `/imkerei/api/auth/status` antwortet korrekt**
→ Der `Authorization`-Header kommt nicht bei PHP an (kommt auf manchen
Shared-Hosting-Konfigurationen vor). Die mitgelieferte `.htaccess` in
`imkerei/api/` enthält bereits eine Rewrite-Regel, die das behebt. Falls es
trotzdem nicht funktioniert, wende dich an den web.de-Support und frage nach
Aktivierung von „PHP CGI Authorization Header Passthrough“ bzw. `CGIPassAuth`.

**Direktes Aufrufen einer Unterseite (z.B. `/imkerei/voelker`) per Lesezeichen
liefert einen 404**
→ Die Frontend-`.htaccess` (SPA-Fallback) greift nicht. Prüfe, ob sie korrekt
in `imkerei/` hochgeladen wurde und `mod_rewrite` aktiv ist.

**Die App soll doch in einem anderen Unterordner oder an der Domain-Wurzel liegen**
→ In `frontend/public/.htaccess` `RewriteBase` und die `RewriteCond` für
`/imkerei/api/` an den neuen Pfad anpassen, Frontend mit passendem
`VITE_BASE_PATH` neu bauen (bei Domain-Wurzel: `VITE_BASE_PATH=/` bzw. die
Variable weglassen) und neu hochladen.

## Unterschiede zur Node.js/Docker-Variante

- **Datenbank**: MySQL/MariaDB statt SQLite.
- **Backup-Format**: JSON-Export aller Tabellen statt einer `.db`-Datei
  (funktional gleichwertig, über dieselbe „Backup“-Seite in der App nutzbar).
- **Keine Docker-Unterstützung nötig/möglich** – reines PHP+Apache-Hosting.
- Beide Backend-Varianten bedienen exakt dieselbe Frontend-API, das Frontend
  selbst ist identisch und muss nicht angepasst werden.

## Lokale Entwicklung/Test des PHP-Backends

Ohne Apache, mit PHPs eingebautem Server:

```bash
cd php-backend
cp config.php.example config.php   # Zugangsdaten zu einer lokalen MySQL/MariaDB eintragen
mysql -u root your_db < schema.sql
php -S localhost:8080 router.php
```

Das Frontend im Dev-Modus (`npm run dev` in `frontend/`) erwartet das Backend
standardmäßig auf Port 3001 (Node). Um stattdessen gegen das PHP-Backend zu
testen, den Proxy-Port in `frontend/vite.config.ts` temporär auf `8080` ändern.
