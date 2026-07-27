import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { downloadBackup, restoreBackup } from '../api/client';
import { useAuth } from '../context/AuthContext';

export function Backup() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [downloading, setDownloading] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  async function handleDownload() {
    setError(null);
    setSuccess(null);
    setDownloading(true);
    try {
      await downloadBackup();
      setSuccess('Backup wurde heruntergeladen.');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setDownloading(false);
    }
  }

  async function handleRestore() {
    if (!selectedFile) return;
    const confirmed = confirm(
      'Achtung: Beim Wiederherstellen werden ALLE aktuellen Daten (Standorte, Völker, Durchsichten, Behandlungen, Ernten, Arzneimittel, Benutzer) durch den Inhalt der Backup-Datei ersetzt. Diese Aktion kann nicht rückgängig gemacht werden. Fortfahren?'
    );
    if (!confirmed) return;

    setError(null);
    setSuccess(null);
    setRestoring(true);
    try {
      await restoreBackup(selectedFile);
      alert('Wiederherstellung erfolgreich. Du wirst jetzt abgemeldet und musst dich neu anmelden.');
      logout();
      navigate('/login', { replace: true });
    } catch (err) {
      setError((err as Error).message);
      setRestoring(false);
    }
  }

  return (
    <div>
      <h2>Backup &amp; Wiederherstellung</h2>

      {error && <div className="error">{error}</div>}
      {success && (
        <div className="card" style={{ borderColor: 'var(--ok)' }}>
          {success}
        </div>
      )}

      <div className="card">
        <div className="section-header">
          <strong>Backup erstellen</strong>
        </div>
        <p className="muted-text">
          Lädt eine vollständige, konsistente Kopie der aktuellen Datenbank herunter (alle Standorte,
          Völker, Durchsichten, Behandlungen, Ernten, Arzneimittel und Benutzerkonten). Bewahre die Datei
          an einem sicheren Ort auf.
        </p>
        <button className="btn" onClick={handleDownload} disabled={downloading}>
          {downloading ? 'Erstelle Backup...' : 'Backup jetzt herunterladen'}
        </button>
      </div>

      <div className="card">
        <div className="section-header">
          <strong>Aus Backup wiederherstellen</strong>
        </div>
        <p className="muted-text">
          Ersetzt alle aktuellen Daten durch den Inhalt einer zuvor heruntergeladenen Backup-Datei. Alle
          angemeldeten Benutzer werden danach abgemeldet.
        </p>
        <div className="btn-row" style={{ alignItems: 'center' }}>
          <input
            ref={fileInputRef}
            type="file"
            accept=".db"
            onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
          />
          <button className="btn danger" onClick={handleRestore} disabled={!selectedFile || restoring}>
            {restoring ? 'Stelle wieder her...' : 'Wiederherstellen'}
          </button>
        </div>
      </div>
    </div>
  );
}
