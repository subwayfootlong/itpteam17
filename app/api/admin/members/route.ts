import { inputError } from "@/lib/inputValidation";
import { validateMemberFilters } from "@/lib/apiInputValidation";
import { requireAdmin } from "@/lib/adminAuth";
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';

export async function GET(req: Request) {
  const { response: authResponse } = await requireAdmin();
  if (authResponse) return authResponse;

  const url = new URL(req.url);
  const search = url.searchParams.get('search') ?? '';
  const tier = url.searchParams.get('tier') ?? '';
  const status = url.searchParams.get('status') ?? '';
  const validation = inputError(() => validateMemberFilters(search, tier, status));
  if (validation) return validation;

  let query = supabaseAdmin
    .from('users')
    .select('id, first_name, last_name, salutation, email, member_id, membership_tier, membership_status, expiry_date, phone, organization, designation, ars_status, member_since, created_at')
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

  if (error) return NextResponse.json({ error: "Unable to complete request" }, { status: 500 });
  return NextResponse.json({ members: data ?? [] });
}
