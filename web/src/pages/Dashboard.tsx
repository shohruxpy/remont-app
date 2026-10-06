import React from 'react';
import { useTranslation } from 'react-i18next';

export default function Dashboard() {
  const { t } = useTranslation();
  const [dashboardData, setDashboardData] = React.useState<any>(null);
  const [historyData, setHistoryData] = React.useState<any>(null);

  React.useEffect(() => {
    const token = localStorage.getItem('token');
    fetch('/api/v1/analytics/dashboard', {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => res.json()).then(setDashboardData).catch(console.error);
    fetch('/api/v1/analytics/history', {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => res.json()).then(setHistoryData).catch(console.error);
  }, []);

  return (
    <div className="pg-content">
      <div className="fl"><b style={{ 'fontSize': '18px', 'marginRight': 'auto' }}>{t('t_1')}</b><input className="in" value="01.09.2026" /><span>{t('t_2')}</span><input className="in" value="30.09.2026" /><select className="in"><option>{t('t_3')}</option></select></div> <div className="kp"><div className="c mu">{t('t_4')}<b style={{ 'color': 'var(--tx)' }}>{t('t_5')}</b></div><div className="c mu">{t('t_6')}<b style={{ 'color': 'var(--tx)' }}>{t('t_7')}</b></div><div className="c mu">{t('t_8')}<b style={{ 'color': 'var(--wa)' }}>{t('t_9')}</b></div><div className="c mu">{t('t_10')}<b style={{ 'color': 'var(--er)' }}>{t('t_11')}</b></div></div> <div className="cols"><div className="c"><b>{t('t_12')}</b><div className="bars" style={{ 'marginBottom': '22px' }}><div style={{ 'height': '45%' }}><span>{t('t_13')}</span></div><div style={{ 'height': '60%' }}><span>{t('t_14')}</span></div><div style={{ 'height': '38%' }}><span>{t('t_15')}</span></div><div style={{ 'height': '72%' }}><span>{t('t_16')}</span></div><div style={{ 'height': '100%' }}><span>{t('t_17')}</span></div></div></div> <div className="c"><b>{t('t_18')}</b><div className="st"><i style={{ 'width': '72%', 'background': 'var(--pr)' }}></i><i style={{ 'width': '28%', 'background': 'var(--ok)' }}></i></div><div className="row"><span><span className="tag b">{t('t_19')}</span></span><span className="tag g">{t('t_20')}</span></div> <div style={{ 'marginTop': '12px' }}><b>{t('t_21')}</b><ol style={{ 'margin': '6px 0 0', 'paddingLeft': '18px' }}><li>{t('t_22')}</li><li>{t('t_23')}</li><li>{t('t_24')}</li><li>{t('t_25')}</li><li>{t('t_26')}</li></ol></div></div></div> <div className="c tw" style={{ 'marginTop': '10px' }}><b>{t('t_27')}</b><table><tr><th>{t('t_28')}</th><th>{t('t_29')}</th><th>{t('t_30')}</th><th>{t('t_31')}</th><th></th></tr> <tr><td>{t('t_32')}</td><td>{t('t_33')}</td><td>{t('t_34')}</td><td>{t('t_35')}</td><td><span className="tag r">{t('t_36')}</span></td></tr> <tr><td>{t('t_37')}</td><td>{t('t_38')}</td><td>{t('t_39')}</td><td>{t('t_40')}</td><td><span className="tag y">{t('t_41')}</span></td></tr> <tr><td>{t('t_42')}</td><td>{t('t_43')}</td><td>{t('t_44')}</td><td>{t('t_45')}</td><td><span className="tag y">{t('t_46')}</span></td></tr></table></div>
    </div>
  );
}
