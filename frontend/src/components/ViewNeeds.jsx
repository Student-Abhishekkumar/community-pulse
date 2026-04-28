import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchNeeds } from '../api';
import NeedCard from './NeedCard';

const CATEGORIES = [
  { value: 'all', label: 'All' },
  { value: 'health', label: 'Health' },
  { value: 'water', label: 'Water' },
  { value: 'education', label: 'Education' },
  { value: 'food', label: 'Food' },
];

export default function ViewNeeds({ onSelectNeed }) {
  const [activeFilter, setActiveFilter] = useState('all');

  const {
    data: needs,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['needs'],
    queryFn: fetchNeeds,
  });

  const filteredNeeds = useMemo(() => {
    if (!needs) return [];
    if (activeFilter === 'all') return needs;
    return needs.filter((n) => n.category === activeFilter);
  }, [needs, activeFilter]);

  if (isLoading) return <div className="status-message">Loading needs...</div>;
  if (isError) return <div className="status-message error">Error: {error.message}</div>;

  return (
    <div>
      {/* Filter bar */}
      <div className="filter-bar">
        <label>Filter:</label>
        <div className="filter-pills">
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              className={`filter-pill ${activeFilter === c.value ? 'active' : ''}`}
              onClick={() => setActiveFilter(c.value)}
            >
              {c.label}
            </button>
          ))}
        </div>
        <span className="result-count">
          {filteredNeeds.length} need{filteredNeeds.length !== 1 ? 's' : ''} found
        </span>
      </div>

      {/* Needs list */}
      {filteredNeeds.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <p>No needs found for this category.</p>
        </div>
      ) : (
        <div className="needs-list">
          {filteredNeeds.map((need) => (
            <div
              key={need.id}
              onClick={() => onSelectNeed(need.id)}
              style={{ cursor: 'pointer' }}
            >
              <NeedCard need={need} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}