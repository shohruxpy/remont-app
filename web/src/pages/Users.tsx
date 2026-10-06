import React from 'react';
import { useTranslation } from 'react-i18next';

export default function Users() {
  const { t } = useTranslation();
  const [users, setUsers] = React.useState<any[]>([]);

  React.useEffect(() => {
    const token = localStorage.getItem('token');
    fetch('/api/v1/users', {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => res.json()).then(setUsers).catch(console.error);
  }, []);

  return (
    <div className="pg-content">
      <div className="fl"><b style={{ 'fontSize': '18px', 'marginRight': 'auto' }}>{t('t_177')}</b><button className="btn p">{t('t_178')}</button></div> <div className="c tw"><table><tr><th>{t('t_179')}</th><th>{t('t_180')}</th><th>{t('t_181')}</th><th>{t('t_182')}</th><th></th></tr> <tr><td>{t('t_183')}</td><td>{t('t_184')}</td><td><span className="tag b">{t('t_185')}</span></td><td><span className="tag g">{t('t_186')}</span></td><td><button className="btn s">{t('t_187')}</button> <button className="btn s">{t('t_188')}</button></td></tr> <tr><td>{t('t_189')}</td><td>{t('t_190')}</td><td>{t('t_191')}</td><td><span className="tag g">{t('t_192')}</span></td><td><button className="btn s">{t('t_193')}</button> <button className="btn s">{t('t_194')}</button> <button className="btn s">{t('t_195')}</button></td></tr> <tr><td>{t('t_196')}</td><td>{t('t_197')}</td><td>{t('t_198')}</td><td><span className="tag r">{t('t_199')}</span></td><td><button className="btn s">{t('t_200')}</button> <button className="btn s">{t('t_201')}</button></td></tr></table></div>
    </div>
  );
}
