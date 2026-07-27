# Imkerei-Verwaltung

Eine Webapp zur Verwaltung einer Imkerei: Standorte, Bienenvölker, Durchsichten,
Behandlungen, Honigernte und ein Arzneimittel-Bestandsbuch. Zugriff erfordert
eine Anmeldung; alle angemeldeten Benutzer teilen sich dieselben Daten.

## Stack

- **Backend**: Node.js, Express, SQLite (better-sqlite3), JWT-Auth – REST-API unter `/api`
- **Frontend**: React, TypeScript, Vite, React Router

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

## API-Übersicht

Alle Ressourcen unterstützen `GET /api/<ressource>`, `GET /api/<ressource>/:id`,
`POST`, `PUT /:id` und `DELETE /:id` (Authentifizierung erforderlich):

- `/api/standorte`
- `/api/voelker`
- `/api/durchsichten` (Filter: `?volk_id=`)
- `/api/arzneimittel`
- `/api/behandlungen` (Filter: `?volk_id=`)
- `/api/ernten` (Filter: `?volk_id=`)

Auth-Endpunkte:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/auth/users`
- `GET /api/auth/status`
