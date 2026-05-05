import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../AuthContext';
import { fetchNeeds, fetchEvents, fetchOwnProfile, registerForEvent, fetchWithAuth } from '../api';
import { Link } from 'react-router-dom';

export default function VolunteerDashboard() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const { data: needs } = useQuery({ queryKey: ['needs'], queryFn: fetchNeeds });
  const { data: events } = useQuery({ queryKey: ['events'], queryFn: fetchEvents });
  const { data: me } = useQuery({ queryKey: ['me'], queryFn: fetchOwnProfile });

  // Mock assignments (since we don't have a full assignment system, we'll use events as assignments)
  const myAssignments = events?.filter(e => e.registeredVolunteers?.some(v => v.uid === profile.uid)) || [];
  const myApplications = []; // we don't have a separate applications collection yet, placeholder

  const registerMutation = useMutation({
    mutationFn: registerForEvent,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['events'] }),
  });

  return (
    <div className="dashboard">
      <h2>Volunteer Dashboard</h2>

      {/* Summary cards */}
      <div className="summary-row">
        <div className="summary-card">
          <span className="summary-number">{myAssignments.length}</span>
          <span className="summary-label">Tasks Completed</span>
        </div>
        <div className="summary-card">
          <span className="summary-number">0</span>
          <span className="summary-label">Hours Served</span>
        </div>
        <div className="summary-card">
          <span className="summary-number">0</span>
          <span className="summary-label">Applications Pending</span>
        </div>
        <div className="summary-card">
          <span className="summary-number">{events?.filter(e => e.registeredVolunteers?.some(v => v.uid === profile.uid)).length || 0}</span>
          <span className="summary-label">Events Registered</span>
        </div>
      </div>

      {/* My Applications (placeholder) */}
      <section>
        <h3>My Applications</h3>
        <p>No applications yet.</p>
      </section>

      {/* My Assignments (events likely) */}
      <section>
        <h3>My Active Assignments</h3>
        {myAssignments.map(event => (
          <div key={event.id} className="card">
            <h4>{event.title}</h4>
            <p>{event.area} – {event.date} {event.time}</p>
            {/* Status stepper could be added */}
            <select disabled defaultValue="assigned">
              <option value="assigned">Assigned</option>
              <option value="travelling">Travelling</option>
              <option value="on-site">On-site</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        ))}
      </section>

      {/* My Events */}
      <section>
        <h3>My Events</h3>
        {events?.filter(e => e.registeredVolunteers?.some(v => v.uid === profile.uid)).map(event => (
          <div key={event.id} className="card">
            <h4>{event.title}</h4>
            <p>{event.date} – {event.location}</p>
            <span className={`status-badge ${event.status}`}>{event.status}</span>
          </div>
        ))}
        {(!events || events.length === 0) && <p>No events yet.</p>}
      </section>
    </div>
  );
}