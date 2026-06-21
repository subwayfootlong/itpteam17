type JsonBody = Record<string, unknown>;

export async function postJson(path: string, body: JsonBody) {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const payload = await res.json().catch(() => null) as { error?: string } | null;
  if (!res.ok) {
    const err = payload?.error || res.statusText || 'Request failed';
    throw new Error(err);
  }
  return payload;
}

const api = { postJson };

export default api;
