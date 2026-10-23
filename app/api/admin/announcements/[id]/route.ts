import { readJsonObject, invalidInput, InputValidationError, isUuid } from "@/lib/inputValidation";
import { validateAnnouncementInput } from "@/lib/apiInputValidation";
import { requireAdmin } from "@/lib/adminAuth";
import { NextResponse } from 'next/server';
import { notifyAnnouncementPublished } from '@/lib/notifications';
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
    .from('announcements')
    .select('*, announcement_comments(count)')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('Announcements GET by ID Error:', error);
    return NextResponse.json({ error: "Unable to complete request" }, { status: 500 });
  }
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ announcement: data });
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
    body = await readJsonObject(req, validateAnnouncementInput);
  } catch (error) {
    return invalidInput(error instanceof InputValidationError ? error.message : "Invalid JSON payload");
  }

  const allowed = ['title', 'content', 'category', 'image_url', 'status', 'poll_enabled', 'poll_question'];
  const updates: Record<string, unknown> = {};
  const audienceChanged =
    'audience_type' in body ||
    'eligible_tiers' in body ||
    'show_locked_preview' in body;
  for (const key of allowed) {
    if (key in body) updates[key] = body[key] === '' ? null : body[key];
  }
  if ('poll_enabled' in body) {
    updates.poll_enabled = Boolean(body.poll_enabled);
    if (!body.poll_enabled) updates.poll_question = null;
  }

  if (audienceChanged) {
    const audience = validateTierAudience(body);
    if (!audience.ok) {
      return NextResponse.json({ error: audience.error }, { status: 400 });
    }
    Object.assign(
      updates,
      tierAudienceToDatabase({ ...audience.value, showLockedPreview: false }),
    );
  }

  if (Object.keys(updates).length === 0) return invalidInput("No fields to update");

  const { data: existing } = await supabaseAdmin
    .from('announcements')
    .select('status')
    .eq('id', id)
    .maybeSingle<{ status: string | null }>();

  const { data, error } = await supabaseAdmin
    .from('announcements')
    .update(updates)
    .eq('id', id)
    .select()
    .maybeSingle();

  if (error) {
    console.error('Announcements PATCH Error:', error);
    return NextResponse.json({ error: "Unable to complete request" }, { status: 500 });
  }
  if (data?.status === 'published' && (existing?.status !== 'published' || audienceChanged)) {
    await notifyAnnouncementPublished({
      id: String(data.id),
      title: data.title,
      audience: {
        audienceType: data.audience_type === 'selected_tiers' ? 'selected_tiers' : 'all',
        eligibleTiers: Array.isArray(data.eligible_tiers) ? data.eligible_tiers : [],
        showLockedPreview: false,
      },
    });
  }

  return NextResponse.json({ announcement: data });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { response: authResponse } = await requireAdmin();
  if (authResponse) return authResponse;

  const { id } = await params;
  if (!isUuid(id)) return invalidInput("ID must be a UUID");
  const { error } = await supabaseAdmin.from('announcements').delete().eq('id', id);
  if (error) {
    console.error('Announcements DELETE Error:', error);
    return NextResponse.json({ error: "Unable to complete request" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
