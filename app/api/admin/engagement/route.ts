import { NextResponse } from 'next/server';
// AUTH: uncomment when ready
// import { getVerifiedAdmin, unauthorizedResponse } from '@/lib/adminAuth';
import { ADMIN_BENEFIT_SELECT } from '@/lib/adminBenefits';
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
    .from('benefits')
    .select(ADMIN_BENEFIT_SELECT)
    .order('merchant_name', { ascending: true });

  if (active === 'true') query = query.eq('is_active', true);
  if (active === 'false') query = query.eq('is_active', false);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ benefits: data ?? [] });
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

  const merchantName = cleanText(body.merchant_name);
  const category = cleanText(body.category);
  const discountDescription = cleanText(body.discount_description);

  if (!merchantName || !category || !discountDescription) {
    return NextResponse.json(
      { error: 'Merchant name, category, and offer details are required.' },
      { status: 400 },
    );
  }

  const { data, error } = await supabaseAdmin
    .from('benefits')
    .insert({
      merchant_name: merchantName,
      category,
      discount_description: discountDescription,
      discount_amount: cleanText(body.discount_amount) || null,
      address: cleanText(body.address) || null,
      description: cleanText(body.description) || null,
      image_url: cleanText(body.image_url) || null,
      logo_url: cleanText(body.logo_url) || null,
      logo_initials: cleanText(body.logo_initials) || null,
      is_active: typeof body.is_active === 'boolean' ? body.is_active : true,
      // created_by: admin.sub,
    })
    .select(ADMIN_BENEFIT_SELECT)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ benefit: data }, { status: 201 });
}
