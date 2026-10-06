import React, { useState, useEffect } from 'react';

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
