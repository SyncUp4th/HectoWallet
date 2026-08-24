const BASE = import.meta.env.VITE_API_BASE_URL ?? ''

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers ?? {}) },
    ...options,
  })
  if (!res.ok) {
    throw new Error(`API request failed: ${options.method ?? 'GET'} ${path} → ${res.status}`)
  }
  return res.json()
}

// REST contract any backend (Spring Boot, Node.js, etc.) implements — see README.md.
export const httpApi = {
  getAssets: () => request('/api/wallet/assets'),
  getRates: () => request('/api/swap/rates'),
  quoteSwap: (body) => request('/api/swap/quote', { method: 'POST', body: JSON.stringify(body) }),
  executeSwap: (body) => request('/api/swap', { method: 'POST', body: JSON.stringify(body) }),
  getTransactions: (params = {}) => request(`/api/transactions?${new URLSearchParams(params)}`),
  getSettlement: (period) => request(`/api/settlement?period=${encodeURIComponent(period ?? '')}`),
}
