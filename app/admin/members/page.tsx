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
  TableRow,
  TableCell,
  useSortState,
} from '@/components/admin/ui/Table';
import { MEMBERSHIP_TIERS, TIER_COLORS, formatTierLabel } from '@/lib/membershipTiers';
import { formatMemberDisplayName, formatMemberName, memberNameInitial } from '@/lib/memberName';
import { ARS_STATUSES, formatArsStatusLabel } from '@/lib/memberProfileOptions';
import { getExpiryInfo } from '@/lib/dates';

interface Member {
  id: string;
  first_name: string | null;
  last_name: string | null;
  salutation: string | null;
  email: string;
  member_id: string | null;
  membership_tier: string;
  membership_status: string;
  expiry_date: string | null;
  phone: string | null;
  organization: string | null;
  designation: string | null;
  ars_status: string | null;
  member_since: string | null;
  created_at: string;
}

const STATUS_CONFIG: Record<string, { colorClass: string; dotColor: string; accent: string }> = {
  active:    { colorClass: 'bg-[#e8f5e3] text-[#27500A]', dotColor: 'bg-[#3FAE2A]', accent: '#3FAE2A' },
  expired:   { colorClass: 'bg-red-50 text-red-600',      dotColor: 'bg-[#C51A4A]', accent: '#C51A4A' },
  pending:   { colorClass: 'bg-[#fff4de] text-[#9a6800]', dotColor: 'bg-[#FFB547]', accent: '#FFB547' },
  suspended: { colorClass: 'bg-gray-100 text-gray-500',   dotColor: 'bg-gray-400',  accent: '#d1d5db' },
};

const ARS_COLORS: Record<string, string> = {
  no:      'bg-gray-100 text-gray-600',
  active:  'bg-[#e8f5e3] text-[#27500A]',
  pending: 'bg-[#fff4de] text-[#9a6800]',
  expired: 'bg-red-50 text-red-600',
};

const COL = {
  base: '!px-6 py-4 align-middle',
  group: '!px-6 py-4 align-middle border-l border-gray-100',
  head: '!px-6 py-3',
  headGroup: '!px-6 py-3 border-l border-gray-100',
} as const;

const EXPIRY_URGENCY_CLASS: Record<string, string> = {
  none:     'text-gray-400',
  warning:  'text-[#9a6800] font-semibold',
  critical: 'text-[#C51A4A] font-semibold',
  expired:  'text-[#C51A4A] font-semibold',
};

