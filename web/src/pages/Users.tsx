import React, { useState, useEffect } from 'react';

interface UserItem {
  id: string;
  username: string;
  full_name: string;
  role: string;
  is_active: boolean;
}

export default function Users() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    full_name: '',
    password: '',
    role: 'USER',
  });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = () => {
    const token = localStorage.getItem('token');
    setLoading(true);
    fetch('/api/v1/users', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        if (!res.ok) return [];
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) setUsers(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenModal = () => {
    setFormData({
      username: '',
      full_name: '',
      password: '',
      role: 'USER',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username.trim() || !formData.full_name.trim() || !formData.password.trim()) {
      setFormError('Пожалуйста, заполните все обязательные поля!');
      return;
    }

    setSubmitting(true);
    setFormError('');
    const token = localStorage.getItem('token');

    try {
      const res = await fetch('/api/v1/users', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Ошибка при создании пользователя');
      }

      handleCloseModal();
      fetchUsers();
    } catch (err: any) {
      setFormError(err.message || 'Ошибка при создании');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, username: string) => {
    if (!window.confirm(`Вы уверены, что хотите удалить пользователя ${username}?`)) return;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/v1/users/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchUsers();
      } else {
        alert('Ошибка при удалении');
      }
    } catch (err) {
      console.error(err);
      alert('Ошибка при удалении');
    }
  };

  const filteredUsers = users.filter(u => {
    const q = search.toLowerCase();
    return u.username.toLowerCase().includes(q) || u.full_name.toLowerCase().includes(q) || u.role.toLowerCase().includes(q);
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
            Пользователи
          </h2>
          <span style={{ 
            fontSize: '13px', 
            fontWeight: 500, 
            padding: '4px 10px', 
            borderRadius: '20px', 
            backgroundColor: '#e2e8f0', 
            color: '#475569' 
          }}>
            Всего: {users.length}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <input 
            type="text"
            placeholder="Поиск по ФИО или логину..." 
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
            <span style={{ fontSize: '18px', lineHeight: 1 }}>+</span> Добавить пользователя
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
              <th style={{ padding: '14px 20px', fontWeight: 600 }}>Пользователь (Ф.И.О)</th>
              <th style={{ padding: '14px 20px', fontWeight: 600 }}>Логин</th>
              <th style={{ padding: '14px 20px', fontWeight: 600 }}>Роль</th>
              <th style={{ padding: '14px 20px', fontWeight: 600 }}>Статус</th>
              <th style={{ padding: '14px 20px', fontWeight: 600, textAlign: 'right' }}>Действия</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                  Yuklanmoqda...
                </td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                  Пользователи не найдены
                </td>
              </tr>
            ) : (
              filteredUsers.map((u, idx) => (
                <tr 
                  key={u.id}
                  style={{ 
                    borderBottom: idx === filteredUsers.length - 1 ? 'none' : '1px solid #f1f5f9',
                    transition: 'background-color 0.15s'
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                  onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
                >
                  <td style={{ padding: '14px 20px', fontWeight: 600, color: '#0f172a' }}>
                    {u.full_name}
                  </td>
                  <td style={{ padding: '14px 20px', color: '#475569' }}>
                    {u.username}
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '3px 10px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 600,
                      backgroundColor: u.role === 'ADMIN' ? '#f3e8f0' : '#e0e7ff',
                      color: u.role === 'ADMIN' ? '#714B67' : '#3730a3'
                    }}>
                      {u.role}
                    </span>
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '3px 10px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 600,
                      backgroundColor: u.is_active ? '#dcfce7' : '#fee2e2',
                      color: u.is_active ? '#15803d' : '#dc2626'
                    }}>
                      {u.is_active ? 'Активен' : 'Заблокирован'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                    <button
                      onClick={() => handleDelete(u.id, u.username)}
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
            maxWidth: '480px',
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
                Новый пользователь
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

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Ф.И.О. сотрудника <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Например: Иван Иванов"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
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

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Логин <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Например: ivan_ivanov"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
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

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Пароль <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="password"
                  required
                  placeholder="Введите пароль"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Роль
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
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
                  <option value="USER">USER (Оператор / Мастер)</option>
                  <option value="ADMIN">ADMIN (Администратор)</option>
                </select>
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
                  {submitting ? 'Создание...' : 'Создать'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
