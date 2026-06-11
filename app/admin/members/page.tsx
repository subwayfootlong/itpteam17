"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Member {
  id: string;
  full_name: string;
  email: string;
  member_id: string | null;
  membership_tier: string;
  membership_status: string;
  expiry_date: string | null;
  phone: string | null;
  created_at: string;
}

const TIER_COLORS: Record<string, string> = {
  ordinary: 'bg-blue-100 text-blue-700',
  associate: 'bg-purple-100 text-purple-700',
  fellow: 'bg-green-100 text-green-700',
  professional: 'bg-amber-100 text-amber-700',
  student: 'bg-gray-100 text-gray-600',
};

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  expired: 'bg-red-100 text-red-600',
  suspended: 'bg-gray-100 text-gray-500',
};

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (tierFilter !== 'all') params.set('tier', tierFilter);
    if (statusFilter !== 'all') params.set('status', statusFilter);

    fetch(`/api/admin/members?${params}`)
      .then((r) => r.json())
      .then((d) => setMembers(d.members ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [search, tierFilter, statusFilter]);

  const handleExportCSV = () => {
    const headers = ['Name', 'Email', 'Member ID', 'Tier', 'Status', 'Expiry Date', 'Joined'];
    const rows = members.map((m) => [
      m.full_name,
      m.email,
      m.member_id ?? '',
      m.membership_tier,
      m.membership_status,
      m.expiry_date ?? '',
      new Date(m.created_at).toLocaleDateString('en-SG'),
    ]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pergas-members-${Date.now()}.csv`;
    a.click();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Member Directory</h2>
          <p className="text-gray-500 text-sm mt-0.5">Manage and verify all Asatizah member records</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-wrap gap-3">
          <input
            type="text"
            placeholder="Search by name, email, or member ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-[220px] h-9 px-3 rounded-lg border border-gray-300 text-sm outline-none focus:border-[#3FAE2A]"
          />
          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className="h-9 px-3 rounded-lg border border-gray-300 text-sm outline-none focus:border-[#3FAE2A] bg-white"
          >
            <option value="all">All Tiers</option>
            <option value="ordinary">Ordinary</option>
            <option value="associate">Associate</option>
            <option value="fellow">Fellow</option>
            <option value="professional">Professional</option>
            <option value="student">Student</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 px-3 rounded-lg border border-gray-300 text-sm outline-none focus:border-[#3FAE2A] bg-white"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-3 text-gray-500 font-medium text-xs uppercase tracking-wider">Member</th>
                <th className="text-left px-5 py-3 text-gray-500 font-medium text-xs uppercase tracking-wider">Member ID</th>
                <th className="text-left px-5 py-3 text-gray-500 font-medium text-xs uppercase tracking-wider">Tier</th>
                <th className="text-left px-5 py-3 text-gray-500 font-medium text-xs uppercase tracking-wider">Status</th>
                <th className="text-left px-5 py-3 text-gray-500 font-medium text-xs uppercase tracking-wider">Expiry</th>
                <th className="text-left px-5 py-3 text-gray-500 font-medium text-xs uppercase tracking-wider">Joined</th>
                <th className="text-right px-5 py-3 text-gray-500 font-medium text-xs uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(7)].map((_, j) => (
                      <td key={j} className="px-5 py-4">
                        <div className="h-3 bg-gray-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : members.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-gray-400">
                    No members found
                  </td>
                </tr>
              ) : (
                members.map((m) => (
                  <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#e8f5e3] flex items-center justify-center text-[#3FAE2A] text-xs font-bold flex-shrink-0">
                          {(m.full_name ?? m.email).charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-gray-800">{m.full_name ?? '—'}</div>
                          <div className="text-gray-400 text-xs">{m.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 font-mono text-xs">
                      {m.member_id ?? '—'}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium capitalize ${TIER_COLORS[m.membership_tier] ?? 'bg-gray-100 text-gray-600'}`}>
                        {m.membership_tier ?? 'ordinary'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium capitalize ${STATUS_COLORS[m.membership_status] ?? 'bg-gray-100 text-gray-600'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${m.membership_status === 'active' ? 'bg-green-500' : m.membership_status === 'expired' ? 'bg-red-500' : 'bg-gray-400'}`} />
                        {m.membership_status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 text-xs">
                      {m.expiry_date ? new Date(m.expiry_date).toLocaleDateString('en-SG') : '—'}
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 text-xs">
                      {new Date(m.created_at).toLocaleDateString('en-SG')}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link
                        href={`/admin/members/${m.id}`}
                        className="text-[#3FAE2A] hover:underline text-xs font-medium"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!loading && (
          <div className="px-5 py-3 border-t border-gray-100 text-xs text-gray-400">
            Showing {members.length} member{members.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  );
}
