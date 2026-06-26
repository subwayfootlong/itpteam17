"use client";

import Image from 'next/image';
import { usePathname } from 'next/navigation';

const PAGE_TITLES: Record<string, string> = {
  '/admin/dashboard':         'Dashboard Overview',
  '/admin/members':           'Member Directory',
  '/admin/events':            'Event Management',
  '/admin/events/new':        'Create New Event',
  '/admin/announcements':     'Announcements',
  '/admin/announcements/new': 'New Announcement',
  '/admin/engagement':        'Benefit Management',
  '/admin/comment-moderation':'Community Moderation',
  '/admin/settings':          'Settings',
};

interface AdminTopbarProps {
  adminName: string;
  adminEmail: string;
}

export default function AdminTopbar({ adminName, adminEmail }: AdminTopbarProps) {
  const pathname = usePathname();

  const title =
    PAGE_TITLES[pathname] ??
    (pathname.includes('/edit') ? 'Edit Record' : 'Admin Portal');

  const initials = adminName
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <header
      className="flex items-center justify-between bg-white border-b px-4 flex-shrink-0"
      style={{
        borderColor: 'rgba(63,174,42,0.15)',
        height: 72,
        fontFamily: "'Helvetica Neue', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      {/*
       * ── Left: Primary Logo ────────────────────────────────────────────
       * White background: full-colour primary logo is correct here.
       * Brand says primary logo should be "placed on top" (header = top ✓).
       * Clear space minimum is applied via padding of the header itself.
       */}
      <div className="flex items-center gap-4">
        <div
          className="relative flex-shrink-0 overflow-hidden"
          style={{
            width: 'clamp(230px, 26vw, 250px)',
            height: 52,
          }}
        >
          <Image
            src="/primarylogo.png"
            alt="Pergas — Singapore Islamic Scholars & Religious Teachers Association"
            fill
            sizes="260px"
            className="object-contain object-left"
            priority
          />
        </div>

        {/* Brand rule thin divider */}
        <div
          className="hidden md:block h-6 w-px"
          style={{ background: 'rgba(63,174,42,0.25)' }}
          aria-hidden="true"
        />

        {/* Page context title — Helvetica Neue per brand spec */}
        <h1
          className="hidden md:block text-[15px] font-semibold"
          style={{ color: '#1a2e1a' }}
        >
          {title}
        </h1>
      </div>

      {/* ── Right: Utility strip ─────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        {/* Notification bell */}
        <button
          className="relative p-2 rounded-lg transition-colors hover:bg-green-50"
          aria-label="Notifications"
          title="Notifications"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            viewBox="0 0 24 24"
            style={{ color: '#585859' }}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
          </svg>
          {/* Unread dot — use Pergas crimson for alert */}
          <span
            className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
            style={{ background: 'var(--pergas-crimson, #C51A4A)' }}
            aria-label="3 unread notifications"
          />
        </button>

        {/* Divider */}
        <div className="h-6 w-px hidden sm:block" style={{ background: 'rgba(0,0,0,0.08)' }} aria-hidden="true" />

        {/* Admin profile chip */}
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white text-[11px] font-bold"
            style={{ background: 'var(--pergas-green, #3FAE2A)' }}
            aria-hidden="true"
          >
            {initials}
          </div>
          <div className="hidden sm:block">
            <div
              className="text-[13px] font-semibold leading-tight"
              style={{ color: '#1a2e1a' }}
            >
              {adminName}
            </div>
            <div
              className="text-[10px] leading-tight"
              style={{ color: '#939498' }}
            >
              {adminEmail}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
