import { EVENT_DETAIL_FIELDS, responseFields } from "@/lib/responseFields";
import { readJsonObject, invalidInput, InputValidationError, isUuid } from "@/lib/inputValidation";
import { validateEventInput } from "@/lib/apiInputValidation";
import { requireAdmin } from "@/lib/adminAuth";
import { NextResponse } from 'next/server';
import { notifyEventPublished } from '@/lib/notifications';
import { supabaseAdmin } from '@/lib/supabaseServer';
import { tierAudienceToDatabase, validateTierAudience } from '@/lib/tierAccess';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { response: authResponse } = await requireAdmin();
  if (authResponse) return authResponse;

  const { id } = await params;
  if (!isUuid(id)) return invalidInput("ID must be a UUID");
  const { data, error } = await supabaseAdmin
    .from('events')
    .select(EVENT_DETAIL_FIELDS)
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('Events GET by ID Error:');
    return NextResponse.json({ error: "Unable to complete request" }, { status: 500 });
  }
  if (!data) return NextResponse.json({ error: 'Event not found' }, { status: 404 });
  return NextResponse.json({ event: responseFields(data, EVENT_DETAIL_FIELDS) });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { response: authResponse } = await requireAdmin();
  if (authResponse) return authResponse;

  const { id } = await params;
  if (!isUuid(id)) return invalidInput("ID must be a UUID");
  let body;
  try {
    body = await readJsonObject(req, validateEventInput);
  } catch (error) {
    return invalidInput(error instanceof InputValidationError ? error.message : "Invalid JSON payload");
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

  if (Object.keys(updates).length === 0) return invalidInput("No fields to update");

  const { data: existing } = await supabaseAdmin
    .from('events')
    .select('status')
    .eq('id', id)
    .maybeSingle<{ status: string | null }>();

  const { data, error } = await supabaseAdmin
    .from('events')
    .update(updates)
    .eq('id', id)
    .select('id, title, status, audience_type, eligible_tiers, show_locked_preview, event_date')
    .maybeSingle();

  if (error) {
    console.error('Events PATCH Error:');
    return NextResponse.json({ error: "Unable to complete request" }, { status: 500 });
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

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { response: authResponse } = await requireAdmin();
  if (authResponse) return authResponse;

  const { id } = await params;
  if (!isUuid(id)) return invalidInput("ID must be a UUID");
  const { error } = await supabaseAdmin.from('events').delete().eq('id', id);
  if (error) {
    console.error('Events DELETE Error:');
    return NextResponse.json({ error: "Unable to complete request" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
