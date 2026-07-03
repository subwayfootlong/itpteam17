"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { DEFAULT_TIER, MEMBERSHIP_TIERS } from '@/lib/membershipTiers';
import { formatMemberDisplayName, formatMemberName } from '@/lib/memberName';
import { ARS_STATUSES, SALUTATIONS } from '@/lib/memberProfileOptions';

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

const MEMBERSHIP_STATUSES = [
  { value: 'active', label: 'Active' },
  { value: 'expired', label: 'Expired' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'pending', label: 'Pending' },
] as const;

const ROLES = [
  { value: 'member', label: 'Member' },
  { value: 'admin', label: 'Admin' },
] as const;

export default function MemberEditPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Partial<Member>>({});
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch(`/api/admin/members/${id}`)
      .then((r) => r.json())
      .then((d) => {
        setMember(d.member);
        setForm(d.member ?? {});
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      const res = await fetch(`/api/admin/members/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          salutation: form.salutation,
          first_name: form.first_name,
          last_name: form.last_name,
          arabic_name: form.arabic_name,
          email: form.email,
          phone: form.phone,
          organization: form.organization,
          designation: form.designation,
          ars_status: form.ars_status,
          member_id: form.member_id,
          membership_tier: form.membership_tier,
          membership_status: form.membership_status,
          expiry_date: form.expiry_date,
          member_since: form.member_since,
          role: form.role,
        }),
      });
      const d = await res.json();
      if (res.ok) {
        setMessage('Saved successfully.');
        setMember(d.member);
        setForm(d.member);
      } else {
        setMessage(d.error ?? 'Save failed.');
      }
    } finally {
      setSaving(false);
    }
  };

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

  return (
    <div className="w-full space-y-6 pb-12">
      <nav className="text-[13px] text-gray-400 font-medium font-helvetica">
        <Link href="/admin/members" className="hover:text-[#3FAE2A] transition-colors">Directory</Link>
        <span className="mx-2">›</span>
        <Link href={`/admin/members/${id}`} className="hover:text-[#3FAE2A] transition-colors">
          {formatMemberName(member)}
        </Link>
        <span className="mx-2">›</span>
        <span className="text-gray-700">Edit</span>
      </nav>

      {message && (
        <div className={`px-4 py-3 rounded-xl text-sm font-bold shadow-sm ${message.includes('success') ? 'bg-[#e8f5e3] text-[#27500A] border border-[#cdd8cd]' : 'bg-red-50 text-red-700 border border-red-200'} font-helvetica`}>
          {message}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] flex flex-col">
        <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50 rounded-t-2xl flex items-start justify-between gap-4">
          <div>
            <h3 className="text-[18px] font-bold text-gray-900 font-butler">
              Edit Member Record
            </h3>
            <p className="text-[13px] text-gray-500 mt-1 font-helvetica">
              Update {formatMemberDisplayName(member)}&apos;s profile and membership details.
            </p>
          </div>
          <Link
            href={`/admin/members/${id}`}
            className="text-[13px] font-bold text-[#3FAE2A] hover:underline whitespace-nowrap font-helvetica"
          >
            View profile card →
          </Link>
        </div>

        <div className="p-8 space-y-8 flex-1 font-helvetica">
          <Section title="Personal Details">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <SelectField
                label="Salutation"
                value={form.salutation ?? ''}
                onChange={(v) => setForm({ ...form, salutation: v })}
                options={SALUTATIONS.map((s) => ({ value: s.value, label: s.label }))}
              />
              <Field
                label="First Name"
                value={form.first_name ?? ''}
                onChange={(v) => setForm({ ...form, first_name: v })}
                placeholder="e.g. Ahmad"
              />
              <Field
                label="Last Name"
                value={form.last_name ?? ''}
                onChange={(v) => setForm({ ...form, last_name: v })}
                placeholder="e.g. Bin Ali"
              />
              <Field
                label="Arabic Name"
                value={form.arabic_name ?? ''}
                onChange={(v) => setForm({ ...form, arabic_name: v })}
                placeholder="أحمد بن علي"
              />
            </div>
          </Section>

          <Section title="Contact">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Field
                label="Email"
                value={form.email ?? ''}
                onChange={(v) => setForm({ ...form, email: v })}
                type="email"
                placeholder="ahmad@example.com"
              />
              <Field
                label="Phone"
                value={form.phone ?? ''}
                onChange={(v) => setForm({ ...form, phone: v })}
                placeholder="+65 8123 4567"
              />
            </div>
          </Section>

          <Section title="Professional">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Field
                label="Organization"
                value={form.organization ?? ''}
                onChange={(v) => setForm({ ...form, organization: v })}
                placeholder="Organization or institution"
              />
              <Field
                label="Designation"
                value={form.designation ?? ''}
                onChange={(v) => setForm({ ...form, designation: v })}
                placeholder="Role or title"
              />
              <SelectField
                label="ARS Status"
                value={form.ars_status ?? 'no'}
                onChange={(v) => setForm({ ...form, ars_status: v })}
                options={ARS_STATUSES.map((s) => ({ value: s.value, label: s.label }))}
              />
            </div>
          </Section>

          <Section title="Membership">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Field
                label="Member ID"
                value={form.member_id ?? ''}
                onChange={(v) => setForm({ ...form, member_id: v })}
                placeholder="e.g. PERGAS-2024-0001"
              />
              <SelectField
                label="Subscription Level"
                value={form.membership_tier ?? DEFAULT_TIER}
                onChange={(v) => setForm({ ...form, membership_tier: v })}
                options={MEMBERSHIP_TIERS.map((t) => ({ value: t.value, label: t.label }))}
              />
              <SelectField
                label="Membership Status"
                value={form.membership_status ?? 'active'}
                onChange={(v) => setForm({ ...form, membership_status: v })}
                options={MEMBERSHIP_STATUSES.map((s) => ({ value: s.value, label: s.label }))}
              />
              <Field
                label="Member Since"
                value={form.member_since ?? ''}
                onChange={(v) => setForm({ ...form, member_since: v })}
                type="date"
              />
              <Field
                label="Expiry Date"
                value={form.expiry_date ?? ''}
                onChange={(v) => setForm({ ...form, expiry_date: v })}
                type="date"
              />
            </div>
          </Section>

          <Section title="Account">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <SelectField
                label="Role"
                value={form.role ?? 'member'}
                onChange={(v) => setForm({ ...form, role: v })}
                options={ROLES.map((r) => ({ value: r.value, label: r.label }))}
              />
              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-bold text-gray-700">Account Created</label>
                <div className="h-11 px-4 rounded-xl border border-gray-100 bg-gray-50 text-[13px] font-medium text-gray-500 flex items-center">
                  {new Date(member.created_at).toLocaleDateString('en-SG', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </div>
              </div>
            </div>
          </Section>
        </div>

        <div className="px-8 py-5 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl flex items-center justify-between font-helvetica">
          <button
            onClick={() => router.push('/admin/members')}
            className="text-[13px] font-bold text-gray-500 hover:text-gray-900 transition-colors"
          >
            ← Back to Directory
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 bg-[#3FAE2A] hover:bg-[#35941f] shadow-md shadow-[#3FAE2A]/20 disabled:opacity-70 disabled:cursor-not-allowed text-white text-[13px] font-bold rounded-xl transition-all"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-[14px] font-bold text-gray-900 font-butler mb-4 pb-2 border-b border-gray-100">
        {title}
      </h4>
      {children}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-[13px] font-bold text-gray-700">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-11 px-4 rounded-xl border border-gray-200 bg-gray-50/50 text-[13px] font-medium text-gray-800 placeholder-gray-400 outline-none transition-all focus:bg-white focus:border-[#3FAE2A] focus:ring-4 focus:ring-[#3FAE2A]/10"
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-[13px] font-bold text-gray-700">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 px-4 rounded-xl border border-gray-200 bg-gray-50/50 text-[13px] font-medium text-gray-800 outline-none transition-all focus:bg-white focus:border-[#3FAE2A] focus:ring-4 focus:ring-[#3FAE2A]/10 cursor-pointer appearance-none"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}
