import React from 'react';
import { useTranslation } from 'react-i18next';

export default function Plans() {
  const { t } = useTranslation();
  const [plans, setPlans] = React.useState<any[]>([]);

  React.useEffect(() => {
    const token = localStorage.getItem('token');
    fetch('/api/v1/plans', {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => res.json()).then(setPlans).catch(console.error);
  }, []);

  return (
    <div className="pg-content">
      <div className="fl"><b style={{ 'fontSize': '18px', 'marginRight': 'auto' }}>{t('t_118')}</b><button className="btn p">{t('t_119')}</button></div> <div className="c"><div className="row"><b>{t('t_120')}</b><span className="tag y">{t('t_121')}</span></div><div className="pb"><i style={{ 'width': '60%', 'background': 'var(--wa)' }}></i></div><div className="row"><span className="mu">{t('t_122')}</span><span><b>{t('t_123')}</b> <button className="btn s">{t('t_124')}</button> <button className="btn s">{t('t_125')}</button></span></div></div> <div className="c tw"><table><tr><th>{t('t_126')}</th><th>{t('t_127')}</th><th>{t('t_128')}</th><th>{t('t_129')}</th><th>{t('t_130')}</th><th></th></tr> <tr><td>{t('t_131')}</td><td>{t('t_132')}</td><td>{t('t_133')}</td><td>{t('t_134')}</td><td><span className="tag y">{t('t_135')}</span></td><td><button className="btn s">{t('t_136')}</button></td></tr> <tr><td>{t('t_137')}</td><td>{t('t_138')}</td><td>{t('t_139')}</td><td>{t('t_140')}</td><td><span className="tag r">{t('t_141')}</span></td><td><button className="btn s">{t('t_142')}</button></td></tr> <tr><td>{t('t_143')}</td><td>{t('t_144')}</td><td>{t('t_145')}</td><td>{t('t_146')}</td><td><span className="tag b">{t('t_147')}</span></td><td><button className="btn s">{t('t_148')}</button></td></tr></table></div>
    </div>
  );
}
