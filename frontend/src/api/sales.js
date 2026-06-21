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

export async function listSales(params = {}) {
  const qs = new URLSearchParams();
  if (params.customer) qs.set('customer', params.customer);
  if (params.limit) qs.set('limit', String(params.limit));
  const path = '/api/sales' + (qs.toString() ? '?' + qs.toString() : '');
  return request(path, { method: 'GET' });
}

export async function createSale(data = {}) {
  return request('/api/sales', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateSale(id, data = {}) {
  return request(`/api/sales/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export async function deleteSale(id) {
  return request(`/api/sales/${id}`, { method: 'DELETE' });
}

export async function getMonthlyMetrics(year, month) {
  const qs = new URLSearchParams();
  if (year) qs.set('year', String(year));
  if (month) qs.set('month', String(month));
  return request('/api/sales/metrics/monthly?' + qs.toString(), { method: 'GET' });
}

export async function getYearlyMetrics(year) {
  const qs = new URLSearchParams();
  if (year) qs.set('year', String(year));
  return request('/api/sales/metrics/yearly?' + qs.toString(), { method: 'GET' });
}

export default {
  listSales,
  createSale,
  updateSale,
  deleteSale,
  getMonthlyMetrics,
  getYearlyMetrics
};
