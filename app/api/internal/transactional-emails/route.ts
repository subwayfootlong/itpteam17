import { deliverNextEmail, expandNextAnnouncementEmail, emailWorkerAuthorized } from '@/lib/transactionalEmail';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: Request) {
  const headers = { 'Cache-Control': 'private, no-store' };
  if (!emailWorkerAuthorized(request)) return Response.json({ error: 'Unauthorized' }, { status: 401, headers });
  try {
    // One bounded phase per invocation keeps fanout + SMTP within serverless limits.
    const expansion = await expandNextAnnouncementEmail();
    if (expansion !== 'idle') return Response.json({ result: expansion }, { headers });
    return Response.json({ result: await deliverNextEmail() }, { headers });
  } catch {
    return Response.json({ error: 'Email worker unavailable' }, { status: 503, headers });
  }
}
