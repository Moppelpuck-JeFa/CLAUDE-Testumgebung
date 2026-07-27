import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api/client';
import type { Volk, Durchsicht, Behandlung, Ernte, Arzneimittel } from '../api/types';

type Tab = 'durchsichten' | 'behandlungen' | 'ernten';

const emptyDurchsicht = {
  datum: today(),
  volksstaerke: '',
  brutnest: '',
  koenigin_gesehen: false,
  weiselzellen: false,
  stifte: false,
  larven: false,
  verdeckelte_brut: false,
  futtervorrat: '',
  sanftmut: '',
  krankheiten: '',
  massnahmen: '',
  notizen: '',
};

const emptyBehandlung = {
  datum: today(),
  arzneimittel_id: '',
  indikation: '',
  dosierung: '',
  anwendungsmethode: '',
  menge_verbraucht: '',
  behandelnde_person: '',
  notizen: '',
};

const emptyErnte = { datum: today(), menge_kg: '', sorte: '', notizen: '' };

function today() {
  return new Date().toISOString().slice(0, 10);
}

export function VolkDetail() {
  const { id } = useParams();
  const [volk, setVolk] = useState<Volk | null>(null);
  const [tab, setTab] = useState<Tab>('durchsichten');
  const [durchsichten, setDurchsichten] = useState<Durchsicht[]>([]);
  const [behandlungen, setBehandlungen] = useState<Behandlung[]>([]);
  const [ernten, setErnten] = useState<Ernte[]>([]);
  const [arzneimittel, setArzneimittel] = useState<Arzneimittel[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [durchsichtForm, setDurchsichtForm] = useState(emptyDurchsicht);
  const [behandlungForm, setBehandlungForm] = useState(emptyBehandlung);
  const [ernteForm, setErnteForm] = useState(emptyErnte);

  function load() {
    api.get<Volk>(`/voelker/${id}`).then(setVolk);
    api.get<Durchsicht[]>(`/durchsichten?volk_id=${id}`).then(setDurchsichten);
    api.get<Behandlung[]>(`/behandlungen?volk_id=${id}`).then(setBehandlungen);
    api.get<Ernte[]>(`/ernten?volk_id=${id}`).then(setErnten);
    api.get<Arzneimittel[]>('/arzneimittel').then(setArzneimittel);
  }

  useEffect(load, [id]);

  function switchTab(t: Tab) {
    setTab(t);
    setShowForm(false);
    setError(null);
  }

  async function submitDurchsicht(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api.post('/durchsichten', { ...durchsichtForm, volk_id: Number(id) });
      setDurchsichtForm(emptyDurchsicht);
      setShowForm(false);
      load();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function submitBehandlung(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api.post('/behandlungen', {
        ...behandlungForm,
        volk_id: Number(id),
        arzneimittel_id: behandlungForm.arzneimittel_id ? Number(behandlungForm.arzneimittel_id) : null,
        menge_verbraucht: behandlungForm.menge_verbraucht ? Number(behandlungForm.menge_verbraucht) : null,
      });
      setBehandlungForm(emptyBehandlung);
      setShowForm(false);
      load();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function submitErnte(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api.post('/ernten', {
        ...ernteForm,
        volk_id: Number(id),
        menge_kg: Number(ernteForm.menge_kg),
      });
      setErnteForm(emptyErnte);
      setShowForm(false);
      load();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function removeDurchsicht(delId: number) {
    if (!confirm('Durchsicht löschen?')) return;
    await api.del(`/durchsichten/${delId}`);
    load();
  }
  async function removeBehandlung(delId: number) {
    if (!confirm('Behandlung löschen?')) return;
    await api.del(`/behandlungen/${delId}`);
    load();
  }
  async function removeErnte(delId: number) {
    if (!confirm('Ernte löschen?')) return;
    await api.del(`/ernten/${delId}`);
    load();
  }

  if (!volk) return <p className="muted-text">Lade Volk...</p>;

  return (
    <div>
      <div className="breadcrumb">
        <Link to="/voelker">← Alle Völker</Link>
      </div>
      <div className="section-header">
        <h2>{volk.name}</h2>
        <span className={`badge ${volk.status === 'aktiv' ? 'ok' : 'muted'}`}>{volk.status}</span>
      </div>

      <div className="card">
        <div className="stat-grid">
          <div>
            <div className="muted-text">Standort</div>
            <strong>{volk.standort_name ?? '–'}</strong>
          </div>
          <div>
            <div className="muted-text">Beutentyp</div>
            <strong>{volk.beutentyp ?? '–'}</strong>
          </div>
          <div>
            <div className="muted-text">Königin</div>
            <strong>
              {volk.koenigin_jahr ?? '–'} {volk.koenigin_rasse ?? ''} {volk.koenigin_gezeichnet ? '🔴 gezeichnet' : ''}
            </strong>
          </div>
        </div>
        {volk.notizen && <p className="muted-text">{volk.notizen}</p>}
      </div>

      <div className="tabs">
        <button className={tab === 'durchsichten' ? 'active' : ''} onClick={() => switchTab('durchsichten')}>
          Durchsichten ({durchsichten.length})
        </button>
        <button className={tab === 'behandlungen' ? 'active' : ''} onClick={() => switchTab('behandlungen')}>
          Behandlungen ({behandlungen.length})
        </button>
        <button className={tab === 'ernten' ? 'active' : ''} onClick={() => switchTab('ernten')}>
          Ernten ({ernten.length})
        </button>
      </div>

      <div className="section-header">
        <span />
        <button className="btn" onClick={() => setShowForm((v) => !v)}>
          {showForm ? 'Abbrechen' : '+ Neuer Eintrag'}
        </button>
      </div>

      {error && <div className="error">{error}</div>}

      {showForm && tab === 'durchsichten' && (
        <div className="card">
          <form className="form-grid" onSubmit={submitDurchsicht}>
            <div className="field">
              <label>Datum *</label>
              <input
                required
                type="date"
                value={durchsichtForm.datum}
                onChange={(e) => setDurchsichtForm({ ...durchsichtForm, datum: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Volksstärke</label>
              <select
                value={durchsichtForm.volksstaerke}
                onChange={(e) => setDurchsichtForm({ ...durchsichtForm, volksstaerke: e.target.value })}
              >
                <option value="">– keine Angabe –</option>
                <option value="stark">stark</option>
                <option value="mittel">mittel</option>
                <option value="schwach">schwach</option>
              </select>
            </div>
            <div className="field">
              <label>Futtervorrat</label>
              <select
                value={durchsichtForm.futtervorrat}
                onChange={(e) => setDurchsichtForm({ ...durchsichtForm, futtervorrat: e.target.value })}
              >
                <option value="">– keine Angabe –</option>
                <option value="sehr gut">sehr gut</option>
                <option value="gut">gut</option>
                <option value="wenig">wenig</option>
                <option value="leer">leer</option>
              </select>
            </div>
            <div className="field">
              <label>Sanftmut</label>
              <select
                value={durchsichtForm.sanftmut}
                onChange={(e) => setDurchsichtForm({ ...durchsichtForm, sanftmut: e.target.value })}
              >
                <option value="">– keine Angabe –</option>
                <option value="ruhig">ruhig</option>
                <option value="normal">normal</option>
                <option value="nervös">nervös</option>
                <option value="bösartig">bösartig</option>
              </select>
            </div>
            <div className="field">
              <label>Brutnest</label>
              <input
                placeholder="z.B. geschlossen, lückig..."
                value={durchsichtForm.brutnest}
                onChange={(e) => setDurchsichtForm({ ...durchsichtForm, brutnest: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Krankheiten / Auffälligkeiten</label>
              <input
                value={durchsichtForm.krankheiten}
                onChange={(e) => setDurchsichtForm({ ...durchsichtForm, krankheiten: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Maßnahmen</label>
              <input
                value={durchsichtForm.massnahmen}
                onChange={(e) => setDurchsichtForm({ ...durchsichtForm, massnahmen: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Notizen</label>
              <input
                value={durchsichtForm.notizen}
                onChange={(e) => setDurchsichtForm({ ...durchsichtForm, notizen: e.target.value })}
              />
            </div>
            <div className="checkbox-row">
              <div className="field checkbox">
                <input
                  type="checkbox"
                  id="kgesehen"
                  checked={durchsichtForm.koenigin_gesehen}
                  onChange={(e) => setDurchsichtForm({ ...durchsichtForm, koenigin_gesehen: e.target.checked })}
                />
                <label htmlFor="kgesehen">Königin gesehen</label>
              </div>
              <div className="field checkbox">
                <input
                  type="checkbox"
                  id="weiselzellen"
                  checked={durchsichtForm.weiselzellen}
                  onChange={(e) => setDurchsichtForm({ ...durchsichtForm, weiselzellen: e.target.checked })}
                />
                <label htmlFor="weiselzellen">Weiselzellen vorhanden</label>
              </div>
              <div className="field checkbox">
                <input
                  type="checkbox"
                  id="stifte"
                  checked={durchsichtForm.stifte}
                  onChange={(e) => setDurchsichtForm({ ...durchsichtForm, stifte: e.target.checked })}
                />
                <label htmlFor="stifte">Stifte</label>
              </div>
              <div className="field checkbox">
                <input
                  type="checkbox"
                  id="larven"
                  checked={durchsichtForm.larven}
                  onChange={(e) => setDurchsichtForm({ ...durchsichtForm, larven: e.target.checked })}
                />
                <label htmlFor="larven">Larven</label>
              </div>
              <div className="field checkbox">
                <input
                  type="checkbox"
                  id="verdeckelteBrut"
                  checked={durchsichtForm.verdeckelte_brut}
                  onChange={(e) => setDurchsichtForm({ ...durchsichtForm, verdeckelte_brut: e.target.checked })}
                />
                <label htmlFor="verdeckelteBrut">Verdeckelte Brut</label>
              </div>
            </div>
            <div className="form-actions">
              <button className="btn" type="submit">
                Speichern
              </button>
            </div>
          </form>
        </div>
      )}

      {showForm && tab === 'behandlungen' && (
        <div className="card">
          <form className="form-grid" onSubmit={submitBehandlung}>
            <div className="field">
              <label>Datum *</label>
              <input
                required
                type="date"
                value={behandlungForm.datum}
                onChange={(e) => setBehandlungForm({ ...behandlungForm, datum: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Arzneimittel</label>
              <select
                value={behandlungForm.arzneimittel_id}
                onChange={(e) => setBehandlungForm({ ...behandlungForm, arzneimittel_id: e.target.value })}
              >
                <option value="">– keins –</option>
                {arzneimittel.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} (Bestand: {a.bestand} {a.einheit})
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Indikation</label>
              <input
                placeholder="z.B. Varroabehandlung"
                value={behandlungForm.indikation}
                onChange={(e) => setBehandlungForm({ ...behandlungForm, indikation: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Dosierung</label>
              <input
                value={behandlungForm.dosierung}
                onChange={(e) => setBehandlungForm({ ...behandlungForm, dosierung: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Anwendungsmethode</label>
              <input
                value={behandlungForm.anwendungsmethode}
                onChange={(e) => setBehandlungForm({ ...behandlungForm, anwendungsmethode: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Verbrauchte Menge</label>
              <input
                type="number"
                step="any"
                value={behandlungForm.menge_verbraucht}
                onChange={(e) => setBehandlungForm({ ...behandlungForm, menge_verbraucht: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Behandelnde Person</label>
              <input
                value={behandlungForm.behandelnde_person}
                onChange={(e) => setBehandlungForm({ ...behandlungForm, behandelnde_person: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Notizen</label>
              <input
                value={behandlungForm.notizen}
                onChange={(e) => setBehandlungForm({ ...behandlungForm, notizen: e.target.value })}
              />
            </div>
            <div className="form-actions">
              <button className="btn" type="submit">
                Speichern
              </button>
            </div>
          </form>
        </div>
      )}

      {showForm && tab === 'ernten' && (
        <div className="card">
          <form className="form-grid" onSubmit={submitErnte}>
            <div className="field">
              <label>Datum *</label>
              <input
                required
                type="date"
                value={ernteForm.datum}
                onChange={(e) => setErnteForm({ ...ernteForm, datum: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Menge (kg) *</label>
              <input
                required
                type="number"
                step="any"
                value={ernteForm.menge_kg}
                onChange={(e) => setErnteForm({ ...ernteForm, menge_kg: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Sorte</label>
              <input value={ernteForm.sorte} onChange={(e) => setErnteForm({ ...ernteForm, sorte: e.target.value })} />
            </div>
            <div className="field">
              <label>Notizen</label>
              <input value={ernteForm.notizen} onChange={(e) => setErnteForm({ ...ernteForm, notizen: e.target.value })} />
            </div>
            <div className="form-actions">
              <button className="btn" type="submit">
                Speichern
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        {tab === 'durchsichten' &&
          (durchsichten.length === 0 ? (
            <p className="empty">Noch keine Durchsichten erfasst.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Datum</th>
                  <th>Stärke</th>
                  <th>Brutnest</th>
                  <th>Königin</th>
                  <th>Krankheiten</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {durchsichten.map((d) => (
                  <tr key={d.id}>
                    <td>{d.datum}</td>
                    <td>{d.volksstaerke ?? '–'}</td>
                    <td>{d.brutnest ?? '–'}</td>
                    <td>{d.koenigin_gesehen ? 'gesehen' : '–'}{d.weiselzellen ? ', Weiselzellen' : ''}</td>
                    <td>{d.krankheiten ?? '–'}</td>
                    <td>
                      <button className="btn danger" onClick={() => removeDurchsicht(d.id)}>
                        Löschen
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ))}

        {tab === 'behandlungen' &&
          (behandlungen.length === 0 ? (
            <p className="empty">Noch keine Behandlungen erfasst.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Datum</th>
                  <th>Mittel</th>
                  <th>Indikation</th>
                  <th>Menge</th>
                  <th>Wartezeit bis</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {behandlungen.map((b) => (
                  <tr key={b.id}>
                    <td>{b.datum}</td>
                    <td>{b.arzneimittel_name ?? '–'}</td>
                    <td>{b.indikation ?? '–'}</td>
                    <td>{b.menge_verbraucht ?? '–'}</td>
                    <td>
                      {b.wartezeit_ende ? (
                        <span className={`badge ${b.wartezeit_ende >= today() ? 'warn' : 'muted'}`}>{b.wartezeit_ende}</span>
                      ) : (
                        '–'
                      )}
                    </td>
                    <td>
                      <button className="btn danger" onClick={() => removeBehandlung(b.id)}>
                        Löschen
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ))}

        {tab === 'ernten' &&
          (ernten.length === 0 ? (
            <p className="empty">Noch keine Ernten erfasst.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Datum</th>
                  <th>Menge</th>
                  <th>Sorte</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {ernten.map((e) => (
                  <tr key={e.id}>
                    <td>{e.datum}</td>
                    <td>{e.menge_kg} kg</td>
                    <td>{e.sorte ?? '–'}</td>
                    <td>
                      <button className="btn danger" onClick={() => removeErnte(e.id)}>
                        Löschen
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ))}
      </div>
    </div>
  );
}
