"use client";

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const NAV_ITEMS = [
  {
    label: 'Dashboard',
    href: '/admin/dashboard',
    icon: (
      <svg className="w-[18px] h-[18px] flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
      </svg>
    ),
  },
  {
    label: 'Members',
    href: '/admin/members',
    icon: (
      <svg className="w-[18px] h-[18px] flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
      </svg>
    ),
  },
  {
    label: 'Events',
    href: '/admin/events',
    icon: (
      <svg className="w-[18px] h-[18px] flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
      </svg>
    ),
  },
  {
    label: 'Announcements',
    href: '/admin/announcements',
    icon: (
      <svg className="w-[18px] h-[18px] flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 01-1.44-4.282m3.102.069a18.03 18.03 0 01-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 018.835 2.535M10.34 6.66a23.847 23.847 0 008.835-2.535m0 0A23.74 23.74 0 0018.795 3m.38 1.125a23.91 23.91 0 011.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 001.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.347 24.347 0 010 3.46" />
      </svg>
    ),
  },
  {
    label: 'Benefits',
    href: '/admin/engagement',
    icon: (
      <svg className="w-[18px] h-[18px] flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25A1.5 1.5 0 0119.5 21h-15A1.5 1.5 0 013 19.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V21m0-16.125A2.625 2.625 0 1114.625 7.5H12m0 0h8.25M3.75 7.5H12" />
      </svg>
    ),
  },
  {
    label: 'Comment Moderation',
    href: '/admin/comment-moderation',
    icon: (
      <svg className="w-[18px] h-[18px] flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3h5.25M21 12a8.25 8.25 0 01-8.25 8.25H7.5L3 21l.75-4.5A8.25 8.25 0 1121 12z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 14.25 1.5 1.5 3-3" />
      </svg>
    ),
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
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all',
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
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* ── Bottom section ────────────────────────────────────────────── */}
      <div className="border-t border-white/10 px-2 py-2">
        <Link
          href="/admin/settings"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] transition-all hover:bg-white/8"
          style={{ color: 'var(--sidebar-text)', fontFamily: 'var(--font-helvetica)' }}
        >
          <svg className="w-[18px] h-[18px] flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
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
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
}
