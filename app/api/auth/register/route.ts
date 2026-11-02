import { logServerError } from "@/lib/serverErrors";
import { readJsonObject, InputValidationError, invalidInput } from "@/lib/inputValidation";
import { validateRegistrationInput } from "@/lib/apiInputValidation";
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';
import { hashPassword } from '@/lib/auth';
import { setLastActivityCookie, SESSION_COOKIE_OPTIONS } from '@/lib/session';
import { createSession } from '@/lib/sessionServer';
import { emailMatchPattern } from '@/lib/emailIdentity';
import { DEFAULT_TIER } from '@/lib/membershipTiers';
import { formatStoredPhone, isAcceptablePhoneNumber, getPhoneValidationMessage } from '@/lib/phone';
import { isValidArsStatus, isValidSalutation } from '@/lib/memberProfileOptions';

type RegistrationPayload = {
  salutation?: string;
  firstName?: string;
  lastName?: string;
  arabicName?: string;
  email?: string;
  organization?: string;
  designation?: string;
  arsStatus?: string;
  phone?: string;
  password?: string;
};

export async function POST(req: Request) {
  try {
    const body = (await readJsonObject(req, validateRegistrationInput)) as RegistrationPayload;
    const salutation = body.salutation?.trim() ?? '';
    const firstName = body.firstName?.trim() ?? '';
    const lastName = body.lastName?.trim() ?? '';
    const arabicName = body.arabicName?.trim() ?? '';
    const email = body.email?.trim().toLowerCase() ?? '';
    const organization = body.organization?.trim() ?? '';
    const designation = body.designation?.trim() ?? '';
    const arsStatus = body.arsStatus?.trim() ?? '';
    const phoneInput = body.phone?.trim() ?? '';
    const password = body.password ?? '';

    if (!email || !password) {
      return NextResponse.json({ error: 'Missing email or password' }, { status: 400 });
    }

    const missingFields: string[] = [];
    if (!salutation) missingFields.push('salutation');
    if (!firstName) missingFields.push('first name');
    if (!organization) missingFields.push('organization');
    if (!designation) missingFields.push('designation');
    if (!arsStatus) missingFields.push('ARS status');
    if (!phoneInput) missingFields.push('telephone number');

    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    if (!isValidSalutation(salutation)) {
      return NextResponse.json({ error: 'Invalid salutation' }, { status: 400 });
    }

    if (!isValidArsStatus(arsStatus)) {
      return NextResponse.json({ error: 'Invalid ARS status' }, { status: 400 });
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

    const { data: existing, error: lookupError } = await supabaseAdmin
      .from('users')
      .select('id')
      .regexIMatch('email', emailMatchPattern(email))
      .limit(1)
      .maybeSingle();

    if (lookupError) {
      logServerError("app/api/auth/register/route.POST", lookupError);
      return NextResponse.json({ error: 'Unable to complete request' }, { status: 500 });
    }

    if (existing) {
      return NextResponse.json({ error: 'Unable to register with these details' }, { status: 409 });
    }

    const password_hash = await hashPassword(password);
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabaseAdmin
      .from('users')
      .insert({
        salutation,
        first_name: firstName,
        last_name: lastName || null,
        arabic_name: arabicName || null,
        email,
        organization,
        designation,
        ars_status: arsStatus,
        phone,
        password_hash,
        role: 'member',
        member_id: phone,
        membership_tier: DEFAULT_TIER,
        membership_status: 'active',
        member_since: today,
      })
      .select('id, email')
      .limit(1)
      .maybeSingle();

    // The normalized unique index also protects concurrent registrations.
    if (error?.code === '23505') {
      return NextResponse.json({ error: 'Unable to register with these details' }, { status: 409 });
    }

    if (error || !data) {
    if (error) logServerError("app/api/auth/register/route.POST", error);
      return NextResponse.json({ error: "Unable to complete request" }, { status: 500 });
    }

    const token = await createSession(data, password_hash);
    const res = NextResponse.json({ ok: true });
    res.cookies.set('token', token, { ...SESSION_COOKIE_OPTIONS, maxAge: 60 * 60 * 24 * 7 });
    setLastActivityCookie(res);
    return res;
  } catch (err: unknown) {
    if (!(err instanceof InputValidationError)) logServerError("app/api/auth/register/route.POST", err);
    if (err instanceof InputValidationError) return invalidInput(err.message);
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}
