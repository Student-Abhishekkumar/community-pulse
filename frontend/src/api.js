import { auth } from './firebase';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

async function getToken() {
  const user = auth.currentUser;
  if (!user) return null;
  return user.getIdToken();
}

export async function fetchWithAuth(url, options = {}) {
  const token = await getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
  const res = await fetch(`${API_BASE}${url}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

// Existing functions updated to use fetchWithAuth
export const fetchNeeds = () => fetchWithAuth('/needs');
export const createNeed = (data) => fetchWithAuth('/needs', {
  method: 'POST', body: JSON.stringify(data),
});
export const fetchNeed = (id) => fetchWithAuth(`/needs/${id}`);
export const fetchMatches = (id) => fetchWithAuth(`/needs/${id}/matches`);

// Auth & user
export const fetchUserProfile = (uid) => fetchWithAuth(`/users/${uid}`);
export const fetchOwnProfile = () => fetchWithAuth('/users/me');
export const registerProfile = (data) => fetchWithAuth('/auth/register', {
  method: 'POST', body: JSON.stringify(data),
});

// Users
export const fetchUsers = () => fetchWithAuth('/users');
export const approveUser = (uid) => fetchWithAuth(`/users/${uid}/approve`, { method: 'PATCH' });
export const rejectUser = (uid, reason) => fetchWithAuth(`/users/${uid}/reject`, {
  method: 'PATCH', body: JSON.stringify({ reason }),
});

// Events
export const fetchEvents = () => fetchWithAuth('/events');
export const createEvent = (data) => fetchWithAuth('/events', {
  method: 'POST', body: JSON.stringify(data),
});
export const fetchEvent = (id) => fetchWithAuth(`/events/${id}`);
export const updateEvent = (id, data) => fetchWithAuth(`/events/${id}`, {
  method: 'PATCH', body: JSON.stringify(data),
});
export const registerForEvent = (eventId) => fetchWithAuth(`/events/${eventId}/register`, {
  method: 'POST',
});
// ── Stats (public) ──────────────────────────────────
export const fetchStats = () => fetchWithAuth('/dashboard/stats');

// ── Public events (no auth needed) ──────────────────
export const fetchPublicEvents = () =>
  fetch(`${API_BASE}/events/public`).then(res => {
    if (!res.ok) throw new Error('Failed to fetch public events');
    return res.json();
  });

// ── Update event status (org or admin) ──────────────
export const updateEventStatus = (eventId, status) =>
  fetchWithAuth(`/events/${eventId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });

// ── Fetch registered volunteers for an event (org/admin) ──
export const fetchEventVolunteers = (eventId) =>
  fetchWithAuth(`/events/${eventId}/volunteers`);

// ── PUBLIC (no auth) ──────────────────────────────────
export const fetchPublicNeeds = () =>
  fetch(`${API_BASE}/public/needs`).then(res => {
    if (!res.ok) throw new Error('Failed to fetch needs');
    return res.json();
  });

export const fetchPublicStats = () =>
  fetch(`${API_BASE}/dashboard/stats`).then(res => {
    if (!res.ok) throw new Error('Failed to fetch stats');
    return res.json();
  });