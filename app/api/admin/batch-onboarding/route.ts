import { randomBytes } from 'node:crypto';
import { NextResponse } from 'next/server';
import { getVerifiedAdmin, unauthorizedResponse } from '@/lib/adminAuth';
import { hashPassword } from '@/lib/auth';
import type { BatchOnboardingResult, BatchOnboardingRow } from '@/lib/batchOnboarding';
import { DEFAULT_TIER } from '@/lib/membershipTiers';
import { isValidArsStatus, isValidSalutation } from '@/lib/memberProfileOptions';
import {
  DEFAULT_COUNTRY_CODE,
  digitsOnly,
  formatStoredPhone,
  getPhoneValidationMessage,
  isAcceptablePhoneNumber,
} from '@/lib/phone';
import { supabaseAdmin } from '@/lib/supabaseServer';

const MAX_ROWS = 100;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type PreparedMember = {
  rowNumber: number;
  salutation: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  organization: string;
  designation: string;
  arsStatus: string;
};

function validateRow(row: BatchOnboardingRow): { member?: PreparedMember; message?: string } {
  const required: Array<[string, string]> = [
    ['salutation', row.salutation],
    ['first name', row.first_name],
    ['email', row.email],
    ['phone', row.phone],
    ['organization', row.organization],
    ['designation', row.designation],
    ['ARS status', row.ars_status],
  ];
  const missing = required.filter(([, value]) => !value?.trim()).map(([label]) => label);
  if (missing.length > 0) return { message: `Missing required fields: ${missing.join(', ')}` };

  const email = row.email.trim().toLowerCase();
  if (!EMAIL_PATTERN.test(email)) return { message: 'Enter a valid email address.' };
  if (!isValidSalutation(row.salutation.trim().toLowerCase())) {
    return { message: 'Use mr, ms, ustaz or ustazah for the salutation.' };
  }
  if (!isValidArsStatus(row.ars_status.trim().toLowerCase())) {
    return { message: 'Use no, active, pending or expired for the ARS status.' };
  }
  const phoneInput = row.phone.trim();
  const phoneDigits = digitsOnly(phoneInput);
  const normalizedPhone = phoneInput.startsWith('+')
    ? phoneInput
    : phoneDigits.startsWith(DEFAULT_COUNTRY_CODE) && phoneDigits.length > 8
      ? `+${phoneDigits}`
      : `+${DEFAULT_COUNTRY_CODE}${phoneDigits}`;

  if (!isAcceptablePhoneNumber(normalizedPhone)) {
    return { message: getPhoneValidationMessage(normalizedPhone) };
  }
  const phone = formatStoredPhone(normalizedPhone);
  if (!phone) return { message: getPhoneValidationMessage(normalizedPhone) };

  return {
    member: {
      rowNumber: row.rowNumber,
      salutation: row.salutation.trim().toLowerCase(),
      firstName: row.first_name.trim(),
      lastName: row.last_name?.trim() ?? '',
      email,
      phone,
      organization: row.organization.trim(),
      designation: row.designation.trim(),
      arsStatus: row.ars_status.trim().toLowerCase(),
    },
  };
}

function temporaryPassword(): string {
  return `P!${randomBytes(9).toString('base64url')}`;
}

function friendlyInsertError(message: string): string {
  if (message.includes('users_member_id_key') || message.toLowerCase().includes('member_id')) {
    return 'This phone number is already used by another member. Enter a different number or update the existing member.';
  }
  if (message.includes('users_email_key') || message.toLowerCase().includes('email')) {
    return 'A member account already uses this email address.';
  }
  if (message.toLowerCase().includes('duplicate key')) {
    return 'An account with the same details already exists.';
  }
  return 'The account could not be created. Check the member details and try again.';
}

