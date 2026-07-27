import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { api } from '../api/client';
import { clearToken, getToken, onUnauthorized, setToken } from '../api/authStore';

export interface User {
  id: number;
  username: string;
  name: string | null;
  erstellt_am: string;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  setupRequired: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string, name?: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [setupRequired, setSetupRequired] = useState(false);

  async function refresh() {
    if (getToken()) {
      try {
        const me = await api.get<User>('/auth/me');
        setUser(me);
        setLoading(false);
        return;
      } catch {
        // Token ungültig/abgelaufen – unten wird der Setup-Status geprüft
      }
    }
    const status = await api
      .get<{ setupRequired: boolean }>('/auth/status')
      .catch(() => ({ setupRequired: false }));
    setSetupRequired(status.setupRequired);
    setUser(null);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
    return onUnauthorized(() => setUser(null));
  }, []);

  async function login(username: string, password: string) {
    const res = await api.post<{ user: User; token: string }>('/auth/login', { username, password });
    setToken(res.token);
    setUser(res.user);
  }

  async function register(username: string, password: string, name?: string) {
    const res = await api.post<{ user: User; token: string }>('/auth/register', { username, password, name });
    setToken(res.token);
    setUser(res.user);
    setSetupRequired(false);
  }

  function logout() {
    clearToken();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, setupRequired, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth muss innerhalb von AuthProvider verwendet werden');
  return ctx;
}
