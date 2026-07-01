const API_URL = import.meta.env.VITE_API_URL || '/api';

function authHeaders() {
  const token = localStorage.getItem('travelcheck_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
      ...options.headers
    }
  });

  if (response.status === 204) {
    return null;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || 'Richiesta non riuscita');
  }

  return data;
}

export const api = {
  login(payload) {
    return request('/auth/login', { method: 'POST', body: JSON.stringify(payload) });
  },
  register(payload) {
    return request('/auth/register', { method: 'POST', body: JSON.stringify(payload) });
  },
  requestPasswordReset(email) {
    return request('/auth/password-reset/request', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  },
  confirmPasswordReset(payload) {
    return request('/auth/password-reset/confirm', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },
  listTrips() {
    return request('/trips');
  },
  searchAirports(search) {
    const params = new URLSearchParams({ search, limit: '10' });
    return request(`/airports?${params.toString()}`);
  },
  resolveFlight(flightNumber, date) {
    const params = new URLSearchParams({ flightNumber, date });
    return request(`/flights/resolve?${params.toString()}`);
  },
  createTrip(payload) {
    return request('/trips', { method: 'POST', body: JSON.stringify(payload) });
  },
  updateTrip(id, payload) {
    return request(`/trips/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
  },
  deleteTrip(id) {
    return request(`/trips/${id}`, { method: 'DELETE' });
  }
};
