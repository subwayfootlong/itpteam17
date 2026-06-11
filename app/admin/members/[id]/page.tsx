"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface Member {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  arabic_name: string | null;
  member_id: string | null;
  membership_tier: string;
  membership_status: string;
  expiry_date: string | null;
  member_since: string | null;
  role: string;
  created_at: string;
}

export default function MemberDetailPage() {
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
          full_name: form.full_name,
          phone: form.phone,
          arabic_name: form.arabic_name,
          member_id: form.member_id,
          membership_tier: form.membership_tier,
          membership_status: form.membership_status,
          expiry_date: form.expiry_date,
        }),
      });
      if (res.ok) {
        setMessage('Saved successfully.');
        const d = await res.json();
        setMember(d.member);
      } else {
        const d = await res.json();
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
      <div className="text-center py-20 text-gray-400">
        Member not found.{' '}
        <Link href="/admin/members" className="text-[#3FAE2A] hover:underline">
          Back to directory
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-400">
        <Link href="/admin/members" className="hover:text-[#3FAE2A]">Directory</Link>
        <span className="mx-2">›</span>
        <span className="text-gray-700">{member.full_name ?? member.email}</span>
      </nav>

      {message && (
        <div className={`px-4 py-3 rounded-lg text-sm ${message.includes('success') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Membership card preview */}
        <div className="space-y-4">
          {/* Digital card */}
          <div className="bg-[#1c3829] rounded-xl p-5 text-white">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-[#7dbf6a]">PERGAS</div>
                <div className="text-xs text-white/70">Official Member Card</div>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${member.membership_status === 'active' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                {member.membership_status?.toUpperCase()}
              </span>
            </div>
            <div className="bg-white rounded-lg p-3 flex items-center justify-center mb-3">
              {/* QR placeholder */}
              <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center text-gray-400 text-xs text-center">
                QR Code
              </div>
            </div>
            <div className="text-xs space-y-1">
              <div className="text-white/60">Member Name</div>
              <div className="font-semibold">{member.full_name ?? '—'}</div>
              {member.arabic_name && <div className="text-white/70 text-right">{member.arabic_name}</div>}
              <div className="text-white/60 mt-2">Member ID</div>
              <div className="font-mono text-xs">{member.member_id ?? 'Not assigned'}</div>
              <div className="text-white/60 mt-2">Valid Until</div>
              <div>{member.expiry_date ? new Date(member.expiry_date).toLocaleDateString('en-SG') : '—'}</div>
            </div>
          </div>

          {/* Quick stats */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Email</span>
              <span className="text-gray-800 font-medium truncate ml-2">{member.email}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Phone</span>
              <span className="text-gray-800">{member.phone ?? '—'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Member since</span>
              <span className="text-gray-800">
                {member.member_since ? new Date(member.member_since).toLocaleDateString('en-SG') : '—'}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Role</span>
              <span className="capitalize text-gray-800">{member.role}</span>
            </div>
          </div>
        </div>

        {/* Right: Editable fields */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800">Edit Member Record</h3>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field
                label="Full Name"
                value={form.full_name ?? ''}
                onChange={(v) => setForm({ ...form, full_name: v })}
              />
              <Field
                label="Arabic Name"
                value={form.arabic_name ?? ''}
                onChange={(v) => setForm({ ...form, arabic_name: v })}
              />
              <Field
                label="Email"
                value={form.email ?? ''}
                onChange={(v) => setForm({ ...form, email: v })}
                type="email"
              />
              <Field
                label="Phone"
                value={form.phone ?? ''}
                onChange={(v) => setForm({ ...form, phone: v })}
              />
              <Field
                label="Member ID"
                value={form.member_id ?? ''}
                onChange={(v) => setForm({ ...form, member_id: v })}
                placeholder="e.g. PERGAS-2024-0001"
              />
              <Field
                label="Expiry Date"
                value={form.expiry_date ?? ''}
                onChange={(v) => setForm({ ...form, expiry_date: v })}
                type="date"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Membership Tier</label>
                <select
                  value={form.membership_tier ?? 'ordinary'}
                  onChange={(e) => setForm({ ...form, membership_tier: e.target.value })}
                  className="h-9 px-3 rounded-lg border border-gray-300 text-sm outline-none focus:border-[#3FAE2A] bg-white"
                >
                  <option value="ordinary">Ordinary</option>
                  <option value="associate">Associate</option>
                  <option value="fellow">Fellow</option>
                  <option value="professional">Professional</option>
                  <option value="student">Student</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</label>
                <select
                  value={form.membership_status ?? 'active'}
                  onChange={(e) => setForm({ ...form, membership_status: e.target.value })}
                  className="h-9 px-3 rounded-lg border border-gray-300 text-sm outline-none focus:border-[#3FAE2A] bg-white"
                >
                  <option value="active">Active</option>
                  <option value="expired">Expired</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <button
                onClick={() => router.push('/admin/members')}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                ← Back to directory
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-2 bg-[#3FAE2A] hover:bg-[#35941f] disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>
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
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-9 px-3 rounded-lg border border-gray-300 text-sm outline-none focus:border-[#3FAE2A] bg-white"
      />
    </div>
  );
}