function formatMemberSinceDate(date: string | null): string {
  if (!date) return '—';
  return new Date(`${date}T00:00:00`).toLocaleDateString('en-SG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function isExpiringWithinDays(member: Member, days: number): boolean {
  if (!member.expiry_date) return false;
  const { daysLeft } = getExpiryInfo(member.expiry_date);
  return daysLeft !== null && daysLeft >= 0 && daysLeft <= days;
}

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [arsFilter, setArsFilter] = useState('all');
  const [expiryFilter, setExpiryFilter] = useState('all');

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
    const headers = [
      'Name', 'Email', 'Phone', 'Organization', 'Designation', 'Member ID',
      'Tier', 'Status', 'ARS Status', 'Expiry Date', 'Member Since', 'Joined',
    ];
    const rows = members.map((m) => [
      formatMemberDisplayName(m),
      m.email,
      m.phone ?? '',
      m.organization ?? '',
      m.designation ?? '',
      m.member_id ?? '',
      m.membership_tier,
      m.membership_status,
      m.ars_status ?? '',
      m.expiry_date ?? '',
      m.member_since ?? '',
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
    expiringSoon: members.filter((m) => isExpiringWithinDays(m, 30)).length,
  };

  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      const q = search.toLowerCase();
      const matchSearch =
        !search ||
        formatMemberDisplayName(m).toLowerCase().includes(q) ||
        formatMemberName(m).toLowerCase().includes(q) ||
        (m.email || '').toLowerCase().includes(q) ||
        (m.member_id || '').toLowerCase().includes(q) ||
        (m.organization || '').toLowerCase().includes(q) ||
        (m.designation || '').toLowerCase().includes(q) ||
        (m.phone || '').toLowerCase().includes(q);

      const matchTier = tierFilter === 'all' || m.membership_tier === tierFilter;
      const matchStatus = statusFilter === 'all' || m.membership_status === statusFilter;
      const matchArs = arsFilter === 'all' || (m.ars_status ?? 'no') === arsFilter;

      let matchExpiry = true;
      if (expiryFilter === 'expiring_30') matchExpiry = isExpiringWithinDays(m, 30);
      else if (expiryFilter === 'expiring_60') matchExpiry = isExpiringWithinDays(m, 60);
      else if (expiryFilter === 'expired') {
        const { daysLeft } = getExpiryInfo(m.expiry_date);
        matchExpiry = daysLeft !== null && daysLeft < 0;
      } else if (expiryFilter === 'no_id') matchExpiry = !m.member_id;

      return matchSearch && matchTier && matchStatus && matchArs && matchExpiry;
    });
  }, [members, search, tierFilter, statusFilter, arsFilter, expiryFilter]);

  const sortedMembers = useMemo(
    () =>
      sortData(filteredMembers, (m, key) => {
        if (key === 'first_name')        return formatMemberDisplayName(m);
        if (key === 'member_id')         return m.member_id ?? '';
        if (key === 'organization')      return m.organization ?? '';
        if (key === 'ars_status')        return m.ars_status ?? 'no';
        if (key === 'membership_tier')   return m.membership_tier;
        if (key === 'membership_status') return m.membership_status;
        if (key === 'expiry_date')       return m.expiry_date ?? '';
        if (key === 'member_since')      return m.member_since ?? '';
        if (key === 'phone')             return m.phone ?? '';
        if (key === 'email')             return m.email;
        return '';
      }),
    [filteredMembers, sortState] // eslint-disable-line
  );

  const renderRow = (m: Member) => {
    const cfg = STATUS_CONFIG[m.membership_status] ?? STATUS_CONFIG.suspended;
    const tierClass = TIER_COLORS[m.membership_tier] ?? 'bg-gray-100 text-gray-600';
    const expiry = getExpiryInfo(m.expiry_date);
    const arsValue = m.ars_status ?? 'no';
    const arsClass = ARS_COLORS[arsValue] ?? ARS_COLORS.no;

    const rowAccent =
      m.membership_status === 'active' && (expiry.urgency === 'warning' || expiry.urgency === 'critical')
        ? '#FFB547'
        : cfg.accent;

    return (
      <TableRow key={m.id} accentColor={rowAccent}>
        {/* Identity */}
        <TableCell className={`${COL.base} min-w-[180px]`}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#e8f5e3] flex items-center justify-center text-[#27500A] text-[10px] font-bold flex-shrink-0">
              {memberNameInitial(m)}
            </div>
            <div className="font-bold text-gray-800 whitespace-nowrap">
              {formatMemberDisplayName(m, '—')}
            </div>
          </div>
        </TableCell>
        <TableCell className={`${COL.base} min-w-[130px]`}>
          {m.member_id ? (
            <span className="text-gray-600 font-mono text-[12px] whitespace-nowrap">{m.member_id}</span>
          ) : (
            <span className="text-[#9a6800] text-[12px] font-semibold whitespace-nowrap">Not assigned</span>
          )}
        </TableCell>

        {/* Professional */}
        <TableCell className={`${COL.group} min-w-[160px]`}>
          <div className="min-w-0 max-w-[200px]">
            <div className="text-gray-800 font-medium truncate">{m.organization ?? '—'}</div>
            {m.designation && (
              <div className="text-gray-500 text-[11px] mt-0.5 truncate">{m.designation}</div>
            )}
          </div>
        </TableCell>
        <TableCell className={`${COL.base} min-w-[90px]`}>
          <Badge colorClass={arsClass}>{formatArsStatusLabel(arsValue)}</Badge>
        </TableCell>

        {/* Membership */}
        <TableCell className={`${COL.group} min-w-[90px]`}>
          <Badge colorClass={tierClass}>{formatTierLabel(m.membership_tier)}</Badge>
        </TableCell>
        <TableCell className={`${COL.base} min-w-[100px]`}>
          <Badge colorClass={cfg.colorClass} dotColor={cfg.dotColor}>{m.membership_status}</Badge>
        </TableCell>
        <TableCell className={`${COL.base} min-w-[120px] whitespace-nowrap`}>
          <div>
            <div className="text-gray-700">{expiry.formatted}</div>
            {expiry.relativeLabel && (
              <div className={`text-[11px] mt-0.5 ${EXPIRY_URGENCY_CLASS[expiry.urgency]}`}>
                {expiry.relativeLabel}
              </div>
            )}
          </div>
        </TableCell>
        <TableCell className={`${COL.base} min-w-[120px] whitespace-nowrap text-gray-700`}>
          {formatMemberSinceDate(m.member_since)}
        </TableCell>

        {/* Contact */}
        <TableCell className={`${COL.group} min-w-[120px] whitespace-nowrap`}>
          {m.phone ? (
            <a
              href={`tel:${m.phone.replace(/\s/g, '')}`}
              className="text-gray-700 hover:text-[#3FAE2A] transition-colors"
            >
              {m.phone}
            </a>
          ) : (
            <span className="text-gray-400">—</span>
          )}
        </TableCell>
        <TableCell className={`${COL.base} min-w-[180px]`}>
          <a
            href={`mailto:${m.email}`}
            className="text-gray-600 hover:text-[#3FAE2A] transition-colors truncate block max-w-[220px]"
            title={m.email}
          >
            {m.email}
          </a>
        </TableCell>

        <TableCell className={`${COL.base} min-w-[80px]`}>
          <div className="flex items-center justify-end gap-1">
            <Link
              href={`/admin/members/${m.id}`}
              className="w-8 h-8 rounded-md flex items-center justify-center text-gray-400 hover:text-[#3FAE2A] hover:bg-[#e8f5e3] transition-colors"
              title="View profile"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
            </Link>
            <Link
              href={`/admin/members/${m.id}/edit`}
              className="w-8 h-8 rounded-md flex items-center justify-center text-gray-400 hover:text-[#3FAE2A] hover:bg-[#e8f5e3] transition-colors"
              title="Edit record"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Members',  value: stats.total,        accent: '#1a2e1a', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg> },
          { label: 'Active Members', value: stats.active,       accent: '#3FAE2A', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
          { label: 'Expired',        value: stats.expired,      accent: '#C51A4A', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
          { label: 'Expiring Soon',  value: stats.expiringSoon, accent: '#FFB547', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
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
              placeholder="Search name, email, org, phone, or ID..."
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
          <select
            value={arsFilter}
            onChange={(e) => setArsFilter(e.target.value)}
            className="h-10 px-3 min-w-[140px] rounded-lg border border-gray-200 bg-gray-50/50 text-[13px] text-gray-800 outline-none transition-all focus:bg-white focus:border-[#3FAE2A] focus:ring-4 focus:ring-[#3FAE2A]/10 cursor-pointer"
          >
            <option value="all">All ARS</option>
            {ARS_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <select
            value={expiryFilter}
            onChange={(e) => setExpiryFilter(e.target.value)}
            className="h-10 px-3 min-w-[160px] rounded-lg border border-gray-200 bg-gray-50/50 text-[13px] text-gray-800 outline-none transition-all focus:bg-white focus:border-[#3FAE2A] focus:ring-4 focus:ring-[#3FAE2A]/10 cursor-pointer"
          >
            <option value="all">All Expiry</option>
            <option value="expiring_30">Expiring in 30 days</option>
            <option value="expiring_60">Expiring in 60 days</option>
            <option value="expired">Past expiry date</option>
            <option value="no_id">Missing member ID</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <TableWrapper
        data={sortedMembers}
        renderRow={renderRow}
        colCount={11}
        loading={loading}
        defaultPageSize={10}
        emptyState="No members found matching your criteria."
      >
        <TableHead>
          <TableHeader sortKey="first_name"        sortState={sortState} onSort={handleSort} className={COL.head}>Name</TableHeader>
          <TableHeader sortKey="member_id"         sortState={sortState} onSort={handleSort} className={COL.head}>Member ID</TableHeader>
          <TableHeader sortKey="organization"      sortState={sortState} onSort={handleSort} className={COL.headGroup}>Affiliation</TableHeader>
          <TableHeader sortKey="ars_status"        sortState={sortState} onSort={handleSort} className={COL.head}>ARS</TableHeader>
          <TableHeader sortKey="membership_tier"   sortState={sortState} onSort={handleSort} className={COL.headGroup}>Tier</TableHeader>
          <TableHeader sortKey="membership_status" sortState={sortState} onSort={handleSort} className={COL.head}>Status</TableHeader>
          <TableHeader sortKey="expiry_date"       sortState={sortState} onSort={handleSort} className={COL.head}>Expiry</TableHeader>
          <TableHeader sortKey="member_since"      sortState={sortState} onSort={handleSort} className={COL.head}>Member Since</TableHeader>
          <TableHeader sortKey="phone"             sortState={sortState} onSort={handleSort} className={COL.headGroup}>Contact</TableHeader>
          <TableHeader sortKey="email"             sortState={sortState} onSort={handleSort} className={COL.head}>Email</TableHeader>
          <TableHeader className={`${COL.head} text-right`}>Actions</TableHeader>
        </TableHead>
      </TableWrapper>
    </div>
  );
}
