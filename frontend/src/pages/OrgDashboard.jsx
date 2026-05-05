import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../AuthContext';
import { fetchUsers, fetchNeeds, fetchEvents, createEvent, approveUser, rejectUser, updateEventStatus, fetchWithAuth } from '../api';

export default function OrgDashboard() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [showEventForm, setShowEventForm] = useState(false);
  const [eventForm, setEventForm] = useState({ title: '', description: '', date: '', time: '', location: '', ward: '', category: 'health', maxVolunteers: '' });

  const { data: users } = useQuery({ queryKey: ['users'], queryFn: fetchUsers });
  const { data: needs } = useQuery({ queryKey: ['needs'], queryFn: fetchNeeds });
  const { data: events } = useQuery({ queryKey: ['events'], queryFn: fetchEvents });

  const myNeeds = needs?.filter(n => n.createdBy === profile.uid) || [];
  const myEvents = events?.filter(e => e.createdBy === profile.uid) || [];
  const pendingVolunteers = users?.filter(u => u.role === 'volunteer' && u.status === 'pending') || [];

  // Actions
  const approveMut = useMutation({
    mutationFn: approveUser,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });
  const rejectMut = useMutation({
    mutationFn: ({ uid, reason }) => rejectUser(uid, reason),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });
  const eventCreateMut = useMutation({
    mutationFn: createEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      setShowEventForm(false);
    },
  });
  const statusMut = useMutation({
    mutationFn: ({ eventId, status }) => updateEventStatus(eventId, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['events'] }),
  });

  return (
    <div className="dashboard">
      <h2>Organization Dashboard</h2>

      {/* Summary */}
      <div className="summary-row">
        <div className="summary-card">
          <span className="summary-number">{myNeeds.length}</span>
          <span>Needs Posted</span>
        </div>
        <div className="summary-card">
          <span className="summary-number">{myEvents.length}</span>
          <span>Events Created</span>
        </div>
        <div className="summary-card">
          <span className="summary-number">{users?.filter(u => u.status === 'approved' && u.approvedBy === profile.uid).length || 0}</span>
          <span>Volunteers Approved</span>
        </div>
        <div className="summary-card">
          <span className="summary-number">0</span>
          <span>Active Assignments</span>
        </div>
      </div>

      {/* My Needs */}
      <section>
        <h3>My Needs</h3>
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Category</th>
              <th>Urgency</th>
              <th>Volunteers</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {myNeeds.map(need => (
              <tr key={need.id}>
                <td><Link to={`/needs/${need.id}`}>{need.title}</Link></td>
                <td><span className={`badge badge-${need.category}`}>{need.category}</span></td>
                <td>{need.urgencyScore || '-'}</td>
                <td>0 / 0</td>
                <td>{need.status || 'open'}</td>
                <td><button>Find Matches</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* My Events */}
      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <h3>My Events</h3>
          <button onClick={() => setShowEventForm(!showEventForm)}>{showEventForm ? 'Cancel' : '+ Create Event'}</button>
        </div>
        {showEventForm && (
          <form onSubmit={e => { e.preventDefault(); eventCreateMut.mutate(eventForm); }}>
            {/* same event form as before, skip for brevity */}
            <input placeholder="Title" value={eventForm.title} onChange={e => setEventForm({...eventForm, title: e.target.value})} required />
            {/* ... other fields ... */}
            <button type="submit">Create</button>
          </form>
        )}
        {myEvents.map(event => (
          <div key={event.id} className="card">
            <h4>{event.title}</h4>
            <p>{event.date} - {event.location}</p>
            <p>Registered: {event.registeredVolunteers?.length || 0} / {event.maxVolunteers || '∞'}</p>
            <select value={event.status} onChange={e => statusMut.mutate({ eventId: event.id, status: e.target.value })}>
              <option value="open">Open</option>
              <option value="closed">Closed</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        ))}
      </section>

      {/* Pending Volunteer Approvals */}
      {pendingVolunteers.length > 0 && (
        <section>
          <h3>Pending Volunteer Approvals</h3>
          <table>
            <thead>
              <tr><th>Name</th><th>Phone</th><th>Ward</th><th>Skills</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {pendingVolunteers.map(vol => (
                <tr key={vol.id}>
                  <td>{vol.name}</td>
                  <td>{vol.phone}</td>
                  <td>{vol.ward}</td>
                  <td>{vol.skills?.join(', ')}</td>
                  <td>
                    <button onClick={() => approveMut.mutate(vol.id)}>Approve</button>
                    <button onClick={() => rejectMut.mutate({ uid: vol.id, reason: '' })}>Reject</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}