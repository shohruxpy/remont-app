import React, { useState, useEffect } from 'react';

interface RepairItem {
  id: string;
  machine_id: string;
  repair_date: string;
  type: string;
  title?: string | null;
  description?: string | null;
  crew?: string | null;
  status?: string;
  items?: any[];
}

interface MachineOption {
  id: string;
  code: string;
  name: string;
}

export default function Repairs() {
  const [repairs, setRepairs] = useState<RepairItem[]>([]);
  const [machines, setMachines] = useState<MachineOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    machine_id: '',
    repair_date: new Date().toISOString().split('T')[0],
    type: 'ТЕКУЩИЙ',
    title: '',
    description: '',
    crew: '',
  });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchRepairs = () => {
    const token = localStorage.getItem('token');
    setLoading(true);
    fetch('/api/v1/repairs', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        if (!res.ok) return [];
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) setRepairs(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const fetchMachines = () => {
    const token = localStorage.getItem('token');
    fetch('/api/v1/machines?page_size=100', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setMachines(data);
      })
      .catch(console.error);
  };

  useEffect(() => {
    fetchRepairs();
    fetchMachines();
  }, []);

  const handleOpenModal = () => {
    setFormData({
      machine_id: machines.length > 0 ? machines[0].id : '',
      repair_date: new Date().toISOString().split('T')[0],
      type: 'ТЕКУЩИЙ',
      title: '',
      description: '',
      crew: '',
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
        repair_date: `${formData.repair_date}T00:00:00`,
        type: formData.type,
        title: formData.title || formData.type,
        description: formData.description,
        crew: formData.crew,
        items: []
      };

      const res = await fetch('/api/v1/repairs', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        let errMsg = 'Ошибка при сохранении ремонта';
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
      fetchRepairs();
    } catch (err: any) {
      setFormError(err.message || 'Ошибка при сохранении');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Вы действительно хотите удалить эту запись о ремонте?')) return;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/v1/repairs/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchRepairs();
      } else {
        alert('Ошибка при удалении');
      }
    } catch (err) {
      console.error(err);
      alert('Ошибка при удалении');
    }
  };

  const machineMap = machines.reduce((acc, m) => {
    acc[m.id] = m;
    return acc;
  }, {} as Record<string, MachineOption>);

  const filteredRepairs = repairs.filter(r => {
    const m = machineMap[r.machine_id];
    const code = m ? m.code : '';
    const desc = r.description || '';
    const crew = r.crew || '';
    const q = search.toLowerCase();
    return code.toLowerCase().includes(q) || desc.toLowerCase().includes(q) || crew.toLowerCase().includes(q);
  });

  return (
    <div style={{ padding: '24px', fontFamily: 'inherit' }}>
      {/* Top Header bar */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        marginBottom: '20px', 
        flexWrap: 'wrap', 
        gap: '12px' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: '#1e293b' }}>
            Ремонты и расходы
          </h2>
          <span style={{ 
            fontSize: '13px', 
            fontWeight: 500, 
            padding: '4px 10px', 
            borderRadius: '20px', 
            backgroundColor: '#e2e8f0', 
            color: '#475569' 
          }}>
            Всего: {repairs.length}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <input 
            type="text"
            placeholder="Поиск по станку, описанию или бригаде..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '280px',
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
            onClick={handleOpenModal}
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
            <span style={{ fontSize: '18px', lineHeight: 1 }}>+</span> Зарегистрировать ремонт
          </button>
        </div>
      </div>

      {/* Main Table Card (Odoo style) */}
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
              <th style={{ padding: '14px 20px', fontWeight: 600 }}>Дата</th>
              <th style={{ padding: '14px 20px', fontWeight: 600 }}>Тип</th>
              <th style={{ padding: '14px 20px', fontWeight: 600 }}>Описание / Работы</th>
              <th style={{ padding: '14px 20px', fontWeight: 600 }}>Бригада / Мастер</th>
              <th style={{ padding: '14px 20px', fontWeight: 600 }}>Статус</th>
              <th style={{ padding: '14px 20px', fontWeight: 600, textAlign: 'right' }}>Действия</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                  Yuklanmoqda...
                </td>
              </tr>
            ) : filteredRepairs.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                  Ремонты пока не зарегистрированы
                </td>
              </tr>
            ) : (
              filteredRepairs.map((r, idx) => {
                const m = machineMap[r.machine_id];
                return (
                  <tr 
                    key={r.id}
                    style={{ 
                      borderBottom: idx === filteredRepairs.length - 1 ? 'none' : '1px solid #f1f5f9',
                      transition: 'background-color 0.15s'
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                    onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
                  >
                    <td style={{ padding: '14px 20px', fontWeight: 600, color: '#0f172a' }}>
                      {m ? m.code : r.machine_id}
                    </td>
                    <td style={{ padding: '14px 20px', color: '#475569' }}>
                      {r.repair_date ? new Date(r.repair_date).toLocaleDateString() : '-'}
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 600,
                        backgroundColor: r.type === 'АВАРИЙНЫЙ' ? '#fee2e2' : r.type === 'КАПИТАЛЬНЫЙ' ? '#fef3c7' : '#e0e7ff',
                        color: r.type === 'АВАРИЙНЫЙ' ? '#dc2626' : r.type === 'КАПИТАЛЬНЫЙ' ? '#b45309' : '#3730a3'
                      }}>
                        {r.type}
                      </span>
                    </td>
                    <td style={{ padding: '14px 20px', color: '#334155' }}>
                      {r.description || r.title || '-'}
                    </td>
                    <td style={{ padding: '14px 20px', color: '#475569' }}>
                      {r.crew || '-'}
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '3px 10px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 600,
                        backgroundColor: '#dcfce7',
                        color: '#15803d'
                      }}>
                        {r.status || 'Завершено'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                      <button
                        onClick={() => handleDelete(r.id)}
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
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

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
            maxWidth: '560px',
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
                Регистрация ремонта / расхода
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
                    Дата ремонта <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.repair_date}
                    onChange={(e) => setFormData({ ...formData, repair_date: e.target.value })}
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
                    Тип ремонта
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
                    <option value="ТЕКУЩИЙ">ТЕКУЩИЙ</option>
                    <option value="АВАРИЙНЫЙ">АВАРИЙНЫЙ</option>
                    <option value="КАПИТАЛЬНЫЙ">КАПИТАЛЬНЫЙ</option>
                    <option value="ЗАПРАВКА">ЗАПРАВКА</option>
                  </select>
                </div>
              </div>

              {/* Crew / Master */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Бригада / Мастер
                </label>
                <input
                  type="text"
                  placeholder="Например: Бригада 1, Мастер Акмал"
                  value={formData.crew}
                  onChange={(e) => setFormData({ ...formData, crew: e.target.value })}
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

              {/* Description */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Описание работ / Неисправность
                </label>
                <textarea
                  rows={3}
                  placeholder="Опишите выполненные работы или причину поломки..."
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
