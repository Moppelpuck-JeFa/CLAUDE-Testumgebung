import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export function Login() {
  const { login, register, setupRequired } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (setupRequired) {
        await register(username, password, name || undefined);
      } else {
        await login(username, password);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>🐝 Meine Imkerei</h1>
        {setupRequired && (
          <p className="muted-text">
            Willkommen! Lege den ersten Benutzer für deine Imkerei-Verwaltung an.
          </p>
        )}
        {error && <div className="error">{error}</div>}
        <form onSubmit={submit}>
          {setupRequired && (
            <div className="field">
              <label>Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
          )}
          <div className="field">
            <label>Benutzername</label>
            <input required autoFocus value={username} onChange={(e) => setUsername(e.target.value)} />
          </div>
          <div className="field">
            <label>Passwort</label>
            <input
              required
              type="password"
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button className="btn" type="submit" disabled={submitting} style={{ width: '100%', marginTop: '0.5rem' }}>
            {setupRequired ? 'Konto anlegen' : 'Anmelden'}
          </button>
        </form>
      </div>
    </div>
  );
}
