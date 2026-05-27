const API_BASE = '' // Vite proxy handles /api and /audio in dev

export async function getState() {
  const r = await fetch(`${API_BASE}/api/state`)
  return r.json()
}

export async function getTracks() {
  const r = await fetch(`${API_BASE}/api/tracks`)
  return r.json()
}

export async function getUpNext(limit = 4) {
  const r = await fetch(`${API_BASE}/api/up-next?limit=${limit}`)
  return r.json()
}

export async function control(action: string, payload?: any) {
  const r = await fetch(`${API_BASE}/api/control/${action}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: payload ? JSON.stringify(payload) : undefined,
  })
  return r.json()
}

export async function rescan() {
  const r = await fetch(`${API_BASE}/api/rescan`, { method: 'POST' })
  return r.json()
}
