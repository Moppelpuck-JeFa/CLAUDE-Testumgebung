import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import type { Standort, Volk } from '../api/types';

const empty = {
  name: '',
  standort_id: '',
  beutentyp: '',
  koenigin_jahr: '',
  koenigin_rasse: '',
  koenigin_gezeichnet: false,
  status: 'aktiv',
  notizen: '',
};

export function Voelker() {
  const [voelker, setVoelker] = useState<Volk[]>([]);
  const [standorte, setStandorte] = useState<Standort[]>([]);
  const [form, setForm] = useState(empty);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [params] = useSearchParams();
  const standortFilter = params.get('standort');

  function load() {
    api.get<Volk[]>('/voelker').then(setVoelker);
    api.get<Standort[]>('/standorte').then(setStandorte);
  }

  useEffect(load, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api.post('/voelker', {
        ...form,
        standort_id: form.standort_id ? Number(form.standort_id) : null,
        koenigin_jahr: form.koenigin_jahr ? Number(form.koenigin_jahr) : null,
      });
      setForm(empty);
      setShowForm(false);
      load();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function remove(id: number) {
    if (!confirm('Volk wirklich löschen? Alle Durchsichten, Behandlungen und Ernten dieses Volks werden mitgelöscht.')) return;
    await api.del(`/voelker/${id}`);
    load();
  }

  const gefiltert = standortFilter ? voelker.filter((v) => String(v.standort_id) === standortFilter) : voelker;

  return (
    <div>
      <div className="section-header">
        <h2>Bienenvölker</h2>
        <button className="btn" onClick={() => setShowForm((v) => !v)}>
          {showForm ? 'Abbrechen' : '+ Neues Volk'}
        </button>
      </div>

      {showForm && (
        <div className="card">
          {error && <div className="error">{error}</div>}
          <form className="form-grid" onSubmit={submit}>
            <div className="field">
              <label>Name / Nummer *</label>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="field">
              <label>Standort</label>
              <select value={form.standort_id} onChange={(e) => setForm({ ...form, standort_id: e.target.value })}>
                <option value="">– kein Standort –</option>
                {standorte.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Beutentyp</label>
              <input
                placeholder="z.B. Deutsch Normal"
                value={form.beutentyp}
                onChange={(e) => setForm({ ...form, beutentyp: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Königin – Jahr</label>
              <input
                type="number"
                value={form.koenigin_jahr}
                onChange={(e) => setForm({ ...form, koenigin_jahr: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Königin – Rasse</label>
              <input
                placeholder="z.B. Carnica"
                value={form.koenigin_rasse}
                onChange={(e) => setForm({ ...form, koenigin_rasse: e.target.value })}
              />
            </div>
            <div className="field checkbox">
              <input
                type="checkbox"
                id="gezeichnet"
                checked={form.koenigin_gezeichnet}
                onChange={(e) => setForm({ ...form, koenigin_gezeichnet: e.target.checked })}
              />
              <label htmlFor="gezeichnet">Königin gezeichnet</label>
            </div>
            <div className="field">
              <label>Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="aktiv">aktiv</option>
                <option value="eingegangen">eingegangen</option>
                <option value="aufgeloest">aufgelöst</option>
                <option value="verkauft">verkauft</option>
              </select>
            </div>
            <div className="field">
              <label>Notizen</label>
              <input value={form.notizen} onChange={(e) => setForm({ ...form, notizen: e.target.value })} />
            </div>
            <div className="form-actions">
              <button className="btn" type="submit">
                Anlegen
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        {gefiltert.length === 0 ? (
          <p className="empty">Keine Völker gefunden.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Standort</th>
                <th>Königin</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {gefiltert.map((v) => (
                <tr key={v.id}>
                  <td>
                    <Link to={`/voelker/${v.id}`}>{v.name}</Link>
                  </td>
                  <td>{v.standort_name ?? '–'}</td>
                  <td>
                    {v.koenigin_jahr ?? '–'} {v.koenigin_rasse ?? ''} {v.koenigin_gezeichnet ? '🔴' : ''}
                  </td>
                  <td>
                    <span className={`badge ${v.status === 'aktiv' ? 'ok' : 'muted'}`}>{v.status}</span>
                  </td>
                  <td>
                    <div className="btn-row">
                      <Link to={`/voelker/${v.id}`} className="btn secondary">
                        Details
                      </Link>
                      <button className="btn danger" onClick={() => remove(v.id)}>
                        Löschen
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
