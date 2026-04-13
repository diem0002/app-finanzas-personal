import { Outlet, NavLink } from 'react-router-dom';
import { Home, Briefcase, PiggyBank, Wallet } from 'lucide-react';
import useStore from '../store/useStore';

export default function Layout() {
  const toggleTheme = useStore((state) => state.toggleTheme);
  const theme = useStore((state) => state.theme);

  return (
    <>
      <div className="app-container" style={{ paddingBottom: '80px' }}>
        {/* Simple Header */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1 className="title" style={{ marginBottom: 0 }}>Mis Finanzas</h1>
          <button onClick={toggleTheme} className="btn-outline" style={{ padding: '0.5rem' }}>
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </header>

        {/* Content Area */}
        <main className="animate-slide-up" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Outlet />
        </main>
      </div>

      {/* Bottom Navigation */}
      <nav style={{
        position: 'fixed',
        bottom: 0, left: 0, right: 0,
        backgroundColor: 'var(--bg-glass)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderTop: '1px solid var(--glass-border)',
        padding: '0.75rem 1rem',
        paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))',
        display: 'flex',
        justifyContent: 'space-around',
        zIndex: 100
      }}>
        <NavItem to="/" icon={<Home size={24} />} label="Inicio" />
        <NavItem to="/trabajos" icon={<Briefcase size={24} />} label="Trabajos" />
        <NavItem to="/ahorros" icon={<PiggyBank size={24} />} label="Ahorros" />
        <NavItem to="/sobrantes" icon={<Wallet size={24} />} label="Sobrantes" />
      </nav>
    </>
  );
}

function NavItem({ to, icon, label }) {
  return (
    <NavLink 
      to={to} 
      style={({ isActive }) => ({
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.25rem',
        textDecoration: 'none',
        color: isActive ? 'var(--primary)' : 'var(--text-muted)',
        transition: 'color 0.2s ease',
        fontSize: '0.75rem',
        fontWeight: isActive ? 600 : 500
      })}
    >
      {icon}
      <span>{label}</span>
    </NavLink>
  );
}
