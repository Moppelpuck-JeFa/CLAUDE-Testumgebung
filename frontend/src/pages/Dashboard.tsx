import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import type { Standort, Volk, Behandlung, Ernte, Arzneimittel } from '../api/types';

export function Dashboard() {
  const [standorte, setStandorte] = useState<Standort[]>([]);
  const [voelker, setVoelker] = useState<Volk[]>([]);
  const [behandlungen, setBehandlungen] = useState<Behandlung[]>([]);
  const [ernten, setErnten] = useState<Ernte[]>([]);
  const [arzneimittel, setArzneimittel] = useState<Arzneimittel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<Standort[]>('/standorte'),
      api.get<Volk[]>('/voelker'),
      api.get<Behandlung[]>('/behandlungen'),
      api.get<Ernte[]>('/ernten'),
      api.get<Arzneimittel[]>('/arzneimittel'),
    ]).then(([s, v, b, e, a]) => {
      setStandorte(s);
      setVoelker(v);
      setBehandlungen(b);
      setErnten(e);
      setArzneimittel(a);
      setLoading(false);
    });
  }, []);

  if (loading) return <p className="muted-text">Lade Daten...</p>;

  const today = new Date().toISOString().slice(0, 10);
  const aktiveVoelker = voelker.filter((v) => v.status === 'aktiv');
  const laufendeWartezeiten = behandlungen.filter((b) => b.wartezeit_ende && b.wartezeit_ende >= today);
  const jahrEsMenge = ernten
    .filter((e) => e.datum.startsWith(String(new Date().getFullYear())))
    .reduce((sum, e) => sum + e.menge_kg, 0);
  const baldAblaufend = arzneimittel.filter(
    (a) => a.verfallsdatum && a.verfallsdatum <= addDays(today, 60)
  );

  return (
    <div>
      <h2>Dashboard</h2>
      <div className="stat-grid">
        <div className="stat-card">
          <div className="value">{standorte.length}</div>
          <div className="label">Standorte</div>
        </div>
        <div className="stat-card">
          <div className="value">{aktiveVoelker.length}</div>
          <div className="label">Aktive Völker</div>
        </div>
        <div className="stat-card">
          <div className="value">{jahrEsMenge.toFixed(1)} kg</div>
          <div className="label">Honig {new Date().getFullYear()}</div>
        </div>
        <div className="stat-card">
          <div className="value">{laufendeWartezeiten.length}</div>
          <div className="label">Laufende Wartezeiten</div>
        </div>
      </div>

      {laufendeWartezeiten.length > 0 && (
        <div className="card">
          <div className="section-header">
            <strong>⏳ Laufende Wartezeiten nach Behandlung</strong>
          </div>
          <table>
            <thead>
              <tr>
                <th>Volk</th>
                <th>Mittel</th>
                <th>Behandelt am</th>
                <th>Wartezeit bis</th>
              </tr>
            </thead>
            <tbody>
              {laufendeWartezeiten.map((b) => (
                <tr key={b.id}>
                  <td>
                    <Link to={`/voelker/${b.volk_id}`}>{b.volk_name ?? `Volk #${b.volk_id}`}</Link>
                  </td>
                  <td>{b.arzneimittel_name ?? '–'}</td>
                  <td>{b.datum}</td>
                  <td>
                    <span className="badge warn">{b.wartezeit_ende}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {baldAblaufend.length > 0 && (
        <div className="card">
          <div className="section-header">
            <strong>⚠️ Arzneimittel mit bald ablaufendem Verfallsdatum</strong>
          </div>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Charge</th>
                <th>Bestand</th>
                <th>Verfällt am</th>
              </tr>
            </thead>
            <tbody>
              {baldAblaufend.map((a) => (
                <tr key={a.id}>
                  <td>{a.name}</td>
                  <td>{a.chargennummer ?? '–'}</td>
                  <td>{a.bestand} {a.einheit}</td>
                  <td>
                    <span className="badge warn">{a.verfallsdatum}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="card">
        <div className="section-header">
          <strong>Letzte Ernten</strong>
          <Link to="/voelker" className="btn secondary">
            Zu den Völkern
          </Link>
        </div>
        {ernten.length === 0 ? (
          <p className="empty">Noch keine Ernten erfasst.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Datum</th>
                <th>Volk / Standort</th>
                <th>Menge</th>
                <th>Sorte</th>
              </tr>
            </thead>
            <tbody>
              {ernten.slice(0, 5).map((e) => (
                <tr key={e.id}>
                  <td>{e.datum}</td>
                  <td>{e.volk_name ?? e.standort_name ?? '–'}</td>
                  <td>{e.menge_kg} kg</td>
                  <td>{e.sorte ?? '–'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function addDays(dateStr: string, days: number) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}
