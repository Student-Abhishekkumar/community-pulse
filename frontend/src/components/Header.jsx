import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useLanguage } from '../context/LanguageContext';
import content from '../i18n';
import AuthModal from './AuthModal';

export default function Header() {
  const { user, logout } = useAuth();
  const { lang, toggleLang } = useLanguage();
  const t = content[lang];
  const [modalOpen, setModalOpen] = useState(false);
  const navigate = useNavigate();

  const goToDashboard = () => navigate('/dashboard');

  return (
    <header className="app-header">
      <div className="header-inner">
        <Link to="/" className="logo">
          <span className="logo-icon">💙</span>
          <span className="logo-text">
            Community<span className="logo-accent">Pulse</span>
          </span>
        </Link>
        <div className="header-right">
          <button className="lang-toggle" onClick={toggleLang}>
            {lang === 'en' ? 'EN | हि' : 'हि | EN'}
          </button>
          {user ? (
            <>
              <button className="nav-tab" onClick={goToDashboard}>
                {t.nav.dashboard}
              </button>
              <button className="nav-tab" onClick={logout}>
                Logout
              </button>
            </>
          ) : (
            <button
              className="nav-tab"
              onClick={() => setModalOpen(true)}
            >
              Login / Register
            </button>
          )}
        </div>
      </div>
      {modalOpen && <AuthModal onClose={() => setModalOpen(false)} />}
    </header>
  );
}