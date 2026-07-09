"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { QRCodeCanvas } from 'qrcode.react';
import { formatTierLabel } from '@/lib/membershipTiers';
import { formatMemberDisplayName, formatMemberName } from '@/lib/memberName';
import { formatArsStatusLabel, formatSalutationLabel } from '@/lib/memberProfileOptions';
import { formatMemberDate } from '@/lib/dates';
import { Badge } from '@/components/admin/ui/Badge';

interface Member {
  id: string;
  salutation: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string;
  phone: string | null;
  organization: string | null;
  designation: string | null;
  arabic_name: string | null;
  ars_status: string | null;
  member_id: string | null;
  membership_tier: string;
  membership_status: string;
  expiry_date: string | null;
  member_since: string | null;
  role: string;
  created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  active:    'bg-[#e8f5e3] text-[#27500A]',
  expired:   'bg-red-50 text-red-600',
  pending:   'bg-[#fff4de] text-[#9a6800]',
  suspended: 'bg-gray-100 text-gray-500',
};

const ARS_COLORS: Record<string, string> = {
  no:      'bg-gray-100 text-gray-600',
  active:  'bg-[#e8f5e3] text-[#27500A]',
  pending: 'bg-[#fff4de] text-[#9a6800]',
  expired: 'bg-red-50 text-red-600',
};

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 pb-3 border-b border-gray-100 last:border-0 last:pb-0">
      <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{label}</span>
      <span className="text-[13px] text-gray-800 font-medium">{value}</span>
    </div>
  );
}

