import React, { useState, useEffect } from 'react';

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
