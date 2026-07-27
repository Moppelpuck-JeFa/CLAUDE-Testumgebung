# Deployment auf web.de-Webspace (oder ähnlichem Shared-Hosting)

Diese Anleitung beschreibt, wie du die Imkerei-Verwaltung auf einem klassischen
PHP/MySQL-Webspace installierst – z.B. bei web.de, aber genauso bei GMX, IONOS,
Strato & Co., solange PHP (8.0+) und eine MySQL/MariaDB-Datenbank zur Verfügung
stehen.

Diese Variante nutzt **`php-backend/`** statt des Node.js-Backends in `backend/`.
Das Frontend (`frontend/`) bleibt identisch.

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
npm run build
```

Das erzeugt den Ordner `frontend/dist/` – das ist alles, was du für das
Frontend hochladen musst (inklusive der enthaltenen `.htaccess`).

## 3. Dateien per FTP hochladen

Verbinde dich mit einem FTP-Programm (z.B. FileZilla) mit deinem web.de-Webspace
und lade hoch:

- **Alles aus `frontend/dist/`** → in das Wurzelverzeichnis deines Webspace
  (dort, wo z.B. auch deine Domain direkt hin zeigt, oft `htdocs/` o.ä. je nach
  Anbieter-Struktur).
- **Alles aus `php-backend/`** → in einen Unterordner `api/` innerhalb des
  Webspace-Wurzelverzeichnisses.

Danach sollte die Struktur auf dem Webspace ungefähr so aussehen:

```
/ (Webspace-Wurzel)
├── .htaccess
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

**Wichtig:** Lade `config.php` (falls du sie schon lokal angelegt hast) NICHT
mit hoch, solange sie noch Platzhalter-Werte enthält – siehe Schritt 5.

## 4. Datenbank-Schema importieren

1. Öffne phpMyAdmin über das web.de-Kundencenter.
2. Wähle deine neu angelegte Datenbank aus.
3. Öffne den Reiter „Importieren“ und wähle die Datei `php-backend/schema.sql`
   von deinem Rechner aus.
4. Import starten. Danach sollten 7 Tabellen existieren: `users`, `standorte`,
   `voelker`, `durchsichten`, `arzneimittel`, `behandlungen`, `ernten`.

## 5. Konfigurationsdatei anlegen

Auf dem Webspace (per FTP-Editor oder: lokal bearbeiten und hochladen):

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

1. Rufe `https://deine-domain.de/api/health` auf – die Antwort sollte
   `{"status":"ok"}` sein. Falls stattdessen ein Serverfehler oder eine leere
   Seite erscheint, siehe Abschnitt „Fehlerbehebung“ unten.
2. Rufe deine Domain direkt auf (`https://deine-domain.de/`) – die App sollte
   laden und dich zur Einrichtung des ersten Benutzers auffordern.
3. Lege den ersten Benutzer an und teste kurz eine Standort-/Volk-Anlage.

## Deployment in einem Unterordner (z.B. `deine-domain.de/imkerei/`)

Falls die App nicht direkt an der Domain-Wurzel, sondern in einem Unterordner
liegen soll:

- Lade die Frontend-Dateien in diesen Unterordner statt in die Webspace-Wurzel.
- Passe in der hochgeladenen `.htaccess` im Frontend-Ordner die Zeile
  `RewriteBase /` auf `RewriteBase /imkerei/` an.
- Der `api/`-Unterordner bleibt relativ dazu, also z.B.
  `deine-domain.de/imkerei/api/`.

## Fehlerbehebung

**`/api/health` liefert einen 500-Fehler oder eine leere Seite**
→ Meist ein Datenbank-Zugangsdaten-Fehler in `config.php`, oder PHP-Version zu
alt. Prüfe im Kundencenter das PHP-Fehlerprotokoll (oft unter „Logs“ oder
„Protokolle“ erreichbar).

**`/api/health` liefert 404**
→ `.htaccess` in `api/` wird nicht angewendet. Prüfe, ob dein Hosting-Paket
`.htaccess`/`mod_rewrite` erlaubt (bei web.de standardmäßig der Fall). Prüfe
auch, ob die `.htaccess`-Datei tatsächlich mit hochgeladen wurde (manche
FTP-Programme blenden Dateien mit führendem Punkt standardmäßig aus).

**Login funktioniert nicht, aber `/api/auth/status` antwortet korrekt**
→ Der `Authorization`-Header kommt nicht bei PHP an (kommt auf manchen
Shared-Hosting-Konfigurationen vor). Die mitgelieferte `.htaccess` in `api/`
enthält bereits eine Rewrite-Regel, die das behebt. Falls es trotzdem nicht
funktioniert, wende dich an den web.de-Support und frage nach Aktivierung von
„PHP CGI Authorization Header Passthrough“ bzw. `CGIPassAuth`.

**Direktes Aufrufen einer Unterseite (z.B. `/voelker`) per Lesezeichen liefert
einen 404**
→ Die Frontend-`.htaccess` (SPA-Fallback) greift nicht. Prüfe, ob sie korrekt
hochgeladen wurde und `mod_rewrite` aktiv ist.

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
