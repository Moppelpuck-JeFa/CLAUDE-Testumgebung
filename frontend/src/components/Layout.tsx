import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="layout">
      <aside className="sidebar">
        <h1>🐝 Meine Imkerei</h1>
        <nav>
          <NavLink to="/" end>
            Dashboard
          </NavLink>
          <NavLink to="/standorte">Standorte</NavLink>
          <NavLink to="/voelker">Bienenvölker</NavLink>
          <NavLink to="/arzneimittel">Arzneimittel-Bestandsbuch</NavLink>
          <NavLink to="/benutzer">Benutzer</NavLink>
        </nav>
        <div className="sidebar-user">
          <div className="sidebar-user-name">{user?.name || user?.username}</div>
          <button className="btn secondary" onClick={logout}>
            Abmelden
          </button>
        </div>
      </aside>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
