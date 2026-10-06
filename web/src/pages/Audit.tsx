import React from 'react';
import { useTranslation } from 'react-i18next';

export default function Audit() {
  const { t } = useTranslation();
  const [auditLog, setAuditLog] = React.useState<any[]>([]);

  React.useEffect(() => {
    const token = localStorage.getItem('token');
    fetch('/api/v1/audit-log', {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => res.json()).then(setAuditLog).catch(console.error);
  }, []);

  return (
    <div className="pg-content">
      <div className="fl"><b style={{ 'fontSize': '18px', 'marginRight': 'auto' }}>{t('t_202')}</b><input className="in" value="01.10.2026" /><input className="in" placeholder="Пользователь" /></div> <div className="c tw"><table><tr><th>{t('t_203')}</th><th>{t('t_204')}</th><th>{t('t_205')}</th><th>{t('t_206')}</th><th>{t('t_207')}</th></tr> <tr><td>{t('t_208')}</td><td>{t('t_209')}</td><td>{t('t_210')}</td><td>{t('t_211')}</td><td>{t('t_212')}</td></tr> <tr><td>{t('t_213')}</td><td>{t('t_214')}</td><td>{t('t_215')}</td><td>{t('t_216')}</td><td>{t('t_217')}</td></tr> <tr><td>{t('t_218')}</td><td>{t('t_219')}</td><td>{t('t_220')}</td><td>{t('t_221')}</td><td>{t('t_222')}</td></tr></table></div>
    </div>
  );
}
