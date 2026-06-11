"use client";

import { usePathname } from 'next/navigation';

const PAGE_TITLES: Record<string, string> = {
  '/admin/dashboard': 'Dashboard Overview',
  '/admin/members': 'Member Directory',
  '/admin/events': 'Event Management',
  '/admin/events/new': 'Create New Event',
  '/admin/announcements': 'Announcements',
  '/admin/announcements/new': 'New Announcement',
  '/admin/benefits': 'Member Benefits',
  '/admin/benefits/new': 'Add New Benefit',
  '/admin/settings': 'Settings',
};

interface AdminTopbarProps {
  adminName: string;
  adminEmail: string;
}

export default function AdminTopbar({ adminName, adminEmail }: AdminTopbarProps) {
  const pathname = usePathname();

  // Find the best matching title
  const title =
    PAGE_TITLES[pathname] ??
    (pathname.includes('/edit') ? 'Edit Record' : 'Admin Portal');

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0">
      <h1 className="text-gray-800 font-semibold text-base">{title}</h1>

      <div className="flex items-center gap-4">
        {/* Notification bell */}
        <button className="relative text-gray-500 hover:text-gray-700 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
          </svg>
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
            3
          </span>
        </button>

        {/* Admin profile chip */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#3FAE2A] flex items-center justify-center text-white text-xs font-bold">
            {adminName.charAt(0).toUpperCase()}
          </div>
          <div className="hidden md:block">
            <div className="text-gray-800 text-sm font-semibold leading-tight">{adminName}</div>
            <div className="text-gray-400 text-[10px]">{adminEmail}</div>
          </div>
        </div>
      </div>
    </header>
  );
}
