import React from 'react';
import { useTranslation } from 'react-i18next';

export default function Templates() {
  const { t } = useTranslation();
  const [templates, setTemplates] = React.useState<any[]>([]);

  React.useEffect(() => {
    const token = localStorage.getItem('token');
    fetch('/api/v1/templates', {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => res.json()).then(setTemplates).catch(console.error);
  }, []);

  return (
    <div className="pg-content">
      <div className="fl"><b style={{ 'fontSize': '18px', 'marginRight': 'auto' }}>{t('t_149')}</b><button className="btn p">{t('t_150')}</button></div> <div className="cols" style={{ 'gridTemplateColumns': '1fr 1.6fr' }}><div className="c"><div className="c row" style={{ 'background': 'var(--prt)' }}><b>{t('t_151')}</b><span className="tag g">{t('t_152')}</span></div><div className="c row"><b>{t('t_153')}</b><span className="tag g">{t('t_154')}</span></div><div className="c row"><b>{t('t_155')}</b><span className="tag">{t('t_156')}</span></div></div> <div className="c tw"><div className="row"><b>{t('t_157')}</b><span><button className="btn s">{t('t_158')}</button> <button className="btn s">{t('t_159')}</button></span></div><table style={{ 'minWidth': '0' }}><tr><th>{t('t_160')}</th><th>{t('t_161')}</th><th>{t('t_162')}</th><th></th></tr><tr><td>{t('t_163')}</td><td><span className="tag b">{t('t_164')}</span></td><td>{t('t_165')}</td><td>{t('t_166')}</td></tr><tr><td>{t('t_167')}</td><td><span className="tag b">{t('t_168')}</span></td><td>{t('t_169')}</td><td>{t('t_170')}</td></tr><tr><td>{t('t_171')}</td><td><span className="tag g">{t('t_172')}</span></td><td>{t('t_173')}</td><td>{t('t_174')}</td></tr></table><button className="btn" style={{ 'marginTop': '8px' }}>{t('t_175')}</button> <button className="btn p" style={{ 'marginTop': '8px' }}>{t('t_176')}</button></div></div>
    </div>
  );
}
