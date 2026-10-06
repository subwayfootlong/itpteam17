import { randomBytes } from 'node:crypto';
import { NextResponse } from 'next/server';
import { getVerifiedAdmin, unauthorizedResponse } from '@/lib/adminAuth';
import { hashPassword } from '@/lib/auth';
import type { BatchOnboardingResult, BatchOnboardingRow } from '@/lib/batchOnboarding';
import { DEFAULT_TIER } from '@/lib/membershipTiers';
import { isValidArsStatus, isValidSalutation } from '@/lib/memberProfileOptions';
import { formatStoredPhone, getPhoneValidationMessage, isAcceptablePhoneNumber } from '@/lib/phone';
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
  if (!EMAIL_PATTERN.test(email)) return { message: 'Invalid email address' };
  if (!isValidSalutation(row.salutation.trim().toLowerCase())) return { message: 'Invalid salutation' };
  if (!isValidArsStatus(row.ars_status.trim().toLowerCase())) return { message: 'Invalid ARS status' };
  if (!isAcceptablePhoneNumber(row.phone.trim())) {
    return { message: getPhoneValidationMessage(row.phone.trim()) };
  }
  const phone = formatStoredPhone(row.phone.trim());
  if (!phone) return { message: getPhoneValidationMessage(row.phone.trim()) };

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

export async function POST(request: Request) {
  const admin = await getVerifiedAdmin();
  if (!admin) return unauthorizedResponse();

  let body: { rows?: BatchOnboardingRow[] };
  try {
    body = (await request.json()) as { rows?: BatchOnboardingRow[] };
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
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

  for (const row of body.rows) {
    const checked = validateRow(row);
    const email = row.email?.trim().toLowerCase() ?? '';
    if (!checked.member) {
      results.push({ rowNumber: row.rowNumber, email, status: 'failed', message: checked.message ?? 'Invalid row' });
      continue;
    }
    if (emailsInFile.has(checked.member.email)) {
      results.push({ rowNumber: row.rowNumber, email: checked.member.email, status: 'skipped', message: 'Duplicate email in this CSV' });
      continue;
    }
    emailsInFile.add(checked.member.email);
    valid.push(checked.member);
  }

  if (valid.length > 0) {
    const { data: existingUsers, error: existingError } = await supabaseAdmin
      .from('users')
      .select('email');
    if (existingError) {
      return NextResponse.json({ error: existingError.message }, { status: 500 });
    }
    const existingEmails = new Set(
      (existingUsers ?? []).map((user) => String(user.email ?? '').trim().toLowerCase()),
    );
    const newMembers = valid.filter((member) => {
      if (!existingEmails.has(member.email)) return true;
      results.push({ rowNumber: member.rowNumber, email: member.email, status: 'skipped', message: 'Email already belongs to an existing user' });
      return false;
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
        for (const { member } of prepared) {
          results.push({ rowNumber: member.rowNumber, email: member.email, status: 'failed', message: insertError.message });
        }
      } else {
        const createdEmails = new Set((created ?? []).map((user) => String(user.email).toLowerCase()));
        for (const { member, password } of prepared) {
          if (createdEmails.has(member.email)) {
            results.push({ rowNumber: member.rowNumber, email: member.email, status: 'created', message: 'Member created', temporaryPassword: password });
          } else {
            results.push({ rowNumber: member.rowNumber, email: member.email, status: 'failed', message: 'Member was not returned after import' });
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
