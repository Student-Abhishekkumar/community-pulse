import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchNeed, fetchMatches } from '../api';
import CategoryBadge from './CategoryBadge';

export default function NeedDetail({ needId, onBack }) {
  const queryClient = useQueryClient();
  const [showMatches, setShowMatches] = useState(false);

  const {
    data: need,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['need', needId],
    queryFn: () => fetchNeed(needId),
    enabled: !!needId,
  });

  const {
    data: matches,
    isFetching: matchesLoading,
    isError: matchesError,
    error: matchesErr,
    refetch: fetchMatchesData,
  } = useQuery({
    queryKey: ['matches', needId],
    queryFn: () => fetchMatches(needId),
    enabled: false,               // Only when we click the button
  });

  const handleFindMatches = () => {
    setShowMatches(true);
    fetchMatchesData();
  };

  if (isLoading) return <div className="status-message">Loading need...</div>;
  if (isError) return <div className="status-message error">Error: {error.message}</div>;
  if (!need) return null;

  return (
    <div>
      <button onClick={onBack} className="back-button">← Back to needs</button>

      <div className="need-detail-card">
        <div className="need-card-header">
          <h2>{need.title}</h2>
          <CategoryBadge category={need.category} />
        </div>
        <div className="need-card-meta">
          <span>📍 {need.area}</span>
          <span>👥 {need.affectedCount} affected</span>
        </div>
        <p className="need-card-desc">{need.description}</p>

        {!showMatches && (
          <button
            className="btn-submit"
            onClick={handleFindMatches}
            disabled={matchesLoading}
          >
            🔍 Find matching volunteers
          </button>
        )}

        {showMatches && matchesLoading && (
          <div className="ai-loading-banner">
            <span className="spinner">⏳</span> Gemini is finding the best volunteers...
          </div>
        )}

        {showMatches && !matchesLoading && matchesError && (
          <div className="error-banner">Error: {matchesErr.message}</div>
        )}

        {showMatches && !matchesLoading && !matchesError && matches && (
          <div className="matches-section">
            <h3>🎯 Matched Volunteers</h3>
            {matches.length === 0 && <p>No volunteers available.</p>}
            {matches.map(match => (
              <div key={match.volunteerId} className="match-card">
                <div className="match-header">
                  <span className="match-name">{match.volunteerName}</span>
                  <span className="match-score">{match.matchScore}%</span>
                </div>
                <div className="match-reason">“{match.matchReason}”</div>
                <div className="match-meta">
                  📞 {match.volunteerPhone} · 🏘️ {match.volunteerWard} · Skills: {match.volunteerSkills?.join(', ')}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}