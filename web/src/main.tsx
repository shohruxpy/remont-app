import React from 'react';
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
