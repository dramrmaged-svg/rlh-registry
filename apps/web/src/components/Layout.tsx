import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export function Layout() {
  const { user, logout } = useAuth();
  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <h1>RLH SIRT Registry</h1>
        <nav>
          <NavLink to="/patients" className={({ isActive }) => (isActive ? 'active' : '')}>
            Patients
          </NavLink>
        </nav>
        <div className="user-box">
          <div>{user?.firstName} {user?.lastName}</div>
          <div className="muted">{user?.role}</div>
          <button onClick={() => void logout()}>Log out</button>
        </div>
      </aside>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
