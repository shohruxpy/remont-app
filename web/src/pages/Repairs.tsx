import React, { useState, useEffect } from 'react';

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
