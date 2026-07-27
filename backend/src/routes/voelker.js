import { Router } from 'express';
import { db } from '../db.js';

export const router = Router();

router.get('/', (req, res) => {
  const rows = db.prepare(`
    SELECT v.*, s.name AS standort_name
    FROM voelker v
    LEFT JOIN standorte s ON s.id = v.standort_id
    ORDER BY v.name
  `).all();
  res.json(rows);
});

router.get('/:id', (req, res) => {
  const row = db.prepare(`
    SELECT v.*, s.name AS standort_name
    FROM voelker v LEFT JOIN standorte s ON s.id = v.standort_id
    WHERE v.id = ?
  `).get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Volk nicht gefunden' });
  res.json(row);
});

router.post('/', (req, res) => {
  const { standort_id, name, beutentyp, koenigin_jahr, koenigin_rasse, koenigin_gezeichnet, status, notizen } = req.body;
  if (!name) return res.status(400).json({ error: 'name ist erforderlich' });
  const result = db.prepare(`
    INSERT INTO voelker (standort_id, name, beutentyp, koenigin_jahr, koenigin_rasse, koenigin_gezeichnet, status, notizen)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    standort_id ?? null, name, beutentyp ?? null, koenigin_jahr ?? null,
    koenigin_rasse ?? null, koenigin_gezeichnet ? 1 : 0, status ?? 'aktiv', notizen ?? null
  );
  res.status(201).json(db.prepare('SELECT * FROM voelker WHERE id = ?').get(result.lastInsertRowid));
});

router.put('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM voelker WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Volk nicht gefunden' });
  const b = req.body;
  db.prepare(`
    UPDATE voelker SET standort_id = ?, name = ?, beutentyp = ?, koenigin_jahr = ?,
      koenigin_rasse = ?, koenigin_gezeichnet = ?, status = ?, notizen = ?
    WHERE id = ?
  `).run(
    b.standort_id ?? existing.standort_id,
    b.name ?? existing.name,
    b.beutentyp ?? existing.beutentyp,
    b.koenigin_jahr ?? existing.koenigin_jahr,
    b.koenigin_rasse ?? existing.koenigin_rasse,
    b.koenigin_gezeichnet !== undefined ? (b.koenigin_gezeichnet ? 1 : 0) : existing.koenigin_gezeichnet,
    b.status ?? existing.status,
    b.notizen ?? existing.notizen,
    req.params.id
  );
  res.json(db.prepare('SELECT * FROM voelker WHERE id = ?').get(req.params.id));
});

router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM voelker WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Volk nicht gefunden' });
  res.status(204).end();
});
