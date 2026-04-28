import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createNeed } from '../api';

const CATEGORIES = [
  { value: 'health', label: 'Health' },
  { value: 'water', label: 'Water' },
  { value: 'education', label: 'Education' },
  { value: 'food', label: 'Food' },
];

export default function SubmitForm() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    title: '',
    category: 'health',
    area: '',
    affectedCount: '',
    description: '',
  });
  const [errors, setErrors] = useState({});
  const [aiResult, setAiResult] = useState(null);  // holds the AI insight after submission

  const mutation = useMutation({
    mutationFn: createNeed,
    onSuccess: (newNeed) => {
      queryClient.invalidateQueries({ queryKey: ['needs'] });
      // The API now returns the AI fields directly
      setAiResult({
        urgencyScore: newNeed.urgencyScore,
        priorityLabel: newNeed.priorityLabel,
        aiInsight: newNeed.aiInsight,
      });
      // Reset the form
      setForm({ title: '', category: 'health', area: '', affectedCount: '', description: '' });
      setErrors({});
    },
    onError: (err) => {
      setErrors({ submit: err.message });
    },
  });

  const validate = () => {
    const errs = {};
    if (!form.title.trim()) errs.title = 'Title is required.';
    if (!form.area.trim()) errs.area = 'Area / Ward is required.';
    if (!form.affectedCount || Number(form.affectedCount) < 1)
      errs.affectedCount = 'Enter a valid number of people.';
    if (!form.description.trim()) errs.description = 'Description is required.';
    return errs;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    // Clear previous AI result before new submission
    setAiResult(null);
    setErrors({});
    mutation.mutate({
      title: form.title.trim(),
      category: form.category,
      area: form.area.trim(),
      affectedCount: Number(form.affectedCount),
      description: form.description.trim(),
    });
  };

  const handleDismissAi = () => setAiResult(null);

  return (
    <div>
      {/* ── Loading / Success messages ── */}
      {mutation.isPending && (
        <div className="ai-loading-banner">
          <span className="spinner">⏳</span> Gemini is analysing this need...
        </div>
      )}

      {mutation.isSuccess && (
        <div className="success-banner">
          <span className="checkmark">✓</span> Need submitted successfully!
          <button
            onClick={() => {
              /* Optional: dismiss success message but keep AI card? We'll just let it remain */
            }}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}
            aria-label="Dismiss"
          >
            {/* no dismiss unless we want, but AI card has own dismiss */}
          </button>
        </div>
      )}

      {errors.submit && <div className="error-banner">{errors.submit}</div>}

      {/* ── AI Insight card (shown after successful submission) ── */}
      {aiResult && (
        <div className="ai-insight-card">
          <div className="ai-card-header">
            <h3>🤖 AI Analysis</h3>
            <button onClick={handleDismissAi} className="ai-dismiss-btn">✕</button>
          </div>
          <div className="ai-card-body">
            <div className="ai-score">
              <span className="ai-score-label">Urgency Score</span>
              <span className="ai-score-value">{aiResult.urgencyScore}/100</span>
              <span className={`priority-badge ${aiResult.priorityLabel.toLowerCase()}`}>
                {aiResult.priorityLabel}
              </span>
            </div>
            <p className="ai-insight-text">{aiResult.aiInsight}</p>
          </div>
        </div>
      )}

      {/* ── Submission Form ── */}
      <div className="form-card">
        <h2>📝 Submit a Community Need</h2>
        <form onSubmit={handleSubmit} className="form-grid" noValidate>
          {/* Title */}
          <div className="form-group full-width">
            <label htmlFor="title">Title<span className="required">*</span></label>
            <input id="title" name="title" type="text" value={form.title} onChange={handleChange} placeholder="e.g., Clean Water Shortage" />
            {errors.title && <span className="field-error">{errors.title}</span>}
          </div>

          {/* Category */}
          <div className="form-group">
            <label htmlFor="category">Category<span className="required">*</span></label>
            <select id="category" name="category" value={form.category} onChange={handleChange}>
              {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>

          {/* Area */}
          <div className="form-group">
            <label htmlFor="area">Area / Ward<span className="required">*</span></label>
            <input id="area" name="area" type="text" value={form.area} onChange={handleChange} placeholder="e.g., Riverside Ward" />
            {errors.area && <span className="field-error">{errors.area}</span>}
          </div>

          {/* Affected Count */}
          <div className="form-group">
            <label htmlFor="affectedCount">People Affected<span className="required">*</span></label>
            <input id="affectedCount" name="affectedCount" type="number" min="1" value={form.affectedCount} onChange={handleChange} placeholder="e.g., 150" />
            {errors.affectedCount && <span className="field-error">{errors.affectedCount}</span>}
          </div>

          {/* Description */}
          <div className="form-group full-width">
            <label htmlFor="description">Description<span className="required">*</span></label>
            <textarea id="description" name="description" value={form.description} onChange={handleChange} placeholder="Describe the situation..." />
            {errors.description && <span className="field-error">{errors.description}</span>}
          </div>

          <button type="submit" className="btn-submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'Submitting...' : 'Submit Need'}
          </button>
        </form>
      </div>
    </div>
  );
}