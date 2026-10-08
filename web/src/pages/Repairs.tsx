import React, { useState, useEffect } from 'react';

export default function Repairs() {
  const [repairs, setRepairs] = useState<any[]>([]);
  const [machines, setMachines] = useState<Record<string, string>>({});

  const fetchRepairs = () => {
    const token = localStorage.getItem('token');
    fetch('/api/v1/repairs', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        if (!res.ok) return [];
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) {
          setRepairs(data);
        } else {
          setRepairs([]);
        }
      })
      .catch(err => {
        console.error(err);
        setRepairs([]);
      });
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch('/api/v1/machines', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const mObj: Record<string, string> = {};
          data.forEach(m => { mObj[m.id] = m.code; });
          setMachines(mObj);
        }
      })
      .catch(console.error);

    fetchRepairs();
  }, []);

  return (
    <div className="pg-content">
      <div className="fl" style={{ marginBottom: '16px' }}>
        <b style={{ fontSize: '18px', marginRight: 'auto' }}>История ремонтов</b>
      </div>
      <div className="c tw">
        <table>
          <thead>
            <tr>
              <th>Станок</th>
              <th>Дата</th>
              <th>Тип</th>
              <th>Описание</th>
              <th>Бригада</th>
              <th>Статус</th>
            </tr>
          </thead>
          <tbody>
            {repairs.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', color: '#999', padding: '24px' }}>
                  Ремонтов пока нет
                </td>
              </tr>
            ) : (
              repairs.map(r => (
                <tr key={r.id}>
                  <td><b>{machines[r.machine_id] || r.machine_id}</b></td>
                  <td>{r.repair_date ? new Date(r.repair_date).toLocaleDateString() : '-'}</td>
                  <td>{r.type}</td>
                  <td>{r.description || r.title || '-'}</td>
                  <td>{r.crew || '-'}</td>
                  <td><span className="tag g">{r.status || 'Завершено'}</span></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
