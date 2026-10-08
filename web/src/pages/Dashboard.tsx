import React, { useState, useEffect } from 'react';

interface MachineItem {
  id: string;
  code: string;
  name: string;
  status: string;
  last_zaprafka_end?: string | null;
  zaprafka_interval_months?: number;
}

export default function Dashboard() {
  const [machines, setMachines] = useState<MachineItem[]>([]);
  const [repairs, setRepairs] = useState<any[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedMachine, setSelectedMachine] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    setLoading(true);

    Promise.all([
      fetch('/api/v1/machines?page_size=100', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.ok ? r.json() : []),
      fetch('/api/v1/repairs', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.ok ? r.json() : [])
    ]).then(([machinesData, repairsData]) => {
      if (Array.isArray(machinesData)) setMachines(machinesData);
      if (Array.isArray(repairsData)) setRepairs(repairsData);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const currentYear = new Date().getFullYear();
  const now = new Date();

  // Calculate zaprafka metrics and items
  const zaprafkaItems = machines.map(m => {
    const intervalMonths = m.zaprafka_interval_months || 60;
    const intervalYears = Math.round(intervalMonths / 12);
    let nextDate: Date | null = null;
    let nextDateStr = 'Не указана';
    let isThisYear = false;
    let isOverdue = false;
    let remainingText = 'Нет данных';

    if (m.last_zaprafka_end) {
      const last = new Date(m.last_zaprafka_end);
      nextDate = new Date(last);
      nextDate.setFullYear(last.getFullYear() + intervalYears);
      nextDateStr = nextDate.toLocaleDateString();

      const diffMs = nextDate.getTime() - now.getTime();
      const diffMonths = Math.round(diffMs / (1000 * 60 * 60 * 24 * 30.4));

      if (diffMs < 0) {
        isOverdue = true;
        remainingText = 'Просрочено';
      } else if (nextDate.getFullYear() === currentYear) {
        isThisYear = true;
        remainingText = diffMonths <= 1 ? 'Менее месяца' : `${diffMonths} мес.`;
      } else {
        const remainingYears = nextDate.getFullYear() - currentYear;
        remainingText = `Через ${remainingYears} г.`;
      }
    }

    const inProgress = m.status === 'ZAPRAFKA';

    return {
      machine: m,
      lastDateStr: m.last_zaprafka_end ? new Date(m.last_zaprafka_end).toLocaleDateString() : 'Не указана',
      intervalYears,
      nextDate,
      nextDateStr,
      isThisYear,
      isOverdue,
      remainingText,
      inProgress,
      // Target for dashboard display: currently in zaprafka, or due this year, or overdue!
      showOnDashboard: inProgress || isThisYear || isOverdue
    };
  });

  const inProgressCount = zaprafkaItems.filter(i => i.inProgress).length;
  const thisYearCount = zaprafkaItems.filter(i => i.isThisYear && !i.inProgress).length;
  const overdueCount = zaprafkaItems.filter(i => i.isOverdue && !i.inProgress).length;

  // Filter dashboard table by selected machine if any
  const dashboardTableItems = zaprafkaItems
    .filter(i => i.showOnDashboard)
    .filter(i => !selectedMachine || i.machine.id === selectedMachine);

  return (
    <div style={{ padding: '24px', fontFamily: 'inherit' }}>
      {/* Header Bar */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        marginBottom: '20px', 
        flexWrap: 'wrap', 
        gap: '12px' 
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: '#1e293b' }}>
            Дашборд
          </h2>
          <span style={{ fontSize: '13px', color: '#64748b' }}>
            Обзор состояния станков и графиков обслуживания
          </span>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input 
            type="date" 
            value={startDate} 
            onChange={(e) => setStartDate(e.target.value)} 
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '13px',
              backgroundColor: '#ffffff',
              outline: 'none'
            }}
          />
          <span style={{ color: '#94a3b8' }}>—</span>
          <input 
            type="date" 
            value={endDate} 
            onChange={(e) => setEndDate(e.target.value)} 
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '13px',
              backgroundColor: '#ffffff',
              outline: 'none'
            }}
          />
          
          <select 
            value={selectedMachine} 
            onChange={(e) => setSelectedMachine(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '13px',
              backgroundColor: '#ffffff',
              outline: 'none',
              maxWidth: '220px'
            }}
          >
            <option value="">Все станки ({machines.length})</option>
            {machines.map(m => (
              <option key={m.id} value={m.id}>{m.code} - {m.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Cards (Odoo style) */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
        gap: '16px', 
        marginBottom: '24px' 
      }}>
        {/* Card 1: Total Machines */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          padding: '20px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
        }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
            Всего станков
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: '#0f172a', marginTop: '6px' }}>
            {machines.length}
          </div>
          <div style={{ fontSize: '12px', color: '#16a34a', marginTop: '4px', fontWeight: 500 }}>
            Активных: {machines.filter(m => m.status === 'ACTIVE').length}
          </div>
        </div>

        {/* Card 2: Заправок в процессе */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          padding: '20px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
        }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#b45309', textTransform: 'uppercase' }}>
            Заправок в процессе
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: '#d97706', marginTop: '6px' }}>
            {inProgressCount}
          </div>
          <div style={{ fontSize: '12px', color: '#78350f', marginTop: '4px' }}>
            Станков на заправке основы
          </div>
        </div>

        {/* Card 3: К заправке в этом году */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          padding: '20px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
        }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#714B67', textTransform: 'uppercase' }}>
            К заправке в {currentYear} г.
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: '#714B67', marginTop: '6px' }}>
            {thisYearCount}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
            Плановые сроки подходят в этом году
          </div>
        </div>

        {/* Card 4: Просрочено */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          padding: '20px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
        }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#dc2626', textTransform: 'uppercase' }}>
            Просрочено
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: '#ef4444', marginTop: '6px' }}>
            {overdueCount}
          </div>
          <div style={{ fontSize: '12px', color: '#991b1b', marginTop: '4px' }}>
            Сроки заправки истекли
          </div>
        </div>
      </div>

      {/* Main Focus: Zaprafka Table (As requested: shows machines due this year and in progress) */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)',
        border: '1px solid #e2e8f0',
        overflow: 'hidden',
        marginBottom: '24px'
      }}>
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#ffffff'
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#1e293b' }}>
              Станки к заправке в {currentYear} году и текущие заправки
            </h3>
            <span style={{ fontSize: '13px', color: '#64748b' }}>
              Автоматический расчет на основе даты последней заправки и периодичности
            </span>
          </div>

          <span style={{
            fontSize: '12px',
            fontWeight: 600,
            padding: '4px 10px',
            borderRadius: '20px',
            backgroundColor: '#f1f5f9',
            color: '#475569'
          }}>
            В фокусе: {dashboardTableItems.length}
          </span>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <th style={{ padding: '14px 20px', fontWeight: 600 }}>Станок</th>
              <th style={{ padding: '14px 20px', fontWeight: 600 }}>Наименование</th>
              <th style={{ padding: '14px 20px', fontWeight: 600 }}>Последняя заправка</th>
              <th style={{ padding: '14px 20px', fontWeight: 600 }}>Следующая плановая</th>
              <th style={{ padding: '14px 20px', fontWeight: 600 }}>Осталось времени</th>
              <th style={{ padding: '14px 20px', fontWeight: 600, textAlign: 'right' }}>Статус</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                  Yuklanmoqda...
                </td>
              </tr>
            ) : dashboardTableItems.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: '#94a3b8' }}>
                  Нет станков, требующих заправки в {currentYear} году или находящихся в процессе заправки.
                </td>
              </tr>
            ) : (
              dashboardTableItems.map((item, idx) => (
                <tr 
                  key={item.machine.id}
                  style={{ 
                    borderBottom: idx === dashboardTableItems.length - 1 ? 'none' : '1px solid #f1f5f9',
                    backgroundColor: item.inProgress ? '#fffbeb' : '#ffffff',
                    transition: 'background-color 0.15s'
                  }}
                >
                  <td style={{ padding: '14px 20px', fontWeight: 700, color: '#0f172a' }}>
                    {item.machine.code}
                  </td>
                  <td style={{ padding: '14px 20px', color: '#334155' }}>
                    {item.machine.name}
                  </td>
                  <td style={{ padding: '14px 20px', color: '#475569' }}>
                    {item.lastDateStr}
                  </td>
                  <td style={{ padding: '14px 20px', fontWeight: 600, color: item.isOverdue ? '#dc2626' : item.isThisYear ? '#b45309' : '#0f172a' }}>
                    {item.nextDateStr}
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 600,
                      backgroundColor: item.isOverdue ? '#fee2e2' : item.isThisYear ? '#fef3c7' : '#f1f5f9',
                      color: item.isOverdue ? '#dc2626' : item.isThisYear ? '#b45309' : '#475569'
                    }}>
                      {item.remainingText}
                    </span>
                  </td>
                  <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 700,
                      backgroundColor: item.inProgress ? '#fef3c7' : item.isOverdue ? '#fee2e2' : '#e0e7ff',
                      color: item.inProgress ? '#b45309' : item.isOverdue ? '#b91c1c' : '#3730a3'
                    }}>
                      {item.inProgress ? 'ИДЕТ ЗАПРАВКА' : item.isOverdue ? 'ПРОСРОЧЕНО' : 'К ЗАПРАВКЕ'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Repairs Quick Stats */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        padding: '20px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#1e293b' }}>
            Недавняя активность по ремонтам
          </h3>
          <span style={{ fontSize: '13px', color: '#64748b' }}>
            Всего выполненных ремонтов: {repairs.length}
          </span>
        </div>

        {repairs.length === 0 ? (
          <div style={{ color: '#94a3b8', fontSize: '14px', textAlign: 'center', padding: '20px' }}>
            Ремонтов пока нет
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '200px', backgroundColor: '#f8fafc', padding: '14px', borderRadius: '8px' }}>
              <div style={{ fontSize: '12px', color: '#64748b' }}>Аварийных ремонтов</div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#ef4444', marginTop: '4px' }}>
                {repairs.filter(r => r.type === 'АВАРИЙНЫЙ').length}
              </div>
            </div>
            <div style={{ flex: 1, minWidth: '200px', backgroundColor: '#f8fafc', padding: '14px', borderRadius: '8px' }}>
              <div style={{ fontSize: '12px', color: '#64748b' }}>Текущих ремонтов</div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#3b82f6', marginTop: '4px' }}>
                {repairs.filter(r => r.type === 'ТЕКУЩИЙ').length}
              </div>
            </div>
            <div style={{ flex: 1, minWidth: '200px', backgroundColor: '#f8fafc', padding: '14px', borderRadius: '8px' }}>
              <div style={{ fontSize: '12px', color: '#64748b' }}>Заправок</div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#d97706', marginTop: '4px' }}>
                {repairs.filter(r => r.type === 'ЗАПРАВКА').length}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
