import { Outlet, NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function Layout() {
  const { t } = useTranslation();
  const userName = localStorage.getItem('username') || "Администратор";
  
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    window.location.href = '/login';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', fontFamily: 'Segoe UI, Roboto, Helvetica, Arial, sans-serif', backgroundColor: '#f1f5f9' }}>
      {/* Odoo Style Top Navbar */}
      <header style={{ 
        display: 'flex', 
        alignItems: 'center',
        justifyContent: 'space-between', 
        padding: '0 20px', 
        height: '48px',
        backgroundColor: '#714B67',
        color: '#ffffff',
        boxShadow: '0 1px 3px rgba(0,0,0,0.12)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ 
            fontSize: '16px', 
            fontWeight: 700, 
            letterSpacing: '0.02em',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.2)', 
              padding: '3px 8px', 
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 800
            }}>
              ERP
            </span>
            {t('appTitle', 'Ремонт станков')}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255,255,255,0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '13px',
              fontWeight: 700,
              color: '#ffffff'
            }}>
              {userName.charAt(0).toUpperCase()}
            </div>
            <span style={{ fontSize: '13px', fontWeight: 500, color: '#f8fafc' }}>
              {userName}
            </span>
          </div>

          <button 
            onClick={handleLogout}
            style={{ 
              backgroundColor: 'transparent',
              color: '#f8fafc',
              border: '1px solid rgba(255,255,255,0.3)',
              padding: '4px 12px',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.15s'
            }}
            onMouseOver={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)'; }}
            onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
          >
            Выйти
          </button>
        </div>
      </header>
      
      {/* Two Column Layout */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Odoo Style Sidebar */}
        <aside style={{ 
          width: '220px', 
          backgroundColor: '#ffffff', 
          borderRight: '1px solid #e2e8f0',
          padding: '12px 0',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px', padding: '0 8px' }}>
            <NavItem to="/" label={t('sidebar.dashboard', 'Дашборд')} />
            <NavItem to="/machines" label={t('sidebar.machines', 'Станки')} />
            <NavItem to="/repairs" label={t('sidebar.repairs', 'Ремонты и расходы')} />
            <NavItem to="/plans" label={t('sidebar.plans', 'Планы и заправка')} />
            <NavItem to="/warehouse" label="Склад и материалы" />
            <NavItem to="/users" label={t('sidebar.users', 'Пользователи')} />
            <NavItem to="/reports" label={t('sidebar.reports', 'Отчёты (Excel)')} />
          </nav>

          <div style={{ marginTop: 'auto', padding: '16px', borderTop: '1px solid #f1f5f9', fontSize: '11px', color: '#94a3b8' }}>
            Remont v1.0 • Odoo ERP Style
          </div>
        </aside>
        
        {/* Content Area */}
        <main style={{ flex: 1, overflowY: 'auto', backgroundColor: '#f8fafc' }}>
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
        padding: '9px 14px',
        textDecoration: 'none',
        color: isActive ? '#714B67' : '#334155',
        backgroundColor: isActive ? '#f8eff5' : 'transparent',
        fontWeight: isActive ? 600 : 500,
        fontSize: '13px',
        display: 'block',
        borderRadius: '6px',
        borderLeft: isActive ? '3px solid #714B67' : '3px solid transparent',
        transition: 'all 0.15s'
      })}
    >
      {label}
    </NavLink>
  );
}
