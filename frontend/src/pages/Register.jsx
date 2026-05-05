import { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { registerProfile } from '../api';
import { useNavigate, Link } from 'react-router-dom';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [ward, setWard] = useState('');
  const [role, setRole] = useState('volunteer');
  const [orgName, setOrgName] = useState('');
  const [skills, setSkills] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      await registerProfile({
        name, phone, ward, role, skills, orgName: role === 'organization' ? orgName : undefined
      });
      navigate('/');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="auth-container">
      <h2>Register</h2>
      <form onSubmit={handleSubmit}>
        <input placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} required />
        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
        <input placeholder="Phone" value={phone} onChange={e => setPhone(e.target.value)} required />
        <input placeholder="Ward / Area" value={ward} onChange={e => setWard(e.target.value)} required />

        <select value={role} onChange={e => setRole(e.target.value)}>
          <option value="volunteer">I am a volunteer</option>
          <option value="organization">I represent an organization</option>
        </select>

        {role === 'organization' && (
          <input placeholder="Organization Name" value={orgName} onChange={e => setOrgName(e.target.value)} required />
        )}
        {role === 'volunteer' && (
          <input placeholder="Skills (comma separated)" value={skills} onChange={e => setSkills(e.target.value)} required />
        )}

        <button type="submit">Register</button>
        {error && <p className="error">{error}</p>}
      </form>
      <p>Already have an account? <Link to="/login">Log in</Link></p>
    </div>
  );
}