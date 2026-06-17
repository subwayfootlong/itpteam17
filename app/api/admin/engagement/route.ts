import { NextResponse } from 'next/server';
// AUTH: uncomment when ready
// import { getVerifiedAdmin, unauthorizedResponse } from '@/lib/adminAuth';
import { supabaseAdmin } from '@/lib/supabaseServer';

export async function GET(req: Request) {
  // const admin = await getVerifiedAdmin();
  // if (!admin) return unauthorizedResponse();

  const url = new URL(req.url);
  const active = url.searchParams.get('active');

  let query = supabaseAdmin
    .from('benefits')
    .select('id, merchant_name, category, discount_description, discount_amount, address, logo_initials, is_active, created_at')
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

  const body = await req.json();

  const { data, error } = await supabaseAdmin
    .from('benefits')
    .insert({
      merchant_name: body.merchant_name,
      category: body.category,
      discount_description: body.discount_description,
      discount_amount: body.discount_amount || null,
      address: body.address || null,
      description: body.description || null,
      logo_initials: body.logo_initials || null,
      is_active: body.is_active ?? true,
      // created_by: admin.sub,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ benefit: data }, { status: 201 });
}
