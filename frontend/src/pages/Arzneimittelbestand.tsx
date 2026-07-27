import { Fragment, useEffect, useState } from 'react';
import { api } from '../api/client';
import type { Arzneimittel, Behandlung } from '../api/types';

const empty = {
  name: '',
  chargennummer: '',
  einheit: 'ml',
  bestand: '',
  verfallsdatum: '',
  bezugsquelle: '',
  einkaufsdatum: '',
  wartezeit_tage: '0',
  notizen: '',
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

export function Arzneimittelbestand() {
  const [arzneimittel, setArzneimittel] = useState<Arzneimittel[]>([]);
  const [behandlungen, setBehandlungen] = useState<Behandlung[]>([]);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  function load() {
    api.get<Arzneimittel[]>('/arzneimittel').then(setArzneimittel);
    api.get<Behandlung[]>('/behandlungen').then(setBehandlungen);
  }

  useEffect(load, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const payload = {
        ...form,
        bestand: form.bestand ? Number(form.bestand) : 0,
        wartezeit_tage: form.wartezeit_tage ? Number(form.wartezeit_tage) : 0,
      };
      if (editingId) {
        await api.put(`/arzneimittel/${editingId}`, payload);
      } else {
        await api.post('/arzneimittel', payload);
      }
      setForm(empty);
      setEditingId(null);
      setShowForm(false);
      load();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  function edit(a: Arzneimittel) {
    setForm({
      name: a.name,
      chargennummer: a.chargennummer ?? '',
      einheit: a.einheit,
      bestand: String(a.bestand),
      verfallsdatum: a.verfallsdatum ?? '',
      bezugsquelle: a.bezugsquelle ?? '',
      einkaufsdatum: a.einkaufsdatum ?? '',
      wartezeit_tage: String(a.wartezeit_tage),
      notizen: a.notizen ?? '',
    });
    setEditingId(a.id);
    setShowForm(true);
  }

  async function remove(id: number) {
    if (!confirm('Arzneimittel wirklich löschen?')) return;
    await api.del(`/arzneimittel/${id}`);
    load();
  }

  return (
    <div>
      <div className="section-header">
        <h2>Arzneimittel-Bestandsbuch</h2>
        <button
          className="btn"
          onClick={() => {
            setShowForm((v) => !v);
            setEditingId(null);
            setForm(empty);
          }}
        >
          {showForm ? 'Abbrechen' : '+ Neues Arzneimittel'}
        </button>
      </div>
      <p className="muted-text">
        Erfasst Zu- und Abgänge von Tierarzneimitteln (z.B. Varroa-Behandlungsmittel) inkl. Chargennummer,
        Verfallsdatum und Wartezeit – als Nachweis für das gesetzlich vorgeschriebene Bestandsbuch.
      </p>

      {showForm && (
        <div className="card">
          {error && <div className="error">{error}</div>}
          <form className="form-grid" onSubmit={submit}>
            <div className="field">
              <label>Name *</label>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="field">
              <label>Chargennummer</label>
              <input value={form.chargennummer} onChange={(e) => setForm({ ...form, chargennummer: e.target.value })} />
            </div>
            <div className="field">
              <label>Einheit</label>
              <input value={form.einheit} onChange={(e) => setForm({ ...form, einheit: e.target.value })} />
            </div>
            <div className="field">
              <label>Bestand</label>
              <input
                type="number"
                step="any"
                value={form.bestand}
                onChange={(e) => setForm({ ...form, bestand: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Verfallsdatum</label>
              <input
                type="date"
                value={form.verfallsdatum}
                onChange={(e) => setForm({ ...form, verfallsdatum: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Bezugsquelle</label>
              <input
                placeholder="z.B. Tierarzt / Apotheke"
                value={form.bezugsquelle}
                onChange={(e) => setForm({ ...form, bezugsquelle: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Einkaufsdatum</label>
              <input
                type="date"
                value={form.einkaufsdatum}
                onChange={(e) => setForm({ ...form, einkaufsdatum: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Wartezeit (Tage)</label>
              <input
                type="number"
                value={form.wartezeit_tage}
                onChange={(e) => setForm({ ...form, wartezeit_tage: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Notizen</label>
              <input value={form.notizen} onChange={(e) => setForm({ ...form, notizen: e.target.value })} />
            </div>
            <div className="form-actions">
              <button className="btn" type="submit">
                {editingId ? 'Speichern' : 'Anlegen'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        {arzneimittel.length === 0 ? (
          <p className="empty">Noch keine Arzneimittel erfasst.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Charge</th>
                <th>Bestand</th>
                <th>Verfallsdatum</th>
                <th>Wartezeit</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {arzneimittel.map((a) => {
                const applications = behandlungen.filter((b) => b.arzneimittel_id === a.id);
                const abgelaufen = a.verfallsdatum && a.verfallsdatum < today();
                return (
                  <Fragment key={a.id}>
                    <tr>
                      <td>
                        <button
                          className="btn secondary"
                          style={{ padding: '0.15rem 0.5rem', marginRight: '0.4rem' }}
                          onClick={() => setExpandedId(expandedId === a.id ? null : a.id)}
                        >
                          {expandedId === a.id ? '▾' : '▸'}
                        </button>
                        {a.name}
                      </td>
                      <td>{a.chargennummer ?? '–'}</td>
                      <td>
                        {a.bestand} {a.einheit}
                      </td>
                      <td>
                        {a.verfallsdatum ? (
                          <span className={`badge ${abgelaufen ? 'warn' : 'muted'}`}>{a.verfallsdatum}</span>
                        ) : (
                          '–'
                        )}
                      </td>
                      <td>{a.wartezeit_tage} Tage</td>
                      <td>
                        <div className="btn-row">
                          <button className="btn secondary" onClick={() => edit(a)}>
                            Bearbeiten
                          </button>
                          <button className="btn danger" onClick={() => remove(a.id)}>
                            Löschen
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expandedId === a.id && (
                      <tr>
                        <td colSpan={6} style={{ background: '#fff8ec' }}>
                          <strong>Anwendungen ({applications.length})</strong>
                          {applications.length === 0 ? (
                            <p className="empty">Noch keine Anwendungen erfasst.</p>
                          ) : (
                            <table>
                              <thead>
                                <tr>
                                  <th>Datum</th>
                                  <th>Volk</th>
                                  <th>Menge</th>
                                  <th>Wartezeit bis</th>
                                </tr>
                              </thead>
                              <tbody>
                                {applications.map((b) => (
                                  <tr key={b.id}>
                                    <td>{b.datum}</td>
                                    <td>{b.volk_name ?? `Volk #${b.volk_id}`}</td>
                                    <td>
                                      {b.menge_verbraucht ?? '–'} {a.einheit}
                                    </td>
                                    <td>{b.wartezeit_ende ?? '–'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
