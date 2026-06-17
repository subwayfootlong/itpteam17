import { NextResponse } from 'next/server';
// import { getVerifiedAdmin, unauthorizedResponse } from '@/lib/adminAuth';
import { supabaseAdmin } from '@/lib/supabaseServer';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // const admin = await getVerifiedAdmin();
  // if (!admin) return unauthorizedResponse();

  const { id } = await params;
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('id, full_name, email, phone, arabic_name, member_id, membership_tier, membership_status, expiry_date, member_since, role, created_at')
    .eq('id', id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Member not found' }, { status: 404 });

  return NextResponse.json({ member: data });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // const admin = await getVerifiedAdmin();
  // if (!admin) return unauthorizedResponse();

  const { id } = await params;
  const body = await req.json();

  // Whitelist fields that admins are allowed to update
  const allowed = [
    'full_name', 'phone', 'arabic_name', 'member_id',
    'membership_tier', 'membership_status', 'expiry_date',
  ];
  const updates: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) updates[key] = body[key] === '' ? null : body[key];
  }

  const { data, error } = await supabaseAdmin
    .from('users')
    .update(updates)
    .eq('id', id)
    .select()
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ member: data });
}
