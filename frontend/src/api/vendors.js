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

export async function listVendors(params = {}) {
  const qs = new URLSearchParams();
  if (params.name) qs.set('name', params.name);
  if (params.limit) qs.set('limit', String(params.limit));
  const path = '/api/vendors' + (qs.toString() ? '?' + qs.toString() : '');
  return request(path, { method: 'GET' });
}

export async function createVendor(data = {}) {
  return request('/api/vendors', { method: 'POST', body: JSON.stringify(data) });
}

export async function deleteVendor(id) {
  return request(`/api/vendors/${id}`, { method: 'DELETE' });
}

export default {
  listVendors,
  createVendor,
  deleteVendor
};
