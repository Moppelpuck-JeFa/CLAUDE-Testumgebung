# Imkerei-Verwaltung

Eine Webapp zur Verwaltung einer Imkerei: Standorte, Bienenvölker, Durchsichten,
Behandlungen, Honigernte und ein Arzneimittel-Bestandsbuch. Zugriff erfordert
eine Anmeldung; alle angemeldeten Benutzer teilen sich dieselben Daten.

## Stack

Es gibt zwei gleichwertige Backend-Varianten mit identischer API – das
Frontend funktioniert unverändert mit beiden:

- **`backend/`** – Node.js, Express, SQLite (better-sqlite3). Für lokale
  Entwicklung, einen eigenen VPS oder Docker (siehe unten).
- **`php-backend/`** – PHP (8.0+), MySQL/MariaDB, ohne externe Abhängigkeiten.
  Für klassisches Shared-Hosting ohne SSH/Node.js, z.B. web.de, GMX, IONOS,
  Strato. Siehe [`php-backend/DEPLOYMENT-WEBDE.md`](php-backend/DEPLOYMENT-WEBDE.md)
  für eine Schritt-für-Schritt-Anleitung.

**Frontend**: React, TypeScript, Vite, React Router (`frontend/`, für beide
Backend-Varianten identisch).

## Module

- **Anmeldung** – Login mit Benutzername/Passwort; beim allerersten Start wird das
  erste Konto direkt in der App eingerichtet. Weitere Benutzer können danach unter
  „Benutzer“ von einem bereits angemeldeten Benutzer angelegt werden. Alle Benutzer
  sehen und bearbeiten dieselben Imkerei-Daten (z.B. für Familie/Verein).
- **Standorte** – Bienenstände mit Adresse und Notizen
- **Bienenvölker** – Völker je Standort, mit Königin-Infos (Jahr, Rasse, gezeichnet) und Status
- **Durchsichten** – Protokoll je Volk: Volksstärke, Brutnest, Königin gesehen, Weiselzellen, Futtervorrat, Krankheiten, Maßnahmen
- **Behandlungen** – Behandlungen je Volk, verknüpft mit einem Arzneimittel; reduziert automatisch dessen Bestand und berechnet die Wartezeit
- **Honigernte** – Erntemengen je Volk mit Datum und Sorte
- **Arzneimittel-Bestandsbuch** – Bestand an Tierarzneimitteln (Chargennummer, Verfallsdatum, Bezugsquelle, Wartezeit) inkl. Anwendungshistorie je Mittel
- **Backup & Wiederherstellung** – vollständige Datenbank als Datei herunterladen und bei Bedarf wiederherstellen

Das Dashboard zeigt eine Übersicht sowie Warnungen zu laufenden Wartezeiten
und bald ablaufenden Arzneimitteln.

## Setup (lokal, ohne Docker)

### Backend

```bash
cd backend
npm install
JWT_SECRET=ein-zufaelliger-wert npm start   # Server auf http://localhost:3001
```

Für Entwicklung mit Auto-Reload: `npm run dev`. Ist `JWT_SECRET` nicht gesetzt,
wird ein unsicherer Standardwert verwendet (nur für lokale Entwicklung geeignet).

Die SQLite-Datenbank wird automatisch unter `backend/data/imkerei.db` angelegt.

### Frontend

```bash
cd frontend
npm install
npm run dev         # Dev-Server auf http://localhost:5173
```

Der Vite-Dev-Server proxyt Anfragen an `/api` automatisch an das Backend
(`http://localhost:3001`).

Für einen Produktions-Build:

```bash
npm run build        # erzeugt frontend/dist
```

## Setup mit Docker

Voraussetzung: Docker und Docker Compose.

```bash
cp .env.example .env
# JWT_SECRET in .env auf einen zufälligen Wert setzen, z.B.:
# openssl rand -hex 32

docker compose up --build
```

Die App ist danach unter `http://localhost:8080` erreichbar. Das Frontend
läuft als Nginx-Container, der `/api`-Anfragen intern an den Backend-Container
weiterleitet. Die SQLite-Datenbank wird im Docker-Volume `imkerei-data`
persistiert und übersteht Container-Neustarts.

Beim ersten Aufruf wird – wie im lokalen Setup – das erste Benutzerkonto direkt
in der App eingerichtet.

## Authentifizierung

- Alle `/api`-Routen außer `/api/auth/*` und `/api/health` erfordern einen
  gültigen JWT im `Authorization: Bearer <token>`-Header.
- `POST /api/auth/register` legt einen neuen Benutzer an: ohne Anmeldung nur,
  solange noch kein Benutzer existiert (Ersteinrichtung); danach nur für
  bereits angemeldete Benutzer.
- `POST /api/auth/login` liefert bei korrekten Zugangsdaten Benutzerdaten und Token.
- Passwörter werden mit bcrypt gehasht, nie im Klartext gespeichert.

## Backup & Wiederherstellung

Über die Seite „Backup“ in der App (angemeldet erforderlich):

- **Backup erstellen**: lädt eine konsistente Kopie der kompletten SQLite-Datenbank
  herunter (alle Standorte, Völker, Durchsichten, Behandlungen, Ernten, Arzneimittel
  und Benutzerkonten). Die Datei sollte an einem sicheren, separaten Ort aufbewahrt
  werden (z.B. Cloud-Speicher).
- **Wiederherstellen**: ersetzt die aktuelle Datenbank vollständig durch den Inhalt
  einer zuvor heruntergeladenen Backup-Datei. Vor dem Überschreiben wird automatisch
  eine Sicherheitskopie der bisherigen Datenbank unter
  `backend/data/imkerei.db.vor-wiederherstellung-<Zeitstempel>` angelegt. Nach einer
  Wiederherstellung werden alle Benutzer abgemeldet, da sich Zugangsdaten und Daten
  geändert haben können.

Auch über die API nutzbar (Authentifizierung erforderlich):

```bash
# Backup herunterladen
curl -H "Authorization: Bearer <token>" http://localhost:3001/api/backup -o backup.db

# Backup wiederherstellen
curl -X POST -H "Authorization: Bearer <token>" \
  -F "backup=@backup.db" http://localhost:3001/api/backup/restore
```

Bei Docker-Betrieb liegt die Datenbank im Volume `imkerei-data`; regelmäßige externe
Backups (z.B. per Cronjob mit obigem `curl`-Aufruf) werden dennoch empfohlen, da ein
gelöschtes Docker-Volume sonst zum vollständigen Datenverlust führt.

Beim PHP/MySQL-Backend (`php-backend/`) läuft Backup/Restore über dieselbe
Seite in der App, das Dateiformat ist dort aber ein JSON-Export aller Tabellen
statt einer `.db`-Datei (siehe `php-backend/DEPLOYMENT-WEBDE.md`). Die beiden
Formate sind nicht gegenseitig kompatibel – ein Backup vom Node-Backend lässt
sich nicht ins PHP-Backend einspielen und umgekehrt.

## API-Übersicht

Alle Ressourcen unterstützen `GET /api/<ressource>`, `GET /api/<ressource>/:id`,
`POST`, `PUT /:id` und `DELETE /:id` (Authentifizierung erforderlich):

- `/api/standorte`
- `/api/voelker`
- `/api/durchsichten` (Filter: `?volk_id=`)
- `/api/arzneimittel`
- `/api/behandlungen` (Filter: `?volk_id=`)
- `/api/ernten` (Filter: `?volk_id=`)
- `/api/backup` (GET: Download), `/api/backup/restore` (POST: Upload/Restore)

Auth-Endpunkte:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/auth/users`
- `GET /api/auth/status`
