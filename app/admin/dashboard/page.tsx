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
}

interface Activity {
  id: string;
  message: string;
  timestamp: string;
  type: 'member' | 'event' | 'announcement' | 'system';
}

const QUICK_ACTIONS = [
  { label: 'Add New Member', href: '/admin/members?action=new', icon: '👤' },
  { label: 'Create Event', href: '/admin/events/new', icon: '📅' },
  { label: 'Post Announcement', href: '/admin/announcements/new', icon: '📢' },
  { label: 'Add Benefit', href: '/admin/benefits/new', icon: '🎁' },
];

function StatCard({
  label,
  value,
  sub,
  color = 'green',
}: {
  label: string;
  value: number | string;
  sub?: string;
  color?: 'green' | 'blue' | 'yellow' | 'red';
}) {
  const colorMap = {
    green: 'text-[#3FAE2A]',
    blue: 'text-blue-600',
    yellow: 'text-amber-500',
    red: 'text-red-500',
  };
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-2">{label}</div>
      <div className={`text-3xl font-bold ${colorMap[color]}`}>{value}</div>
      {sub && <div className="text-gray-400 text-xs mt-1">{sub}</div>}
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/stats')
      .then((r) => r.json())
      .then((data) => {
        setStats(data.stats);
        setRecentActivity(data.recentActivity ?? []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Dashboard Overview</h2>
        <p className="text-gray-500 text-sm mt-0.5">
          Here is what is happening in the organisation today.
        </p>
      </div>

      {/* Stats grid */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse h-24" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Members" value={stats?.totalMembers ?? 0} sub="All tiers" />
          <StatCard
            label="Active Members"
            value={stats?.activeMembers ?? 0}
            sub={`${stats?.expiredMembers ?? 0} expired`}
          />
          <StatCard label="Upcoming Events" value={stats?.upcomingEvents ?? 0} color="blue" />
          <StatCard
            label="Live Announcements"
            value={stats?.publishedAnnouncements ?? 0}
            color="yellow"
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800">Recent Activity</h3>
            <Link href="/admin/members" className="text-[#3FAE2A] text-sm hover:underline">
              View all
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {loading ? (
              [...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-5 py-3 animate-pulse">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex-shrink-0" />
                  <div className="flex-1 space-y-1">
                    <div className="h-3 bg-gray-100 rounded w-3/4" />
                    <div className="h-2 bg-gray-100 rounded w-1/2" />
                  </div>
                </div>
              ))
            ) : recentActivity.length === 0 ? (
              <div className="px-5 py-8 text-center text-gray-400 text-sm">No recent activity</div>
            ) : (
              recentActivity.map((a) => (
                <div key={a.id} className="flex items-start gap-3 px-5 py-3">
                  <div className="w-8 h-8 rounded-lg bg-[#e8f5e3] flex items-center justify-center flex-shrink-0 text-sm">
                    {a.type === 'member' ? '👤' : a.type === 'event' ? '📅' : a.type === 'announcement' ? '📢' : '⚙️'}
                  </div>
                  <div>
                    <p className="text-sm text-gray-700">{a.message}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{a.timestamp}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800">Quick Actions</h3>
          </div>
          <div className="p-4 space-y-2">
            {QUICK_ACTIONS.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-lg border border-gray-200 hover:border-[#3FAE2A] hover:bg-[#f0faf0] text-sm font-medium text-gray-700 hover:text-[#3FAE2A] transition-all"
              >
                <span>{action.icon}</span>
                {action.label}
              </Link>
            ))}
          </div>

          {/* System note */}
          <div className="mx-4 mb-4 px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">System</div>
            <p className="text-xs text-gray-600">Pergas Portal v1.0 — Development Build</p>
          </div>
        </div>
      </div>
    </div>
  );
}
