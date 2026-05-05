import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchUsers,
  fetchNeeds,
  fetchEvents,
  approveUser,
  rejectUser,
  updateEventStatus,
  fetchWithAuth,
} from '../api';

export default function AdminDashboard() {
  const [tab, setTab] = useState('overview');
  const queryClient = useQueryClient();

  const { data: users } = useQuery({ queryKey: ['users'], queryFn: fetchUsers });
  const { data: needs } = useQuery({ queryKey: ['needs'], queryFn: fetchNeeds });
  const { data: events } = useQuery({ queryKey: ['events'], queryFn: fetchEvents });

  // ── Mutations ────────────────────────────────────────
  const approveMut = useMutation({
    mutationFn: approveUser,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });
  const rejectMut = useMutation({
    mutationFn: ({ uid, reason }) => rejectUser(uid, reason),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });

  // Need status change (admin)
  const needStatusMut = useMutation({
    mutationFn: ({ needId, status }) =>
      fetchWithAuth(`/needs/${needId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['needs'] }),
  });

  // Event delete (admin)
  const deleteEventMut = useMutation({
    mutationFn: (eventId) =>
      fetchWithAuth(`/events/${eventId}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['events'] }),
  });

  // Event close via existing updateEventStatus
  const eventCloseMut = useMutation({
    mutationFn: ({ eventId, status }) => updateEventStatus(eventId, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['events'] }),
  });

  // ── Filters & data ─────────────────────────────────
  const [orgStatusFilter, setOrgStatusFilter] = useState('all');
  const [volStatusFilter, setVolStatusFilter] = useState('all');
  const [needStatusFilter, setNeedStatusFilter] = useState('all');

  const filteredOrgs = users?.filter(u => u.role === 'organisation' && (orgStatusFilter === 'all' || u.status === orgStatusFilter)) || [];
  const allOrgs = users?.filter(u => u.role === 'organisation') || [];
  const allVols = users?.filter(u => u.role === 'volunteer') || [];
  const filteredVols = allVols.filter(v => volStatusFilter === 'all' || v.status === volStatusFilter);
  const filteredNeeds = needs?.filter(n => needStatusFilter === 'all' || n.status === needStatusFilter) || [];

  const pendingOrgs = allOrgs.filter(u => u.status === 'pending');
  const pendingVols = allVols.filter(u => u.status === 'pending');

  // ── Render ──────────────────────────────────────────
  return (
    <div className="dashboard admin-dashboard">
      <h2>Admin Dashboard</h2>

      {/* Summary cards */}
      <div className="summary-row">
        <div className="summary-card"><span className="summary-number">{needs?.length || 0}</span> Total Needs</div>
        <div className="summary-card"><span className="summary-number">{allVols.length}</span> Total Volunteers</div>
        <div className="summary-card"><span className="summary-number">{allOrgs.length}</span> Total Organizations</div>
        <div className="summary-card"><span className="summary-number">{pendingOrgs.length + pendingVols.length}</span> Pending Approvals</div>
        <div className="summary-card"><span className="summary-number">{events?.length || 0}</span> Events Created</div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        {['overview', 'organisations', 'volunteers', 'needs', 'events'].map(t => (
          <button key={t} className={`tab-btn ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab: Overview */}
      {tab === 'overview' && (
        <div>
          <h3>Recent Activity</h3>
          <div className="activity-feed">
            <p className="empty-state">No recent activity to display.</p>
            {/* Future: real activity log */}
          </div>
        </div>
      )}

      {/* Tab: Organisations */}
      {tab === 'organisations' && (
        <div>
          <h3>Organisations</h3>
          <div className="filter-bar">
            <label>Status:</label>
            <select value={orgStatusFilter} onChange={e => setOrgStatusFilter(e.target.value)}>
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          {filteredOrgs.length === 0 ? (
            <p className="empty-state">No organisations found.</p>
          ) : (
            <table>
              <thead>
                <tr><th>Name</th><th>Email</th><th>Ward</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {filteredOrgs.map(org => (
                  <tr key={org.id}>
                    <td>{org.orgName}</td>
                    <td>{org.email}</td>
                    <td>{org.ward}</td>
                    <td><span className={`status-badge ${org.status}`}>{org.status}</span></td>
                    <td>
                      {org.status === 'pending' && (
                        <div className="actions-cell">
                          <button className="btn-approve" onClick={() => approveMut.mutate(org.id)}>Approve</button>
                          <button className="btn-reject" onClick={() => rejectMut.mutate({ uid: org.id, reason: '' })}>Reject</button>
                        </div>
                      )}
                      {org.status === 'approved' && <button className="btn-secondary">Suspend</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Tab: Volunteers */}
      {tab === 'volunteers' && (
        <div>
          <h3>Volunteers</h3>
          <div className="filter-bar">
            <label>Status:</label>
            <select value={volStatusFilter} onChange={e => setVolStatusFilter(e.target.value)}>
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          {filteredVols.length === 0 ? (
            <p className="empty-state">No volunteers found.</p>
          ) : (
            <table>
              <thead>
                <tr><th>Name</th><th>Email</th><th>Ward</th><th>Skills</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {filteredVols.map(vol => (
                  <tr key={vol.id}>
                    <td>{vol.name}</td>
                    <td>{vol.email}</td>
                    <td>{vol.ward}</td>
                    <td>{vol.skills?.join(', ')}</td>
                    <td><span className={`status-badge ${vol.status}`}>{vol.status}</span></td>
                    <td>
                      {vol.status === 'pending' && (
                        <div className="actions-cell">
                          <button className="btn-approve" onClick={() => approveMut.mutate(vol.id)}>Approve</button>
                          <button className="btn-reject" onClick={() => rejectMut.mutate({ uid: vol.id, reason: '' })}>Reject</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Tab: Needs */}
      {tab === 'needs' && (
        <div>
          <h3>All Needs</h3>
          <div className="filter-bar">
            <label>Status:</label>
            <select value={needStatusFilter} onChange={e => setNeedStatusFilter(e.target.value)}>
              <option value="all">All</option>
              <option value="open">Open</option>
              <option value="closed">Closed</option>
              <option value="fulfilled">Fulfilled</option>
            </select>
          </div>
          {filteredNeeds.length === 0 ? (
            <p className="empty-state">No needs found.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Area</th>
                  <th>Urgency</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredNeeds.map(need => (
                  <tr key={need.id}>
                    <td className="need-title-cell">{need.title}</td>
                    <td><span className={`badge badge-${need.category}`}>{need.category}</span></td>
                    <td>{need.area}</td>
                    <td>{need.urgencyScore ? `${need.urgencyScore}/100` : '-'}</td>
                    <td><span className={`status-badge ${need.status || 'open'}`}>{need.status || 'open'}</span></td>
                    <td>
                      <select
                        value={need.status || 'open'}
                        onChange={e => {
                          const newStatus = e.target.value;
                          needStatusMut.mutate({ needId: need.id, status: newStatus });
                        }}
                        className="status-select"
                      >
                        <option value="open">Open</option>
                        <option value="closed">Closed</option>
                        <option value="fulfilled">Fulfilled</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Tab: Events */}
      {tab === 'events' && (
        <div>
          <h3>All Events</h3>
          {!events || events.length === 0 ? (
            <p className="empty-state">No events found.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Organisation</th>
                  <th>Date</th>
                  <th>Location</th>
                  <th>Volunteers</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {events.map(event => {
                  const org = allOrgs.find(o => o.id === event.createdBy);
                  return (
                    <tr key={event.id}>
                      <td>{event.title}</td>
                      <td>{org?.orgName || 'Unknown'}</td>
                      <td>{event.date}</td>
                      <td>{event.location}</td>
                      <td>{event.registeredVolunteers?.length || 0}/{event.maxVolunteers || '∞'}</td>
                      <td><span className={`status-badge ${event.status}`}>{event.status}</span></td>
                      <td className="actions-cell">
                        {event.status !== 'closed' && (
                          <button
                            className="btn-secondary"
                            onClick={() => eventCloseMut.mutate({ eventId: event.id, status: 'closed' })}
                            disabled={eventCloseMut.isLoading}
                          >
                            Close
                          </button>
                        )}
                        <button
                          className="btn-reject"
                          onClick={() => {
                            if (window.confirm('Are you sure you want to delete this event?')) {
                              deleteEventMut.mutate(event.id);
                            }
                          }}
                          disabled={deleteEventMut.isLoading}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      <style jsx>{`
        .actions-cell {
          display: flex;
          gap: 6px;
        }
        .status-select {
          padding: 4px 8px;
          border-radius: 4px;
          border: 1px solid #ccc;
          background: white;
          cursor: pointer;
        }
        .empty-state {
          text-align: center;
          padding: 20px;
          color: #888;
        }
        .activity-feed {
          background: white;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.08);
        }
      `}</style>
    </div>
  );
}