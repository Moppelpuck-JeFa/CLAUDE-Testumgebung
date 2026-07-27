import { Router } from 'express';
import { db } from '../db.js';

export const router = Router();

router.get('/', (req, res) => {
  const { volk_id } = req.query;
  const rows = volk_id
    ? db.prepare('SELECT * FROM ernten WHERE volk_id = ? ORDER BY datum DESC').all(volk_id)
    : db.prepare(`
        SELECT e.*, v.name AS volk_name, s.name AS standort_name FROM ernten e
        LEFT JOIN voelker v ON v.id = e.volk_id
        LEFT JOIN standorte s ON s.id = e.standort_id
        ORDER BY e.datum DESC
      `).all();
  res.json(rows);
});

router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM ernten WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Ernte nicht gefunden' });
  res.json(row);
});

router.post('/', (req, res) => {
  const b = req.body;
  if (!b.datum || b.menge_kg === undefined) return res.status(400).json({ error: 'datum und menge_kg sind erforderlich' });
  const result = db.prepare(`
    INSERT INTO ernten (volk_id, standort_id, datum, menge_kg, sorte, notizen)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(b.volk_id ?? null, b.standort_id ?? null, b.datum, b.menge_kg, b.sorte ?? null, b.notizen ?? null);
  res.status(201).json(db.prepare('SELECT * FROM ernten WHERE id = ?').get(result.lastInsertRowid));
});

router.put('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM ernten WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Ernte nicht gefunden' });
  const b = req.body;
  db.prepare(`
    UPDATE ernten SET volk_id = ?, standort_id = ?, datum = ?, menge_kg = ?, sorte = ?, notizen = ?
    WHERE id = ?
  `).run(
    b.volk_id ?? existing.volk_id,
    b.standort_id ?? existing.standort_id,
    b.datum ?? existing.datum,
    b.menge_kg ?? existing.menge_kg,
    b.sorte ?? existing.sorte,
    b.notizen ?? existing.notizen,
    req.params.id
  );
  res.json(db.prepare('SELECT * FROM ernten WHERE id = ?').get(req.params.id));
});

router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM ernten WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Ernte nicht gefunden' });
  res.status(204).end();
});
