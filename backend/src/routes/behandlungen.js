import { Router } from 'express';
import { db } from '../db.js';

export const router = Router();

function addDays(dateStr, days) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + Number(days || 0));
  return d.toISOString().slice(0, 10);
}

router.get('/', (req, res) => {
  const { volk_id } = req.query;
  const rows = volk_id
    ? db.prepare(`
        SELECT b.*, a.name AS arzneimittel_name FROM behandlungen b
        LEFT JOIN arzneimittel a ON a.id = b.arzneimittel_id
        WHERE b.volk_id = ? ORDER BY b.datum DESC
      `).all(volk_id)
    : db.prepare(`
        SELECT b.*, a.name AS arzneimittel_name, v.name AS volk_name FROM behandlungen b
        LEFT JOIN arzneimittel a ON a.id = b.arzneimittel_id
        LEFT JOIN voelker v ON v.id = b.volk_id
        ORDER BY b.datum DESC
      `).all();
  res.json(rows);
});

router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM behandlungen WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Behandlung nicht gefunden' });
  res.json(row);
});

router.post('/', (req, res) => {
  const b = req.body;
  if (!b.volk_id || !b.datum) return res.status(400).json({ error: 'volk_id und datum sind erforderlich' });

  const insert = db.transaction(() => {
    let wartezeitEnde = b.wartezeit_ende ?? null;
    if (!wartezeitEnde && b.arzneimittel_id) {
      const medikament = db.prepare('SELECT * FROM arzneimittel WHERE id = ?').get(b.arzneimittel_id);
      if (medikament?.wartezeit_tage) wartezeitEnde = addDays(b.datum, medikament.wartezeit_tage);
    }
    const result = db.prepare(`
      INSERT INTO behandlungen (volk_id, arzneimittel_id, datum, indikation, dosierung, anwendungsmethode, menge_verbraucht, wartezeit_ende, behandelnde_person, notizen)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      b.volk_id, b.arzneimittel_id ?? null, b.datum, b.indikation ?? null,
      b.dosierung ?? null, b.anwendungsmethode ?? null, b.menge_verbraucht ?? null,
      wartezeitEnde, b.behandelnde_person ?? null, b.notizen ?? null
    );
    if (b.arzneimittel_id && b.menge_verbraucht) {
      db.prepare('UPDATE arzneimittel SET bestand = bestand - ? WHERE id = ?').run(b.menge_verbraucht, b.arzneimittel_id);
    }
    return result.lastInsertRowid;
  });

  const id = insert();
  res.status(201).json(db.prepare('SELECT * FROM behandlungen WHERE id = ?').get(id));
});

router.put('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM behandlungen WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Behandlung nicht gefunden' });
  const b = req.body;
  db.prepare(`
    UPDATE behandlungen SET datum = ?, arzneimittel_id = ?, indikation = ?, dosierung = ?,
      anwendungsmethode = ?, menge_verbraucht = ?, wartezeit_ende = ?, behandelnde_person = ?, notizen = ?
    WHERE id = ?
  `).run(
    b.datum ?? existing.datum,
    b.arzneimittel_id ?? existing.arzneimittel_id,
    b.indikation ?? existing.indikation,
    b.dosierung ?? existing.dosierung,
    b.anwendungsmethode ?? existing.anwendungsmethode,
    b.menge_verbraucht ?? existing.menge_verbraucht,
    b.wartezeit_ende ?? existing.wartezeit_ende,
    b.behandelnde_person ?? existing.behandelnde_person,
    b.notizen ?? existing.notizen,
    req.params.id
  );
  res.json(db.prepare('SELECT * FROM behandlungen WHERE id = ?').get(req.params.id));
});

router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM behandlungen WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Behandlung nicht gefunden' });
  res.status(204).end();
});
