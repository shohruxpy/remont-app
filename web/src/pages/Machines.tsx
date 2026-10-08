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
    });
    setFormError('');
    setIsModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEdit = (m: MachineItem) => {
    setEditingMachine(m);
    setFormData({
      code: m.code || '',
      name: m.name || '',
      sap_co_order: m.sap_co_order || '',
      sap_cost_center: m.sap_cost_center || '',
      status: m.status || 'ACTIVE',
      location: m.location || '',
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

    try {
      if (editingMachine) {
        // UPDATE (PUT)
        const res = await fetch(`/api/v1/machines/${editingMachine.id}`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
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
          body: JSON.stringify(formData),
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
              backgroundColor: '#1d4ed8',
              color: '#ffffff',
              border: 'none',
              padding: '9px 18px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(29, 78, 216, 0.25)',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#1e40af')}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#1d4ed8')}
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
            ) : machines.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                  Stanoklar topilmadi
                </td>
              </tr>
            ) : (
              machines.map((m, idx) => (
                <tr 
                  key={m.id}
                  style={{ 
                    borderBottom: idx === machines.length - 1 ? 'none' : '1px solid #f1f5f9',
                    transition: 'background-color 0.15s'
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                  onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
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
                  <td style={{ padding: '14px 20px' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '3px 10px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 600,
                      backgroundColor: m.status === 'ACTIVE' ? '#dcfce7' : m.status === 'MAINTENANCE' ? '#fef3c7' : '#f1f5f9',
                      color: m.status === 'ACTIVE' ? '#15803d' : m.status === 'MAINTENANCE' ? '#b45309' : '#475569'
                    }}>
                      {m.status || 'ACTIVE'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '8px' }}>
                      <button
                        onClick={() => handleOpenEdit(m)}
                        title="Tahrirlash"
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
                        Изменить
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
                        title="O'chirish"
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
              ))
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
                {editingMachine ? "Stanokni tahrirlash" : "Yangi stanok yaratish"}
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
                  KODI (Takrorlanmas / Unikal) <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Masalan: T-01, T-36"
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
                  NOMI / Qisqacha tavsif <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Masalan: Ремонт станка T-36 (CRX-82 / G-8427.001)"
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
                    SO ZAKAZ
                  </label>
                  <input
                    type="text"
                    placeholder="Masalan: 90001"
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
                    JAVOBGAR MBZ
                  </label>
                  <input
                    type="text"
                    placeholder="Masalan: CARP110303"
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

              {/* Two columns: Status & Location */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>
                    STATUS
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
                    <option value="ACTIVE">ACTIVE (Ish holatida)</option>
                    <option value="MAINTENANCE">MAINTENANCE (Ta'mirda)</option>
                    <option value="INACTIVE">INACTIVE (Nofaol)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>
                    JOYlashuv (Sex / Joy)
                  </label>
                  <input
                    type="text"
                    placeholder="Masalan: Цех 1, 3-qator"
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
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    backgroundColor: '#2563eb',
                    color: '#ffffff',
                    border: 'none',
                    padding: '10px 24px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    boxShadow: '0 2px 4px rgba(37, 99, 235, 0.3)',
                    opacity: submitting ? 0.7 : 1
                  }}
                >
                  {submitting ? 'Saqlanmoqda...' : 'Saqlash'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
