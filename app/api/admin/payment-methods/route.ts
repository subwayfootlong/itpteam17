import { NextResponse } from 'next/server';
// AUTH: uncomment when ready
// import { getVerifiedAdmin, unauthorizedResponse } from '@/lib/adminAuth';
import { ADMIN_PAYMENT_METHOD_SELECT } from '@/lib/adminPaymentMethods';
import { supabaseAdmin } from '@/lib/supabaseServer';

function cleanText(value: unknown) {
  if (typeof value === 'string') return value.trim();
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

export async function GET(req: Request) {
  // const admin = await getVerifiedAdmin();
  // if (!admin) return unauthorizedResponse();

  const url = new URL(req.url);
  const active = url.searchParams.get('active');

  let query = supabaseAdmin
    .from('payment_methods')
    .select(ADMIN_PAYMENT_METHOD_SELECT)
    .order('created_at', { ascending: false });

  if (active === 'true') query = query.eq('is_active', true);
  if (active === 'false') query = query.eq('is_active', false);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ paymentMethods: data ?? [] });
}

export async function POST(req: Request) {
  // const admin = await getVerifiedAdmin();
  // if (!admin) return unauthorizedResponse();

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const name = cleanText(body.name);
  const paynowUen = cleanText(body.paynow_uen);
  const qrCodeUrl = cleanText(body.qr_code_url);

  if (!name) {
    return NextResponse.json({ error: 'Name is required.' }, { status: 400 });
  }
  if (!paynowUen && !qrCodeUrl) {
    return NextResponse.json(
      { error: 'Provide a PayNow UEN, a QR code image, or both.' },
      { status: 400 },
    );
  }

  const isActive = typeof body.is_active === 'boolean' ? body.is_active : true;

  // Only one payment method can be active at a time.
  if (isActive) {
    const { error: deactivateError } = await supabaseAdmin
      .from('payment_methods')
      .update({ is_active: false })
      .eq('is_active', true);
    if (deactivateError) return NextResponse.json({ error: deactivateError.message }, { status: 500 });
  }

  const { data, error } = await supabaseAdmin
    .from('payment_methods')
    .insert({
      name,
      description: cleanText(body.description) || null,
      paynow_uen: paynowUen || null,
      qr_code_url: qrCodeUrl || null,
      is_active: isActive,
    })
    .select(ADMIN_PAYMENT_METHOD_SELECT)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ paymentMethod: data, deactivatedOthers: isActive }, { status: 201 });
}
