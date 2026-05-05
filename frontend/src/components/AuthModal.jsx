import { useState } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "../firebase";
import { registerProfile } from "../api";
import { useNavigate } from "react-router-dom";

export default function AuthModal({ onClose, onSuccess }) {
  const [activeTab, setActiveTab] = useState("login");
  const navigate = useNavigate();

  // Login fields
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  // Register fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [ward, setWard] = useState("");
  const [role, setRole] = useState("volunteer");
  const [orgName, setOrgName] = useState("");
  const [skills, setSkills] = useState("");
  const [regError, setRegError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    try {
      await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
      onClose();
      navigate("/dashboard");
    } catch (err) {
      setLoginError(err.message);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setRegError("");

    if (role === "volunteer" && !skills) {
      setRegError("Please enter your skills.");
      return;
    }
    if (role === "organization" && !orgName) {
      setRegError("Please enter your organization name.");
      return;
    }

    try {
      const userCred = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      await registerProfile({
        name,
        phone,
        ward,
        role,
        skills: role === "volunteer" ? skills : undefined,
        orgName: role === "organization" ? orgName : undefined,
      });
      onSuccess?.("Account created successfully! You can now browse needs and events.");
      // Stay on homepage, modal closes via onClose call from parent
    } catch (err) {
      setRegError(err.message);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          ✕
        </button>

        <div className="modal-tabs">
          <button
            className={`tab-btn ${activeTab === "login" ? "active" : ""}`}
            onClick={() => setActiveTab("login")}
          >
            Login
          </button>
          <button
            className={`tab-btn ${activeTab === "register" ? "active" : ""}`}
            onClick={() => setActiveTab("register")}
          >
            Register
          </button>
        </div>

        {activeTab === "login" ? (
          <form onSubmit={handleLogin} className="auth-form">
            <input
              type="email"
              placeholder="Email"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              required
            />
            <button type="submit">Log in</button>
            {loginError && <p className="error">{loginError}</p>}
          </form>
        ) : (
          <form onSubmit={handleRegister} className="auth-form">
            <input
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <input
              placeholder="Phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
            <input
              placeholder="Ward / Area"
              value={ward}
              onChange={(e) => setWard(e.target.value)}
              required
            />

            <select value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="volunteer">I am a volunteer</option>
              <option value="organization">
                I represent an organization
              </option>
            </select>

            {role === "organization" && (
              <input
                placeholder="Organization Name"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                required
              />
            )}
            {role === "volunteer" && (
              <input
                placeholder="Skills (comma separated)"
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                required
              />
            )}

            <button type="submit">Register</button>
            {regError && <p className="error">{regError}</p>}
          </form>
        )}
      </div>
    </div>
  );
}