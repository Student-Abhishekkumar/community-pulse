export default function Header({ activeView, onViewChange }) {
  return (
    <header className="app-header">
      <div className="header-inner">
        <div className="logo">
          <div className="logo-icon">💙</div>
          CommunityPulse
        </div>
        <nav className="nav-tabs">
          <button className={`nav-tab ${activeView === 'submit' ? 'active' : ''}`} onClick={() => onViewChange('submit')}>
            ✏️ Submit Need
          </button>
          <button className={`nav-tab ${activeView === 'needs' ? 'active' : ''}`} onClick={() => onViewChange('needs')}>
            📋 View Needs
          </button>
          <button className={`nav-tab ${activeView === 'volunteer' ? 'active' : ''}`} onClick={() => onViewChange('volunteer')}>
            🙋 Volunteer
          </button>
        </nav>
      </div>
    </header>
  );
}