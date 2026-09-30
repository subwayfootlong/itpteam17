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

  const { data: existing } = await supabaseAdmin
    .from('events')
    .select('status')
    .eq('id', id)
    .maybeSingle<{ status: string | null }>();

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
