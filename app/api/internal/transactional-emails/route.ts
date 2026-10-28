import { deliverNextEmail, emailWorkerAuthorized } from '@/lib/transactionalEmail';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: Request) {
  const headers = { 'Cache-Control': 'private, no-store' };
  if (!emailWorkerAuthorized(request)) return Response.json({ error: 'Unauthorized' }, { status: 401, headers });
  try {
    return Response.json({ result: await deliverNextEmail() }, { headers });
  } catch {
    return Response.json({ error: 'Email worker unavailable' }, { status: 503, headers });
  }
}
