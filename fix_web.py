import os

MACHINES_TSX = """import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export default function Machines() {
  const { t } = useTranslation();
  const [machines, setMachines] = useState<any[]>([]);

  const fetchMachines = () => {
    const token = localStorage.getItem('token');
    fetch('/api/v1/machines', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json()).then(setMachines).catch(console.error);
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

USERS_TSX = """import React, { useState, useEffect } from 'react';

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
"""

PLANS_TSX = """import React, { useState, useEffect } from 'react';

export default function Plans() {
  const [plans, setPlans] = useState<any[]>([]);

  const fetchPlans = () => {
    const token = localStorage.getItem('token');
    fetch('/api/v1/plans', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json()).then(setPlans).catch(console.error);
  };

  useEffect(() => { fetchPlans(); }, []);

  return (
    <div className="pg-content">
      <div className="fl">
        <b style={{ fontSize: '18px', marginRight: 'auto' }}>Планы ППР</b>
      </div>
      <div className="c tw">
        <table>
          <thead>
            <tr>
              <th>Станок (ID)</th>
              <th>Тип</th>
              <th>Дата</th>
              <th>Статус</th>
            </tr>
          </thead>
          <tbody>
            {plans.map(p => (
              <tr key={p.id}>
                <td>{p.machine_id}</td>
                <td>{p.type}</td>
                <td>{new Date(p.plan_date).toLocaleDateString()}</td>
                <td><span className="tag y">{p.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
"""

REPAIRS_TSX = """import React, { useState, useEffect } from 'react';

export default function Repairs() {
  const [repairs, setRepairs] = useState<any[]>([]);

  const fetchRepairs = () => {
    const token = localStorage.getItem('token');
    fetch('/api/v1/repairs', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json()).then(setRepairs).catch(console.error);
  };

  useEffect(() => { fetchRepairs(); }, []);

  return (
    <div className="pg-content">
      <div className="fl">
        <b style={{ fontSize: '18px', marginRight: 'auto' }}>История ремонтов</b>
      </div>
      <div className="c tw">
        <table>
          <thead>
            <tr>
              <th>Станок (ID)</th>
              <th>Дата</th>
              <th>Тип</th>
              <th>Описание</th>
              <th>Статус</th>
            </tr>
          </thead>
          <tbody>
            {repairs.map(r => (
              <tr key={r.id}>
                <td>{r.machine_id}</td>
                <td>{new Date(r.repair_date).toLocaleDateString()}</td>
                <td>{r.type}</td>
                <td>{r.description}</td>
                <td><span className="tag g">{r.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
"""

TEMPLATES_TSX = """import React, { useState, useEffect } from 'react';

export default function Templates() {
  const [templates, setTemplates] = useState<any[]>([]);

  const fetchTemplates = () => {
    const token = localStorage.getItem('token');
    fetch('/api/v1/templates', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json()).then(setTemplates).catch(console.error);
  };

  useEffect(() => { fetchTemplates(); }, []);

  const handleAdd = () => {
    const name = prompt('Название шаблона:');
    if (!name) return;
    const type = prompt('Тип (REPAIR или ZAPRAFKA):', 'REPAIR');
    
    const token = localStorage.getItem('token');
    fetch('/api/v1/templates', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, type })
    }).then(() => fetchTemplates());
  };

  const handleDelete = (id: string) => {
    if (!confirm('Вы уверены?')) return;
    const token = localStorage.getItem('token');
    fetch(`/api/v1/templates/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
      .then(() => fetchTemplates());
  };

  return (
    <div className="pg-content">
      <div className="fl">
        <b style={{ fontSize: '18px', marginRight: 'auto' }}>Шаблоны</b>
        <button className="btn p" onClick={handleAdd}>Добавить</button>
      </div>
      <div className="c tw">
        <table>
          <thead>
            <tr>
              <th>Название</th>
              <th>Тип</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {templates.map(t => (
              <tr key={t.id}>
                <td>{t.name}</td>
                <td>{t.type}</td>
                <td>
                  <button className="btn s" onClick={() => handleDelete(t.id)}>Удалить</button>
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

os.makedirs('web/src/pages', exist_ok=True)
write_file('web/src/pages/Machines.tsx', MACHINES_TSX)
write_file('web/src/pages/Users.tsx', USERS_TSX)
write_file('web/src/pages/Plans.tsx', PLANS_TSX)
write_file('web/src/pages/Repairs.tsx', REPAIRS_TSX)
write_file('web/src/pages/Templates.tsx', TEMPLATES_TSX)
