"use client";

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  CalendarDays,
  ChartColumn,
  CircleArrowUp,
  Gift,
  LayoutDashboard,
  LogOut,
  Megaphone,
  MessageSquareText,
  QrCode,
  Settings,
  ShieldCheck,
  UserPlus,
  Users,
  type LucideIcon,
} from 'lucide-react';

const NAV_GROUPS: { heading: string; items: { label: string; href: string; icon: LucideIcon }[] }[] = [
  {
    heading: 'Overview',
    items: [{ label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard }],
  },
  {
    heading: 'Members',
    items: [
      { label: 'Members', href: '/admin/members', icon: Users },
      { label: 'Tier Requests', href: '/admin/tier-requests', icon: CircleArrowUp },
      { label: 'Batch Onboarding', href: '/admin/batch-onboarding', icon: UserPlus },
    ],
  },
  {
    heading: 'Engagement',
    items: [
      { label: 'Events', href: '/admin/events', icon: CalendarDays },
      { label: 'Announcements', href: '/admin/announcements', icon: Megaphone },
      { label: 'Benefits', href: '/admin/engagement', icon: Gift },
      { label: 'Community Moderation', href: '/admin/comment-moderation', icon: MessageSquareText },
    ],
  },
  {
    heading: 'Operations',
    items: [
      { label: 'Admin Team', href: '/admin/team', icon: ShieldCheck },
      { label: 'Payment Methods', href: '/admin/payment-methods', icon: QrCode },
    ],
  },
  {
    heading: 'Insights',
    items: [{ label: 'Analytics', href: '/admin/analytics', icon: ChartColumn }],
  },
];

interface AdminSidebarProps {
  adminName: string;
}

export default function AdminSidebar({ adminName }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/?screen=login');
    router.refresh();
  };

  const initials = adminName
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <aside
      className="w-[220px] flex-shrink-0 flex flex-col h-full"
      style={{ backgroundColor: 'var(--sidebar-bg)' }}
    >
      {/* ── Brand header ──────────────────────────────────────────────── */}
      {/*
       * Brand rule: secondary logo (compact crest) on dark background.
       * White version via CSS filter. Clear space: "upright P for width, lying P for height".
       * Minimum secondary logo size: 15mm → ~57px at 96dpi. We use 52px to stay safe.
       * DO NOT place on pure Pantone 361C green — this sidebar is dark green, compliant.
       */}
      <div className="px-4 pt-5 pb-4 ">
        <div className="flex items-center gap-3 rounded-2xl border border-[#cdd8cd] bg-[#f6f8f6] px-3 py-2 shadow-[0_1px_0_rgba(0,0,0,0.03)]">
          {/* Secondary logo — set on a soft light surface so the mark reads clearly */}
          <div className="relative flex-shrink-0 overflow-hidden" style={{ width: 44, height: 52 }}>
            <Image
              src="/pergas-logo.png"
              alt="Pergas crest"
              fill
              sizes="44px"
              className="object-contain "
              priority
            />
          </div>
          {/* Portal title using Helvetica Neue (brand spec for headers/UI) */}
          <div style={{ fontFamily: 'var(--font-helvetica)' }}>
            <div className="font-bold text-[14px] leading-tight tracking-tight" style={{ color: '#1c3829' }}>
              Pergas Portal
            </div>
            <div className="text-[11px] mt-0.5" style={{ color: '#607260' }}>
              Community Admin
            </div>
          </div>
        </div>
      </div>

      {/* ── Navigation ────────────────────────────────────────────────── */}
      <nav className="flex-1 px-2 py-3 space-y-4 overflow-y-auto" aria-label="Admin navigation">
        {NAV_GROUPS.map((group) => (
          <div key={group.heading}>
            <div
              className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.08em]"
              style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-helvetica)' }}
            >
              {group.heading}
            </div>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={isActive ? 'page' : undefined}
                    className={[
                      'flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all',
                      isActive
                        ? 'text-white'
                        : 'hover:bg-white/8 hover:text-white',
                    ].join(' ')}
                    style={{
                      color: isActive ? '#fff' : 'var(--sidebar-text)',
                      background: isActive ? 'rgba(63,174,42,0.22)' : undefined,
                      borderLeft: isActive ? '3px solid #3FAE2A' : '3px solid transparent',
                      fontFamily: 'var(--font-helvetica)',
                    }}
                  >
                    <Icon className="w-[18px] h-[18px] flex-shrink-0" strokeWidth={1.8} aria-hidden="true" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* ── Bottom section ────────────────────────────────────────────── */}
      <div className="border-t border-white/10 px-2 py-2">
        <Link
          href="/admin/settings"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] transition-all hover:bg-white/8"
          style={{ color: 'var(--sidebar-text)', fontFamily: 'var(--font-helvetica)' }}
        >
          <Settings className="w-[18px] h-[18px] flex-shrink-0" strokeWidth={1.8} aria-hidden="true" />
          Settings
        </Link>

        {/* Thin divider line (brand design element) */}
        <div className="my-1.5 border-t border-white/10" />

        {/* Admin user row */}
        <div className="flex items-center gap-2.5 px-3 py-2">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-[11px] font-bold"
            style={{
              background: 'var(--sidebar-avatar-bg)',
              color: 'var(--sidebar-avatar-text)',
            }}
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white text-[12px] font-semibold truncate" style={{ fontFamily: 'var(--font-helvetica)' }}>
              {adminName}
            </div>
            <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-helvetica)' }}>
              Administrator
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Sign out"
            className="flex-shrink-0 transition-colors hover:text-white"
            style={{ color: 'rgba(255,255,255,0.45)' }}
            aria-label="Sign out"
          >
            <LogOut className="w-4 h-4" strokeWidth={2} aria-hidden="true" />
          </button>
        </div>
      </div>
    </aside>
  );
}
