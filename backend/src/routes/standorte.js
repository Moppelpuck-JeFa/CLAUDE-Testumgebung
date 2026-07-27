import { Router } from 'express';
import { db } from '../db.js';

export const router = Router();

router.get('/', (req, res) => {
  const rows = db.prepare(`
    SELECT s.*, (SELECT COUNT(*) FROM voelker v WHERE v.standort_id = s.id) AS anzahl_voelker
    FROM standorte s ORDER BY s.name
  `).all();
  res.json(rows);
});

router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM standorte WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Standort nicht gefunden' });
  res.json(row);
});

router.post('/', (req, res) => {
  const { name, adresse, notizen } = req.body;
  if (!name) return res.status(400).json({ error: 'name ist erforderlich' });
  const result = db.prepare(
    'INSERT INTO standorte (name, adresse, notizen) VALUES (?, ?, ?)'
  ).run(name, adresse ?? null, notizen ?? null);
  res.status(201).json(db.prepare('SELECT * FROM standorte WHERE id = ?').get(result.lastInsertRowid));
});

router.put('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM standorte WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Standort nicht gefunden' });
  const { name, adresse, notizen } = req.body;
  db.prepare('UPDATE standorte SET name = ?, adresse = ?, notizen = ? WHERE id = ?').run(
    name ?? existing.name, adresse ?? existing.adresse, notizen ?? existing.notizen, req.params.id
  );
  res.json(db.prepare('SELECT * FROM standorte WHERE id = ?').get(req.params.id));
});

router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM standorte WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Standort nicht gefunden' });
  res.status(204).end();
});
