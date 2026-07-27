import { Router } from 'express';
import multer from 'multer';
import Database from 'better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { db, dbPath, reopenDatabase } from '../db.js';

export const router = Router();

const REQUIRED_TABLES = ['users', 'standorte', 'voelker', 'durchsichten', 'arzneimittel', 'behandlungen', 'ernten'];

function timestamp() {
  return new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
}

router.get('/', async (req, res) => {
  const tmpFile = path.join(os.tmpdir(), `imkerei-backup-${Date.now()}.db`);
  try {
    await db.backup(tmpFile);
    res.download(tmpFile, `imkerei-backup-${timestamp()}.db`, (err) => {
      fs.unlink(tmpFile, () => {});
      if (err) console.error('Backup-Download fehlgeschlagen:', err);
    });
  } catch (err) {
    fs.unlink(tmpFile, () => {});
    console.error(err);
    res.status(500).json({ error: 'Backup konnte nicht erstellt werden' });
  }
});

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 200 * 1024 * 1024 } });

router.post('/restore', upload.single('backup'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Keine Backup-Datei hochgeladen' });

  const tmpFile = path.join(os.tmpdir(), `imkerei-restore-${Date.now()}.db`);
  fs.writeFileSync(tmpFile, req.file.buffer);

  let testDb;
  try {
    testDb = new Database(tmpFile, { readonly: true, fileMustExist: true });
    const tables = testDb
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table'")
      .all()
      .map((r) => r.name);
    const missing = REQUIRED_TABLES.filter((t) => !tables.includes(t));
    if (missing.length > 0) {
      throw new Error('Die Datei ist kein gültiges Backup dieser App (fehlende Tabellen).');
    }
  } catch (err) {
    fs.unlink(tmpFile, () => {});
    const message = err.message?.startsWith('Die Datei')
      ? err.message
      : 'Die Datei ist keine gültige SQLite-Backup-Datei.';
    return res.status(400).json({ error: message });
  } finally {
    testDb?.close();
  }

  try {
    db.close();
    fs.copyFileSync(dbPath, `${dbPath}.vor-wiederherstellung-${timestamp()}`);
    fs.copyFileSync(tmpFile, dbPath);
    for (const ext of ['-wal', '-shm']) {
      const walFile = `${dbPath}${ext}`;
      if (fs.existsSync(walFile)) fs.unlinkSync(walFile);
    }
    reopenDatabase();
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Wiederherstellung fehlgeschlagen: ' + err.message });
  } finally {
    fs.unlink(tmpFile, () => {});
  }
});
