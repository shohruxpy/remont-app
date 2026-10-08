import React, { useState, useEffect } from 'react';

interface MachineItem {
  id: string;
  code: string;
  name: string;
  sap_co_order?: string | null;
  sap_cost_center?: string | null;
  status: string;
  location?: string | null;
  serial_no?: string | null;
  model?: string | null;
  last_zaprafka_end?: string | null;
  zaprafka_interval_months?: number;
}

export default function Machines() {
  const [machines, setMachines] = useState<MachineItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMachine, setEditingMachine] = useState<MachineItem | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    sap_co_order: '',
    sap_cost_center: '',
    status: 'ACTIVE',
    location: '',
    last_zaprafka_end: '',
    zaprafka_interval_years: 5,
  });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchMachines = (searchTerm = '') => {
    const token = localStorage.getItem('token');
    const url = searchTerm
      ? `/api/v1/machines?page_size=100&search=${encodeURIComponent(searchTerm)}`
      : '/api/v1/machines?page_size=100';
    
    setLoading(true);
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        if (res.status === 401) { 
          window.location.href = '/login'; 
          return []; 
        }
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) setMachines(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchMachines(search);
  }, [search]);

  // Open modal for Create
  const handleOpenCreate = () => {
    setEditingMachine(null);
    setFormData({
      code: '',
      name: '',
      sap_co_order: '',
      sap_cost_center: '',
      status: 'ACTIVE',
      location: '',
      last_zaprafka_end: '',
      zaprafka_interval_years: 5,
    });
    setFormError('');
    setIsModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEdit = (m: MachineItem) => {
    setEditingMachine(m);
    const years = m.zaprafka_interval_months ? Math.round(m.zaprafka_interval_months / 12) : 5;
    let zapDate = '';
    if (m.last_zaprafka_end) {
      zapDate = m.last_zaprafka_end.split('T')[0];
    }

    setFormData({
      code: m.code || '',
      name: m.name || '',
      sap_co_order: m.sap_co_order || '',
      sap_cost_center: m.sap_cost_center || '',
      status: m.status || 'ACTIVE',
      location: m.location || '',
      last_zaprafka_end: zapDate,
      zaprafka_interval_years: years,
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingMachine(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code.trim() || !formData.name.trim()) {
      setFormError("KOD va NOM maydonlari to'ldirilishi shart!");
      return;
    }

    setSubmitting(true);
    setFormError('');
    const token = localStorage.getItem('token');

    const payload: any = {
      code: formData.code.trim(),
      name: formData.name.trim(),
      sap_co_order: formData.sap_co_order.trim() || null,
      sap_cost_center: formData.sap_cost_center.trim() || null,
      status: formData.status,
      location: formData.location.trim() || null,
      zaprafka_interval_months: (formData.zaprafka_interval_years || 5) * 12,
      last_zaprafka_end: formData.last_zaprafka_end ? `${formData.last_zaprafka_end}T00:00:00` : null,
    };

    try {
      if (editingMachine) {
        // UPDATE (PUT)
        const res = await fetch(`/api/v1/machines/${editingMachine.id}`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.detail || "Stanokni o'zgartirishda xatolik yuz berdi");
        }
      } else {
        // CREATE (POST)
        const res = await fetch('/api/v1/machines', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.detail || "Stanokni yaratishda xatolik yuz berdi");
        }
      }

      handleCloseModal();
      fetchMachines(search);
    } catch (err: any) {
      setFormError(err.message || 'Xatolik yuz berdi');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, code: string) => {
    if (!window.confirm(`Rostdan ham ${code} stanogini o'chirmoqchimisiz?`)) return;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/v1/machines/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        fetchMachines(search);
      } else {
        alert("O'chirishda xatolik yuz berdi");
      }
    } catch (e) {
      console.error(e);
      alert("O'chirishda xatolik yuz berdi");
    }
  };

  const handlePrintQR = (code: string) => {
    const token = localStorage.getItem('token');
    window.open(`/api/v1/machines/${encodeURIComponent(code)}/qr?token=${token}`, '_blank');
  };

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
            Станки
          </h2>
          <span style={{ 
            fontSize: '13px', 
            fontWeight: 500, 
            padding: '4px 10px', 
            borderRadius: '20px', 
            backgroundColor: '#e2e8f0', 
            color: '#475569' 
          }}>
            Всего: {machines.length}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Search Input */}
          <div style={{ position: 'relative' }}>
            <input 
              type="text"
              placeholder="Поиск по коду или названию..." 
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
          </div>

          {/* Add Machine Button */}
          <button 
            onClick={handleOpenCreate}
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
            <span style={{ fontSize: '18px', lineHeight: 1 }}>+</span> Добавить станок
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
              <th style={{ padding: '14px 20px', fontWeight: 600 }}>Станок (Код)</th>
              <th style={{ padding: '14px 20px', fontWeight: 600 }}>СО Заказ</th>
              <th style={{ padding: '14px 20px', fontWeight: 600 }}>Краткий текст</th>
              <th style={{ padding: '14px 20px', fontWeight: 600 }}>Ответственное МВЗ</th>
              <th style={{ padding: '14px 20px', fontWeight: 600 }}>Посл. заправка</th>
              <th style={{ padding: '14px 20px', fontWeight: 600 }}>Интервал</th>
              <th style={{ padding: '14px 20px', fontWeight: 600 }}>Статус</th>
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
            ) : machines.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                  Станки не найдены
                </td>
              </tr>
            ) : (
              machines.map((m, idx) => {
                const zapDate = m.last_zaprafka_end ? new Date(m.last_zaprafka_end).toLocaleDateString() : 'Не указана';
                const intervalYears = m.zaprafka_interval_months ? Math.round(m.zaprafka_interval_months / 12) : 5;
                const isZaprafka = m.status === 'ZAPRAFKA';

                return (
                  <tr 
                    key={m.id}
                    style={{ 
                      borderBottom: idx === machines.length - 1 ? 'none' : '1px solid #f1f5f9',
                      transition: 'background-color 0.15s',
                      cursor: 'pointer'
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                    onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
                    onClick={() => handleOpenEdit(m)}
                  >
                    <td style={{ padding: '14px 20px', fontWeight: 600, color: '#0f172a' }}>
                      {m.code}
                    </td>
                    <td style={{ padding: '14px 20px', color: '#475569' }}>
                      {m.sap_co_order || '-'}
                    </td>
                    <td style={{ padding: '14px 20px', color: '#334155' }}>
                      {m.name}
                    </td>
                    <td style={{ padding: '14px 20px', color: '#475569' }}>
                      {m.sap_cost_center || '-'}
                    </td>
                    <td style={{ padding: '14px 20px', color: '#334155', fontWeight: m.last_zaprafka_end ? 500 : 400 }}>
                      {zapDate}
                    </td>
                    <td style={{ padding: '14px 20px', color: '#475569' }}>
                      {intervalYears} лет
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '3px 10px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 600,
                        backgroundColor: isZaprafka ? '#fef3c7' : m.status === 'ACTIVE' ? '#dcfce7' : m.status === 'MAINTENANCE' ? '#fee2e2' : '#f1f5f9',
                        color: isZaprafka ? '#b45309' : m.status === 'ACTIVE' ? '#15803d' : m.status === 'MAINTENANCE' ? '#dc2626' : '#475569'
                      }}>
                        {m.status === 'ZAPRAFKA' ? 'ЗАПРАВКА' : m.status || 'ACTIVE'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 20px', textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: 'inline-flex', gap: '8px' }}>
                        <button
                          onClick={() => handleOpenEdit(m)}
                          title="Настроить / Изменить"
                          style={{
                            backgroundColor: '#f1f5f9',
                            color: '#0f172a',
                            border: '1px solid #cbd5e1',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: 500,
                            cursor: 'pointer',
                            transition: 'all 0.15s'
                          }}
                          onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#e2e8f0'; }}
                          onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#f1f5f9'; }}
                        >
                          Настроить
                        </button>
                        <button
                          onClick={() => handlePrintQR(m.code)}
                          title="QR Kod"
                          style={{
                            backgroundColor: '#f1f5f9',
                            color: '#0f172a',
                            border: '1px solid #cbd5e1',
                            padding: '6px 10px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: 500,
                            cursor: 'pointer',
                            transition: 'all 0.15s'
                          }}
                          onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#e2e8f0'; }}
                          onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#f1f5f9'; }}
                        >
                          QR
                        </button>
                        <button
                          onClick={() => handleDelete(m.id, m.code)}
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
            maxWidth: '580px',
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
                {editingMachine ? `Настройка станка: ${editingMachine.code}` : "Новый станок"}
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

              {/* Code input */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>
                  КОД СТАНКА (Уникальный) <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Например: T-01, T-36"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
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

              {/* Name input */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>
                  КРАТКИЙ ТЕКСТ / НАЗВАНИЕ <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Например: Ремонт станка T-01 (CRX-82 / G-7887.001)"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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

              {/* Two columns: CO Order & Cost Center */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>
                    СО ЗАКАЗ
                  </label>
                  <input
                    type="text"
                    placeholder="Например: 90001"
                    value={formData.sap_co_order}
                    onChange={(e) => setFormData({ ...formData, sap_co_order: e.target.value })}
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
                    ОТВЕТСТВЕННОЕ МВЗ
                  </label>
                  <input
                    type="text"
                    placeholder="Например: CARP110303"
                    value={formData.sap_cost_center}
                    onChange={(e) => setFormData({ ...formData, sap_cost_center: e.target.value })}
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
              </div>

              {/* ZAPRAFKA SETTINGS BLOCK (User specific request) */}
              <div style={{ 
                backgroundColor: '#f8fafc', 
                border: '1px solid #e2e8f0', 
                borderRadius: '10px', 
                padding: '14px 16px', 
                marginBottom: '16px' 
              }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#714B67', marginBottom: '12px' }}>
                  Параметры заправки основы
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                      Дата последней заправки
                    </label>
                    <input
                      type="date"
                      value={formData.last_zaprafka_end}
                      onChange={(e) => setFormData({ ...formData, last_zaprafka_end: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        fontSize: '13px',
                        outline: 'none',
                        backgroundColor: '#ffffff',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                      Интервал заправки (каждые N лет)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={formData.zaprafka_interval_years}
                      onChange={(e) => setFormData({ ...formData, zaprafka_interval_years: parseInt(e.target.value) || 5 })}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        fontSize: '13px',
                        outline: 'none',
                        backgroundColor: '#ffffff',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Two columns: Status & Location */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>
                    СТАТУС СТАНКА
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
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
                    <option value="ACTIVE">ACTIVE (В работе)</option>
                    <option value="ZAPRAFKA">ZAPRAFKA (Идет заправка)</option>
                    <option value="MAINTENANCE">MAINTENANCE (На ремонте)</option>
                    <option value="INACTIVE">INACTIVE (Не активен)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>
                    РАСПОЛОЖЕНИЕ (Цех)
                  </label>
                  <input
                    type="text"
                    placeholder="Например: Цех 1, Ряд 3"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
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
