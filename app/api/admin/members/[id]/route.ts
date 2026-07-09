import { NextResponse } from 'next/server';
// import { getVerifiedAdmin, unauthorizedResponse } from '@/lib/adminAuth';
import { supabaseAdmin } from '@/lib/supabaseServer';
import { isValidArsStatus, isValidSalutation } from '@/lib/memberProfileOptions';
import {
  formatStoredPhone,
  getPhoneValidationMessage,
  isAcceptablePhoneNumber,
} from '@/lib/phone';

const MEMBER_SELECT =
  'id, salutation, first_name, last_name, email, phone, organization, designation, arabic_name, ars_status, member_id, membership_tier, membership_status, expiry_date, member_since, role, created_at';

const ALLOWED_PATCH_FIELDS = [
  'salutation',
  'first_name',
  'last_name',
  'arabic_name',
  'email',
  'phone',
  'organization',
  'designation',
  'ars_status',
  'member_id',
  'membership_tier',
  'membership_status',
  'expiry_date',
  'member_since',
  'role',
] as const;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // const admin = await getVerifiedAdmin();
  // if (!admin) return unauthorizedResponse();

  const { id } = await params;
  const { data, error } = await supabaseAdmin
    .from('users')
    .select(MEMBER_SELECT)
    .eq('id', id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Member not found' }, { status: 404 });

  const { data: registrations } = await supabaseAdmin
    .from('event_registrations')
    .select(`
      id,
      registered_at,
      status,
      rejection_message,
      event_id,
      events (
        title,
        venue,
        event_date
      )
    `)
    .eq('user_id', id)
    .order('registered_at', { ascending: false });

  return NextResponse.json({ member: data, registrations: registrations ?? [] });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // const admin = await getVerifiedAdmin();
  // if (!admin) return unauthorizedResponse();

  const { id } = await params;
  const body = await req.json();

  const updates: Record<string, unknown> = {};
  for (const key of ALLOWED_PATCH_FIELDS) {
    if (key in body) updates[key] = body[key] === '' ? null : body[key];
  }

  if ('salutation' in updates && updates.salutation != null) {
    const salutation = String(updates.salutation).trim();
    if (!isValidSalutation(salutation)) {
      return NextResponse.json({ error: 'Invalid salutation' }, { status: 400 });
    }
    updates.salutation = salutation;
  }

  if ('ars_status' in updates && updates.ars_status != null) {
    const arsStatus = String(updates.ars_status).trim();
    if (!isValidArsStatus(arsStatus)) {
      return NextResponse.json({ error: 'Invalid ARS status' }, { status: 400 });
    }
    updates.ars_status = arsStatus;
  }

  if ('email' in updates && updates.email != null) {
    const email = String(updates.email).trim();
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }
    const { data: existing } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .neq('id', id)
      .limit(1)
      .maybeSingle();
    if (existing) {
      return NextResponse.json({ error: 'Email is already in use' }, { status: 409 });
    }
    updates.email = email;
  }

  if ('phone' in updates && updates.phone != null) {
    const phoneInput = String(updates.phone).trim();
    if (!phoneInput) {
      updates.phone = null;
    } else {
      if (!isAcceptablePhoneNumber(phoneInput)) {
        return NextResponse.json(
          { error: getPhoneValidationMessage(phoneInput) },
          { status: 400 }
        );
      }
      const phone = formatStoredPhone(phoneInput);
      if (!phone) {
        return NextResponse.json(
          { error: getPhoneValidationMessage(phoneInput) },
          { status: 400 }
        );
      }
      updates.phone = phone;
    }
  }

  if ('role' in updates && updates.role != null) {
    const role = String(updates.role).trim();
    if (role !== 'member' && role !== 'admin') {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }
    updates.role = role;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('users')
    .update(updates)
    .eq('id', id)
    .select(MEMBER_SELECT)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Member not found' }, { status: 404 });

  return NextResponse.json({ member: data });
}
