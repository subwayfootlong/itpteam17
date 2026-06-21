"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Stats {
  totalMembers: number;
  activeMembers: number;
  upcomingEvents: number;
  publishedAnnouncements: number;
  activePerks: number;
  expiredMembers: number;
  trends?: {
    totalMembers: string;
    activeMembers: string;
    upcomingEvents: string;
    publishedAnnouncements: string;
  };
  sparklines?: {
    totalMembers: string;
    activeMembers: string;
    upcomingEvents: string;
    publishedAnnouncements: string;
  };
  insight?: string;
}

interface Activity {
  id: string;
  message: string;
  timeAgo: string;
  author: string;
  type: 'member' | 'event' | 'announcement' | 'system';
}

// Brand colour per activity type
const ACTIVITY_STYLE: Record<string, { bg: string; color: string; icon: React.ReactNode }> = {
  member: {
    bg: '#e8f5e3',
    color: '#27500A',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  event: {
    bg: '#e3f6fb',
    color: '#1a7a8f',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  announcement: {
    bg: '#fff4de',
    color: '#9a6800',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
      </svg>
    ),
  },
  system: {
    bg: '#f0f0f0',
    color: '#585859',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
};

const QUICK_ACTIONS = [
  {
    label: 'Add New Member',
    href: '/admin/members',
    accent: '#3FAE2A',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
      </svg>
    ),
  },
  {
    label: 'Create Event',
    href: '/admin/events/new',
    accent: '#3BB0C9',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
      </svg>
    ),
  },
  {
    label: 'Post Announcement',
    href: '/admin/announcements/new',
    accent: '#FFB547',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
      </svg>
    ),
  },
  {
    label: 'View Engagement',
    href: '/admin/engagement',
    accent: '#1E9888',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
];

// Sparkline SVG paths — thin single-colour lines hinting at recent trend.
// The path is a simple polyline normalised to a 60×24 viewBox.
// Positive trend: generally upward; negative: downward; flat: gentle.
const SPARKLINES: Record<string, { path: string; color: string }> = {
  totalMembers:          { path: 'M0,20 L10,18 L20,15 L30,13 L40,10 L50,7 L60,4',    color: '#3FAE2A' },
  activeMembers:         { path: 'M0,18 L10,16 L20,14 L30,12 L40,11 L50,9 L60,6',    color: '#1E9888' },
  upcomingEvents:        { path: 'M0,16 L10,14 L20,16 L30,12 L40,10 L50,8 L60,5',    color: '#3BB0C9' },
  publishedAnnouncements:{ path: 'M0,20 L10,17 L20,15 L30,14 L40,13 L50,11 L60,8',   color: '#FFB547' },
};

