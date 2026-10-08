import React, { useState, useEffect } from 'react';

export default function Plans() {
  const [plans, setPlans] = useState<any[]>([]);

  const fetchPlans = () => {
    const token = localStorage.getItem('token');
    fetch('/api/v1/plans', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        if (!res.ok) return [];
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) setPlans(data);
        else setPlans([]);
      })
      .catch(err => {
        console.error(err);
        setPlans([]);
      });
  };

  useEffect(() => { fetchPlans(); }, []);

  return (
    <div className="pg-content">
      <div className="fl" style={{ marginBottom: '16px' }}>
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
            {plans.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', color: '#999', padding: '24px' }}>
                  Планов пока нет
                </td>
              </tr>
            ) : (
              plans.map(p => (
                <tr key={p.id}>
                  <td>{p.machine_id}</td>
                  <td>{p.type}</td>
                  <td>{p.plan_date ? new Date(p.plan_date).toLocaleDateString() : '-'}</td>
                  <td><span className="tag y">{p.status}</span></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
