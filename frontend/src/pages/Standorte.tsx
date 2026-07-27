import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import type { Standort } from '../api/types';

const empty = { name: '', adresse: '', notizen: '' };

export function Standorte() {
  const [standorte, setStandorte] = useState<Standort[]>([]);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function load() {
    api.get<Standort[]>('/standorte').then(setStandorte);
  }

  useEffect(load, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      if (editingId) {
        await api.put(`/standorte/${editingId}`, form);
      } else {
        await api.post('/standorte', form);
      }
      setForm(empty);
      setEditingId(null);
      setShowForm(false);
      load();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  function edit(s: Standort) {
    setForm({ name: s.name, adresse: s.adresse ?? '', notizen: s.notizen ?? '' });
    setEditingId(s.id);
    setShowForm(true);
  }

  async function remove(id: number) {
    if (!confirm('Standort wirklich löschen? Zugehörige Völker verlieren die Standortzuordnung.')) return;
    await api.del(`/standorte/${id}`);
    load();
  }

  return (
    <div>
      <div className="section-header">
        <h2>Standorte</h2>
        <button
          className="btn"
          onClick={() => {
            setShowForm((v) => !v);
            setEditingId(null);
            setForm(empty);
          }}
        >
          {showForm ? 'Abbrechen' : '+ Neuer Standort'}
        </button>
      </div>

      {showForm && (
        <div className="card">
          {error && <div className="error">{error}</div>}
          <form className="form-grid" onSubmit={submit}>
            <div className="field">
              <label>Name *</label>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="field">
              <label>Adresse</label>
              <input value={form.adresse} onChange={(e) => setForm({ ...form, adresse: e.target.value })} />
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
        {standorte.length === 0 ? (
          <p className="empty">Noch keine Standorte angelegt.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Adresse</th>
                <th>Völker</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {standorte.map((s) => (
                <tr key={s.id}>
                  <td>{s.name}</td>
                  <td>{s.adresse ?? '–'}</td>
                  <td>
                    <Link to={`/voelker?standort=${s.id}`}>{s.anzahl_voelker ?? 0}</Link>
                  </td>
                  <td>
                    <div className="btn-row">
                      <button className="btn secondary" onClick={() => edit(s)}>
                        Bearbeiten
                      </button>
                      <button className="btn danger" onClick={() => remove(s.id)}>
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
