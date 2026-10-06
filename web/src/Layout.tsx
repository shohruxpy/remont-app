import { Outlet, NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function Layout() {
  const { t } = useTranslation();
  const userName = "Иван Иванов"; // stub
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* Top Bar */}
      <header style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        padding: '12px 16px', 
        borderBottom: '1px solid var(--bd)',
        backgroundColor: 'var(--card)'
      }}>
        <div className="title" style={{ color: 'var(--pr)' }}>🧵 {t('appTitle')}</div>
        <div>
          <span style={{ marginRight: 16 }}>{userName}</span>
          <button style={{ padding: '4px 8px' }}>Выйти</button>
        </div>
      </header>
      
      {/* Two Column Layout */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Sidebar */}
        <aside style={{ 
          width: 200, 
          backgroundColor: 'var(--card)', 
          borderRight: '1px solid var(--bd)',
          padding: '16px 0',
          overflowY: 'auto'
        }}>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <NavItem to="/" label={t('sidebar.dashboard')} />
            <NavItem to="/machines" label={t('sidebar.machines')} />
            <NavItem to="/repairs" label={t('sidebar.repairs')} />
            <NavItem to="/plans" label={t('sidebar.plans')} />
            <NavItem to="/templates" label={t('sidebar.templates')} />
            <NavItem to="/users" label={t('sidebar.users')} />
            <NavItem to="/audit" label={t('sidebar.audit')} />
            <NavItem to="/reports" label={t('sidebar.reports')} />
          </nav>
        </aside>
        
        {/* Content */}
        <main style={{ flex: 1, padding: 16, overflowY: 'auto' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function NavItem({ to, label }: { to: string, label: string }) {
  return (
    <NavLink 
      to={to} 
      style={({ isActive }) => ({
        padding: '8px 16px',
        textDecoration: 'none',
        color: isActive ? 'var(--pr)' : 'var(--tx)',
        backgroundColor: isActive ? 'var(--prt)' : 'transparent',
        fontWeight: isActive ? 'bold' : 'normal',
        display: 'block'
      })}
    >
      {label}
    </NavLink>
  );
}
