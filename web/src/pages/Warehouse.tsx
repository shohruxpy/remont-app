import React, { useState, useEffect } from 'react';

interface MaterialItem {
  id: string;
  code: string;
  name: string;
  unit?: string | null;
  map_price?: number | null;
  stock_qty?: number | null;
}

interface MachineItem {
  id: string;
  code: string;
  name: string;
  sap_co_order?: string | null;
}

export default function Warehouse() {
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [machines, setMachines] = useState<MachineItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [search, setSearch] = useState('');
  const [notification, setNotification] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Modal State for consumption
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMaterialId, setSelectedMaterialId] = useState('');
  const [selectedMachineId, setSelectedMachineId] = useState('');
  const [consumeQty, setConsumeQty] = useState('1');
  const [reason, setReason] = useState('Плановая замена изношенной детали');
  const [technician, setTechnician] = useState('Мастер участка');
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

  const fetchData = () => {
    const token = localStorage.getItem('token');
    setLoading(true);

    Promise.all([
      fetch('/api/v1/materials?page_size=100', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.ok ? r.json() : []),
      fetch('/api/v1/machines?page_size=100', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.ok ? r.json() : [])
    ]).then(([mats, machs]) => {
      if (Array.isArray(mats)) setMaterials(mats);
      if (Array.isArray(machs)) setMachines(machs);
    }).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSyncSAP = async () => {
    const token = localStorage.getItem('token');
    setSyncing(true);
    setNotification(null);
    try {
      const res = await fetch('/api/v1/materials/sync-sap', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setNotification({ type: 'success', text: `✓ ${data.message} Обновлено позиций: ${data.synced_items_count}` });
        fetchData();
      } else {
        setNotification({ type: 'error', text: data.detail || 'Ошибка синхронизации с SAP' });
      }
    } catch (err: any) {
      setNotification({ type: 'error', text: 'Ошибка подключения к серверу SAP' });
    } finally {
      setSyncing(false);
    }
  };

  const handleOpenConsumeModal = (matId?: string) => {
    setSelectedMaterialId(matId || (materials.length > 0 ? materials[0].id : ''));
    setSelectedMachineId(machines.length > 0 ? machines[0].id : '');
    setConsumeQty('1');
    setReason('Плановая замена изношенной детали');
    setTechnician('Мастер участка');
    setModalError('');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleConsumeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMaterialId || !selectedMachineId) {
      setModalError('Пожалуйста, выберите материал и станок!');
      return;
    }

    const qtyNum = parseFloat(consumeQty);
    if (isNaN(qtyNum) || qtyNum <= 0) {
      setModalError('Укажите корректное количество для списания!');
      return;
    }

    setSubmitting(true);
    setModalError('');
    const token = localStorage.getItem('token');

    try {
      const res = await fetch('/api/v1/materials/consume', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          material_id: selectedMaterialId,
          machine_id: selectedMachineId,
          qty: qtyNum,
          reason,
          technician
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Ошибка списания материала');
      }

      handleCloseModal();
      setNotification({
        type: 'success',
        text: `✓ Успешно списано! Документ SAP: ${data.sap_document_no} | Станок: ${data.machine_code} | Остаток: ${data.remaining_stock}`
      });
      fetchData();
    } catch (err: any) {
      setModalError(err.message || 'Ошибка списания');
    } finally {
      setSubmitting(false);
    }
  };

  const currentSelectedMat = materials.find(m => m.id === selectedMaterialId);
  const currentSelectedMach = machines.find(m => m.id === selectedMachineId);
  const estimatedCost = currentSelectedMat && currentSelectedMat.map_price
    ? (parseFloat(consumeQty) || 0) * Number(currentSelectedMat.map_price)
    : 0;

  const filteredMaterials = materials.filter(m => {
    const q = search.toLowerCase();
    return m.code.toLowerCase().includes(q) || m.name.toLowerCase().includes(q);
  });

  return (
    <div style={{ padding: '24px', fontFamily: 'inherit' }}>
      {/* Notifications */}
      {notification && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '16px',
          fontSize: '14px',
          fontWeight: 500,
          backgroundColor: notification.type === 'success' ? '#dcfce7' : '#fee2e2',
          color: notification.type === 'success' ? '#15803d' : '#b91c1c',
          border: `1px solid ${notification.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <span>{notification.text}</span>
          <button 
            onClick={() => setNotification(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontWeight: 'bold' }}
          >
            &times;
          </button>
        </div>
      )}

      {/* Top Header Bar */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        marginBottom: '20px', 
        flexWrap: 'wrap', 
        gap: '12px' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: '#1e293b' }}>
              Склад и запчасти
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
              <span style={{ 
                fontSize: '12px', 
                fontWeight: 600, 
                padding: '2px 8px', 
                borderRadius: '12px', 
                backgroundColor: '#dcfce7', 
                color: '#15803d',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#16a34a' }}></span>
                SAP MM: Подключено
              </span>
              <span style={{ fontSize: '12px', color: '#64748b' }}>
                Всего позиций: {materials.length}
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <input 
            type="text"
            placeholder="Поиск по коду или детали..." 
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
            onClick={handleSyncSAP}
            disabled={syncing}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#ffffff',
              color: '#334155',
              border: '1px solid #cbd5e1',
              padding: '9px 16px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: syncing ? 'not-allowed' : 'pointer',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              transition: 'all 0.15s'
            }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
          >
            {syncing ? 'Синхронизация...' : 'Синхронизировать с SAP'}
          </button>

          <button 
            onClick={() => handleOpenConsumeModal()}
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
            <span style={{ fontSize: '18px', lineHeight: 1 }}>+</span> Списать на станок
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
              <th style={{ padding: '14px 20px', fontWeight: 600 }}>SAP Код</th>
              <th style={{ padding: '14px 20px', fontWeight: 600 }}>Наименование детали / материала</th>
              <th style={{ padding: '14px 20px', fontWeight: 600 }}>Остаток на складе</th>
              <th style={{ padding: '14px 20px', fontWeight: 600 }}>Ед. изм.</th>
              <th style={{ padding: '14px 20px', fontWeight: 600 }}>Цена SAP (сум)</th>
              <th style={{ padding: '14px 20px', fontWeight: 600 }}>Статус запаса</th>
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
            ) : filteredMaterials.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                  Материалы не найдены
                </td>
              </tr>
            ) : (
              filteredMaterials.map((m, idx) => {
                const stock = m.stock_qty !== null && m.stock_qty !== undefined ? Number(m.stock_qty) : 0;
                const isLow = stock < 10;
                const isOutOfStock = stock <= 0;

                return (
                  <tr 
                    key={m.id}
                    style={{ 
                      borderBottom: idx === filteredMaterials.length - 1 ? 'none' : '1px solid #f1f5f9',
                      transition: 'background-color 0.15s'
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                    onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
                  >
                    <td style={{ padding: '14px 20px', fontWeight: 700, color: '#0f172a' }}>
                      {m.code}
                    </td>
                    <td style={{ padding: '14px 20px', color: '#334155', fontWeight: 500 }}>
                      {m.name}
                    </td>
                    <td style={{ padding: '14px 20px', fontWeight: 700, color: isOutOfStock ? '#dc2626' : isLow ? '#d97706' : '#0f172a' }}>
                      {stock.toLocaleString()}
                    </td>
                    <td style={{ padding: '14px 20px', color: '#64748b' }}>
                      {m.unit || 'шт'}
                    </td>
                    <td style={{ padding: '14px 20px', color: '#334155' }}>
                      {m.map_price ? Number(m.map_price).toLocaleString() + ' сум' : '-'}
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '3px 10px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 600,
                        backgroundColor: isOutOfStock ? '#fee2e2' : isLow ? '#fef3c7' : '#dcfce7',
                        color: isOutOfStock ? '#dc2626' : isLow ? '#b45309' : '#15803d'
                      }}>
                        {isOutOfStock ? 'Нет на складе' : isLow ? 'Мало' : 'В наличии'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                      <button
                        onClick={() => handleOpenConsumeModal(m.id)}
                        disabled={isOutOfStock}
                        title="Списать на станок"
                        style={{
                          backgroundColor: isOutOfStock ? '#f1f5f9' : '#f8eff5',
                          color: isOutOfStock ? '#94a3b8' : '#714B67',
                          border: isOutOfStock ? '1px solid #e2e8f0' : '1px solid #e9d5e3',
                          padding: '6px 14px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                          transition: 'all 0.15s'
                        }}
                        onMouseOver={(e) => { if (!isOutOfStock) e.currentTarget.style.backgroundColor = '#f1e2ec'; }}
                        onMouseOut={(e) => { if (!isOutOfStock) e.currentTarget.style.backgroundColor = '#f8eff5'; }}
                      >
                        Списать на станок
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modern Modal Window: Consume Material onto Machine (SAP Movement 261) */}
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
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
                  Списание детали на станок
                </h3>
                <span style={{ fontSize: '12px', color: '#714B67', fontWeight: 600 }}>
                  Проводка в SAP ERP (Вид движения 261: Отпуск на заказ станка)
                </span>
              </div>
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
            <form onSubmit={handleConsumeSubmit} style={{ padding: '24px' }}>
              {modalError && (
                <div style={{
                  padding: '10px 14px',
                  backgroundColor: '#fee2e2',
                  color: '#b91c1c',
                  borderRadius: '8px',
                  fontSize: '13px',
                  marginBottom: '16px',
                  border: '1px solid #fecaca'
                }}>
                  {modalError}
                </div>
              )}

              {/* Material selection */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Материал / Деталь (SAP) <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select
                  required
                  value={selectedMaterialId}
                  onChange={(e) => setSelectedMaterialId(e.target.value)}
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
                  <option value="">-- Выберите деталь со склада --</option>
                  {materials.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.code} - {m.name} (Остаток: {m.stock_qty || 0} {m.unit || 'шт.'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Machine selection */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Целевой станок (СО Заказ) <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select
                  required
                  value={selectedMachineId}
                  onChange={(e) => setSelectedMachineId(e.target.value)}
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
                      {m.code} - {m.name} {m.sap_co_order ? `(Заказ: ${m.sap_co_order})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Quantity and Technician */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Количество к списанию <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    required
                    value={consumeQty}
                    onChange={(e) => setConsumeQty(e.target.value)}
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
                    Ответственный мастер
                  </label>
                  <input
                    type="text"
                    value={technician}
                    onChange={(e) => setTechnician(e.target.value)}
                    placeholder="Ф.И.О. мастера"
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

              {/* Reason */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Причина списания / Описание работ
                </label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Например: Замена ремня при аварийном ремонте"
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

              {/* SAP Integration Summary Card */}
              <div style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '12px 16px',
                marginBottom: '24px',
                fontSize: '13px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ color: '#64748b' }}>СО Заказ станка в SAP:</span>
                  <span style={{ fontWeight: 600, color: '#0f172a' }}>{currentSelectedMach?.sap_co_order || '90001 (По умолчанию)'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Итоговая сумма списания:</span>
                  <span style={{ fontWeight: 700, color: '#714B67', fontSize: '14px' }}>{estimatedCost.toLocaleString()} сум</span>
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
                  {submitting ? 'Проводка в SAP...' : 'Провести списание в SAP'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
