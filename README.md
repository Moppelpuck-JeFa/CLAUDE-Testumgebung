# Imkerei-Verwaltung

Eine Webapp zur Verwaltung einer Imkerei: Standorte, Bienenvölker, Durchsichten,
Behandlungen, Honigernte und ein Arzneimittel-Bestandsbuch.

## Stack

- **Backend**: Node.js, Express, SQLite (better-sqlite3) – REST-API unter `/api`
- **Frontend**: React, TypeScript, Vite, React Router

## Module

- **Standorte** – Bienenstände mit Adresse und Notizen
- **Bienenvölker** – Völker je Standort, mit Königin-Infos (Jahr, Rasse, gezeichnet) und Status
- **Durchsichten** – Protokoll je Volk: Volksstärke, Brutnest, Königin gesehen, Weiselzellen, Futtervorrat, Krankheiten, Maßnahmen
- **Behandlungen** – Behandlungen je Volk, verknüpft mit einem Arzneimittel; reduziert automatisch dessen Bestand und berechnet die Wartezeit
- **Honigernte** – Erntemengen je Volk mit Datum und Sorte
- **Arzneimittel-Bestandsbuch** – Bestand an Tierarzneimitteln (Chargennummer, Verfallsdatum, Bezugsquelle, Wartezeit) inkl. Anwendungshistorie je Mittel

Das Dashboard zeigt eine Übersicht sowie Warnungen zu laufenden Wartezeiten
und bald ablaufenden Arzneimitteln.

## Setup

### Backend

```bash
cd backend
npm install
npm start          # Server auf http://localhost:3001
```

Für Entwicklung mit Auto-Reload: `npm run dev`

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

Das `dist`-Verzeichnis kann von einem beliebigen statischen Webserver
ausgeliefert werden, der `/api`-Anfragen an das Backend weiterleitet.

## API-Übersicht

Alle Ressourcen unterstützen `GET /api/<ressource>`, `GET /api/<ressource>/:id`,
`POST`, `PUT /:id` und `DELETE /:id`:

- `/api/standorte`
- `/api/voelker`
- `/api/durchsichten` (Filter: `?volk_id=`)
- `/api/arzneimittel`
- `/api/behandlungen` (Filter: `?volk_id=`)
- `/api/ernten` (Filter: `?volk_id=`)