export default function MemberViewPage() {
  const { id } = useParams<{ id: string }>();
  const [member, setMember] = useState<Member | null>(null);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/admin/members/${id}`)
      .then((r) => r.json())
      .then((d) => {
        setMember(d.member);
        setRegistrations(d.registrations ?? []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-[#3FAE2A] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!member) {
    return (
      <div className="text-center py-20 text-gray-400 font-helvetica">
        Member not found.{' '}
        <Link href="/admin/members" className="text-[#3FAE2A] hover:underline font-bold">
          Back to directory
        </Link>
      </div>
    );
  }

  const qrValue = JSON.stringify({
    memberId: member.member_id,
    name: formatMemberDisplayName(member, 'Member'),
    status: member.membership_status,
    tier: member.membership_tier,
  });

  const statusClass = STATUS_COLORS[member.membership_status] ?? STATUS_COLORS.suspended;
  const arsValue = member.ars_status ?? 'no';
  const arsClass = ARS_COLORS[arsValue] ?? ARS_COLORS.no;

  return (
    <div className="w-full space-y-6 pb-12">
      <div className="flex items-center justify-between gap-4">
        <nav className="text-[13px] text-gray-400 font-medium font-helvetica">
          <Link href="/admin/members" className="hover:text-[#3FAE2A] transition-colors">Directory</Link>
          <span className="mx-2">›</span>
          <span className="text-gray-700">{formatMemberDisplayName(member)}</span>
        </nav>
        <Link
          href={`/admin/members/${id}/edit`}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#3FAE2A] hover:bg-[#35941f] text-white text-[13px] font-bold transition-colors font-helvetica shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Edit Record
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile card */}
        <div className="lg:col-span-1">
          <div className="bg-[#1c3829] rounded-2xl p-6 text-white shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] relative overflow-hidden font-helvetica sticky top-6">
            <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white opacity-5 rounded-full blur-2xl" />

            <div className="flex items-center justify-between mb-6 relative z-10">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-widest text-[#98b898]">PERGAS</div>
                <div className="text-[13px] text-white/80 font-medium">{formatTierLabel(member.membership_tier)} Member</div>
              </div>
              <span className={`text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-wide ${member.membership_status === 'active' ? 'bg-[#3FAE2A] text-white shadow-sm' : 'bg-[#C51A4A] text-white shadow-sm'}`}>
                {member.membership_status}
              </span>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 flex items-center justify-center mb-6 relative z-10 border border-white/10">
              <div className="rounded-lg bg-white p-2">
                <QRCodeCanvas value={qrValue} size={80} />
              </div>
            </div>

            <div className="space-y-3 relative z-10">
              <div>
                <div className="text-[11px] text-white/60 font-semibold uppercase tracking-wider mb-0.5">Member Name</div>
                <div className="text-[16px] font-bold">{formatMemberDisplayName(member, '—')}</div>
                {member.arabic_name && <div className="text-white/80 text-[14px] mt-1">{member.arabic_name}</div>}
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <div className="text-[11px] text-white/60 font-semibold uppercase tracking-wider mb-0.5">Member ID</div>
                  <div className="font-mono text-[13px] font-bold text-[#98b898]">{member.member_id ?? 'Not assigned'}</div>
                </div>
                <div>
                  <div className="text-[11px] text-white/60 font-semibold uppercase tracking-wider mb-0.5">Valid Until</div>
                  <div className="text-[13px] font-bold">{formatMemberDate(member.expiry_date)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Read-only details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] p-6 font-helvetica">
            <h3 className="font-bold text-gray-900 text-[15px] mb-4 font-butler">Personal Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1">
              <DetailRow label="Salutation" value={formatSalutationLabel(member.salutation) || '—'} />
              <DetailRow label="Full Name" value={formatMemberName(member, '—')} />
              <DetailRow label="Arabic Name" value={member.arabic_name ?? '—'} />
              <DetailRow label="Role" value={<span className="capitalize">{member.role}</span>} />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] p-6 font-helvetica">
            <h3 className="font-bold text-gray-900 text-[15px] mb-4 font-butler">Contact</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1">
              <DetailRow label="Email" value={member.email} />
              <DetailRow
                label="Phone"
                value={
                  member.phone ? (
                    <a href={`tel:${member.phone.replace(/\s/g, '')}`} className="text-[#3FAE2A] hover:underline">
                      {member.phone}
                    </a>
                  ) : '—'
                }
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] p-6 font-helvetica">
            <h3 className="font-bold text-gray-900 text-[15px] mb-4 font-butler">Professional</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1">
              <DetailRow label="Organization" value={member.organization ?? '—'} />
              <DetailRow label="Designation" value={member.designation ?? '—'} />
              <DetailRow
                label="ARS Status"
                value={<Badge colorClass={arsClass}>{formatArsStatusLabel(arsValue)}</Badge>}
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] p-6 font-helvetica">
            <h3 className="font-bold text-gray-900 text-[15px] mb-4 font-butler">Membership</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1">
              <DetailRow label="Member ID" value={member.member_id ?? 'Not assigned'} />
              <DetailRow label="Tier" value={formatTierLabel(member.membership_tier)} />
              <DetailRow
                label="Status"
                value={<Badge colorClass={statusClass}>{member.membership_status}</Badge>}
              />
              <DetailRow label="Member Since" value={formatMemberDate(member.member_since)} />
              <DetailRow label="Expiry Date" value={formatMemberDate(member.expiry_date)} />
              <DetailRow
                label="Account Created"
                value={new Date(member.created_at).toLocaleDateString('en-SG', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] p-6 font-helvetica">
            <h3 className="font-bold text-gray-900 text-[15px] mb-4 font-butler">Event History</h3>
            {registrations.length === 0 ? (
              <div className="text-sm text-gray-400 py-2">No event registrations found.</div>
            ) : (
              <div className="space-y-4">
                {registrations.map((reg) => {
                  const event = Array.isArray(reg.events) ? reg.events[0] : reg.events;
                  if (!event) return null;

                  const dateLabel = event.event_date
                    ? new Date(event.event_date).toLocaleDateString('en-SG', { day: 'numeric', month: 'short', year: 'numeric' })
                    : 'TBD';

                  const isRejected = reg.status === 'rejected';

                  return (
                    <div key={reg.id} className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-gray-50 last:border-0 last:pb-0 gap-2">
                      <div className="min-w-0">
                        <span className="text-[13px] font-bold text-gray-800 line-clamp-1">{event.title}</span>
                        <div className="flex items-center gap-3 text-[11px] text-gray-400 mt-0.5">
                          <span>{dateLabel}</span>
                          {event.venue && <span>• {event.venue}</span>}
                        </div>
                        {isRejected && reg.rejection_message && (
                          <div className="text-[11px] text-red-500 italic mt-1">
                            Reason: &ldquo;{reg.rejection_message}&rdquo;
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wide ${isRejected ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-green-50 text-green-700 border border-green-100'}`}>
                          {reg.status}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          {new Date(reg.registered_at).toLocaleDateString('en-SG', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
