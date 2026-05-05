import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../AuthContext";
import { useNavigate } from "react-router-dom";
import { fetchPublicNeeds, fetchPublicStats } from "../api";
import AuthModal from "../components/AuthModal";
import content from "../i18n";

// Simple urgency bar
const UrgencyBar = ({ score }) => (
  <div className="urgency-bar">
    <div className="urgency-fill" style={{ width: `${score}%` }}></div>
  </div>
);

export default function Homepage() {
  const { lang } = useLanguage();
  const t = content[lang];
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const needsRef = useRef(null);

  // Auth modal (for "Volunteer Now" and header buttons)
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Join modal (for non‑logged‑in users who click "I want to help" on a need)
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [selectedNeedId, setSelectedNeedId] = useState(null);

  // Success message after registration
  const [successMsg, setSuccessMsg] = useState("");

  // Data from public endpoints
  const { data: needs } = useQuery({
    queryKey: ["public-needs"],
    queryFn: fetchPublicNeeds,
  });
  const { data: stats } = useQuery({
    queryKey: ["public-stats"],
    queryFn: fetchPublicStats,
  });

  const handleHelpClick = (needId) => {
    if (!user) {
      setSelectedNeedId(needId);
      setShowJoinModal(true);
    } else if (profile?.status !== "approved") {
      alert(t.pendingToast);
    } else {
      navigate(`/needs/${needId}`);
    }
  };

  const scrollToNeeds = () =>
    needsRef.current?.scrollIntoView({ behavior: "smooth" });

  // ───── render ─────
  return (
    <div className="homepage">
      {/* Hero */}
      <section className="hero">
        <div className="hero-content">
          <h1>{t.heroTitle}</h1>
          <p className="hero-sub">{t.heroSub}</p>
          <div className="hero-ctas">
            <button onClick={scrollToNeeds}>{t.heroCta1}</button>
            <button onClick={() => setShowAuthModal(true)}>
              {t.heroCta2}
            </button>
          </div>
        </div>
      </section>

      {/* Success message */}
      {successMsg && (
        <div className="success-banner">
          <span className="checkmark">✓</span> {successMsg}
          <button
            onClick={() => setSuccessMsg("")}
            style={{
              marginLeft: "auto",
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "1.2rem",
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* How It Works */}
      <section className="how-it-works">
        <h2>{t.howTitle}</h2>
        <div className="steps-grid">
          {t.howSteps.map((step, idx) => (
            <div key={idx} className="step-card">
              <span className="step-badge">{step.badge}</span>
              <h3>{step.title}</h3>
              <p>{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Needs */}
      <section ref={needsRef} className="public-needs">
        <h2>{t.needsTitle}</h2>
        <div className="needs-grid">
          {needs?.map((need) => (
            <div key={need.id} className="need-card public">
              <span className={`badge badge-${need.category}`}>
                {need.category}
              </span>
              <h3>{need.title}</h3>
              <p className="need-meta">
                {need.area} · {need.affectedCount} affected
              </p>
              {need.urgencyScore != null && (
                <UrgencyBar score={need.urgencyScore} />
              )}
              {need.aiInsight && (
                <p className="ai-snippet">{need.aiInsight.split(".")[0]}.</p>
              )}
              <button onClick={() => handleHelpClick(need.id)}>
                {t.needsHelpBtn}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Stats Banner */}
      <section className="stats-banner">
        <div className="stat">
          <span className="stat-number">{stats?.totalNeeds || 0}</span>
          <span className="stat-label">{t.statLabels[0]}</span>
        </div>
        <div className="stat">
          <span className="stat-number">{stats?.totalVolunteers || 0}</span>
          <span className="stat-label">{t.statLabels[1]}</span>
        </div>
        <div className="stat">
          <span className="stat-number">{stats?.wardsCovered || 0}</span>
          <span className="stat-label">{t.statLabels[2]}</span>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-left">
          <span className="logo">
            Community<span>Pulse</span>
          </span>
          <p>{t.footerMission}</p>
        </div>
        <div className="footer-center">
          <a href="#needs" onClick={scrollToNeeds}>
            Browse Needs
          </a>
          <a href="/register">Register</a>
          <a href="/login">Login</a>
        </div>
        <div className="footer-right">
          <p>{t.footerBuilt}</p>
          <p>{t.footerCopy}</p>
        </div>
      </footer>

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onSuccess={(msg) => {
            setShowAuthModal(false);
            setSuccessMsg(msg);
          }}
        />
      )}

      {/* Join modal */}
      {showJoinModal && (
        <div className="modal-overlay" onClick={() => setShowJoinModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close"
              onClick={() => setShowJoinModal(false)}
            >
              ✕
            </button>
            <h2>{t.joinModalTitle}</h2>
            <p>{t.joinModalBody}</p>
            <div className="modal-actions">
              <button onClick={() => navigate("/login")}>
                {t.modalLogin}
              </button>
              <button onClick={() => navigate("/register")}>
                {t.modalRegister}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}