// Stat card configs — icon, colours, change badge
const STAT_CONFIGS = [
  {
    key: 'totalMembers' as keyof Stats,
    label: 'Total Members',
    subKey: null as null,
    isPos: true,
    iconBg: 'bg-[#e8f5e3]',
    iconText: 'text-[#27500A]',
    accent: '#3FAE2A',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    key: 'activeMembers' as keyof Stats,
    label: 'Active Members',
    subKey: null as null,
    isPos: true,
    iconBg: 'bg-[#e0f4f1]',
    iconText: 'text-[#1E9888]',
    accent: '#1E9888',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    key: 'upcomingEvents' as keyof Stats,
    label: 'Upcoming Events',
    subKey: null,
    isPos: true,
    iconBg: 'bg-[#e3f6fb]',
    iconText: 'text-[#1a7a8f]',
    accent: '#3BB0C9',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    key: 'publishedAnnouncements' as keyof Stats,
    label: 'Live Announcements',
    subKey: null,
    isPos: true,
    iconBg: 'bg-[#fff4de]',
    iconText: 'text-[#9a6800]',
    accent: '#FFB547',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
      </svg>
    ),
  },
];

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  // Get today's date nicely formatted
  const today = new Date().toLocaleDateString('en-SG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  useEffect(() => {
    fetch('/api/admin/dashboard', { cache: 'no-store' })
      .then((r) => r.json())
      .then((data) => {
        setStats(data.stats);
        setRecentActivity(data.recentActivity ?? []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 w-full pb-12">

      {/* ── Hero Banner — flat dark green, no gradient interference ─────── */}
      <div
        className="rounded-2xl overflow-hidden relative shadow-[0_8px_32px_-8px_rgba(28,56,41,0.35)]"
        style={{ background: '#1c3829' }}
      >
        {/* Subtle geometric accent circles — decorative only */}
        <div
          className="absolute -right-16 -top-16 w-72 h-72 rounded-full pointer-events-none"
          style={{ background: 'rgba(63,174,42,0.07)', border: '1px solid rgba(255,255,255,0.06)' }}
        />
        <div
          className="absolute right-24 -bottom-12 w-40 h-40 rounded-full pointer-events-none"
          style={{ background: 'rgba(255,255,255,0.03)' }}
        />

        <div className="relative px-7 py-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            {/* Sub-label */}
            <div className="flex items-center gap-2 mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3FAE2A]" />
              <span className="text-white/60 text-[11px] font-semibold uppercase tracking-widest font-helvetica">
                Pergas Admin Portal
              </span>
            </div>
            <h2 className="text-white text-[26px] font-bold leading-tight font-butler tracking-tight">
              Dashboard Overview
            </h2>
            <p className="text-white/60 text-[13px] mt-1.5 font-medium font-helvetica">
              {today}
            </p>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Insight pill */}
            <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-white/8 border border-white/10">
              <svg className="w-4 h-4 text-[#3FAE2A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              <span className="text-white/80 text-[12px] font-bold font-helvetica">Active season</span>
            </div>
            {/* CTA — Pergas Amber on dark green: high contrast, guideline-approved */}
            <Link
              href="/admin/events/new"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-bold font-helvetica transition-all hover:brightness-110 shadow-md"
              style={{ background: '#FFB547', color: '#1c3829' }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Create Event
            </Link>
          </div>
        </div>
      </div>

      {/* ── Stat cards with sparklines ───────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading
          ? [...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 p-5 animate-pulse h-36" />
            ))
          : STAT_CONFIGS.map((cfg) => {
              const spark = SPARKLINES[cfg.key];
              return (
                <div key={cfg.key} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                  {/* Icon + Label row */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${cfg.iconBg} ${cfg.iconText}`}>
                        {cfg.icon}
                      </div>
                      <span className="text-[12px] font-semibold text-gray-500 leading-tight font-helvetica truncate">
                        {cfg.label}
                      </span>
                    </div>
                    <div className={`flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md font-helvetica flex-shrink-0 ${cfg.isPos ? 'bg-[#e8f5e3] text-[#3FAE2A]' : 'bg-red-50 text-red-600'}`}>
                      {cfg.isPos
                        ? <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                        : <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6" /></svg>
                      }
                      {stats?.trends?.[cfg.key as keyof typeof stats.trends] ?? '+0'}
                    </div>
                  </div>
                  {/* Value — Helvetica Neue */}
                  <div className="text-[32px] font-bold leading-none font-helvetica tracking-tight" style={{ color: cfg.accent }}>
                    {stats?.[cfg.key] ?? 0}
                  </div>
                  {/* Sub-stat */}
                  {cfg.subKey && stats && (
                    <div className="text-[11px] mt-1 text-gray-400 font-helvetica">
                      {stats[cfg.subKey]} expired
                    </div>
                  )}
                  {/* Sparkline — thin SVG, no axes */}
                  <div className="mt-3 -mx-1">
                    <svg
                      viewBox="0 0 60 24"
                      className="w-full h-8"
                      preserveAspectRatio="none"
                      aria-hidden="true"
                    >
                      <polyline
                        points={(stats?.sparklines?.[cfg.key as keyof typeof stats.sparklines] ?? spark.path).replace(/[ML]/g, '').trim().split(' L ').join(' ').replace('M', '')}
                        fill="none"
                        stroke={spark.color}
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        opacity="0.7"
                      />
                    </svg>
                  </div>
                </div>
              );
            })}
      </div>

      {/* ── Pending Approvals — full-width attention banner ──────────────── */}
      <div
        className="w-full rounded-xl border px-6 py-4 flex items-center justify-between gap-4"
        style={{ background: '#fff9ec', borderColor: '#FFB547' }}
      >
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-[#FFB547] text-white flex items-center justify-center flex-shrink-0 shadow-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="min-w-0 font-helvetica">
            <span className="text-[13px] font-bold text-[#9a6800] font-butler">Pending Approvals</span>
            <p className="text-[12px] text-[#b37e00] font-medium mt-0.5">
              You have <strong>3 registration requests</strong> awaiting review.
            </p>
          </div>
        </div>
        <Link
          href="/admin/members?status=pending"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#FFB547] text-[#1c3829] text-[12px] font-bold rounded-lg shadow-sm hover:brightness-105 transition-all flex-shrink-0 font-helvetica"
        >
          Review Now
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      {/* ── Main content grid: Recent Activity | Quick Actions ───────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

        {/* Recent Activity — fixed height, scrollable body to match quick actions */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col" style={{ height: '360px' }}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(63,174,42,0.1)] flex-shrink-0">
            <h3 className="font-bold text-[16px] font-butler text-[#1a2e1a]">
              Recent Activity
            </h3>
            <Link href="/admin/members" className="text-[12px] font-bold hover:underline font-helvetica text-[#3FAE2A]">
              View all
            </Link>
          </div>

          <div className="divide-y divide-gray-50 overflow-y-auto flex-1">
            {loading ? (
              [...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-5 py-3 animate-pulse">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-2.5 bg-gray-100 rounded w-3/4" />
                    <div className="h-2 bg-gray-100 rounded w-1/2" />
                  </div>
                </div>
              ))
            ) : recentActivity.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-3">
                  <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <p className="text-[13px] font-medium text-gray-400 font-helvetica">No recent activity yet</p>
              </div>
            ) : (
              recentActivity.map((a) => {
                const s = ACTIVITY_STYLE[a.type] ?? ACTIVITY_STYLE.system;
                return (
                  <div key={a.id} className="flex items-start gap-3 px-5 py-4 hover:bg-gray-50/60 transition-colors">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: s.bg, color: s.color }}
                    >
                      {s.icon}
                    </div>
                      <div className="font-helvetica min-w-0">
                        <p className="text-[13px] font-bold leading-tight text-[#1a2e1a] truncate">{a.message}</p>
                        <p className="text-[11px] mt-1 font-medium text-[#939498] flex items-center gap-1.5">
                          <span>{a.timeAgo}</span>
                          <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                          <span>{a.author}</span>
                        </p>
                      </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Quick Actions — fixed height to match Recent Activity */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col" style={{ height: '360px' }}>
          <div className="px-5 py-4 border-b border-[rgba(63,174,42,0.1)] flex-shrink-0">
            <h3 className="font-bold text-[16px] font-butler text-[#1a2e1a]">Quick Actions</h3>
          </div>
          <div className="p-3 space-y-1.5 flex-1 overflow-y-auto">
            {QUICK_ACTIONS.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="flex items-center gap-3 w-full px-3 py-3 rounded-lg border border-transparent transition-all group font-helvetica hover:border-gray-200 hover:bg-gray-50/60"
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = action.accent + '55';
                  (e.currentTarget as HTMLElement).style.background = action.accent + '08';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'transparent';
                  (e.currentTarget as HTMLElement).style.background = '';
                }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105"
                  style={{ background: action.accent + '18', color: action.accent }}
                >
                  {action.icon}
                </div>
                <span className="text-[13px] font-bold text-[#1a2e1a]">
                  {action.label}
                </span>
                <svg className="w-3.5 h-3.5 ml-auto text-gray-300 group-hover:text-gray-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ))}
          </div>
          {/* System note — pinned at bottom of quick actions card */}
          <div className="px-5 py-3 border-t border-gray-100 flex-shrink-0">
            <p className="text-[11px] font-medium font-helvetica text-[#939498]">
              Pergas Portal v1.0 — Development Build
            </p>
          </div>
        </div>
      </div>

      {/* ── Administrative Insight — full-width at bottom ────────────────── */}
      <div className="w-full bg-[#e8f5e3] border border-[#c3e6b3] rounded-xl px-6 py-5 shadow-sm flex items-center gap-5">
        <div className="w-10 h-10 rounded-lg bg-[#3FAE2A] text-white flex items-center justify-center flex-shrink-0 shadow-sm">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <div className="flex-1 font-helvetica min-w-0">
          <h4 className="text-[13px] font-bold text-[#1c3829] mb-0.5">Administrative Insight</h4>
          <p className="text-[12px] text-[#2c5230] leading-relaxed">
            {stats?.insight ?? 'Loading insights...'}
          </p>
        </div>
        <Link
          href="/admin/engagement"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] font-bold font-helvetica flex-shrink-0 transition-all hover:brightness-105 shadow-sm"
          style={{ background: '#3FAE2A', color: '#fff' }}
        >
          View Report
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </Link>
      </div>

    </div>
  );
}
