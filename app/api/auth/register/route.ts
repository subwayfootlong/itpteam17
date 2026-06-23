import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';
import { hashPassword, createAccessToken } from '@/lib/auth';
import { getErrorMessage } from '@/lib/errors';
import { DEFAULT_TIER } from '@/lib/membershipTiers';
import { formatStoredPhone, isAcceptablePhoneNumber, getPhoneValidationMessage } from '@/lib/phone';

type RegistrationPayload = {
  firstName?: string;
  lastName?: string;
  email?: string;
  organization?: string;
  designation?: string;
  phone?: string;
  password?: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as RegistrationPayload;
    const firstName = body.firstName?.trim() ?? '';
    const lastName = body.lastName?.trim() ?? '';
    const email = body.email?.trim() ?? '';
    const organization = body.organization?.trim() ?? '';
    const designation = body.designation?.trim() ?? '';
    const phoneInput = body.phone?.trim() ?? '';
    const password = body.password ?? '';

    if (!email || !password) {
      return NextResponse.json({ error: 'Missing email or password' }, { status: 400 });
    }

    const missingFields: string[] = [];
    if (!firstName) missingFields.push('first name');
    if (!lastName) missingFields.push('last name');
    if (!organization) missingFields.push('organization');
    if (!designation) missingFields.push('designation');
    if (!phoneInput) missingFields.push('telephone number');

    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

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

    const { data: existing } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .limit(1)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: 'User already exists' }, { status: 409 });
    }

    const password_hash = await hashPassword(password);
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabaseAdmin
      .from('users')
      .insert({
        first_name: firstName,
        last_name: lastName,
        email,
        organization,
        designation,
        phone,
        password_hash,
        role: 'member',
        membership_tier: DEFAULT_TIER,
        membership_status: 'active',
        member_since: today,
      })
      .select()
      .limit(1)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const token = createAccessToken({ sub: data.id, email: data.email });
    const res = NextResponse.json({ ok: true });
    res.cookies.set('token', token, { httpOnly: true, path: '/', maxAge: 60 * 60 * 24 * 7 });
    return res;
  } catch (err: unknown) {
    return NextResponse.json({ error: getErrorMessage(err, 'Registration failed') }, { status: 500 });
  }
}
