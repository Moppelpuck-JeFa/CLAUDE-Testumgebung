import { clearToken, getToken } from './authStore';

// import.meta.env.BASE_URL endet immer mit "/" (z.B. "/" oder "/imkerei/"),
// dadurch funktioniert dieselbe Build-Ausgabe an der Domain-Wurzel wie in
// einem Unterordner, ohne die API-Pfade separat konfigurieren zu müssen.
//
// VITE_API_ENTRY erlaubt zusätzlich, direkt auf api/index.php zu zielen
// (Aufruf z.B. als .../api/index.php/standorte via PATH_INFO) statt auf die
// von .htaccess umgeschriebene "schöne" URL .../api/standorte. Das ist für
// das PHP-Backend auf Shared-Hosting gedacht, bei dem verschachtelte
// .htaccess-Rewrite-Regeln nicht zuverlässig funktionieren. Der Node.js-
// Backend-Standard (Docker/VPS/lokal) bleibt ohne diese Variable unverändert.
const API_ENTRY = import.meta.env.VITE_API_ENTRY || '';
const BASE = `${import.meta.env.BASE_URL}api${API_ENTRY}`;

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  });
  if (res.status === 401) {
    clearToken();
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Anfrage fehlgeschlagen (${res.status})`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, data: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(data) }),
  put: <T>(path: string, data: unknown) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(data) }),
  del: (path: string) => request<void>(path, { method: 'DELETE' }),
};

export async function downloadBackup(): Promise<void> {
  const token = getToken();
  const res = await fetch(`${BASE}/backup`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Backup fehlgeschlagen (${res.status})`);
  }
  const disposition = res.headers.get('Content-Disposition') || '';
  const match = disposition.match(/filename="?([^"]+)"?/);
  const filename = match?.[1] || `imkerei-backup-${new Date().toISOString().slice(0, 10)}.db`;

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function restoreBackup(file: File): Promise<void> {
  const token = getToken();
  const formData = new FormData();
  formData.append('backup', file);
  const res = await fetch(`${BASE}/backup/restore`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Wiederherstellung fehlgeschlagen (${res.status})`);
  }
}