export async function POST(request: Request) {
  const admin = await getVerifiedAdmin();
  if (!admin) return unauthorizedResponse();

  let body: { rows?: BatchOnboardingRow[] };
  try {
    body = (await request.json()) as { rows?: BatchOnboardingRow[] };
  } catch {
    return NextResponse.json({ error: 'The uploaded information could not be read. Please upload the CSV again.' }, { status: 400 });
  }

  if (!Array.isArray(body.rows) || body.rows.length === 0) {
    return NextResponse.json({ error: 'Add at least one member row.' }, { status: 400 });
  }
  if (body.rows.length > MAX_ROWS) {
    return NextResponse.json({ error: `A batch can contain at most ${MAX_ROWS} rows.` }, { status: 400 });
  }

  const results: BatchOnboardingResult[] = [];
  const valid: PreparedMember[] = [];
  const emailsInFile = new Set<string>();
  const phonesInFile = new Set<string>();

  for (const row of body.rows) {
    const checked = validateRow(row);
    const email = row.email?.trim().toLowerCase() ?? '';
    if (!checked.member) {
      results.push({ rowNumber: row.rowNumber, email, status: 'failed', message: checked.message ?? 'Check this row and complete the required information.' });
      continue;
    }
    if (emailsInFile.has(checked.member.email)) {
      results.push({ rowNumber: row.rowNumber, email: checked.member.email, status: 'skipped', message: 'This email appears more than once in the CSV. Remove the duplicate row.' });
      continue;
    }
    if (phonesInFile.has(checked.member.phone)) {
      results.push({ rowNumber: row.rowNumber, email: checked.member.email, status: 'skipped', message: 'This phone number appears more than once in the CSV. Enter a different number.' });
      continue;
    }
    emailsInFile.add(checked.member.email);
    phonesInFile.add(checked.member.phone);
    valid.push(checked.member);
  }

  if (valid.length > 0) {
    const { data: existingUsers, error: existingError } = await supabaseAdmin
      .from('users')
      .select('email, phone, member_id');
    if (existingError) {
      console.error('Batch onboarding lookup failed:', existingError);
      return NextResponse.json({ error: 'Existing members could not be checked right now. Please try again.' }, { status: 500 });
    }
    const existingEmails = new Set(
      (existingUsers ?? []).map((user) => String(user.email ?? '').trim().toLowerCase()),
    );
    const existingPhones = new Set(
      (existingUsers ?? []).flatMap((user) => [user.phone, user.member_id])
        .filter(Boolean)
        .map((phone) => String(phone).trim()),
    );
    const newMembers = valid.filter((member) => {
      if (existingEmails.has(member.email)) {
        results.push({ rowNumber: member.rowNumber, email: member.email, status: 'skipped', message: 'A member account already uses this email address.' });
        return false;
      }
      if (existingPhones.has(member.phone)) {
        results.push({ rowNumber: member.rowNumber, email: member.email, status: 'skipped', message: 'This phone number is already used by another member. Enter a different number or update the existing member.' });
        return false;
      }
      return true;
    });

    const today = new Date().toISOString().slice(0, 10);
    const prepared: Array<{ member: PreparedMember; password: string; passwordHash: string }> = [];
    for (let index = 0; index < newMembers.length; index += 5) {
      const chunk = newMembers.slice(index, index + 5);
      const hashedChunk = await Promise.all(chunk.map(async (member) => {
        const password = temporaryPassword();
        return { member, password, passwordHash: await hashPassword(password) };
      }));
      prepared.push(...hashedChunk);
    }

    if (prepared.length > 0) {
      const { data: created, error: insertError } = await supabaseAdmin
        .from('users')
        .insert(prepared.map(({ member, passwordHash }) => ({
          salutation: member.salutation,
          first_name: member.firstName,
          last_name: member.lastName || null,
          email: member.email,
          phone: member.phone,
          organization: member.organization,
          designation: member.designation,
          ars_status: member.arsStatus,
          password_hash: passwordHash,
          role: 'member',
          member_id: member.phone,
          membership_tier: DEFAULT_TIER,
          membership_status: 'active',
          member_since: today,
        })))
        .select('email');

      if (insertError) {
        console.error('Batch onboarding insert failed:', insertError);
        const message = friendlyInsertError(insertError.message);
        for (const { member } of prepared) {
          results.push({ rowNumber: member.rowNumber, email: member.email, status: 'failed', message });
        }
      } else {
        const createdEmails = new Set((created ?? []).map((user) => String(user.email).toLowerCase()));
        for (const { member, password } of prepared) {
          if (createdEmails.has(member.email)) {
            results.push({ rowNumber: member.rowNumber, email: member.email, status: 'created', message: 'Account created successfully.', temporaryPassword: password });
          } else {
            results.push({ rowNumber: member.rowNumber, email: member.email, status: 'failed', message: 'The account may not have been created. Check the member directory before trying again.' });
          }
        }
      }
    }
  }

  results.sort((left, right) => left.rowNumber - right.rowNumber);
  return NextResponse.json({
    results,
    summary: {
      total: results.length,
      created: results.filter((result) => result.status === 'created').length,
      skipped: results.filter((result) => result.status === 'skipped').length,
      failed: results.filter((result) => result.status === 'failed').length,
    },
  });
}
