import { Router } from 'express';
import { db } from '../db.js';

export const router = Router();

router.get('/', (req, res) => {
  const { volk_id } = req.query;
  const rows = volk_id
    ? db.prepare('SELECT * FROM durchsichten WHERE volk_id = ? ORDER BY datum DESC').all(volk_id)
    : db.prepare('SELECT * FROM durchsichten ORDER BY datum DESC').all();
  res.json(rows);
});

router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM durchsichten WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Durchsicht nicht gefunden' });
  res.json(row);
});

router.post('/', (req, res) => {
  const b = req.body;
  if (!b.volk_id || !b.datum) return res.status(400).json({ error: 'volk_id und datum sind erforderlich' });
  const result = db.prepare(`
    INSERT INTO durchsichten (volk_id, datum, volksstaerke, brutnest, koenigin_gesehen, weiselzellen, futtervorrat, krankheiten, massnahmen, notizen)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    b.volk_id, b.datum, b.volksstaerke ?? null, b.brutnest ?? null,
    b.koenigin_gesehen ? 1 : 0, b.weiselzellen ? 1 : 0, b.futtervorrat ?? null,
    b.krankheiten ?? null, b.massnahmen ?? null, b.notizen ?? null
  );
  res.status(201).json(db.prepare('SELECT * FROM durchsichten WHERE id = ?').get(result.lastInsertRowid));
});

router.put('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM durchsichten WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Durchsicht nicht gefunden' });
  const b = req.body;
  db.prepare(`
    UPDATE durchsichten SET datum = ?, volksstaerke = ?, brutnest = ?, koenigin_gesehen = ?,
      weiselzellen = ?, futtervorrat = ?, krankheiten = ?, massnahmen = ?, notizen = ?
    WHERE id = ?
  `).run(
    b.datum ?? existing.datum,
    b.volksstaerke ?? existing.volksstaerke,
    b.brutnest ?? existing.brutnest,
    b.koenigin_gesehen !== undefined ? (b.koenigin_gesehen ? 1 : 0) : existing.koenigin_gesehen,
    b.weiselzellen !== undefined ? (b.weiselzellen ? 1 : 0) : existing.weiselzellen,
    b.futtervorrat ?? existing.futtervorrat,
    b.krankheiten ?? existing.krankheiten,
    b.massnahmen ?? existing.massnahmen,
    b.notizen ?? existing.notizen,
    req.params.id
  );
  res.json(db.prepare('SELECT * FROM durchsichten WHERE id = ?').get(req.params.id));
});

router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM durchsichten WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Durchsicht nicht gefunden' });
  res.status(204).end();
});
