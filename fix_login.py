import os

MAIN_TSX = """import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import Layout from './Layout';
import './index.css';
import './i18n';

import Dashboard from './pages/Dashboard';
import Machines from './pages/Machines';
import Repairs from './pages/Repairs';
import Plans from './pages/Plans';
import Templates from './pages/Templates';
import Users from './pages/Users';
import Audit from './pages/Audit';
import Reports from './pages/Reports';

function Login() {
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  
  const handleLogin = (e: any) => {
    e.preventDefault();
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    fetch('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString()
    }).then(res => {
      if (res.ok) return res.json();
      throw new Error('Invalid login');
    }).then(data => {
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('username', username);
      window.location.href = '/';
    }).catch(() => alert('Ошибка входа: Неверный логин или пароль'));
  };

  return (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '20px', border: '1px solid #ccc', borderRadius: '5px' }}>
        <h2>Вход в систему</h2>
        <input placeholder="Логин" value={username} onChange={e => setUsername(e.target.value)} required />
        <input type="password" placeholder="Пароль" value={password} onChange={e => setPassword(e.target.value)} required />
        <button type="submit" className="btn p">Войти</button>
      </form>
    </div>
  );
}

function App() {
  const token = localStorage.getItem('token');
  if (!token && window.location.pathname !== '/login') {
    window.location.href = '/login';
    return null;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="machines" element={<Machines />} />
          <Route path="repairs" element={<Repairs />} />
          <Route path="plans" element={<Plans />} />
          <Route path="templates" element={<Templates />} />
          <Route path="users" element={<Users />} />
          <Route path="audit" element={<Audit />} />
          <Route path="reports" element={<Reports />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
"""

LAYOUT_TSX = """import { Outlet, NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function Layout() {
  const { t } = useTranslation();
  const userName = localStorage.getItem('username') || "Пользователь";
  
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    window.location.href = '/login';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <header style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        padding: '12px 16px', 
        borderBottom: '1px solid var(--bd)',
        backgroundColor: 'var(--card)'
      }}>
        <div className="title" style={{ color: 'var(--pr)' }}>Ремонт станков</div>
        <div>
          <span style={{ marginRight: 16 }}>{userName}</span>
          <button style={{ padding: '4px 8px' }} onClick={handleLogout}>Выйти</button>
        </div>
      </header>
      
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
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
        fontWeight: isActive ? 'bold' : 'display: block'
      })}
    >
      {label}
    </NavLink>
  );
}
"""

MACHINES_TSX = """import React, { useState, useEffect } from 'react';

export default function Machines() {
  const [machines, setMachines] = useState<any[]>([]);

  const fetchMachines = () => {
    const token = localStorage.getItem('token');
    fetch('/api/v1/machines', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
          if (res.status === 401) { window.location.href = '/login'; return []; }
          return res.json();
      })
      .then(data => { if(Array.isArray(data)) setMachines(data); })
      .catch(console.error);
  };

  useEffect(() => { fetchMachines(); }, []);

  const handleAdd = () => {
    const code = prompt('Код станка (например T-01):');
    if (!code) return;
    const name = prompt('Краткий текст (Название):');
    if (!name) return;
    const sap_co_order = prompt('СО Заказ:');
    const sap_cost_center = prompt('Ответственное МВЗ:');
    
    const token = localStorage.getItem('token');
    fetch('/api/v1/machines', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, name, sap_co_order, sap_cost_center })
    }).then(() => fetchMachines());
  };

  const handleDelete = (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить?')) return;
    const token = localStorage.getItem('token');
    fetch(`/api/v1/machines/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
      .then(() => fetchMachines());
  };

  return (
    <div className="pg-content">
      <div className="fl">
        <b style={{ fontSize: '18px', marginRight: 'auto' }}>Станки</b>
        <input className="in" placeholder="Поиск" />
        <button className="btn p" onClick={handleAdd}>Добавить</button>
      </div>
      <div className="c tw">
        <table>
          <thead>
            <tr>
              <th>Станок (Код)</th>
              <th>СО Заказ</th>
              <th>Краткий текст</th>
              <th>Ответственное МВЗ</th>
              <th>Статус</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {machines.map(m => (
              <tr key={m.id}>
                <td>{m.code}</td>
                <td>{m.sap_co_order || ''}</td>
                <td>{m.name}</td>
                <td>{m.sap_cost_center || ''}</td>
                <td><span className="tag b">{m.status}</span></td>
                <td>
                  <button className="btn s" onClick={() => handleDelete(m.id)}>Удалить</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
"""

def write_file(path, content):
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

write_file('web/src/main.tsx', MAIN_TSX)
write_file('web/src/Layout.tsx', LAYOUT_TSX)
write_file('web/src/pages/Machines.tsx', MACHINES_TSX)
