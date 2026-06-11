import { NextResponse } from 'next/server';
// AUTH: uncomment these two lines when you add JWT auth
// import { getVerifiedAdmin, unauthorizedResponse } from '@/lib/adminAuth';
import { supabaseAdmin } from '@/lib/supabaseServer';

export async function GET(req: Request) {
  // AUTH: uncomment when ready
  // const admin = await getVerifiedAdmin();
  // if (!admin) return unauthorizedResponse();

  const url = new URL(req.url);
  const status = url.searchParams.get('status') ?? '';

  let query = supabaseAdmin
    .from('events')
    .select('id, title, event_date, start_time, end_time, venue, category, capacity, status, external_rsvp_url, created_at')
    .order('event_date', { ascending: false });

  if (status) query = query.eq('status', status);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ events: data ?? [] });
}

export async function POST(req: Request) {
  // AUTH: uncomment when ready
  // const admin = await getVerifiedAdmin();
  // if (!admin) return unauthorizedResponse();

  const body = await req.json();

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
      external_rsvp_url: body.external_rsvp_url || null,
      image_url: body.image_url || null,
      status: body.status ?? 'draft',
      // created_by: admin.sub,  // uncomment with auth
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ event: data }, { status: 201 });
}
