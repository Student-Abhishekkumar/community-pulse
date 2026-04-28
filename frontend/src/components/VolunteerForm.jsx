import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createVolunteer } from '../api';

const COMMON_SKILLS = ['plumber', 'nurse', 'doctor', 'cook', 'logistics', 'carpenter', 'nutritionist'];

export default function VolunteerForm() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    name: '',
    phone: '',
    ward: '',
    skills: '',
    availability: '',
  });
  const [success, setSuccess] = useState('');
  const [errors, setErrors] = useState({});

  const mutation = useMutation({
    mutationFn: createVolunteer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['volunteers'] }); // not used yet, but good practice
      setSuccess('Volunteer registered successfully!');
      setForm({ name: '', phone: '', ward: '', skills: '', availability: '' });
      setErrors({});
    },
    onError: (err) => {
      setErrors({ submit: err.message });
    },
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.ward || !form.skills) {
      setErrors({ submit: 'Name, Phone, Ward and Skills are required.' });
      return;
    }
    setSuccess('');
    mutation.mutate({
      name: form.name,
      phone: form.phone,
      ward: form.ward,
      skills: form.skills.split(',').map(s => s.trim()).filter(Boolean),
      availability: form.availability,
    });
  };

  return (
    <div>
      {success && <div className="success-banner">✓ {success}</div>}
      {errors.submit && <div className="error-banner">{errors.submit}</div>}
      <div className="form-card">
        <h2>🙋 Register as a Volunteer</h2>
        <form onSubmit={handleSubmit} className="form-grid">
          <div className="form-group">
            <label>Name *</label>
            <input name="name" value={form.name} onChange={handleChange} placeholder="Your full name" />
          </div>
          <div className="form-group">
            <label>Phone *</label>
            <input name="phone" value={form.phone} onChange={handleChange} placeholder="555-1234" />
          </div>
          <div className="form-group full-width">
            <label>Ward / Area *</label>
            <input name="ward" value={form.ward} onChange={handleChange} placeholder="e.g., Riverside Ward" />
          </div>
          <div className="form-group full-width">
            <label>Skills * (comma‑separated)</label>
            <input name="skills" value={form.skills} onChange={handleChange} placeholder="e.g., plumber, logistics" />
            <small>Suggested: {COMMON_SKILLS.join(', ')}</small>
          </div>
          <div className="form-group full-width">
            <label>Availability</label>
            <input name="availability" value={form.availability} onChange={handleChange} placeholder="e.g., Weekends" />
          </div>
          <button type="submit" className="btn-submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'Registering...' : 'Register'}
          </button>
        </form>
      </div>
    </div>
  );
}