import { NextResponse } from 'next/server';
// AUTH: uncomment when ready
// import { getVerifiedAdmin, unauthorizedResponse } from '@/lib/adminAuth';
import { ADMIN_PAYMENT_METHOD_SELECT } from '@/lib/adminPaymentMethods';
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
    .from('payment_methods').select(ADMIN_PAYMENT_METHOD_SELECT).eq('id', id).maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ paymentMethod: data });
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

  const allowed = ['name', 'description', 'paynow_uen', 'qr_code_url', 'is_active'];
  const updates: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) updates[key] = cleanPatchValue(body[key]);
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No payment method fields provided.' }, { status: 400 });
  }

  if ('paynow_uen' in updates || 'qr_code_url' in updates) {
    const { data: existing } = await supabaseAdmin
      .from('payment_methods')
      .select('paynow_uen, qr_code_url')
      .eq('id', id)
      .maybeSingle<{ paynow_uen: string | null; qr_code_url: string | null }>();

    const nextUen = 'paynow_uen' in updates ? updates.paynow_uen : existing?.paynow_uen ?? null;
    const nextQr = 'qr_code_url' in updates ? updates.qr_code_url : existing?.qr_code_url ?? null;
    if (!nextUen && !nextQr) {
      return NextResponse.json(
        { error: 'A payment method needs a PayNow UEN, a QR code image, or both.' },
        { status: 400 },
      );
    }
  }

  // Only one payment method can be active at a time.
  if (updates.is_active === true) {
    const { error: deactivateError } = await supabaseAdmin
      .from('payment_methods')
      .update({ is_active: false })
      .eq('is_active', true)
      .neq('id', id);
    if (deactivateError) return NextResponse.json({ error: deactivateError.message }, { status: 500 });
  }

  const { data, error } = await supabaseAdmin
    .from('payment_methods').update(updates).eq('id', id).select(ADMIN_PAYMENT_METHOD_SELECT).maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ paymentMethod: data, deactivatedOthers: updates.is_active === true });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // const admin = await getVerifiedAdmin();
  // if (!admin) return unauthorizedResponse();

  const { id } = await params;
  const { error } = await supabaseAdmin.from('payment_methods').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
