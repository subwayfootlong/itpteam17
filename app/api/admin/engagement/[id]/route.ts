import { NextResponse } from 'next/server';
// AUTH: uncomment when ready
// import { getVerifiedAdmin, unauthorizedResponse } from '@/lib/adminAuth';
import { ADMIN_BENEFIT_SELECT } from '@/lib/adminBenefits';
import { notifyBenefitAvailable } from '@/lib/notifications';
import { supabaseAdmin } from '@/lib/supabaseServer';

function cleanPatchValue(value: unknown) {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed === '' ? null : trimmed;
  }
  return value;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // const admin = await getVerifiedAdmin();
  // if (!admin) return unauthorizedResponse();

  const { id } = await params;
  const { data, error } = await supabaseAdmin
    .from('benefits').select(ADMIN_BENEFIT_SELECT).eq('id', id).maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ benefit: data });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // const admin = await getVerifiedAdmin();
  // if (!admin) return unauthorizedResponse();

  const { id } = await params;
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const allowed = ['merchant_name', 'category', 'discount_description', 'discount_amount', 'address', 'description', 'image_url', 'logo_url', 'logo_initials', 'is_active'];
  const updates: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) updates[key] = cleanPatchValue(body[key]);
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No benefit fields provided.' }, { status: 400 });
  }

  const { data: existing } = await supabaseAdmin
    .from('benefits')
    .select('is_active')
    .eq('id', id)
    .maybeSingle<{ is_active: boolean | null }>();

  const { data, error } = await supabaseAdmin
    .from('benefits').update(updates).eq('id', id).select(ADMIN_BENEFIT_SELECT).maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (data.is_active && !existing?.is_active) {
    await notifyBenefitAvailable({
      id: String(data.id),
      merchantName: data.merchant_name,
      offer: data.discount_description,
    });
  }

  return NextResponse.json({ benefit: data });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // const admin = await getVerifiedAdmin();
  // if (!admin) return unauthorizedResponse();

  const { id } = await params;
  const { error } = await supabaseAdmin.from('benefits').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
