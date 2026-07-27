import Database from 'better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

export const dbPath = path.join(dataDir, 'imkerei.db');

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  name TEXT,
  password_hash TEXT NOT NULL,
  erstellt_am TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS standorte (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  adresse TEXT,
  notizen TEXT,
  erstellt_am TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS voelker (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  standort_id INTEGER REFERENCES standorte(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  beutentyp TEXT,
  koenigin_jahr INTEGER,
  koenigin_rasse TEXT,
  koenigin_gezeichnet INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'aktiv',
  notizen TEXT,
  erstellt_am TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS durchsichten (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  volk_id INTEGER NOT NULL REFERENCES voelker(id) ON DELETE CASCADE,
  datum TEXT NOT NULL,
  volksstaerke TEXT,
  brutnest TEXT,
  koenigin_gesehen INTEGER DEFAULT 0,
  weiselzellen INTEGER DEFAULT 0,
  futtervorrat TEXT,
  sanftmut TEXT,
  krankheiten TEXT,
  massnahmen TEXT,
  notizen TEXT,
  erstellt_am TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS arzneimittel (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  chargennummer TEXT,
  einheit TEXT NOT NULL DEFAULT 'ml',
  bestand REAL NOT NULL DEFAULT 0,
  verfallsdatum TEXT,
  bezugsquelle TEXT,
  einkaufsdatum TEXT,
  wartezeit_tage INTEGER DEFAULT 0,
  notizen TEXT,
  erstellt_am TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS behandlungen (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  volk_id INTEGER NOT NULL REFERENCES voelker(id) ON DELETE CASCADE,
  arzneimittel_id INTEGER REFERENCES arzneimittel(id) ON DELETE SET NULL,
  datum TEXT NOT NULL,
  indikation TEXT,
  dosierung TEXT,
  anwendungsmethode TEXT,
  menge_verbraucht REAL,
  wartezeit_ende TEXT,
  behandelnde_person TEXT,
  notizen TEXT,
  erstellt_am TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS ernten (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  volk_id INTEGER REFERENCES voelker(id) ON DELETE SET NULL,
  standort_id INTEGER REFERENCES standorte(id) ON DELETE SET NULL,
  datum TEXT NOT NULL,
  menge_kg REAL NOT NULL,
  sorte TEXT,
  notizen TEXT,
  erstellt_am TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_voelker_standort ON voelker(standort_id);
CREATE INDEX IF NOT EXISTS idx_durchsichten_volk ON durchsichten(volk_id);
CREATE INDEX IF NOT EXISTS idx_behandlungen_volk ON behandlungen(volk_id);
CREATE INDEX IF NOT EXISTS idx_behandlungen_arzneimittel ON behandlungen(arzneimittel_id);
CREATE INDEX IF NOT EXISTS idx_ernten_volk ON ernten(volk_id);
`;

// Für bereits bestehende Datenbanken: Spalten nachrüsten, die erst nach dem
// ursprünglichen CREATE TABLE hinzugekommen sind (CREATE TABLE IF NOT EXISTS
// ändert keine bereits vorhandenen Tabellen).
function ensureColumn(instance, table, column, definition) {
  const columns = instance.prepare(`PRAGMA table_info(${table})`).all();
  if (!columns.some((c) => c.name === column)) {
    instance.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

function openDatabase() {
  const instance = new Database(dbPath);
  instance.pragma('journal_mode = WAL');
  instance.pragma('foreign_keys = ON');
  instance.exec(SCHEMA_SQL);
  ensureColumn(instance, 'durchsichten', 'sanftmut', 'TEXT');
  return instance;
}

export let db = openDatabase();

// Nach einer Wiederherstellung (Restore) aus einem Backup muss die
// Verbindung zur ausgetauschten Datenbankdatei neu aufgebaut werden. Da
// andere Module `db` per ES-Module-Live-Binding importieren, sehen sie die
// neue Instanz automatisch, sobald sie hier neu zugewiesen wird.
export function reopenDatabase() {
  db = openDatabase();
}
