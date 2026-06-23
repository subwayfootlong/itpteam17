"use client";

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ActionButton } from '@/components/admin/ui/Button';
import StatCard from '@/components/admin/ui/StatCard';
import { Badge } from '@/components/admin/ui/Badge';
import {
  TableWrapper,
  TableHead,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  useSortState,
} from '@/components/admin/ui/Table';
import { MEMBERSHIP_TIERS, TIER_COLORS, formatTierLabel } from '@/lib/membershipTiers';
import { formatMemberName, memberNameInitial } from '@/lib/memberName';

interface Member {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  member_id: string | null;
  membership_tier: string;
  membership_status: string;
  expiry_date: string | null;
  phone: string | null;
  created_at: string;
}

const STATUS_CONFIG: Record<string, { colorClass: string; dotColor: string; accent: string }> = {
  active:    { colorClass: 'bg-[#e8f5e3] text-[#27500A]', dotColor: 'bg-[#3FAE2A]', accent: '#3FAE2A' },
  expired:   { colorClass: 'bg-red-50 text-red-600',      dotColor: 'bg-[#C51A4A]', accent: '#C51A4A' },
  pending:   { colorClass: 'bg-[#fff4de] text-[#9a6800]', dotColor: 'bg-[#FFB547]', accent: '#FFB547' },
  suspended: { colorClass: 'bg-gray-100 text-gray-500',   dotColor: 'bg-gray-400',  accent: '#d1d5db' },
};

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const { sortState, handleSort, sortData } = useSortState('first_name', 'asc');

  useEffect(() => {
    let active = true;
    const fetchMembers = async () => {
      setLoading(true);
      try {
        const r = await fetch(`/api/admin/members`);
        const d = await r.json();
        if (active) setMembers(d.members ?? []);
      } catch (err) {
        console.error(err);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchMembers();
    return () => { active = false; };
  }, []);

  const handleExportCSV = () => {
    const headers = ['Name', 'Email', 'Member ID', 'Tier', 'Status', 'Expiry Date', 'Joined'];
    const rows = members.map((m) => [
      formatMemberName(m),
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

  const stats = {
    total:   members.length,
    active:  members.filter((m) => m.membership_status === 'active').length,
    expired: members.filter((m) => m.membership_status === 'expired').length,
  };

  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      const matchSearch =
        !search ||
        formatMemberName(m).toLowerCase().includes(search.toLowerCase()) ||
        (m.email || '').toLowerCase().includes(search.toLowerCase()) ||
        (m.member_id || '').toLowerCase().includes(search.toLowerCase());
      const matchTier = tierFilter === 'all' || m.membership_tier === tierFilter;
      const matchStatus = statusFilter === 'all' || m.membership_status === statusFilter;
      return matchSearch && matchTier && matchStatus;
    });
  }, [members, search, tierFilter, statusFilter]);

  const sortedMembers = useMemo(
    () =>
      sortData(filteredMembers, (m, key) => {
        if (key === 'first_name')        return formatMemberName(m);
        if (key === 'member_id')         return m.member_id ?? '';
        if (key === 'membership_tier')   return m.membership_tier;
        if (key === 'membership_status') return m.membership_status;
        if (key === 'expiry_date')       return m.expiry_date ?? '';
        return '';
      }),
    [filteredMembers, sortState] // eslint-disable-line
  );

  const renderRow = (m: Member) => {
    const cfg = STATUS_CONFIG[m.membership_status] ?? STATUS_CONFIG.suspended;
    const tierClass = TIER_COLORS[m.membership_tier] ?? 'bg-gray-100 text-gray-600';

    return (
      <TableRow key={m.id} accentColor={cfg.accent}>
        <TableCell>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#e8f5e3] flex items-center justify-center text-[#27500A] text-[10px] font-bold flex-shrink-0">
              {memberNameInitial(m)}
            </div>
            <div>
              <div className="font-bold text-gray-800">{formatMemberName(m, '—')}</div>
              <div className="text-gray-500 text-[11px] mt-0.5">{m.email}</div>
            </div>
          </div>
        </TableCell>
        <TableCell className="text-gray-600 font-mono text-[12px]">
          {m.member_id ?? '—'}
        </TableCell>
        <TableCell>
          <Badge colorClass={tierClass}>{formatTierLabel(m.membership_tier)}</Badge>
        </TableCell>
        <TableCell>
          <Badge colorClass={cfg.colorClass} dotColor={cfg.dotColor}>{m.membership_status}</Badge>
        </TableCell>
        <TableCell className="text-gray-600">
          {m.expiry_date
            ? new Date(m.expiry_date).toLocaleDateString('en-SG', { day: 'numeric', month: 'short', year: 'numeric' })
            : '—'}
        </TableCell>
      <TableCell>
        <div className="flex items-center justify-end">
          <Link
            href={`/admin/members/${m.id}`}
            className="w-8 h-8 rounded-md flex items-center justify-center text-gray-400 hover:text-[#3FAE2A] hover:bg-[#e8f5e3] transition-colors"
            title="View Profile"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
          </Link>
        </div>
      </TableCell>
      </TableRow>
    );
  };

  return (
    <div className="space-y-5 w-full pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[22px] font-bold font-butler" style={{ color: '#1a2e1a' }}>
            Member Directory
          </h2>
          <p className="text-[13px] mt-0.5 font-helvetica" style={{ color: '#939498' }}>
            Manage and verify all Asatizah member records
          </p>
        </div>
        <div className="flex gap-2">
          <ActionButton
            onClick={handleExportCSV}
            variant="outline"
            icon={
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
            }
          >
            Export CSV
          </ActionButton>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Members',  value: stats.total,   accent: '#1a2e1a', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg> },
          { label: 'Active Members', value: stats.active,  accent: '#3FAE2A', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
          { label: 'Expired',        value: stats.expired, accent: '#C51A4A', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
        ].map((s) => (
          <StatCard key={s.label} label={s.label} value={s.value} accent={s.accent} icon={s.icon} />
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm font-helvetica">
        <div className="flex flex-col sm:flex-row flex-wrap gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search by name, email, or member ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-9 pr-3 rounded-lg border border-gray-200 bg-gray-50/50 text-[13px] text-gray-800 placeholder-gray-400 outline-none transition-all focus:bg-white focus:border-[#3FAE2A] focus:ring-4 focus:ring-[#3FAE2A]/10"
            />
          </div>
          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className="h-10 px-3 min-w-[140px] rounded-lg border border-gray-200 bg-gray-50/50 text-[13px] text-gray-800 outline-none transition-all focus:bg-white focus:border-[#3FAE2A] focus:ring-4 focus:ring-[#3FAE2A]/10 cursor-pointer"
          >
            <option value="all">All Tiers</option>
            {MEMBERSHIP_TIERS.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 px-3 min-w-[140px] rounded-lg border border-gray-200 bg-gray-50/50 text-[13px] text-gray-800 outline-none transition-all focus:bg-white focus:border-[#3FAE2A] focus:ring-4 focus:ring-[#3FAE2A]/10 cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
            <option value="suspended">Suspended</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <TableWrapper
        data={sortedMembers}
        renderRow={renderRow}
        colCount={6}
        loading={loading}
        defaultPageSize={10}
        emptyState="No members found matching your criteria."
      >
        <TableHead>
          <TableHeader sortKey="first_name"        sortState={sortState} onSort={handleSort}>Member</TableHeader>
          <TableHeader sortKey="member_id"         sortState={sortState} onSort={handleSort}>Member ID</TableHeader>
          <TableHeader sortKey="membership_tier"   sortState={sortState} onSort={handleSort}>Tier</TableHeader>
          <TableHeader sortKey="membership_status" sortState={sortState} onSort={handleSort}>Status</TableHeader>
          <TableHeader sortKey="expiry_date"       sortState={sortState} onSort={handleSort}>Expiry</TableHeader>
          <TableHeader className="text-right">Actions</TableHeader>
        </TableHead>
      </TableWrapper>
    </div>
  );
}
