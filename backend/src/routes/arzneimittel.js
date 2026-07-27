import { Router } from 'express';
import { db } from '../db.js';

export const router = Router();

router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM arzneimittel ORDER BY name').all();
  res.json(rows);
});

router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM arzneimittel WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Arzneimittel nicht gefunden' });
  res.json(row);
});

router.post('/', (req, res) => {
  const b = req.body;
  if (!b.name) return res.status(400).json({ error: 'name ist erforderlich' });
  const result = db.prepare(`
    INSERT INTO arzneimittel (name, chargennummer, einheit, bestand, verfallsdatum, bezugsquelle, einkaufsdatum, wartezeit_tage, notizen)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    b.name, b.chargennummer ?? null, b.einheit ?? 'ml', b.bestand ?? 0,
    b.verfallsdatum ?? null, b.bezugsquelle ?? null, b.einkaufsdatum ?? null,
    b.wartezeit_tage ?? 0, b.notizen ?? null
  );
  res.status(201).json(db.prepare('SELECT * FROM arzneimittel WHERE id = ?').get(result.lastInsertRowid));
});

router.put('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM arzneimittel WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Arzneimittel nicht gefunden' });
  const b = req.body;
  db.prepare(`
    UPDATE arzneimittel SET name = ?, chargennummer = ?, einheit = ?, bestand = ?,
      verfallsdatum = ?, bezugsquelle = ?, einkaufsdatum = ?, wartezeit_tage = ?, notizen = ?
    WHERE id = ?
  `).run(
    b.name ?? existing.name,
    b.chargennummer ?? existing.chargennummer,
    b.einheit ?? existing.einheit,
    b.bestand ?? existing.bestand,
    b.verfallsdatum ?? existing.verfallsdatum,
    b.bezugsquelle ?? existing.bezugsquelle,
    b.einkaufsdatum ?? existing.einkaufsdatum,
    b.wartezeit_tage ?? existing.wartezeit_tage,
    b.notizen ?? existing.notizen,
    req.params.id
  );
  res.json(db.prepare('SELECT * FROM arzneimittel WHERE id = ?').get(req.params.id));
});

router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM arzneimittel WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Arzneimittel nicht gefunden' });
  res.status(204).end();
});
