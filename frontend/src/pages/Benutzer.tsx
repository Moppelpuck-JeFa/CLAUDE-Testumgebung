import { useEffect, useState } from 'react';
import { api } from '../api/client';
import type { User } from '../context/AuthContext';

const empty = { username: '', name: '', password: '' };

export function Benutzer() {
  const [users, setUsers] = useState<User[]>([]);
  const [form, setForm] = useState(empty);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function load() {
    api.get<User[]>('/auth/users').then(setUsers);
  }

  useEffect(load, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api.post('/auth/register', form);
      setForm(empty);
      setShowForm(false);
      load();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <div>
      <div className="section-header">
        <h2>Benutzer</h2>
        <button className="btn" onClick={() => setShowForm((v) => !v)}>
          {showForm ? 'Abbrechen' : '+ Neuer Benutzer'}
        </button>
      </div>
      <p className="muted-text">
        Alle Benutzer teilen sich dieselben Imkerei-Daten (Standorte, Völker, Behandlungen etc.).
      </p>

      {showForm && (
        <div className="card">
          {error && <div className="error">{error}</div>}
          <form className="form-grid" onSubmit={submit}>
            <div className="field">
              <label>Benutzername *</label>
              <input required value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
            </div>
            <div className="field">
              <label>Name</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="field">
              <label>Passwort *</label>
              <input
                required
                type="password"
                minLength={8}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
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
        <table>
          <thead>
            <tr>
              <th>Benutzername</th>
              <th>Name</th>
              <th>Angelegt am</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.username}</td>
                <td>{u.name ?? '–'}</td>
                <td>{u.erstellt_am}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
