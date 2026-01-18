export async function safeJson<T = any>(input: RequestInfo, init?: RequestInit): Promise<{ ok: boolean; status: number; data?: T; error?: any }> {
  try {
    const res = await fetch(input, init)
    const status = res.status
    const json = await res.json().catch(() => ({}))
    if (!res.ok) return { ok: false, status, error: json?.error ?? `HTTP ${status}` }
    return { ok: true, status, data: json as T }
  } catch (e) {
    return { ok: false, status: 0, error: String(e) }
  }
}

