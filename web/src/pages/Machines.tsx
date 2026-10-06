import React from 'react';
import { useTranslation } from 'react-i18next';

export default function Machines() {
  const { t } = useTranslation();
  const [machines, setMachines] = React.useState<any[]>([]);

  React.useEffect(() => {
    const token = localStorage.getItem('token');
    fetch('/api/v1/machines', {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => res.json()).then(setMachines).catch(console.error);
  }, []);

  return (
    <div className="pg-content">
      <div className="fl"><b style={{ 'fontSize': '18px', 'marginRight': 'auto' }}>{t('t_47')}</b><input className="in" placeholder="Поиск" /><button className="btn p">{t('t_48')}</button><button className="btn">{t('t_49')}</button><button className="btn">{t('t_50')}</button></div> <div className="c tw"><table><tr><th>{t('t_51')}</th><th>{t('t_52')}</th><th>{t('t_53')}</th><th>{t('t_54')}</th><th>{t('t_55')}</th><th></th></tr> <tr><td>{t('t_56')}</td><td>{t('t_57')}</td><td>{t('t_58')}</td><td>{t('t_59')}</td><td><span className="tag y">{t('t_60')}</span></td><td><button className="btn s">{t('t_61')}</button> <button className="btn s">{t('t_62')}</button></td></tr> <tr><td>{t('t_63')}</td><td>{t('t_64')}</td><td>{t('t_65')}</td><td>{t('t_66')}</td><td><span className="tag g">{t('t_67')}</span></td><td><button className="btn s">{t('t_68')}</button> <button className="btn s">{t('t_69')}</button></td></tr> <tr><td>{t('t_70')}</td><td>{t('t_71')}</td><td>{t('t_72')}</td><td>{t('t_73')}</td><td><span className="tag g">{t('t_74')}</span></td><td><button className="btn s">{t('t_75')}</button> <button className="btn s">{t('t_76')}</button></td></tr></table></div>
    </div>
  );
}
