const API_BASE = '/api';

export async function fetchNeeds() {
  const res = await fetch(`${API_BASE}/needs`);
  if (!res.ok) throw new Error('Failed to fetch needs');
  return res.json();
}

export async function fetchNeed(id) {
  const res = await fetch(`${API_BASE}/needs/${id}`);
  if (!res.ok) throw new Error('Need not found');
  return res.json();
}

export async function fetchMatches(id) {
  const res = await fetch(`${API_BASE}/needs/${id}/matches`);
  if (!res.ok) throw new Error('Failed to fetch matches');
  return res.json();
}

export async function createNeed(needData) {
  const res = await fetch(`${API_BASE}/needs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(needData),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to submit need');
  }
  return res.json();
}

export async function createVolunteer(volunteerData) {
  const res = await fetch(`${API_BASE}/volunteers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(volunteerData),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Registration failed');
  }
  return res.json();
}