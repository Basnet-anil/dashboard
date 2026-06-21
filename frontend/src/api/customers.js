const API_ROOT = import.meta.env.VITE_API_BASE || '';

async function request(path, options = {}) {
  const { headers: optHeaders, ...rest } = options;
  const res = await fetch(API_ROOT + path, {
    ...rest,
    headers: { 'Content-Type': 'application/json', ...(optHeaders || {}) },
    credentials: 'same-origin',
  });
  if (!res.ok) {
    const text = await res.text();
    let parsed;
    try { parsed = JSON.parse(text); } catch (e) { parsed = { error: text || res.statusText }; }
    throw parsed;
  }
  if (res.status === 204) return null;
  return res.json();
}

export async function listCustomers(params = {}) {
  const qs = new URLSearchParams();
  if (params.name) qs.set('name', params.name);
  if (params.limit) qs.set('limit', String(params.limit));
  const path = '/api/customers' + (qs.toString() ? '?' + qs.toString() : '');
  return request(path, { method: 'GET' });
}

export async function createCustomer(data = {}) {
  return request('/api/customers', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateCustomer(id, data = {}) {
  return request(`/api/customers/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export async function deleteCustomer(id) {
  return request(`/api/customers/${id}`, { method: 'DELETE' });
}

export default {
  listCustomers,
  createCustomer,
  deleteCustomer
};
