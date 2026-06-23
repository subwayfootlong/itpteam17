"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { DEFAULT_TIER, MEMBERSHIP_TIERS } from '@/lib/membershipTiers';
import { formatMemberName } from '@/lib/memberName';

interface Member {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  phone: string | null;
  organization: string | null;
  designation: string | null;
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
          first_name: form.first_name,
          last_name: form.last_name,
          phone: form.phone,
          organization: form.organization,
          designation: form.designation,
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
      <div className="text-center py-20 text-gray-400 font-helvetica" >
        Member not found.{' '}
        <Link href="/admin/members" className="text-[#3FAE2A] hover:underline font-bold">
          Back to directory
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 pb-12">
      {/* Breadcrumb */}
      <nav className="text-[13px] text-gray-400 font-medium font-helvetica" >
        <Link href="/admin/members" className="hover:text-[#3FAE2A] transition-colors">Directory</Link>
        <span className="mx-2">›</span>
        <span className="text-gray-700">{formatMemberName(member)}</span>
      </nav>

      {message && (
        <div className={`px-4 py-3 rounded-xl text-sm font-bold shadow-sm ${message.includes('success') ? 'bg-[#e8f5e3] text-[#27500A] border border-[#cdd8cd]' : 'bg-red-50 text-red-700 border border-red-200'} font-helvetica`} >
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Membership card preview & quick stats */}
        <div className="space-y-6">
          {/* Digital card */}
          <div className="bg-[#1c3829] rounded-2xl p-6 text-white shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] relative overflow-hidden font-helvetica" >
            {/* Subtle decorative background element */}
            <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white opacity-5 rounded-full blur-2xl"></div>
            
            <div className="flex items-center justify-between mb-6 relative z-10">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-widest text-[#98b898]">PERGAS</div>
                <div className="text-[13px] text-white/80 font-medium">Official Member Card</div>
              </div>
              <span className={`text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-wide ${member.membership_status === 'active' ? 'bg-[#3FAE2A] text-white shadow-sm' : 'bg-[#C51A4A] text-white shadow-sm'}`}>
                {member.membership_status}
              </span>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 flex items-center justify-center mb-6 relative z-10 border border-white/10">
              {/* QR placeholder */}
              <div className="w-20 h-20 bg-white rounded-lg flex items-center justify-center">
                 <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"></path></svg>
              </div>
            </div>

            <div className="space-y-3 relative z-10">
              <div>
                <div className="text-[11px] text-white/60 font-semibold uppercase tracking-wider mb-0.5">Member Name</div>
                <div className="text-[16px] font-bold">{formatMemberName(member, '—')}</div>
                {member.arabic_name && <div className="text-white/80 text-[14px] mt-1">{member.arabic_name}</div>}
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <div className="text-[11px] text-white/60 font-semibold uppercase tracking-wider mb-0.5">Member ID</div>
                  <div className="font-mono text-[13px] font-bold text-[#98b898]">{member.member_id ?? 'Not assigned'}</div>
                </div>
                <div>
                  <div className="text-[11px] text-white/60 font-semibold uppercase tracking-wider mb-0.5">Valid Until</div>
                  <div className="text-[13px] font-bold">{member.expiry_date ? new Date(member.expiry_date).toLocaleDateString('en-SG', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick stats */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] p-6 space-y-4 font-helvetica" >
            <h3 className="font-bold text-gray-900 text-[15px] mb-2 font-butler" >Account Overview</h3>
            
            <div className="flex flex-col gap-1 pb-3 border-b border-gray-100">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Email</span>
              <span className="text-[13px] text-gray-800 font-medium truncate">{member.email}</span>
            </div>
            
            <div className="flex flex-col gap-1 pb-3 border-b border-gray-100">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Phone</span>
              <span className="text-[13px] text-gray-800 font-medium">{member.phone ?? '—'}</span>
            </div>

            <div className="flex flex-col gap-1 pb-3 border-b border-gray-100">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Organization</span>
              <span className="text-[13px] text-gray-800 font-medium">{member.organization ?? '—'}</span>
            </div>

            <div className="flex flex-col gap-1 pb-3 border-b border-gray-100">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Designation</span>
              <span className="text-[13px] text-gray-800 font-medium">{member.designation ?? '—'}</span>
            </div>
            
            <div className="flex flex-col gap-1 pb-3 border-b border-gray-100">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Member Since</span>
              <span className="text-[13px] text-gray-800 font-medium">
                {member.member_since ? new Date(member.member_since).toLocaleDateString('en-SG', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
              </span>
            </div>
            
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Role</span>
              <span className="text-[13px] text-[#3FAE2A] font-bold capitalize bg-[#e8f5e3] w-max px-2.5 py-1 rounded">{member.role}</span>
            </div>
          </div>
        </div>

        {/* Right: Editable fields */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] flex flex-col">
          <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50 rounded-t-2xl">
            <h3 className="text-[18px] font-bold text-gray-900 font-butler" >
              Edit Member Record
            </h3>
            <p className="text-[13px] text-gray-500 mt-1 font-helvetica" >
              Update personal details and manage membership status.
            </p>
          </div>
          
          <div className="p-8 space-y-6 flex-1 font-helvetica" >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-gray-100">
              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-bold text-gray-700">Subscription Level</label>
                <select
                  value={form.membership_tier ?? DEFAULT_TIER}
                  onChange={(e) => setForm({ ...form, membership_tier: e.target.value })}
                  className="h-11 px-4 rounded-xl border border-gray-200 bg-gray-50/50 text-[13px] font-medium text-gray-800 outline-none transition-all focus:bg-white focus:border-[#3FAE2A] focus:ring-4 focus:ring-[#3FAE2A]/10 cursor-pointer appearance-none"
                >
                  {MEMBERSHIP_TIERS.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-bold text-gray-700">Status</label>
                <select
                  value={form.membership_status ?? 'active'}
                  onChange={(e) => setForm({ ...form, membership_status: e.target.value })}
                  className="h-11 px-4 rounded-xl border border-gray-200 bg-gray-50/50 text-[13px] font-medium text-gray-800 outline-none transition-all focus:bg-white focus:border-[#3FAE2A] focus:ring-4 focus:ring-[#3FAE2A]/10 cursor-pointer appearance-none"
                >
                  <option value="active">Active</option>
                  <option value="expired">Expired</option>
                  <option value="suspended">Suspended</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
            </div>
          </div>
          
          <div className="px-8 py-5 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl flex items-center justify-between font-helvetica" >
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
