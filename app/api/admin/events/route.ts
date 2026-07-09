import { NextResponse } from 'next/server';
// AUTH: uncomment these two lines when you add JWT auth
// import { getVerifiedAdmin, unauthorizedResponse } from '@/lib/adminAuth';
import { supabaseAdmin } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  // AUTH: uncomment when ready
  // const admin = await getVerifiedAdmin();
  // if (!admin) return unauthorizedResponse();

  const url = new URL(req.url);
  const status = url.searchParams.get('status') ?? '';

  let query = supabaseAdmin
    .from('events')
    .select('id, title, event_date, start_time, end_time, venue, category, capacity, spots_available, status, external_rsvp_url, created_at, image_url')
    .order('event_date', { ascending: false });

  if (status) query = query.eq('status', status);

  const { data, error } = await query;
  if (error) {
    console.error('Events GET Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ events: data ?? [] });
}

export async function POST(req: Request) {
  // AUTH: uncomment when ready
  // const admin = await getVerifiedAdmin();
  // if (!admin) return unauthorizedResponse();

  let body;
  try {
    body = await req.json();
  } catch (err) {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  if (!body.title || typeof body.title !== 'string') {
    return NextResponse.json({ error: 'Title is required and must be a string' }, { status: 400 });
  }
  if (!body.event_date || typeof body.event_date !== 'string') {
    return NextResponse.json({ error: 'Event date is required' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('events')
    .insert({
      title: body.title,
      description: body.description || null,
      event_date: body.event_date,
      start_time: body.start_time || null,
      end_time: body.end_time || null,
      venue: body.venue || null,
      category: body.category ?? 'General',
      capacity: body.capacity ?? null,
      spots_available: body.capacity ?? null,
      external_rsvp_url: body.external_rsvp_url || null,
      image_url: body.image_url || null,
      status: body.status ?? 'draft',
      // created_by: admin.sub,  // uncomment with auth
    })
    .select()
    .single();

  if (error) {
    console.error('Events POST Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ event: data }, { status: 201 });
}
