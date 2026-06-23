import { NextResponse } from 'next/server';
// import { getVerifiedAdmin, unauthorizedResponse } from '@/lib/adminAuth';
import { supabaseAdmin } from '@/lib/supabaseServer';

export async function GET(req: Request) {
  // const admin = await getVerifiedAdmin();
  // if (!admin) return unauthorizedResponse();

  const url = new URL(req.url);
  const search = url.searchParams.get('search') ?? '';
  const tier = url.searchParams.get('tier') ?? '';
  const status = url.searchParams.get('status') ?? '';

  let query = supabaseAdmin
    .from('users')
    .select('id, first_name, last_name, email, member_id, membership_tier, membership_status, expiry_date, phone, organization, designation, created_at')
    .neq('role', 'admin')
    .order('created_at', { ascending: false });

  if (search) {
    query = query.or(
      `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,member_id.ilike.%${search}%,organization.ilike.%${search}%`
    );
  }
  if (tier) query = query.eq('membership_tier', tier);
  if (status) query = query.eq('membership_status', status);

  const { data, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ members: data ?? [] });
}
