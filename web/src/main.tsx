import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './Layout';
import './index.css';
import './i18n';

import Dashboard from './pages/Dashboard';
import Machines from './pages/Machines';
import Repairs from './pages/Repairs';
import Plans from './pages/Plans';
import Users from './pages/Users';
import Audit from './pages/Audit';
import Reports from './pages/Reports';

function Login() {
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

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
    }).catch(() => {
      setError('Неверный логин или пароль');
    }).finally(() => {
      setLoading(false);
    });
  };

  return (
    <div style={{ 
      display: 'flex', 
      height: '100vh', 
      alignItems: 'center', 
      justifyContent: 'center',
      backgroundColor: '#f1f5f9',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '380px',
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
        border: '1px solid #e2e8f0',
        overflow: 'hidden'
      }}>
        <div style={{
          backgroundColor: '#714B67',
          padding: '24px 20px',
          textAlign: 'center',
          color: '#ffffff'
        }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700 }}>Ремонт станков</h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', opacity: 0.85 }}>Вход в панель управления</p>
        </div>

        <form onSubmit={handleLogin} style={{ padding: '28px 24px' }}>
          {error && (
            <div style={{
              padding: '10px 14px',
              backgroundColor: '#fee2e2',
              color: '#dc2626',
              borderRadius: '8px',
              fontSize: '13px',
              marginBottom: '16px',
              border: '1px solid #fecaca'
            }}>
              {error}
            </div>
          )}

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>
              Логин
            </label>
            <input 
              type="text"
              placeholder="Введите логин" 
              value={username} 
              onChange={e => setUsername(e.target.value)} 
              required 
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>
              Пароль
            </label>
            <input 
              type="password" 
              placeholder="Введите пароль" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required 
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            style={{
              width: '100%',
              backgroundColor: '#714B67',
              color: '#ffffff',
              border: 'none',
              padding: '12px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 2px 4px rgba(113, 75, 103, 0.3)',
              opacity: loading ? 0.7 : 1,
              transition: 'background-color 0.15s'
            }}
          >
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </form>
      </div>
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
          <Route path="users" element={<Users />} />
          <Route path="audit" element={<Audit />} />
          <Route path="reports" element={<Reports />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
