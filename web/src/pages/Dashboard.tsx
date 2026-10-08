import React, { useState, useEffect } from 'react';

export default function Dashboard() {
  const [machines, setMachines] = useState<any[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedMachine, setSelectedMachine] = useState('');

  // Stanoklarni bazadan yuklash
  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch('/api/v1/machines?page_size=100', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setMachines(data);
      })
      .catch(console.error);
  }, []);

  return (
    <div className="pg-content">
      {/* Yuqori qism (Qizil quti bilan ishlash) */}
      <div className="fl" style={{ marginBottom: '20px' }}>
        <b style={{ fontSize: '18px', marginRight: 'auto' }}>Дашборд</b>
        
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <input 
            type="date" 
            className="in" 
            value={startDate} 
            onChange={(e) => setStartDate(e.target.value)} 
          />
          <span> - </span>
          <input 
            type="date" 
            className="in" 
            value={endDate} 
            onChange={(e) => setEndDate(e.target.value)} 
          />
          
          <select 
            className="in" 
            value={selectedMachine} 
            onChange={(e) => setSelectedMachine(e.target.value)}
          >
            <option value="">Все станки</option>
            {machines.map(m => (
              <option key={m.id} value={m.id}>{m.code} - {m.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Asosiy bloklar (Sariq qutilar - tozalangan) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        
        {/* Chap blok */}
        <div style={{ border: '1px solid var(--bd)', padding: '15px', borderRadius: '8px', backgroundColor: 'var(--card)' }}>
          <h3>Статистика ремонтов</h3>
          <div style={{ display: 'flex', gap: '20px', marginTop: '10px' }}>
             <div>
                <p style={{ color: '#666', margin: 0 }}>Ремонтов</p>
                <b style={{ fontSize: '24px' }}>0</b>
             </div>
             <div>
                <p style={{ color: '#666', margin: 0 }}>Расходы, сум</p>
                <b style={{ fontSize: '24px' }}>0</b>
             </div>
          </div>
          
          <h4 style={{ marginTop: '20px' }}>Расходы по месяцам</h4>
          <div style={{ height: '150px', backgroundColor: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', borderRadius: '5px' }}>
            Данных пока нет
          </div>
        </div>

        {/* O'ng blok */}
        <div style={{ border: '1px solid var(--bd)', padding: '15px', borderRadius: '8px', backgroundColor: 'var(--card)' }}>
          <h3>Детали и запчасти</h3>
          <p style={{ color: '#666' }}>Новые и восстановленные</p>
          <div style={{ height: '20px', backgroundColor: 'var(--bg)', borderRadius: '10px', marginBottom: '20px' }}></div>
          
          <h4>Топ-5 заменяемых деталей</h4>
          <p style={{ color: '#999' }}>Данных пока нет</p>
        </div>
        
      </div>

      {/* Pastki jadval (Sariq quti - tozalangan) */}
      <div style={{ border: '1px solid var(--bd)', padding: '15px', borderRadius: '8px', backgroundColor: 'var(--card)', marginTop: '20px' }}>
        <h3>Сроки заправки</h3>
        <table style={{ width: '100%', textAlign: 'left', marginTop: '10px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--bd)' }}>
              <th style={{ padding: '8px 0' }}>Станок</th>
              <th>Последняя</th>
              <th>Следующая</th>
              <th>Осталось</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={4} style={{ textAlign: 'center', color: '#999', padding: '20px' }}>
                Данных пока нет
              </td>
            </tr>
          </tbody>
        </table>
      </div>

    </div>
  );
}
