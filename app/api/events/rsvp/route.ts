import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';
import { getCurrentUser } from '@/lib/currentUser';

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const eventId = searchParams.get('eventId');

  if (!eventId) {
    return new Response('Event ID is required', { status: 400 });
  }

  const { data: event, error } = await supabaseAdmin
    .from('events')
    .select('id, external_rsvp_url')
    .eq('id', eventId)
    .single();

  if (error || !event) {
    return new Response('Event not found', { status: 404 });
  }

  // 1. Log the click event
  await supabaseAdmin.from('analytics_events').insert({
    user_id: user.id,
    event_type: 'event_rsvp_click',
    target_id: event.id,
    category: 'event',
  });

  // 2. Redirect to Zoho Backstage / external URL
  const redirectUrl = event.external_rsvp_url?.trim() || '/member/events';
  return NextResponse.redirect(redirectUrl);
}
