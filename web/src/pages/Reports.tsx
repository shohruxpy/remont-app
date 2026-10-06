import React from 'react';
import { useTranslation } from 'react-i18next';

export default function Reports() {
  const { t } = useTranslation();

  const downloadReport = (name: string) => {
    const token = localStorage.getItem('token');
    fetch(`/api/v1/reports/${name}.xlsx`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.blob())
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${name}.xlsx`;
        a.click();
        window.URL.revokeObjectURL(url);
      })
      .catch(console.error);
  };

  return (
    <div className="pg-content">
      <div className="fl"><b style={{ 'fontSize': '18px', 'marginRight': 'auto' }}>{t('t_223')}</b></div> <div className="cols"><div className="c"><b>{t('t_224')}</b><div className="mu" style={{ 'margin': '6px 0' }}>{t('t_225')}</div><button className="btn p" onClick={() => downloadReport('report1')}>{t('t_226')}</button></div> <div className="c"><b>{t('t_227')}</b><div className="mu" style={{ 'margin': '6px 0' }}>{t('t_228')}</div><button className="btn p" onClick={() => downloadReport('report2')}>{t('t_229')}</button></div> <div className="c"><b>{t('t_230')}</b><div className="mu" style={{ 'margin': '6px 0' }}>{t('t_231')}</div><button className="btn p" onClick={() => downloadReport('report3')}>{t('t_232')}</button></div> <div className="c"><b>{t('t_233')}</b><div className="mu" style={{ 'margin': '6px 0' }}>{t('t_234')}</div><button className="btn p" onClick={() => downloadReport('report4')}>{t('t_235')}</button></div></div>
    </div>
  );
}
