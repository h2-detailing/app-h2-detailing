const BASE = '/api';

function getToken() {
  return localStorage.getItem('h2-token');
}

async function req(method, path, body) {
  const headers = {};
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (body && !(body instanceof FormData)) headers['Content-Type'] = 'application/json';

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401) {
    localStorage.removeItem('h2-token');
    window.dispatchEvent(new Event('h2-logout'));
    throw new Error('Unauthorized');
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

export const api = {
  // Auth
  login: (username, password) => req('POST', '/auth/login', { username, password }),
  me: () => req('GET', '/auth/me'),
  changePassword: (currentPassword, newPassword) => req('PUT', '/auth/password', { currentPassword, newPassword }),

  // Orders
  getOrders: () => req('GET', '/orders'),
  createOrder: (data) => req('POST', '/orders', data),
  updateOrder: (id, data) => req('PUT', `/orders/${id}`, data),
  deleteOrder: (id) => req('DELETE', `/orders/${id}`),

  // Order photos
  getPhotos: (orderId) => req('GET', `/orders/${orderId}/photos`),
  uploadPhoto: async (orderId, file, type) => {
    const fd = new FormData();
    fd.append('photo', file);
    fd.append('type', type);
    return req('POST', `/orders/${orderId}/photos`, fd);
  },
  deletePhoto: (orderId, photoId) => req('DELETE', `/orders/${orderId}/photos/${photoId}`),

  // Expenses
  getExpenses: () => req('GET', '/expenses'),
  createExpense: (data) => req('POST', '/expenses', data),
  updateExpense: (id, data) => req('PUT', `/expenses/${id}`, data),
  deleteExpense: (id) => req('DELETE', `/expenses/${id}`),

  // Clients
  getClients: () => req('GET', '/clients'),
  createClient: (data) => req('POST', '/clients', data),
  updateClient: (id, data) => req('PUT', `/clients/${id}`, data),
  deleteClient: (id) => req('DELETE', `/clients/${id}`),

  // Vehicles
  createVehicle: (clientId, data) => req('POST', `/clients/${clientId}/vehicles`, data),
  updateVehicle: (id, data) => req('PUT', `/vehicles/${id}`, data),
  deleteVehicle: (id) => req('DELETE', `/vehicles/${id}`),

  // Settings
  getSettings: () => req('GET', '/settings'),
  updateSettings: (data) => req('PUT', '/settings', data),
};
