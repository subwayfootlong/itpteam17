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

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body;
  try {
    body = await req.json();
  } catch (err) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { eventId } = body;
  if (!eventId) {
    return NextResponse.json({ error: 'eventId is required' }, { status: 400 });
  }

  // Fetch event details
  const { data: event, error: eventError } = await supabaseAdmin
    .from('events')
    .select('id, title, capacity, spots_available, status')
    .eq('id', eventId)
    .single();

  if (eventError || !event) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 });
  }

  if (event.status !== 'published') {
    return NextResponse.json({ error: 'This event is not open for registration' }, { status: 400 });
  }

  // Check existing registration
  const { data: existingReg, error: regError } = await supabaseAdmin
    .from('event_registrations')
    .select('id, status')
    .eq('event_id', eventId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (existingReg) {
    if (existingReg.status === 'registered') {
      return NextResponse.json({ error: 'Already registered for this event' }, { status: 400 });
    }
    
    // If rejected, re-apply
    const { error: updateError } = await supabaseAdmin
      .from('event_registrations')
      .update({
        status: 'registered',
        rejection_message: null,
        registered_at: new Date().toISOString()
      })
      .eq('id', existingReg.id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Decrement spots_available
    if (event.spots_available !== null) {
      await supabaseAdmin
        .from('events')
        .update({ spots_available: Math.max(0, event.spots_available - 1) })
        .eq('id', eventId);
    }
  } else {
    // Check capacity/spots
    if (event.capacity !== null && event.spots_available !== null && event.spots_available <= 0) {
      return NextResponse.json({ error: 'This event is full' }, { status: 400 });
    }

    // Insert new registration
    const { error: insertError } = await supabaseAdmin
      .from('event_registrations')
      .insert({
        event_id: eventId,
        user_id: user.id,
        status: 'registered',
        registered_at: new Date().toISOString()
      });

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // Decrement spots_available
    if (event.spots_available !== null) {
      await supabaseAdmin
        .from('events')
        .update({ spots_available: Math.max(0, event.spots_available - 1) })
        .eq('id', eventId);
    }
  }

  // Log analytics event for metrics
  await supabaseAdmin.from('analytics_events').insert({
    user_id: user.id,
    event_type: 'event_rsvp_click',
    target_id: eventId,
    category: 'event',
    metadata: { title: event.title }
  });

  return NextResponse.json({ ok: true });
}
