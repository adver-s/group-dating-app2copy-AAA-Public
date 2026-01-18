export async function safeJson<T = any>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const response = await fetch(input, init)

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(text || `Request failed with status ${response.status}`)
  }

  try {
    return (await response.json()) as T
  } catch (error) {
    throw new Error('Failed to parse JSON response')
  }
}

