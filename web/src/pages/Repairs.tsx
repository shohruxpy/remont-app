import React from 'react';
import { useTranslation } from 'react-i18next';

export default function Repairs() {
  const { t } = useTranslation();
  const [repairs, setRepairs] = React.useState<any[]>([]);

  React.useEffect(() => {
    const token = localStorage.getItem('token');
    fetch('/api/v1/repairs', {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => res.json()).then(setRepairs).catch(console.error);
  }, []);

  return (
    <div className="pg-content">
      <div className="fl"><b style={{ 'fontSize': '18px', 'marginRight': 'auto' }}>{t('t_77')}</b><input className="in" value="01.09.2026" /><span>{t('t_78')}</span><input className="in" value="30.09.2026" /><button className="btn p">{t('t_79')}</button></div> <div className="cols" style={{ 'gridTemplateColumns': '1.3fr 1fr' }}><div className="c tw"><table><tr><th>{t('t_80')}</th><th>{t('t_81')}</th><th>{t('t_82')}</th><th>{t('t_83')}</th><th>{t('t_84')}</th></tr> <tr style={{ 'background': 'var(--prt)' }}><td>{t('t_85')}</td><td>{t('t_86')}</td><td>{t('t_87')}</td><td>{t('t_88')}</td><td>{t('t_89')}</td></tr> <tr><td>{t('t_90')}</td><td>{t('t_91')}</td><td>{t('t_92')}</td><td>{t('t_93')}</td><td>{t('t_94')}</td></tr> <tr><td>{t('t_95')}</td><td>{t('t_96')}</td><td>{t('t_97')}</td><td>{t('t_98')}</td><td>{t('t_99')}</td></tr></table></div> <div className="c"><b>{t('t_100')}</b><div className="mu" style={{ 'marginBottom': '8px' }}>{t('t_101')}</div> <label className="mu">{t('t_102')}</label><input className="in" value="Замена челнока" /> <table style={{ 'minWidth': '0' }}><tr><th>{t('t_103')}</th><th>{t('t_104')}</th><th>{t('t_105')}</th><th>{t('t_106')}</th></tr><tr><td>{t('t_107')}</td><td><span className="tag b">{t('t_108')}</span></td><td>{t('t_109')}</td><td>{t('t_110')}</td></tr><tr><td>{t('t_111')}</td><td><span className="tag g">{t('t_112')}</span></td><td>{t('t_113')}</td><td>{t('t_114')}</td></tr></table> <div className="row" style={{ 'marginTop': '10px' }}><span className="mu">{t('t_115')}</span><span><button className="btn">{t('t_116')}</button> <button className="btn p">{t('t_117')}</button></span></div></div></div>
    </div>
  );
}
