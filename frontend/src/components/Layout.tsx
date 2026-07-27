import { NavLink, Outlet } from 'react-router-dom';

export function Layout() {
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
        </nav>
      </aside>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
