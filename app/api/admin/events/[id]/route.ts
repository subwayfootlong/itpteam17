import { NextResponse } from 'next/server';
import { getVerifiedAdmin, unauthorizedResponse } from '@/lib/adminAuth';
import { notifyEventPublished } from '@/lib/notifications';
import { supabaseAdmin } from '@/lib/supabaseServer';
import { tierAudienceToDatabase, validateTierAudience } from '@/lib/tierAccess';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getVerifiedAdmin();
  if (!admin) return unauthorizedResponse();

  const { id } = await params;
  const { data, error } = await supabaseAdmin
    .from('events')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('Events GET by ID Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) return NextResponse.json({ error: 'Event not found' }, { status: 404 });
  return NextResponse.json({ event: data });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getVerifiedAdmin();
  if (!admin) return unauthorizedResponse();

  const { id } = await params;
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  const allowed = [
    'title', 'description', 'event_date', 'start_time', 'end_time',
    'venue', 'category', 'capacity', 'external_rsvp_url', 'image_url', 'status',
  ];
  const updates: Record<string, unknown> = {};
  const audienceChanged =
    'audience_type' in body ||
    'eligible_tiers' in body ||
    'show_locked_preview' in body;
  for (const key of allowed) {
    if (key in body) updates[key] = body[key] === '' ? null : body[key];
  }

  if (audienceChanged) {
    const audience = validateTierAudience(body);
    if (!audience.ok) {
      return NextResponse.json({ error: audience.error }, { status: 400 });
    }
    Object.assign(updates, tierAudienceToDatabase(audience.value));
  }

  const { data: existing, error: existingError } = await supabaseAdmin
    .from('events')
    .select('status')
    .eq('id', id)
    .maybeSingle<{ status: string | null }>();

  if (existingError) {
    console.error('Events PATCH lookup error:', existingError);
    return NextResponse.json({ error: existingError.message }, { status: 500 });
  }
  if (!existing) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 });
  }

  if ('capacity' in body) {
    const capacity = body.capacity === '' || body.capacity === null
      ? null
      : Number(body.capacity);

    if (capacity !== null && (!Number.isInteger(capacity) || capacity < 0)) {
      return NextResponse.json(
        { error: 'Capacity must be a non-negative whole number.' },
        { status: 400 },
      );
    }

    const { count: registeredCount, error: registrationCountError } =
      await supabaseAdmin
        .from('event_registrations')
        .select('id', { count: 'exact', head: true })
        .eq('event_id', id)
        .eq('status', 'registered');

    if (registrationCountError) {
      console.error('Events PATCH registration count error:', registrationCountError);
      return NextResponse.json(
        { error: 'Unable to verify the current registrations.' },
        { status: 500 },
      );
    }

    const activeRegistrations = registeredCount ?? 0;
    if (capacity !== null && capacity < activeRegistrations) {
      return NextResponse.json(
        {
          error: `Capacity cannot be lower than the ${activeRegistrations} current registration${activeRegistrations === 1 ? '' : 's'}.`,
        },
        { status: 400 },
      );
    }

    updates.capacity = capacity;
    updates.spots_available = capacity === null
      ? null
      : capacity - activeRegistrations;
  }

  const { data, error } = await supabaseAdmin
    .from('events')
    .update(updates)
    .eq('id', id)
    .select()
    .maybeSingle();

  if (error) {
    console.error('Events PATCH Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (data?.status === 'published' && (existing?.status !== 'published' || audienceChanged)) {
    await notifyEventPublished({
      id: String(data.id),
      title: data.title,
      eventDate: data.event_date,
      audience: {
        audienceType: data.audience_type === 'selected_tiers' ? 'selected_tiers' : 'all',
        eligibleTiers: Array.isArray(data.eligible_tiers) ? data.eligible_tiers : [],
        showLockedPreview: Boolean(data.show_locked_preview),
      },
    });
  }

  return NextResponse.json({ event: data });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getVerifiedAdmin();
  if (!admin) return unauthorizedResponse();

  const { id } = await params;
  const { error } = await supabaseAdmin.from('events').delete().eq('id', id);
  if (error) {
    console.error('Events DELETE Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
