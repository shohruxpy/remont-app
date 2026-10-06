import React, { useState, useEffect } from 'react';

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
