import React, { useState, useEffect } from 'react';

export default function Users() {
  const [users, setUsers] = useState<any[]>([]);

  const fetchUsers = () => {
    const token = localStorage.getItem('token');
    fetch('/api/v1/users', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json()).then(setUsers).catch(console.error);
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleAdd = () => {
    const username = prompt('Логин:');
    if (!username) return;
    const full_name = prompt('Ф.И.О.:');
    const password = prompt('Пароль:');
    const role = prompt('Роль (ADMIN или USER):', 'USER');
    
    const token = localStorage.getItem('token');
    fetch('/api/v1/users', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, full_name, password, role })
    }).then(() => fetchUsers());
  };

  const handleDelete = (id: string) => {
    if (!confirm('Вы уверены?')) return;
    const token = localStorage.getItem('token');
    fetch(`/api/v1/users/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
      .then(() => fetchUsers());
  };

  return (
    <div className="pg-content">
      <div className="fl">
        <b style={{ fontSize: '18px', marginRight: 'auto' }}>Пользователи</b>
        <button className="btn p" onClick={handleAdd}>Добавить</button>
      </div>
      <div className="c tw">
        <table>
          <thead>
            <tr>
              <th>Пользователь (Ф.И.О)</th>
              <th>Логин</th>
              <th>Роль</th>
              <th>Статус</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td>{u.full_name}</td>
                <td>{u.username}</td>
                <td><span className="tag b">{u.role}</span></td>
                <td><span className="tag g">{u.is_active ? 'Активен' : 'Заблокирован'}</span></td>
                <td>
                  <button className="btn s" onClick={() => handleDelete(u.id)}>Удалить</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
