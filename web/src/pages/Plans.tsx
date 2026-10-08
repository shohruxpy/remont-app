import React, { useState, useEffect } from 'react';

interface PlanItem {
  id: string;
  machine_id: string;
  type: string;
  plan_date: string;
  description?: string | null;
  status: string;
}

interface MachineItem {
  id: string;
  code: string;
  name: string;
  status: string;
  last_zaprafka_end?: string | null;
  zaprafka_interval_months?: number;
}

export default function Plans() {
  const [activeTab, setActiveTab] = useState<'zaprafka' | 'plans'>('zaprafka');
  const [plans, setPlans] = useState<PlanItem[]>([]);
  const [machines, setMachines] = useState<MachineItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  // Modal State for adding a Plan
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    machine_id: '',
    plan_date: new Date().toISOString().split('T')[0],
    type: 'ППР',
    description: '',
  });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = () => {
    const token = localStorage.getItem('token');
    setLoading(true);

    Promise.all([
      fetch('/api/v1/plans', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.ok ? r.json() : []),
      fetch('/api/v1/machines?page_size=100', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.ok ? r.json() : [])
    ]).then(([plansData, machinesData]) => {
      if (Array.isArray(plansData)) setPlans(plansData);
      if (Array.isArray(machinesData)) setMachines(machinesData);
    }).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = (type = 'ППР') => {
    setFormData({
      machine_id: machines.length > 0 ? machines[0].id : '',
      plan_date: new Date().toISOString().split('T')[0],
      type,
      description: '',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.machine_id) {
      setFormError('Пожалуйста, выберите станок!');
      return;
    }

    setSubmitting(true);
    setFormError('');
    const token = localStorage.getItem('token');

    try {
      const payload = {
        machine_id: formData.machine_id,
        plan_date: `${formData.plan_date}T00:00:00`,
        type: formData.type,
        description: formData.description,
      };

      const res = await fetch('/api/v1/plans', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        let errMsg = 'Ошибка при создании плана';
        try {
          const err = await res.json();
          errMsg = err.detail || errMsg;
        } catch {
          const text = await res.text();
          errMsg = text || errMsg;
        }
        throw new Error(errMsg);
      }

      handleCloseModal();
      fetchData();
    } catch (err: any) {
      setFormError(err.message || 'Ошибка при сохранении');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleZaprafkaStatus = async (machine: MachineItem) => {
    const token = localStorage.getItem('token');
    const newStatus = machine.status === 'ZAPRAFKA' ? 'ACTIVE' : 'ZAPRAFKA';
    const confirmMsg = machine.status === 'ZAPRAFKA'
      ? `Завершить заправку для станка ${machine.code}? Дата последней заправки обновится на сегодня.`
      : `Перевести станок ${machine.code} в статус 'ИДЕТ ЗАПРАВКА'?`;
    
    if (!window.confirm(confirmMsg)) return;

    const payload: any = { status: newStatus };
    if (newStatus === 'ACTIVE') {
      // Completed zaprafka: update last_zaprafka_end to now
      payload.last_zaprafka_end = `${new Date().toISOString().split('T')[0]}T00:00:00`;
    }

    try {
      const res = await fetch(`/api/v1/machines/${machine.id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCompletePlan = async (id: string) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/v1/plans/${id}/complete`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePlan = async (id: string) => {
    if (!window.confirm('Вы действительно хотите удалить эту запись?')) return;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/v1/plans/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const machineMap = machines.reduce((acc, m) => {
    acc[m.id] = m;
    return acc;
  }, {} as Record<string, MachineItem>);

  // Helper to compute next zaprafka date and status
  const currentYear = new Date().getFullYear();
  const zaprafkaList = machines.map(m => {
    const intervalMonths = m.zaprafka_interval_months || 60;
    const intervalYears = Math.round(intervalMonths / 12);
    let nextDate: Date | null = null;
    let nextDateStr = 'Не рассчитано';
    let isThisYear = false;
    let isOverdue = false;
    let remainingText = 'Нет данных';

    if (m.last_zaprafka_end) {
      const last = new Date(m.last_zaprafka_end);
      nextDate = new Date(last);
      nextDate.setFullYear(last.getFullYear() + intervalYears);
      nextDateStr = nextDate.toLocaleDateString();

      const now = new Date();
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

    return {
      machine: m,
      lastDateStr: m.last_zaprafka_end ? new Date(m.last_zaprafka_end).toLocaleDateString() : 'Не указана',
      intervalYears,
      nextDate,
      nextDateStr,
      isThisYear,
      isOverdue,
      remainingText,
      inProgress: m.status === 'ZAPRAFKA'
    };
  });

  const filteredZaprafka = zaprafkaList.filter(item => {
    const q = search.toLowerCase();
    return item.machine.code.toLowerCase().includes(q) || item.machine.name.toLowerCase().includes(q);
  });

  const filteredPlans = plans.filter(p => {
    const m = machineMap[p.machine_id];
    const code = m ? m.code : '';
    const desc = p.description || '';
    const q = search.toLowerCase();
    return code.toLowerCase().includes(q) || desc.toLowerCase().includes(q) || p.type.toLowerCase().includes(q);
  });

  return (
    <div style={{ padding: '24px', fontFamily: 'inherit' }}>
      {/* Top Header bar with Tabs */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        marginBottom: '20px', 
        flexWrap: 'wrap', 
        gap: '12px' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: '#1e293b' }}>
            Планы и заправка
          </h2>

          {/* Odoo style segmented tabs */}
          <div style={{ 
            display: 'inline-flex', 
            backgroundColor: '#e2e8f0', 
            borderRadius: '8px', 
            padding: '3px' 
          }}>
            <button
              onClick={() => setActiveTab('zaprafka')}
              style={{
                backgroundColor: activeTab === 'zaprafka' ? '#ffffff' : 'transparent',
                color: activeTab === 'zaprafka' ? '#714B67' : '#64748b',
                fontWeight: activeTab === 'zaprafka' ? 700 : 500,
                border: 'none',
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '13px',
                cursor: 'pointer',
                boxShadow: activeTab === 'zaprafka' ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.15s'
              }}
            >
              Сроки заправки основы ({machines.length})
            </button>
            <button
              onClick={() => setActiveTab('plans')}
              style={{
                backgroundColor: activeTab === 'plans' ? '#ffffff' : 'transparent',
                color: activeTab === 'plans' ? '#714B67' : '#64748b',
                fontWeight: activeTab === 'plans' ? 700 : 500,
                border: 'none',
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '13px',
                cursor: 'pointer',
                boxShadow: activeTab === 'plans' ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.15s'
              }}
            >
              Планы ППР ({plans.length})
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <input 
            type="text"
            placeholder="Поиск по станку или описанию..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '260px',
              padding: '9px 14px',
              fontSize: '14px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              outline: 'none',
              backgroundColor: '#ffffff',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}
          />

          <button 
            onClick={() => handleOpenModal(activeTab === 'zaprafka' ? 'ЗАПРАВКА' : 'ППР')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#714B67',
              color: '#ffffff',
              border: 'none',
              padding: '9px 18px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(113, 75, 103, 0.25)',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#5c3d54')}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#714B67')}
          >
            <span style={{ fontSize: '18px', lineHeight: 1 }}>+</span> 
            {activeTab === 'zaprafka' ? 'Запланировать заправку' : 'Создать план ППР'}
          </button>
        </div>
      </div>

      {/* TAB 1: ZAPRAFKA SCHEDULE TABLE */}
      {activeTab === 'zaprafka' && (
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)',
          overflow: 'hidden',
          border: '1px solid #e2e8f0'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <th style={{ padding: '14px 20px', fontWeight: 600 }}>Станок (Код)</th>
                <th style={{ padding: '14px 20px', fontWeight: 600 }}>Краткий текст</th>
                <th style={{ padding: '14px 20px', fontWeight: 600 }}>Последняя заправка</th>
                <th style={{ padding: '14px 20px', fontWeight: 600 }}>Интервал</th>
                <th style={{ padding: '14px 20px', fontWeight: 600 }}>Следующая заправка</th>
                <th style={{ padding: '14px 20px', fontWeight: 600 }}>Осталось</th>
                <th style={{ padding: '14px 20px', fontWeight: 600 }}>Текущий статус</th>
                <th style={{ padding: '14px 20px', fontWeight: 600, textAlign: 'right' }}>Действия</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                    Yuklanmoqda...
                  </td>
                </tr>
              ) : filteredZaprafka.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                    Станки не найдены
                  </td>
                </tr>
              ) : (
                filteredZaprafka.map((item, idx) => (
                  <tr 
                    key={item.machine.id}
                    style={{ 
                      borderBottom: idx === filteredZaprafka.length - 1 ? 'none' : '1px solid #f1f5f9',
                      transition: 'background-color 0.15s'
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                    onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
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
                    <td style={{ padding: '14px 20px', color: '#64748b' }}>
                      {item.intervalYears} лет
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
                    <td style={{ padding: '14px 20px' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '3px 10px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 600,
                        backgroundColor: item.inProgress ? '#fef3c7' : item.machine.status === 'ACTIVE' ? '#dcfce7' : '#fee2e2',
                        color: item.inProgress ? '#b45309' : item.machine.status === 'ACTIVE' ? '#15803d' : '#dc2626'
                      }}>
                        {item.inProgress ? 'ИДЕТ ЗАПРАВКА' : item.machine.status || 'ACTIVE'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                      <button
                        onClick={() => handleToggleZaprafkaStatus(item.machine)}
                        style={{
                          backgroundColor: item.inProgress ? '#dcfce7' : '#f1f5f9',
                          color: item.inProgress ? '#15803d' : '#0f172a',
                          border: item.inProgress ? '1px solid #bbf7d0' : '1px solid #cbd5e1',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.15s'
                        }}
                        onMouseOver={(e) => { e.currentTarget.style.backgroundColor = item.inProgress ? '#bbf7d0' : '#e2e8f0'; }}
                        onMouseOut={(e) => { e.currentTarget.style.backgroundColor = item.inProgress ? '#dcfce7' : '#f1f5f9'; }}
                      >
                        {item.inProgress ? '✓ Завершить заправку' : 'Начать заправку'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 2: PLANS PPR TABLE */}
      {activeTab === 'plans' && (
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)',
          overflow: 'hidden',
          border: '1px solid #e2e8f0'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <th style={{ padding: '14px 20px', fontWeight: 600 }}>Станок</th>
                <th style={{ padding: '14px 20px', fontWeight: 600 }}>Тип</th>
                <th style={{ padding: '14px 20px', fontWeight: 600 }}>Запланированная дата</th>
                <th style={{ padding: '14px 20px', fontWeight: 600 }}>Описание / Задача</th>
                <th style={{ padding: '14px 20px', fontWeight: 600 }}>Статус</th>
                <th style={{ padding: '14px 20px', fontWeight: 600, textAlign: 'right' }}>Действия</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                    Yuklanmoqda...
                  </td>
                </tr>
              ) : filteredPlans.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                    Планов ППР пока нет
                  </td>
                </tr>
              ) : (
                filteredPlans.map((p, idx) => {
                  const m = machineMap[p.machine_id];
                  const isDone = p.status === 'DONE';
                  return (
                    <tr 
                      key={p.id}
                      style={{ 
                        borderBottom: idx === filteredPlans.length - 1 ? 'none' : '1px solid #f1f5f9',
                        transition: 'background-color 0.15s'
                      }}
                      onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                      onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
                    >
                      <td style={{ padding: '14px 20px', fontWeight: 600, color: '#0f172a' }}>
                        {m ? m.code : p.machine_id}
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 600,
                          backgroundColor: p.type === 'ЗАПРАВКА' ? '#fef3c7' : '#e0e7ff',
                          color: p.type === 'ЗАПРАВКА' ? '#b45309' : '#3730a3'
                        }}>
                          {p.type}
                        </span>
                      </td>
                      <td style={{ padding: '14px 20px', color: '#475569' }}>
                        {p.plan_date ? new Date(p.plan_date).toLocaleDateString() : '-'}
                      </td>
                      <td style={{ padding: '14px 20px', color: '#334155' }}>
                        {p.description || '-'}
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '3px 10px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: 600,
                          backgroundColor: isDone ? '#dcfce7' : '#fef9c3',
                          color: isDone ? '#15803d' : '#a16207'
                        }}>
                          {isDone ? 'Выполнено' : p.status || 'Запланировано'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '8px' }}>
                          {!isDone && (
                            <button
                              onClick={() => handleCompletePlan(p.id)}
                              title="Отметить как выполненное"
                              style={{
                                backgroundColor: '#ecfdf5',
                                color: '#059669',
                                border: '1px solid #a7f3d0',
                                padding: '6px 12px',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: 500,
                                cursor: 'pointer',
                                transition: 'all 0.15s'
                              }}
                              onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#d1fae5'; }}
                              onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#ecfdf5'; }}
                            >
                              Выполнено
                            </button>
                          )}
                          <button
                            onClick={() => handleDeletePlan(p.id)}
                            title="Удалить"
                            style={{
                              backgroundColor: '#fff1f2',
                              color: '#e11d48',
                              border: '1px solid #fecdd3',
                              padding: '6px 12px',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: 500,
                              cursor: 'pointer',
                              transition: 'all 0.15s'
                            }}
                            onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#ffe4e6'; }}
                            onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#fff1f2'; }}
                          >
                            Удалить
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modern Modal Window (Odoo style) */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '16px'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '540px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            animation: 'fadeIn 0.15s ease-out'
          }}>
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '20px 24px',
              borderBottom: '1px solid #e2e8f0'
            }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
                {formData.type === 'ЗАПРАВКА' ? 'Запланировать заправку' : 'Создать план ППР'}
              </h3>
              <button
                onClick={handleCloseModal}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '22px',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '4px',
                  lineHeight: 1
                }}
                onMouseOver={(e) => (e.currentTarget.style.color = '#0f172a')}
                onMouseOut={(e) => (e.currentTarget.style.color = '#94a3b8')}
              >
                &times;
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
              {formError && (
                <div style={{
                  padding: '10px 14px',
                  backgroundColor: '#fee2e2',
                  color: '#b91c1c',
                  borderRadius: '8px',
                  fontSize: '13px',
                  marginBottom: '16px',
                  border: '1px solid #fecaca'
                }}>
                  {formError}
                </div>
              )}

              {/* Machine selection */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Станок <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select
                  required
                  value={formData.machine_id}
                  onChange={(e) => setFormData({ ...formData, machine_id: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '14px',
                    outline: 'none',
                    backgroundColor: '#ffffff',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="">-- Выберите станок --</option>
                  {machines.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.code} - {m.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Two columns: Date & Type */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Плановая дата <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.plan_date}
                    onChange={(e) => setFormData({ ...formData, plan_date: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Тип обслуживания
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '14px',
                      outline: 'none',
                      backgroundColor: '#ffffff',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="ЗАПРАВКА">ЗАПРАВКА (Заправка основы)</option>
                    <option value="ППР">ППР (Плановый ремонт)</option>
                    <option value="ОСМОТР">ОСМОТР (Технический осмотр)</option>
                    <option value="ЧИСТКА">ЧИСТКА (Профилактика)</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Описание задачи / Работ
                </label>
                <textarea
                  rows={3}
                  placeholder="Опишите регламентные работы..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    resize: 'vertical'
                  }}
                />
              </div>

              {/* Modal Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  style={{
                    backgroundColor: '#ffffff',
                    color: '#475569',
                    border: '1px solid #cbd5e1',
                    padding: '10px 20px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    backgroundColor: '#714B67',
                    color: '#ffffff',
                    border: 'none',
                    padding: '10px 24px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    boxShadow: '0 2px 4px rgba(113, 75, 103, 0.3)',
                    opacity: submitting ? 0.7 : 1
                  }}
                >
                  {submitting ? 'Сохранение...' : 'Сохранить'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
