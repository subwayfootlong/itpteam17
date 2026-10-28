import 'server-only';
import { timingSafeEqual } from 'node:crypto';
import { sendEmail } from './email';
import { supabaseAdmin } from './supabaseServer';
import { evaluateTierAccess, normalizeTierAudience } from './tierAccess';
import { formatMemberName } from './memberName';
import { rsvpConfirmationEmail, type EmailContent } from './transactionalEmailTemplates';

export type EmailJob = { id: string; kind: string; user_id: string; source_id: string; source_version: string | null; lease_token: string };
export type PreparedEmail = { to: string; content: EmailContent };

export function emailWorkerAuthorized(request: Request) {
  const secret = process.env.TRANSACTIONAL_EMAIL_WORKER_SECRET;
  if (!secret || secret.length < 32) return false;
  const expected = Buffer.from(`Bearer ${secret}`);
  const actual = Buffer.from(request.headers.get('authorization') || '');
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

async function rpc(name: string, args = {}) {
  const { data, error } = await supabaseAdmin.rpc(name, args).abortSignal(AbortSignal.timeout(5_000));
  if (error) throw new Error('Email queue operation failed');
  return data;
}

async function prepareEmail(job: EmailJob): Promise<PreparedEmail | null> {
  // Recipient always comes from the current account, never a request body or a queue address.
  const [{ data: member, error: memberError }, { data: preference, error: preferenceError }] = await Promise.all([
    supabaseAdmin.from('users').select('id, first_name, last_name, email, role, membership_tier, membership_status, expiry_date')
      .eq('id', job.user_id).abortSignal(AbortSignal.timeout(5_000)).maybeSingle(),
    supabaseAdmin.from('notification_preferences').select('email_enabled')
      .eq('user_id', job.user_id).abortSignal(AbortSignal.timeout(5_000)).maybeSingle(),
  ]);
  if (memberError || preferenceError) throw new Error('Email eligibility lookup failed');
  if (!member || member.role !== 'member' || preference?.email_enabled !== true || !member.email) return null;
  if (job.kind !== 'rsvp') return null;
  const { data: registration, error: registrationError } = await supabaseAdmin.from('event_registrations')
    .select('event_id, status, registered_at').eq('id', job.source_id).eq('user_id', job.user_id)
    .abortSignal(AbortSignal.timeout(5_000)).maybeSingle();
  if (registrationError) throw new Error('Email registration lookup failed');
  if (!registration || registration.status !== 'registered' ||
      new Date(registration.registered_at).getTime() !== new Date(job.source_version || '').getTime()) return null;
  const { data: event, error: eventError } = await supabaseAdmin.from('events')
    .select('id, title, event_date, start_time, end_time, venue, status, external_rsvp_url, audience_type, eligible_tiers, show_locked_preview')
    .eq('id', registration.event_id).abortSignal(AbortSignal.timeout(5_000)).maybeSingle();
  if (eventError) throw new Error('Email event lookup failed');
  if (!event || event.status !== 'published' || event.external_rsvp_url?.trim() || !evaluateTierAccess({
    membershipTier: member.membership_tier, membershipStatus: member.membership_status, expiryDate: member.expiry_date,
  }, normalizeTierAudience(event)).canAccess) return null;
  return { to: member.email, content: rsvpConfirmationEmail(formatMemberName({ first_name: member.first_name, last_name: member.last_name }), event) };
}

type DeliveryDependencies = {
  claim: () => Promise<EmailJob | null>;
  prepare: (job: EmailJob) => Promise<PreparedEmail | null>;
  send: (to: string, subject: string, text: string, id: string, html?: string) => Promise<void>;
  finish: (job: EmailJob, result: 'sent' | 'skipped' | 'retry') => Promise<void>;
};
export const emailDeliveryDependencies: DeliveryDependencies = {
  claim: async () => (await rpc('claim_transactional_email'))?.[0] ?? null,
  prepare: prepareEmail,
  send: sendEmail,
  finish: async (job, result) => {
    const finished = await rpc('finish_transactional_email', { p_id: job.id, p_lease: job.lease_token, p_result: result });
    if (!finished) throw new Error('Email job lease lost');
  },
};

export async function deliverNextEmail(deps: DeliveryDependencies = emailDeliveryDependencies) {
  const job = await deps.claim();
  if (!job) return 'idle';
  let result: 'sent' | 'skipped' | 'retry';
  try {
    const prepared = await deps.prepare(job);
    if (!prepared) result = 'skipped';
    else {
      await deps.send(prepared.to, prepared.content.subject, prepared.content.text, `transactional:${job.id}`, prepared.content.html);
      result = 'sent';
    }
  } catch {
    result = 'retry';
  }
  // A crash/DB failure here leaves the lease for recovery, not an untracked fire-and-forget send.
  await deps.finish(job, result);
  return result;
}
