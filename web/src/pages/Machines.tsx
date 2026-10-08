import React, { useState, useEffect } from 'react';

export default function Machines() {
  const [machines, setMachines] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  const fetchMachines = (searchTerm = '') => {
    const token = localStorage.getItem('token');
    const url = searchTerm
      ? `/api/v1/machines?page_size=100&search=${encodeURIComponent(searchTerm)}`
      : '/api/v1/machines?page_size=100';
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
          if (res.status === 401) { window.location.href = '/login'; return []; }
          return res.json();
      })
      .then(data => { if(Array.isArray(data)) setMachines(data); })
      .catch(console.error);
  };

  useEffect(() => { 
    fetchMachines(search); 
  }, [search]);

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
    }).then(() => fetchMachines(search));
  };

  const handleDelete = (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить?')) return;
    const token = localStorage.getItem('token');
    fetch(`/api/v1/machines/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
      .then(() => fetchMachines(search));
  };

  return (
    <div className="pg-content">
      <div className="fl" style={{ marginBottom: '15px' }}>
        <b style={{ fontSize: '18px', marginRight: '10px' }}>Станки</b>
        <span style={{ color: '#888', marginRight: 'auto', fontSize: '14px', alignSelf: 'center' }}>
          (Всего: {machines.length})
        </span>
        <input 
          className="in" 
          placeholder="Поиск по коду или названию..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: '250px' }}
        />
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
            {machines.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', color: '#888', padding: '20px' }}>
                  Станки не найдены
                </td>
              </tr>
            ) : (
              machines.map(m => (
                <tr key={m.id}>
                  <td><b>{m.code}</b></td>
                  <td>{m.sap_co_order || ''}</td>
                  <td>{m.name}</td>
                  <td>{m.sap_cost_center || ''}</td>
                  <td><span className="tag b">{m.status}</span></td>
                  <td>
                    <button className="btn s" onClick={() => handleDelete(m.id)}>Удалить</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
