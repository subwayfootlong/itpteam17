export async function postJson(path: string, body: any) {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const payload = await res.json().catch(() => null);
  if (!res.ok) {
    const err = (payload && payload.error) || res.statusText || 'Request failed';
    throw new Error(err);
  }
  return payload;
}

export default { postJson };
